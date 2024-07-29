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
    class System
        #######################################################################
        # Constants and Class attribute accessors
        #######################################################################

        SYSTEM_METHODS = {
            :userquotainfo      => "userquota.info",
            :userquotaupdate    => "userquota.update",
            :groupquotainfo     => "groupquota.info",
            :groupquotaupdate   => "groupquota.update",
            :version            => "system.version",
            :config             => "system.config",
            :sql                => "system.sql",
            :sqlquery           => "system.sqlquery"
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

        # Executes and replicates SQL commands on OpenNebula DB
        #   @param [String] Sql string
        #   @param [Boolean] True to replicate command on a federation. To
        #   operate on federated tables
        #   @return [Integer, OpenNebula::Error] Sql execution result in case
        #   of success, Error otherwise
        def sql_command(sql, federate)
            return @client.call(SYSTEM_METHODS[:sql], sql, federate)
        end

        # Executes a SQL query command on OpenNebula DB
        #   @param [String] Sql string
        #   @return [String, OpenNebula::Error] Sql execution result in XML
        #   format in case of success, Error otherwise
        #   <QUERY>
        #     the query sent to oned
        #   </QUERY>
        #   <RESULT>
        #     <ROW>
        #       <column_name>column_value</column_name>
        #       ...
        #     </ROW>
        #   </RESULT>
        def sql_query_command(sql)
            return @client.call(SYSTEM_METHODS[:sqlquery], sql)
        end
        #
        # Gets the oned version
        #
        # @return [String, OpenNebula::Error] the oned version in case
        #   of success, Error otherwise
        def get_oned_version()
            return @client.call("system.version")
        end

        # Returns whether of not the oned version is the same as the OCA version
        #
        # @return [true, false, OpenNebula::Error] true if oned is the same
        #   version
        def compatible_version()
            no_revision = VERSION[/^\d+\.\d+\./]
            oned_v = get_oned_version

            if OpenNebula.is_error?(oned_v)
                return oned_v
            end

            return (oned_v =~ /#{no_revision}/) != nil
        end

        # Gets the oned configuration
        #
        # @return [XMLElement, OpenNebula::Error] the oned configuration in case
        #   of success, Error otherwise
        def get_configuration()
            rc = @client.call(SYSTEM_METHODS[:config])

            if OpenNebula.is_error?(rc)
                return rc
            end

            config = XMLElement.new
            config.initialize_xml(rc, 'OPENNEBULA_CONFIGURATION')

            return config
        end

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
