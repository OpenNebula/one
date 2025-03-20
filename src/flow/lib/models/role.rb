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

require 'treetop'
require 'treetop/version'
require 'opennebula/flow/grammar'
require 'parse-cron'

if Gem::Version.create('1.6.3') >= Gem.loaded_specs['treetop'].version
    raise 'treetop gem version must be >= 1.6.3.' \
          "Current version is #{Treetop::VERSION::STRING}"
end

module OpenNebula

    # Service Role Class (Generic Role type)
    class Role

        LOG_COMP = 'ROL'
        attr_reader :service

        STATE = {
            'PENDING'            => 0,
            'DEPLOYING'          => 1,
            'RUNNING'            => 2,
            'UNDEPLOYING'        => 3,
            'WARNING'            => 4,
            'DONE'               => 5,
            'FAILED_UNDEPLOYING' => 6,
            'FAILED_DEPLOYING'   => 7,
            'SCALING'            => 8,
            'FAILED_SCALING'     => 9,
            'COOLDOWN'           => 10,
            'HOLD'               => 11
        }

        STATE_STR = [
            'PENDING',
            'DEPLOYING',
            'RUNNING',
            'UNDEPLOYING',
            'WARNING',
            'DONE',
            'FAILED_UNDEPLOYING',
            'FAILED_DEPLOYING',
            'SCALING',
            'FAILED_SCALING',
            'COOLDOWN',
            'HOLD'
        ]

        FAILURE_STATES = [
            'BOOT_FAILURE',
            'BOOT_MIGRATE_FAILURE',
            'PROLOG_MIGRATE_FAILURE',
            'PROLOG_FAILURE',
            'EPILOG_FAILURE',
            'EPILOG_STOP_FAILURE',
            'EPILOG_UNDEPLOY_FAILURE',
            'PROLOG_MIGRATE_POWEROFF_FAILURE',
            'PROLOG_MIGRATE_SUSPEND_FAILURE',
            'PROLOG_MIGRATE_UNKNOWN_FAILURE',
            'BOOT_UNDEPLOY_FAILURE',
            'BOOT_STOPPED_FAILURE',
            'PROLOG_RESUME_FAILURE',
            'PROLOG_UNDEPLOY_FAILURE'
        ]

        RECOVER_DEPLOY_STATES = [
            'FAILED_DEPLOYING',
            'DEPLOYING',
            'PENDING'
        ]

        RECOVER_UNDEPLOY_STATES = [
            'FAILED_UNDEPLOYING',
            'UNDEPLOYING'
        ]

        RECOVER_SCALE_STATES = [
            'FAILED_SCALING',
            'SCALING'
        ]

        SCALE_WAYS = {
            'UP'   => 0,
            'DOWN' => 1
        }

        # Actions that can be performed on the VMs of a given Role
        SCHEDULE_ACTIONS = [
            'terminate',
            'terminate-hard',
            'undeploy',
            'undeploy-hard',
            'hold',
            'release',
            'stop',
            'suspend',
            'resume',
            'reboot',
            'reboot-hard',
            'poweroff',
            'poweroff-hard',
            'snapshot-create',
            'snapshot-revert',
            'snapshot-delete',
            'disk-snapshot-create',
            'disk-snapshot-revert',
            'disk-snapshot-delete'
        ]

        # Information to save in document
        VM_INFO = ['ID', 'UID', 'GID', 'UNAME', 'GNAME', 'NAME']

        # List of attributes that can't be changed in update operation
        # last_vmname: this is internal information managed by OneFlow server
        # nodes: this is internal information managed by OneFlow server
        # parents: this has only sense in deploy operation
        # state: this is internal information managed by OneFlow server
        # template_id: this will affect scale operation
        # cardinality: this is internal information managed by OneFlow server
        IMMUTABLE_ATTRS = [
            'cardinality',
            'last_vmname',
            'nodes',
            'parents',
            'state',
            'template_id'
        ]

        class << self

            # Return a role object based on type attribute of the role template
            # @param [Hash] Role template in Hash format
            # @return [Role] Role object type
            def for(body, service)
                role_type = body.fetch('type', 'vm')

                case role_type.downcase
                when 'vm'
                    VMRole.new(body, service)
                when 'vr'
                    VRRole.new(body, service)
                else
                    raise "Unsupported role type: #{role_type}"
                end
            end

            # Returns true if the VM state is failure
            # @param [Integer] vm_state VM state
            # @param [Integer] lcm_state VM LCM state
            # @return [true,false] True if the lcm state is one of *_FAILURE
            def vm_failure?(vm_state, lcm_state)
                vm_state_str  = VirtualMachine::VM_STATE[vm_state.to_i]
                lcm_state_str = VirtualMachine::LCM_STATE[lcm_state.to_i]

                if vm_state_str == 'ACTIVE' &&
                FAILURE_STATES.include?(lcm_state_str)
                    return true
                end

                false
            end

            # rubocop:disable Style/ClassVars
            def init_default_cooldown(default_cooldown)
                @@default_cooldown = default_cooldown
            end

            def init_default_shutdown(shutdown_action)
                @@default_shutdown = shutdown_action
            end

            def init_force_deletion(force_deletion)
                @@force_deletion = force_deletion
            end

            def init_default_vm_name_template(vm_name_template)
                @@vm_name_template = vm_name_template
            end

            def init_default_vr_name_template(vr_name_template)
                @@vr_name_template = vr_name_template
            end
            # rubocop:enable Style/ClassVars

        end

        def initialize(body, service)
            @body    = body
            @service = service

            @body['nodes']  ||= []
            @body['on_hold']  = false if @body['on_hold'].nil?
        end

        def name
            @body['name']
        end

        def state
            @body['state']
        end

        # Sets a new state
        # @param [Integer] the new state
        def state=(state)
            return if state < 0 || state > STATE_STR.size

            @body['state'] = state.to_i

            Log.info(
                LOG_COMP,
                "Role #{name} new state: #{STATE_STR[state]}",
                @service.id
            )
        end

        # Returns the string representation of the service state
        # @return [String] the state string
        def state_str
            STATE_STR[state]
        end

        # Returns the nodes of the role
        # @return [Array] the nodes
        def nodes
            @body['nodes']
        end

        def nodes_ids
            @body['nodes'].map {|node| node['deploy_id'] }
        end

        def info_nodes(vm_pool)
            ret = []

            monitoring = vm_pool[:monitoring]
            vm_pool    = vm_pool[:vm_pool]

            @body['nodes'].each do |node|
                id = node['deploy_id']
                vm = vm_pool.retrieve_xmlelements("/VM_POOL/VM[ID=#{id}]")[0]

                if vm.nil?
                    Log.error LOG_COMP,
                              "Error getting VM #{id}",
                              @service.id
                else
                    obj = {}
                    obj['deploy_id'] = node['deploy_id']

                    hash     = vm.to_hash
                    vm_monit = monitoring.select {|v| v['ID'].to_i == id }[0]

                    hash['VM']['MONITORING'] = vm_monit if vm_monit
                    obj['vm_info']           = hash

                    ret << obj
                end
            end

            ret
        end

        # Returns the role parents
        # @return [Array] the role parents
        def parents
            @body['parents'] || []
        end

        # Returns the role cardinality
        # @return [Integer] the role cardinality
        def cardinality
            @body['cardinality'].to_i
        end

        # Sets a new cardinality for this role
        # @param [Integer] the new cardinality
        def cardinality=(target_cardinality)
            if target_cardinality > cardinality
                dir = 'up'
            else
                dir = 'down'
            end

            msg = "Role #{name} scaling #{dir} from #{cardinality} to " \
                  "#{target_cardinality} nodes"

            Log.info(LOG_COMP, msg, @service.id)
            @service.log_info(msg)

            @body['cardinality'] = target_cardinality.to_i
        end

        # Change the `on_hold` option value
        def on_hold=(on_hold)
            @body['on_hold'] = on_hold
        end

        # Returns the `on_hold` role option
        # @return [true, false] `true` if the `on_hold` option is enabled
        def on_hold?
            @body['on_hold']
        end

        # Returns the `on_hold` service option
        # @return [true, false] `true` if the `on_hold` option is enabled
        def service_on_hold?
            @service.on_hold?
        end

        # Checks if any parent role is currently on hold.
        # @return [Boolean] Returns `true` if any parent role is in an
        #                   `on_hold` state, `false` otherwise.
        def any_parent_on_hold?
            parents.each do |parent|
                next unless @service.roles[parent]

                return true if @service.roles[parent].on_hold?
            end
            false
        end

        ########################################################################
        # Operations
        ########################################################################

        # Release all the nodes in this role
        # @return [Array, Bool] true if all the VMs
        #   were released, false otherwise and Array with VMs released
        def release
            release_nodes = []
            success       = true

            # Release all vms in the role
            nodes.each do |node|
                vm_id = node['deploy_id']

                Log.debug(LOG_COMP,
                          "Role #{name}: Releasing VM #{vm_id}",
                          @service.id)

                vm = OpenNebula::VirtualMachine.new_with_id(vm_id,
                                                            @service.client)
                rc = vm.release

                if OpenNebula.is_error?(rc)
                    msg = "Role #{name}: Release failed for VM #{vm_id}, " \
                          "#{rc.message}"

                    Log.error(LOG_COMP, msg, @service.id)
                    @service.log_error(msg)
                    success = false
                else
                    Log.debug(LOG_COMP,
                              "Role #{name}: Release success for VM #{vm_id}",
                              @service.id)

                    release_nodes << vm_id
                end
            end

            [release_nodes, success]
        end

        # Checks if the current role is in a state where it can be released.
        # @return [Boolean] Returns `true` if the current state is `HOLD`,
        #                   `false` otherwise.
        def can_release?
            state == STATE['HOLD']
        end

        def chown(uid, gid)
            raise NotImplementedError
        end

        # Updates the role
        # @param [Hash] template
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(template)
            raise NotImplementedError
        end

        # Check that changes values are correct
        #
        # @param template_json [String] New template
        #
        # @return [Boolean, String] True, nil if everything is correct
        #                           False, attr if attr was changed
        def check_new_template(template)
            IMMUTABLE_ATTRS.each do |attr|
                next if template[attr] == @body[attr]

                return [false, "role/#{attr}"]
            end

            [true, nil]
        end

        ########################################################################
        # Scheduler
        ########################################################################

        def scheduled_policies
            @body['scheduled_policies']
        end

        def update_scheduled_policies(new_policies)
            @body['scheduled_policies'] = new_policies
        end

        def batch_action(action, period, vms_per_period, args)
            raise NotImplementedError
        end

        ########################################################################
        # Scalability
        ########################################################################

        # Returns the role max cardinality
        # @return [Integer,nil] the role cardinality or nil if it isn't defined
        def max_cardinality
            raise NotImplementedError
        end

        # Returns the role min cardinality
        # @return [Integer,nil] the role cardinality or nil if it isn't defined
        def min_cardinality
            raise NotImplementedError
        end

        # Returns a positive, 0, or negative number of nodes to adjust,
        #   according to the elasticity and scheduled policies
        # @return [Array<Integer>] positive, 0, or negative number of nodes to
        #   adjust, plus the cooldown period duration
        def scale?(vm_pool)
            raise NotImplementedError
        end

        def elasticity_policies
            raise NotImplementedError
        end

        def update_elasticity_policies(new_policies)
            raise NotImplementedError
        end

        def cooldown
            raise NotImplementedError
        end

        def update_cooldown(new_cooldown)
            raise NotImplementedError
        end

        def scale_way(_)
            return NotImplementedError
        end

        def clean_scale_way
            return NotImplementedError
        end

        ########################################################################
        # Deployment
        ########################################################################

        def deploy
            raise NotImplementedError
        end

        # Terminate all the nodes in this role
        #
        # @param scale_down [true, false] true to terminate and dispose the
        #   number of VMs needed to get down to cardinality nodes
        # @return [Array<true, nil>, Array<false, String>] true if all the VMs
        #   were terminated, false and the error reason if there was a problem
        #   shutting down the VMs
        def shutdown(recover)
            if nodes.size != cardinality
                n_nodes = nodes.size - cardinality
            else
                n_nodes = nodes.size
            end

            rc = shutdown_nodes(nodes, n_nodes, recover)

            unless rc[0]
                return [false, "Error undeploying nodes for role `#{name}`"]
            end

            [rc[1], nil]
        end

        ########################################################################
        # Recover
        ########################################################################

        # Determines whether the current deployment can be recovered
        # based on its state and the states of its parent roles.
        # @return [Boolean] Returns `true` if the deployment
        #                   can be recovered, `false` otherwise.
        def can_recover_deploy?
            if state != STATE['PENDING']
                return RECOVER_DEPLOY_STATES.include? STATE_STR[state]
            end

            parents.each do |parent|
                next unless @service.roles[parent]

                return false if @service.roles[parent].state != STATE['RUNNING']
            end

            true
        end

        # Determines if the current deployment can be recovered and
        # undeployed based on its state and the states of its child roles.
        # @return [Boolean] Returns `true` if the deployment can be
        #                   recovered and undeployed, `false` otherwise.
        def can_recover_undeploy?
            if !RECOVER_UNDEPLOY_STATES.include? STATE_STR[state]
                # TODO, check childs if !empty? check if can be undeployed
                @service.roles.each do |role_name, role|
                    next if role_name == name

                    if role.parents.include?(name) &&
                       role.state != STATE['DONE']
                        return false
                    end
                end
            end

            true
        end

        def can_recover_scale?
            return false unless RECOVER_SCALE_STATES.include? STATE_STR[state]

            true
        end

        def recover_deploy(report)
            nodes = @body['nodes']
            deployed_nodes = []

            nodes.each do |node|
                vm_id = node['deploy_id']

                vm = OpenNebula::VirtualMachine.new_with_id(vm_id,
                                                            @service.client)

                rc = vm.info

                if OpenNebula.is_error?(rc)
                    msg = "Role #{name} : Retry failed for VM "\
                          "#{vm_id}; #{rc.message}"
                    Log.error LOG_COMP, msg, @service.id

                    next true
                end

                vm_state = vm.state
                lcm_state = vm.lcm_state

                # ACTIVE/RUNNING
                next false if vm_state == 3 && lcm_state == 3 && !report

                next true if vm_state == '6' # Delete DONE nodes

                if Role.vm_failure?(vm_state, lcm_state)
                    rc = vm.recover(2)

                    if OpenNebula.is_error?(rc)
                        msg = "Role #{name} : Retry failed for VM "\
                              "#{vm_id}; #{rc.message}"

                        Log.error LOG_COMP, msg, @service.id
                        @service.log_error(msg)
                    else
                        deployed_nodes << vm_id
                    end
                else
                    vm.resume

                    deployed_nodes << vm_id
                end
            end

            rc = deploy

            unless rc[0]
                return [false, "Error deploying nodes for role `#{name}`"]
            end

            deployed_nodes.concat(rc[0])

            deployed_nodes
        end

        def recover_undeploy
            undeployed_nodes = []

            rc = shutdown(true)

            undeployed_nodes.concat(rc[0]) if rc[1].nil?

            undeployed_nodes
        end

        def recover_scale
            raise NotImplementedError
        end

        ########################################################################
        # Helpers
        ########################################################################

        protected

        def init_template_attributes
            @body['last_vmname'] ||= 0

            template_id    = @body['template_id']
            template       = OpenNebula::Template.new_with_id(template_id, @service.client)
            extra_template = @body.fetch('template_contents', {}).dup

            # Since the OpenNebula core does not apply a deep merge, we replace
            # here the values to avoid the entire CONTEXT replacement.
            if !extra_template.empty?
                rc = template.info

                if OpenNebula.is_error?(rc)
                    msg = "Role #{name} : Info template #{template_id}; #{rc.message}"

                    Log.error(LOG_COMP, msg, @service.id)
                    @service.log_error(msg)

                    return [
                        false,
                        "Error fetching Info to instantiate template #{template_id} " \
                        "in Role #{name}: #{rc.message}"
                    ]
                end

                vm_template = template.to_hash['VMTEMPLATE']['TEMPLATE']

                if vm_template.key?('NIC') && !vm_template['NIC'].is_a?(Array)
                    vm_template['NIC'] = [vm_template['NIC']]
                end

                extra_template = vm_template.deep_merge(extra_template)
            end

            extra_template['SERVICE_ID'] = @service.id
            extra_template['ROLE_NAME']  = @body['name']

            extra_template = Hash.to_raw(extra_template)

            # Evaluate attributes with parent roles
            evaluate(extra_template)

            [template_id, template, extra_template]
        end

        def fill_node_info(vm_id)
            node = { 'deploy_id' => vm_id }
            vm   = OpenNebula::VirtualMachine.new_with_id(vm_id, @service.client)

            max_retries = 3
            attemps     = 0

            begin
                attemps += 1
                rc       = vm.info

                if OpenNebula.is_error?(rc)
                    sleep(attemps)
                    raise "Error retrieving info for VM #{vm_id}"
                end

                hash_vm         = vm.to_hash['VM']
                node['vm_info'] = { 'VM' => hash_vm.select {|k, _| VM_INFO.include?(k) } }

                @body['nodes'] << node
            rescue StandardError => e
                retry if attemps < max_retries

                node['vm_info'] = nil

                msg = "Role #{name} : Cannot get info for VM #{vm_id}: #{e.message}"
                Log.error LOG_COMP, msg, @service.id

                @service.log_error(msg)

                return [false,
                        "Error getting VM #{vm_id} info in " \
                        "Role #{name}: #{e.message}"]
            end
        end

        def vm_failure?(node)
            if node && node['vm_info']
                return Role.vm_failure?(node['vm_info']['VM']['STATE'],
                                        node['vm_info']['VM']['LCM_STATE'])
            end

            false
        end

        # Evaluate rules that references to parent roles
        #
        # @param template [String] Role template with $ to replace
        def evaluate(template)
            client = service.client

            template.scan(/\$\{(.*?)\}/).flatten.each do |value|
                s_value = value.split('.') # 0 -> parent, 1..N -> XPATH

                # If parent not found, instead of error, replace it by blank
                unless parents.include?(s_value[0])
                    template.gsub!("${#{value}}", '')
                    next
                end

                found   = false
                p_nodes = service.roles[s_value[0]].nodes
                xpath   = "//#{s_value[1..-1].join('/').upcase}"

                # Iterate over parent nodes to find the XPATH on their template
                p_nodes.each do |node|
                    id = node['deploy_id']
                    vm = OpenNebula::VirtualMachine.new_with_id(id, client)

                    # If error continue searching in other nodes
                    next if OpenNebula.is_error?(vm.info)

                    next unless vm[xpath]

                    template.gsub!("${#{value}}", vm[xpath])

                    # If found, continue with next expression
                    found = true
                    break
                end

                next if found

                # If value not found, replace it by blank to avoid issues
                template.gsub!("${#{value}}", '')
            end
        end

    end

end
