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

module OZones
    
    class Zones 
        include DataMapper::Resource
        include OpenNebulaJSON::JSONUtils
        extend OpenNebulaJSON::JSONUtils
        
        property :id,            Serial
        property :name,          String, :required => true, :unique => true 
        property :onename,       String, :required => true
        property :onepass,       String, :required => true
        property :endpoint,      String, :required => true
        property :sunsendpoint,  String
        
        has n,   :vdcs
        
        def self.to_hash
            zonePoolHash = Hash.new
            zonePoolHash["ZONE_POOL"] = Hash.new
            zonePoolHash["ZONE_POOL"]["ZONE"] = Array.new unless self.all.empty?
            self.all.each{|zone|
                  zonePoolHash["ZONE_POOL"]["ZONE"] <<  
                     zone.attributes.merge({:numbervdcs => zone.vdcs.all.size})              
            }
            return zonePoolHash
        end
        
        def to_hash
            zone_attributes = Hash.new
            zone_attributes["ZONE"] = attributes
            zone_attributes["ZONE"][:vdcs] = Array.new
            self.vdcs.all.each{|vdc|
                zone_attributes["ZONE"][:vdcs]<<vdc.attributes
            }
            return zone_attributes
        end
    end 
    
end
