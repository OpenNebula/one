# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

module OpenNebula

    module DocumentServer

        # Defines methods to manage resources in OpenNebula using the OCA API
        module OneHelper

            # Defines methods to manage Virtual Networks in OpenNebula.
            module VirtualNetwork

                NONE_CLUSTER_ID = OpenNebula::ClusterPool::NONE_CLUSTER_ID

                def self.create(client, template, cluster_id: NONE_CLUSTER_ID)
                    template = Hash.to_raw(template)
                    return template if OpenNebula.is_error?(template)

                    return OpenNebula::Error.new(
                        'Network template cannot be empty', OpenNebula::Error::EACTION
                    ) if template.to_s.empty?

                    vnet = OpenNebula::VirtualNetwork.new(
                        OpenNebula::VirtualNetwork.build_xml, client
                    )

                    rc = vnet.allocate(template, cluster_id)
                    return rc if OpenNebula.is_error?(rc)

                    rc = vnet.info
                    return rc if OpenNebula.is_error?(rc)

                    vnet
                end

                def self.exists?(client, name)
                    vnet = find(client, name)
                    return vnet if OpenNebula.is_error?(vnet)

                    !vnet.nil?
                end

                def self.name(client, network_id)
                    return OpenNebula::Error.new(
                        'Network ID cannot be nil', OpenNebula::Error::EACTION
                    ) if network_id.nil?

                    vn = OpenNebula::VirtualNetwork.new_with_id(network_id, client)

                    rc = vn.info
                    return rc if OpenNebula.is_error?(rc)

                    name = vn.to_hash.dig('VNET', 'NAME')
                    return OpenNebula::Error.new(
                        "Cannot retrieve name for VNet '#{network_id}'",
                        OpenNebula::Error::EACTION
                    ) if name.nil? || name.to_s.empty?

                    name
                end

                def self.find(client, name)
                    vnet_pool = OpenNebula::VirtualNetworkPool.new(client, -1)

                    rc = vnet_pool.info
                    return rc if OpenNebula.is_error?(rc)

                    vnet = vnet_pool.find {|vn| vn.name == name }
                    return if vnet.nil?

                    rc = vnet.info
                    return rc if OpenNebula.is_error?(rc)

                    vnet
                end

                def self.delete(client, network_id)
                    return OpenNebula::Error.new(
                        'Network ID cannot be nil', OpenNebula::Error::EACTION
                    ) if network_id.nil?

                    vnet = OpenNebula::VirtualNetwork.new_with_id(network_id, client)

                    rc = vnet.delete
                    return rc if OpenNebula.is_error?(rc)

                    true
                end

            end

        end

    end

end
