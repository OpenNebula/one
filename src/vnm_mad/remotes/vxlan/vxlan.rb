# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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
        begin
            ipaddr = IPAddr.new @nic[:conf][:vxlan_mc]
        rescue
            ipaddr = IPAddr.new "239.0.0.0"
        end

        mc  = ipaddr.to_i + @nic[@attr_vlan_id].to_i
        mcs = IPAddr.new(mc, Socket::AF_INET).to_s

        mtu = @nic[:mtu] ? "mtu #{@nic[:mtu]}" : "mtu #{@nic[:conf][:vxlan_mtu]}"
        ttl = @nic[:conf][:vxlan_ttl] ? "ttl #{@nic[:conf][:vxlan_ttl]}" : ""

        ip_link_conf = ""

        @nic[:ip_link_conf].each do |option, value|
            case value
            when true
                value = "on"
            when false
                value = "off"
            end

            ip_link_conf << "#{option} #{value} "
        end

        OpenNebula.exec_and_log("#{command(:ip)} link add #{@nic[@attr_vlan_dev]}"\
            " #{mtu} type vxlan id #{@nic[@attr_vlan_id]} group #{mcs} #{ttl}"\
            " dev #{@nic[:phydev]} #{ip_link_conf}")

        OpenNebula.exec_and_log("#{command(:ip)} link set #{@nic[@attr_vlan_dev]} up")
    end

    def delete_vlan_dev
        OpenNebula.exec_and_log("#{command(:ip)} link delete #{@nic[@attr_vlan_dev]}")
    end

    def get_interface_vlan(name)
        text = %x(#{command(:ip)} -d link show #{name})
        return nil if $?.exitstatus != 0

        text.each_line do |line|
            m = line.match(/^\s*vxlan id (\d+)/)

            return m[1] if m
        end

        nil
    end
end
