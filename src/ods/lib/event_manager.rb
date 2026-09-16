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

require 'ActionManager'
require 'securerandom'

module OpenNebula

    module DocumentServer

        # Registers and dispatches asynchronous actions
        class EventManager

            COMP = 'ACT'

            def initialize(_cloud_auth, conf)
                # Create and register Action Manager actions
                @am = ActionManager.new(conf[:concurrency], true)

                # Subclasses define the action methods they expose.
                self.class::ACTIONS.each do |action|
                    @am.register_action(action, method(action))
                end
            end

            # Triggers an action through the Action Manager
            #
            # @param name [Symbol] name of the action to trigger
            # @param args [Array] optional arguments passed to the action
            # @return [String, OpenNebula::Error] action identifier or error
            def trigger_action(name:, args: [])
                action_id = SecureRandom.uuid
                @am.trigger_action(name, action_id, *args)

                action_id
            rescue StandardError => e
                msg = "Error triggering action: #{e.message}"
                Log.error(COMP, msg, action_id)
                OpenNebula::Error.new(msg, OpenNebula::Error::EINTERNAL)
            end

        end

    end

end
