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

APP_NAME = 'oneks'

require_relative '../ods/ods-server'
require_relative 'config/environment'

# OpenNebula Kubernetes as a Service server
module OneKS

    # OneKS Server
    class Server < ODS::Base

        COMP = 'SRV'

        configure do
            Log.info COMP, "Bootstrapping OneKS server (env: #{settings.environment})"

            # Load templates, files and verify configuration
            [OneKS::ControlPlane, OneKS::NodeGroup].each do |k8s_group|
                rc = k8s_group.validate_conf!
                next unless OpenNebula.is_error?(rc)

                Log.error(COMP, "Server initialization failed: #{rc.message}")
                exit(1)
            end

            ODS::ThreadManager.instance.configure(APP_NAME)
            OneKS::ClusterLCM.instance.configure(settings.cloud_auth)
        end

        configure :development do
            K8s.singleton_class.prepend(OneKS::K8sFake)

            {
                OneKS::ControlPlane => 'controlplanes',
                OneKS::NodeGroup    => 'nodegroups'
            }.each do |k8s_group, dir_name|
                path = File.join(ONEKS_SPEC_DIR, 'extra', dir_name, '*.yaml')

                Dir.glob(path).sort.each do |flavour_file|
                    family_name = File.basename(flavour_file, '.yaml')
                    flavour_yaml = YAML.safe_load(
                        File.read(flavour_file, :encoding => 'UTF-8'),
                        :aliases => false
                    )

                    rc = k8s_group.add_flavour(family_name, flavour_yaml)
                    next unless OpenNebula.is_error?(rc)

                    Log.error(COMP, "Server initialization failed: #{rc.message}")
                    exit(1)
                end
            end
        end

        configure :staging do
            set :dump_errors, true
            set :raise_errors, true
            set :show_exceptions, true
        end

        Log.info COMP, "Starting OneKS server (env: #{settings.environment})"
        register OneKS::AppRoutes

        run!

    end

end
