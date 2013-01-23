# -------------------------------------------------------------------------- #
# Copyright 2010-2013, C12G Labs S.L.                                        #
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

require 'digest/sha1'

class Session
    PERMISSIONS = {
        :user => {
            :create => {
                :anonymous  => true,
                :user       => true,
                :admin      => true
            },
            :show => {
                :anonymous  => false,
                :user       => false,
                :admin      => true
            },
            :delete => {
                :anonymous  => false,
                :user       => false,
                :admin      => true
            },
            :update => {
                :anonymous  => false,
                :user       => false,
                :admin      => true
            },
            :list => {
                :anonymous  => false,
                :user       => false,
                :admin      => true
            },
            :enable => {
                :anonymous  => false,
                :user       => false,
                :admin      => true
            },
            :schema => {
                :anonymous  => User::SCHEMA,
                :user       => User::SCHEMA,
                :admin      => User::ADMIN_SCHEMA
            }
        },
        :appliance => {
            :create => {
                :anonymous  => false,
                :user       => true,
                :admin      => true
            },
            :show => {
                :anonymous  => true,
                :user       => true,
                :admin      => true
            },
            :delete => {
                :anonymous  => false,
                :user       => true,
                :admin      => true
            },
            :update => {
                :anonymous  => false,
                :user       => true,
                :admin      => true
            },
            :list => {
                :anonymous  => true,
                :user       => true,
                :admin      => true
            },
            :download => {
                :anonymous  => true,
                :user       => true,
                :admin      => true
            },
            :schema => {
                :anonymous  => Appliance::SCHEMA,
                :user       => Appliance::SCHEMA,
                :admin      => Appliance::ADMIN_SCHEMA
            }
        }
    }

    def initialize(env)
        @user = authenticate(env)
    end

    def authorize(env)
        perms = case env["REQUEST_METHOD"]
        when 'GET', 'HEAD'
            case env["PATH_INFO"]
            when /^\/user$/
                PERMISSIONS[:user][:list]
            when /^\/user\/\w+$/
                PERMISSIONS[:user][:show]
            when /^\/appliance$/
                PERMISSIONS[:appliance][:list]
            when /^\/appliance\/\w+$/
                PERMISSIONS[:appliance][:show]
            when /^\/appliance\/\w+\/download$/
                PERMISSIONS[:appliance][:download]
            when /^\/favicon.ico$/
                true
            end
        when 'DELETE'
            case env["PATH_INFO"]
            when /^\/user\/\w+$/
                PERMISSIONS[:user][:delete]
            when /^\/appliance\/\w+$/
                PERMISSIONS[:appliance][:delete]
            end
        when 'PUT'
            case env["PATH_INFO"]
            when /^\/user\/\w+$/
                PERMISSIONS[:user][:update]
            when /^\/appliance\/\w+$/
                PERMISSIONS[:appliance][:update]
            end
        when 'POST'
            case env["PATH_INFO"]
            when /^\/user$/
                PERMISSIONS[:user][:create]
            when /^\/appliance$/
                PERMISSIONS[:appliance][:create]
            when /^\/user\/\w+\/enable$/
                PERMISSIONS[:user][:enable]
            end
        end

        if perms.instance_of?(Hash)
            perms[role]
        else
            false
        end
    end

    def schema(resource)
        PERMISSIONS[resource][:schema][role].dup
    end

    def allowed_catalogs
        if anonymous?
            [Appliance::PUBLIC_CATALOG]
        elsif user?
            if  @user['catalogs']
                [Appliance::PUBLIC_CATALOG] + @user['catalogs']
            else
                [Appliance::PUBLIC_CATALOG]
            end
        elsif admin?
            nil
        end
    end

    def admin?
        role == :admin
    end

    def user?
        role == :user
    end

    def anonymous?
        role == :anonymous
    end

    def role
        if @user.nil?
            :anonymous
        elsif @user['role'] == User::ADMIN_ROLE
            :admin
        else
            :user
        end
    end

    def name
        @user['username'] if @user
    end

    # Retrieve the publisher name of the session
    def publisher
        @user['organization'] if @user
    end

    private

    def authenticate(env)
        auth = Rack::Auth::Basic::Request.new(env)

        if auth.provided? && auth.basic?
            username, password = auth.credentials

            #sha1_pass = Digest::SHA1.hexdigest(password)
            User.retrieve(username, password)
        else
            nil
        end
    end
end