# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

# ------------------------------------------------------------------------------
# Class for public drivers (AZ, EC2) It provides common interface to interact
# wiht the abstract host that representats a public cloud in OpenNebula
# ------------------------------------------------------------------------------
module PublicCloudDriver

    #---------------------------------------------------------------------------
    #  MODULE Main Interface
    # --------------------------------------------------------------------------

    #  Returns host monitoring data
    #
    #  @return [String]
    def probe_host_monitor(db, limit, xmlhost)
        total_cpu, total_mem = host_capacity(xmlhost)
        used_cpu, used_mem   = used_capacity(db, limit)

        data = "HYPERVISOR=#{@hypervisor}\n"
        data << "PUBLIC_CLOUD=YES\n"
        data << "USEDCPU=#{used_cpu}\n"
        data << "USEDMEMORY=#{used_mem}\n"
        data << "FREECPU=#{total_cpu - used_cpu}\n"
        data << "FREEMEMORY=#{total_mem - used_mem}"

        data
    end

    #  Returns host information including wild VMs
    #
    #  @return [String]
    def probe_host_system(db, limit, xmlhost)
        total_cpu, total_mem = host_capacity(xmlhost)

        data = "HYPERVISOR=#{@hypervisor}\n"
        data << "PUBLIC_CLOUD=YES\n"
        data << "PRIORITY=-1\n"
        data << "TOTALCPU=#{total_cpu}\n"
        data << "TOTALMEMORY=#{total_mem}\n"

        # include wild instances
        vms = vms_data(db, limit)
        vms.each do |vm|
            next unless vm[:id] == -1

            vm[:import_template] = vm_to_one(vm)
            vm[:vm_name]         = vm[:name]

            vm.delete(:name)

            data << hash_to_template(vm, 'VM = [ ', " ]\n")
        end

        data
    end

    #  Returns VM monitor information
    #
    #  @return [String]
    def probe_vm_monitor
        vms = fetch_vms_data(:with_monitoring => true)

        data = ''
        vms.each do |vm|
            data << hash_to_template(vm, 'VM = [ ', " ]\n")
        end

        data
    end

    #---------------------------------------------------------------------------
    #  MODULE Helper functions
    # --------------------------------------------------------------------------

    # Either return VMs info from cache db or from public_cloud
    def vms_data(db, time_limit)
        return fetch_vms_data(:with_monitoring => false) \
            if db.expired?(time_limit)

        db.select_vms
    end

    # Return the information of a host in xml format
    # @param host_id [Integer] ID of the host
    #
    # @return [Host, nil]
    def host_info(host, host_id)
        client = OpenNebula::Client.new

        if host_id.nil?
            pool = OpenNebula::HostPool.new(client)
            pool.info
            objects = pool.select {|object| object.name==host }
            host_id = objects.first.id
        end

        xmlhost = OpenNebula::Host.new_with_id(host_id, client)

        rc = xmlhost.info(true)

        raise rc.to_str if OpenNebula.is_error?(rc)

        xmlhost
    end

    # Return count total cpu and memory based on instance type numbers in host
    # template
    # @param xmlhost [OpenNebula::XMLElement] xml host object
    #
    # @return [Array] total cpu, total memory
    def host_capacity(xmlhost)
        capacity = xmlhost.retrieve_xmlelements('/HOST/TEMPLATE/CAPACITY/*')

        raise 'Missing CAPACITY section in Host template' if capacity.nil?

        total_memory = total_cpu = 0

        capacity.each do |element|
            name  = element.name
            value = element.text

            name = parse_inst_type(name) if respond_to? :parse_inst_type

            cpu, mem = instance_type_capacity(name)

            total_memory += mem * value.to_i
            total_cpu    += cpu * value.to_i
        end

        [total_cpu, total_memory]
    end

    # Count cpu + mem of running instances
    #
    # @return [Array] used cpu, used memory
    def used_capacity(db, limit)
        vms = vms_data(db, limit)

        used_memory = used_cpu = 0

        vms.each do |vm|
            cpu, mem = instance_type_capacity(vm[:type])

            used_memory += mem
            used_cpu    += cpu
        end

        [used_cpu, used_memory]
    end

    # Build template for importation
    def vm_to_one(vm)
        cpu, mem = instance_type_capacity(vm[:type])

        mem = mem.to_i / 1024 # Memory for templates expressed in MB
        cpu = cpu.to_f / 100  # CPU expressed in units

        str = "NAME   = \"Instance from #{vm[:name]}\"\n"\
              "CPU    = \"#{cpu}\"\n"\
              "vCPU   = 1\n"\
              "MEMORY = \"#{mem}\"\n"\
              "PUBLIC_CLOUD = [\n"\
              "  TYPE  =\"#{@hypervisor}\"\n"\
              "]\n"\
              "DEPLOY_ID = \"#{vm[:uuid]}\"\n"\
              "SCHED_REQUIREMENTS = \"NAME=\\\"#{@host}\\\"\"\n"\
              "DESCRIPTION = \"Imported from #{@hypervisor} "\
                             "from #{vm[:name]}\"\n"

        Base64.strict_encode64(str)
    end

    # Hash to ONE template format
    def hash_to_template(h, pref = '', post = '', delim = ', ')
        tmpl = h.to_a.map {|e| "#{e[0].to_s.upcase}=\"#{e[1]}\"" }.join(delim)
        pref + tmpl + post
    end

end

# ------------------------------------------------------------------------------
# This class implements a simple local cache to store VM information
# ------------------------------------------------------------------------------
class InstanceCache

    def initialize(path)
        @db = SQLite3::Database.new(path)

        bootstrap
    end

    def execute_retry(query, tries = 5, tsleep = 0.5)
        i=0
        while i < tries
            begin
                return @db.execute(query)
            rescue SQLite3::BusyException
                i += 1
                sleep tsleep
            end
        end
    end

    # TODO: document DB schema
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

    def select_vms
        vms = []
        execute_retry('SELECT * from vms').each do |vm|
            vm = Hash[[:uuid, :id, :name, :state, :type].zip(vm)]
            vm[:deploy_id] = vm[:uuid]
            vms << vm
        end

        vms
    end

    # return true if the cache data expired
    #
    #   @param[Integer] time_limit time to expire cache data
    #
    #   @return[Boolean]
    def expired?(time_limit)
        ts = execute_retry('SELECT * from timestamp')

        ts.empty? || (Time.now.to_i - time_limit > ts.first.first)
    end

end
