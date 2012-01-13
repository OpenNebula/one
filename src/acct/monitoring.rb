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

module OneWatch
    require 'watch_helper'

    class Monitoring
        def insert(hash)
            timestamp = generate_timestamp

            if (pool_hash = hash["#{resource}_POOL"]) && !pool_hash.empty?
                [pool_hash["#{resource}"]].flatten.each { |elem|
                    sql = sql_elem(elem)
                    sql.add_sample_from_resource(elem, timestamp)
                }
            end

            sql_elem.flush
        end

        private

        def generate_timestamp
            Time.now.to_i
        end
    end

    class VmMonitoring < Monitoring
        def resource
            'VM'
        end

        def sql_elem(elem=nil)
            if elem
                WatchHelper::Vm.info(elem)
            else
                WatchHelper::Vm
            end
        end

        def generate_timestamp
            ts = super
            WatchHelper::VmTimestamp.find_or_create(:id=>ts)
        end
    end

    class HostMonitoring < Monitoring
        def resource
            'HOST'
        end

        def sql_elem(elem=nil)
            if elem
                WatchHelper::Host.info(elem)
            else
                WatchHelper::Host
            end
        end

        def generate_timestamp
            ts = super
            WatchHelper::HostTimestamp.find_or_create(:id=>ts)
        end
    end
end
