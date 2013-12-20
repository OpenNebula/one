# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        #
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


require 'opennebula/pool_element'

module OpenNebula
    class Group < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        GROUP_METHODS = {
            :info           => "group.info",
            :allocate       => "group.allocate",
            :delete         => "group.delete",
            :quota          => "group.quota",
            :add_provider   => "group.addprovider",
            :del_provider   => "group.delprovider"
        }

        # Flag for requesting connected user's group info
        SELF = -1

        #Default resource ACL's for group for group ACL's
        GROUP_DEFAULT_ACLS = "VM+NET+IMAGE+TEMPLATE"

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
        # XML-RPC Methods for the Group Object
        #######################################################################

        # Retrieves the information of the given Group.
        def info()
            super(GROUP_METHODS[:info], 'GROUP')
        end

        alias_method :info!, :info

        def create(group_hash)
            group_hash=Hash[group_hash.map{|(k,v)| [k.to_sym,v]}]
            if group_hash[:user]
                group_hash[:user]=Hash[group_hash[:user].map{|(k,v)| 
                                       [k.to_sym,v]}]
            end

            rc_alloc = self.allocate(group_hash[:name])

            if OpenNebula.is_error?(rc_alloc)
                return rc_alloc
            end

            # Handle resource providers
            if group_hash[:resource_providers]
                for rp in group_hash[:resource_providers]
                    # If we have resource providers, add them
                    if rp[:cluster_ids] and rp[:cluster_ids]
                        for cid in rp[:cluster_ids]
                            self.add_provider({"zone_id"=>rp[:zone_id],
                                               "cluster_id"=>cid.to_i})
                        end
                    end
                end
            end

            rc, msg = create_default_acls(group_hash[:resources])
            if OpenNebula.is_error?(rc)
                self.delete
                return -1, "Error creating ACL's #{acls}: #{rc.message}"
            end

            # Create admin group
            if group_hash[:admin_group]
                admin_group = OpenNebula::Group.new(OpenNebula::Group.build_xml, 
                                                    @client)
                rc_alloc = admin_group.allocate(group_hash[:admin_group])
                if OpenNebula.is_error?(rc_alloc)
                    # Rollback
                    self.delete
                    return rc_alloc
                end

                # Create group admin user
                if group_hash[:user] and group_hash[:user][:name] and
                   group_hash[:user][:password]
                    user = OpenNebula::User.new(OpenNebula::User.build_xml,
                                                @client)
                    if !group_hash[:user][:auth_driver]
                    rc_alloc = user.allocate(group_hash[:user][:name],
                                             group_hash[:user][:password])
                    else
                    rc_alloc = user.allocate(group_hash[:user][:name],
                                             group_hash[:user][:password],
                                             group_hash[:user][:auth_driver])
                    end

                    if OpenNebula.is_error?(rc_alloc)
                        # Rollback
                        admin_group.delete
                        self.delete
                        return rc_alloc
                    end

                    rc_alloc = user.chgrp(self.id)

                    if OpenNebula.is_error?(rc_alloc)
                        # Rollback
                        user.delete
                        admin_group.delete
                        self.delete
                        return rc_alloc
                    end

                    rc_alloc = user.addgroup(admin_group.id)

                    if OpenNebula.is_error?(rc_alloc)
                        # Rollback
                        user.delete
                        admin_group.delete
                        self.delete
                        return rc_alloc
                    end

                    # Set ACLs for group admin
                    acls = Array.new

                    acls << "@#{admin_group.id} USER/* CREATE"
                    acls << "@#{admin_group.id} USER/@#{self.id} " \
                            "USE+MANAGE+ADMIN"
                    acls << "@#{admin_group.id} " \
                            "VM+IMAGE+NET+TEMPLATE/@#{self.id} USE+MANAGE"

                    rc, tmp = create_group_acls(acls)

                    if OpenNebula.is_error?(rc)
                        user.delete
                        admin_group.delete                        
                        self.delete
                        return -1, "Error creating acl rules"
                    end
                end
            end
            return rc_alloc
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

        # Adds a resource provider to this group
        # @param zone_id [Integer] Zone ID
        # @param cluster_id [Integer] Cluster ID
        # 
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def add_provider(zone_id, cluster_id)
            return call(GROUP_METHODS[:add_provider], @pe_id, zone_id.to_i, cluster_id.to_i)
        end

        # Deletes a resource provider from this group
        # @param zone_id [Integer] Zone ID
        # @param cluster_id [Integer] Cluster ID
        # 
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def del_provider(zone_id, cluster_id)
            return call(GROUP_METHODS[:del_provider], @pe_id, zone_id.to_i, cluster_id.to_i)
        end

        #######################################################################
        # Group utils
        #######################################################################
        # Creates an acl array of acl strings. Returns true or error and
        # a comma-separated list with the new acl ids
        def create_group_acls(acls)
            acls_ids = Array.new
            rc       = true

            acls.each{|rule|
                acl = OpenNebula::Acl.new(OpenNebula::Acl.build_xml,@client)
                rc  = acl.allocate(*OpenNebula::Acl.parse_rule(rule))
                break if OpenNebula.is_error?(rc)

                acls_ids << acl.id
            }

            return rc, acls_ids
        end

        def create_default_acls(resources=nil)
            resources = GROUP_DEFAULT_ACLS if !resources
            acls = Array.new
            acls << "@#{self.id} #{resources}/* CREATE"
            create_group_acls(acls)
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
