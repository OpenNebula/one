# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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
            :add_admin      => "group.addadmin",
            :del_admin      => "group.deladmin",
        }

        # Flag for requesting connected user's group info
        SELF = -1

        # Default resource ACL's for group users (create)
        GROUP_DEFAULT_ACLS = "VM+IMAGE+TEMPLATE+DOCUMENT+SECGROUP+VROUTER+VMGROUP+BACKUPJOB"

        # The default view for group and group admins, must be defined in
        # sunstone_views.yaml
        GROUP_ADMIN_SUNSTONE_VIEWS = "groupadmin"

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
        #   group_hash[:views] Array of sunstone view names, to be stored
        #       in SUNSTONE_VIEWS
        #   group_hash[:default_view] Default sunstone view name, to be stored
        #       in DEFAULT_VIEW
        #   group_hash[:admin_views] Array of sunstone view names, to be stored
        #       in GROUP_ADMIN_VIEWS
        #   group_hash[:default_admin_view] Default sunstone view name, to be stored
        #       in DEFAULT_ADMIN_DEFAULT_VIEW
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
            rc = allocate(group_hash[:name])
            return rc if OpenNebula.is_error?(rc)

            # Set group ACLs to create resources
            rc, msg = create_default_acls(group_hash[:resources])

            if OpenNebula.is_error?(rc)
                delete
                error_msg =  "Error creating group ACL's: #{rc.message}"
                return OpenNebula::Error.new(error_msg)
            end

            # Set group ACLs to share resources
            if group_hash[:shared_resources]
                acls = Array.new
                acls << "@#{id} #{group_hash[:shared_resources]}/@#{id} USE"

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
                delete
                error_msg =  "Error creating admin user: #{rc.message}"
                return OpenNebula::Error.new(error_msg)
            end

            sunstone_attrs = []

            # Add Sunstone views for the group
            if group_hash[:views]
                sunstone_attrs << "VIEWS=\"#{group_hash[:views].join(",")}\""
            end

            if group_hash[:default_view]
                sunstone_attrs << "DEFAULT_VIEW=\"#{group_hash[:default_view]}\""
            end

            # And the admin views
            if group_hash[:admin_views]
                sunstone_attrs << "GROUP_ADMIN_VIEWS=\"#{group_hash[:admin_views].join(",")}\""
            else
                sunstone_attrs << "GROUP_ADMIN_VIEWS=#{GROUP_ADMIN_SUNSTONE_VIEWS}"
            end

            if group_hash[:default_admin_view]
                sunstone_attrs << "GROUP_ADMIN_DEFAULT_VIEW=\"#{group_hash[:default_admin_view]}\""
            else
                sunstone_attrs << "GROUP_ADMIN_DEFAULT_VIEW=#{GROUP_ADMIN_SUNSTONE_VIEWS}"
            end

            do_update = false

            if sunstone_attrs.length > 0
                do_update = true

                update_str = "SUNSTONE=[#{sunstone_attrs.join(",\n")}]\n"
            end

            opennebula_attrs = []

            # Persistency attributes for new images
            if group_hash[:opennebula]
                if group_hash[:opennebula][:default_image_persistent]
                    opennebula_attrs << "DEFAULT_IMAGE_PERSISTENT=\""\
                        "#{group_hash[:opennebula][:default_image_persistent]}\""
                end

                if group_hash[:opennebula][:default_image_persistent_new]
                    opennebula_attrs << "DEFAULT_IMAGE_PERSISTENT_NEW=\""\
                        "#{group_hash[:opennebula][:default_image_persistent_new]}\""
                end
            end

            if opennebula_attrs.length > 0
                do_update = true

                update_str += "OPENNEBULA=[#{opennebula_attrs.join(",\n")}]\n"
            end

            if do_update
                rc = update(update_str, true)

                if OpenNebula.is_error?(rc)
                    delete
                    error_msg =  "Error updating group template: #{rc.message}"
                    return OpenNebula::Error.new(error_msg)
                end
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

        # Adds a User to the Group administrators set
        # @param user_id [Integer] User ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def add_admin(user_id)
            return call(GROUP_METHODS[:add_admin], @pe_id, user_id.to_i)
        end

        # Removes a User from the Group administrators set
        # @param user_id [Integer] User ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def del_admin(user_id)
            return call(GROUP_METHODS[:del_admin], @pe_id, user_id.to_i)
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

        # Returns whether or not the user with id 'uid' is an admin of this group
        def contains_admin(uid)
            #This doesn't work in ruby 1.8.5
            #return self["ADMINS/ID[.=#{uid}]"] != nil

            id_array = retrieve_elements('ADMINS/ID')
            return id_array != nil && id_array.include?(uid.to_s)
        end

        # Returns an array with the numeric user ids
        def user_ids
            ids = self.retrieve_elements("USERS/ID")

            return [] if ids.nil?

            return ids.collect! {|x| x.to_i}
        end

        # Returns an array with the numeric admin user ids
        def admin_ids
            ids = self.retrieve_elements("ADMINS/ID")

            return [] if ids.nil?

            return ids.collect! {|x| x.to_i}
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
            return if resources && resources.strip.empty?

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
                    rc = group_admin.allocate(uadmin, upasswd, udriver, [self.id])
                else
                    rc = group_admin.allocate(uadmin, upasswd, nil, [self.id])
                end

                if OpenNebula.is_error?(rc)
                    return rc
                end
            end

            rc = self.add_admin(group_admin.id)

            if OpenNebula.is_error?(rc)
                group_admin.delete
                return rc
            end

            return nil
        end
    end
end

