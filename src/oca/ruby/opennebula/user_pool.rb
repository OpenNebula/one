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


require 'opennebula/pool'

module OpenNebula
    class UserPool < Pool
        #######################################################################
        # Constants and Class attribute accessors
        #######################################################################

        USER_POOL_METHODS = {
            :info => "userpool.info"
        }

        #######################################################################
        # Class constructor & Pool Methods
        #######################################################################

        # +client+ a Client object that represents a XML-RPC connection
        def initialize(client)
            super('USER_POOL','USER',client)
        end

        # Factory method to create User objects
        def factory(element_xml)
            OpenNebula::User.new(element_xml,@client)
        end

        #######################################################################
        # XML-RPC Methods for the User Object
        #######################################################################

        # Retrieves all the Users in the pool.
        def info()
            super(USER_POOL_METHODS[:info])
        end

        def info_all()
            return super(USER_POOL_METHODS[:info])
        end

        def info_mine()
            return super(USER_POOL_METHODS[:info])
        end

        def info_group()
            return super(USER_POOL_METHODS[:info])
        end

        alias_method :info!, :info
        alias_method :info_all!, :info_all
        alias_method :info_mine!, :info_mine
        alias_method :info_group!, :info_group

        #######################################################################
        # Helpers to get information
        #######################################################################

        # Returns a list of user IDs that have the given password. info() needs
        # to be called before.
        #
        # @param driver [String] auth driver to match
        # @param password [String] password to match
        # @return [Array] an array of IDs
        def users_with_password(driver, password)
            ids = []

            each do |user|
                if user["PASSWORD"] == password
                    ids << user["ID"]
                end
            end

            return ids
        end
    end
end
