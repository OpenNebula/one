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

            if !OpenNebula.is_error?(rc_alloc)
                return rc_alloc
            end

            if group_hash['cluster_ids']
                for cid in group_hash['cluster_ids']
                    # TODO 0 is zone_id
                    self.add_provider(0, cid)
                end
            else # No Resource provider
                 # This rule allows users in the group to deploy VMs 
                 # in any host in the cloud
                rule  = "@#{self.id} HOST/* MANAGE"
                parse = OpenNebula::Acl.parse_rule(rule)

                if OpenNebula.is_error?(parse)
                    self.delete
                    return -1, "Error parsing rule #{rule}: #{parse.message}"
                end

                xml = OpenNebula::Acl.build_xml
                acl = OpenNebula::Acl.new(xml, @client)

                rc = acl.allocate(*parse)

                if OpenNebula.is_error?(rc)
                    self.delete
                    return -1, "Error creating rule #{rule}: #{rc.message}"
                end
            end

            rc_acl, msg = self.create_acls
            if rc_acl == -1
                self.delete
                return rc_acl
            end

            if group_hash['admin_group']
                admin_group = OpenNebula::Group.new(OpenNebula::Group.build_xml, 
                                                    @client)
                rc_alloc = admin_group.allocate(group_hash['admin_group'])
                if !OpenNebula.is_error?(rc_alloc)
                    # Rollback
                    self.delete
                end

                if group_hash['admin_username'] and group_hash['admin_userpass']
                    user = OpenNebula::User.new(OpenNebula::User.build_xml,
                                                @client)
                    rc_alloc = user.allocate(group_hash['admin_username'],
                                             group_hash['admin_userpass'],
                                             group_hash['admin_userdriver'])

                    if !OpenNebula.is_error?(rc_alloc)
                        # Rollback
                        admin_group.delete
                        self.delete
                    end

                    rc_alloc = user.chgrp(self.id)

                    if !OpenNebula.is_error?(rc_alloc)
                        # Rollback
                        user.delete
                        admin_group.delete
                        self.delete
                    end

                    rc_alloc = user.addgroup(admin_group.id)

                    if !OpenNebula.is_error?(rc_alloc)
                        # Rollback
                        user.delete
                        admin_group.delete
                        self.delete
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
    end
end
