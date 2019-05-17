# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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
module VirtualMachineHelper

    # Converts the VI string state to OpenNebula state convention
    # Guest states are:
    # - poweredOff   The virtual machine is currently powered off.
    # - poweredOn    The virtual machine is currently powered on.
    # - suspended    The virtual machine is currently suspended.
    def state_to_c(state)
        case state
        when 'poweredOn'
            VM_STATE[:active]
        when 'suspended'
            VM_STATE[:paused]
        when 'poweredOff'
            VM_STATE[:deleted]
        else
            VM_STATE[:unknown]
        end
    end

end
