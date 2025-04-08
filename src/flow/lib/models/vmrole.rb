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

module OpenNebula

    # Service Role class
    class VMRole < Role

        attr_reader :service

        def initialize(body, service)
            super(body, service)

            @body['cooldown'] = @@default_cooldown if @body['cooldown'].nil?
        end

        # Sets a new state
        # @param [Integer] the new state
        def state=(state)
            super(state)
            return unless state == STATE['SCALING']

            elasticity_pol = @body['elasticity_policies']

            return if elasticity_pol.nil?

            elasticity_pol.each do |policy|
                policy.delete('true_evals')
            end
        end

        ########################################################################
        # Operations
        ########################################################################

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

            self.cardinality = new_cardinality

            nil
        end

        ########################################################################
        # Scheduler
        ########################################################################

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

        ########################################################################
        # Scalability
        ########################################################################

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

        def elasticity_policies
            @body['elasticity_policies']
        end

        def update_elasticity_policies(new_policies)
            @body['elasticity_policies'] = new_policies
        end

        def cooldown
            @body['cooldown']
        end

        def update_cooldown(new_cooldown)
            @body['cooldown'] = new_cooldown unless new_cooldown.nil?
        end

        def scale_way(way)
            @body['scale_way'] = SCALE_WAYS[way]
        end

        def clean_scale_way
            @body.delete('scale_way')
        end

        ########################################################################
        # Deployment
        ########################################################################

        # Deploys all the nodes in this role
        #
        # @return [Array<true, nil>, Array<false, String>] true if all the VMs
        #  were created, false and the error reason if there was a problem
        #  creating the VMs
        def deploy
            deployed_nodes = []
            n_nodes        = cardinality - nodes.size

            return [deployed_nodes, nil] if n_nodes == 0

            template_id, template, extra_template = init_template_attributes

            n_nodes.times do
                vm_name = @@vm_name_template
                          .gsub('$SERVICE_ID', @service.id.to_s)
                          .gsub('$SERVICE_NAME', @service.name.to_s)
                          .gsub('$ROLE_NAME', name.to_s)
                          .gsub('$VM_NUMBER', @body['last_vmname'].to_s)

                @body['last_vmname'] += 1

                Log.debug(
                    LOG_COMP,
                    "Role #{name} : Instantiate template #{template_id}, name #{vm_name}",
                    @service.id
                )

                # Instantiate VM
                vm_id = template.instantiate(vm_name, on_hold?, extra_template)

                if OpenNebula.is_error?(vm_id)
                    msg = "Role #{name} : Instantiate failed for template " \
                          "#{template_id}; #{vm_id.message}"

                    Log.error(LOG_COMP, msg, @service.id)

                    @service.log_error(msg)

                    return [false, "Error instantiating VM Template #{template_id} in Role " \
                                   "#{name}: #{vm_id.message}"]
                end

                Log.debug(
                    LOG_COMP,
                    "Role #{name} : Instantiate success, VM ID #{vm_id}",
                    @service.id
                )

                # Once deployed, save VM info in role node body
                deployed_nodes << vm_id
                fill_node_info(vm_id)
            end

            [deployed_nodes, nil]
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

            return false unless rc[0]

            undeployed_nodes.concat(rc[0]) if rc[1].nil?

            undeployed_nodes
        end

        def recover_scale(report)
            rc = nil

            if @body['scale_way'] == SCALE_WAYS['UP']
                rc = [recover_deploy(report), true]
            elsif @body['scale_way'] == SCALE_WAYS['DOWN']
                rc = [recover_undeploy, false]
            end

            rc
        end

        ########################################################################
        # Helpers
        ########################################################################

        private

        # Shuts down all the given nodes
        # @param scale_down [true,false] True to set the 'disposed' node flag
        def shutdown_nodes(nodes, n_nodes, recover)
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

            # Only considering success if all the nodes were undeployed or
            # there are no nodes to undeploy
            success = (undeployed_nodes.size == n_nodes) || (n_nodes < 0)

            [success, undeployed_nodes]
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
                Log.error(
                    LOG_COMP,
                    "Error calculating new cardinality for type #{type}",
                    service.id
                )

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

    end

end
