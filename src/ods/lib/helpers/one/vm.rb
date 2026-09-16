# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

    module DocumentServer

        # Defines methods to manage resources in OpenNebula using the OCA API
        module OneHelper

            # Defines methods to manage Virtual Machines in OpenNebula
            module VirtualMachine

                RESOURCE_TYPE = 'vm'
                WAIT_DELETE   = true

                # Creates a virtual machine from a template.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param template [Hash] VM template.
                # @param hold [Boolean] Whether to create the VM on hold.
                # @return [OpenNebula::VirtualMachine, OpenNebula::Error]
                def self.create(client, template, hold: false)
                    template = Hash.to_raw(template)
                    return template if OpenNebula.is_error?(template)

                    return OpenNebula::Error.new(
                        'VM template cannot be empty', OpenNebula::Error::EACTION
                    ) if template.to_s.empty?

                    vm = OpenNebula::VirtualMachine.new(
                        OpenNebula::VirtualMachine.build_xml, client
                    )

                    rc = vm.allocate(template, hold)
                    return rc if OpenNebula.is_error?(rc)

                    rc = vm.info
                    return rc if OpenNebula.is_error?(rc)

                    vm
                end

                # Returns a VM body using symbolized keys.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param vm_id [Integer] VM ID.
                # @param downcase [Boolean] Whether to downcase keys.
                # @return [Hash, OpenNebula::Error] VM body or an API error.
                def self.body(client, vm_id, downcase: true)
                    vm = get(client, vm_id)
                    return vm if OpenNebula.is_error?(vm)

                    body = vm.to_hash['VM']

                    return OpenNebula::Error.new(
                        "Cannot retrieve VM body for resource '#{vm_id}'",
                        OpenNebula::Error::EACTION
                    ) unless body

                    body.deep_symbolize_keys(:downcase => downcase)
                end

                # Checks whether a VM with a name exists.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] VM name.
                # @return [Boolean, OpenNebula::Error] existence result or an API error.
                def self.exists?(client, name)
                    vm = find(client, name)
                    return vm if OpenNebula.is_error?(vm)

                    !vm.nil?
                end

                # Checks whether a VM ID exists in the pool.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param vm_id [Integer] VM ID.
                # @return [Boolean, OpenNebula::Error] existence result or an API error.
                def self.exists_id?(client, vm_id)
                    vm_pool = OpenNebula::VirtualMachinePool.new(client, -1)

                    rc = vm_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    vm_pool.any? {|vm| vm.id.to_i == vm_id.to_i }
                end

                # Retrieves a VM with its current information.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param vm_id [Integer] VM ID.
                # @return [OpenNebula::VirtualMachine, OpenNebula::Error] VM or an API error.
                def self.get(client, vm_id)
                    return OpenNebula::Error.new(
                        'VM ID cannot be nil', OpenNebula::Error::EACTION
                    ) if vm_id.nil?

                    vm = OpenNebula::VirtualMachine.new_with_id(vm_id, client)

                    rc = vm.info
                    return rc if OpenNebula.is_error?(rc)

                    vm
                end

                # Returns a VM name.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param vm_id [Integer] VM ID.
                # @return [String, OpenNebula::Error] VM name or an API error.
                def self.name(client, vm_id)
                    vm = get(client, vm_id)
                    return vm if OpenNebula.is_error?(vm)

                    name = vm.name
                    return OpenNebula::Error.new(
                        "Cannot retrieve name for VM '#{vm_id}'",
                        OpenNebula::Error::EACTION
                    ) if name.nil? || name.to_s.empty?

                    name
                end

                # Finds a VM by name.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param name [String] VM name.
                # @return [OpenNebula::VirtualMachine, nil, OpenNebula::Error]
                def self.find(client, name)
                    vm_pool = OpenNebula::VirtualMachinePool.new(client, -1)

                    rc = vm_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    vm = vm_pool.find {|v| v.name == name }
                    return if vm.nil?

                    rc = vm.info
                    return rc if OpenNebula.is_error?(rc)

                    vm
                end

                # Terminates a VM, optionally forcing and waiting for removal.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param vm_id [Integer] VM ID.
                # @param force [Boolean] Whether to force termination.
                # @param wait [Boolean] Whether to wait for deletion.
                # @return [true, OpenNebula::Error] success or an API error.
                def self.delete(client, vm_id, force: false, wait: false)
                    return OpenNebula::Error.new(
                        'VM ID cannot be nil', OpenNebula::Error::EACTION
                    ) if vm_id.nil?

                    vm = if wait
                             get(client, vm_id)
                         else
                             OpenNebula::VirtualMachine.new_with_id(vm_id, client)
                         end

                    return vm if OpenNebula.is_error?(vm)

                    rc = vm.terminate(force)
                    return rc if OpenNebula.is_error?(rc)
                    return true unless wait

                    Resource.wait_until_deleted(vm, :state => 6)
                end

                # Runs a QEMU guest-agent command and waits for its result.
                # @param client [OpenNebula::Client] OpenNebula client.
                # @param vm_id [Integer] VM ID.
                # @param cmd [String] Guest command.
                # @param opts [Hash] Optional stdin and timeout values.
                # @return [Hash, OpenNebula::Error] command result or an API error.
                def self.exec(client, vm_id, cmd, opts = {})
                    stdin   = opts.fetch(:stdin, '')
                    timeout = opts.fetch(:timeout, 60)

                    vm = OpenNebula::VirtualMachine.new_with_id(vm_id, client)
                    return vm if OpenNebula.is_error?(vm)

                    rc = vm.exec(cmd, stdin)

                    return OpenNebula::Error.new(
                        "Command failed on VM #{vm_id}: #{rc.message}",
                        OpenNebula::Error::EACTION
                    ) if OpenNebula.is_error?(rc)

                    wait_exec(vm, cmd, timeout)
                rescue StandardError => e
                    OpenNebula::Error.new(
                        "Error executing command on VM #{vm_id}: #{e.message}",
                        OpenNebula::Error::EACTION
                    )
                end

                def self.wait_exec(vm, cmd, timeout)
                    Timeout.timeout(timeout) do
                        loop do
                            rc = vm.info(true)
                            return rc if OpenNebula.is_error?(rc)

                            qemu_exec = vm.to_hash.dig('VM', 'TEMPLATE', 'QEMU_GA_EXEC') || {}
                            next sleep(1) unless qemu_exec['COMMAND'] == cmd

                            result = exec_result(qemu_exec)

                            case result[:status]
                            when 'DONE'
                                return result if result[:return_code] == 0

                                msg = result[:stderr]
                                msg = result[:stdout] if msg.empty?
                                msg = "Command returned code #{result[:return_code]}" if msg.empty?

                                return OpenNebula::Error.new(msg, OpenNebula::Error::EACTION)
                            when 'ERROR'
                                msg = result[:stderr]
                                msg = result[:stdout] if msg.empty?
                                msg = 'Unknown guest execution error' if msg.empty?

                                return OpenNebula::Error.new(msg, OpenNebula::Error::EACTION)
                            when 'CANCELLED'
                                msg = result[:stderr]
                                msg = result[:stdout] if msg.empty?
                                msg = "Command cancelled on VM #{vm.id}" if msg.empty?

                                return OpenNebula::Error.new(msg, OpenNebula::Error::EACTION)
                            end

                            sleep 1
                        end
                    end
                rescue Timeout::Error
                    OpenNebula::Error.new(
                        "Timeout waiting for command on VM #{vm.id}",
                        OpenNebula::Error::EACTION
                    )
                end

                def self.exec_result(qemu_exec)
                    {
                        :status      => qemu_exec['STATUS'],
                        :return_code => qemu_exec['RETURN_CODE'].to_i,
                        :stdout      => Base64.decode64(qemu_exec['STDOUT'].to_s).strip,
                        :stderr      => Base64.decode64(qemu_exec['STDERR'].to_s).strip
                    }
                end

                private_class_method :wait_exec, :exec_result

            end

        end

    end

end
