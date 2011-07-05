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

module OpenNebula
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
    class Acl

        USERS = {
            "UID"           => 0x100000000,
            "GID"           => 0x200000000,
            "ALL"           => 0x400000000
        }
        RESOURCES =
        {
            "VM"            => 0x1000000000,
            "HOST"          => 0x2000000000,
            "NET"           => 0x4000000000,
            "IMAGE"         => 0x8000000000,
            "USER"          => 0x10000000000,
            "TEMPLATE"      => 0x20000000000,
            "GROUP"         => 0x40000000000
        }

        RIGHTS =
        {
            "CREATE"        => 0x1,  # Auth. to create an object
            "DELETE"        => 0x2,  # Auth. to delete an object
            "USE"           => 0x4,  # Auth. to use an object
            "MANAGE"        => 0x8,  # Auth. to manage an object
            "INFO"          => 0x10, # Auth. to view an object
            "INFO_POOL"     => 0x20, # Auth. to view any object in the pool
            "INFO_POOL_MINE"=> 0x40, # Auth. to view user and/or group objects
            "INSTANTIATE"   => 0x80, # Auth. to instantiate a VM from a TEMPLATE
            "CHOWN"         => 0x100 # Auth. to change ownership of an object
        }

        def initialize(rule_str=nil)
            # Content stores numbers
            @content = {
                :users         =>  0,
                :resources     =>  0,
                :rights        =>  0
            }

            parse_rule(rule_str) if rule_str
        end

        def parse_rule(rule_str)
            begin
                rule_str = rule_str.split(" ")
                parse_users(rule_str[0])
                parse_resources(rule_str[1])
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

                resources[0].split("+").each{ |resource|
                    if !RESOURCES[resource.upcase]
                        raise "Resource #{resource} malformed." 
                    end
                    @content[:resources] += RESOURCES[resource.upcase]
                }

                @content[:resources] += calculate_users(resources[1])

            rescue Exception  => e
                @content[:resources] = OpenNebula::Error.new(e.message)
            end
        end

        def parse_rights(rights)
            begin
                rights = rights.split("+")

                rights.each{ |right|
                    raise "Right #{right} malformed." if !RIGHTS[right.upcase]

                    @content[:rights] += RIGHTS[right.upcase]
                }

            rescue Exception  => e
                @content[:rights] = OpenNebula::Error.new(e.message)
            end
        end


        def calculate_users(users_str)
            if users_str == "*"
                return USERS["ALL"]
            end

            value = 0

            case users_str[0..0]
                when "#"
                    value = USERS["UID"]
                when "@"
                    value = USERS["GID"]
            end

            users_value = users_str[1..-1].to_i + value

            return users_value
        end

        def users_hex_str
            @content[:users].to_i.to_s(16)
        end

        def resources_hex_str
            @content[:resources].to_i.to_s(16)
        end

        def rights_hex_str
            @content[:rights].to_i.to_s(16)
        end

        def is_error?
            OpenNebula.is_error?(@content[:users]) ||
            OpenNebula.is_error?(@content[:resources]) ||
            OpenNebula.is_error?(@content[:rights]) ||
            @content[:users] == 0 ||
            @content[:resources] == 0 ||
            @content[:rights] == 0
        end

        def error
            @content.each{ |part|
                return part if OpenNebula.is_error?(part)
            }
        end

    end
end
