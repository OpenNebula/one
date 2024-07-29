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

require 'strategy/straight'

# Strategy class (module none?)
module Strategy

    LOG_COMP = 'STR'

    # All subclasses must define these methods

    # Returns all node Roles ready to be deployed
    # @param [Service] service
    # @return [Hash<String, Role>] Roles
    def roles_deploy
        result = roles.select do |_name, role|
            role.state == Role::STATE['PENDING'] ||
                role.state == Role::STATE['SCALING']
        end

        # Ruby 1.8 compatibility
        if result.instance_of?(Array)
            result = result.to_h
        end

        result
    end

    # Returns all node Roles ready to be shutdown
    # @param [Service] service
    # @return [Hash<String, Role>] Roles
    def roles_shutdown
        result = roles.reject do |_name, role|
            [Role::STATE['UNDEPLOYING'],
             Role::STATE['DONE'],
             Role::STATE['FAILED_UNDEPLOYING']].include?(role.state)
        end

        # Ruby 1.8 compatibility
        if result.instance_of?(Array)
            result = result.to_h
        end

        result
    end

    # Returns all node Roles ready to be set on hold
    # @return [Hash<String, Role>] Roles
    def roles_hold
        result = roles.select do |_name, role|
            role.state == Role::STATE['PENDING']
        end

        # Ruby 1.8 compatibility
        if result.instance_of?(Array)
            result = result.to_h
        end

        result
    end

    # Returns all node Roles ready to be released
    # @param [Service] service
    # @return [Hash<String, Role>] Roles
    def roles_release
        result = roles.select do |_name, role|
            role.state == Role::STATE['HOLD']
        end

        # Ruby 1.8 compatibility
        if result.instance_of?(Array)
            result = result.to_h
        end

        result
    end

end
