# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'OneMonitor'

class VMMonitor < OneMonitor

    VM_MONITORING_ELEMS = {
        :time => "LAST_POLL",
        :id => "ID",
        :name => "NAME",
        :lcm_state => "LCM_STATE",
        :state => "STATE",
        :memory => "MEMORY",
        :cpu => "CPU",
        :net_tx => "NET_TX",
        :net_rx => "NET_RX"
    }

    def initialize (log_file_folder,monitoring_elems=VM_MONITORING_ELEMS)
        super log_file_folder,monitoring_elems
    end

    def factory(client)
        VirtualMachinePool.new(client)
    end

    def active (vm_hash)
        vm_hash[:state].to_i == 3
    end

    def error (vm_hash)
        vm_hash[:state].to_i == 7
    end
end
