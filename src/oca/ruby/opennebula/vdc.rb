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


require 'opennebula/pool_element'

module OpenNebula
    class Vdc < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        ALL_RESOURCES = "-10"

        VDC_METHODS = {
            :info           => "vdc.info",
            :allocate       => "vdc.allocate",
            :update         => "vdc.update",
            :rename         => "vdc.rename",
            :delete         => "vdc.delete",

            :add_group      => "vdc.addgroup",
            :del_group      => "vdc.delgroup",
            :add_cluster    => "vdc.addcluster",
            :del_cluster    => "vdc.delcluster",
            :add_host       => "vdc.addhost",
            :del_host       => "vdc.delhost",
            :add_datastore  => "vdc.adddatastore",
            :del_datastore  => "vdc.deldatastore",
            :add_vnet       => "vdc.addvnet",
            :del_vnet       => "vdc.delvnet",
        }

        # Creates a Vdc description with just its identifier
        # this method should be used to create plain Vdc objects.
        # @param id [Integer] the id of the Vdc
        #
        # Example:
        #   vdc = Vdc.new(Vdc.build_xml(3),rpc_client)
        #
        def Vdc.build_xml(pe_id=nil)
            if pe_id
                vdc_xml = "<VDC><ID>#{pe_id}</ID></VDC>"
            else
                vdc_xml = "<VDC></VDC>"
            end

            XMLElement.build_xml(vdc_xml,'VDC')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)
        end

        #######################################################################
        # XML-RPC Methods for the Vdc Object
        #######################################################################

        # Retrieves the information of the given Vdc.
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def info()
            super(VDC_METHODS[:info], 'VDC')
        end

        alias_method :info!, :info

        # Allocates a new Vdc in OpenNebula
        #
        # @param description [String] The template of the Vdc.
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(description)
            super(VDC_METHODS[:allocate], description)
        end

        # Replaces the template contents
        #
        # @param new_template [String] New template contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_template=nil, append=false)
            super(VDC_METHODS[:update], new_template, append ? 1 : 0)
        end

        # Deletes the Vdc
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def delete()
            super(VDC_METHODS[:delete])
        end

        # Renames this Vdc
        #
        # @param name [String] New name for the Vdc.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            return call(VDC_METHODS[:rename], @pe_id, name)
        end

        # Adds a group to this VDC
        # @param group_id [Integer] Group ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def add_group(group_id)
            return call(VDC_METHODS[:add_group], @pe_id, group_id.to_i)
        end

        # Deletes a group from this VDC
        # @param group_id [Integer] Group ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def del_group(group_id)
            return call(VDC_METHODS[:del_group], @pe_id, group_id.to_i)
        end

        # Adds a cluster to this VDC
        # @param zone_id [Integer] Zone ID
        # @param cluster_id [Integer] Cluster ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def add_cluster(zone_id, cluster_id)
            return call(VDC_METHODS[:add_cluster], @pe_id, zone_id.to_i, cluster_id.to_i)
        end

        # Deletes a cluster from this VDC
        # @param zone_id [Integer] Zone ID
        # @param cluster_id [Integer] Cluster ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def del_cluster(zone_id, cluster_id)
            return call(VDC_METHODS[:del_cluster], @pe_id, zone_id.to_i, cluster_id.to_i)
        end

        # Adds a host to this VDC
        # @param zone_id [Integer] Zone ID
        # @param host_id [Integer] Host ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def add_host(zone_id, host_id)
            return call(VDC_METHODS[:add_host], @pe_id, zone_id.to_i, host_id.to_i)
        end

        # Deletes a host from this VDC
        # @param zone_id [Integer] Zone ID
        # @param host_id [Integer] Host ID        # Adds a host to this VDC
        # @param zone_id [Integer] Zone ID
        # @param host_id [Integer] Host ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def add_host(zone_id, host_id)
            return call(VDC_METHODS[:add_host], @pe_id, zone_id.to_i, host_id.to_i)
        end

        # Deletes a host from this VDC
        # @param zone_id [Integer] Zone ID
        # @param host_id [Integer] Host ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def del_host(zone_id, host_id)
            return call(VDC_METHODS[:del_host], @pe_id, zone_id.to_i, host_id.to_i)
        end
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def del_host(zone_id, host_id)
            return call(VDC_METHODS[:del_host], @pe_id, zone_id.to_i, host_id.to_i)
        end

        # Adds a datastore to this VDC
        # @param zone_id [Integer] Zone ID
        # @param datastore_id [Integer] Datastore ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def add_datastore(zone_id, datastore_id)
            return call(VDC_METHODS[:add_datastore], @pe_id, zone_id.to_i, datastore_id.to_i)
        end

        # Deletes a datastore from this VDC
        # @param zone_id [Integer] Zone ID
        # @param datastore_id [Integer] Datastore ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def del_datastore(zone_id, datastore_id)
            return call(VDC_METHODS[:del_datastore], @pe_id, zone_id.to_i, datastore_id.to_i)
        end

        # Adds a vnet to this VDC
        # @param zone_id [Integer] Zone ID
        # @param vnet_id [Integer] Vnet ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def add_vnet(zone_id, vnet_id)
            return call(VDC_METHODS[:add_vnet], @pe_id, zone_id.to_i, vnet_id.to_i)
        end

        # Deletes a vnet from this VDC
        # @param zone_id [Integer] Zone ID
        # @param vnet_id [Integer] Vnet ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def del_vnet(zone_id, vnet_id)
            return call(VDC_METHODS[:del_vnet], @pe_id, zone_id.to_i, vnet_id.to_i)
        end
    end
end
