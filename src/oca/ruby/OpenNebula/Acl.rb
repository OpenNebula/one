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

require 'OpenNebula/Pool'

module OpenNebula
    class Acl < XMLElement

        #######################################################################
        # Constants and Class Methods
        #######################################################################
        ACL_METHODS = {
            :info       => "acl.info",
            :addrule    => "acl.addrule",
            :delrule    => "acl.delrule"
        }

        #######################################################################
        # Class constructor
        #######################################################################
        def initialize(client)
            @client = client
        end

        #######################################################################
        # XML-RPC Methods
        #######################################################################

        # Retrieves the ACL rule set
        def info()
            rc = @client.call( ACL_METHODS[:info] )

            if !OpenNebula.is_error?(rc)
                initialize_xml(rc, 'ACL')
                rc = nil
            end

            return rc
        end

        # Adds a new ACL rule.
        #
        # +user+ A hex number, e.g. 0x100000001
        # +resource+ A hex number, e.g. 0x2100000001
        # +rights+ A hex number, e.g. 0x10
        def addrule(user, resource, rights)
            rc = @client.call( ACL_METHODS[:addrule], user, resource, rights )

            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end
        
        # Adds a new ACL rule.
        #
        # +rule+ Rule class
        def addrule(rule)
            return rule.error if rule.is_error?
                            
            rc = @client.call( ACL_METHODS[:addrule], rule.user, 
                                                      user.resources, 
                                                      user.rights )

            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Deletes an existing ACL rule.
        #
        # +id+ Rule id
        def delrule(id)
            rc = @client.call( ACL_METHODS[:delrule], id.to_i )

            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        #######################################################################
        # Helpers
        #######################################################################

    private

    end


    # Abstract rules of the type USER RESOURCE RIGHTS
    # which are:
    #     USER      -> #<num>
    #                  @<num>
    #                  ALL
    #     RESOURCE  -> + separated list and "/{#,@}<num>|ALL"
    #                  VM,
    #                  HOST
    #                  NET
    #                  IMAGE
    #                  USER
    #                  TEMPLATE
    #                  GROUP
    #                  ACL
    #     RIGHTS    -> + separated list
    #                  CREATE
    #                  DELETE
    #                  USE
    #                  MANAGE
    #                  INFO
    #                  INFO_POOL
    #                  INFO_POOL_MINE
    #                  INSTANTIATE
    #                  CHOWN
    class Rule 
        
        USERS = {
            "UID"           => 4294967296,
            "GID"           => 8589934592,
            "ALL"           => 17179869184
        } 
        
        
        RESOURCES = {
            "VM"            => 68719476736,
            "HOST"          => 137438953472,
            "NET"           => 274877906944,
            "IMAGE"         => 549755813888,
            "USER"          => 1099511627776,
            "TEMPLATE"      => 2199023255552,
            "GROUP"         => 4398046511104,
            "ACL"           => 8796093022208
        }
        
        RIGHTS =  {                                                                     
            "CREATE"        => 1,  # Auth. to create an object                
            "DELETE"        => 2,  # Auth. to delete an object                
            "USE"           => 4,  # Auth. to use an object                   
            "MANAGE"        => 8,  # Auth. to manage an object                
            "INFO"          => 16, # Auth. to view an object                  
            "INFO_POOL"     => 32, # Auth. to view any object in the pool     
            "INFO_POOL_MINE"=> 64, # Auth. to view user and/or group objects  
            "INSTANTIATE"   => 128,# Auth. to instantiate a VM from a TEMPLATE
            "CHOWN"         => 256 # Auth. to change ownership of an object   
        }
        
        
        def initialize(rule_str=nil)
            @content = {
                :users      =>  0,
                :resources  =>  0,
                :rights     =>  0
            }
            
            parse_rule(rule_str) if rule_str
        end
        
        def set_hex_rule(users,resources,rights)
            set_hex_users     users
            set_hex_resources resources
            set_hex_rights    rights
        end
        
        def set_hex_users(users)
            @content[:users] = users
        end
        
        def set_hex_resources(resources)
            @content[:resources] = resources
        end
        
        def set_hex_rights(rights)
            @content[:rights] = rights
        end 
        
        def parse_rule(rule_str)
            begin
                rule_str = rule_str.split(" ")
                parse_users(rule_str[0])
                parse_resource(rule_str[1])
                parse_rights(rule_str[2])
            rescue Exception  => e
                @content[:users] = OpenNebula::Error.new(e.message)
            end
        end
        
        def parse_users(users)
           begin
               @content[:users] = calculate_users(users)  
           rescue Exception  => e
               @content[:resources] = OpenNebula::Error.new(e.message)
           end
        end
                
        def parse_resources(resources)
            begin
                resources = resources.split("/")
            
                if resources.size != 2
                    @content[:resources] = OpenNebula::Error.new(
                                "Resource #{resources} not well formed")
                    return
                end

                resources[0].each{ |resource|
                    next if !RESOURCES[resource.upcase]
                
                    @content[:resources] = @content[:resources] 
                                           + RESOURCES[resource.upcase]
                }  
            
                @content[:resources] = @content[:resources] + 
                                       calculate_user(resources[1])
            
                @content[:resources] = @content[:resources].to_s(16) 
            rescue Exception  => e
                @content[:resources] = OpenNebula::Error.new(e.message)
            end        
        end
        
        def parse_rights(rights)
            begin
                rights = rights.split("+")
            
                rights.each{ |right|
                    next if !RIGHTS[right.upcase]
                
                    @content[:rights] = @content[:rights] + RIGHTS[right.upcase]
                }
            
                @content[:rights] = @content[:rights].to_s(16) 
            rescue Exception  => e
                @content[:rights] = OpenNebula::Error.new(e.message)
            end     
        end
        
        
        def calculate_users(users_str)
            if users == "*"
                return USERS["ALL"]
            end  
            
            value = 0     
            
            case users[0..0]
                when "#"
                    value = USERS["UID"]
                when "@"
                    value = USERS["GID"]
            end
            
            return value + users[1..-1].to_i    
        end
        
        def users
            @content[:users]
        end
        
        def resources
            @content[:resources]
        end
        
        def rights
            @content[:rights]
        end
        
        def is_error?
            OpenNebula.is_error?(@content[:users]) || 
            OpenNebula.is_error?(@content[:resources]) || 
            OpenNebula.is_error?(@content[:rights]) 
        end
        
        def error            
            @content.each{ |part|
                return part if OpenNebula.is_error?(part)
            }
        end
        
    end
end
