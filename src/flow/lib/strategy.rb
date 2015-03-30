# -------------------------------------------------------------------------- #
# Copyright 2010-2015, C12G Labs S.L.                                        #
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

    # If a role needs to scale, its cardinality is updated, and its state is set
    # to SCALING. Only one role is set to scale.
    # @param [Service] service
    # @return [true|false] true if any role needs to scale
    def apply_scaling_policies(service)
        Log.debug LOG_COMP, "Apply scaling policies", service.id()

        service.get_roles.each do |name, role|
            diff, cooldown_duration = role.scale?

            if diff != 0
                Log.debug LOG_COMP, "Role #{name} needs to scale #{diff} nodes", service.id()

                role.set_cardinality(role.cardinality() + diff)

                role.set_state(Role::STATE['SCALING'])
                role.set_cooldown_duration(cooldown_duration)

                return true
            end
        end

        return false
    end

    # If a role is scaling, the nodes are created/destroyed to match the current
    # cardinality
    # @return [Array<true, nil>, Array<false, String>] true if the action was
    # performed, false and the error reason if there was a problem
    def scale_step(service)
        Log.debug LOG_COMP, "Scale step", service.id()

        service.get_roles.each do |name, role|

            if role.state == Role::STATE['SCALING']
                rc = role.scale()

                if !rc[0]
                    role.set_state(Role::STATE['FAILED_SCALING'])

                    return rc
                end
            end
        end

        return [true, nil]
    end

    # Performs a monitor step, check if the roles already deployed are running
    # @param [Service] service service to monitor
    # @return [nil]
    def monitor_step(service)
        Log.debug LOG_COMP, "Monitor step", service.id()

        roles_monitor = get_roles_monitor(service)

        roles_monitor.each { |name, role|
            Log.debug LOG_COMP, "Monitoring role #{name}", service.id()

            rc = role.info

            case role.state()
            when Role::STATE['RUNNING']
                if OpenNebula.is_error?(rc) || role_nodes_warning?(role)
                    role.set_state(Role::STATE['WARNING'])
                end

                role.update_cardinality()
            when Role::STATE['WARNING']
                if !OpenNebula.is_error?(rc) && !role_nodes_warning?(role)
                    role.set_state(Role::STATE['RUNNING'])
                end

                role.update_cardinality()
            when Role::STATE['DEPLOYING']
                if OpenNebula.is_error?(rc)
                    role.set_state(Role::STATE['FAILED_DEPLOYING'])
                elsif role_nodes_running?(role)
                    role.set_state(Role::STATE['RUNNING'])
                elsif any_node_failed?(role)
                    role.set_state(Role::STATE['FAILED_DEPLOYING'])
                end
            when Role::STATE['SCALING']
                if OpenNebula.is_error?(rc)
                    role.set_state(Role::STATE['FAILED_SCALING'])
                elsif role_finished_scaling?(role)
                    if role.apply_cooldown_duration()
                        role.set_state(Role::STATE['COOLDOWN'])
                    else
                        role.set_state(Role::STATE['RUNNING'])
                    end
                elsif any_node_failed_scaling?(role)
                    role.set_state(Role::STATE['FAILED_SCALING'])
                end
            when Role::STATE['COOLDOWN']
                if role.cooldown_over?
                    role.set_state(Role::STATE['RUNNING'])
                end

                role.update_cardinality()
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
                    role.set_state(Role::STATE['RUNNING'])
                end
            when Role::STATE['FAILED_UNDEPLOYING']
                if !OpenNebula.is_error?(rc) && role_nodes_done?(role)
                    role.set_state(Role::STATE['DONE'])
                end
            when Role::STATE['FAILED_SCALING']
                if !OpenNebula.is_error?(rc) && role_finished_scaling?(role)
                    role.set_state(Role::STATE['SCALING'])
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
            role.state == Role::STATE['PENDING'] ||
            role.state == Role::STATE['DEPLOYING']
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
              Role::STATE['DONE'],
              Role::STATE['FAILED_UNDEPLOYING']].include?(role.state)
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
        if role.get_nodes.size() != role.cardinality()
            return false
        end

        role.get_nodes.each { |node|
            return false if !(node && node['running'])
        }

        return true
    end

    # Returns true if any VM is in UNKNOWN or FAILED
    # @param [Role] role
    # @return [true|false]
    def role_nodes_warning?(role)
        role.get_nodes.each do |node|
            if node && node['vm_info']
                vm_state = node['vm_info']['VM']['STATE']
                lcm_state = node['vm_info']['VM']['LCM_STATE']

                if vm_state == '7' ||            # FAILED
                    (vm_state == '3' &&          # ACTIVE
                        (   lcm_state == '14' || # FAILURE
                            lcm_state == '16' || # UNKNOWN
                            lcm_state == '36' || # BOOT_FAILURE
                            lcm_state == '37' || # BOOT_MIGRATE_FAILURE
                            lcm_state == '38' || # PROLOG_MIGRATE_FAILURE
                            lcm_state == '39' || # PROLOG_FAILURE
                            lcm_state == '40' || # EPILOG_FAILURE
                            lcm_state == '41' || # EPILOG_STOP_FAILURE
                            lcm_state == '42' || # EPILOG_UNDEPLOY_FAILURE
                            lcm_state == '44' || # PROLOG_MIGRATE_POWEROFF_FAILURE
                            lcm_state == '46' )  # PROLOG_MIGRATE_SUSPEND_FAILURE
                    )

                    return true
                end
            end
        end

        return false
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

    # Determine if any of the role nodes failed to scale
    # @param [Role] role
    # @return [true|false]
    def any_node_failed_scaling?(role)
        role.get_nodes.each { |node|
            if node && node['vm_info'] &&
                (node['disposed'] == '1' || node['scale_up'] == '1') &&
                node['vm_info']['VM']['STATE'] == '7' # FAILED

                return true
            end
        }

        return false
    end

    def role_finished_scaling?(role)
        role.get_nodes.each { |node|
            # For scale up, check new nodes are running, or past running
            if node
                if node['scale_up'] == '1'
                    return false if !node['running']
                end
            else
                return false
            end
        }

        # TODO: If a shutdown ends in running again (VM doesn't have acpi),
        # the role/service will stay in SCALING

        # For scale down, it will finish when scaling nodes are deleted
        return role.get_nodes.size() == role.cardinality()
    end
end
