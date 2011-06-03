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

ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
else
    RUBY_LIB_LOCATION = ONE_LOCATION+"/lib/ruby"
end

$: << RUBY_LIB_LOCATION

require 'OpenNebula'
require 'OneMonitorUtils'
include OpenNebula

class OneMonitor

    OUTPUT_METHOD="CSV"
    case OUTPUT_METHOD
    when "CSV" then include OneMonitorCSV
    end

    def initialize(log_file_folder,monitoring_elems)
        # Authenticate in OpenNebula
        @client = Client.new
        @log_file_folder = log_file_folder
        @monitoring_elems = monitoring_elems
        @results = []
        reinit_global_results
    end

    def results
        @results
    end

    def snapshot
        #init global results

        rc = monitor #calling the extending class method
        rc = save if rc
        if rc
            @results = []
            reinit_global_results
            puts "New monitoring snapshots saved."
        else
            puts "Error saving new snapshot."
        end
        return rc
    end

    def monitor
        pool = factory(@client)
        rc = pool.info

        if OpenNebula.is_error?(rc)
            puts "Error monitoring: #{rc.message}"
            return nil
        end

        pool.each do | elem |
            time = elem[@monitoring_elems[:time]].to_i

            hash = {}
            @monitoring_elems.each do | key,value |
                hash[key] = elem[value]
            end

            #do not log time = 0, it causes
            #graphs being drawn from 1970

            if time > 0
                @results << hash
                add_to_global(hash)
            end

            @n_active += 1 if active(hash)
            @n_error += 1 if error(hash)
            @n_total += 1
        end

    end

    def reinit_global_results
        @global_results = {}
        @monitoring_elems.each do | key,value |
            @global_results[key] = 0
        end
        @n_active = @n_error = @n_total = 0
    end

    def add_to_global(hash)
        hash.each do | key,value |
            @global_results[key] += value.to_i
        end
        time = hash[:time].to_i
        @global_results[:time] = time
    end

end
