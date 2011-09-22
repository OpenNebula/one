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

        property :id,           Serial
        property :name,         String, :required => true, :unique => true
        property :group_id,     Integer
        property :vdcadminname, String, :required => true
        property :acls,         String
        property :hosts,        String

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

        #######################################################################
        #                    Methods to handle the ACL list
        #######################################################################
        # The ID of the first host ACL
        HOST_ACL_FIRST_ID = 3

        # This method returns an Array of ACL strings to create them 
        # in the target zone
        def get_vdc_acls_str(user_id, group_id)
            rule_str = Array.new

            # Grant permissions to the group
            rule_str << "@#{group_id} VM+NET+IMAGE+TEMPLATE/* " \
                        "CREATE+INFO_POOL_MINE"

            # Grant permissions to the vdc admin
            rule_str << "##{user_id} USER/* CREATE"
            rule_str << "##{user_id} USER/@#{group_id} MANAGE+DELETE+INFO"

            ###############################################################
            #When more rules are added the class constant HOST_ACL_FIRST_ID
            #must be modified
            ###############################################################

            rule_str.concat(self.get_host_acls_str(group_id))
        end

        def get_host_acls_str(group_id, host_list = nil)
            rule_str = Array.new

            if host_list == nil
                host_list = self.hosts
            end 

            # Grant permissions to use the vdc hosts
            host_list.split(',').each{|hostid|
                rule_str << "@#{group_id} HOST/##{hostid} USE"
            }    

            return rule_str
        end

        def get_host_acls
            self.acls.split(',')[HOST_ACL_FIRST_ID..-1].collect!{|x| x.to_i}
        end

        # Returns the host acls as an array of strings.
        # The acls of the VDC are updated and the host acl ids removed
        def get_host_acls!(new_host_acls = nil)
            acl_ids = self.acls.split(',')
            vdc_acl = acl_ids.slice!(0,HOST_ACL_FIRST_ID)

            newacl = ""
            vdc_acl.each{|id|
                newacl << id << ','
            }
             
            newacl.chomp
            newacl << new_host_acls if new_host_acls

            self.acls = newacl 

            return acl_ids
        end
    end
end
