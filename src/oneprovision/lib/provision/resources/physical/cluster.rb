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

require 'provision/resources/resource'

module OneProvision

    # Cluster
    class Cluster < Resource

        # Class constructor
        #
        # @param provider   [Provider] Cluster provider
        # @param p_template [Hash]     Resource information in hash form
        def initialize(provider, p_template = nil)
            super(p_template)

            @pool     = OpenNebula::ClusterPool.new(@client)
            @type     = 'cluster'
            @provider = provider
        end

        # Creates a new cluster in OpenNebula
        #
        # @return [Integer] Resource ID
        def create
            new_object

            rc = @one.allocate(@p_template['name'])
            Utils.exception(rc)
            rc = @one.update(Utils.template_like_str(@p_template), true)
            Utils.exception(rc)
            rc = @one.info
            Utils.exception(rc)

            Integer(@one.id)
        end

        # Info an specific object
        #
        # @param id [Integer] Object ID
        def info(id)
            @one = OpenNebula::Cluster.new_with_id(id, @client)
            @one.info(true)
        end

        # Add datastore to cluster (this method needs to be called after info
        # or create)
        #
        # @param id [Integer] datastore ID
        def adddatastore(id)
            @one.adddatastore(id)
        end

        # Deletes the cluster
        #
        # @param force     [Boolean] Force cluster deletion
        # @param provision [OpenNebula::Provision] Provision information
        # @param tf [Hash] Terraform :conf and :state
        #
        # @return [Array]
        #   - Terraform state in base64
        #   - Terraform config in base64
        def delete(force, provision, tf = nil)
            if tf && !tf.empty?
                Terraform.p_load

                terraform   = Terraform.singleton(@provider, tf)
                state, conf = terraform.destroy_cluster(provision, @one.id)
            end

            # Remove non-provision elements added to the cluster
            @one.datastore_ids.each {|i| @one.deldatastore(i) }
            @one.vnet_ids.each {|i| @one.delvnet(i) }
            @one.host_ids.each {|i| @one.delhost(i) }

            if force
                @one.delete
            else
                Utils.exception(@one.delete)
            end

            if state && conf
                [state, conf]
            else
                0
            end
        end

        private

        # Creates new ONE object
        def new_object
            @one = OpenNebula::Cluster.new(OpenNebula::Cluster.build_xml,
                                           @client)
        end

    end

end
