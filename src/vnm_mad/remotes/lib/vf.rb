# -------------------------------------------------------------------------- #
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                #
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

# rubocop:disable Style/ClassAndModuleChildren
###########################################################################
# Module to use as mixin for configuring VFs
###########################################################################
module VNMMAD::VirtualFunction

    # This function iterates for each VF defined as a PCI device in the VM
    # and sets the MAC and VLAN through the ip link command
    # , parameters supported by ip-link:
    #   - mac LLADDRESS (*)
    #   - vlan VLANID (*)
    #   - qos VLAN-QOS
    #   - proto VLAN-PROTO 802.1Q or 802.1ad
    #   - rate TXRATE
    #   - max_tx_rate TXRATE
    #   - min_tx_rate TXRATE
    #   - spoofchk on|off
    #   - query_rss on|off
    #   - state auto|enable|disable
    #   - trust on|off
    #   - node_guid eui64 - Infiniband
    #   - port_guid eui64 - Infiniband
    #   (*) = supported by OpenNebula
    #
    #
    #   VF are linked in the system device map in the system. For example:
    #
    #   /sys/devices/pci0000:80/0000:80:03.2/0000:85:00.0
    #   ├── virtfn0 -> ../0000:85:02.0
    #   ├── virtfn1 -> ../0000:85:02.1
    #   ├── virtfn2 -> ../0000:85:02.2
    #   ├── virtfn3 -> ../0000:85:02.3
    #   ├── virtfn4 -> ../0000:85:02.4  <---- VF short PCI address
    #   ├── virtfn5 -> ../0000:85:02.5
    #   ├── virtfn6 -> ../0000:85:02.6
    #   ├── virtfn7 -> ../0000:85:02.7
    #   ├── net
    #   │   └── enp133s0f0               <---- PF device
    def activate_vf(vm)
        is_attach = false

        vm.each_pci do |pci|
            if pci[:attach] == 'YES'
                is_attach = true
                break
            end
        end

        # rubocop:disable Style/CombinableLoops
        vm.each_pci do |pci|
            next if pci[:short_address].nil?
            next if is_attach && pci[:attach] != 'YES'

            # Look for the associated PF
            cmd = "find /sys/devices -type l -name 'virtfn*' -printf '%p#'"\
                " -exec readlink -f '{}' \\;"

            out, _err, _rc = Open3.capture3(cmd)

            next if out.nil? || out.empty?

            regexp = Regexp.new("#{pci[:short_address]}$")

            out.each_line do |line|
                next unless line.match(regexp)

                virtfn, _vf = line.split('#')

                # rubocop:disable Layout/LineLength
                # Matched line is in the form:
                # virtfn /sys/devices/pci0000:80/0000:80:03.2/0000:85:00.0/virtfn3
                # _vf    /sys/devices/pci0000:80/0000:80:03.2/0000:85:02.3
                # rubocop:enable Layout/LineLength
                m = virtfn.match(/virtfn([0-9]+)/)

                next if m.nil?

                cmd = "ls #{File.dirname(virtfn)}/net"
                pf_dev, _err, _rc = Open3.capture3(cmd)

                next if pf_dev.nil? || pf_dev.empty?

                pf_dev.strip!

                cmd = "#{command(:ip)} link set #{pf_dev} vf #{m[1]}"
                cmd << " mac #{pci[:mac]}" if pci[:mac]
                cmd << " vlan #{pci[:vlan_id]}" if pci[:vlan_id]
                cmd << " spoofchk #{on_off(pci[:spoofchk])}" if pci[:spoofchk]
                cmd << " trust #{on_off(pci[:trust])}" if pci[:trust]

                OpenNebula.exec_and_log(cmd)
            end
        end
        # rubocop:enable Style/CombinableLoops
    end

    def on_off(option)
        if option.match(/^yes$|^on$/i)
            "on"
        else
            "off"
        end
    end
end
# rubocop:enable Style/ClassAndModuleChildren
