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

module OZones

    class AggregatedPool
        include  OpenNebulaJSON::JSONUtils

        def initialize(tag)
            @tag                          = tag
        end

        def info
            @sup_aggregated_pool               = Hash.new
            @sup_aggregated_pool[@tag]         = Hash.new
            @sup_aggregated_pool[@tag]["ZONE"] = Array.new

            OZones::Zones.all.each{|zone|

                zone_pool_hash = Hash.new

                zone_pool_hash = zone.to_hash["ZONE"]

                client = OpenNebula::Client.new("#{zone.ONENAME}:#{zone.ONEPASS}",
                                                zone.ENDPOINT)

                pool = factory(client)

                rc = pool.info
                if !rc
                    zone_pool_hash.merge!(pool.to_hash)
                elsif OpenNebula.is_error?(rc)
                    error = "Error communicating with #{zone.NAME}."
                    error << " Retrieving #{self.class.name.split('::').last}: "
                    error << "#{rc.to_str}"
                    zone_pool_hash.merge!({:error => {:message => error}})
                else
                    zone_pool_hash.merge!(rc.to_hash)
                end

                @sup_aggregated_pool[@tag]["ZONE"] << zone_pool_hash
            }
        end

        def to_hash
            info
            return @sup_aggregated_pool
        end
    end

end
