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

require 'provision/resources/physical/physical_resource'

module OneProvision

    # Network
    class Network < PhysicalResource

        # Class constructor
        #
        # @param provider   [Provider] Network provider
        # @param p_template [Hash]     Resource information in hash form
        def initialize(provider, p_template = nil)
            super

            @pool = OpenNebula::VirtualNetworkPool.new(@client)
            @type = 'network'
        end

        # Creates the object in OpenNebula
        #
        # @param cluster_id [Integer] Cluster ID
        #
        # @return [Integer] Resource ID
        def create(cluster_id)
            if @p_template['provision']['count'] && @p_template['ar']
                (Integer(@p_template['provision']['count']) - 1).times do
                    @p_template['ar'] << @p_template['ar'][0]
                end
            end

            net_id = super

            vnet = OpenNebula::VirtualNetwork.new_with_id(net_id, @client)

            require 'opennebula/wait_ext'

            vnet.extend(OpenNebula::WaitExt)

            rc = vnet.wait('READY', 300, 2)

            if !rc && vnet.state_str == 'ERROR'
                vnet.delete
                Utils.exception(OpenNebula::Error.new('Error creating network'))
            elsif !rc
                OneProvisionLogger.warn('Network not READY, '\
                    'check status after provision completes')
            end

            net_id
        end

        # Info an specific object
        #
        # @param id [String] Object ID
        def info(id)
            @one = OpenNebula::VirtualNetwork.new_with_id(id, @client)
            @one.info(true)
        end

        # Destroy network in provider
        #
        # @param provision [OpenNebula::Provision] Provision information
        # @param tf [Hash] Terraform configuration
        def destroy(provision, tf)
            Terraform.p_load

            terraform = Terraform.singleton(@provider, tf)
            terraform.destroy_network(provision, @one.id)
        end

        private

        # Create new object
        def new_object
            @one = OpenNebula::VirtualNetwork.new(
                OpenNebula::VirtualNetwork.build_xml,
                @client
            )
        end

    end

end
