# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project Leads (OpenNebula.org)             #
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

module Migrator
    def db_version
        "3.7.80"
    end

    def one_version
        "OpenNebula 3.7.80"
    end

    def up

        puts "    > Please enter the DATASTORE_LOCATION set in your oned.conf,\n"<<
             "      Press enter to use the default /var/lib/one/datastores/\n"
        print "      DATASTORE_LOCATION: "
        ds_location = gets.chomp

        ds_location = "/var/lib/one/datastores/" if ds_location.empty?

        ########################################################################
        # Feature #1522: Allow users to create Documents by default
        ########################################################################

        # Insert rule "* DOCUMENT/* CREATE"

        last_oid = 0
        @db.fetch("SELECT last_oid FROM pool_control WHERE tablename='acl'") do |row|
            last_oid = row[:last_oid].to_i
        end

        @db[:acl].insert(
            :oid        => (last_oid + 1).to_s,
            :user       => 0x400000000.to_s,
            :resource   => 0x400400000000.to_s,
            :rights     => 0x8.to_s)

        @db.run("UPDATE pool_control SET last_oid=#{last_oid + 1} WHERE tablename='acl';")


        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.fetch("SELECT * FROM old_vm_pool") do |row|
            vm_doc = Document.new(row[:body])

            ####################################################################
            # Feature #1393: DATASTORE_LOCATION for each system datastore
            ####################################################################

            vm_doc.root.each_element("HISTORY_RECORDS/HISTORY") { |e|
                e.add_element("DS_LOCATION").text = ds_location
            }

            ####################################################################
            # Bug #1363: Make sure all VMs have CPU (float) & MEM (int)
            ####################################################################

            # NOTE: The VM memory and CPU are modified, but the sum in
            # HOST/HOST_SHARE is not. A onedb fsck is required

            # If state != DONE
            if ( row[:state] != 6 )
                memory = nil
                vm_doc.root.each_element("TEMPLATE/MEMORY") { |e|
                    memory = e.text.to_i
                    memory = 0 if memory < 0

                    e.text = memory.to_s
                }

                if memory.nil?
                    vm_doc.root.each_element("TEMPLATE") { |e|
                        e.add_element("MEMORY").text = "0"
                    }
                end

                cpu = nil
                vm_doc.root.each_element("TEMPLATE/CPU") { |e|
                    # truncate to 2 decimals
                    cpu = (e.text.to_f * 100).to_i / 100.0
                    cpu = 0 if cpu < 0

                    e.text = cpu.to_s
                }

                if cpu.nil?
                    vm_doc.root.each_element("TEMPLATE") { |e|
                        e.add_element("CPU").text = "0"
                    }
                end
            end

            @db[:vm_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => vm_doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :last_poll  => row[:last_poll],
                :state      => row[:state],
                :lcm_state  => row[:lcm_state],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        @db.run "DROP TABLE old_vm_pool;"


        ####################################################################
        # Feature #1393: DATASTORE_LOCATION for each system datastore
        ####################################################################

        @db.run "ALTER TABLE history RENAME TO old_history;"
        @db.run "CREATE TABLE history (vid INTEGER, seq INTEGER, body TEXT, stime INTEGER, etime INTEGER,PRIMARY KEY(vid,seq));"

        @db.fetch("SELECT * FROM old_history") do |row|
            doc = Document.new(row[:body])

            doc.root.add_element("DS_LOCATION").text = ds_location

            @db[:history].insert(
                :vid        => row[:vid],
                :seq        => row[:seq],
                :body       => doc.root.to_s,
                :stime      => row[:stime],
                :etime      => row[:etime])
        end

        @db.run "DROP TABLE old_history;"


        return true
    end
end
