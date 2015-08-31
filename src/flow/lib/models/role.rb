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

require 'treetop'
require 'grammar'
require 'parse-cron'

module OpenNebula
    class Role

        # Actions that can be performed on the VMs of a given Role
        SCHEDULE_ACTIONS = [
            'shutdown',
            'shutdown-hard',
            'undeploy',
            'undeploy-hard',
            'hold',
            'release',
            'stop',
            'suspend',
            'resume',
            'delete',
            'delete-recreate',
            'reboot',
            'reboot-hard',
            'poweroff',
            'poweroff-hard',
            'snapshot-create'
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
            'COOLDOWN'           => 10
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
            'COOLDOWN'
        ]

        LOG_COMP = "ROL"

        def initialize(body, service)
            @body       = body
            @service    = service

            @body['nodes'] ||= []
            @body['disposed_nodes'] ||= []
        end

        def name
            return @body['name']
        end

        # Returns the role state
        # @return [Integer] the role state
        def state
            return @body['state'].to_i
        end

        # Returns the role parents
        # @return [Array] the role parents
        def parents
            return @body['parents'] || []
        end

        # Returns the role cardinality
        # @return [Integer] the role cardinality
        def cardinality
            return @body['cardinality'].to_i
        end

        # Sets a new cardinality for this role
        # @param [Integer] the new cardinality
        def set_cardinality(target_cardinality)
            dir = target_cardinality > cardinality ? "up" : "down"
            msg = "Role #{name} scaling #{dir} from #{cardinality} to #{target_cardinality} nodes"
            Log.info LOG_COMP, msg, @service.id()
            @service.log_info(msg)

            @body['cardinality'] = target_cardinality.to_i
        end

        # Updates the cardinality with the current number of nodes
        def update_cardinality()
            @body['cardinality'] = @body['nodes'].size()
        end

        # Returns the role max cardinality
        # @return [Integer,nil] the role cardinality, or nil if it was not defined
        def max_cardinality
            max = @body['max_vms']

            return nil if max.nil?

            return max.to_i
        end

        # Returns the role min cardinality
        # @return [Integer,nil] the role cardinality, or nil if it was not defined
        def min_cardinality
            min = @body['min_vms']

            return nil if min.nil?

            return min.to_i
        end

        # Returns the string representation of the service state
        # @return [String] the state string
        def state_str
            return STATE_STR[state]
        end

        # Returns the nodes of the role
        # @return [Array] the nodes
        def get_nodes
            @body['nodes']
        end

        # Sets a new state
        # @param [Integer] the new state
        # @return [true, false] true if the value was changed
        def set_state(state)
            if state < 0 || state > STATE_STR.size
                return false
            end

            @body['state'] = state.to_s

            if state == STATE['SCALING']

                elasticity_pol = @body['elasticity_policies']

                if !elasticity_pol.nil?
                    elasticity_pol.each do |policy|
                        policy.delete('true_evals')
                    end
                end
            end

            Log.info LOG_COMP, "Role #{name} new state: #{STATE_STR[state]}", @service.id()

            return true
        end

        # Retrieves the VM information for each Node in this Role. If a Node
        # is to be disposed and it is found in DONE, it will be cleaned
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def info
            success = true

            nodes = @body['nodes']
            new_nodes = []
            disposed_nodes = @body['disposed_nodes']

            nodes.each do |node|
                vm_id = node['deploy_id']
                vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @service.client)
                rc = vm.info

                if OpenNebula.is_error?(rc)
                    msg = "Role #{name} : VM #{vm_id} monitorization failed; #{rc.message}"
                    Log.error LOG_COMP, msg, @service.id()
                    @service.log_error(msg)

                    success = false
                    node['vm_info'] = nil

                    new_nodes << node
                else
                    node['vm_info'] = vm.to_hash

                    vm_state = node['vm_info']['VM']['STATE']
                    lcm_state = node['vm_info']['VM']['LCM_STATE']

                    running = (!Role.vm_failure?(vm_state, lcm_state) &&
                                vm_state == '3' && lcm_state >= '3')

                    if running && @service.ready_status_gate
                        running_status = node['vm_info']['VM']['USER_TEMPLATE']['READY'] || ""
                        running = running_status.upcase == "YES"
                    end

                    node['running'] = running

                    if (vm_state == '6')
                        # Store the VM id in the array of disposed nodes
                        disposed_nodes << vm_id
                    else
                        if (node['scale_up'] == "1" && vm_state == '3' && lcm_state == '3')
                            # If the VM was a scale-up and it reaches RUNNING,
                            # clear the flag
                            node.delete('scale_up')
                        end

                        new_nodes << node
                    end
                end
            end

            @body['nodes'] = new_nodes

            if !success
                return OpenNebula::Error.new()
            end

            return nil
        end

        # Deploys all the nodes in this role
        # @return [Array<true, nil>, Array<false, String>] true if all the VMs
        # were created, false and the error reason if there was a problem
        # creating the VMs
        def deploy(scale_up=false)
            n_nodes = cardinality() - get_nodes.size

            @body['last_vmname'] ||= 0

            if @body['vm_template_contents']
                extra_template = @body['vm_template_contents'].dup
            else
                extra_template = ""
            end

            extra_template <<
                "\nSERVICE_ID = #{@service.id()}" <<
                "\nROLE_NAME = \"#{@body['name']}\""

            n_nodes.times { |i|
                vm_name = @@vm_name_template.
                    gsub("$SERVICE_ID",    @service.id().to_s).
                    gsub("$SERVICE_NAME",  @service.name().to_s).
                    gsub("$ROLE_NAME",     name().to_s).
                    gsub("$VM_NUMBER",     @body['last_vmname'].to_s)

                @body['last_vmname'] += 1

                template_id = @body['vm_template']

                Log.debug LOG_COMP, "Role #{name} : Trying to instantiate template "\
                    "#{template_id}, with name #{vm_name}", @service.id()

                template = OpenNebula::Template.new_with_id(template_id, @service.client)

                vm_id = template.instantiate(vm_name, false, extra_template)

                if OpenNebula.is_error?(vm_id)
                    msg = "Role #{name} : Instantiate failed for template #{template_id}; #{vm_id.message}"
                    Log.error LOG_COMP, msg, @service.id()
                    @service.log_error(msg)

                    return [false, "Error trying to instantiate the VM Template" \
                        " #{template_id} in Role #{self.name}: #{vm_id.message}"]
                end

                Log.debug LOG_COMP, "Role #{name} : Instantiate success, VM ID #{vm_id}", @service.id()
                node = {
                    'deploy_id' => vm_id,
                }

                vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @service.client)
                rc = vm.info
                if OpenNebula.is_error?(rc)
                    node['vm_info'] = nil
                else
                    node['vm_info'] = vm.to_hash
                end

                if scale_up
                    node['scale_up'] = '1'
                end

                @body['nodes'] << node
            }

            return [true, nil]
        end

        # Shutdown all the nodes in this role
        #
        # @param scale_down [true, false] true to shutdown and dispose the
        #   number of VMs needed to get down to cardinality nodes
        # @return [Array<true, nil>, Array<false, String>] true if all the VMs
        # were shutdown, false and the error reason if there was a problem
        # shutting down the VMs
        def shutdown(scale_down=false)
            success = true

            nodes = get_nodes

            if scale_down
                n_nodes = nodes.size - cardinality()
            else
                n_nodes = nodes.size
            end

            shutdown_nodes(nodes[0..n_nodes-1], scale_down)

            return [success, nil]
        end

        # Delete all the nodes in this role
        # @return [Array<true, nil>] All the VMs are deleted, and the return
        #   ignored
        def delete
            get_nodes.each { |node|
                vm_id = node['deploy_id']

                Log.debug LOG_COMP, "Role #{name} : Deleting VM #{vm_id}", @service.id()

                vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @service.client)
                rc = vm.shutdown(true)

                if OpenNebula.is_error?(rc)
                    rc = vm.finalize
                end

                if OpenNebula.is_error?(rc)
                    msg = "Role #{name} : Delete failed for VM #{vm_id}; #{rc.message}"
                    Log.error LOG_COMP, msg, @service.id()
                    @service.log_error(msg)
                else
                    Log.debug LOG_COMP, "Role #{name} : Delete success for VM #{vm_id}", @service.id()
                end
            }

            return [true, nil]
        end

        # Changes the owner/group of all the nodes in this role
        #
        # @param [Integer] uid the new owner id. Set to -1 to leave the current one
        # @param [Integer] gid the new group id. Set to -1 to leave the current one
        #
        # @return [Array<true, nil>, Array<false, String>] true if all the VMs
        #   were updated, false and the error reason if there was a problem
        #   updating the VMs
        def chown(uid, gid)
            get_nodes.each { |node|
                vm_id = node['deploy_id']

                Log.debug LOG_COMP, "Role #{name} : Chown for VM #{vm_id}", @service.id()

                vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @service.client)
                rc = vm.chown(uid, gid)

                if OpenNebula.is_error?(rc)
                    msg = "Role #{name} : Chown failed for VM #{vm_id}; #{rc.message}"
                    Log.error LOG_COMP, msg, @service.id()
                    @service.log_error(msg)

                    return [false, rc.message]
                else
                    Log.debug LOG_COMP, "Role #{name} : Chown success for VM #{vm_id}", @service.id()
                end
            }

            return [true, nil]
        end

        # Schedule the given action on all the VMs that belong to the Role
        # @param [String] action one of the available actions defined in SCHEDULE_ACTIONS
        # @param [Integer] period
        # @param [Integer] vm_per_period
        def batch_action(action, period, vms_per_period)
            vms_id = []

            # TODO: check action is a valid string, period vm_per_period integer

            error_msgs = []
            nodes = @body['nodes']
            now = Time.now.to_i

            do_offset = ( !period.nil? && period.to_i > 0 &&
                !vms_per_period.nil? && vms_per_period.to_i > 0 )

            time_offset = 0

            nodes.each_with_index do |node, index|
                vm_id = node['deploy_id']
                vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @service.client)
                rc = vm.info

                if OpenNebula.is_error?(rc)
                    msg = "Role #{name} : VM #{vm_id} monitorization failed; #{rc.message}"
                    error_msgs << msg
                    Log.error LOG_COMP, msg, @service.id()
                    @service.log_error(msg)
                else
                    ids = vm.retrieve_elements('USER_TEMPLATE/SCHED_ACTION/ID')

                    id = 0
                    if (!ids.nil? && !ids.empty?)
                        ids.map! {|e| e.to_i }
                        id = ids.max + 1
                    end

                    tmp_str = vm.user_template_str

                    if do_offset
                        time_offset = (index / vms_per_period.to_i).floor * period.to_i
                    end

                    tmp_str << "\nSCHED_ACTION = "<<
                        "[ID = #{id}, ACTION = #{action}, TIME = #{now + time_offset}]"

                    rc = vm.update(tmp_str)
                    if OpenNebula.is_error?(rc)
                        msg = "Role #{name} : VM #{vm_id} error scheduling action; #{rc.message}"
                        error_msgs << msg
                        Log.error LOG_COMP, msg, @service.id()
                        @service.log_error(msg)
                    else
                        vms_id << vm.id
                    end
                end
            end

            log_msg = "Action:#{action} scheduled on Role:#{self.name} VMs:#{vms_id.join(',')}"
            Log.info LOG_COMP, log_msg, @service.id()

            if error_msgs.empty?
                return [true, log_msg]
            else
                error_msgs << log_msg
                return [false, error_msgs.join('\n')]
            end
        end

        # Returns true if the VM state is failure
        # @param [Integer] vm_state VM state
        # @param [Integer] lcm_state VM LCM state
        # @return [true,false] True if the lcm state is one of *_FAILURE
        def self.vm_failure?(vm_state, lcm_state)
            vm_state_str = VirtualMachine::VM_STATE[vm_state.to_i]
            lcm_state_str = VirtualMachine::LCM_STATE[lcm_state.to_i]

            if vm_state_str == 'ACTIVE' &&
                (   lcm_state_str == 'BOOT_FAILURE' ||
                    lcm_state_str == 'BOOT_MIGRATE_FAILURE' ||
                    lcm_state_str == 'PROLOG_MIGRATE_FAILURE' ||
                    lcm_state_str == 'PROLOG_FAILURE' ||
                    lcm_state_str == 'EPILOG_FAILURE' ||
                    lcm_state_str == 'EPILOG_STOP_FAILURE' ||
                    lcm_state_str == 'EPILOG_UNDEPLOY_FAILURE' ||
                    lcm_state_str == 'PROLOG_MIGRATE_POWEROFF_FAILURE' ||
                    lcm_state_str == 'PROLOG_MIGRATE_SUSPEND_FAILURE' ||
                    lcm_state_str == 'PROLOG_MIGRATE_UNKNOWN_FAILURE' ||
                    lcm_state_str == 'BOOT_UNDEPLOY_FAILURE' ||
                    lcm_state_str == 'BOOT_STOPPED_FAILURE' ||
                    lcm_state_str == 'PROLOG_RESUME_FAILURE' ||
                    lcm_state_str == 'PROLOG_UNDEPLOY_FAILURE')

                return true
            end

            return false
        end

        ########################################################################
        # Scalability
        ########################################################################

        # Returns a positive, 0, or negative number of nodes to adjust,
        #   according to the elasticity and scheduled policies
        # @return [Array<Integer>] positive, 0, or negative number of nodes to
        #   adjust, plus the cooldown period duration
        def scale?()
            elasticity_pol = @body['elasticity_policies']
            scheduled_pol = @body['scheduled_policies']

            elasticity_pol ||= []
            scheduled_pol ||= []

            scheduled_pol.each do |policy|
                diff = scale_time?(policy)
                return [diff, 0] if diff != 0
            end

            elasticity_pol.each do |policy|
                diff, cooldown_duration = scale_attributes?(policy)
                if diff != 0
                    cooldown_duration = @body['cooldown'] if cooldown_duration.nil?
                    cooldown_duration = @@default_cooldown if cooldown_duration.nil?

                    return [diff, cooldown_duration]
                end
            end

            # Implicit rule that scales up to maintain the min_cardinality, with
            # no cooldown period
            if cardinality < min_cardinality.to_i
                return [min_cardinality.to_i - cardinality, 0]
            end

            return [0, 0]
        end

        # Scales up or down the number of nodes needed to match the current
        # cardinality
        #
        # @return [Array<true, nil>, Array<false, String>] true if all the VMs
        # were created/shut down, false and the error reason if there
        # was a problem
        def scale()
            n_nodes = 0

            get_nodes.each do |node|
                n_nodes += 1 if node['disposed'] != "1"
            end

            diff = cardinality - n_nodes

            if diff > 0
                return deploy(true)
            elsif diff < 0
                return shutdown(true)
            end

            return [true, nil]
        end

        # Updates the duration for the next cooldown
        # @param cooldown_duration [Integer] duration for the next cooldown
        def set_cooldown_duration(cooldown_duration)
            @body['cooldown_duration'] = cooldown_duration.to_i
        end

        # Updates the duration for the next cooldown with the default value
        def set_default_cooldown_duration()
            cooldown_duration = @body['cooldown']
            cooldown_duration = @@default_cooldown if cooldown_duration.nil?

            set_cooldown_duration(cooldown_duration)
        end

        # Sets the cooldown end time from now + the duration set in set_cooldown_duration
        # @return [true, false] true if the cooldown duration is bigger than 0
        def apply_cooldown_duration()
            cooldown_duration = @body['cooldown_duration'].to_i

            if cooldown_duration != 0
                @body['cooldown_end'] = Time.now.to_i + cooldown_duration
                @body.delete('cooldown_duration')

                return true
            end

            return false
        end

        # Returns true if the cooldown period ended
        # @return [true, false] true if the cooldown period ended
        def cooldown_over?()
            return Time.now.to_i >= @body['cooldown_end'].to_i
        end

        def self.init_default_cooldown(default_cooldown)
            @@default_cooldown = default_cooldown
        end

        def self.init_default_shutdown(shutdown_action)
            @@default_shutdown = shutdown_action
        end

        def self.init_default_vm_name_template(vm_name_template)
            @@vm_name_template = vm_name_template
        end

        # Updates the role
        # @param [Hash] template
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(template)

            force = template['force'] == true
            new_cardinality = template["cardinality"]

            if new_cardinality.nil?
                return nil
            end

            new_cardinality = new_cardinality.to_i

            if !force
                if new_cardinality < min_cardinality().to_i
                    return OpenNebula::Error.new(
                        "Minimum cardinality is #{min_cardinality()}")

                elsif !max_cardinality().nil? && new_cardinality > max_cardinality().to_i
                    return OpenNebula::Error.new(
                        "Maximum cardinality is #{max_cardinality()}")

                end
            end

            set_cardinality(new_cardinality)

            return nil
        end

        ########################################################################
        # Recover
        ########################################################################

        def recover_deployment()
            recover()
        end

        def recover_warning()
            recover()
            deploy()
        end

        def recover_scale()
            recover()
            retry_scale()
        end


        ########################################################################
        ########################################################################


        private

        # Returns a positive, 0, or negative number of nodes to adjust,
        #   according to a SCHEDULED type policy
        # @param [Hash] A SCHEDULED type policy
        # @return [Integer] positive, 0, or negative number of nodes to adjust
        def scale_time?(elasticity_pol)
            now = Time.now.to_i

            last_eval = elasticity_pol['last_eval'].to_i

            elasticity_pol['last_eval'] = now

            # If this is the first time this is evaluated, ignore it.
            # We don't want to execute actions planned in the past when the
            # server starts.

            if last_eval == 0
                return 0
            end

            start_time  = elasticity_pol['start_time']
            target_vms = elasticity_pol['adjust']

            if target_vms.nil?
                # TODO error msg
                return 0
            end

            if !(start_time.nil? || start_time.empty?)
                begin
                    start_time = Time.parse(start_time).to_i
                rescue ArgumentError
                    # TODO error msg
                    return 0
                end
            else
                recurrence  = elasticity_pol['recurrence']

                if recurrence.nil? || recurrence.empty?
                    # TODO error msg
                    return 0
                end

                begin
                    cron_parser = CronParser.new(recurrence)

                    # This returns the next planned time, starting from the last
                    # step
                    start_time = cron_parser.next(Time.at(last_eval)).to_i
                rescue
                    # TODO error msg bad format
                    return 0
                end
            end

            # Only actions planned between last step and this one are triggered
            if start_time > last_eval && start_time <= now
                Log.debug LOG_COMP, "Role #{name} : scheduled scalability for "\
                    "#{Time.at(start_time)} triggered", @service.id()

                new_cardinality = calculate_new_cardinality(elasticity_pol)

                return new_cardinality - cardinality()
            end

            return 0
        end

        # Returns a positive, 0, or negative number of nodes to adjust,
        #   according to a policy based on attributes
        # @param [Hash] A policy based on attributes
        # @return [Array<Integer>] positive, 0, or negative number of nodes to
        #   adjust, plus the cooldown period duration
        def scale_attributes?(elasticity_pol)

            now = Time.now.to_i

            # TODO: enforce true_up_evals type in ServiceTemplate::ROLE_SCHEMA ?

            period_duration = elasticity_pol['period'].to_i
            period_number   = elasticity_pol['period_number'].to_i
            last_eval       = elasticity_pol['last_eval'].to_i
            true_evals      = elasticity_pol['true_evals'].to_i
            expression      = elasticity_pol['expression']

            if !last_eval.nil?
                if now < (last_eval + period_duration)
                    return [0, 0]
                end
            end

            elasticity_pol['last_eval'] = now

            new_cardinality = cardinality()
            new_evals       = 0

            exp_value, exp_st = scale_rule(expression)

            if exp_value
                new_evals = true_evals + 1
                new_evals = period_number if new_evals > period_number

                if new_evals >= period_number
                    Log.debug LOG_COMP, "Role #{name} : elasticy policy #{exp_st} "\
                        "triggered", @service.id()
                    new_cardinality = calculate_new_cardinality(elasticity_pol)
                end
            end

            elasticity_pol['true_evals'] = new_evals
            elasticity_pol['expression_evaluated'] = exp_st

            return [new_cardinality - cardinality(), elasticity_pol['cooldown']]
        end

        # Returns true if the scalability rule is triggered
        # @return true if the scalability rule is triggered
        def scale_rule(elas_expr)
            parser = ElasticityGrammarParser.new

            if elas_expr.nil? || elas_expr.empty?
                return false
            end

            treetop = parser.parse(elas_expr)
            if treetop.nil?
                return [false, "Parse error. '#{elas_expr}': #{parser.failure_reason}"]
            end

            val, st = treetop.result(self)

            return [val, st]
        end

        def calculate_new_cardinality(elasticity_pol)
            type    = elasticity_pol['type']
            adjust  = elasticity_pol['adjust'].to_i

            # Min is a hard limit, if the current cardinality + adjustment does
            # not reach it, the difference is added

            max = [cardinality(), max_cardinality.to_i].max()
