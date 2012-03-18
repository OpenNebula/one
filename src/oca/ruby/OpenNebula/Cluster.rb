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


require 'OpenNebula/Pool'

module OpenNebula
    class Cluster < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        CLUSTER_METHODS = {
            :info           => "cluster.info",
            :allocate       => "cluster.allocate",
            :delete         => "cluster.delete",
            :addhost        => "cluster.addhost",
            :delhost        => "cluster.delhost",
            :adddatastore   => "cluster.adddatastore",
            :deldatastore   => "cluster.deldatastore",
            :addvnet        => "cluster.addvnet",
            :delvnet        => "cluster.delvnet"
        }

        # Creates a Cluster description with just its identifier
        # this method should be used to create plain Cluster objects.
        # +id+ the id of the host
        #
        # Example:
        #   cluster = Cluster.new(Cluster.build_xml(3),rpc_client)
        #
        def Cluster.build_xml(pe_id=nil)
            if pe_id
                cluster_xml = "<CLUSTER><ID>#{pe_id}</ID></CLUSTER>"
            else
                cluster_xml = "<CLUSTER></CLUSTER>"
            end

            XMLElement.build_xml(cluster_xml,'CLUSTER')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)
        end

        #######################################################################
        # XML-RPC Methods for the Cluster Object
        #######################################################################

        # Retrieves the information of the given Cluster.
        def info()
            super(CLUSTER_METHODS[:info], 'CLUSTER')
        end

        # Allocates a new Cluster in OpenNebula
        #
        # +clustername+ A string containing the name of the Cluster.
        def allocate(clustername)
            super(CLUSTER_METHODS[:allocate], clustername)
        end

        # Deletes the Cluster
        def delete()
            super(CLUSTER_METHODS[:delete])
        end

        # Adds a Host to this Cluster
        # @param hid [Integer] Host ID
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def addhost(hid)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(CLUSTER_METHODS[:addhost], @pe_id, hid)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Deletes a Host from this Cluster
        # @param hid [Integer] Host ID
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def delhost(hid)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(CLUSTER_METHODS[:delhost], @pe_id, hid)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Adds a Datastore to this Cluster
        # @param ds_id [Integer] Datastore ID
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def adddatastore(ds_id)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(CLUSTER_METHODS[:adddatastore], @pe_id, ds_id)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Deletes a Datastore from this Cluster
        # @param ds_id [Integer] Datastore ID
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def deldatastore(ds_id)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(CLUSTER_METHODS[:deldatastore], @pe_id, ds_id)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Adds a VNet to this Cluster
        # @param vnet_id [Integer] VNet ID
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def addvnet(vnet_id)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(CLUSTER_METHODS[:addvnet], @pe_id, vnet_id)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Deletes a VNet from this Cluster
        # @param vnet_id [Integer] VNet ID
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def delvnet(vnet_id)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(CLUSTER_METHODS[:delvnet], @pe_id, vnet_id)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # ---------------------------------------------------------------------
        # Helpers to get information
        # ---------------------------------------------------------------------

        # Returns whether or not the host with 'id' is part of this cluster
        # @param id [Integer|Array] host ID
        # @return [Boolean] true if found 
        def contains_host?(id)
            contains_resource?('HOSTS/ID', id)
        end

        # Returns an array with the numeric host ids
        # @return [Array<Integer>]
        def host_ids
            array = Array.new

            self.each("HOSTS/ID") do |id|
                array << id.text.to_i
            end

            return array
        end

        # Returns whether or not the datastore with 'id' is part of this cluster
        # @param id [Integer|Array] datastore ID
        # @return [Boolean] true if found 
        def contains_datastore?(id)
            contains_resource?('DATASTORES/ID', id)
        end

        # Returns an array with the numeric datastore ids
        # @return [Array<Integer>]
        def datastore_ids
            array = Array.new

            self.each("DATASTORES/ID") do |id|
                array << id.text.to_i
            end

            return array
        end

        # Returns whether or not the vnet with 'id' is part of this cluster
        # @param id [Integer|Arrray] vnet ID
        # @return [Boolean] true if found 
        def contains_vnet?(id)
            contains_resource?('VNETS/ID', id)
        end

        # Returns an array with the numeric vnet ids
        # @return [Array<Integer>]
        def vnet_ids
            array = Array.new

            self.each("VNETS/ID") do |id|
                array << id.text.to_i
            end

            return array
        end

        private

        def contains_resource?(xpath, id)
            id_array = retrieve_elements(xpath)

            return false if id_array.nil?

            id = [id] if id.class != Array

            id.each { |i| 
                return false if !id_array.include?(i.to_s)
            }

            return true
        end
    end
end
