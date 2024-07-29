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

# Straight strategy module
module Straight

    # Using this strategy the service is deployed based on a directed
    # acyclic graph where each node defines its parents.
    #
    # For example:
    #
    #   mysql    nfs
    #      |     |  \
    #      |     |   kvm
    #       \    |   /
    #        front-end
    #
    # The above graph represents the following service:
    #
    #    "name": "my_first_service",
    #    "roles": [
    #      {
    #        "name": "front-end",
    #        "parents": [
    #          "mysql",
    #          "kvm",
    #          "nfs"
    #        ],
    #        ...
    #      },
    #      {
    #        "name": "nfs",
    #        ...
    #      },
    #      {
    #        "name": "mysql",
    #        ...
    #      },
    #      {
    #        "name": "kvm",
    #        "parents": "nfs",
    #        ...
    #      }
    #    ],
    #    "deployment": "straight"
    #  }
    #
    # The roles will be deployed in the following order:
    #   1. myslq & nfs
    #   2. kvm
    #   3. front-end
    #
    # And the service will be shutdown in the reverse order
    #   1. front-end
    #   2. kvm & myslq
    #   3. nfs

    # Returns all node Roles ready to be deployed
    # @return [Hash<String, Role>] Roles
    def roles_deploy
        running_roles = roles.select do |_name, role|
            role.state == Role::STATE['RUNNING']
        end

        # Ruby 1.8 compatibility
        if running_roles.instance_of?(Array)
            running_roles = running_roles.to_h
        end

        result = roles.select do |_name, role|
            check = true

            if role.state == Role::STATE['PENDING']
                role.parents.each do |parent|
                    if !running_roles.include?(parent)
                        check = false
                        break
                    end
                end
            else
                check = false
            end

            check
        end

        # Ruby 1.8 compatibility
        if result.instance_of?(Array)
            result = result.to_h
        end

        result
    end

    # Returns all node Roles ready to be shutdown
    # @return [Hash<String, Role>] Roles
    def roles_shutdown
        # Get all the parents from running roles
        parents = []
        running_roles = {}

        roles.each do |name, role|
            # All roles can be shutdown, except the ones in these states
            if ![Role::STATE['UNDEPLOYING'],
                 Role::STATE['DONE'],
                 Role::STATE['FAILED_UNDEPLOYING']].include?(role.state)

                running_roles[name]= role
            end

            # Only the parents of DONE roles can be shutdown
            if role.state != Role::STATE['DONE']
                parents += role.parents
            end
        end

        # Select the nodes that are not parent from any node
        result = running_roles.reject do |name, _role|
            parents.include?(name)
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
        hold_roles = roles.select do |_name, role|
            role.state == Role::STATE['HOLD']
        end

        # Ruby 1.8 compatibility
        if hold_roles.instance_of?(Array)
            hold_roles = hold_roles.to_h
        end

        result = roles.select do |_name, role|
            check = true

            if role.state == Role::STATE['PENDING']
                role.parents.each do |parent|
                    if !hold_roles.include?(parent)
                        check = false
                        break
                    end
                end
            else
                check = false
            end

            check
        end

        # Ruby 1.8 compatibility
        if result.instance_of?(Array)
            result = result.to_h
        end

        result
    end

    # Returns all node Roles ready to be released
    # @return [Hash<String, Role>] Roles
    def roles_release
        running_roles = roles.select do |_name, role|
            role.state == Role::STATE['RUNNING']
        end

        # Ruby 1.8 compatibility
        if running_roles.instance_of?(Array)
            running_roles = running_roles.to_h
        end

        result = roles.select do |_name, role|
            check = true

            if role.state == Role::STATE['HOLD']
                role.parents.each do |parent|
                    if !running_roles.include?(parent)
                        check = false
                        break
                    end
                end
            else
                check = false
            end

            check
        end

        # Ruby 1.8 compatibility
        if result.instance_of?(Array)
            result = result.to_h
        end

        result
    end

end
