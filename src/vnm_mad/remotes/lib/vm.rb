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

module VNMMAD

    module VNMNetwork

        ########################################################################
        # This class represents the VM abstraction. It provides basic methods
        # to interact with its network interfaces.
        ########################################################################
        class VM

            attr_accessor :nics, :vm_info, :deploy_id, :vm_root

            # Creates a new VM object, and bootstrap the NICs array
            #   @param vm_root [REXML] XML document representing the VM
            #   @param xpath_filer [String] to get the VM NICs
            #   @param deploy_id [String] refers to the VM in the hypervisor
            def initialize(vm_root, xpath_filter, deploy_id)
                @vm_root   = vm_root
                @deploy_id = deploy_id

                @vm_info = {}

                @deploy_id = nil if deploy_id == '-'

                @nics       = VNMNetwork::Nics.new(hypervisor)
                @nics_alias = VNMNetwork::Nics.new(hypervisor)

                @pcis       = VNMNetwork::Nics.new(hypervisor)

                return if xpath_filter.nil?

                @vm_root.elements.each(xpath_filter) do |nic_element|
                    nic = @nics.new_nic

                    nic_build_hash(nic_element, nic)

                    if !VNMMAD.pre_action?
                        nic.get_info(self)
                        nic.get_tap(self)
                    end

                    @nics << nic
                end

                @vm_root.elements.each('TEMPLATE/NIC_ALIAS') do |nic_element|
                    nic = @nics_alias.new_nic

                    nic_build_hash(nic_element, nic)

                    @nics_alias << nic
                end

                pci_xpath_filter = xpath_filter.gsub(/\/NIC/,'/PCI')

                @vm_root.elements.each(pci_xpath_filter) do |ne|
                    nic = @pcis.new_nic

                    nic_build_hash(ne, nic)

                    @pcis << nic
                end
            end

            # Iterator on each NIC of the VM
            def each_nic(&block)
                return if @nics.nil?

                @nics.each do |the_nic|
                    block.call(the_nic)
                end
            end

            # Iterator on each NIC_ALIAS of the VM
            def each_nic_alias(&block)
                return if @nics_alias.nil?

                @nics_alias.each do |the_nic|
                    block.call(the_nic)
                end
            end

            # Iterator on each PCI of the VM
            def each_pci(&block)
                return if @pcis.nil?

                @pcis.each do |the_nic|
                    block.call(the_nic)
                end
            end

            def each_nic_all(&block)
                all_nics = @nics

                if all_nics
                    all_nics += @nics_alias
                else
                    all_nics = @nics_alias
                end

                return if all_nics.nil?

                all_nics.each do |the_nic|
                    block.call(the_nic)
                end
            end

            def parent(nic_alias)
                @nics.each do |the_nic|
                    return the_nic if the_nic[:nic_id] == nic_alias[:parent_id]
                end

                nil
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

            def system_dir(ds_location)
                ds_id_p = 'HISTORY_RECORDS/HISTORY/DS_ID'

                ds_id = @vm_root.root.elements[ds_id_p].text
                vm_id = @vm_root.root.elements['ID'].text

                "#{ds_location}/#{ds_id}/#{vm_id}"
            end

            def changes
                changes = {}

                @vm_root.elements['TEMPLATE/VNET_UPDATE'].each do |elem|
                    changes[elem.name.downcase.to_sym] = elem.text
                end

                changes
            end

            private

            # Method to build the associated Hash from a NIC
            #   @param nic_element [REXML] for the NIC
            #   @param nic [Nic] class representation
            def nic_build_hash(nic_element, nic)
                nic_element.elements.each('*') do |nic_attribute|
                    key = nic_attribute.name.downcase.to_sym

                    if nic_attribute.has_elements?
                        data = {}
                        nic_build_hash(nic_attribute, data)
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
