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
            'FAILED_DEPLOYING'   => 8
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
            'FAILED_DEPLOYING'
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
            if state < 0 || state > 8
                return false
            end

            @body['state'] = state.to_s

            Log.info LOG_COMP, "Role #{name} new state: #{STATE_STR[state]}", @service.id()

            return true
        end

        # Retrieves the VM information for each Node in this Role
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def info
            success = true

            @body['nodes'].each { |node|
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
                end
            }

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
        # @return [Array<true, nil>, Array<false, String>] true if all the VMs
        # were shutdown, false and the error reason if there was a problem
        # shutting down the VMs
        def shutdown
            success = true

            get_nodes.each { |node|
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
    end
end
