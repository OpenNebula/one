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

require 'digest/sha1'
require "rexml/document"
include REXML
require 'ipaddr'

module Migrator
    def db_version
        "3.1.80"
    end

    def one_version
        "OpenNebula 3.1.80"
    end

    def up
        puts  "    > Networking isolation hooks have been moved to Host drivers.\n"<<
              "      If you were using a networking hook, enter its name, or press enter\n"<<
              "      to use the default dummy vn_mad driver.\n\n"

        vn_mad = ""

        while !( ["802.1Q", "dummy", "ebtables", "ovswitch", "fw"].include?(vn_mad) ) do
            print "      Driver name (802.1Q, dummy, ebtables, ovswitch, fw): "
            vn_mad = gets.chomp
            vn_mad = "dummy" if vn_mad.empty?
        end

        # 0 = all, 1 = none, 2 = interactive
        vlan_option = 1

        if ( vn_mad == "ebtables" || vn_mad == "ovswitch" )
            puts
            puts  "    > A new attribute, VLAN = YES/NO will be added to each VNET.\n"<<
                  "      For driver '#{vn_mad}', please choose if you want to isolate all networks (all),\n"<<
                  "      none (none), or be asked individually for each VNET (interactive)\n"

            vlan = ""
            while !( ["all", "none", "interactive"].include?(vlan) ) do
                print "      Isolate VNETs (all, none, interactive): "
                vlan = gets.chomp
            end

            case vlan
            when "all"
                vlan_option = 0
            when "none"
                vlan_option = 1
            when "interactive"
                vlan_option = 2
            end
        end

        # New VN_MAD element for hosts

        @db.run "ALTER TABLE host_pool RENAME TO old_host_pool;"
        @db.run "CREATE TABLE host_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, state INTEGER, last_mon_time INTEGER, UNIQUE(name));"

        @db.fetch("SELECT * FROM old_host_pool") do |row|
            doc = Document.new(row[:body])

            vn_mad_elem = doc.root.add_element("VN_MAD")
            vn_mad_elem.text = vn_mad

            @db[:host_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :state      => row[:state],
                :last_mon_time => row[:last_mon_time])
        end

        @db.run "DROP TABLE old_host_pool;"

        # New VLAN and RANGE for vnets

        @db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"
        @db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, public INTEGER, UNIQUE(name,uid));"

        @db.fetch("SELECT * FROM old_network_pool") do |row|
            doc = Document.new(row[:body])

            type = ""
            doc.root.each_element("TYPE") { |e|
                type = e.text
            }

            if type == "0"  # RANGED
                range_elem = doc.root.add_element("RANGE")
                ip_start_elem = range_elem.add_element("IP_START")
                ip_end_elem   = range_elem.add_element("IP_END")

                net_address = ""
                doc.root.each_element("TEMPLATE/NETWORK_ADDRESS") { |e|
                    net_address = e.text
                }

                net_valid = false
                while !net_valid do
                    begin
                        net_address = IPAddr.new(net_address, Socket::AF_INET)
                        net_valid   = true
                    rescue ArgumentError
                        puts
                        puts  "    > Error processing VNET ##{row[:oid]} '#{row[:name]}'\n"<<
                              "      This network address is invalid: '#{net_address}'\n"
                        print "      Please enter a valid network address: "
                        net_address = gets.chomp
                    end
                end


                st_size = ""
                doc.root.each_element("TEMPLATE/NETWORK_SIZE") { |e|
                    st_size = e.text
                }

                if ( st_size == "C" || st_size == "c" )
                    host_bits = 8
                elsif ( st_size == "B" || st_size == "b" )
                    host_bits = 16
                elsif ( st_size == "A" || st_size == "a" )
                    host_bits = 24
                else
                    size = st_size.to_i
                    host_bits = (Math.log(size+2)/Math.log(2)).ceil
                end

                net_mask = 0xFFFFFFFF << host_bits

                net_address = net_address.to_i & net_mask

                ip_start_elem.text = IPAddr.new((net_address + 1), Socket::AF_INET).to_s
                ip_end_elem.text = IPAddr.new((net_address +  (1 << host_bits) - 2), Socket::AF_INET).to_s
            end

            phydev_present = false
            doc.root.each_element("PHYDEV") { |e|
                phydev_present = true
            }

            vlan_elem = doc.root.add_element("VLAN")

            if phydev_present
                vlan_elem.text = "1"
            else
                case vlan_option
                when 0
                    vlan_elem.text = "1"
                when 1
                    vlan_elem.text = "0"
                when 2
                    vlan = ""
                    while !( ["y", "n"].include?(vlan) ) do
                        print "    > Isolate VNET ##{row[:oid]} '#{row[:name]}'?  (y/n) : "
                        vlan = gets.chomp
                    end

                    if ( vlan == "y" )
                        vlan_elem.text = "1"
                    else
                        vlan_elem.text = "0"
                    end
                end
            end

            @db[:network_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :public     => row[:public])
        end

        @db.run "DROP TABLE old_network_pool;"

        # Add empty HISTORY_RECORDS element to VMs without any records
        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER);"
        @db.run "INSERT INTO vm_pool SELECT * FROM old_vm_pool;"

        @db.fetch("SELECT * FROM old_vm_pool") do |row|
            doc = Document.new(row[:body])

            found = false
            doc.root.each_element("HISTORY_RECORDS") { |e|
                found = true
            }

            if !found
                doc.root.add_element("HISTORY_RECORDS")

                @db[:vm_pool].filter(:oid=>row[:oid]).update(
                     :body   => doc.root.to_s)
            end
        end

        @db.run "DROP TABLE old_vm_pool;"


        return true
    end
end
