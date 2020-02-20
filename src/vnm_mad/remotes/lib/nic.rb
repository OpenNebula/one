# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

require 'open3'

module VNMMAD

    module VNMNetwork

        # This Hash will be pppulated by the NicKVM and other hypervisor-nic
        # specific classes.
        HYPERVISORS = {}

        # This class represents the NICS of a VM, it provides a factory method
        # to create VMs of the given hyprtvisor
        class Nics < Array

            def initialize(hypervisor)
                @nicClass = HYPERVISORS[hypervisor] || NicKVM
            end

            def new_nic
                @nicClass.new
            end

        end

        ########################################################################
        # Hypervisor specific implementation of network interfaces. Each class
        # implements the following interface:
        #   - get_info to populste the VM.vm_info Hash
        #   - get_tap to set the [:tap] attribute with the associated NIC
        ########################################################################

        # A NIC using KVM. This class implements functions to get the physical
        # interface that the NIC is using, based on the MAC address
        class NicKVM < Hash

            VNMNetwork::HYPERVISORS['kvm'] = self

            def initialize
                super(nil)
            end

            # Get the VM information with virsh dumpxml
            def get_info(vm)
                if vm.deploy_id
                    deploy_id = vm.deploy_id
                else
                    deploy_id = vm['DEPLOY_ID']
                end

                return if !deploy_id || !vm.vm_info[:dumpxml].nil?

                virsh = (VNMNetwork::COMMANDS[:virsh]).to_s
                cmd = "#{virsh} dumpxml #{deploy_id} 2>/dev/null"

                vm.vm_info[:dumpxml] = `#{cmd}`

                vm.vm_info.each_key do |k|
                    vm.vm_info[k] = nil if vm.vm_info[k].to_s.strip.empty?
                end
            end

            # Look for the tap in
            # devices/interface[@type='bridge']/mac[@address='<mac>']/../target"
            def get_tap(vm)
                dumpxml = vm.vm_info[:dumpxml]

                if dumpxml
                    dumpxml_root = REXML::Document.new(dumpxml).root

                    xpath = "devices/interface[@type='bridge' or @type='vhostuser']/" \
                            "mac[@address='#{self[:mac]}']/../target"

                    tap = dumpxml_root.elements[xpath]

                    self[:tap] = tap.attributes['dev'] if tap
                end

                self
            end

        end

        # A NIC using LXD. This class implements functions to get the physical
        # interface that the NIC is using, based on the MAC address
        class NicLXD < Hash

            VNMNetwork::HYPERVISORS['lxd'] = self

            def initialize
                super(nil)

                _o, _e, snap = Open3.capture3('snap list lxd;') # avoid cmd not found with;
                @lxc_cmd = 'lxc'
                @lxc_cmd.prepend('sudo ') if snap.exitstatus.zero?
            end

            # Get the VM information with lxc config show
            def get_info(vm)
                if vm.deploy_id
                    deploy_id = vm.deploy_id
                else
                    deploy_id = vm['DEPLOY_ID']
                end

                return if !deploy_id || !vm.vm_info[:dumpxml].nil?

                cmd = "#{@lxc_cmd} config show #{deploy_id}"
                config, _e, _s = Open3.capture3(cmd)

                vm.vm_info[:dumpxml] = YAML.safe_load(config)

                vm.vm_info.each_key do |k|
                    vm.vm_info[k] = nil if vm.vm_info[k].to_s.strip.empty?
                end
            end

            # Look for the tap in config
            def get_tap(vm)
                dumpxml = vm.vm_info[:dumpxml]

                if dumpxml
                    devices = dumpxml['devices']
                    xpath = find_path(devices, self[:mac])
                end

                if xpath
                    self[:tap] = devices[xpath]['host_name'] if devices[xpath]['host_name']
                end

                self
            end

            private

            def find_path(hash, text)
                path = '' unless path.is_a?(String)
                hash.each do |k, v|
                    if v == text
                        return k
                    end

                    if v.is_a?(Hash)
                        path = k
                        tmp = find_path(v, text)
                    end
                    return path unless tmp.nil?
                end
                nil
            end

        end

        # A NIC using Firecracker. This class implements functions to get the physical
        # interface that the NIC is using, based on the MAC address
        class NicFirecracker < Hash

            VNMNetwork::HYPERVISORS['firecracker'] = self

            def initialize
                super(nil)
            end

            def get_info(_vm)
                nil
            end

            # Look for the tap in config
            def get_tap(vm)
                self[:tap] = "#{vm.deploy_id}-#{self[:nic_id]}"

                self
            end

        end

    end

end
