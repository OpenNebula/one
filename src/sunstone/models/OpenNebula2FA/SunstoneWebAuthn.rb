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
require 'webauthn'

# WebAuthn authentication
module SunstoneWebAuthn

    def self.configure(conf={})
        options = { :subscriber_endpoint => conf[:subscriber_endpoint] }

        @client = OpenNebula::Client.new(nil, conf[:one_xmlrpc], options)

        @challenges = Hash.new
        WebAuthn.configure do |config|
            if !conf.include?(:webauthn_origin) || conf[:webauthn_origin] == ''
                raise StandardError.new("Configuration of ':webauthn_origin' is missing")
            end
            config.origin = conf[:webauthn_origin]

            if !conf.include?(:webauthn_rpname) || conf[:webauthn_rpname] == ''
                raise StandardError.new("Configuration of ':webauthn_rpname' is missing")
            end
            config.rp_name = conf[:webauthn_rpname]

            conf[:webauthn_timeout] ||= 60000
            config.credential_options_timeout = conf[:webauthn_timeout]

            if conf.include?(:webauthn_rpid) && conf[:webauthn_rpid] != ''
                config.rp_id = conf[:webauthn_rpid]
            end

            conf[:webauthn_algorithms] ||= ["ES256", "PS256", "RS256"]
            config.algorithms = conf[:webauthn_algorithms]
          end
    end

    def self.getOptionsForCreate(user_id, user_name)
        known_credentials = getCredentialIDsForUser(user_id)
        options = WebAuthn::Credential.options_for_create(
            user: { id: Base64.urlsafe_encode64(user_id, padding: false), name: user_name },
            authenticator_selection: { user_verification: 'discouraged' },
            exclude: known_credentials
        )
        @challenges[user_id] = options.challenge
        return renderJSON(options.as_json)
    end

    def self.getOptionsForGet(user_id)
        known_credentials = getCredentialIDsForUser(user_id)
        unless known_credentials.length == 0
            options = WebAuthn::Credential.options_for_get(
                user_verification: 'discouraged',
                allow: known_credentials
            )
            @challenges[user_id] = options.challenge
            return renderJSON(options.as_json)
        end
    end

    def self.getCredentialsForUser(user_id)
        user = User.new_with_id(user_id, @client)
        rc   = user.info

        if OpenNebula.is_error?(rc)
            $cloud_auth.logger.error {"user.info error: #{rc.message}"}
            return nil
        end

        credentials = []
        json_str = user['TEMPLATE/SUNSTONE/WEBAUTHN_CREDENTIALS']
        if json_str.nil?
            return credentials
        end
        begin
            credentials = JSON.parse(json_str.gsub("'", '"'))['cs']
        rescue Exception => e
            return OpenNebula::Error.new(e.message)
        end
        return credentials
    end

    def self.getCredentialIDsForUser(user_id)
        return getCredentialsForUser(user_id).map { |hash| hash['id'] }
    end

    def self.verifyCredentialFromRegistration(user_id, publicKeyCredential)
        credential_with_attestation = WebAuthn::Credential.from_create(publicKeyCredential)
        challenge = @challenges.delete(user_id.to_s)
        begin
            credential_with_attestation.verify(challenge)
            return credential_with_attestation
        rescue WebAuthn::Error => e
            return OpenNebula::Error.new(e.message)
        end
    end

    def self.authenticate(user_id, publicKeyCredential_s)
        begin
            publicKeyCredential = JSON.parse(publicKeyCredential_s)
            received_credential = WebAuthn::Credential.from_get(publicKeyCredential)
        rescue Exception => e
            return false
        end
        credentials = getCredentialsForUser(user_id)
        stored_credential = credentials.find { |hash| hash['id'] == publicKeyCredential['id'] }
        challenge = @challenges.delete(user_id.to_s)
        begin
            received_credential.verify(challenge, public_key: stored_credential['pk'], sign_count: Integer(stored_credential['cnt']))
            stored_credential['cnt'] = received_credential.sign_count
            updateCredentials(user_id, credentials)
            return true
        rescue WebAuthn::SignCountVerificationError => e
            # Cryptographic verification of the authenticator data succeeded, but the signature counter was less then or equal
            # to the stored value. This can have several reasons and depending on risk tolerance an implementation can choose to fail or
            # pass authentication. For more information see https://www.w3.org/TR/webauthn/#sign-counter. Here, we fail authentication.
            return false
        rescue WebAuthn::Error => e
            return false
        end
        return false
    end

    def self.updateCredentials(user_id, credentials)
        user = User.new_with_id(user_id, @client)
        rc   = user.info

        if OpenNebula.is_error?(rc)
            $cloud_auth.logger.error {"user.info error: #{rc.message}"}
            return nil
        end

        credentialsJSON = JSON.generate({ "cs" => credentials}).gsub('"', "'")
        # This does not work; breaks the template (guess the replace function is buggy)
        # user.replace({'WEBAUTHN_CREDENTIALS' => credentialsJSON}, 'TEMPLATE/SUNSTONE')
        user.retrieve_xmlelements('TEMPLATE/SUNSTONE/WEBAUTHN_CREDENTIALS')[0].set_content(credentialsJSON)
        user.update(user.template_like_str('TEMPLATE'))
    end

    def self.renderJSON(hash)
        return JSON.generate(hash)
    end

end
