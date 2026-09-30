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

    # Kubernetes family catalogue controllers
    module FamilyController

        # Cluster family catalogue endpoints
        module ClusterFamilies

            extend ODS::GenericController

            BASE_PATH = '/clusters/families'

            # GET /clusters/families
            get do
                OneKS::ControlPlane.families(:except => [:templates])
            end

            # GET /clusters/families/:family
            get ':family' do
                OneKS::ControlPlane.family_by_name(
                    params[:family], :except => [:templates]
                )
            end

            # GET /clusters/families/:family/:flavour/inputs[?exclude_defaults=true]
            get ':family/:flavour/inputs', :params_schema => InputsParamsSchema do |args|
                OneKS::ControlPlane.inputs_for(
                    args[:family],
                    args[:flavour],
                    :exclude_defaults => args.fetch(:exclude_defaults, false)
                )
            end

        end

        # NodeGroup family catalogue endpoints
        module NodeGroupFamilies

            extend ODS::GenericController

            BASE_PATH = '/nodegroups/families'

            # GET /nodegroups/families
            get do
                OneKS::NodeGroup.families(:except => [:templates])
            end

            # GET /nodegroups/families/:family
            get ':family' do
                OneKS::NodeGroup.family_by_name(params[:family], :except => [:templates])
            end

            # GET /nodegroups/families/:family/:flavour/inputs[?exclude_defaults=true]
            get ':family/:flavour/inputs', :params_schema => InputsParamsSchema do |args|
                OneKS::NodeGroup.inputs_for(
                    args[:family],
                    args[:flavour],
                    :exclude_defaults => args.fetch(:exclude_defaults, false)
                )
            end

        end

        # Registers catalogue routes before document resource routes
        def self.registered(app)
            ClusterFamilies.register_routes(app)
            NodeGroupFamilies.register_routes(app)
        end

    end

end
