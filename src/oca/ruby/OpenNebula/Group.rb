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


require 'OpenNebula/Pool'

module OpenNebula
    class Group < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        GROUP_METHODS = {
            :info     => "group.info",
            :allocate => "group.allocate",
            :delete   => "group.delete",
            :quota    => "group.quota"
        }

        # Flag for requesting connected user's group info
        SELF = -1

        #Default location for group ACL's
        if ENV['ONE_LOCATION']
            GROUP_DEFAULT = ENV['ONE_LOCATION'] + "/etc/group.default"
        else
            GROUP_DEFAULT = "/etc/one/group.default"
        end

        # Creates a Group description with just its identifier
        # this method should be used to create plain Group objects.
        # +id+ the id of the user
        #
        # Example:
        #   group = Group.new(Group.build_xml(3),rpc_client)
        #
        def Group.build_xml(pe_id=nil)
            if pe_id
                group_xml = "<GROUP><ID>#{pe_id}</ID></GROUP>"
            else
                group_xml = "<GROUP></GROUP>"
            end

            XMLElement.build_xml(group_xml,'GROUP')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)
        end

        #######################################################################
        # Group utils
        #######################################################################

        # Creates ACLs for the group. The ACL rules are described in a file
        def create_acls(filename = GROUP_DEFAULT)
            if !File.readable?(filename)
                return -1, "Cannot read deafult ACL file for group"
            end

            msg = String.new

            File.open(filename).each_line{ |l|
                next if l.match(/^#/)

                rule  = "@#{@pe_id} #{l}"
                parse = OpenNebula::Acl.parse_rule(rule)

                if OpenNebula.is_error?(parse)
                    return -1, "Error parsing rule #{rule}: #{parse.message}"
                end

                xml = OpenNebula::Acl.build_xml
                acl = OpenNebula::Acl.new(xml, @client)

                rc = acl.allocate(*parse)

                if OpenNebula.is_error?(rc)
                    return -1, "Error creating rule #{rule}: #{rc.message}"
                else
                    msg << "ACL_ID: #{acl.id}\n"
                end
            }

            return 0, msg
        end

        #######################################################################
        # XML-RPC Methods for the Group Object
        #######################################################################

        # Retrieves the information of the given Group.
        def info()
            super(GROUP_METHODS[:info], 'GROUP')
        end

        # Allocates a new Group in OpenNebula
        #
        # +groupname+ A string containing the name of the Group.
        def allocate(groupname)
            super(GROUP_METHODS[:allocate], groupname)
        end

        # Deletes the Group
        def delete()
            super(GROUP_METHODS[:delete])
        end

        # Sets the group quota limits
        # @param quota [String] a template (XML or txt) with the new quota limits 
        # 
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def set_quota(quota)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(GROUP_METHODS[:quota],@pe_id, quota)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # ---------------------------------------------------------------------
        # Helpers to get information
        # ---------------------------------------------------------------------

        # Returns whether or not the user with id 'uid' is part of this group
        def contains(uid)
            #This doesn't work in ruby 1.8.5
            #return self["USERS/ID[.=#{uid}]"] != nil

            id_array = retrieve_elements('USERS/ID')
            return id_array != nil && id_array.include?(uid.to_s)
        end

        # Returns an array with the numeric user ids
        def user_ids
            array = Array.new

            self.each("USERS/ID") do |id|
                array << id.text.to_i
            end

            return array
        end
    end
end