#            min = [cardinality(), min_cardinality.to_i].min()
            min = min_cardinality.to_i

            case type.upcase
            when 'CHANGE'
                new_cardinality = cardinality() + adjust
            when 'PERCENTAGE_CHANGE'
                min_adjust_step = elasticity_pol['min_adjust_step'].to_i

                change = cardinality() * adjust / 100.0

                sign = change > 0 ? 1 : -1
                change = change.abs

                if change < 1
                    change = 1
                else
                    change = change.to_i
                end

                change = sign * [change, min_adjust_step].max

                new_cardinality = cardinality() + change

            when 'CARDINALITY'
                new_cardinality = adjust
            else
                # TODO: error message
                return cardinality()
            end

            # The cardinality can be forced to be outside the min,max
            # range. If that is the case, the scale up/down will not
            # move further outside the range. It will move towards the
            # range with the adjustement set, instead of jumping the
            # difference
            if (adjust > 0)
                new_cardinality = max if new_cardinality > max
            elsif (adjust < 0)
                new_cardinality = min if new_cardinality < min
            end

            return new_cardinality
        end

        # For a failed scale up, the cardinality is updated to the actual value
        # For a failed scale down, the shutdown actions are retried
        def retry_scale()
            nodes_dispose = get_nodes.select { |node|
                node['disposed'] == "1"
            }

            shutdown_nodes(nodes_dispose, true)

            set_cardinality( get_nodes.size() - nodes_dispose.size() )
        end

        # Deletes VMs in DONE or FAILED, and sends a resume action to VMs in UNKNOWN
        def recover()

            nodes = @body['nodes']
            new_nodes = []
            disposed_nodes = @body['disposed_nodes']

            nodes.each do |node|
                vm_state = nil
                vm_id = node['deploy_id']

                if node['vm_info'] && node['vm_info']['VM'] && node['vm_info']['VM']['STATE']
                    vm_state = node['vm_info']['VM']['STATE']
                    lcm_state = node['vm_info']['VM']['LCM_STATE']

                    vm_state_str = VirtualMachine::VM_STATE[vm_state.to_i]
                    lcm_state_str = VirtualMachine::LCM_STATE[lcm_state.to_i]
                end

                if vm_state == '6' # DONE
                    # Store the VM id in the array of disposed nodes
                    disposed_nodes << vm_id

                elsif ( Role.vm_failure?(vm_state, lcm_state) )
                    vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @service.client)
                    rc = vm.finalize

                    if !OpenNebula.is_error?(rc)
                        # Store the VM id in the array of disposed nodes
                        disposed_nodes << vm_id

                        Log.debug LOG_COMP, "Role #{name} : Delete success for VM #{vm_id}", @service.id()
                    else
                        msg = "Role #{name} : Delete failed for VM #{vm_id}; #{rc.message}"
                        Log.error LOG_COMP, msg, @service.id()
                        @service.log_error(msg)

                        success = false

                        new_nodes << node
                    end
                elsif (vm_state == '3' && lcm_state == '16') # UNKNOWN
                    vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @service.client)
                    vm.resume

                    new_nodes << node
                else
                    new_nodes << node
                end
            end

            @body['nodes'] = new_nodes
        end


        # Shuts down all the given roles
        # @param scale_down [true,false] True to set the 'disposed' node flag
        def shutdown_nodes(nodes, scale_down)

            action = @body['shutdown_action']

            if action.nil?
                action = @service.get_shutdown_action()
            end

            if action.nil?
                action = @@default_shutdown
            end

            nodes.each { |node|
                vm_id = node['deploy_id']

                Log.debug LOG_COMP, "Role #{name} : Shutting down VM #{vm_id}", @service.id()

                vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @service.client)

                if action == 'shutdown-hard'
                    rc = vm.shutdown(true)
                else
                    rc = vm.shutdown
                end

                if scale_down
                    node['disposed'] = '1'
                end

                if OpenNebula.is_error?(rc)
                    msg = "Role #{name} : Shutdown failed for VM #{vm_id}, will perform a Delete; #{rc.message}"
                    Log.error LOG_COMP, msg, @service.id()
                    @service.log_error(msg)

                    rc = vm.finalize

                    if OpenNebula.is_error?(rc)
                        msg = "Role #{name} : Delete failed for VM #{vm_id}; #{rc.message}"
                        Log.error LOG_COMP, msg, @service.id()
                        @service.log_error(msg)

                        success = false
                        #return [false, rc.message]
                    else
                        Log.debug LOG_COMP, "Role #{name} : Delete success for VM #{vm_id}", @service.id()
                    end
                else
                    Log.debug LOG_COMP, "Role #{name} : Shutdown success for VM #{vm_id}", @service.id()
                end
            }
        end

    end
end
