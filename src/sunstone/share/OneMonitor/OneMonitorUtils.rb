# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

module OneMonitorCSV

    def save
        rc = save_csv
        save_global_csv if rc
    end

    def save_csv(separator=",")

        @results.each do | mon_hash |
            id = mon_hash[:id]
            log_name = "#{@log_file_folder}/#{id}"

            begin
                log_file = File.new(log_name,'a')

                if !File.size?(log_name)
                    header = csv_header
                    log_file.puts(header)
                end

                line = hash_to_csv(mon_hash)
                log_file.puts(line)
                log_file.close
            rescue Exception => e
                puts e.message
                puts "Error writing log"
                return nil
            end
        end
    end

    def save_global_csv
        begin

            global_log_file = "#{@log_file_folder}/global"
            global_file = File.new(global_log_file,'a')

            if !File.size?(global_log_file)
            then
                header = csv_header+",active,error,total"
                global_file.puts(header)
            end

            csv = hash_to_csv(@global_results)+%&,"#{@n_active}","#{@n_error}","#{@n_total}"&
            global_file.puts(csv)
            global_file.close
            return 0
        rescue Exception => e
            puts e.message
            puts "Error writing global results"
            return nil
        end


    end

    def hash_to_csv hash,separator=","
        csv_line = ""
        #we need to respect the order of monitoring elems
        #keys, which might not be the same in hash
        @monitoring_elems.each do | key, value |
            csv_line += %&"#{hash[key]}"#{separator}&
        end
        csv_line.chop! unless csv_line.empty?
    end

    def csv_header separator=","
        str = ""
        @monitoring_elems.each do | key,value |
            str += "#{key},"
        end
        #remove final separator
        str.chop! unless str.empty?
    end

end
