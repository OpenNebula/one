# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #
require 'sqlite3'

# Class for ec2 + azure drivers containing shared functions
class PublicCloudDriver

    def host_info
        client = OpenNebula::Client.new
        pool = OpenNebula::HostPool.new(client)
        pool.info

        objects=pool.select {|object| object.name==@host }

        host_id = objects.first.id
        xmlhost = OpenNebula::Host.new_with_id(host_id, client)
        xmlhost.info(true)
        xmlhost
    end

    # Count total cpu and memory based on instance type numbers in host tmpl.
    def get_host_capacity
        capacity = @xmlhost.to_hash['HOST']['TEMPLATE']['CAPACITY']

        if capacity.nil? || !capacity.is_a?(Hash)
            raise 'You must define CAPACITY section properly! '\
                  'Check the VM template'
        end

        total_memory = total_cpu = 0
        capacity.each do |name, value|
            name = parse_inst_type(name)
            cpu, mem = instance_type_capacity(name)
            total_memory += mem * value.to_i
            total_cpu    += cpu * value.to_i
        end

        [total_cpu, total_memory]
    end

    # Count cpu + mem of running instances
    def get_used_capacity
        vms = get_vms_data

        used_memory = used_cpu = 0
        vms.each do |vm|
            cpu, mem = instance_type_capacity(vm[:type])
            used_memory += mem
            used_cpu    += cpu
        end

        [used_cpu, used_memory]
    end

    def probe_host_monitor
        total_cpu, total_mem = get_host_capacity
        used_cpu, used_mem = get_used_capacity

        data = "HYPERVISOR=#{@hypervisor}\n"
        data << "PUBLIC_CLOUD=YES\n"
        data << "USEDCPU=#{used_cpu}\n"
        data << "USEDMEMORY=#{used_mem}\n"
        data << "FREECPU=#{total_cpu - used_cpu}\n"
        data << "FREEMEMORY=#{total_mem - used_mem}"

        data
    end

    def probe_host_system
        total_cpu, total_mem = get_host_capacity

        data = "HYPERVISOR=#{@hypervisor}\n"
        data << "PUBLIC_CLOUD=YES\n"
        data << "TOTALCPU=#{total_cpu}\n"
        data << "TOTALMEMORY=#{total_mem}\n"

        # include wild instances
        vms = get_vms_data
        vms.each do |vm|
            next unless vm[:id] == -1

            vm[:import_template] = vm_to_one(vm)
            vm[:vm_name] = vm[:name]
            vm.delete(:name)
            data << hash_to_template(vm, 'VM = [ ', " ]\n")
        end

        data
    end

    def probe_vm_monitor
        vms = fetch_vms_data(true)

        data = ''
        vms.each do |vm|
            data << hash_to_template(vm, 'VM = [ ', " ]\n")
        end
        data
    end

    # Either return VMs info from cache db or from public_cloud
    def get_vms_data
        time_limit = @public_cloud_conf['cache_validity'] || 120

        if Time.now.to_i - time_limit < @db.select_timestamp
            @db.select_vms
        else
            fetch_vms_data
        end
    end

    # Build template for importation
    def vm_to_one(vm)
        cpu, mem = instance_type_capacity(vm[:type])

        mem = mem.to_i / 1024 # Memory for templates expressed in MB
        cpu = cpu.to_f / 100  # CPU expressed in units

        str = "NAME   = \"Instance from #{vm[:name]}\"\n"\
              "CPU    = \"#{cpu}\"\n"\
              "vCPU   = \"#{cpu.ceil}\"\n"\
              "MEMORY = \"#{mem}\"\n"\
              "HYPERVISOR = \"#{@hypervisor}\"\n"\
              "PUBLIC_CLOUD = [\n"\
              "  TYPE  =\"azure\"\n"\
              "]\n"\
              "IMPORT_VM_ID    = \"#{vm[:uuid]}\"\n"\
              "SCHED_REQUIREMENTS=\"NAME=\\\"#{@host}\\\"\"\n"\
              "DESCRIPTION = \"Instance imported from #{@hypervisor}, from instance"\
              " #{vm[:name]}\"\n"

        Base64.encode64(str).gsub("\n", '')
    end

    # Hash to ONE template format
    def hash_to_template(h, pref = '', post = '')
        tmpl = h.to_a.map {|e| "#{e[0].to_s.upcase}=\"#{e[1]}\"" }.join(', ')
        pref + tmpl + post
    end
end

# Store instances info to simple local db
class InstanceCache

    def initialize(path)
        @db = SQLite3::Database.new(path)

        bootstrap
    end

    def execute_retry(query, tries=5, tsleep=0.5)
        i=0
        while i < tries
            begin
                return @db.execute(query)
            rescue SQLite3::BusyException
                i += 1
                sleep 0.5
            end
        end
    end

    def bootstrap
        sql = 'CREATE TABLE IF NOT EXISTS vms(uuid VARCHAR(128) PRIMARY KEY,'
        sql << ' id INTEGER, name VARCHAR(128), state VARCHAR(128),'
        sql << ' type VARCHAR(128))'
        execute_retry(sql)

        sql = 'CREATE TABLE IF NOT EXISTS timestamp(ts INTEGER PRIMARY KEY)'
        execute_retry(sql)
    end

    def insert(instances)
        execute_retry('DELETE from vms')
        instances.each do |i|
            sql = 'INSERT INTO vms VALUES ('
            sql << "\"#{i[:uuid]}\", "
            sql << "\"#{i[:id]}\", "
            sql << "\"#{i[:name]}\", "
            sql << "\"#{i[:state]}\", "
            sql << "\"#{i[:type]}\")"

            execute_retry(sql)
        end

        execute_retry('DELETE from timestamp')
        execute_retry("INSERT INTO timestamp VALUES (#{Time.now.to_i})")
    end

    def select_vms()
        vms = []
        execute_retry('SELECT * from vms').each do |vm|
            vms << Hash[[:uuid, :id, :name, :state, :type].zip(vm)]
        end

        vms
    end

    def select_timestamp
        ts = execute_retry('SELECT * from timestamp')
        return 0 if ts.empty?

        ts.first.first
    end

end
