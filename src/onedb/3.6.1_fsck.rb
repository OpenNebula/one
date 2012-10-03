# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

require "rexml/document"
include REXML

module OneDBFsck
    VM_STATE=%w{INIT PENDING HOLD ACTIVE STOPPED SUSPENDED DONE FAILED}

    LCM_STATE=%w{LCM_INIT PROLOG BOOT RUNNING MIGRATE SAVE_STOP SAVE_SUSPEND
        SAVE_MIGRATE PROLOG_MIGRATE PROLOG_RESUME EPILOG_STOP EPILOG
        SHUTDOWN CANCEL FAILURE CLEANUP UNKNOWN HOTPLUG}

    SHORT_VM_STATES={
        "INIT"      => "init",
        "PENDING"   => "pend",
        "HOLD"      => "hold",
        "ACTIVE"    => "actv",
        "STOPPED"   => "stop",
        "SUSPENDED" => "susp",
        "DONE"      => "done",
        "FAILED"    => "fail"
    }

    SHORT_LCM_STATES={
        "PROLOG"        => "prol",
        "BOOT"          => "boot",
        "RUNNING"       => "runn",
        "MIGRATE"       => "migr",
        "SAVE_STOP"     => "save",
        "SAVE_SUSPEND"  => "save",
        "SAVE_MIGRATE"  => "save",
        "PROLOG_MIGRATE"=> "migr",
        "PROLOG_RESUME" => "prol",
        "EPILOG_STOP"   => "epil",
        "EPILOG"        => "epil",
        "SHUTDOWN"      => "shut",
        "CANCEL"        => "shut",
        "FAILURE"       => "fail",
        "CLEANUP"       => "clea",
        "UNKNOWN"       => "unkn",
        "HOTPLUG"       => "hotp"
    }

    MIGRATE_REASON=%w{NONE ERROR STOP_RESUME USER CANCEL}

    SHORT_MIGRATE_REASON={
        "NONE"          => "none",
        "ERROR"         => "erro",
        "STOP_RESUME"   => "stop",
        "USER"          => "user",
        "CANCEL"        => "canc"
    }

    def db_version
        "3.6.1"
    end

    def one_version
        "OpenNebula 3.6.1"
    end

    def fsck
        counters = {:host => {}}

        # Initialize all the hosts to 0
        @db[:host_pool].each do |row|
            hid = row[:oid]
            counters[:host][hid] = {
                :memory => 0,
                :cpu    => 0,
                :rvms   => 0
            }
        end

        # Aggregate information of the RUNNING vms
        @db[:vm_pool].where(:state => 3).each do |row|
            vm_doc = Document.new(row[:body])

            state     = vm_doc.root.get_text('STATE').to_s.to_i
            lcm_state = vm_doc.root.get_text('LCM_STATE').to_s.to_i

            # Take only into account ACTIVE and SUSPENDED vms
            # the rest don't eat up resources.
            next if !%w(ACTIVE SUSPENDED).include?(VM_STATE[state])

            # Get memory (integer)
            memory = 0
            vm_doc.root.each_element("TEMPLATE/MEMORY") { |e|
                memory = e.text.to_i
            }

            # Get CPU (float)
            cpu = 0
            vm_doc.root.each_element("TEMPLATE/CPU") { |e|
                cpu = e.text.to_f
            }

            # Get hostid
            hid = -1
            vm_doc.root.each_element("HISTORY_RECORDS/HISTORY[last()]/HID") { |e|
                hid = e.text.to_i
            }

            counters[:host][hid][:memory] += memory
            counters[:host][hid][:cpu]    += cpu
            counters[:host][hid][:rvms]   += 1
        end

        # Create a new empty table where we will store the new calculated values
        @db.run "CREATE TABLE host_pool_new (oid INTEGER PRIMARY KEY, " <<
                "name VARCHAR(128), body TEXT, state INTEGER, " <<
                "last_mon_time INTEGER, uid INTEGER, gid INTEGER, " <<
                "owner_u INTEGER, group_u INTEGER, other_u INTEGER, " <<
                "UNIQUE(name));"

        # Calculate the host's xml and write them to host_pool_new
        @db[:host_pool].each do |row|
            host_doc = Document.new(row[:body])

            hid = row[:oid]

            # rewrite running_vms
            host_doc.root.each_element("HOST_SHARE/RUNNING_VMS") {|e|
                e.text = counters[:host][hid][:rvms]
            }

            # rewrite cpu
            host_doc.root.each_element("HOST_SHARE/CPU_USAGE") {|e|
                e.text = (counters[:host][hid][:cpu]*100).to_i
            }

            # rewrite memory
            host_doc.root.each_element("HOST_SHARE/MEM_USAGE") {|e|
                e.text = counters[:host][hid][:memory]*1024
            }

            row[:body] = host_doc.to_s

            # commit
            @db[:host_pool_new].insert(row)
        end

        # Rename table
        @db.run("DROP TABLE host_pool")
        @db.run("ALTER TABLE host_pool_new RENAME TO host_pool")

        return true
    end
end
