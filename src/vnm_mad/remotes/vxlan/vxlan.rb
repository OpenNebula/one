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

require 'ipaddr'

module VXLAN
    ATTR_VLAN_ID  = :vlan_id
    ATTR_VLAN_DEV = :vlan_dev

    ############################################################################
    # This function creates and activate a VLAN device
    ############################################################################
    def create_vlan_dev
        vxlan_mode = conf_attribute(@nic, :vxlan_mode, 'multicast')
        group = ''

        if vxlan_mode.downcase == 'evpn'
            vxlan_tep = conf_attribute(@nic, :vxlan_tep, 'dev')

            if vxlan_tep.downcase == 'dev'
                tep = "dev #{@nic[:phydev]}"
            else
                tep = "local #{get_interface_first_ip(@nic[:phydev])}"
            end
        else
            begin
                ipaddr = IPAddr.new conf_attribute(@nic, :vxlan_mc, '239.0.0.0')
            rescue StandardError
                ipaddr = IPAddr.new '239.0.0.0'
            end

            mc  = ipaddr.to_i + @nic[@attr_vlan_id].to_i
            mcs = IPAddr.new(mc, Socket::AF_INET).to_s

            group = "group #{mcs}"
            tep   = "dev #{@nic[:phydev]}"
        end

        mtu = @nic[:mtu] ? "mtu #{@nic[:mtu]}" : "mtu #{@nic[:conf][:vxlan_mtu]}"
        ttl = @nic[:conf][:vxlan_ttl] ? "ttl #{@nic[:conf][:vxlan_ttl]}" : ''

        ip_link_conf = ''

        @nic[:ip_link_conf].each do |option, value|
            case value
            when true
                value = 'on'
            when false
                value = 'off'
            end

            ip_link_conf << "#{option} #{value} "
        end

        # `ip link add ...` returns 2 when vxlan device already exists
        # allow it to prevent race conditions
        OpenNebula.exec_and_log("#{command(:ip)} link add #{@nic[@attr_vlan_dev]}"\
            " #{mtu} type vxlan id #{@nic[@attr_vlan_id]} #{group} #{ttl}"\
            " #{tep} #{ip_link_conf}", nil, 2)

        OpenNebula.exec_and_log("#{command(:ip)} link set #{@nic[@attr_vlan_dev]} up")
    end

    def delete_vlan_dev
        OpenNebula.exec_and_log("#{command(:ip)} link delete #{@nic[@attr_vlan_dev]}")
    end

    def list_interface_vlan(name)
        text = %x(#{command(:ip_unpriv)} -d link show #{name})
        return nil if $?.exitstatus != 0

        text.each_line do |line|
            m = line.match(/^\s*vxlan id (\d+)/)

            return m[1] if m
        end

        nil
    end

    def get_interface_first_ip(name)
        text = %x(#{command(:ip_unpriv)} addr show dev #{name})
        return nil if $?.exitstatus != 0

        text.each_line do |line|
            m = line.match(/^\s*inet6? ([a-f:\d\.]+)/i)
            if m
                next if m[1].start_with?('127.')
                next if m[1] == '::1'
                return m[1]
            end
        end
        return nil
    end

    def conf_attribute(nic, name, default)
        return nic[name] unless nic[name].nil?

        nic[:conf][name] || default
    end
end
