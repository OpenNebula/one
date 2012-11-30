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
    class System
        #######################################################################
        # Constants and Class attribute accessors
        #######################################################################

        SYSTEM_METHODS = {
            :userquotainfo      => "userquota.info",
            :userquotaupdate    => "userquota.update",
            :groupquotainfo     => "groupquota.info",
            :groupquotaupdate   => "groupquota.update"
        }

        #######################################################################
        # Class constructor
        #######################################################################

        # Constructor
        #   @param [Client] client that represents a XML-RPC connection
        def initialize(client)
            @client = client
        end

        #######################################################################
        # XML-RPC Methods
        #######################################################################

        # Gets the default user quota limits
        #
        # @return [XMLElement, OpenNebula::Error] the default user quota in case
        #   of success, Error otherwise
        def get_user_quotas()
            rc = @client.call(SYSTEM_METHODS[:userquotainfo])

            if OpenNebula.is_error?(rc)
                return rc
            end

            default_quotas = XMLElement.new
            default_quotas.initialize_xml(rc, 'DEFAULT_USER_QUOTAS')

            return default_quotas
        end

        # Sets the default user quota limits
        # @param quota [String] a template (XML or txt) with the new quota limits
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def set_user_quotas(quota)
            return @client.call(SYSTEM_METHODS[:userquotaupdate], quota)
        end

        # Gets the default group quota limits
        #
        # @return [XMLElement, OpenNebula::Error] the default group quota in case
        #   of success, Error otherwise
        def get_group_quotas()
            rc = @client.call(SYSTEM_METHODS[:groupquotainfo])

            if OpenNebula.is_error?(rc)
                return rc
            end

            default_quotas = XMLElement.new
            default_quotas.initialize_xml(rc, 'DEFAULT_GROUP_QUOTAS')

            return default_quotas
        end

        # Sets the default group quota limits
        # @param quota [String] a template (XML or txt) with the new quota limits
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def set_group_quotas(quota)
            return @client.call(SYSTEM_METHODS[:groupquotaupdate], quota)
        end
    end
end
