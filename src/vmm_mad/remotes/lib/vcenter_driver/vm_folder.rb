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

module VCenterDriver

    # VirtualMachineFolder class
    class VirtualMachineFolder

        attr_accessor :item, :items

        def initialize(item)
            @item = item
            check_item(@item, nil)
            @items = {}
        end

        ########################################################################
        # Builds a hash with Datastore-Ref / Datastore to be used as a cache
        # @return [Hash] in the form
        #   { ds_ref [Symbol] => Datastore object }
        ########################################################################

        def fetch!
            VIClient.get_entities(@item, 'VirtualMachine').each do |item|
                item_name = item._ref
                @items[item_name.to_sym] = VirtualMachine.new_with_item(item)
            end
        end

        def fetch_templates!
            VIClient.get_entities(@item, 'VirtualMachine').each do |item|
                if item.config.template
                    item_name = item._ref
                    @items[item_name.to_sym] = Template.new(item)
                end
            end
        end

        ########################################################################
        # Returns a Datastore. Uses the cache if available.
        # @param ref [Symbol] the vcenter ref
        # @return Datastore
        ########################################################################

        def get(ref)
            if !@items[ref.to_sym]
                rbvmomi_dc = RbVmomi::VIM::Datastore.new(@item._connection, ref)
                @items[ref.to_sym] = Datastore.new(rbvmomi_dc)
            end

            @items[ref.to_sym]
        end

    end

end
