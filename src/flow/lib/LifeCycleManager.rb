# rubocop:disable Naming/FileName
# -------------------------------------------------------------------------- #
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                #
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

require 'strategy'
require 'ActionManager'
require 'ServiceWatchDog'
require 'ServiceAutoScaler'

# Service Life Cycle Manager
class ServiceLCM

    attr_writer :event_manager
    attr_reader :am

    LOG_COMP = 'LCM'
    ACTIONS  = [
        # Callbacks
        :deploy_cb,
        :deploy_failure_cb,
        :undeploy_cb,
        :undeploy_failure_cb,
        :cooldown_cb,
        :scaleup_cb,
        :scaleup_failure_cb,
        :scaledown_cb,
        :scaledown_failure_cb,
        :add_cb,
        :add_failure_cb,
        :remove_cb,
        :remove_failure_cb,

        # Network callbacks
        :deploy_nets_cb,
        :deploy_nets_failure_cb,
        :undeploy_nets_cb,
        :undeploy_nets_failure_cb,


        # WD callbacks
        :error_wd_cb,
        :done_wd_cb,
        :running_wd_cb,

        # Hold/Release callbacks
        :hold_cb,
        :release_cb
    ]

    def initialize(client, concurrency, cloud_auth)
        @cloud_auth = cloud_auth
        @am         = ActionManager.new(concurrency, true)
        @srv_pool   = ServicePool.new(@cloud_auth, nil)

        em_conf = {
            :cloud_auth  => @cloud_auth,
            :lcm         => @am
        }

        @event_manager = EventManager.new(em_conf).am
        @wd            = ServiceWD.new(em_conf)

        # Register Action Manager actions
        ACTIONS.each do |m|
            @am.register_action(m, method(m.to_s))
        end

        Thread.new { @am.start_listener }

        Thread.new { catch_up(client) }

        Thread.new { @wd.start(@srv_pool) }

        Thread.new do
            ServiceAutoScaler.new(
                @srv_pool,
                @cloud_auth,
                self
            ).start
        end
    end

    # Change service ownership
    #
    # @param client     [OpenNebula::Client] Client executing action
    # @param service_id [Integer]            Service ID
    # @param u_id       [Integer]            User ID
    # @param g_id       [Integer]            Group ID
    #
    # @return [OpenNebula::Error] Error if any
    def chown_action(client, service_id, u_id, g_id)
        rc = @srv_pool.get(service_id, client) do |service|
            service.chown(u_id, g_id)
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    # Change service permissions
    #
    # @param client     [OpenNebula::Client] Client executing action
    # @param service_id [Integer]            Service ID
    # @param octet      [Integer]            Permissions in octet format
    #
    # @return [OpenNebula::Error] Error if any
    def chmod_action(client, service_id, octet)
        rc = @srv_pool.get(service_id, client) do |service|
            service.chmod_octet(octet)
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    # Change service name
    #
    # @param client     [OpenNebula::Client] Client executing action
    # @param service_id [Integer]            Service ID
    # @param new_name   [String]             New service name
    #
    # @return [OpenNebula::Error] Error if any
    def rename_action(client, service_id, new_name)
        rc = @srv_pool.get(service_id, client) do |service|
            service.rename(new_name)
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    # Add shced action to service
    #
    # @param client     [OpenNebula::Client] Client executing action
    # @param service_id [Integer]            Service ID
    # @param action     [String]             Action to perform
    # @param period     [Integer]            When to execute the action
    # @param number     [Integer]            How many VMs per period
    # @param args       [String]             Action arguments
    #
    # @return [OpenNebula::Error] Error if any
    # rubocop:disable Metrics/ParameterLists
    def service_sched_action(client, service_id, action, period, number, args)
        # rubocop:enable Metrics/ParameterLists
        rc = @srv_pool.get(service_id, client) do |service|
            service.roles.each do |_, role|
                role.batch_action(action, period, number, args)
            end
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    # Add shced action to service role
    #
    # @param client     [OpenNebula::Client] Client executing action
    # @param service_id [Integer]            Service ID
    # @param role_name  [String]             Role to add action
    # @param action     [String]             Action to perform
    # @param period     [Integer]            When to execute the action
    # @param number     [Integer]            How many VMs per period
    # @param args       [String]             Action arguments
    #
    # @return [OpenNebula::Error] Error if any
    # rubocop:disable Metrics/ParameterLists
    def sched_action(client,
                     service_id,
                     role_name,
                     action,
                     period,
                     number,
                     args)
        # rubocop:enable Metrics/ParameterLists
        rc = @srv_pool.get(service_id, client) do |service|
            role = service.roles[role_name]

            if role.nil?
                break OpenNebula::Error.new("Role '#{role_name}' not found")
            end

            role.batch_action(action, period, number, args)
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    # Release a service on hold state
    #
    # @param client     [OpenNebula::Client] Client executing action
    # @param service_id [Integer]            Service ID
    #
    # @return [OpenNebula::Error] Error if any
    def release_action(client, service_id)
        rc = @srv_pool.get(service_id, client) do |service|
            # Get roles that can be release
            set_deploy_strategy(service)
            roles = service.roles_release

            if roles.empty?
                break OpenNebula::Error.new('Service has no roles in HOLD')
            end

            rc = release_roles(client,
                               roles,
                               'DEPLOYING',
                               'FAILED_DEPLOYING',
                               :wait_release,
                               service.report_ready?)

            if !OpenNebula.is_error?(rc)
                service.set_state(Service::STATE['DEPLOYING'])
            else
                service.set_state(Service::STATE['FAILED_DEPLOYING'])
            end

            service.update
            rc
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
        rc
    end

    ############################################################################
    # Life cycle manager actions
    ############################################################################

    # Deploy service networks
    #
    # @param client     [OpenNebula::Client] Client executing action
    # @param service_id [Integer]            Service ID
    #
    # @return [OpenNebula::Error] Error if any
    def deploy_nets_action(client, service_id)
        rc = @srv_pool.get(service_id, client) do |service|
            # Create vnets only first time action is called
            if service.state == Service::STATE['PENDING']
                rc = service.deploy_networks

                if OpenNebula.is_error?(rc)
                    service.set_state(Service::STATE['FAILED_DEPLOYING'])
                    service.update

                    break rc
                end
            end

            service.set_state(Service::STATE['DEPLOYING_NETS'])

            @event_manager.trigger_action(
                :wait_deploy_nets_action,
                service.id,
                client,
                service.id,
                service.networks(true)
            )

            service.update
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    # Undeploy service networks
    #
    # @param client     [OpenNebula::Client] Client executing action
    # @param service_id [Integer]            Service ID
    #
    # @return [OpenNebula::Error] Error if any
    def undeploy_nets_action(client, service_id)
        rc = @srv_pool.get(service_id, client) do |service|
            service.set_state(Service::STATE['UNDEPLOYING_NETS'])

            @event_manager.trigger_action(
                :wait_undeploy_nets_action,
                service.id,
                client,
                service.id,
                service.networks(false)
            )

            service.update
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    # Create new service
    #
    # @param client     [OpenNebula::Client] Client executing action
    # @param service_id [Integer]            Service ID
    #
    # @return [OpenNebula::Error] Error if any
    def deploy_action(client, service_id)
        rc = @srv_pool.get(service_id, client) do |service|
            set_deploy_strategy(service)

            roles = service.roles_deploy

            # Maybe roles.empty? because are being deploying in other threads
            if roles.empty?
                if service.all_roles_running?
                    service.set_state(Service::STATE['RUNNING'])
                    service.update

                    @wd.add_service(service)
                end

                # If there is no node in PENDING the service is not modified.
                break
            end

            # Set all roles on hold if the on_hold option
            # is set at service level
            roles.each do |_, role|
                if service.on_hold?
                    role.hold(true)
                elsif role.any_parent_on_hold?
                    role.hold(true)
                end
            end

            rc = deploy_roles(client,
                              roles,
                              'DEPLOYING',
                              'FAILED_DEPLOYING',
                              :wait_deploy_action,
                              service.report_ready?)

            if !OpenNebula.is_error?(rc) & service.on_hold?
                service.set_state(Service::STATE['HOLD'])
            elsif !OpenNebula.is_error?(rc) & !service.on_hold?
                service.set_state(Service::STATE['DEPLOYING'])
            else
                service.set_state(Service::STATE['FAILED_DEPLOYING'])
            end

            service.update

            rc
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    # Delete service
    #
    # @param client     [OpenNebula::Client] Client executing action
    # @param service_id [Integer]            Service ID
    # @param delete     [Boolean]            Force flow delete
    #
    # @return [OpenNebula::Error] Error if any
    def undeploy_action(client, service_id, delete = false)
        rc = @srv_pool.get(service_id, client) do |service|
            if !service.can_undeploy? && !delete
                break OpenNebula::Error.new(
                    'Service cannot be undeployed in state: ' \
                    "#{service.state_str}"
                )
            end

            @wd.remove_service(service_id)

            set_deploy_strategy(service)

            roles = service.roles_shutdown

            # If shutdown roles is empty, asume the service is in DONE and exit
            if roles.empty?
                service.delete

                break
            end

            rc = undeploy_roles(client,
                                roles,
                                'UNDEPLOYING',
                                'FAILED_UNDEPLOYING',
                                :wait_undeploy_action)

            if !OpenNebula.is_error?(rc)
                service.set_state(Service::STATE['UNDEPLOYING'])
            else
                service.set_state(Service::STATE['FAILED_UNDEPLOYING'])
            end

            service.update

            rc
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    # Scale service
    #
    # @param client      [OpenNebula::Client] Client executing action
    # @param service_id  [Integer]            Service ID
    # @param role_name   [String]             Role to scale
    # @param cardinality [Integer]            Number of VMs to scale
    # @param force       [Boolean]            True to force scaling
    #
    # @return [OpenNebula::Error] Error if any
    def scale_action(client, service_id, role_name, cardinality, force)
        rc = @srv_pool.get(service_id, client) do |service|
            unless service.can_scale?
                break OpenNebula::Error.new(
                    "Service cannot be scaled in state: #{service.state_str}"
                )
            end

            @wd.remove_service(service_id)

            role = service.roles[role_name]

            if role.nil?
                break OpenNebula::Error.new("Role #{role_name} not found")
            end

            rc               = nil
            cardinality_diff = cardinality - role.cardinality
            rc               = set_cardinality(role, cardinality, force)

            if OpenNebula.is_error?(rc)
                @wd.add_service(service)

                break OpenNebula::Error.new(
                    "Can't scale service #{service_id}: #{rc.message}"
                )
            end

            if cardinality_diff > 0
                # change client to have right ownership
                client = @cloud_auth.client("#{service.uname}:#{service.gid}")

                service.replace_client(client)

                role.scale_way('UP')

                rc = deploy_roles(client,
                                  { role_name => role },
                                  'SCALING',
                                  'FAILED_SCALING',
                                  :wait_scaleup_action,
                                  service.report_ready?)
            elsif cardinality_diff < 0
                role.scale_way('DOWN')

                rc = undeploy_roles(client,
                                    { role_name => role },
                                    'SCALING',
                                    'FAILED_SCALING',
                                    :wait_scaledown_action)
            else
                break OpenNebula::Error.new(
                    "Cardinality of #{role_name} is already at #{cardinality}"
                )
            end

            if !OpenNebula.is_error?(rc)
                service.set_state(Service::STATE['SCALING'])
            else
                service.set_state(Service::STATE['FAILED_SCALING'])
            end

            service.update

            rc
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    # Recover service
    #
    # @param client     [OpenNebula::Client] Client executing action
    # @param service_id [Integer]            Service ID
    # @param delete     [Boolean]            True to recover delete a service
    #
    # @return [OpenNebula::Error] Error if any
    def recover_action(client, service_id, delete = false)
        @event_manager.cancel_action(service_id.to_i)

        return undeploy_action(client, service_id, true) if delete

        rc = @srv_pool.get(service_id, client) do |service|
            if service.can_recover_deploy?
                recover_deploy(client, service)
            elsif service.can_recover_undeploy?
                recover_undeploy(client, service)
            elsif service.can_recover_scale?
                # change client to have right ownership
                client = @cloud_auth.client("#{service.uname}:#{service.gid}")

                service.replace_client(client)
                recover_scale(client, service)
            elsif service.can_recover_deploy_nets?
                recover_nets(:wait_deploy_nets_action, client, service)
            elsif service.can_recover_undeploy_nets?
                recover_nets(:wait_undeploy_nets_action, client, service)
            elsif Service::STATE['COOLDOWN'] == service.state
                service.set_state(Service::STATE['RUNNING'])

                service.roles.each do |_, role|
                    role.set_state(Role::STATE['RUNNING'])
                end
            else
                break OpenNebula::Error.new(
                    'Service cannot be recovered in state: ' \
                    "#{service.state_str}"
                )
            end

            service.update
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    # Update service template
    #
    # @param client       [OpenNebula::Client] Client executing action
    # @param service_id   [Integer]            Service ID
    # @param new_tempalte [String]             New template
    # @param append       [Boolean]            True to append template
    def service_update(client, service_id, new_template, append)
        rc = @srv_pool.get(service_id, client) do |service|
            unless service.can_update?
                break OpenNebula::Error.new(
                    "Service cannot be updated in state: #{service.state_str}"
                )
            end

            rc = service.check_new_template(new_template, append)

            unless rc[0]
                if rc[1] == 'name'
                    break OpenNebula::Error.new(
                        'To change `service/name` use rename operation'
                    )
                else
                    break OpenNebula::Error.new(
                        "Immutable value: `#{rc[1]}` can not be changed"
                    )
                end
            end

            service.update(new_template, append)
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    # Update role elasticity/schedule policies
    #
    # @param client      [OpenNebula::Client] Client executing action
    # @param service_id  [Integer]            Service ID
    # @param role_name   [String]             Role to update
    # @param policies    [Hash]               New policies values
    # @param cooldown    [Integer]            New cooldown time
    #
    # @return [OpenNebula::Error] Error if any
    def update_role_policies(client, service_id, role_name, policies, cooldown)
        rc = @srv_pool.get(service_id, client) do |service|
            role                = service.roles[role_name]
            elasticity_policies = policies['elasticity_policies']
            scheduled_policies  = policies['scheduled_policies']

            if elasticity_policies && !elasticity_policies.empty?
                role.update_elasticity_policies(elasticity_policies)
            end

            if scheduled_policies && !scheduled_policies.empty?
                role.update_scheduled_policies(scheduled_policies)
            end

            role.update_cooldown(cooldown)

            service.update
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    # Add role from running service
    #
    # @param client      [OpenNebula::Client] Client executing action
    # @param service_id  [Integer]            Service ID
    # @param role        [Hash]               Role information
    def add_role_action(client, service_id, role)
        rc = @srv_pool.get(service_id, client) do |service|
            unless service.running?
                break OpenNebula::Error.new(
                    "Cannot modify roles in state: #{service.state_str}"
                )
            end

            role = service.add_role(role)

            break role if OpenNebula.is_error?(role)

            service.update

            rc = service.deploy_networks(false)

            if OpenNebula.is_error?(rc)
                service.set_state(Service::STATE['FAILED_DEPLOYING'])
                service.update

                break rc
            end

            service.update

            add_role(client, service, role)
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    # Remove role from running service
    #
    # @param client      [OpenNebula::Client] Client executing action
    # @param service_id  [Integer]            Service ID
    # @param role        [Hash]               Role information
    def remove_role_action(client, service_id, role)
        rc = @srv_pool.get(service_id, client) do |service|
            unless service.running?
                break OpenNebula::Error.new(
                    "Cannot modify roles in state: #{service.state_str}"
                )
            end

            unless service.roles[role]
                break OpenNebula::Error.new("Role #{role} does not exist")
            end

            remove_role(client, service, service.roles[role])
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    private

    ############################################################################
    # Callbacks
    ############################################################################

    def deploy_cb(client, service_id, role_name, nodes)
        undeploy = false

        rc = @srv_pool.get(service_id, client) do |service|
            service.roles[role_name].set_state(Role::STATE['RUNNING'])

            service.roles[role_name].nodes.delete_if do |node|
                if nodes[node] && service.roles[role_name].cardinalitty > 0
                    service.roles[role_name].cardinality -= 1
                end

                nodes[node]
            end

            # If the role has 0 nodes, deleteƒ role
            undeploy = service.check_role(service.roles[role_name])

            if service.all_roles_running?
                service.set_state(Service::STATE['RUNNING'])
            elsif service.strategy == 'straight'
                set_deploy_strategy(service)

                deploy_roles(client,
                             service.roles_deploy,
                             'DEPLOYING',
                             'FAILED_DEPLOYING',
                             :wait_deploy_action,
                             service.report_ready?)
            end

            rc = service.update

            return rc if OpenNebula.is_error?(rc)

            @wd.add_service(service) if service.all_roles_running?
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        return unless undeploy

        Log.info LOG_COMP, "Automatically deleting service #{service_id}"

        undeploy_action(client, service_id)
    end

    def deploy_failure_cb(client, service_id, role_name)
        rc = @srv_pool.get(service_id, client) do |service|
            # stop actions for the service if deploy fails
            @event_manager.cancel_action(service_id)

            service.set_state(Service::STATE['FAILED_DEPLOYING'])
            service.roles[role_name].set_state(Role::STATE['FAILED_DEPLOYING'])

            service.update
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
    end

    def deploy_nets_cb(client, service_id)
        deploy_action(client, service_id)
    end

    def deploy_nets_failure_cb(client, service_id)
        rc = @srv_pool.get(service_id, client) do |service|
            # stop actions for the service if deploy fails
            @event_manager.cancel_action(service_id)

            service.set_state(Service::STATE['FAILED_DEPLOYING_NETS'])
            service.update
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
    end

    def undeploy_cb(client, service_id, role_name, nodes)
        undeploy_nets = false

        rc = @srv_pool.get(service_id, client) do |service|
            service.roles[role_name].set_state(Role::STATE['DONE'])

            service.roles[role_name].nodes.delete_if do |node|
                !nodes[:failure].include?(node['deploy_id']) &&
                    nodes[:successful].include?(node['deploy_id'])
            end

            if service.all_roles_done?
                rc = service.delete_networks

                if rc && !rc.empty?
                    Log.info LOG_COMP, 'Error trying to delete '\
                                       "Virtual Networks #{rc}"
                end

                undeploy_nets = true

                break
            elsif service.strategy == 'straight'
                set_deploy_strategy(service)

                undeploy_roles(client,
                               service.roles_shutdown,
                               'UNDEPLOYING',
                               'FAILED_UNDEPLOYING',
                               :wait_undeploy_action)
            end

            service.update
        end

        undeploy_nets_action(client, service_id) if undeploy_nets

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
    end

    def undeploy_nets_cb(client, service_id)
        rc = @srv_pool.get(service_id, client) do |service|
            service.delete
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
    end

    def undeploy_nets_failure_cb(client, service_id)
        rc = @srv_pool.get(service_id, client) do |service|
            # stop actions for the service if deploy fails
            @event_manager.cancel_action(service_id)

            service.set_state(Service::STATE['FAILED_UNDEPLOYING_NETS'])
            service.update
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
    end

    def undeploy_failure_cb(client, service_id, role_name, nodes)
        rc = @srv_pool.get(service_id, client) do |service|
            # stop actions for the service if deploy fails
            @event_manager.cancel_action(service_id)

            service.set_state(Service::STATE['FAILED_UNDEPLOYING'])
            service.roles[role_name]
                   .set_state(Role::STATE['FAILED_UNDEPLOYING'])

            service.roles[role_name].nodes.delete_if do |node|
                !nodes[:failure].include?(node['deploy_id']) &&
                    nodes[:successful].include?(node['deploy_id'])
            end

            service.update
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
    end

    def scaleup_cb(client, service_id, role_name, nodes)
        rc = @srv_pool.get(service_id, client) do |service|
            service.roles[role_name].nodes.delete_if do |node|
                if nodes[node] && service.roles[role_name].cardinalitty > 0
                    service.roles[role_name].cardinality -= 1
                end

                nodes[node]
            end

            service.set_state(Service::STATE['COOLDOWN'])
            service.roles[role_name].set_state(Role::STATE['COOLDOWN'])

            @event_manager.trigger_action(:wait_cooldown_action,
                                          service.id,
                                          client,
                                          service.id,
                                          role_name,
                                          service.roles[role_name].cooldown)

            service.roles[role_name].clean_scale_way

            service.update
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
    end

    def scaledown_cb(client, service_id, role_name, nodes)
        rc = @srv_pool.get(service_id, client) do |service|
            service.set_state(Service::STATE['COOLDOWN'])
            service.roles[role_name].set_state(Role::STATE['COOLDOWN'])

            service.roles[role_name].nodes.delete_if do |node|
                !nodes[:failure].include?(node['deploy_id']) &&
                    nodes[:successful].include?(node['deploy_id'])
            end

            @event_manager.trigger_action(:wait_cooldown_action,
                                          service.id,
                                          client,
                                          service.id,
                                          role_name,
                                          service.roles[role_name].cooldown)

            service.roles[role_name].clean_scale_way

            service.update
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
    end

    def scaleup_failure_cb(client, service_id, role_name)
        rc = @srv_pool.get(service_id, client) do |service|
            # stop actions for the service if deploy fails
            @event_manager.cancel_action(service_id)

            service.set_state(Service::STATE['FAILED_SCALING'])
            service.roles[role_name].set_state(Role::STATE['FAILED_SCALING'])

            service.update
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
    end

    def scaledown_failure_cb(client, service_id, role_name, nodes)
        rc = @srv_pool.get(service_id, client) do |service|
            # stop actions for the service if deploy fails
            @event_manager.cancel_action(service_id)

            role = service.roles[role_name]

            service.set_state(Service::STATE['FAILED_SCALING'])
            role.set_state(Role::STATE['FAILED_SCALING'])

            role.nodes.delete_if do |node|
                !nodes[:failure].include?(node['deploy_id']) &&
                    nodes[:successful].include?(node['deploy_id'])
            end

            service.update
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
    end

    def cooldown_cb(client, service_id, role_name)
        undeploy = false

        rc = @srv_pool.get(service_id, client) do |service|
            service.set_state(Service::STATE['RUNNING'])
            service.roles[role_name].set_state(Role::STATE['RUNNING'])

            service.update

            # If the role has 0 nodes, delete role
            undeploy = service.check_role(service.roles[role_name])

            @wd.add_service(service)
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        return unless undeploy

        Log.info LOG_COMP, "Automatically deleting service #{service_id}"

        undeploy_action(client, service_id)
    end

    def add_cb(client, service_id, role_name, _)
        rc = @srv_pool.get(service_id, client) do |service|
            service.roles[role_name].set_state(Role::STATE['RUNNING'])

            service.set_state(Service::STATE['RUNNING'])

            rc = service.update

            return rc if OpenNebula.is_error?(rc)

            @wd.add_service(service) if service.all_roles_running?
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
    end

    def add_failure_cb(client, service_id, role_name)
        rc = @srv_pool.get(service_id, client) do |service|
            # stop actions for the service if deploy fails
            @event_manager.cancel_action(service_id)

            service.set_state(Service::STATE['FAILED_DEPLOYING'])
            service.roles[role_name].set_state(Role::STATE['FAILED_DEPLOYING'])

            service.update
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
    end

    def remove_cb(client, service_id, role_name, _)
        rc = @srv_pool.get(service_id, client) do |service|
            service.remove_role(role_name)

            if service.all_roles_done?
                rc = service.delete_networks

                if rc && !rc.empty?
                    Log.info LOG_COMP, 'Error trying to delete '\
                                       "Virtual Networks #{rc}"
                end

                service.delete
            else
                service.set_state(Service::STATE['RUNNING'])

                rc = service.update

                return rc if OpenNebula.is_error?(rc)

                @wd.add_service(service) if service.all_roles_running?
            end
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
    end

    def remove_failure_cb(client, service_id, role_name, nodes)
        rc = @srv_pool.get(service_id, client) do |service|
            # stop actions for the service if deploy fails
            @event_manager.cancel_action(service_id)

            service.set_state(Service::STATE['FAILED_UNDEPLOYING'])
            service.roles[role_name]
                   .set_state(Role::STATE['FAILED_UNDEPLOYING'])

            service.roles[role_name].nodes.delete_if do |node|
                !nodes[:failure].include?(node['deploy_id']) &&
                    nodes[:successful].include?(node['deploy_id'])
            end

            service.update
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)
    end

    def hold_cb(client, service_id, role_name)
        rc = @srv_pool.get(service_id, client) do |service|
            if service.roles[role_name].state != Role::STATE['HOLD']
                service.roles[role_name].set_state(Role::STATE['HOLD'])
            end

            if service.all_roles_hold? &&
                service.state != Service::STATE['HOLD']
                service.set_state(Service::STATE['HOLD'])
            elsif service.strategy == 'straight'
                set_deploy_strategy(service)

                deploy_roles(client,
                             service.roles_hold,
                             'DEPLOYING',
                             'FAILED_DEPLOYING',
                             :wait_deploy,
                             service.report_ready?)
            end

            rc = service.update

            return rc if OpenNebula.is_error?(rc)
        end

        Log.error 'WD', rc.message if OpenNebula.is_error?(rc)
    end

    def release_cb(client, service_id, role_name, nodes)
        undeploy = false

        rc = @srv_pool.get(service_id, client) do |service|
            service.roles[role_name].set_state(Role::STATE['RUNNING'])

            service.roles[role_name].nodes.delete_if do |node|
                if nodes[node] && service.roles[role_name].cardinalitty > 0
                    service.roles[role_name].cardinality -= 1
                end

                nodes[node]
            end

            # If the role has 0 nodes, delete role
            undeploy = service.check_role(service.roles[role_name])

            if service.all_roles_running?
                service.set_state(Service::STATE['RUNNING'])
            elsif service.strategy == 'straight'
                set_deploy_strategy(service)

                release_roles(client,
                              service.roles_release,
                              'DEPLOYING',
                              'FAILED_DEPLOYING',
                              :wait_deploy,
                              service.report_ready?)
            end

            rc = service.update

            return rc if OpenNebula.is_error?(rc)

            @wd.add_service(service) if service.all_roles_running?
        end

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        return unless undeploy

        Log.info LOG_COMP, "Automatically deleting service #{service_id}"

        undeploy_action(client, service_id)
    end

    ############################################################################
    # WatchDog Callbacks
    ############################################################################

    def error_wd_cb(client, service_id, role_name, _node)
        rc = @srv_pool.get(service_id, client) do |service|
            if service.state != Service::STATE['WARNING']
                service.set_state(Service::STATE['WARNING'])
            end

            if service.roles[role_name].state != Role::STATE['WARNING']
                service.roles[role_name].set_state(Role::STATE['WARNING'])
            end

            service.update
        end

        Log.error 'WD', rc.message if OpenNebula.is_error?(rc)
    end

    def done_wd_cb(client, service_id, role_name, node)
        undeploy = false

        rc = @srv_pool.get(service_id, client) do |service|
            role = service.roles[role_name]

            next unless role

            cardinality = role.cardinality - 1

            next unless role.nodes.find {|n| n['deploy_id'] == node }

            # just update if the cardinality is positive
            set_cardinality(role, cardinality, true) if cardinality >= 0

            role.nodes.delete_if {|n| n['deploy_id'] == node }

            # If the role has 0 nodes, delete role
            undeploy = service.check_role(role)

            service.update

            Log.info 'WD',
                     "Node #{node} is done, " \
                     "updating service #{service_id}:#{role_name} " \
                     "cardinality to #{cardinality}"
        end

        Log.error 'WD', rc.message if OpenNebula.is_error?(rc)

        return unless undeploy

        Log.info LOG_COMP, "Automatically deleting service #{service_id}"

        undeploy_action(client, service_id)
    end

    def running_wd_cb(client, service_id, role_name, _node)
        undeploy = false

        rc = @srv_pool.get(service_id, client) do |service|
            role = service.roles[role_name]

            if service.roles[role_name].state != Role::STATE['RUNNING']
                service.roles[role_name].set_state(Role::STATE['RUNNING'])
            end

            if service.all_roles_running? &&
               service.state != Service::STATE['RUNNING']
                service.set_state(Service::STATE['RUNNING'])
            end

            # If the role has 0 nodes, delete role
            undeploy = service.check_role(role)

            service.update
        end

        Log.error 'WD', rc.message if OpenNebula.is_error?(rc)

        return unless undeploy

        Log.info LOG_COMP, "Automatically deleting service #{service_id}"

        undeploy_action(client, service_id)
    end

    ############################################################################
    # Helpers
    ############################################################################

    # Iterate through the services for catching up with the state of each servic
    # used when the LCM starts
    def catch_up(client)
        Log.error LOG_COMP, 'Catching up...'

        @srv_pool.info_all

        @srv_pool.each do |service|
            recover_action(client, service.id) if service.transient_state?
        end
    end

    # Returns the deployment strategy for the given Service
    # @param [Service] service the service
    # rubocop:disable Naming/AccessorMethodName
    def set_deploy_strategy(service)
        # rubocop:enable Naming/AccessorMethodName
        case service.strategy
        when 'straight'
            service.extend(Straight)
        else
            service.extend(Strategy)
        end
    end

    # Returns true if the deployments of all roles was fine and
    # update their state consequently
    # @param [Array<Role>] roles to be deployed
    # @param [Role::STATE] success_state new state of the role
    #                      if deployed successfuly
    # @param [Role::STATE] error_state new state of the role
    #                      if deployed unsuccessfuly
    # rubocop:disable Metrics/ParameterLists
    def deploy_roles(client, roles, success_state, error_state, action, report)
        # rubocop:enable Metrics/ParameterLists
        roles.each do |name, role|
            if role.state == Role::STATE['PENDING']
                # Set all roles on hold if the on_hold option
                # is set at service level
                if role.service_on_hold?
                    role.hold(true)
                elsif role.any_parent_on_hold?
                    role.hold(true)
                end
            end

            rc = role.deploy

            if !rc[0]
                role.set_state(Role::STATE[error_state])
                break OpenNebula::Error.new(
                    "Error deploying role #{name}: #{rc[1]}"
                )
            end

            if role.on_hold? && role.state == Role::STATE['PENDING']
                role.set_state(Role::STATE['HOLD'])
                @event_manager.trigger_action(:wait_hold,
                                              role.service.id,
                                              client,
                                              role.service.id,
                                              role.name,
                                              rc[0])
            else
                role.set_state(Role::STATE[success_state])
                @event_manager.trigger_action(action,
                                              role.service.id,
                                              client,
                                              role.service.id,
                                              role.name,
                                              rc[0],
                                              report)
            end
        end
    end

    def undeploy_roles(client, roles, success_state, error_state, action)
        roles.each do |name, role|
            rc = role.shutdown(false)

            if !rc[0]
                role.set_state(Role::STATE[error_state])
                break OpenNebula::Error.new(
                    "Error undeploying role #{name}: #{rc[1]}"
                )
            end

            role.set_state(Role::STATE[success_state])

            # TODO, take only subset of nodes which needs to
            # be undeployed (new role.nodes_undeployed_ids ?)
            @event_manager.trigger_action(action,
                                          role.service.id,
                                          client,
                                          role.service.id,
                                          role.name,
                                          rc[0])
        end
    end

    # rubocop:disable Metrics/ParameterLists
    def release_roles(client, roles, success_state, error_state, action, report)
        # rubocop:enable Metrics/ParameterLists
        roles.each do |name, role|
            rc = role.release

            if !rc[1]
                role.set_state(Role::STATE[error_state])
                break OpenNebula::Error.new(
                    "Error releasing role #{name}: #{rc[1]}"
                )
            end

            role.set_state(Role::STATE[success_state])

            @event_manager.trigger_action(action,
                                          role.service.id,
                                          client,
                                          role.service.id,
                                          role.name,
                                          rc[0],
                                          report)
        end
    end

    def set_cardinality(role, cardinality, force)
        tmpl_json = "{ \"cardinality\" : #{cardinality},\n" \
                    "  \"force\" : #{force} }"

        rc = role.update(JSON.parse(tmpl_json))

        return rc if OpenNebula.is_error?(rc)

        nil
    end

    def recover_deploy(client, service)
        service.roles.each do |name, role|
            next unless role.can_recover_deploy?

            nodes = role.recover_deploy(service.report_ready?)

            @event_manager.trigger_action(:wait_deploy_action,
                                          service.id,
                                          client,
                                          service.id,
                                          name,
                                          nodes,
                                          service.report_ready?)
        end
    end

    def recover_undeploy(client, service)
        service.roles.each do |name, role|
            next unless role.can_recover_undeploy?

            nodes = role.recover_undeploy

            @event_manager.trigger_action(:wait_undeploy_action,
                                          service.id,
                                          client,
                                          service.id,
                                          name,
                                          nodes)
        end
    end

    def recover_scale(client, service)
        service.roles.each do |name, role|
            next unless role.can_recover_scale?

            nodes, up = role.recover_scale(service.report_ready?)

            if up
                @event_manager.trigger_action(:wait_scaleup_action,
                                              service.id,
                                              client,
                                              service.id,
                                              name,
                                              nodes,
                                              service.report_ready?)
            else
                @event_manager.trigger_action(:wait_scaledown_action,
                                              service.id,
                                              client,
                                              service.id,
                                              name,
                                              nodes)
            end
        end
    end

    def recover_nets(action, client, service)
        action == :wait_deploy_nets_action ? deploy = true : deploy = false

        @event_manager.trigger_action(
            action,
            service.id,
            client,
            service.id,
            service.networks(deploy)
        )
    end

    def add_role(client, service, role)
        @wd.remove_service(service.id)

        set_deploy_strategy(service)

        rc = deploy_roles(client,
                          { role.name => role },
                          'DEPLOYING',
                          'FAILED_DEPLOYING',
                          :wait_add_action,
                          service.report_ready?)

        if !OpenNebula.is_error?(rc)
            service.set_state(Service::STATE['DEPLOYING'])
        else
            service.set_state(Service::STATE['FAILED_DEPLOYING'])
        end

        service.update

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

    def remove_role(client, service, role)
        @wd.remove_service(service.id)

        set_deploy_strategy(service)

        rc = undeploy_roles(client,
                            { role.name => role },
                            'UNDEPLOYING',
                            'FAILED_UNDEPLOYING',
                            :wait_remove_action)

        if !OpenNebula.is_error?(rc)
            service.set_state(Service::STATE['UNDEPLOYING'])
        else
            service.set_state(Service::STATE['FAILED_UNDEPLOYING'])
        end

        service.update

        Log.error LOG_COMP, rc.message if OpenNebula.is_error?(rc)

        rc
    end

end
# rubocop:enable Naming/FileName
