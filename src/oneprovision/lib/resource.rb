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

module OneProvision

    # Represents the ONE object and pool
    class Resource

        # @one  Stores the ONE object
        # @pool Stores the ONE pool
        attr_reader :one, :pool

        # Creates ONE and Pool objects
        #
        # @param type [String]  Resource type [Cluster, Datastore, Host, Vnet]
        # @param id   [Integer] Id of the resource
        def initialize(type, id = nil)
            client = OpenNebula::Client.new

            @type = type

            case type
            when 'Cluster'
                if !id
                    xml = OpenNebula::Cluster.build_xml

                    @one = OpenNebula::Cluster.new(xml, client)
                else
                    @one = OpenNebula::Cluster.new_with_id(id, client)
                    @one.info
                end

                @pool = OpenNebula::ClusterPool.new(client)
            when 'Datastore'
                xml = OpenNebula::Datastore.build_xml

                @one = OpenNebula::Datastore.new(xml, client)
                @pool = OpenNebula::DatastorePool.new(client)
            when 'Host'
                if !id
                    xml = OpenNebula::Host.build_xml

                    @one = OpenNebula::Host.new(xml, client)
                else
                    @one = OpenNebula::Host.new_with_id(id, client)
                    @one.info
                end

                @pool = OpenNebula::HostPool.new(client)
            when 'Vnet'
                xml = OpenNebula::VirtualNetwork.build_xml

                @one = OpenNebula::VirtualNetwork.new(xml, client)
                @pool = OpenNebula::VirtualNetworkPool.new(client)
            end
        end

        # Creates a new resource
        #
        # @param cluster  [Integer]  ID of the cluster to allocate the resource
        # @param template [Template] Template of the resource
        def create(cluster, template)
            if @type == 'Cluster'
                rc = @one.allocate(cluster)
            else
                rc = @one.allocate(template, cluster)
            end

            Utils.exception(rc)

            if @type == 'Cluster'
                @one.update(template, true)
            end

            @one.info
        end

        # Gets all resources or just provision resources
        #
        # @param id [Integer]  ID of the provision
        #
        # @return [Array] with provision resource if id!=nil
        #                 with all resources if if==nil
        def get(id = nil)
            Utils.exception(@pool.info)

            if id
                return @pool.select do |resource|
                    resource['TEMPLATE/PROVISION/PROVISION_ID'] == id
                end
            else
                return @pool.reject do |resource|
                    resource['TEMPLATE/PROVISION/PROVISION_ID'].nil?
                end
            end
        end

        # Deletes the ONE object
        def delete
            @one.info
            @one.delete
        end

    end

end
