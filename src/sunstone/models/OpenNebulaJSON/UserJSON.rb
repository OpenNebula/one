# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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
    class UserJSON < OpenNebula::User
        include JSONUtils

        def create(template_json)
            user_hash = parse_json(template_json, 'user')
            if OpenNebula.is_error?(user_hash)
                return user_hash
            end

            self.allocate(user_hash['name'],
                          user_hash['password'],
                          user_hash['auth_driver'])
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "passwd"       then self.passwd(action_hash['params'])
                 when "chgrp"        then self.chgrp(action_hash['params'])
                 when "chauth"       then self.chauth(action_hash['params'])
                 when "update"       then self.update(action_hash['params'])
                 when "set_quota"    then self.set_quota(action_hash['params'])
                 when "addgroup"     then self.addgroup(action_hash['params'])
                 when "delgroup"     then self.delgroup(action_hash['params'])
                 when "login"        then self.login(action_hash['params'])
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def passwd(params=Hash.new)
            super(params['password'])
        end

        def chgrp(params=Hash.new)
            super(params['group_id'].to_i)
        end

        def chauth(params=Hash.new)
            super(params['auth_driver'])
        end

        def update(params=Hash.new)
            if !params['append'].nil?
                super(params['template_raw'], params['append'])
            else
                super(params['template_raw'])
            end
        end

        def set_quota(params=Hash.new)
            quota_json = params['quotas']
            quota_template = template_to_str(quota_json)
            super(quota_template)
        end

        def addgroup(params=Hash.new)
            super(params['group_id'].to_i)
        end

        def delgroup(params=Hash.new)
            super(params['group_id'].to_i)
        end

        def login(params=Hash.new)
            username = params['username'].nil? ? "" : params['username']
            token   = params['token'].nil? ? "" : params['token']
            expire  = params['expire'].nil? ? 36000 : params['expire']

            super(username, token, expire)
        end

    end
end
