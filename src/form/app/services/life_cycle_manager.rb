# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

module OneForm

    # Provision Life Cycle Manager
    class ProvisionLCM

        def initialize(cloud_auth)
            @provision_pool = ProvisionPool.new(cloud_auth, nil)
        end

        #------------------------------------------------------------------
        # States Actions
        #------------------------------------------------------------------

        # Start the preparation of the provision creating the provision directory
        # And copying the template files
        #
        # INIT
        # ├── success: PLANNING
        # └── failure: INIT_FAILURE
        def start_init(external_user, provision_id)
            success_cb = -> { start_planning(external_user, provision_id) }
            failure_cb = -> { init_failure_cb(external_user, provision_id) }

            @provision_pool.get(provision_id, external_user) do |provision, provider|
                provision.state = 'INIT'
                Terraform.prepare(provision, provider, success_cb, failure_cb)
            end
        rescue StandardError => e
            Log.error("provision #{provision_id}: #{e.message}")
            init_failure_cb(external_user, provision_id)
        end

        # Start the planning of the provision planifying the terraform resources
        #
        # PLANNING
        # ├── success: APPLYING
        # └── failure: PLANNING_FAILURE
        def start_planning(external_user, provision_id)
            success_cb = -> { start_applying(external_user, provision_id) }
            failure_cb = -> { planning_failure_cb(external_user, provision_id) }

            @provision_pool.get(provision_id, external_user) do |provision|
                provision.state = 'PLANNING'
                Terraform.plan(provision, success_cb, failure_cb)
            end
        rescue StandardError => e
            Log.error("provision #{provision_id}: #{e.message}")
            planning_failure_cb(external_user, provision_id)
        end

        # Start the creation of the resources in the cloud provider using terraform
        #
        # APPLYING
        # ├── success: CONFIGURING_ONE
        # └── failure: PLANNING_FAILURE
        def start_applying(external_user, provision_id)
            success_cb = -> { start_configuring_one(external_user, provision_id) }
            failure_cb = -> { applying_failure_cb(external_user, provision_id) }
            outputs_cb = -> { save_tfoutputs(external_user, provision_id, success_cb, failure_cb) }

            @provision_pool.get(provision_id, external_user) do |provision|
                provision.state = 'APPLYING'
                Terraform.apply(provision, outputs_cb, failure_cb)
            end
        rescue StandardError => e
            Log.error(e.message)
            applying_failure_cb(external_user, provision_id)
        end

        # Start the creation of resources in OpenNebula based on the content
        # of one_objects in the provision
        #
        # CONFIGURING_ONE
        # ├── success: CONFIGURING_PROVISION
        # └── failure: CONFIGURING_ONE_FAILURE
        def start_configuring_one(external_user, provision_id)
            success_cb = -> { start_configuring_provision(external_user, provision_id) }
            failure_cb = -> { configuring_one_failure_cb(external_user, provision_id) }

            @provision_pool.get(provision_id, external_user) do |provision|
                provision.state = 'CONFIGURING_ONE'
                provision.create_one_objects(success_cb, failure_cb)
            end
        rescue StandardError => e
            Log.error("provision #{provision_id}: #{e.message}")
            configuring_one_failure_cb(external_user, provision_id)
        end

        # Start the configuration of the nodes using ansible y one-deploy playbook
        #
        # CONFIGURING_PROVISION
        # ├── success: RUNNING
        # └── failure: CONFIGURING_PROVISION_FAILURE
        def start_configuring_provision(external_user, provision_id)
            success_cb = -> { start_running(external_user, provision_id) }
            failure_cb = -> { configuring_provision_failure_cb(external_user, provision_id) }

            @provision_pool.get(provision_id, external_user) do |provision, provider|
                provision.state = 'CONFIGURING_PROVISION'
                Ansible.configure(provider, provision, success_cb, failure_cb)
            end
        rescue StandardError => e
            Log.error("provision #{provision_id}: #{e.message}")
            configuring_provision_failure_cb(external_user, provision_id)
        end

        # Start the running state of the provision and remains in this state
        # until the provision is deprovisioned by the user
        #
        # RUNNING
        # ├── success: -
        # └── failure: -
        def start_running(external_user, provision_id)
            empty_provision = false

            @provision_pool.get(provision_id, external_user) do |provision|
                provision.update_objects
                provision.state = 'RUNNING'

                if provision.hosts.empty?
                    empty_provision = true
                    provision.logger.info('Provision is empty, deprovisioning...')
                end
            end

            return unless empty_provision

            start_deprovisioning_one(external_user, provision_id, { 'force' => true })
        end

        # Start the scaling of the provision. The scaling can be up or down
        # depending on the direction parameter. The nodes parameter is the
        # number of nodes to add or remove from the provision.
        #
        # SCALING
        # ├── success: RUNNING (after all operations)
        # |            -> INIT (if scaling up)
        # |            -> DEPROVISIONING_ONE (if scaling down)
        # └── failure: SCALING_FAILURE
        def start_scaling(external_user, provision_id, direction, nodes, opts = {})
            callbacks = {
                :init         => -> { start_init(external_user, provision_id) },
                :deprovision  => lambda do |options|
                    start_deprovisioning_one(external_user, provision_id, options)
                end
            }

            action = nil

            @provision_pool.get(provision_id, external_user) do |provision|
                # Check if the provision is in a state that can be scaled
                return OpenNebula::Error.new(
                    "Cannot scale #{direction} provision #{provision_id} in state: " \
                    "#{provision.str_state}",
                    OpenNebula::Error::EACTION
                ) unless provision.can_scale?

                case direction.downcase
                when 'up'
                    action = -> { scale_up(provision, nodes, opts, callbacks) }
                when 'down'
                    action = -> { scale_down(provision, nodes, opts, callbacks) }
                else
                    return OpenNebula::Error.new(
                        "Scaling operation not supported: #{direction}, " \
                        'only up and down are supported',
                        OpenNebula::Error::EACTION
                    )
                end
            end

            action.call if action
        rescue StandardError => e
            Log.error("provision #{provision_id}: #{e.message}")
            scaling_failure_cb(external_user, provision_id)
        end

        # Try to add or remove IPs ovision
        def start_scaling_network(external_user, provision_id, direction, opts = {})
            @provision_pool.get(provision_id, external_user) do |provision|
                case direction.downcase
                when 'up'
                    amount = opts['amount'] || 1

                    provision.oneform_public_ips += amount
                    rc = provision.add_public_ip_ars
                    return rc if OpenNebula.is_error?(rc)
                when 'down'
                    ar_id = opts['ar_id']

                    return OpenNebula::Error.new(
                        'Missing Address Range ID. Unable to remove without a specified ID',
                        OpenNebula::Error::VALIDATION_EC
                    ) if ar_id.nil?

                    rc = provision.remove_public_ip_ar(ar_id)
                    return rc if OpenNebula.is_error?(rc)

                    provision.oneform_public_ips -= 1
                else
                    return OpenNebula::Error.new(
                        "Scaling network operation not supported: #{direction}, " \
                        'only up and down are supported',
                        OpenNebula::Error::EACTION
                    )
                end

                provision.update_objects
            end
        rescue StandardError => e
            Log.error("Error scaling networks in provision #{provision_id}: #{e.message}")

            return OpenNebula::Error.new(
                "Error scaling networks: #{e.message}",
                OpenNebula::Error::GENERAL_EC
            )
        end

        # Start the removing of the OpenNebula objects created by the provision
        # In case of found any unmanaged resources, it will enter in faulre state
        #
        # DEPROVISIONING_ONE
        # ├── success: DEPROVISIONING
        # └── failure: DEPROVISIONING_ONE_FAILURE
        def start_deprovisioning_one(external_user, provision_id, opts = {})
            success_cb = -> { start_deprovisioning(external_user, provision_id) }
            failure_cb = -> { deprovisioning_one_failure_cb(external_user, provision_id) }

            # Options
            force     = opts['force'] || false
            resources = opts['resources'] || {}

            @provision_pool.get(provision_id, external_user) do |provision|
                # Check if the provision is in a state that can be deprovisioned
                # when force is true, allow the provision to be deprovisioned in any state
                return OpenNebula::Error.new(
                    "Cannot deprovision provision in state: #{provision.str_state}",
                    OpenNebula::Error::EACTION
                ) unless force || provision.can_deprovision?

                # Check if resources types are valid
                invalid_keys = resources.keys - Provision::REMOVABLE_RESOURCES

                return OpenNebula::Error.new(
                    "Invalid resources types found: #{invalid_keys.join(', ')} " \
                    "only #{allowed.keys.join(', ')} are allowed",
                    OpenNebula::Error::EACTION
                ) unless invalid_keys.empty?

                # Retrieve the unmanaged resources and save them in the provision body
                provision.check_unmanaged_resources

                # If resources list is empty, check if there are unmanaged resources
                # anywhere in the provision
                if resources.empty?
                    return OpenNebula::Error.new(
                        {
                            'message' => 'Unmanaged resources found, ' \
                                         'use `force` option to delete them',
                            'context' => provision.unmanaged_resources_all
                        },
                        OpenNebula::Error::EACTION
                    ) if provision.unmanaged_resources? && !force
                else
                    # Otherwise, if resources are provided, check for unmanaged
                    # resources in the specified types.
                    unmmanaged_objects = {}

                    resources.each do |type, ids|
                        ids.each do |id|
                            next unless provision.unmanaged_resources_for_id?(type, id)

                            childs = provision.unmanaged_resources_for_id(type, id)

                            unmmanaged_objects[type]   ||= {}
                            unmmanaged_objects[type][id] = childs
                        end
                    end

                    return OpenNebula::Error.new(
                        {
                            'message' => 'Unmanaged resources found, ' \
                                         'use `force` option to delete them',
                            'context' => unmmanaged_objects
                        },
                        OpenNebula::Error::EACTION
                    ) if !unmmanaged_objects.empty? && !force
                end

                # Directly setting the state, bypassing normal transition
                # validation for forced deprovisioning
                provision.body['state'] = Provision::STATE['DEPROVISIONING_ONE']
                provision.update

                provision.delete_one_objects(resources, success_cb, failure_cb)
            end
        rescue StandardError => e
            Log.error("provision #{provision_id}: #{e.message}")
            deprovisioning_one_failure_cb(external_user, provision_id)
        end

        # Start the removing of the resources in the cloud provider using terraform
        #
        # DEPROVISIONING
        # ├── success: RUNNING / DONE
        # └── failure: DEPROVISIONING_FAILURE
        def start_deprovisioning(external_user, provision_id)
            # The success callback behavior depends on:
            # - If the cluster ID is not nil (the provision has existing resources) -> running
            # - If the cluster ID is nil (the provision has no resources) -> done
            success_cb = lambda do
                next_state = nil

                @provision_pool.get(provision_id, external_user) do |provision|
                    if !provision.cluster_empty?
                        next_state = -> { start_running(external_user, provision_id) }
                    else
                        next_state = -> { start_done(external_user, provision_id) }
                    end
                end

                next_state.call if next_state
            end

            failure_cb = -> { deprovisioning_failure_cb(external_user, provision_id) }
            outputs_cb = -> { save_tfoutputs(external_user, provision_id, success_cb, failure_cb) }

            action = nil

            @provision_pool.get(provision_id, external_user) do |provision, provider|
                provision.state = 'DEPROVISIONING'

                # Get the resources to destroy (empty = all resources)
                resources = []

                unless provision.cluster_empty?
                    # If cluster is not deleted, remove the nil hosts
                    # Currenty we only are supporting host deletion through terraform
                    resources = provision.hosts
                                         .select {|h| h['id'].nil? }
                                         .map {|h| h['resource_id'] }
                end

                # Only run Terraform destroy if:
                # - The provision is empty (all resources should be destroyed), OR
                # - There are specific Terraform-managed resources to destroy
                #
                # This avoids unnecessary Terraform calls when only OpenNebula resources
                # has been deleted (i.e., when user deletes a datastore using oneform)
                if provision.cluster_empty? || !resources.empty?
                    action = lambda do
                        Terraform.destroy(provision, provider, resources, outputs_cb, failure_cb)
                    end
                else
                    action = -> { success_cb.call }
                end
            end

            action.call if action
        rescue StandardError => e
            Log.error("provision #{provision_id}: #{e.message}")
            deprovisioning_failure_cb(external_user, provision_id)
        end

        # Start the done state of the provision. The provision is finished
        #
        # DONE
        # ├── success: DONE
        # └── failure: DONE_FAILURE
        def start_done(external_user, provision_id)
            @provision_pool.get(provision_id, external_user) do |provision|
                provision.state = 'DONE'
                provision.delete
            end
        rescue StandardError => e
            Log.error("provision #{provision_id}: #{e.message}")
            done_failure_cb(external_user, provision_id)
        end

        #------------------------------------------------------------------
        # Recover actions
        #------------------------------------------------------------------

        # Recover the provision from the failure state
        def recover_provision(external_user, provision_id, opts = {})
            provision_state = nil

            @provision_pool.get(provision_id, external_user) do |provision|
                provision_state = provision.str_state
                provision.logger.info("Recovering provision from state: #{provision_state}")
            end

            return OpenNebula::Error.new(
                "Provision #{provision_id} not found",
                OpenNebula::Error::ENO_EXISTS
            ) if provision_state.nil?

            case provision_state
            when 'INIT_FAILURE'
                return start_init(external_user, provision_id)
            when 'PLANNING_FAILURE'
                return start_planning(external_user, provision_id)
            when 'APPLYING_FAILURE'
                return start_applying(external_user, provision_id)
            when 'CONFIGURING_ONE_FAILURE'
                return start_configuring_one(external_user, provision_id)
            when 'CONFIGURING_PROVISION_FAILURE'
                return start_configuring_provision(external_user, provision_id)
            when 'SCALING_FAILURE'
                direction = opts['direction']
                nodes     = opts['nodes']

                return OpenNebula::Error.new(
                    'Scaling direction not defined', OpenNebula::Error::EACTION
                ) if direction.nil?

                return OpenNebula::Error.new(
                    'Scaling nodes not defined', OpenNebula::Error::EACTION
                ) if nodes.nil?

                return start_scaling(external_user, provision_id, direction, nodes, opts)
            when 'DEPROVISIONING_ONE_FAILURE'
                return start_deprovisioning_one(external_user, provision_id, opts)
            when 'DEPROVISIONING_FAILURE'
                return start_deprovisioning(external_user, provision_id)
            when 'DONE_FAILURE'
                return start_done(external_user, provision_id)
            else
                return OpenNebula::Error.new(
                    "Provision #{provision_id} cannot be recovered in state: #{provision_state}",
                    OpenNebula::Error::EACTION
                )
            end
        end

        #------------------------------------------------------------------
        # Failure Callbacks
        #------------------------------------------------------------------

        private

        def init_failure_cb(external_user, provision_id)
            @provision_pool.get(provision_id, external_user) do |provision|
                provision.state = 'INIT_FAILURE'
            end
        end

        def planning_failure_cb(external_user, provision_id)
            @provision_pool.get(provision_id, external_user) do |provision|
                provision.state = 'PLANNING_FAILURE'
            end
        end

        def applying_failure_cb(external_user, provision_id)
            @provision_pool.get(provision_id, external_user) do |provision|
                provision.state = 'APPLYING_FAILURE'
            end
        end

        def configuring_one_failure_cb(external_user, provision_id)
            @provision_pool.get(provision_id, external_user) do |provision|
                provision.state = 'CONFIGURING_ONE_FAILURE'
            end
        end

        def configuring_provision_failure_cb(external_user, provision_id)
            @provision_pool.get(provision_id, external_user) do |provision|
                provision.state = 'CONFIGURING_PROVISION_FAILURE'
            end
        end

        def scaling_failure_cb(external_user, provision_id)
            @provision_pool.get(provision_id, external_user) do |provision|
                provision.state = 'SCALING_FAILURE'
            end
        end

        def deprovisioning_one_failure_cb(external_user, provision_id)
            @provision_pool.get(provision_id, external_user) do |provision|
                provision.state = 'DEPROVISIONING_ONE_FAILURE'
            end
        end

        def deprovisioning_failure_cb(external_user, provision_id)
            @provision_pool.get(provision_id, external_user) do |provision|
                provision.state = 'DEPROVISIONING_FAILURE'
            end
        end

        def done_failure_cb(external_user, provision_id)
            @provision_pool.get(provision_id, external_user) do |provision|
                provision.state = 'DONE_FAILURE'
            end
        end

        # ------------------------------------------------------------------
        # Helpers
        # ------------------------------------------------------------------

        # Save the terraform outputs in the provision
        def save_tfoutputs(external_user, provision_id, success_cb, failure_cb)
            @provision_pool.get(provision_id, external_user) do |provision|
                Terraform.save_outputs(provision)
                provision.update
            end

            success_cb.call
        rescue StandardError => e
            Log.error("Error processing terraform outputs: #{e.message}")
            failure_cb.call
        end

        def scale_up(provision, nodes, _opts, cb)
            is_array    = nodes.is_a?(Array)
            cardinality = is_array ? nodes.size : nodes.to_i

            # Array of IPs
            if is_array
                return OpenNebula::Error.new(
                    'Only on-premise provisions can scale up adding nodes manually',
                    OpenNebula::Error::EACTION
                ) unless provision.onprem?

                provision.state = 'SCALING'

                nodes.each {|node| provision.add_onprem(node) }
            else
                return OpenNebula::Error.new(
                    'Only on-cloud provisions can scale up adding nodes dinamically',
                    OpenNebula::Error::EACTION
                ) if provision.onprem?

                provision.state = 'SCALING'

                target = provision.hosts.size + cardinality
                provision.update_user_input_value('oneform_hosts', target)
            end

            # Update the provision and init the provisioning process
            # with the new values
            provision.update
            cb[:init].call
        end

        def scale_down(provision, nodes, opts, cb)
            is_array    = nodes.is_a?(Array)
            cardinality = is_array ? nodes.size : nodes.to_i

            return OpenNebula::Error.new(
                'A provision with zero nodes cannot be scaled down',
                OpenNebula::Error::EACTION
            ) if provision.hosts.empty?

            # Array of IDs
            if is_array
                options = {
                    'resources' => {
                        'hosts' => nodes.map(&:to_i)
                    }.merge(opts)
                }
            else
                # Get a random list of hosts to destroy based on cardinality
                # TODO: Try to destroy resources without unmanaged resources instead of random
                # or flush the host first
                hosts_ids = provision.hosts.map {|host| host['id'].to_i }

                if hosts_ids.size < cardinality
                    return OpenNebula::Error.new(
                        'The number of nodes to destroy is greater than the number of hosts',
                        OpenNebula::Error::EACTION
                    )
                end

                hosts_ids = hosts_ids.sample(cardinality)

                options = {
                    'resources' => {
                        'hosts' => hosts_ids
                    }.merge(opts)
                }
            end

            cb[:deprovision].call(options)
        end

    end

    # ProvisionPool class
    class ProvisionPool < OpenNebula::Pool

        # rubocop:disable Style/ClassVars
        @@mutex = Mutex.new
        @@mutex_hash = {}
        # rubocop:enable Style/ClassVars

        # Class constructor
        #
        # @param [OpenNebula::Client] client the xml-rpc client
        # @param [Integer] user_id the filter flag, see
        #   http://docs.opennebula.io/stable/integration/system_interfaces/api.html
        #
        # @return [DocumentPool] the new object
        def initialize(cloud_auth, client)
            @cloud_auth = cloud_auth
            @client     = client

            if @client
                rc = @client.call('user.info', -1)

                unless OpenNebula.is_error?(rc)
                    info     = Nokogiri::XML(rc)
                    @user_id = Integer(info.xpath('/USER/ID').text)
                end
            end

            super('PROVISION_POOL', 'PROVISION', @client)
        end

        # Generate client to make requests to OpenNebula Core
        def client(user_name = nil)
            # If there's a client defined use it
            return @client unless @client.nil?

            # If not, get one via cloud_auth
            if user_name.nil?
                @cloud_auth.client
            else
                @cloud_auth.client(user_name)
            end
        end

        # Retrieves a provision element from OpenNebula. The provision::info()
        # method is called
        #
        # @param [Integer] provision_id Numerical Id of the provision to retrieve
        # @yieldparam [provision] this block will have the provision's mutex locked.
        #   The mutex will be unlocked after the block execution.
        #
        # @return [provision, OpenNebula::Error] The provision in case of success
        def get(provision_id, external_user = nil, &block)
            provision_id = provision_id.to_i if provision_id
            aux_client = nil

            # WARNING!!!
            # No validation will be performed for external_user, the credentials
            # for this user must be validated previously.
            if external_user.nil?
                aux_client = client
            else
                aux_client = client(external_user)
            end

            provision = OneForm::Provision.new_from_id(aux_client, provision_id)

            obj_mutex = nil
            entry     = nil

            @@mutex.synchronize do
                # entry is an array of [Mutex, waiting]
                # waiting is the number of threads waiting on this mutex
                entry = @@mutex_hash[provision_id]

                if entry.nil?
                    entry = [Mutex.new, 0]
                    @@mutex_hash[provision_id] = entry
                end

                obj_mutex = entry[0]
                entry[1]  = entry[1] + 1

                if @@mutex_hash.size > 10000
                    @@mutex_hash.delete_if do |_s_id, entry_loop|
                        entry_loop[1] == 0
                    end
                end
            end

            rc = obj_mutex.synchronize do
                rc = provision.info

                if OpenNebula.is_error?(rc)
                    return rc
                end

                case block.arity
                when 1
                    block.call(provision)
                when 2
                    provider = OneForm::Provider.new_from_id(aux_client, provision.provider_id)

                    if OpenNebula.is_error?(rc)
                        return rc
                    end

                    block.call(provision, provider)
                end
            end

            @@mutex.synchronize do
                entry[1] = entry[1] - 1
            end

            if OpenNebula.is_error?(rc)
                return rc
            end

            provision
        end

    end

end
