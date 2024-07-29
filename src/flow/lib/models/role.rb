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

require 'treetop'
require 'treetop/version'
require 'opennebula/flow/grammar'
require 'parse-cron'

if Gem::Version.create('1.6.3') >= Gem.loaded_specs['treetop'].version
    raise 'treetop gem version must be >= 1.6.3.' \
          "Current version is #{Treetop::VERSION::STRING}"
end

module OpenNebula

    # Service Role class
    class Role

        attr_reader :service

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

        VM_FAILURE_STATES = [
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

        SCALE_WAYS = {
            'UP'   => 0,
            'DOWN' => 1
        }

        # List of attributes that can't be changed in update operation
        # cardinality: this is internal information managed by OneFlow server
        # last_vmname: this is internal information managed by OneFlow server
        # nodes: this is internal information managed by OneFlow server
        # parents: this has only sense in deploy operation
        # state: this is internal information managed by OneFlow server
        # vm_template: this will affect scale operation
        IMMUTABLE_ATTRS = [
            'cardinality',
            'last_vmname',
            'nodes',
            'parents',
            'state',
            'vm_template'
        ]

        # VM information to save in document
        VM_INFO = ['ID', 'UID', 'GID', 'UNAME', 'GNAME', 'NAME']

        LOG_COMP = 'ROL'

        def initialize(body, service)
            @body     = body
            @service  = service

            @body['cooldown'] = @@default_cooldown if @body['cooldown'].nil?
            @body['nodes']    ||= []
            @body['on_hold']  = false if @body['on_hold'].nil?
        end

        def name
            @body['name']
        end

        # Returns the role state
        # @return [Integer] the role state
        def state
            @body['state'].to_i
        end

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

        def can_release?
            state == STATE['HOLD']
        end

        # Returns the role parents
        # @return [Array] the role parents
        def parents
            @body['parents'] || []
        end

        def any_parent_on_hold?
            parents.each do |parent|
                next unless @service.roles[parent]

                return true if @service.roles[parent].on_hold?
            end
            false
        end

        # Returns the role cardinality
        # @return [Integer] the role cardinality
        def cardinality
            @body['cardinality'].to_i
        end

        # Sets a new cardinality for this role
        # @param [Integer] the new cardinality
        # rubocop:disable Naming/AccessorMethodName
        def set_cardinality(target_cardinality)
            # rubocop:enable Naming/AccessorMethodName
            if target_cardinality > cardinality
                dir = 'up'
            else
                dir = 'down'
            end

            msg = "Role #{name} scaling #{dir} from #{cardinality} to " \
                  "#{target_cardinality} nodes"

            Log.info LOG_COMP, msg, @service.id

            @service.log_info(msg)

            @body['cardinality'] = target_cardinality.to_i
        end

        # Returns the role max cardinality
        # @return [Integer,nil] the role cardinality or nil if it isn't defined
        def max_cardinality
            max = @body['max_vms']

            return if max.nil?

            max.to_i
        end

        # Returns the role min cardinality
        # @return [Integer,nil] the role cardinality or nil if it isn't defined
        def min_cardinality
            min = @body['min_vms']

            return if min.nil?

            min.to_i
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

        def nodes_ids
            @body['nodes'].map {|node| node['deploy_id'] }
        end

        def elasticity_policies
            @body['elasticity_policies']
        end

        def update_elasticity_policies(new_policies)
            @body['elasticity_policies'] = new_policies
        end

        def scheduled_policies
            @body['scheduled_policies']
        end

        def update_scheduled_policies(new_policies)
            @body['scheduled_policies'] = new_policies
        end

        def cooldown
            @body['cooldown']
        end

        def update_cooldown(new_cooldown)
            @body['cooldown'] = new_cooldown unless new_cooldown.nil?
        end

        # Sets a new state
        # @param [Integer] the new state
        # @return [true, false] true if the value was changed
        # rubocop:disable Naming/AccessorMethodName
        def set_state(state)
            # rubocop:enable Naming/AccessorMethodName
            if state < 0 || state > STATE_STR.size
                return false
            end

            @body['state'] = state.to_i

            if state == STATE['SCALING']

                elasticity_pol = @body['elasticity_policies']

                if !elasticity_pol.nil?
                    elasticity_pol.each do |policy|
                        policy.delete('true_evals')
                    end
                end
            end

            Log.info LOG_COMP,
                     "Role #{name} new state: #{STATE_STR[state]}",
                     @service.id

            true
        end

        def scale_way(way)
            @body['scale_way'] = SCALE_WAYS[way]
        end

        def clean_scale_way
            @body.delete('scale_way')
        end

        # Returns the on_hold role option
        # @return [true, false] true if the on_hold option is enabled
        def on_hold?
            @body['on_hold']
        end

        # Returns the on_hold service option
        # @return [true, false] true if the on_hold option is enabled
        def service_on_hold?
            @service.on_hold?
        end

        # Set the on_hold vm option to true
        def hold(hold)
            @body['on_hold'] = hold
        end

        # Retrieves the VM information for each Node in this Role. If a Node
        # is to be disposed and it is found in DONE, it will be cleaned
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def info
            raise 'role.info is not defined'
        end

        # Deploys all the nodes in this role
        # @return [Array<true, nil>, Array<false, String>] true if all the VMs
        # were created, false and the error reason if there was a problem
        # creating the VMs
        def deploy
            deployed_nodes = []
            n_nodes = cardinality - nodes.size

            return [deployed_nodes, nil] if n_nodes == 0

            @body['last_vmname'] ||= 0

            template_id = @body['vm_template']
            template    = OpenNebula::Template.new_with_id(template_id,
                                                           @service.client)

            if @body['vm_template_contents']
                extra_template = @body['vm_template_contents'].dup

                # If the extra_template contains APPEND="<attr1>,<attr2>", it
                # will add the attributes that already exist in the template,
                # instead of replacing them.
                append = extra_template
                         .match(/^\s*APPEND=\"?(.*?)\"?\s*$/)[1]
                         .split(',') rescue nil

                if append && !append.empty?
                    rc = template.info

                    if OpenNebula.is_error?(rc)
                        msg = "Role #{name} : Info template #{template_id};" \
                               " #{rc.message}"

                        Log.error LOG_COMP, msg, @service.id
                        @service.log_error(msg)

                        return [false, 'Error fetching Info to instantiate' \
                                       " VM Template #{template_id} in Role " \
                                       "#{name}: #{rc.message}"]
                    end

                    et = template.template_like_str('TEMPLATE',
                                                    true,
                                                    append.join('|'))

                    et = et << "\n" << extra_template

                    extra_template = et
                end
            else
                extra_template = ''
            end

            extra_template << "\nSERVICE_ID = #{@service.id}"
            extra_template << "\nROLE_NAME = \"#{@body['name']}\""

            # Evaluate attributes with parent roles
            evaluate(extra_template)

            n_nodes.times do
                vm_name = @@vm_name_template
                          .gsub('$SERVICE_ID', @service.id.to_s)
                          .gsub('$SERVICE_NAME', @service.name.to_s)
                          .gsub('$ROLE_NAME', name.to_s)
                          .gsub('$VM_NUMBER', @body['last_vmname'].to_s)

                @body['last_vmname'] += 1

                Log.debug LOG_COMP,
                          "Role #{name} : Instantiate template #{template_id}, name #{vm_name}",
                          @service.id

                vm_id = template.instantiate(vm_name, on_hold?, extra_template)

                deployed_nodes << vm_id

                if OpenNebula.is_error?(vm_id)
                    msg = "Role #{name} : Instantiate failed for template " \
                          "#{template_id}; #{vm_id.message}"

                    Log.error LOG_COMP, msg, @service.id

                    @service.log_error(msg)

                    return [false, "Error instantiating VM Template #{template_id} in Role " \
                                   "#{name}: #{vm_id.message}"]
                end

                Log.debug LOG_COMP,
                          "Role #{name} : Instantiate success, VM ID #{vm_id}",
                          @service.id

                node = { 'deploy_id' => vm_id }
                vm   = OpenNebula::VirtualMachine.new_with_id(vm_id, @service.client)

                tries = 0
                loop do
                    break if tries == 3

                    tries += 1

                    rc = vm.info

                    break unless OpenNebula.is_error?(rc)

                    sleep(tries)
                end

                if tries == 3
                    node['vm_info'] = nil

                    msg = "Role #{name} : Cannot get info for VM #{vm_id}"

                    Log.error LOG_COMP, msg, @service.id

                    @service.log_error(msg)

                    return [false,
                            "Error getting VM #{vm_id} info in Role #{name}: #{vm_id.message}"]
                end

                hash_vm       = vm.to_hash['VM']
                vm_info       = {}
                vm_info['VM'] = hash_vm.select {|v| VM_INFO.include?(v) }

                node['vm_info'] = vm_info

                @body['nodes'] << node
            end

            [deployed_nodes, nil]
        end

        # Terminate all the nodes in this role
        #
        # @param scale_down [true, false] true to terminate and dispose the
        #   number of VMs needed to get down to cardinality nodes
        # @return [Array<true, nil>, Array<false, String>] true if all the VMs
        # were terminated, false and the error reason if there was a problem
        # shutting down the VMs
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

        # Delete all the nodes in this role
        # @return [Array<true, nil>] All the VMs are deleted, and the return
        #   ignored
        def delete
            raise 'role.delete is not defined'
        end

        # Changes the owner/group of all the nodes in this role
        #
        # @param [Integer] uid the new owner id. Set to -1 to leave the current
        # @param [Integer] gid the new group id. Set to -1 to leave the current
        #
        # @return [Array<true, nil>, Array<false, String>] true if all the VMs
        #   were updated, false and the error reason if there was a problem
        #   updating the VMs
        def chown(uid, gid)
            nodes.each do |node|
                vm_id = node['deploy_id']

                Log.debug LOG_COMP,
                          "Role #{name} : Chown for VM #{vm_id}",
                          @service.id

                vm = OpenNebula::VirtualMachine.new_with_id(vm_id,
                                                            @service.client)
                rc = vm.chown(uid, gid)

                if OpenNebula.is_error?(rc)
                    msg = "Role #{name} : Chown failed for VM #{vm_id}; " \
                          "#{rc.message}"

                    Log.error LOG_COMP, msg, @service.id
                    @service.log_error(msg)

                    return [false, rc.message]
                else
                    Log.debug LOG_COMP,
                              "Role #{name} : Chown success for VM #{vm_id}",
                              @service.id
                end
            end

            [true, nil]
        end

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

        # Schedule the given action on all the VMs that belong to the Role
        # @param [String]  action one of the available SCHEDULE_ACTIONS
        # @param [Integer] period
        # @param [Integer] vm_per_period
        # @param [String]  action arguments
        def batch_action(action, period, vms_per_period, args)
            vms_id      = []
            error_msgs  = []
            nodes       = @body['nodes']
            now         = Time.now.to_i
            time_offset = 0

            # if role is done, return error
            if state == 5
                return OpenNebula::Error.new("Role #{name} is in DONE state")
            end

            do_offset = !period.nil? && period.to_i > 0 &&
                        !vms_per_period.nil? && vms_per_period.to_i > 0

            nodes.each_with_index do |node, index|
                vm_id = node['deploy_id']
                vm = OpenNebula::VirtualMachine.new_with_id(vm_id,
                                                            @service.client)

                if do_offset
                    offset = (index / vms_per_period.to_i).floor
                    time_offset = offset * period.to_i
                end

                tmp_str = 'SCHED_ACTION = ['
                tmp_str << "ACTION = #{action},"
                tmp_str << "ARGS = \"#{args}\"," if args
                tmp_str << "TIME = #{now + time_offset}]"

                rc = vm.sched_action_add(tmp_str)
                if OpenNebula.is_error?(rc)
                    msg = "Role #{name} : VM #{vm_id} error scheduling "\
                            "action; #{rc.message}"

                    error_msgs << msg

                    Log.error LOG_COMP, msg, @service.id

                    @service.log_error(msg)
                else
                    vms_id << vm.id
                end
            end

            log_msg = "Action:#{action} scheduled on Role:#{name}"\
                      "VMs:#{vms_id.join(',')}"

            Log.info LOG_COMP, log_msg, @service.id

            return [true, log_msg] if error_msgs.empty?

            error_msgs << log_msg

            [false, error_msgs.join('\n')]
        end

        # Returns true if the VM state is failure
        # @param [Integer] vm_state VM state
        # @param [Integer] lcm_state VM LCM state
        # @return [true,false] True if the lcm state is one of *_FAILURE
        def self.vm_failure?(vm_state, lcm_state)
            vm_state_str  = VirtualMachine::VM_STATE[vm_state.to_i]
            lcm_state_str = VirtualMachine::LCM_STATE[lcm_state.to_i]

            if vm_state_str == 'ACTIVE' &&
               VM_FAILURE_STATES.include?(lcm_state_str)
                return true
            end

            false
        end

        # rubocop:disable Style/ClassVars
        def self.init_default_cooldown(default_cooldown)
            @@default_cooldown = default_cooldown
        end

        def self.init_default_shutdown(shutdown_action)
            @@default_shutdown = shutdown_action
        end

        def self.init_force_deletion(force_deletion)
            @@force_deletion = force_deletion
        end

        def self.init_default_vm_name_template(vm_name_template)
            @@vm_name_template = vm_name_template
        end
        # rubocop:enable Style/ClassVars

        ########################################################################
        # Scalability
        ########################################################################

        # Updates the role
        # @param [Hash] template
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(template)
            force = template['force'] == true
            new_cardinality = template['cardinality']

            return if new_cardinality.nil?

            new_cardinality = new_cardinality.to_i

            if !force
                if new_cardinality < min_cardinality.to_i
                    return OpenNebula::Error.new(
                        "Minimum cardinality is #{min_cardinality}"
                    )

                elsif !max_cardinality.nil? &&
                      new_cardinality > max_cardinality.to_i
                    return OpenNebula::Error.new(
                        "Maximum cardinality is #{max_cardinality}"
                    )

                end
            end

            set_cardinality(new_cardinality)

            nil
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
        # Recover
        ########################################################################

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

        # def recover_warning
        # end

        def recover_scale(report)
            rc = nil

            if @body['scale_way'] == SCALE_WAYS['UP']
                rc = [recover_deploy(report), true]
            elsif @body['scale_way'] == SCALE_WAYS['DOWN']
                rc = [recover_undeploy, false]
            end

            rc
        end

        # Returns a positive, 0, or negative number of nodes to adjust,
        #   according to the elasticity and scheduled policies
        # @return [Array<Integer>] positive, 0, or negative number of nodes to
        #   adjust, plus the cooldown period duration
        def scale?(vm_pool)
            elasticity_pol = @body['elasticity_policies']
            scheduled_pol  = @body['scheduled_policies']

            elasticity_pol ||= []
            scheduled_pol  ||= []

            scheduled_pol.each do |policy|
                diff, cooldown_duration = scale_time?(policy)

                return [diff, cooldown_duration] if diff != 0
            end

            elasticity_pol.each do |policy|
                diff, cooldown_duration = scale_attributes?(policy, vm_pool)

                next if diff == 0

                cooldown_duration = @body['cooldown'] if cooldown_duration.nil?
                cooldown_duration = @@default_cooldown if cooldown_duration.nil?

                return [diff, cooldown_duration]
            end

            # Implicit rule that scales up to maintain the min_cardinality, with
            # no cooldown period
            if cardinality < min_cardinality.to_i
                return [min_cardinality.to_i - cardinality, 0]
            end

            [0, 0]
        end

        private

        # Shuts down all the given nodes
        # @param scale_down [true,false] True to set the 'disposed' node flag
        def shutdown_nodes(nodes, n_nodes, recover)
            success          = true
            undeployed_nodes = []

            action = @body['shutdown_action']

            if action.nil?
                action = @service.shutdown_action
            end

            if action.nil?
                action = @@default_shutdown
            end

            nodes[0..n_nodes - 1].each do |node|
                vm_id = node['deploy_id']

                Log.debug(LOG_COMP,
                          "Role #{name} : Terminating VM #{vm_id}",
                          @service.id)

                vm = OpenNebula::VirtualMachine.new_with_id(vm_id,
                                                            @service.client)

                vm_state = nil
                lcm_state = nil

                if recover
                    vm.info

                    vm_state  = vm.state
                    lcm_state = vm.lcm_state
                end

                if recover && Role.vm_failure?(vm_state, lcm_state)
                    rc = vm.recover(2)
                elsif action == 'terminate-hard'
                    rc = vm.terminate(true)
                else
                    rc = vm.terminate
                end

                if OpenNebula.is_error?(rc)
                    msg = "Role #{name} : Terminate failed for VM #{vm_id}, " \
                          "will perform a Delete; #{rc.message}"

                    Log.error LOG_COMP, msg, @service.id
                    @service.log_error(msg)

                    if action != 'terminate-hard'
                        rc = vm.terminate(true)
                    end

                    if OpenNebula.is_error?(rc)
                        rc = vm.delete
                    end

                    if OpenNebula.is_error?(rc)
                        msg = "Role #{name} : Delete failed for VM #{vm_id}; " \
                              "#{rc.message}"

                        Log.error LOG_COMP, msg, @service.id
                        @service.log_error(msg)

                        success = false
                    else
                        Log.debug(LOG_COMP,
                                  "Role #{name} : Delete success for VM " \
                                  "#{vm_id}",
                                  @service.id)

                        undeployed_nodes << vm_id
                    end
                else
                    Log.debug(LOG_COMP,
                              "Role #{name}: Terminate success for VM #{vm_id}",
                              @service.id)
                    undeployed_nodes << vm_id
                end
            end

            [success, undeployed_nodes]
        end

        def vm_failure?(node)
            if node && node['vm_info']
                return Role.vm_failure?(node['vm_info']['VM']['STATE'],
                                        node['vm_info']['VM']['LCM_STATE'])
            end

            false
        end

        # Returns a positive, 0, or negative number of nodes to adjust,
        #   according to a SCHEDULED type policy
        # @param [Hash] A SCHEDULED type policy
        # @return [Integer] positive, 0, or negative number of nodes to adjust
        def scale_time?(elasticity_pol)
            now       = Time.now.to_i
            last_eval = elasticity_pol['last_eval'].to_i

            elasticity_pol['last_eval'] = now

            # If this is the first time this is evaluated, ignore it.
            # We don't want to execute actions planned in the past when the
            # server starts.

            return 0 if last_eval == 0

            start_time = elasticity_pol['start_time']
            target_vms = elasticity_pol['adjust']

            # TODO: error msg
            return 0 if target_vms.nil?

            if !(start_time.nil? || start_time.empty?)
                begin
                    if !start_time.match(/^\d+$/)
                        start_time = Time.parse(start_time).to_i
                    else
                        start_time = start_time.to_i
                    end
                rescue ArgumentError
                    # TODO: error msg
                    return 0
                end
            else
                recurrence = elasticity_pol['recurrence']

                # TODO: error msg
                return 0 if recurrence.nil? || recurrence.empty?

                begin
                    cron_parser = CronParser.new(recurrence)

                    # This returns the next planned time, starting from the last
                    # step
                    start_time = cron_parser.next(Time.at(last_eval)).to_i
                rescue StandardError
                    # TODO: error msg bad format
                    return 0
                end
            end

            # Only actions planned between last step and this one are triggered
            if start_time > last_eval && start_time <= now
                Log.debug LOG_COMP,
                          "Role #{name} : scheduled scalability for " \
                          "#{Time.at(start_time)} triggered", @service.id

                new_cardinality = calculate_new_cardinality(elasticity_pol)

                return [new_cardinality - cardinality,
                        elasticity_pol['cooldown']]
            end

            [0, elasticity_pol['cooldown']]
        end

        # Returns a positive, 0, or negative number of nodes to adjust,
        #   according to a policy based on attributes
        # @param [Hash] A policy based on attributes
        # @return [Array<Integer>] positive, 0, or negative number of nodes to
        #   adjust, plus the cooldown period duration
        def scale_attributes?(elasticity_pol, vm_pool)
            now = Time.now.to_i

            # TODO: enforce true_up_evals type in ServiceTemplate::ROLE_SCHEMA ?

            period_duration = elasticity_pol['period'].to_i
            period_number   = elasticity_pol['period_number'].to_i
            last_eval       = elasticity_pol['last_eval'].to_i
            true_evals      = elasticity_pol['true_evals'].to_i
            expression      = elasticity_pol['expression']

            if !last_eval.nil? && now < (last_eval + period_duration)
                return [0, 0]
            end

            elasticity_pol['last_eval'] = now

            new_cardinality = cardinality
            new_evals       = 0

            exp_value, exp_st = scale_rule(expression, vm_pool)

            if exp_value
                new_evals = true_evals + 1
                new_evals = period_number if new_evals > period_number

                if new_evals >= period_number
                    Log.debug LOG_COMP,
                              "Role #{name} : elasticy policy #{exp_st} "\
                              'triggered', @service.id

                    new_cardinality = calculate_new_cardinality(elasticity_pol)
                end
            end

            elasticity_pol['true_evals']           = new_evals
            elasticity_pol['expression_evaluated'] = exp_st

            [new_cardinality - cardinality, elasticity_pol['cooldown']]
        end

        # Returns true if the scalability rule is triggered
        # @return true if the scalability rule is triggered
        def scale_rule(elas_expr, vm_pool)
            parser = ElasticityGrammarParser.new

            if elas_expr.nil? || elas_expr.empty?
                return false
            end

            treetop = parser.parse(elas_expr)

            if treetop.nil?
                return [false,
                        "Parse error. '#{elas_expr}': #{parser.failure_reason}"]
            end

            val, st = treetop.result(self, vm_pool)

            [val, st]
        end

        def calculate_new_cardinality(elasticity_pol)
            type   = elasticity_pol['type']
            adjust = elasticity_pol['adjust'].to_i

            # Min is a hard limit, if the current cardinality + adjustment does
            # not reach it, the difference is added

            max = [cardinality, max_cardinality.to_i].max
            # min = [cardinality(), min_cardinality.to_i].min()
            min = min_cardinality.to_i

            case type.upcase
            when 'CHANGE'
                new_cardinality = cardinality + adjust
            when 'PERCENTAGE_CHANGE'
                min_adjust_step = elasticity_pol['min_adjust_step'].to_i

                change = cardinality * adjust / 100.0

                change > 0 ? sign = 1 : sign = -1
                change = change.abs

                if change < 1
                    change = 1
                else
                    change = change.to_i
                end

                change = sign * [change, min_adjust_step].max

                new_cardinality = cardinality + change

            when 'CARDINALITY'
                new_cardinality = adjust
            else
                # TODO: error message
                return cardinality
            end

            # The cardinality can be forced to be outside the min,max
            # range. If that is the case, the scale up/down will not
            # move further outside the range. It will move towards the
            # range with the adjustement set, instead of jumping the
            # difference
            if adjust > 0
                new_cardinality = max if new_cardinality > max
            elsif adjust < 0
                new_cardinality = min if new_cardinality < min
            end

            new_cardinality
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
