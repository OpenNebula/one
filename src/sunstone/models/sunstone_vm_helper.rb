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

# Sunstone VMHelper module
module SunstoneVMHelper

    class << self

        NIC_ATTRS = %w[
            IP
            EXTERNAL_IP
            IP6
            IP6_GLOBAL
            IP6_ULA
            VROUTER_IP
            VROUTER_IP6_GLOBAL
            VROUTER_IP6_ULA
        ]

        def state_to_str(id, lcm_id)
            id = id.to_i
            state_str = VirtualMachine::VM_STATE[id]

            if state_str == 'ACTIVE'
                lcm_id = lcm_id.to_i
                return VirtualMachine::LCM_STATE[lcm_id]
            end

            state_str
        end

        def get_ips(vm_resource)
            vm = vm_resource.to_hash['VM']
            ips = []
            vm_nics = []

            template_nic = vm['TEMPLATE']['NIC']
            template_pci = vm['TEMPLATE']['PCI']

            vm_nics = [template_nic].flatten unless template_nic.nil?

            vm_nics = [vm_nics, template_pci].flatten unless template_pci.nil?

            vm_nics.each do |nic|
                NIC_ATTRS.each do |attr|
                    next unless nic.key?(attr)

                    ips.push(nic[attr])
                end

                next if nic['ALIAS_IDS'].nil?

                nic['ALIAS_IDS'].split(',').each do |alias_id|
                    NIC_ATTRS.each do |attr|
                        alias_ip = vm_resource["/VM/TEMPLATE
							/NIC_ALIAS[NIC_ID='#{alias_id}']/#{attr}"]

                        next if alias_ip.nil?

                        ips.push("* #{alias_ip}")
                    end
                end
            end

            VirtualMachine::EXTERNAL_IP_ATTRS.each do |attr|
                external_ip = vm['MONITORING'][attr]

                next unless external_ip.nil? && ips.include?(external_ip)

                ips.push(external_ip)
            end

            ips
        end

        def get_remote_info(vm_resource)
            info = {
                :id => vm_resource['/VM/ID'],
              :name => vm_resource['/VM/NAME'],
              :state => state_to_str(vm_resource['/VM/STATE'],
                                     vm_resource['/VM/LCM_STATE']),
              :start_time => vm_resource['/VM/STIME'],
              :networks => get_ips(vm_resource)
            }

            service_id = vm_resource['/VM/USER_TEMPLATE/SERVICE_ID']

            info[:service_id] = service_id if service_id

            info
        end

  end

end
