# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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
require 'opennebula'
require 'pstore'
require 'fileutils'

require_relative 'helper_functions'

# UserController manages OpenNebula users and their authentication tokens
class UserController

    TOKEN_LIFETIME = 86400

    def self.start
        state_path = ENV['ONE_LOCATION'] ? "#{ENV['ONE_LOCATION']}/var" : '/var/lib/one'
        db_path = File.join(state_path, 'ovirtapi', 'active_tokens.pstore')
        FileUtils.mkdir_p(File.dirname(db_path), :mode => 0o700)
        File.open(db_path, File::RDWR | File::CREAT, 0o600) {|file| file.chmod(0o600) }
        @db = PStore.new(db_path, true)
        LOGGER.info "Active tokens db initialized at: #{db_path}"
    end

    # Auxiliary function to get an instance of an OpenNebula User
    def self.get_user(client, username = nil)
        user_pool = OpenNebula::UserPool.new(client)
        rc = user_pool.info_all

        if OpenNebula.is_error?(rc)
            LOGGER.error("Error: #{rc.message}")
            return
        end

        username ? user_pool.find {|u| u.name == username } : user_pool
    end

    # -----------------------
    # Since opennebula still needs a username to go with
    # the token, the oauth2 token will be in the
    # format "username:token"
    # -----------------------
    def self.get_token(username, password)
        username = username.sub(/@internal\z/i, '')
        client = OpenNebula::Client.new("#{username}:#{password}", ENDPOINT)

        # Serialize authentication and issuance across threads and processes so
        # concurrent logins see the latest token instead of filling ONE's pool.
        @db.transaction do
            user = get_user(client, username)
            if user.nil?
                LOGGER.error('Unable to obtain user information from OpenNebula.')
                next [401, { :error => 'Authentication failed' }]
            end

            key = [ENDPOINT, username, user.id]
            token = @db.fetch(key, nil)
            expires_at = token_expiration(user, token)

            unless expires_at && expires_at > Time.now.to_i
                token = user.login(username, '', TOKEN_LIFETIME)
                if OpenNebula.is_error?(token) || !token.is_a?(String) || token.empty?
                    LOGGER.error('Unable to create an OpenNebula login token.')
                    next [502, { :error => 'Token creation failed' }]
                end

                @db[key] = token
                # ONE may shorten the lifetime according to the auth driver.
                rc = user.info
                if OpenNebula.is_error?(rc)
                    LOGGER.error('Unable to verify the new OpenNebula login token.')
                    next [502, { :error => 'Token verification failed' }]
                end

                expires_at = token_expiration(user, token)
            end

            expires_in = expires_at.to_i - Time.now.to_i
            if expires_in <= 0
                next [502, { :error => 'Token verification failed' }]
            end

            {
                :access_token => "#{username}:#{token}",
                :token_type => 'bearer',
                :expires_in => expires_in,
                :scope => '...'
            }.to_json
        end
    end

    # Only reuse our cached token if it still belongs to this authenticated
    # account, has not been revoked, and has a finite expiration.
    def self.token_expiration(user, token)
        return unless token.is_a?(String) && !token.empty?

        user.each('LOGIN_TOKEN') do |entry|
            next unless entry['TOKEN'] == token && entry['EGID'].to_i == -1

            expiry = entry['EXPIRATION_TIME'].to_i
            return expiry if expiry > 0
        end

        nil
    end
    private_class_method :token_expiration

end
