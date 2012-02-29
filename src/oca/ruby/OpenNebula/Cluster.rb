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
            :adddatastore   => "cluster.adddatastore",
            :addvnet        => "cluster.addvnet"
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

        # ---------------------------------------------------------------------
        # Helpers to get information
        # ---------------------------------------------------------------------

        # Returns whether or not the host with 'id' is part of this cluster
        # @param id [Integer] host ID
        # @return [Boolean] true if found 
        def contains_host(id)
            #This doesn't work in ruby 1.8.5
            #return self["HOSTS/ID[.=#{uid}]"] != nil

            id_array = retrieve_elements('HOSTS/ID')
            return id_array != nil && id_array.include?(id.to_s)
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
        # @param id [Integer] datastore ID
        # @return [Boolean] true if found 
        def contains_datastore(id)
            #This doesn't work in ruby 1.8.5
            #return self["DATASTORES/ID[.=#{uid}]"] != nil

            id_array = retrieve_elements('DATASTORES/ID')
            return id_array != nil && id_array.include?(id.to_s)
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
        # @param id [Integer] vnet ID
        # @return [Boolean] true if found 
        def contains_vnet(id)
            #This doesn't work in ruby 1.8.5
            #return self["HOSTS/ID[.=#{uid}]"] != nil

            id_array = retrieve_elements('VNETS/ID')
            return id_array != nil && id_array.include?(id.to_s)
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
    end
end
