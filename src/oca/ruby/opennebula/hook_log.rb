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

require 'opennebula/xml_utils'

module OpenNebula

    # Class representing the HookLog
    class HookLog < XMLElement

        #######################################################################
        # Constants and Class attribute accessors
        #######################################################################

        HOOK_LOG_METHODS = {
            :info     => 'hooklog.info'
        }

        ROOT_NAME = 'HOOKLOG'

        #######################################################################
        # Class constructor & Methods
        #######################################################################

        # +client+ a Client object that represents an XML-RPC connection
        def initialize(client)
            super(nil)

            @client = client
        end

        #######################################################################
        # XML-RPC Methods for the HookLog object
        #######################################################################

        def info(min_ts, max_ts, hook_id, rc)
            rc = @client.call(HOOK_LOG_METHODS[:info],
                              min_ts,
                              max_ts,
                              hook_id,
                              rc)

            if !OpenNebula.is_error?(rc)
                initialize_xml(rc, ROOT_NAME)

                rc = nil
            end

            rc
        end

        alias :info! info

    end

end
