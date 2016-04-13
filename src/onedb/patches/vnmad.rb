# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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

if !ONE_LOCATION
    LOG_LOCATION = "/var/log/one"
else
    LOG_LOCATION = ONE_LOCATION + "/var"
end

LOG              = LOG_LOCATION + "/onedb-fsck.log"

require 'nokogiri'

module OneDBPatch
    VERSION = "4.90.0"
    LOCAL_VERSION = "4.90.0"

    def is_hot_patch(ops)
        return false
    end

    def check_db_version(ops)
        db_version = read_db_version()

        if ( db_version[:version] != VERSION ||
             db_version[:local_version] != LOCAL_VERSION )

            raise <<-EOT
Version mismatch: patch file is for version
Shared: #{VERSION}, Local: #{LOCAL_VERSION}

Current database is version
Shared: #{db_version[:version]}, Local: #{db_version[:local_version]}
EOT
        end
    end

    def patch(ops)
        init_log_time()

        all_nets = {}
        fix_nets = {}

        @db.transaction do
            @db.fetch("SELECT * FROM network_pool") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}
                vnmad = doc.root.xpath("VN_MAD").text rescue ""
                all_nets[row[:oid]] = {:name => row[:name], :vnmad => vnmad}

                if vnmad.empty?
                    fix_nets[row[:oid]] = ""
                end
            end
        end

        if !fix_nets.empty?
            puts "You need to input a VN_MAD for the following networks:"
            fix_nets.each do |net_id, vnmad|
                input = ""
                while ( input.empty? ) do
                    name = all_nets[net_id][:name]
                    puts "##{net_id} (#{name}) => VN_MAD:"
                    input = STDIN.gets.chomp.strip
                end
                fix_nets[net_id] = input
            end
        end

        puts
        puts "Change additional networks:"

        input = ""
        while (input != "c")
            puts
            puts "Input the ID of the network to change or 'c' to continue"

            input = STDIN.gets.chomp.strip

            if input.match(/^\d+$/)
                net_id = input.to_i

                if all_nets[net_id].nil?
                    puts "Error: Net ##{net_id} not found."
                    next
                end

                input_vnmad = ""
                while ( input_vnmad.empty? ) do
                    name = all_nets[net_id][:name]
                    current_vnmad = all_nets[net_id][:vnmad]
                    puts "##{net_id} (#{name}) (current VN_MAD='#{current_vnmad}') => VN_MAD:"
                    input_vnmad = STDIN.gets.chomp.strip
                end
                fix_nets[net_id] = input_vnmad
            end
        end

        puts "Review these assignemnts:"

        fix_nets.keys.sort.each do |net_id|
            name  = all_nets[net_id][:name]
            vnmad = fix_nets[net_id]

            current_vnmad = all_nets[net_id][:vnmad]

            msg = "* ##{net_id} (#{name}) => VN_MAD='#{vnmad}'"

            if !current_vnmad.empty?
                msg << " (current VN_MAD='#{current_vnmad}')"
            end

            puts msg
        end

        puts

        input = ""
        while ( !input.match(/^(y|n)$/)) do
            puts "Do you wish to apply the above? (y/n)"
            input = STDIN.gets.chomp.strip.downcase
        end

        if input == "n"
            puts "Quitting without changing anything."
            raise "Execution canceled by user"
        end

        @db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"
        @db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, pid INTEGER, UNIQUE(name,uid));"

        @db.transaction do
          @db.fetch("SELECT * FROM old_network_pool") do |row|
            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            net_id = row[:oid]
            vnmad = fix_nets[net_id]

            if vnmad
              doc.root.add_child(doc.create_element("VN_MAD")).content = vnmad
            end

            row[:body] = doc.root.to_s
            @db[:network_pool].insert(row)
          end
        end

        @db.run "DROP TABLE old_network_pool;"

        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "CREATE TABLE IF NOT EXISTS vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER)"

        @db.transaction do
          @db.fetch("SELECT * FROM old_vm_pool") do |row|
            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}
            state = row[:state].to_i

            if state != 6
              doc.root.xpath('TEMPLATE/NIC').each do |nic|
                net_id = nic.xpath("NETWORK_ID").text.to_i rescue nil # NICs without network may exist
                next unless net_id

                vnmad = fix_nets[net_id]

                if vnmad
                    nic.add_child(doc.create_element("VN_MAD")).content = vnmad
                end
              end

              row[:body] = doc.root.to_s
            end

            @db[:vm_pool].insert(row)
          end
        end
        @db.run "DROP TABLE old_vm_pool;"

        log_time()

        return true
    end
end
