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
    #                  USE
    #                  MANAGE
    #                  ADMIN
    #                  CREATE
    class Acl < PoolElement

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
            "GROUP"         => 0x40000000000,
            "DATASTORE"     => 0x100000000000,
            "CLUSTER"       => 0x200000000000
        }

        RIGHTS =
        {
            "USE"           => 0x1,  # Auth. to use an object
            "MANAGE"        => 0x2,  # Auth. to perform management actions
            "ADMIN"         => 0x4,  # Auth. to perform administrative actions
            "CREATE"        => 0x8   # Auth. to create an object
        }

        # Constructor
        #
        # @param xml [String] must be an xml built with {#build_xml}
        # @param client [Client] represents an XML-RPC connection
        def initialize(xml, client)
            super(xml,client)
        end

        # Creates an empty XML representation. It contains the id, if it is
        # specified.
        #
        # @param pe_id [Integer] rule ID
        # @param client [Client] represents an XML-RPC connection
        #
        # @return [String] an empty XML representation
        def self.build_xml(pe_id=nil)
            if pe_id
                acl_xml = "<ACL><ID>#{pe_id}</ID></ACL>"
            else
                acl_xml = "<ACL></ACL>"
            end

            XMLElement.build_xml(acl_xml,'ACL')
        end

        # Creates a new ACL rule.
        #
        # @param user [String]
        #   A string containing a hex number, e.g. 0x100000001
        # @param resource [String]
        #   A string containing a hex number, e.g. 0x2100000001
        # @param rights [String]
        #   A string containing a hex number, e.g. 0x10
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(user, resource, rights)
            return super( AclPool::ACL_POOL_METHODS[:addrule],
                          user,
                          resource,
                          rights )
        end

        # Deletes the Acl rule
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def delete()
            super(AclPool::ACL_POOL_METHODS[:delrule])
        end

        # Does nothing, individual ACL rules info can't be retrieved from
        # OpenNebula
        #
        # @return [nil] nil
        def info()
            return nil
        end

        # Parses a rule string, e.g. "#5 HOST+VM/@12 INFO+CREATE+DELETE"
        #
        # @param rule_str [String] an ACL rule in string format
        #
        # @return [Array] an Array containing 3 strings (hex 64b numbers),
        # or OpenNebula::Error objects
        def self.parse_rule(rule_str)
            ret = Array.new

            rule_str = rule_str.split(" ")

            if rule_str.length != 3
                return OpenNebula::Error.new(
                    "String needs three components: User, Resource, Rights")
            end

            ret << parse_users(rule_str[0])
            ret << parse_resources(rule_str[1])
            ret << parse_rights(rule_str[2])

            errors=ret.map do |arg|
                if OpenNebula.is_error?(arg)
                    arg.message
                else
                    nil
                end
            end

            errors.compact!

            if errors.length>0
                return OpenNebula::Error.new(errors.join(', '))
            end

            return ret
        end

private

        # Converts a string in the form [#<id>, @<id>, *] to a hex. number
        #
        # @param users [String] Users component string
        #
        # @return [String] A string containing a hex number
        def self.parse_users(users)
           begin
               return calculate_ids(users).to_i.to_s(16)
           rescue Exception  => e
               return OpenNebula::Error.new(e.message)
           end
        end

        # Converts a resources string to a hex. number
        #
        # @param resources [String] Resources component string
        #
        # @return [String] A string containing a hex number
        def self.parse_resources(resources)
            begin
                ret = 0
                resources = resources.split("/")

                if resources.size != 2
                    raise "Resource '#{resources}' malformed"
                end

                resources[0].split("+").each{ |resource|
                    if !RESOURCES[resource.upcase]
                        raise "Resource '#{resource}' does not exist"
                    end
                    ret += RESOURCES[resource.upcase]
                }

                ret += calculate_ids(resources[1])

                return ret.to_i.to_s(16)
            rescue Exception  => e
                return OpenNebula::Error.new(e.message)
            end
        end

        # Converts a rights string to a hex. number
        #
        # @param rights [String] Rights component string
        #
        # @return [String] A string containing a hex number
        def self.parse_rights(rights)
            begin
                ret = 0
                rights = rights.split("+")

                rights.each{ |right|
                    raise "Right '#{right}' does not exist" if !RIGHTS[right.upcase]

                    ret += RIGHTS[right.upcase]
                }

                return ret.to_i.to_s(16)
            rescue Exception  => e
                return OpenNebula::Error.new(e.message)
            end
        end

        # Calculates the numeric value for a String containing an individual
        # (#<id>), group (@<id>) or all (*) ID component
        #
        # @param id_str [String] Rule Id string
        #
        # @return [Integer] the numeric value for the given id_str
        def self.calculate_ids(id_str)
            raise "ID string '#{id_str}' malformed" if
                !id_str.match(/^([\#@]\d+|\*)$/)

            value = 0

            case id_str[0..0]
                when "#"
                    value = USERS["UID"]
                    users_value = id_str[1..-1].to_i + value

                when "@"
                    value = USERS["GID"]
                    users_value = id_str[1..-1].to_i + value

                when "*"
                    users_value = USERS["ALL"]
            end

            return users_value
        end
    end
end
