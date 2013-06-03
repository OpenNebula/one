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

require 'treetop'
require 'grammar'
require 'parse-cron'

module OpenNebula
    class Role

        # Actions that can be performed on the VMs of a given Role
        SCHEDULE_ACTIONS = [
            'shutdown',
            'delete',
            'hold',
            'release',
            'stop',
            'shutdown-hard',
            'suspend',
            'resume',
            'boot',
            'delete-recreate',
            'reboot',
            'reboot-hard',
            'poweroff',
            'snapshot-create'
        ]

        STATE = {
            'PENDING'            => 0,
            'DEPLOYING'          => 1,
            'RUNNING'            => 2,
            'UNDEPLOYING'        => 3,
            'FAILED'             => 4,
            'UNKNOWN'            => 5,
            'DONE'               => 6,
            'FAILED_UNDEPLOYING' => 7,
            'FAILED_DEPLOYING'   => 8,
            'SCALING'            => 9,
            'FAILED_SCALING'     => 10
        }

        STATE_STR = [
            'PENDING',
            'DEPLOYING',
            'RUNNING',
            'UNDEPLOYING',
            'FAILED',
            'UNKNOWN',
            'DONE',
            'FAILED_UNDEPLOYING',
            'FAILED_DEPLOYING',
            'SCALING',
            'FAILED_SCALING'
        ]

        LOG_COMP = "ROL"

        def initialize(body, service)
            @body       = body
            @service    = service

            @body['nodes'] ||= []
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
            card = @body['cardinality'].to_i
            card = 1 if (card < 1)
            return card
        end

        # Sets a new cardinality for this role
        # @param [Integer] the new cardinality
        def set_cardinality(cardinality)
            @body['cardinality'] = cardinality.to_i
        end

        # Returns the role max cardinality
        # @return [Integer] the role cardinality
        def max_cardinality
            max = @body['max_vms']

            if max.nil?
                max = cardinality()
            end

            return max.to_i
        end

        # Returns the role min cardinality
        # @return [Integer] the role cardinality
        def min_cardinality
            min = @body['min_vms']

            if min.nil?
                min = cardinality()
            end

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
#            disposed_nodes = @body['disposed_nodes']

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
                else
                    node['vm_info'] = vm.to_hash

                    if (node['disposed'] == "1" && node['vm_info']['VM']['STATE'] == '6')
                        # TODO: copy to an array of disposed nodes?
                        Log.debug "ELAS", "Role #{name}, VM disposed: #{vm_id}"
                    else
                        new_nodes << node
                    end
                end
            end

            @body['nodes'] = new_nodes

            return success
        end

        # Deploys all the nodes in this role
        # @return [Array<true, nil>, Array<false, String>] true if all the VMs
        # were created, false and the error reason if there was a problem
        # creating the VMs
        def deploy
            n_nodes = cardinality() - get_nodes.size

            n_nodes.times { |i|
                vm_name = "#{@body['name']}_#{i}_(service_#{@service.id()})"

                template_id = @body['vm_template']

                Log.debug LOG_COMP, "Role #{name} : Trying to instantiate template "\
                    "#{template_id}, with name #{vm_name}", @service.id()

                template = OpenNebula::Template.new_with_id(template_id, @service.client)

                vm_id = template.instantiate(vm_name)

                if OpenNebula.is_error?(vm_id)
                    msg = "Role #{name} : Instantiate failed for template #{template_id}; #{vm_id.message}"
                    Log.error LOG_COMP, msg, @service.id()
                    @service.log_error(msg)

                    return [false, "Error trying to instantiate the VM Template" \
                        " #{template_id} in Role #{self.name}: #{vm_id.message}"]
                end

                Log.debug LOG_COMP, "Role #{name} : Instantiate success, VM ID #{vm_id}", @service.id()

                # vm.info is not performed, this creates an empty VM xml
                # containing only the ID
                vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @service.client)

                @body['nodes'] << {
                    'deploy_id' => vm_id,
                    'vm_info' => vm.to_hash
                }
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

            n_nodes.times { |i|
                node = nodes[i]

                vm_id = node['deploy_id']

                Log.debug LOG_COMP, "Role #{name} : Shutting down VM #{vm_id}", @service.id()

                vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @service.client)
                rc = vm.shutdown

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
                rc = vm.finalize

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
        def batch_action(action)
            vms_id = []

            nodes = @body['nodes']
            nodes.each do |node|
                vm_id = node['deploy_id']
                vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @service.client)
                rc = vm.info

                if OpenNebula.is_error?(rc)
                    msg = "Role #{name} : VM #{vm_id} monitorization failed; #{rc.message}"
                    Log.error LOG_COMP, msg, @service.id()
                    @service.log_error(msg)

                    # TODO rollback?
                else
                    # TODO disposed nodes?

                    vms_id << vm.id
                    ids = vm.retrieve_elements('USER_TEMPLATE/SCHED_ACTION/ID')

                    id = 0
                    if (!ids.nil? && !ids.empty?)
                        ids.map! {|e| e.to_i }
                        id = ids.max + 1
                    end

                    tmp_str = vm.user_template_str
                    # TODO time & periods
                    tmp_str << "\nSCHED_ACTION = [ID = #{id}, ACTION = #{action}, TIME = #{Time.now.to_i}]"

                    vm.update(tmp_str)
                    # TODO check errors
                end
            end

            log_msg = "Action:#{action} performed on Role:#{self.name} VMs:#{vms_id.join(',')}"
            Log.info LOG_COMP, log_msg, @service.id()

            return [true, nil]
        end

        ########################################################################
        # Scalability
        ########################################################################

        # Returns a positive, 0, or negative number of nodes to adjust,
        #   according to the elasticity policies
        # @return [Integer] positive, 0, or negative number of nodes to adjust
        def scale?()
            elasticity_pol = @body['elasticity_policies']

            if elasticity_pol.nil? || elasticity_pol.empty?
                return 0
            end

            # TODO: give priority to scheduled policies

            elasticity_pol.each do |policy|

                type = policy['type'].upcase

                if %w[CHANGE CARDINALITY PERCENTAGE_CHANGE].include? type

                    diff = scale_attributes?(policy)
                    return diff if diff != 0

                elsif type == "SCHEDULED"

                    diff = scale_time?(policy)
                    return diff if diff != 0

                else
                    # TODO: report error
                end
            end

            return 0
        end

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
                start_time = Time.parse(start_time).to_i
            else
                recurrence  = elasticity_pol['recurrence']

                if recurrence.nil? || recurrence.empty?
                    # TODO error msg
                    return 0
                end

                begin
                    cron_parser = CronParser.new(recurrence)

                    Log.debug "ELAS", "Recurrence #{recurrence} next time #{cron_parser.next(Time.at(last_eval))}"

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
                Log.debug "ELAS", "Role #{name} scheduled scalability for #{Time.at(start_time)} triggered"

                return target_vms.to_i - cardinality()
            end

            return 0
        end

        # Returns a positive, 0, or negative number of nodes to adjust,
        #   according to a policy based on attributes
        # @param [Hash] A policy based on attributes
        # @return [Integer] positive, 0, or negative number of nodes to adjust
        def scale_attributes?(elasticity_pol)

            now = Time.now.to_i

            # TODO: enforce true_up_evals type in ServiceTemplate::ROLE_SCHEMA ?

            period_duration = elasticity_pol['period'].to_i
            period_number   = elasticity_pol['period_number'].to_i
            last_eval       = elasticity_pol['last_eval'].to_i
            true_evals      = elasticity_pol['true_evals'].to_i
            expression      = elasticity_pol['expression']

            adjust          = elasticity_pol['adjust'].to_i

            Log.debug "ELAS", "Expression '#{expression}', adjust #{adjust}"

            if !last_eval.nil?
                if now < (last_eval + period_duration)
                    Log.debug "ELAS", "Role #{name} expression '#{expression}' evaluation ignored, time < period"

                    return 0
                end
            end

            elasticity_pol['last_eval'] = now

            new_cardinality = cardinality()
            new_evals       = 0

            if scale_rule(expression)
                new_evals = true_evals + 1
                new_evals = period_number if new_evals > period_number

                Log.debug "ELAS", "Role #{name} scale expression '#{expression}' is true"

                if new_evals >= period_number
                    # TODO: Type CHANGE assumed, need to do CARDINALITY, PERCENTAGE_CHANGE

                    new_cardinality = cardinality() + adjust

                    new_cardinality = min_cardinality if new_cardinality < min_cardinality
                    new_cardinality = max_cardinality if new_cardinality > max_cardinality

                    new_evals = 0
                else
                    Log.debug "ELAS", "Role #{name} expression '#{expression}' evaluation ignored, true #{new_up_evals} times, #{period_number} needed"
                end
            end

            elasticity_pol['true_evals'] = new_evals

            return new_cardinality - cardinality()
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
                # TODO: Add error to service template
                Log.debug "ELAS", "Expr parse error. '#{elas_expr}': #{parser.failure_reason}"

                return false
            end

            return treetop.result(self)
        end

        def scale_up(target_cardinality)
            msg = "Role #{name} scaling up from #{cardinality} to #{target_cardinality} nodes"
            Log.info LOG_COMP, msg, @service.id()
            @service.log_info(msg)

            set_cardinality(target_cardinality)

            return deploy()
        end

        def scale_down(target_cardinality)
            msg = "Role #{name} scaling down from #{cardinality} to #{target_cardinality} nodes"
            Log.info LOG_COMP, msg, @service.id()
            @service.log_info(msg)

            set_cardinality(target_cardinality)

            return shutdown(true)
        end

        # For a failed scale up, the cardinality is updated to the actual value
        # For a failed scale down, the shutdown actions are retried
        def retry_scale()
            n_dispose = 0

            get_nodes.each do |node|
                if node['disposed'] == "1"

                    ############################################################
                    # TODO: refactor code, copied from shutdown()
                    ############################################################

                    vm_id = node['deploy_id']

                    Log.debug LOG_COMP, "Role #{name} : Shutting down VM #{vm_id}", @service.id()

                    vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @service.client)
                    rc = vm.shutdown

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

                    ############################################################

                    n_dispose += 1
                end
            end

            set_cardinality( get_nodes.size() - n_dispose )
        end
    end
end
