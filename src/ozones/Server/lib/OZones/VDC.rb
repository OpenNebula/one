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
    
    class Vdc 
        include DataMapper::Resource
        include OpenNebulaJSON::JSONUtils
        extend OpenNebulaJSON::JSONUtils

        property :id,            Serial
        property :name,          String, :required => true, :unique => true
        property :vdcadminname,  String, :required => true
        property :acls,          String
        property :hosts,         String

        belongs_to :zones
        
        def self.to_hash
            zonePoolHash = Hash.new
            zonePoolHash["VDC_POOL"] = Hash.new
            zonePoolHash["VDC_POOL"]["VDC"] = Array.new unless self.all.empty?
            self.all.each{|vdc|
                  zonePoolHash["VDC_POOL"]["VDC"] << vdc.attributes              
            }
            return zonePoolHash
        end
        
        def to_hash
            vdc_attributes = Hash.new
            vdc_attributes["VDC"] = attributes
            return vdc_attributes
        end
    end
    
end
