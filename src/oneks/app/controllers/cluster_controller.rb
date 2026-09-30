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

    # Kubernetes cluster controller
    module ClusterController

        # Cluster document and lifecycle endpoints
        module K8sCluster

            extend ODS::DocumentController

            BASE_PATH = '/clusters'
            ODS_CLASS = OneKS::Cluster
            ODS_POOL  = OneKS::ClusterDocumentPool

            # GET /clusters
            list :raw => true

            # GET /clusters/:id[?expand=true]
            show :raw => true, :params_schema => ShowParamsSchema do |cluster, args|
                cluster.expand_references! if args.fetch(:expand, false)
            end

            # GET /clusters/:id/observations
            attribute :observations do |cluster, observations|
                feature = require_feature!(cluster, :monitor)
                next feature if OpenNebula.is_error?(feature)

                observations
            end

            # GET /clusters/:id/historic
            get 'historic' do |cluster|
                cluster.historic_events
            end

            # GET /clusters/:id/pods
            get 'pods' do |cluster|
                feature = require_feature!(cluster, :monitor)
                next feature if OpenNebula.is_error?(feature)

                cluster.pods
            end

            # POST /clusters
            create :schema => PostClusterSchema do |attributes|
                cluster = OneKS::Cluster.create(@client, attributes)
                next cluster if OpenNebula.is_error?(cluster)

                rc = cluster.provision(:actor => @username)
                next rc if OpenNebula.is_error?(rc)

                cluster
            end

            # PATCH /clusters/:id
            update :schema => PatchClusterSchema

            # POST /clusters/:id/chmod
            chmod

            # POST /clusters/:id/chown
            chown

            # POST /clusters/:id/chgrp
            chgrp

            # DELETE /clusters/:id[?force=true]
            delete :status => 202, :params_schema => DeleteParamsSchema do |cluster, args|
                rc = cluster.deprovision(
                    :actor => @username, :force => args.fetch(:force, false)
                )
                next rc if OpenNebula.is_error?(rc)
            end

            # GET /clusters/:id/kubeconfig
            get 'kubeconfig' do |cluster|
                kubeconfig = cluster.kubeconfig
                next kubeconfig if OpenNebula.is_error?(kubeconfig)

                { :kubeconfig => kubeconfig }
            end

            # POST /clusters/:id/recover
            post(
                'recover',
                :schema   => RecoverClusterSchema,
                :status   => 202,
                :response => false
            ) do |cluster, attributes|
                cluster.recover(
                    :action => attributes.fetch(:action, 'retry'),
                    :actor  => @username
                )
            end

            # POST /clusters/:id/upgrade
            post(
                'upgrade',
                :schema   => UpgradeClusterSchema,
                :status   => 202,
                :response => false
            ) do |cluster, attributes|
                cluster.upgrade(attributes[:kubernetes_version], :actor => @username)
            end

            # GET /clusters/:id/logs[?all=true]
            logs :params_schema => LogsParamsSchema

        end

        # Cluster deployment validation and readiness endpoints
        module Deployment

            extend ODS::GenericController

            BASE_PATH = '/clusters/deployment'

            # GET /clusters/deployment/check
            get 'check', :oneadmin_only => true do
                { :enabled => OneKS::ClusterReadiness.enabled? }
            end

            # POST /clusters/deployment/validate
            post 'validate', :schema => DeploymentSchema do |deployment|
                rc = ClusterDeployment.validate(@client, deployment)
                next rc if OpenNebula.is_error?(rc)

                { :valid => true }
            end

            # POST /clusters/deployment/check
            post(
                'check', :schema => DeploymentSchema, :oneadmin_only => true, :response => false
            ) do |deployment|
                next OpenNebula::Error.new(
                    'OneKS readiness check service is not enabled',
                    ODS::ResponseHelper::OPERATION_EC
                ) unless OneKS::ClusterReadiness.enabled?

                rc = ClusterDeployment.validate(@client, deployment)
                next rc if OpenNebula.is_error?(rc)

                stream_events(:event_name => 'check_cluster') do |events|
                    OneKS::ClusterReadiness.run(@client, deployment, :stream => events)
                end
            end

        end

        # Registers routes in static-to-dynamic order
        def self.registered(app)
            Deployment.register_routes(app)
            K8sCluster.register_routes(app)
        end

    end

end
