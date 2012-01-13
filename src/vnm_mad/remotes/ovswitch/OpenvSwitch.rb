# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

class OpenvSwitchVLAN < OpenNebulaNetwork
    XPATH_FILTER = "TEMPLATE/NIC[VLAN='YES']"

    def initialize(vm, deploy_id = nil, hypervisor = nil)
        super(vm,XPATH_FILTER,deploy_id,hypervisor)
    end

    def activate
        process do |nic|
            if nic[:vlan_id]
                vlan = nic[:vlan_id]
            else
                vlan = CONF[:start_vlan] + nic[:network_id].to_i
            end

            cmd =  "#{COMMANDS[:ovs_vsctl]} set Port #{nic[:tap]} "
            cmd << "tag=#{vlan}"

            OpenNebula.exec_and_log(cmd)
        end

        return 0
    end
end
