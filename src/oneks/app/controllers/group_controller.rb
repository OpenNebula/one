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

module OneKS

    # Kubernetes NodeGroup controller
    module NodeGroupController

        # NodeGroups nested below their owning cluster
        module ClusterGroups

            extend ODS::DocumentController

            BASE_PATH = '/clusters'
            ODS_CLASS = OneKS::Cluster
            ODS_POOL  = OneKS::ClusterDocumentPool

            # GET /clusters/:id/nodegroups
            get 'nodegroups' do |cluster|
                rc = cluster.expand_references!
                next rc if OpenNebula.is_error?(rc)

                cluster.node_groups || []
            end

            # GET /clusters/:id/nodegroups/:nodegroup_id
            get 'nodegroups/:nodegroup_id' do |cluster|
                group = cluster.node_group(params[:nodegroup_id])
                next OpenNebula::Error.new(
                    "NodeGroup #{params[:nodegroup_id]} not found in Cluster #{params[:id]}",
                    OpenNebula::Error::ENO_EXISTS
                ) unless group

                OneKS::NodeGroup.new_from_id(@client, params[:nodegroup_id], :raw => true)
            end

            # GET /clusters/:id/nodegroups/:nodegroup_id/pods
            get 'nodegroups/:nodegroup_id/pods' do |cluster|
                feature = require_feature!(cluster, :monitor)
                next feature if OpenNebula.is_error?(feature)

                group = cluster.node_group(params[:nodegroup_id])
                next OpenNebula::Error.new(
                    "NodeGroup #{params[:nodegroup_id]} not found in Cluster #{params[:id]}",
                    OpenNebula::Error::ENO_EXISTS
                ) unless group

                group = OneKS::NodeGroup.new_from_id(@client, params[:nodegroup_id])
                next group if OpenNebula.is_error?(group)

                group.pods
            end

            # POST /clusters/:id/nodegroups
            post(
                'nodegroups',
                :schema   => GroupPostSchema,
                :status   => 202,
                :response => false
            ) do |cluster, attributes|
                cluster.create_group(attributes, :actor => @username)
            end

            # DELETE /clusters/:id/nodegroups/:nodegroup_id
            delete 'nodegroups/:nodegroup_id', :status => 202 do |cluster|
                rc = cluster.delete_group(params[:nodegroup_id], :actor => @username)
                next rc if OpenNebula.is_error?(rc)
            end

            # POST /clusters/:id/nodegroups/:nodegroup_id/scale
            post(
                'nodegroups/:nodegroup_id/scale',
                :schema   => ScaleGroupSchema,
                :status   => 202,
                :response => false
            ) do |cluster, attributes|
                cluster.scale_group(params[:nodegroup_id], attributes[:target], :actor => @username)
            end

            # POST /clusters/:id/nodegroups/:nodegroup_id/recover
            post(
                'nodegroups/:nodegroup_id/recover',
                :schema   => RecoverGroupSchema,
                :status   => 202,
                :response => false
            ) do |cluster, attributes|
                cluster.recover_group(
                    params[:nodegroup_id],
                    :action => attributes.fetch(:action, 'retry'),
                    :actor  => @username
                )
            end

        end

        # NodeGroup document update below its owning cluster
        module GroupUpdate

            extend ODS::DocumentController

            BASE_PATH = '/clusters/:cluster_id/nodegroups'
            ODS_CLASS = OneKS::K8sGroup
            ODS_POOL  = OneKS::K8sGroupDocumentPool

            # PATCH /clusters/:cluster_id/nodegroups/:id
            update :schema => PatchGroupSchema do |group|
                next if group.is_a?(OneKS::NodeGroup) &&
                        group.cluster_id.to_i == params[:cluster_id].to_i

                OpenNebula::Error.new(
                    "NodeGroup #{params[:id]} not found in Cluster #{params[:cluster_id]}",
                    OpenNebula::Error::ENO_EXISTS
                )
            end

        end

        # Global K8sGroup endpoints
        module K8sGroups

            extend ODS::DocumentController

            BASE_PATH = '/groups'
            ODS_CLASS = OneKS::K8sGroup
            ODS_POOL  = OneKS::K8sGroupDocumentPool

            # GET /groups
            list :raw => true

            # GET /groups/:id
            show :raw => true

        end

        def self.registered(app)
            ClusterGroups.register_routes(app)
            GroupUpdate.register_routes(app)
            K8sGroups.register_routes(app)
        end

    end

end
