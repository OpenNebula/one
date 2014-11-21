# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'OpenNebulaNetwork'

class OpenNebulaHM < OpenNebulaNetwork
    DRIVER = "802.1Q"

    XPATH_FILTER = "TEMPLATE/NIC[VLAN='YES']"

    def initialize(vm, deploy_id = nil, hypervisor = nil)
        super(vm,XPATH_FILTER,deploy_id,hypervisor)
        @locking = false

        lock
        @bridges = get_interfaces
        unlock
    end

    def activate
        lock

        vm_id =  @vm['ID']
        process do |nic|
            bridge  = nic[:bridge]
            dev     = nic[:phydev]

            if dev
                if nic[:vlan_id]
                    vlan = nic[:vlan_id]
                else
                    vlan = CONF[:start_vlan] + nic[:network_id].to_i
                end

                if !bridge_exists? bridge
                    create_bridge bridge
                    ifup bridge
                end

                if !device_exists?(dev, vlan)
                    create_dev_vlan(dev, vlan)
                    ifup(dev, vlan)
                end

                if !attached_bridge_dev?(bridge, dev, vlan)
                    attach_brigde_dev(bridge, dev, vlan)
                end
            end
        end

        unlock

        return 0
    end

    def bridge_exists?(bridge)
        @bridges.keys.include? bridge
    end

    def create_bridge(bridge)
        OpenNebula.exec_and_log("#{COMMANDS[:brctl]} addbr #{bridge}")
        @bridges[bridge] = Array.new
    end

    def device_exists?(dev, vlan=nil)
        dev = "#{dev}.#{vlan}" if vlan
        `#{COMMANDS[:ip]} link show #{dev}`
        $?.exitstatus == 0
    end

    def create_dev_vlan(dev, vlan)
        cmd = "#{COMMANDS[:ip]} link add link #{dev}"
        cmd << " name #{dev}.#{vlan} type vlan id #{vlan}"

        OpenNebula.exec_and_log(cmd)
    end

    def attached_bridge_dev?(bridge, dev, vlan=nil)
        return false if !bridge_exists? bridge
        dev = "#{dev}.#{vlan}" if vlan
        @bridges[bridge].include? dev
    end

    def attach_brigde_dev(bridge, dev, vlan=nil)
        dev = "#{dev}.#{vlan}" if vlan
        OpenNebula.exec_and_log("#{COMMANDS[:brctl]} addif #{bridge} #{dev}")
        @bridges[bridge] << dev
    end

    def ifup(dev, vlan=nil)
        dev = "#{dev}.#{vlan}" if vlan
        OpenNebula.exec_and_log("#{COMMANDS[:ip]} link set #{dev} up")
    end
end
