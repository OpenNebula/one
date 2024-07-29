# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'json'
require 'OpenNebulaJSON/JSONUtils'
require 'sunstone_2f_auth'

begin
    require "SunstoneWebAuthn"
rescue LoadError
end

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
                          user_hash['auth_driver'],
                          user_hash['gids'])
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "enable"  then self.enable
                 when "disable" then self.disable
                 when "passwd"                  then self.passwd(action_hash['params'])
                 when "chgrp"                   then self.chgrp(action_hash['params'])
                 when "chauth"                  then self.chauth(action_hash['params'])
                 when "update"                  then self.update(action_hash['params'])
                 when "enable_two_factor_auth"  then self.enable_two_factor_auth(action_hash['params'])
                 when "disable_two_factor_auth" then self.disable_two_factor_auth(action_hash['params'])
                 when "enable_security_key"     then self.enable_security_key(action_hash['params'])
                 when "disable_security_key"    then self.disable_security_key(action_hash['params'])
                 when "set_quota"               then self.set_quota(action_hash['params'])
                 when "addgroup"                then self.addgroup(action_hash['params'])
                 when "delgroup"                then self.delgroup(action_hash['params'])
                 when "login"                   then self.login(action_hash['params'])
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

        def enable_two_factor_auth(params=Hash.new)
            unless Sunstone2FAuth.authenticate(params["secret"], params["token"])
              return OpenNebula::Error.new("Invalid token.")
            end

            sunstone_setting = { 
                "sunstone" => params["current_sunstone_setting"].merge("TWO_FACTOR_AUTH_SECRET" => params["secret"]) 
            }
            template_raw = template_to_str(sunstone_setting)
            update_params = { "template_raw" => template_raw, "append" => true }
            update(update_params)
        end

        def disable_two_factor_auth(params=Hash.new)
            sunstone_setting = params["current_sunstone_setting"]
            sunstone_setting.delete("TWO_FACTOR_AUTH_SECRET")
            if !params['delete_all'].nil? && params['delete_all'] == true
                sunstone_setting.delete("WEBAUTHN_CREDENTIALS")
            end
            sunstone_setting = { "sunstone" => sunstone_setting }
            template_raw = template_to_str_sunstone_with_explicite_empty_value(sunstone_setting)
            update_params = { "template_raw" => template_raw, "append" => true }
            update(update_params)
        end

        def enable_security_key(params=Hash.new)
            if !$conf[:webauthn_avail]
                return OpenNebula::Error.new("WebAuthn not available.")
            end
            sunstone_setting = params["current_sunstone_setting"]
            webauthn_credential = SunstoneWebAuthn.verifyCredentialFromRegistration(@pe_id, params['publicKeyCredential'])
            template_credentials = self['TEMPLATE/SUNSTONE/WEBAUTHN_CREDENTIALS'] || "{'cs':[]}"
            credentials = parse_json(template_credentials.gsub("'", '"'), 'cs')
            credentials.append({
                'id'   => webauthn_credential.id,
                'pk'   => webauthn_credential.public_key,
                'cnt'  => webauthn_credential.sign_count,
                'name' => params['nickname']
            })
            sunstone_setting["WEBAUTHN_CREDENTIALS"] = JSON.generate({ "cs" => credentials}).gsub('"', "'")
            sunstone_setting = { "sunstone" => sunstone_setting }
            template_raw = template_to_str_sunstone_with_explicite_empty_value(sunstone_setting)
            update_params = { "template_raw" => template_raw, "append" => true }
            update(update_params)
        end

        def disable_security_key(params=Hash.new)
            sunstone_setting = params["current_sunstone_setting"]
            credentials = parse_json(sunstone_setting["WEBAUTHN_CREDENTIALS"].gsub("'", '"'), 'cs')
            for i in 0..credentials.length() do
                if credentials[i]["pk"] == params["tokenid_to_remove"]
                    credentials.delete_at(i)
                    break
                end
            end
            sunstone_setting["WEBAUTHN_CREDENTIALS"] = JSON.generate({ "cs" => credentials}).gsub('"', "'")
            sunstone_setting = { "sunstone" => sunstone_setting }
            template_raw = template_to_str_sunstone_with_explicite_empty_value(sunstone_setting)
            update_params = { "template_raw" => template_raw, "append" => true }
            update(update_params)
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
            expire  = params['expire'].nil? ? 36000 : params['expire'].to_i
            egid    = params['egid'].nil? ? -1 : params['egid'].to_i

            super(username, token, expire, egid)
        end

    end
end
