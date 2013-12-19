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

require 'OpenNebulaJSON/JSONUtils'

module OpenNebulaJSON
    class GroupJSON < OpenNebula::Group
        include JSONUtils

        def create(template_json)
            group_hash = parse_json(template_json,'group')
            if OpenNebula.is_error?(group_hash)
                return group_hash
            end

            rc_alloc = self.allocate(group_hash['name'])

            if OpenNebula.is_error?(rc_alloc)
                return rc_alloc
            end

            # If we have resource providers, add them
            if group_hash['cluster_ids']
                for cid in group_hash['cluster_ids']
                    # TODO 0 is zone_id
                    self.add_provider({"zone_id"=>0, "cluster_id"=>cid.to_i})
                end
            else # No Resource provider
                 # This rule allows users in the group to deploy VMs 
                 # in any host in the cloud
                acls = Array.new
                acls << "@#{self.id} HOST/* MANAGE"
                rc, tmp = create_group_acls(acls)
                if OpenNebula.is_error?(rc)
                    self.delete
                    return -1, "Error creating rule #{rule}: #{rc.message}"
                end
            end

            # Set default ACLs for group
            rc_acl, msg = self.create_acls
            if rc_acl == -1
                self.delete
                return rc_acl
            end

            # Create admin group
            if group_hash['admin_group']
                admin_group = OpenNebula::Group.new(OpenNebula::Group.build_xml, 
                                                    @client)
                rc_alloc = admin_group.allocate(group_hash['admin_group'])
                if OpenNebula.is_error?(rc_alloc)
                    # Rollback
                    self.delete
                    return rc_alloc
                end

                # Create group admin user
                if group_hash['user'] and group_hash['user']['name'] and
                   group_hash['user']['password']
                    user = OpenNebula::User.new(OpenNebula::User.build_xml,
                                                @client)
                    rc_alloc = user.allocate(group_hash['user']['name'],
                                             group_hash['user']['password'],
                                             group_hash['user']['auth_driver'])

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
                            "VM+IMAGE+TEMPLATE/@#{self.id} USE+MANAGE"

                    rc, tmp = create_group_acls(acls)

                    if OpenNebula.is_error?(rc)
                        self.delete
                        return -1, "Error creating acl rules"
                    end
                end
            end

            return rc_alloc
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "chown"       then self.chown(action_hash['params'])
                 when "set_quota"   then self.set_quota(action_hash['params'])
                 when "add_provider"    then self.add_provider(action_hash['params'])
                 when "del_provider"    then self.del_provider(action_hash['params'])
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def chown(params=Hash.new)
            super(params['owner_id'].to_i)
        end

        def set_quota(params=Hash.new)
            quota_json = params['quotas']
            quota_template = template_to_str(quota_json)
            super(quota_template)
        end

        def add_provider(params=Hash.new)
            super(params['zone_id'].to_i, params['cluster_id'].to_i)
        end

        def del_provider(params=Hash.new)
            super(params['zone_id'].to_i, params['cluster_id'].to_i)
        end

        # Creates an acl array of acl strings. Returns true or error and
        # a comma-separated list with the new acl ids
        def create_group_acls(acls)
            `echo "ACLS #{acls}" >> /tmp/uu`
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
    end
end
