# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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


require 'OpenNebula/Pool'

module OpenNebula
    class User < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        USER_METHODS = {
            :info     => "user.info",
            :allocate => "user.allocate",
            :delete   => "user.delete",
            :passwd   => "user.passwd",
            :chgrp    => "user.chgrp",
            :update   => "user.update",
            :chauth   => "user.chauth",
            :quota    => "user.quota"
        }

        SELF      = -1

        # Driver name for default core authentication
        CORE_AUTH = "core"

        # Driver name for default core authentication
        CIPHER_AUTH = "server_cipher"

        # Driver name for ssh authentication
        SSH_AUTH  = "ssh"

        # Driver name for x509 authentication
        X509_AUTH = "x509"

        # Driver name for x509 proxy authentication
        X509_PROXY_AUTH = "x509_proxy"

        # Creates a User description with just its identifier
        # this method should be used to create plain User objects.
        # +id+ the id of the user
        #
        # Example:
        #   user = User.new(User.build_xml(3),rpc_client)
        #
        def User.build_xml(pe_id=nil)
            if pe_id
                user_xml = "<USER><ID>#{pe_id}</ID></USER>"
            else
                user_xml = "<USER></USER>"
            end

            XMLElement.build_xml(user_xml, 'USER')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)

            @client = client
        end

        #######################################################################
        # XML-RPC Methods for the User Object
        #######################################################################

        # Retrieves the information of the given User.
        def info()
            super(USER_METHODS[:info], 'USER')
        end

        # Allocates a new User in OpenNebula
        #
        # +username+ Name of the new user.
        #
        # +password+ Password for the new user
        def allocate(username, password, driver=CORE_AUTH)
            super(USER_METHODS[:allocate], username, password, driver)
        end

        # Replaces the template contents
        #
        # +new_template+ New template contents
        def update(new_template)
            super(USER_METHODS[:update], new_template)
        end

        # Deletes the User
        def delete()
            super(USER_METHODS[:delete])
        end

        # Changes the password of the given User
        #
        # +password+ String containing the new password
        def passwd(password)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(USER_METHODS[:passwd], @pe_id, password)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Changes the main group
        # gid:: _Integer_ the new group id. Set to -1 to leave the current one
        # [return] nil in case of success or an Error object
        def chgrp(gid)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(USER_METHODS[:chgrp],@pe_id, gid)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Changes the auth driver and the password of the given User
        #
        # @param auth [String] the new auth driver
        # @param password [String] the new password. If it is an empty string,
        #   the user password is not changed
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chauth(auth, password="")
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(USER_METHODS[:chauth],@pe_id, auth, password)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Sets the user quota limits
        # @param quota [String] a template (XML or txt) with the new quota limits 
        # 
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def set_quota(quota)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(USER_METHODS[:quota],@pe_id, quota)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        #######################################################################
        # Helpers to get User information
        #######################################################################

        # Returns the group identifier
        # [return] _Integer_ the element's group ID
        def gid
            self['GID'].to_i
        end
    end
end
