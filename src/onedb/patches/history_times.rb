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

if !ONE_LOCATION
    LOG_LOCATION = "/var/log/one"
else
    LOG_LOCATION = ONE_LOCATION + "/var"
end

LOG              = LOG_LOCATION + "/onedb-fsck.log"

require 'nokogiri'

module OneDBPatch
    VERSION = "4.11.80"
    LOCAL_VERSION = "4.13.85"

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

    ATTRIBUTES = [
            ["STIME",   "Start time"],
            ["PSTIME",  "Prolog start time"],
            ["PETIME",  "Prolog end time"],
            ["RSTIME",  "Running start time"],
            ["RETIME",  "Running end time"],
            ["ESTIME",  "Epilog start time"],
            ["EETIME",  "Epilog end time"],
            ["ETIME",   "End time"]
        ]

    def patch(ops)

        init_log_time()

        puts "This tool will allow you to edit the timestamps of VM history records, used to calculate accounting and showback."

        input = ""
        while ( input.to_i.to_s != input ) do
            print "VM ID: "
            input = STDIN.gets.chomp.strip
        end

        vid = input.to_i

        input = ""
        while ( input.to_i.to_s != input ) do
            print "History sequence number: "
            input = STDIN.gets.chomp.strip
        end

        seq = input.to_i

        puts

        history_row = nil
        history_doc = nil

        @db.fetch("SELECT * FROM history WHERE vid = #{vid} AND seq = #{seq}") do |row|
            history_doc = nokogiri_doc(row[:body], 'history')

            pphistory(history_doc)

            puts
            puts "To set new values:\n  empty to use current value; <YYYY-MM-DD HH:MM:SS> in UTC; or 0 to leave unset (open history record)."

            ATTRIBUTES.each do |att, desc|
                elem = history_doc.root.at_xpath(att)

                puts "%-6s  %-20s: %-25s" % [att, desc, pptime(elem.text)]

                elem.content = parsetime(elem.text)

                puts
            end

            row[:body]  = history_doc.root.to_s
            row[:etime] = history_doc.root.at_xpath("ETIME").text.to_i

            history_row = row
        end

        if (history_row)
            puts
            puts "The history record # #{history_row[:seq]} for VM #{history_row[:vid]} will be updated with these new values:"
            pphistory(history_doc)

            puts
            print "Confirm to write to the database [Y/n]: "
            input = STDIN.gets.chomp.strip.downcase

            if !(input == "" || input == "y")
                raise "Execution canceled by user"
            end

            @db.transaction do
                @db[:history].where({:vid => history_row[:vid], :seq => history_row[:seq]}).update(history_row)
            end
        else
            puts "History record # #{seq} for VM #{vid} does not exist in the database."
        end

        log_time()

        return true
    end

    def pphistory(history_doc)
        ATTRIBUTES.each do |att, desc|
            elem = history_doc.root.at_xpath(att)

            puts "%-6s  %-20s: %-25s" % [att, desc, pptime(elem.text)]
        end
    end

    # Pretty print time
    def pptime(t)
        if (t.to_i == 0)
            return "0 (unset)"
        end

        return Time.at(t.to_i).utc.strftime("%F %T %Z")
    end

    def parsetime(t)
        print "New value                   : "
        input = STDIN.gets.chomp.strip

        while true
            if (input == "")
                return t.to_i
            end

            if (input == "0")
                return 0
            end

            st = input.gsub(" ", "T")
            st << ("Z")

            begin
                return Time.iso8601(st).to_i
            rescue ArgumentError => e
                puts "Argument is not valid. Time must be in UTC timezone, and formatted as <YYYY-MM-DD HH:MM:SS>. Failure: #{e.to_s}"
                print "New value                   : "
                input = STDIN.gets.chomp.strip
            end
        end
    end
end
