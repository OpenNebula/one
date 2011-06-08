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

require 'OpenNebulaJSON/JSONUtils'

module OpenNebulaJSON
    class UserJSON < OpenNebula::User
        include JSONUtils

        def create(template_json)
            user_hash = parse_json(template_json, 'user')
            if OpenNebula.is_error?(user_hash)
                return user_hash
            end

            password = Digest::SHA1.hexdigest(user_hash['password'])
            self.allocate(user_hash['name'], password)
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "passwd" then self.passwd(action_hash['params'])
                 when "chgrp"        then self.chgrp(action_hash['params'])
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def passwd(params=Hash.new)
            password = Digest::SHA1.hexdigest(params['password'])
            super(password)
        end

        def chgrp(params=Hash.new)
            super(params['group_id'])
        end
    end
end
