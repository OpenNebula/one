# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
            :update         => "group.update",
            :delete         => "group.delete",
            :quota          => "group.quota",
            :add_provider   => "group.addprovider",
            :del_provider   => "group.delprovider"
        }

        # Flag for requesting connected user's group info
        SELF = -1

        # Default resource ACL's for group users (create)
        GROUP_DEFAULT_ACLS = "VM+IMAGE+TEMPLATE+DOCUMENT"
        ALL_CLUSTERS_IN_ZONE = 10

        # The default view for group and group admins, must be defined in
        # sunstone_views.yaml
        GROUP_ADMIN_SUNSTONE_VIEWS = "vdcadmin"

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

        # Creates a group based in a group definition hash
        #   group_hash[:name] the group name
        #   group_hash[:group_admin] the admin user definition hash, see def
        #   create_admin_user function description for details.
        #   group_hash[:resource_providers]
        #   group_hash[:resource_providers][:zone_id]
        #   group_hash[:resource_providers][:cluster_id]
        #   group_hash[:views] Array of sunstone view names, to be stored
        #       in SUNSTONE_VIEWS
        #   group_hash[:default_view] Default sunstone view name, to be stored
        #       in DEFAULT_VIEW
        #
        def create(group_hash)
            # Check arguments
            if !group_hash[:name]
                return OpenNebula::Error.new("Group name not defined")
            end

            if group_hash[:group_admin]
                if group_hash[:group_admin][:name] && !group_hash[:group_admin][:password]
                    error_msg = "Admin user password not defined"
                    return OpenNebula::Error.new(error_msg)
                end
            end

            # Allocate group
            rc = self.allocate(group_hash[:name])
            return rc if OpenNebula.is_error?(rc)

            # Handle resource providers
            group_hash[:resource_providers].each { |rp|
                next if rp[:zone_id].nil? && rp[:cluster_id].nil?

                if rp[:cluster_id].class == String && rp[:cluster_id] == "ALL"
                    add_provider(rp[:zone_id],ALL_CLUSTERS_IN_ZONE)
                else
                    add_provider(rp[:zone_id],rp[:cluster_id])
                end
            } if !group_hash[:resource_providers].nil?

            # Set group ACLs to create resources
            rc, msg = create_default_acls(group_hash[:resources])

            if OpenNebula.is_error?(rc)
                self.delete
                error_msg =  "Error creating group ACL's: #{rc.message}"
                return OpenNebula::Error.new(error_msg)
            end

            # Set group ACLs to share resources
            if group_hash[:shared_resources]
                acls = Array.new
                acls << "@#{self.id} #{group_hash[:shared_resources]}/@#{self.id} USE"

                rc, msg = create_group_acls(acls)

                if OpenNebula.is_error?(rc)
                    self.delete
                    error_msg =  "Error creating group ACL's: #{rc.message}"
                    return OpenNebula::Error.new(error_msg)
                end
            end

            # Create associated group admin if needed
            rc = create_admin_user(group_hash)

            if OpenNebula.is_error?(rc)
                self.delete
                error_msg =  "Error creating admin user: #{rc.message}"
                return OpenNebula::Error.new(error_msg)
            end

            str = ""
            update = false

            # Add Sunstone views for the group
            if group_hash[:views]
                str += "SUNSTONE_VIEWS=\"#{group_hash[:views].join(",")}\"\n"
                update = true
            end

            # Add Sunstone views for the group
            if group_hash[:default_view]
                str += "DEFAULT_VIEW=\"#{group_hash[:default_view]}\"\n"
                update = true
            end

            if update
                self.update(str, true)
            end

            return 0
        end

        # Allocates a new Group in OpenNebula
        #
        # +groupname+ A string containing the name of the Group.
        def allocate(groupname)
            super(GROUP_METHODS[:allocate], groupname)
        end

        # Replaces the template contents
        #
        # @param new_template [String] New template contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_template=nil, append=false)
            super(GROUP_METHODS[:update], new_template, append ? 1 : 0)
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

        private
        #######################################################################
        #######################################################################
        # Creates an acl array of acl strings. Returns true or error and
        # a qrray with the new acl ids
        def create_group_acls(acls)
            acls_ids = Array.new

            acls.each{|rule|

                acl = OpenNebula::Acl.new(OpenNebula::Acl.build_xml,@client)

                rule_ast = "#{rule} *" #Add all zone id's

                parsed_acl = OpenNebula::Acl.parse_rule(rule_ast)

                return parsed_acl, [] if OpenNebula.is_error?(parsed_acl)

                rc  = acl.allocate(*parsed_acl)

                return rc, "" if OpenNebula.is_error?(rc)

                acls_ids << acl.id
            }

            return true, acls_ids
        end

        def create_default_acls(resources=nil)
            resources = GROUP_DEFAULT_ACLS if !resources

            acls = Array.new
            acls << "@#{self.id} #{resources}/* CREATE"

            create_group_acls(acls)
        end

        # Creates a group admin and user based on the group definition hash
        # @param gdef [Hash] keys are ruby sumbols
        #     gdef[:group_admin] the group admin hash
        #     gdef[:group_admin][:name] username for group admin
        #     gdef[:group_admin][:password] password for group admin
        #     gdef[:group_admin][:auth_driver] auth driver for group admin
        #     gdef[:group_admin][:resources] resources that group admin manage
        #     gdef[:group_admin][:manage_resources] whether group admin manages
        #                                           group users
        #     gdef[:resources] resources that group users manage
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        def create_admin_user(gdef)

            return nil if gdef[:group_admin].nil? || gdef[:group_admin][:name].nil?

            # Create group admin
            uadmin  = gdef[:group_admin][:name]
            upasswd = gdef[:group_admin][:password]
            udriver = gdef[:group_admin][:auth_driver]

            if !uadmin.nil? && !upasswd.nil?

                group_admin = OpenNebula::User.new(OpenNebula::User.build_xml,
                                                   @client)

                if udriver
                    rc = group_admin.allocate(uadmin, upasswd, udriver)
                else
                    rc = group_admin.allocate(uadmin, upasswd)
                end

                if OpenNebula.is_error?(rc)
                    return rc
                end
            end

            # Set admin user groups to self
            rc = group_admin.chgrp(self.id)

            if OpenNebula.is_error?(rc)
                group_admin.delete
                return rc
            end

            # Set the default admin view to vdcadmin
            group_admin.update("DEFAULT_VIEW=#{GROUP_ADMIN_SUNSTONE_VIEWS}", true)

            #Create admin group acls
            acls = Array.new

            acls_str = (gdef[:group_admin][:resources] || \
                        gdef[:resources] || GROUP_DEFAULT_ACLS)

            manage_users = gdef[:group_admin][:manage_users] || "YES"

            if manage_users.upcase == "YES"
                acls << "##{group_admin.id} USER/@#{self.id} CREATE+USE+MANAGE+ADMIN"
            end

            acls << "##{group_admin.id} #{acls_str}/@#{self.id} " +
                    "CREATE+USE+MANAGE"

            rc, tmp = create_group_acls(acls)

            if OpenNebula.is_error?(rc)
                group_admin.delete
                return rc
            end

            #Set Sunstone Views for the group
            gtmpl =  "GROUP_ADMINS=#{gdef[:group_admin][:name]}\n"
            gtmpl << "GROUP_ADMIN_VIEWS=#{GROUP_ADMIN_SUNSTONE_VIEWS}\n"

            self.update(gtmpl, true)

            return nil
        end
    end
end

