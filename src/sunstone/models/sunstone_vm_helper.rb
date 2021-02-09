# -------------------------------------------------------------------------- #
# Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                #
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

module SunstoneVMHelper

    class << self

      def state_to_str(id, lcm_id)
        id = id.to_i
        state_str = VirtualMachine::VM_STATE[id]

        if state_str == 'ACTIVE'
          lcm_id = lcm_id.to_i
          return VirtualMachine::LCM_STATE[lcm_id]
        end

        return state_str
      end

      def get_ips(vm)
        ips = []

        vm_nics = []

        if !vm['TEMPLATE']['NIC'].nil?
            vm_nics = [vm['TEMPLATE']['NIC']].flatten
        end

        if !vm['TEMPLATE']['PCI'].nil?
            vm_nics = [vm_nics, vm['TEMPLATE']['PCI']].flatten
        end

        vm_nics.each do |nic|
            %w[IP EXTERNAL_IP IP6_GLOBAL IP6_ULA IP6
               VROUTER_IP VROUTER_IP6_GLOBAL VROUTER_IP6_ULA].each do |attr|
                if nic.key?(attr)
                    ips.push(nic[attr])
                end
            end
        end

        VirtualMachine::EXTERNAL_IP_ATTRS.each do |attr|
            external_ip = vm['MONITORING'][attr]

            if !external_ip.nil? && !ips.include?(external_ip)
                ips.push(external_ip)
            end
        end

        return ips
      end


      def get_remote_info(vm_resource)
        vm = vm_resource.to_hash['VM']

        service_id = vm['USER_TEMPLATE']['SERVICE_ID']

        info = {
            :id => vm['ID'],
            :name => vm['NAME'],
            :state => state_to_str(vm['STATE'], vm['LCM_STATE']),
            :start_time => vm['STIME'],
            :networks => get_ips(vm)
        }

        info[:service_id] = service_id if service_id

        return info
      end

    end

end
  