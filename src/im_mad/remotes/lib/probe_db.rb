#!/usr/bin/ruby
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
require 'yaml'
require 'fileutils'

# ------------------------------------------------------------------------------
# SQlite Interface for the status probes. It stores the last known state of
# each domain and the number of times the domain has been reported as missing
#
# IMPORTANT. This class needs to include/require a DomainList module with
# the state_info method.
# ------------------------------------------------------------------------------
class VirtualMachineDB

    # Default configuration attributes for the Database probe
    DEFAULT_CONFIGURATION = {
        :times_missing => 3,
        :obsolete      => 720,
        :base_path       => "#{__dir__}/../",
        :sync          => 180,
        :missing_state => 'POWEROFF'
    }

    # States table columns
    SCHEMA = %w[
        uuid
        id
        name
        deploy_id
        timestamp
        missing
        state
        hyper
    ]

    def self.unlink_db(hyperv, opts = {})
        conf = VirtualMachineDB.load_conf(hyperv, opts)

        File.unlink(conf[:db_path])
    end

    def initialize(hyperv, host, host_id, opts = {})
        @host = host
        @host_id = host_id
        @conf = VirtualMachineDB.load_conf(hyperv, @host_id, opts)

        @db = SQLite3::Database.new(@conf[:db_path])

        bootstrap

        @dataset = 'states'
        @settings = 'settings'
    end

    # Deletes obsolete VM entries
    def purge
        limit = Time.now.to_i - (@conf[:obsolete] * 60) # conf in minutes

        @db.execute("DELETE FROM #{@dataset} WHERE timestamp < #{limit}")
    end

    # Returns the VM status that changed compared to the DB info as well
    # as VMs that have been reported as missing more than missing_times
    def to_status
        time = Time.now.to_i
        last = @db.execute("SELECT value from #{@settings} where key = 'LAST_SYNC'").flatten[0].to_i

        sync_state = last == 0 || time > (last + @conf[:sync].to_i)

        status_str  = ''
        monitor_ids = []

        if sync_state then
            status_str = "SYNC_STATE=yes\nMISSING_STATE=#{@conf[:missing_state]}\n"
            
            @db.execute("REPLACE INTO #{@settings} VALUES ('LAST_SYNC', #{time.to_s})")
        end

        vms = DomainList.state_info(@host, @host_id)

        # ----------------------------------------------------------------------
        # report state changes in vms
        # ----------------------------------------------------------------------
        vms.each do |uuid, vm|
            next if vm[:ignore] == true

            if vm[:id] == -1
                filter = "WHERE uuid = '#{uuid}'"
            else
                # in ec2 id could first be -1 but later added, check also uuid
                filter = "WHERE id = '#{vm[:id]}' OR uuid = '#{uuid}'"
            end

            vm_db = @db.execute("SELECT * FROM #{@dataset} #{filter}").first

            monitor_ids << uuid

            if vm_db.nil?
                @db.execute(
                    "INSERT INTO #{@dataset} VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [uuid,
                     vm[:id].to_i,
                     vm[:name],
                     vm[:deploy_id],
                     time,
                     0,
                     vm[:state],
                     @conf[:hyperv]]
                )

                status_str << vm_to_status(vm)
                
                next
            end

            # Updates timestamp and uuid/deploy_id (e.g. VM recreated in KVM)
            @db.execute(
                "UPDATE #{@dataset} SET " \
                "state = '#{vm[:state]}', " \
                'missing = 0, ' \
                "timestamp = #{time}, " \
                "uuid = '#{uuid}', " \
                "deploy_id = '#{vm[:deploy_id]}' "\
                "#{filter}"
            )

            if sync_state || vm_db[col_name_to_idx('state')] != vm[:state]
                status_str << vm_to_status(vm)
            end
        end

        # ----------------------------------------------------------------------
        # check missing VMs
        # ----------------------------------------------------------------------
        uuids = @db.execute("SELECT uuid FROM #{@dataset}").flatten
        uuids ||= []

        (uuids - monitor_ids).each do |uuid|
            vm_db = @db.execute(
                "SELECT * FROM #{@dataset} WHERE uuid = '#{uuid}'"
            ).first

            next if vm_db.nil?

            miss = vm_db[col_name_to_idx('missing')]

            if miss >= @conf[:times_missing]
                status_str << vm_db_to_status(vm_db, @conf[:missing_state])

                @db.execute("DELETE FROM #{@dataset} WHERE uuid = \"#{uuid}\"")
            else
                status_str << vm_db_to_status(vm_db) if sync_state
                
                @db.execute(
                    "UPDATE #{@dataset} SET " \
                    "timestamp = #{time}, " \
                    "missing = #{miss + 1} " \
                    "WHERE uuid = '#{uuid}'"
                )
            end
        end

        status_str
    end

    #  TODO describe DB schema
    #
    #
    def bootstrap
        sql = 'CREATE TABLE IF NOT EXISTS states(uuid VARCHAR(128) PRIMARY KEY,'
        sql << ' id INTEGER, name VARCHAR(128), deploy_id VARCHAR(128), timestamp INTEGER,'
        sql << ' missing INTEGER, state VARCHAR(128), hyperv VARCHAR(128))'

        @db.execute(sql)

        sql = 'CREATE TABLE IF NOT EXISTS settings(key VARCHAR(128) PRIMARY KEY,'
        sql << ' value VARCHAR(128))'

        @db.execute(sql)
    end

    private

    def vm_to_status(vm, state = vm[:state])
        "VM = [ ID=\"#{vm[:id]}\", DEPLOY_ID=\"#{vm[:deploy_id]}\", " \
        " STATE=\"#{state}\" ]\n"
    end

    def vm_db_to_status(vm, state = vm[col_name_to_idx('state')])
        id = col_name_to_idx('id')
        deploy_id = col_name_to_idx('deploy_id')

        "VM = [ ID=\"#{vm[id]}\", DEPLOY_ID=\"#{vm[deploy_id]}\", " \
        " STATE=\"#{state}\" ]\n"
    end

    # Load configuration file and parse user provided options
    def self.load_conf(hyperv, host_id, opts)
        conf_path = "#{__dir__}/../../etc/im/#{hyperv}-probes.d/probe_db.conf"
        etc_conf  = YAML.load_file(conf_path) rescue nil

        conf = DEFAULT_CONFIGURATION.clone

        conf.merge! etc_conf if etc_conf

        conf.merge! opts

        conf[:hyperv] = hyperv
        conf[:db_path] = File.join(conf[:base_path],
                                   "status_#{hyperv}_#{host_id}.db")
        conf
    end

    # Get column position
    def col_name_to_idx(name)
        SCHEMA.index(name)
    end

end
