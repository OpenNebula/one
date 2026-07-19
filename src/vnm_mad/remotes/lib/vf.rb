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

require 'pathname'

# rubocop:disable Style/ClassAndModuleChildren
###########################################################################
# Module to use as mixin for configuring VFs
###########################################################################
module VNMMAD::VirtualFunction

    # Attributes that can be updated on update_nic action
    SUPPORTED_UPDATE = [
        :vlan_id,
        :spoofchk,
        :trust
    ]

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
    #   - spoofchk on|off (*)
    #   - query_rss on|off
    #   - state auto|enable|disable
    #   - trust on|off (*)
    #   - node_guid eui64 - Infiniband
    #   - port_guid eui64 - Infiniband
    #   (*) = supported by OpenNebula
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

            configure_vf(pci)
        end
        # rubocop:enable Style/CombinableLoops
        # There is no deactivate_vf
        # vf and representors are left dirty until next (re)activation
    end

    def update_vf(vm, vnet_id)
        changes = vm.changes.select do |k, _|
            SUPPORTED_UPDATE.include?(k)
        end

        return 0 if changes.empty?

        vm.each_pci do |pci|
            next unless Integer(pci[:network_id]) == vnet_id

            configure_vf(pci)
        end

        0
    end

    def configure_vf(pci)
        out = find_vfs

        return if out.nil? || out.empty?

        regexp = Regexp.new("#{pci[:short_address]}$")

        out.each_line do |line|
            next unless line.match(regexp)

            vf = vf_info(line)

            next if vf.nil? || vf[:pf].nil?

            [vf[:pf], vf[:rep]].each do |nic|
                LocalCommand.run_sh("#{command(:ip)} link set #{nic} up")
                LocalCommand.run_sh("#{command(:ethtool)} -K #{nic} hw-tc-offload on")
            end if vf[:rep]

            configure_pf_link(vf, pci)

            pci[:target]   = vf[:rep]
            pci[:phydev]   = vf[:pf]
            pci[:tap]      = vf[:rep]
            pci[:vf_index] = vf[:index]

            break
        end
    end

    private

    # Set on/off string (ip command) based on OpenNebula (YES/NO) setting
    def on_off(option)
        if option.match(/^yes$|^on$/i)
            'on'
        else
            'off'
        end
    end

    # Look for the associated VFs defined in the host
    # @return [String] lines with virtfn sys entries and their associated sys dev
    def find_vfs
        cmd = "find /sys/devices -type l -name 'virtfn*' -printf '%p#'"\
            " -exec readlink -f '{}' \\;"

        out, _err, _rc = Open3.capture3(cmd)

        out
    end

    #
    # Look for the associated PF device to use it as argument for ip command
    #
    # Matched line (argument) is in the form:
    # virtfn       /sys/devices/pci0000:80/0000:80:03.2/0000:85:00.0/virtfn3
    # _vf_pci_path /sys/devices/pci0000:80/0000:80:03.2/0000:85:02.3
    #
    # Virtual Function representor are identify by the phys_port_name:
    #     - cat pf810/phys_port_name
    #       p0
    #     - cat eth0/phys_port_name
    #       pf0vf0
    #     - cat eth1/phys_port_name
    #       pf0vf1
    # @return [Hash] :pf,:index,:rep
    #
    def vf_info(line)
        virtfn, _vf_pci_path = line.split('#')

        m = virtfn.match(/virtfn([0-9]+)/)
        return if m.nil?

        vf = {
            :index => m[1]
        }

        pf_netdir = "#{File.dirname(virtfn)}/net"
        return vf unless Dir.exist?(pf_netdir)

        if !Dir.exist?(pf_netdir)
            message = "Could not find a PF for VF #{vf[:index]}"
            OpenNebula::DriverLogger.log_error(message)
            reutrn vf
        end

        nics = Dir.children(pf_netdir)

        if nics.empty?
            message = "Could not find interfaces at #{pf_netdir}"
            OpenNebula::DriverLogger.log_error(message)
            reutrn vf
        end

        if nics.length == 1
            vf[:pf] = nics.first
            return vf
        end

        nics.each do |nic|
            break if vf[:rep] && vf[:pf]

            begin
                portname = File.read("#{pf_netdir}/#{nic}/phys_port_name").strip

                if portname.match(/pf\d+vf#{vf[:index]}$/) || portname == "vf#{vf[:index]}"
                    vf[:rep] = nic
                elsif portname.match(/p\d/)
                    vf[:pf]  = nic
                end
            rescue StandardError
                # phys_port_name on VF and dumb PF throws "Operation not supported"
                next
            end
        end

        vf
    end

    def get_eswitch_mode(pci_addr)
        cmd = "#{command(:devlink)} dev eswitch show pci/#{pci_addr}"
        o, e, rc = Open3.capture3(cmd)

        if rc != 0
            message = "Could not get eswitch mode of device #{pci_addr}\n#{e}"
            OpenNebula::DriverLogger.log_debug(cmd)
            OpenNebula::DriverLogger.log_error(message)
        end

        # intel_switchdev = "pci/0000:16:00.0: mode switchdev"
        # intel_legacy =    "pci/0000:16:00.1: mode legacy"
        # intel_dumb =      "pci/0000:42:00.0:"

        o.split(' ')[2]
    end

    def switchdev?(pf_nic)
        pci_dir = nic_pci_dir(pf_nic)
        return false if pci_dir.nil?

        pci_addr = File.basename(pci_dir)
        get_eswitch_mode(pci_addr) == 'switchdev'
    end

    def nic_pci_dir(nic_name)
        path = Pathname.new("/sys/class/net/#{nic_name}/device")

        return path.realpath.to_s if path.exist? && path.symlink?

        nil
    end

    #
    # Configure a virtual function using the physical function NIC
    #
    # @param [Hash] vf :pf,:index,:rep physical function ifname, vf index, representor
    #
    def configure_pf_link(vf, pci)
        cmd = "#{command(:ip)} link set #{vf[:pf]} vf #{vf[:index]}"
        cmd << " mac #{pci[:mac]}" if pci[:mac]

        if !vf[:rep]
            # if no vlan id is set use 0 to reset it
            vlan_id = if pci[:vlan_id]
                          pci[:vlan_id]
                      else
                          0
                      end

            cmd << " vlan #{vlan_id}"
            cmd << " spoofchk #{on_off(pci[:spoofchk])}" if pci[:spoofchk]
            cmd << " trust #{on_off(pci[:trust])}" if pci[:trust]
        end

        LocalCommand.run_sh(cmd)
    end

end
# rubocop:enable Style/ClassAndModuleChildren
