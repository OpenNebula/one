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

                def self.exists?(client, name)
                    vm = find(client, name)
                    return vm if OpenNebula.is_error?(vm)

                    !vm.nil?
                end

                def self.name(client, vm_id)
                    return OpenNebula::Error.new(
                        'VM ID cannot be nil', OpenNebula::Error::EACTION
                    ) if vm_id.nil?

                    vm = OpenNebula::VirtualMachine.new_with_id(vm_id, client)

                    rc = vm.info
                    return rc if OpenNebula.is_error?(rc)

                    name = vm.name
                    return OpenNebula::Error.new(
                        "Cannot retrieve name for VM '#{vm_id}'",
                        OpenNebula::Error::EACTION
                    ) if name.nil? || name.to_s.empty?

                    name
                end

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

                def self.delete(client, vm_id, force: false)
                    return OpenNebula::Error.new(
                        'VM ID cannot be nil', OpenNebula::Error::EACTION
                    ) if vm_id.nil?

                    vm = OpenNebula::VirtualMachine.new_with_id(vm_id, client)
                    rc = vm.terminate(force)
                    return rc if OpenNebula.is_error?(rc)

                    true
                end

            end

        end

    end

end
