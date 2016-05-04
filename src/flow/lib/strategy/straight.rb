# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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

module Straight
    # Using this strategy the service is deployed based on a directed
    # acyclic graph where each node defines its parents.
    #
    # For example:
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
    # @param [Service] service
    # @return [Hash<String, Role>] Roles
    def get_roles_deploy(service)
        roles = service.get_roles

        running_roles = roles.select {|name, role|
            role.state == Role::STATE['RUNNING']
        }

        # Ruby 1.8 compatibility
        if running_roles.instance_of?(Array)
            running_roles = Hash[running_roles]
        end

        result = roles.select {|name, role|
            check = true

            if role.state == Role::STATE['PENDING']
                role.parents.each { |parent|
                    if !running_roles.include?(parent)
                        check = false
                        break
                    end
                }
            elsif role.state == Role::STATE['DEPLOYING']
                check = true
            else
                check = false
            end

            check
        }

        # Ruby 1.8 compatibility
        if result.instance_of?(Array)
            result = Hash[result]
        end

        result
    end

    # Returns all node Roles ready to be shutdown
    # @param [Service] service
    # @return [Hash<String, Role>] Roles
    def get_roles_shutdown(service)
        roles = service.get_roles

        # Get all the parents from running roles
        parents = []
        running_roles = {}

        roles.each { |name, role|
            # All roles can be shutdown, except the ones in these states
            if (![Role::STATE['UNDEPLOYING'],
              Role::STATE['DONE'],
              Role::STATE['FAILED_UNDEPLOYING']].include?(role.state) )

                running_roles[name]= role
            end

            # Only the parents of DONE roles can be shutdown
            if (role.state != Role::STATE['DONE'] )
                parents += role.parents
            end
        }

        # Select the nodes that are not parent from any node
        result =  running_roles.select {|name, role|
            !parents.include?(name)
        }

        # Ruby 1.8 compatibility
        if result.instance_of?(Array)
            result = Hash[result]
        end

        result
    end

end