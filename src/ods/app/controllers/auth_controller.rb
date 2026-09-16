# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

module OpenNebula

    module DocumentServer

        # Auth controller
        module AuthController

            # Authentication and document-secret authorization helpers
            module Helpers

                # Returns the authenticated OpenNebula user for this request
                #
                # @return [OpenNebula::User] Authenticated user
                def authenticated_user
                    return @authenticated_user if @authenticated_user

                    user = AuthController.current_user(@client)

                    if OpenNebula.is_error?(user)
                        STDERR.puts "Error retrieving user info: #{user.message}"
                        halt 500, internal_error(
                            "Error retrieving user info: #{user.message}",
                            ResponseHelper::INTERNAL_EC
                        )
                    end

                    @authenticated_user = user
                end

                # Checks whether the authenticated user belongs to the oneadmin group
                #
                # @return [Boolean] true for oneadmin group members
                def oneadmin?
                    user = authenticated_user

                    user.gid.zero? || user.groups.include?(0)
                end

                # Checks whether the current user may access a document's
                # sensitive values. Access is restricted to its owner and oneadmin.
                #
                # @param document [OpenNebula::Document] Document being accessed
                # @return [Boolean] true when sensitive values may be accessed
                def sensitive_access?(document)
                    oneadmin? || document.owner_id == authenticated_user.id
                end

                # Checks whether this request may include a document's sensitive values
                #
                # Sensitive values must be requested explicitly and are available only
                # to oneadmin group members or the document's owning user. Group ownership
                # and group use permissions do not grant access to secrets.
                #
                # @param document [OpenNebula::Document] Document being serialized
                # @return [Boolean] true when sensitive values may be returned
                def include_sensitive?(document)
                    params[:include_sensitive].to_s == 'true' && sensitive_access?(document)
                end

            end

            def self.registered(app)
                # Init the cloud auth system
                register_cloud_auth(app)
                app.helpers Helpers

                # Configure the oneadmin only flag
                app.set(:oneadmin_only) do |access|
                    condition do
                        next unless access

                        unless oneadmin?
                            halt 403, internal_error(
                                'Access denied. Only users belonging to the oneadmin ' \
                                'group are authorized to perform this action',
                                ResponseHelper::VALIDATION_EC
                            )
                        end
                    end
                end

                # Configure the resource access flag
                app.set(:ensure_resource_access) do |resource_class|
                    condition do
                        rc = resource_class.new_from_id(@client, params[:id], :raw => true)

                        if OpenNebula.is_error?(rc)
                            error_code = one_error_to_http(rc.errno)
                            halt error_code, internal_error(rc.message, error_code)
                        end
                    end
                end

                app.before do
                    auth = Rack::Auth::Basic::Request.new(request.env)

                    if auth.provided? && auth.basic?
                        @cloud_auth = app.settings.cloud_auth
                        @username   = @cloud_auth.auth(request.env)
                        @client     = @cloud_auth.client(@username)

                        error 401, 'Invalid credentials' if @username.nil?
                    else
                        error 401, 'A username and password must be provided'
                    end
                end
            end

            def self.register_cloud_auth(app)
                require 'CloudAuth'

                ENV['ONE_CIPHER_AUTH'] = SERVER_AUTH
                app.set :cloud_auth, CloudAuth.new(SERVER_CONF)
            rescue StandardError => e
                message = "Error initializing authentication system: #{e.message}\n"
                puts message
                exit(1)
            end

            # Returns a valid authentication token for the current client user.
            # Retrieves the first unexpired login token for the user, or generates
            # a new one if none exists.
            # @param client [OpenNebula::Client] Client used to query the user
            # @return [String, OpenNebula::Error] A token in the form "username:token",
            #   or an OpenNebula::Error if the operation fails
            def self.user_auth(client)
                return OpenNebula::Error.new(
                    'A client must be provided',
                    OpenNebula::Error::EACTION
                ) if client.nil?

                user = current_user(client)
                return user if OpenNebula.is_error?(user)

                token = first_unexpired_token(user) || user.login(user.name, '', -1)
                return token if OpenNebula.is_error?(token)

                "#{user.name}:#{token}"
            end

            def self.current_user(client)
                user = User.new_with_id(OpenNebula::User::SELF, client)
                rc   = user.info

                return rc if OpenNebula.is_error?(rc)

                user
            end

            def self.first_unexpired_token(user)
                tokens = [user.to_hash.dig('USER', 'LOGIN_TOKEN')].flatten.compact

                valid_token = tokens.find do |token|
                    expiration_time = token['EXPIRATION_TIME'].to_i

                    expiration_time == -1 || Time.now.to_i < expiration_time
                end

                valid_token && valid_token['TOKEN']
            end

        end

    end

end
