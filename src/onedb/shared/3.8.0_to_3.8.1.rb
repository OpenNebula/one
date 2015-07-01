# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'set'
require 'nokogiri'
require "rexml/document"
include REXML

module Migrator
    def db_version
        "3.8.1"
    end

    def one_version
        "OpenNebula 3.8.1"
    end

    def up

        init_log_time()

        ########################################################################
        # Bug : Add VM IDs Collection to Hosts & Images
        ########################################################################

        counters = {}
        counters[:host]  = {}
        counters[:image] = {}

        # Initialize all the host counters
        @db.fetch("SELECT oid FROM host_pool") do |row|
            counters[:host][row[:oid]] = {
                :rvms   => Set.new
            }
        end

        # Init image counters
        @db.fetch("SELECT oid FROM image_pool") do |row|
            counters[:image][row[:oid]] = Set.new
        end

        log_time()

        # Aggregate information of the RUNNING vms
        @db.fetch("SELECT oid,body FROM vm_pool WHERE state<>6") do |row|
            vm_doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            state     = vm_doc.root.at_xpath('STATE').text.to_i
            lcm_state = vm_doc.root.at_xpath('LCM_STATE').text.to_i

            # Images used by this VM
            vm_doc.root.xpath("TEMPLATE/DISK/IMAGE_ID").each do |e|
                img_id = e.text.to_i

                if counters[:image][img_id].nil?
                    warn("VM #{row[:oid]} is using Image #{img_id}, but it does not exist")
                else
                    counters[:image][img_id].add(row[:oid])
                end
            end


            # Host resources

            # Only states that add to Host resources consumption are
            # ACTIVE, SUSPENDED, POWEROFF
            next if !([3,5,8].include? state)

            # Get hostid
            hid = -1
            vm_doc.root.xpath("HISTORY_RECORDS/HISTORY[last()]/HID").each { |e|
                hid = e.text.to_i
            }

            if counters[:host][hid].nil?
                warn("VM #{row[:oid]} is using Host #{hid}, but it does not exist")
            else
                counters[:host][hid][:rvms].add(row[:oid])
            end
        end

        log_time()

        ########################################################################
        # Hosts
        #
        # HOST/HOST_SHARE/RUNNING_VMS
        # HOST/VMS/ID
        ########################################################################

        @db.run "CREATE TABLE host_pool_new (oid INTEGER PRIMARY KEY, " <<
                "name VARCHAR(128), body TEXT, state INTEGER, " <<
                "last_mon_time INTEGER, uid INTEGER, gid INTEGER, " <<
                "owner_u INTEGER, group_u INTEGER, other_u INTEGER, " <<
                "UNIQUE(name));"

        # Calculate the host's xml and write them to host_pool_new
        @db.transaction do
            @db[:host_pool].each do |row|
                host_doc = Document.new(row[:body])

                hid = row[:oid]

                rvms = counters[:host][hid][:rvms].size

                # rewrite running_vms
                host_doc.root.each_element("HOST_SHARE/RUNNING_VMS") {|e|
                    if e.text != rvms.to_s
                        warn("Host #{hid} RUNNING_VMS has #{e.text} \tis\t#{rvms}")
                        e.text = rvms
                    end
                }

                # re-do list of VM IDs
                vms_new_elem = host_doc.root.add_element("VMS")

                counters[:host][hid][:rvms].each do |id|
                    vms_new_elem.add_element("ID").text = id.to_s
                end

                row[:body] = host_doc.to_s

                # commit
                @db[:host_pool_new].insert(row)
            end
        end

        # Rename table
        @db.run("DROP TABLE host_pool")
        @db.run("ALTER TABLE host_pool_new RENAME TO host_pool")

        log_time()

        ########################################################################
        # Image
        #
        # IMAGE/RUNNING_VMS
        # IMAGE/VMS/ID
        ########################################################################

        # Create a new empty table where we will store the new calculated values
        @db.run "CREATE TABLE image_pool_new (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid) );"

        @db.transaction do
            @db[:image_pool].each do |row|
                doc = Document.new(row[:body])

                oid = row[:oid]

                rvms = counters[:image][oid].size

                # rewrite running_vms
                doc.root.each_element("RUNNING_VMS") {|e|
                    if e.text != rvms.to_s
                        warn("Image #{oid} RUNNING_VMS has #{e.text} \tis\t#{rvms}")
                        e.text = rvms
                    end
                }

                # re-do list of VM IDs
                vms_new_elem = doc.root.add_element("VMS")

                counters[:image][oid].each do |id|
                    vms_new_elem.add_element("ID").text = id.to_s
                end

                row[:body] = doc.to_s

                # commit
                @db[:image_pool_new].insert(row)
            end
        end

        # Rename table
        @db.run("DROP TABLE image_pool")
        @db.run("ALTER TABLE image_pool_new RENAME TO image_pool")

        log_time()

        return true
    end
end
