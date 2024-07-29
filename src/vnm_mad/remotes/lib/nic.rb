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
        #   - get_info to populate the VM.vm_info Hash
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
                bxpath  = "devices/interface[@type='bridge' or @type='vhostuser']/" \
                          "mac[@address='#{self[:mac]}']/../"

                return self unless dumpxml

                dumpxml_root = REXML::Document.new(dumpxml).root

                tap = dumpxml_root.elements["#{bxpath}target"]

                self[:tap] = tap.attributes['dev'] if tap

                # DPDK interfaces (post phase) only have source not target
                if !self[:tap] || self[:tap].empty?
                    source = dumpxml_root.elements["#{bxpath}source"]

                    self[:tap] = File.basename(source.attributes['path']) if source
                end

                self
            end

            def set_qos(deploy_id)
                opts = "domiftune --live #{deploy_id} #{self[:target]} "

                %w[INBOUND OUTBOUND].each do |type|
                    opts << "--#{type.downcase} "
                    vals = []

                    %w[AVG_BW PEAK_BW PEAK_KB].each do |att|
                        vals << (self["#{type}_#{att}".downcase.to_sym] rescue 0)
                    end

                    opts << "#{vals.join(',')} "
                end

                _, e, rc = VNMNetwork::Command.run(:virsh, opts)

                raise "Error updating QoS values: #{e}" unless rc.success?
            end

        end

        # A NIC using LXC. This class implements functions to get (by its name)
        # the host network interface that the NIC is using.
        class NicLXC < Hash

            VNMNetwork::HYPERVISORS['lxc'] = self

            def initialize
                super(nil)
            end

            def get_info(_vm)
                nil
            end

            def get_tap(vm)
                return self unless vm.deploy_id

                self[:tap] = "#{vm.deploy_id}-#{self[:nic_id]}"

                self
            end

            def set_qos(_deploy_id)
                nil
            end

        end

    end

end
