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

require 'lcm/strategy/straight'

class Strategy

    LOG_COMP = "STR"

    # Performs a boot step, deploying all nodes that meet the requirements
    # @param [Service] service service to boot
    # @return [Array<true, nil>, Array<false, String>] true if all the nodes
    # were created, false and the error reason if there was a problem
    # creating the VMs
    def boot_step(service)
        Log.debug LOG_COMP, "Boot step", service.id()

        roles_deploy = get_roles_deploy(service)

        roles_deploy.each { |name, role|
            Log.debug LOG_COMP, "Deploying role #{name}", service.id()

            rc = role.deploy

            if !rc[0]
                role.set_state(Role::STATE['FAILED_DEPLOYING'])

                return rc
            else
                role.set_state(Role::STATE['DEPLOYING'])
            end
        }

        return [true, nil]
    end

    # Performs a shutdown step, shutting down all nodes that meet the requirements
    # @param [Service] service service to boot
    # @return [Array<true, nil>, Array<false, String>] true if all the nodes
    # were created, false and the error reason if there was a problem
    # creating the VMs
    def shutdown_step(service)
        Log.debug LOG_COMP, "Shutdown step", service.id()

        roles_shutdown = get_roles_shutdown(service)

        roles_shutdown.each { |name, role|
            Log.debug LOG_COMP, "Shutting down role #{name}", service.id()

            rc = role.shutdown

            if !rc[0]
                role.set_state(Role::STATE['FAILED_UNDEPLOYING'])

                return rc
            else
                role.set_state(Role::STATE['UNDEPLOYING'])
            end
        }

        return [true, nil]
    end

    # Performs a monitor step, check if the roles already deployed are running
    # @param [Service] service service to boot
    # @return [Array<true, nil>, Array<false, String>] true if all the nodes
    # were running, false and the error reason if there was a problem
    # monitoring the nodes
    def monitor_step(service)
        Log.debug LOG_COMP, "Monitor step", service.id()

        roles_monitor = get_roles_monitor(service)

        roles_monitor.each { |name, role|
            Log.debug LOG_COMP, "Monitoring role #{name}", service.id()

            rc = role.info

            case role.state()
            when Role::STATE['RUNNING']
                if OpenNebula.is_error?(rc)
                    role.set_state(Role::STATE['UNKNOWN'])
                elsif !role_nodes_running?(role)
                    role.set_state(Role::STATE['UNKNOWN'])
                end
            when Role::STATE['DEPLOYING']
                if OpenNebula.is_error?(rc)
                    role.set_state(Role::STATE['FAILED_DEPLOYING'])
                elsif role_nodes_running?(role)
                    role.set_state(Role::STATE['RUNNING'])
                elsif any_node_failed?(role)
                    role.set_state(Role::STATE['FAILED_DEPLOYING'])
                end
            when Role::STATE['UNKNOWN']
                if role_nodes_running?(role)
                    role.set_state(Role::STATE['RUNNING'])
                end
            when Role::STATE['FAILED']
                if OpenNebula.is_error?(rc)
                    role.set_state(Role::STATE['UNKNOWN'])
                elsif role_nodes_running?(role)
                    role.set_state(Role::STATE['RUNNING'])
                end
            when Role::STATE['UNDEPLOYING']
                if OpenNebula.is_error?(rc)
                    role.set_state(Role::STATE['FAILED_UNDEPLOYING'])
                elsif role_nodes_done?(role)
                    role.set_state(Role::STATE['DONE'])
                elsif any_node_failed?(role)
                    role.set_state(Role::STATE['FAILED_UNDEPLOYING'])
                end
            when Role::STATE['FAILED_DEPLOYING']
                if !OpenNebula.is_error?(rc) && role_nodes_running?(role)
                    role.set_state(Role::STATE['PENDING'])
                end
            when Role::STATE['FAILED_UNDEPLOYING']
                if !OpenNebula.is_error?(rc) && role_nodes_done?(role)
                    role.set_state(Role::STATE['DONE'])
                end
            end
        }
    end

protected
    # All subclasses must define these methods

    # Returns all node Roles ready to be deployed
    # @param [Service] service
    # @return [Hash<String, Role>] Roles
    def get_roles_deploy(service)
        result = service.get_roles.select {|name, role|
            role.state == Role::STATE['PENDING']
        }

        # Ruby 1.8 compatibility
        if result.instance_of?(Array)
            result = Hash[result]
        end

        result
    end

    # Returns all node Roles be monitored
    # @param [Service] service
    # @return [Hash<String, Role>] Roles
    def get_roles_monitor(service)
        result = service.get_roles.select {|name, role|
            ![Role::STATE['PENDING'], Role::STATE['DONE']].include?(role.state)
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
        result = service.get_roles.select {|name, role|
            ![Role::STATE['UNDEPLOYING'],
              Role::STATE['FAILED'],
              Role::STATE['DONE'],
              Role::STATE['FAILED_UNDEPLOYING'],
              Role::STATE['FAILED_DEPLOYING']].include?(role.state)
        }

        # Ruby 1.8 compatibility
        if result.instance_of?(Array)
            result = Hash[result]
        end

        result
    end

    # Determine if the role nodes are running
    # @param [Role] role
    # @return [true|false]
    def role_nodes_running?(role)
        role.get_nodes.each { |node|
            if node && node['vm_info']
                vm_state = node['vm_info']['VM']['STATE']
                lcm_state = node['vm_info']['VM']['LCM_STATE']
    
                # !(ACTIVE && RUNNING)
                if (vm_state != '3') || (lcm_state != '3')
                    return false
                end
            else
                return false
            end
        }

        return true
    end

    # Determine if any of the role nodes failed
    # @param [Role] role
    # @return [true|false]
    def any_node_failed?(role)
        role.get_nodes.each { |node|
            if node && node['vm_info']
                vm_state = node['vm_info']['VM']['STATE']
    
                if vm_state == '7' # FAILED
                    return true
                end
            end
        }

        return false
    end

    # Determine if the role nodes are in done state
    # @param [Role] role
    # @return [true|false]
    def role_nodes_done?(role)
        role.get_nodes.each { |node|
            if node && node['vm_info']
                vm_state = node['vm_info']['VM']['STATE']
    
                if vm_state != '6' # DONE
                    return false
                end
            else
                return false
            end
        }

        return true
    end
end
