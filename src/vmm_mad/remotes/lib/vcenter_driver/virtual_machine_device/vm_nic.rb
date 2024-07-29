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
module VirtualMachineDevice

    # Nic class
    class Nic < Device

        # Create the OpenNebula nic representation
        # Allow as to create the class without vCenter representation
        # example: attached nics not synced with vCenter
        def self.one_nic(id, one_res)
            new(id, one_res, nil)
        end

        # Create the vCenter nic representation
        # Allow as to create the class without OpenNebula representation
        # example: detached nics that not exists in OpenNebula
        def self.vc_nic(vc_res)
            new(nil, nil, vc_res)
        end

        def key
            raise_if_no_exists_in_vcenter
            @vc_res.key
        end

        def boot_dev
            RbVmomi::VIM
                .VirtualMachineBootOptionsBootableEthernetDevice(
                    :deviceKey => key
                )
        end

        def self.nic_model_class(nicmodel)
            case nicmodel
            when 'virtuale1000', 'e1000'
                RbVmomi::VIM::VirtualE1000
            when 'virtuale1000e', 'e1000e'
                RbVmomi::VIM::VirtualE1000e
            when 'virtualpcnet32', 'pcnet32'
                RbVmomi::VIM::VirtualPCNet32
            when 'virtualsriovethernetcard', 'sriovethernetcard'
                RbVmomi::VIM::VirtualSriovEthernetCard
            when 'virtualvmxnetm', 'vmxnetm'
                RbVmomi::VIM::VirtualVmxnetm
            when 'virtualvmxnet2', 'vmnet2'
                RbVmomi::VIM::VirtualVmxnet2
            when 'virtualvmxnet3', 'vmxnet3'
                RbVmomi::VIM::VirtualVmxnet3
            else # If none matches, use vmxnet3
                RbVmomi::VIM::VirtualVmxnet3
            end
        end

    end

end
