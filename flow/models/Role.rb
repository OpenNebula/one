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

module OpenNebula
    class Role

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
            'SCALING'            => 9
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
            'SCALING'
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
            max = nil

            if !@body['elasticity_policy'].nil?
                max = @body['elasticity_policy']['max_vms']
            end

            if max.nil?
                max = cardinality()
            end

            return max.to_i
        end

        # Returns the role min cardinality
        # @return [Integer] the role cardinality
        def min_cardinality
            min = nil

            if !@body['elasticity_policy'].nil?
                min = @body['elasticity_policy']['min_vms']
            end

            if min.nil?
                min = cardinality()
            end

            return min.to_i
        end

        def up_expr
            expr = nil

            if !@body['elasticity_policy'].nil?
                expr = @body['elasticity_policy']['up_expr']
            end

            return expr
        end

        def down_expr
            expr = nil

            if !@body['elasticity_policy'].nil?
                expr = @body['elasticity_policy']['down_expr']
            end

            return expr
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
        # @param [true, false] true to mark the VMs to be disposed after the
        #   shutdown is completed
        # @return [Array<true, nil>, Array<false, String>] true if all the VMs
        # were shutdown, false and the error reason if there was a problem
        # shutting down the VMs
        def shutdown(dispose=false)
            success = true

            nodes = get_nodes
            n_nodes = nodes.size - cardinality()

#            get_nodes.each { |node|
            n_nodes.times { |i|
                node = nodes[i]

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

                        node['disposed'] = '1'
                    end
                else
                    Log.debug LOG_COMP, "Role #{name} : Shutdown success for VM #{vm_id}", @service.id()

                    node['disposed'] = '1'
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

        ########################################################################
        # Scalability
        ########################################################################


        def scale?()

            elasticity_pol = @body['elasticity_policy']

            if elasticity_pol.nil?
                return cardinality()
            end

            now = Time.now.to_i

            # TODO: enforce true_up_evals type in ServiceTemplate::ROLE_SCHEMA ?

            period_duration = elasticity_pol['period_duration'].to_i
            period_number   = elasticity_pol['period_number'].to_i
            last_eval       = elasticity_pol['last_eval'].to_i
            true_up_evals   = elasticity_pol['true_up_evals'].to_i
            true_down_evals = elasticity_pol['true_down_evals'].to_i

            if !last_eval.nil?
                if now < (last_eval + period_duration)
                    Log.debug "ELAS", "Role #{name} eval ignored, time < period"

                    return cardinality()
                end
            end

            elasticity_pol['last_eval'] = now

            new_cardinality = cardinality()
            new_up_evals    = 0
            new_down_evals  = 0

            if scale_up?()
                new_up_evals = true_up_evals + 1
                new_up_evals = period_number if new_up_evals > period_number

                Log.debug "ELAS", "Role #{name} scale up expression is true"

                if new_up_evals >= period_number
                    if cardinality() < max_cardinality()
                        new_cardinality = cardinality() + 1

                        new_up_evals = 0
                    else
                        Log.debug "ELAS", "Role #{name} has reached its VM limit"
                    end
                else
                    Log.debug "ELAS", "Role #{name} eval ignored, true #{new_up_evals} times, #{period_number} needed"
                end
            elsif scale_down?()
                new_down_evals = true_down_evals + 1
                new_down_evals = period_number if new_down_evals > period_number

                Log.debug "ELAS", "Role #{name} scale down expression is true"

                if new_down_evals >= period_number
                    if cardinality() > min_cardinality()
                        new_cardinality = cardinality() - 1

                        new_down_evals = 0
                    else
                        Log.debug "ELAS", "Role #{name} has reached its VM minimum"
                    end
                else
                    Log.debug "ELAS", "Role #{name} eval ignored, true #{new_down_evals} times, #{period_number} needed"
                end
            end

            elasticity_pol['true_up_evals']   = new_up_evals
            elasticity_pol['true_down_evals'] = new_down_evals

            return new_cardinality
        end

        # Returns true if the scalability rule to scale up is triggered
        # @return true if this role has to scale up
        def scale_up?()
            return scale_rule(up_expr)
        end


        # Returns true if the scalability rule to scale down is triggered
        # @return true if this role has to scale down
        def scale_down?()
            return scale_rule(down_expr)
        end

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
            set_cardinality(target_cardinality)

            return deploy()
        end

        def scale_down(target_cardinality)
            set_cardinality(target_cardinality)

            return shutdown(true)
        end
    end
end
