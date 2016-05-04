# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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

module VNMMAD

module VNMNetwork

    ############################################################################
    # This class represents the VM abstraction. It provides basic methods
    # to interact with its network interfaces.
    ############################################################################
    class VM
        attr_accessor :nics, :vm_info, :deploy_id, :vm_root


        # Creates a new VM object, and bootstrap the NICs array
        #   @param vm_root [REXML] XML document representing the VM
        #   @param xpath_filer [String] to get the VM NICs
        #   @param deploy_id [String] refers to the VM in the hypervisor
        def initialize(vm_root, xpath_filter, deploy_id)
            @vm_root      = vm_root
            @deploy_id    = deploy_id

            @vm_info      = Hash.new

            @deploy_id = nil if deploy_id == "-"

            nics = VNMNetwork::Nics.new(hypervisor)

            @vm_root.elements.each(xpath_filter) do |nic_element|
                nic =  nics.new_nic

                nic_build_hash(nic_element,nic)

                nic.get_info(self)
                nic.get_tap(self)

                nics << nic
            end

            @nics = nics
        end

        # Iterator on each NIC of the VM
        def each_nic(block)
            if @nics != nil
                @nics.each do |the_nic|
                    block.call(the_nic)
                end
            end
        end

        # Access an XML Element of the VM
        #   @param element [String] element name
        #   @return [String] value of the element or nil if not found
        def [](element)
            if @vm_root
                val = @vm_root.elements[element]
                return val.text if !val.nil? && val.text
            end

            nil
        end

        # Gets the Hypervisor VM_MAD from the Template
        # @return [String] name of the hypervisor driver
        def hypervisor
            xpath = 'HISTORY_RECORDS/HISTORY/VM_MAD'
            @vm_root.root.elements[xpath].text
        end

        private

        # Method to build the associated Hash from a NIC
        #   @param nic_element [REXML] for the NIC
        #   @param nic [Nic] class representation
        def nic_build_hash(nic_element,nic)
            nic_element.elements.each('*') do |nic_attribute|
                key = nic_attribute.name.downcase.to_sym

                if nic_attribute.has_elements?
                    data = {}
                    nic_build_hash(nic_attribute,data)
                else
                    data = nic_attribute.text
                end

                if nic[key]
                    if nic[key].instance_of?(Array)
                        nic[key] << data
                    else
                        nic[key] = [nic[key], data]
                    end
                else
                    nic[key] = data
                end
            end
        end
    end
end

end
