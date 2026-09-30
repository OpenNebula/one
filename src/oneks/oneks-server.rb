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

        set :monitor_fake_enabled, false
        set :application_fake_enabled, false

        # Builds and starts all the components owned by the OneKS server process
        def self.bootstrap_server
            Log.info COMP, "Bootstrapping OneKS server (env: #{settings.environment})"

            # Validate templates and files before starting background components
            validate_features!
            validate_k8s_configuration!
            validate_chart_catalogue!

            # Configure the shared manager that owns all server background threads
            tm = ODS::ThreadManager.instance
            tm.configure(APP_NAME, :shutdown_timeout => SERVER_CONF[:shutdown_timeout])

            # Create the scheduler responsible for executing lifecycle jobs
            scheduler = ODS::JobScheduler.new(
                :concurrency      => SERVER_CONF[:concurrency],
                :shutdown_timeout => SERVER_CONF[:shutdown_timeout]
            )

            # Obtain the lifecycle managers and create the VM state watcher
            cluster_lcm = OneKS::ClusterLCM.instance
            group_lcm   = OneKS::GroupLCM.instance
            vm_watchdog = OneKS::VMWatchdog.new(
                group_lcm, :auth => settings.cloud_auth
            )

            # Create the document pools used by lifecycle and watchdog operations and connect
            # them to the LCM and scheduler
            c_pool = OneKS::ClusterDocumentPool.new(:auth => settings.cloud_auth)
            g_pool = OneKS::K8sGroupDocumentPool.new(:auth => settings.cloud_auth)

            cluster_lcm.configure(c_pool, scheduler)
            group_lcm.configure(g_pool, scheduler)

            scheduler.register(cluster_lcm)
            scheduler.register(group_lcm)

            # Configure application callbacks before lifecycle workers can submit plans
            ApplicationFake.configure(K8s) if settings.application_fake_enabled

            # Configure the monitor before indexing existing VMs through the watchdog
            MonitorFake.configure(
                vm_watchdog,
                :cloud_auth => settings.cloud_auth,
                :endpoint   => "http://127.0.0.1:#{settings.port}/api/v1"
            ) if settings.monitor_fake_enabled

            # Subscribe to VM changes before lifecycle workers start processing jobs
            rc = vm_watchdog.start(g_pool)
            raise rc if OpenNebula.is_error?(rc)

            # Recover persisted jobs before starting scheduler worker threads
            cluster_lcm.catch_up
            group_lcm.catch_up

            scheduler.start

            at_exit { tm.stop! }
        rescue StandardError => e
            tm&.stop!
            Log.error COMP, "Error bootstrapping OneKS server: #{e.message}"
            exit(1)
        end

        # Loads and validates the configuration required by every K8s group type
        def self.validate_k8s_configuration!
            [OneKS::ControlPlane, OneKS::NodeGroup].each do |k8s_group|
                rc = k8s_group.validate_conf!
                next unless OpenNebula.is_error?(rc)

                Log.error(COMP, "Server initialization failed: #{rc.message}")
                exit(1)
            end
        end

        # Validates every configured optional feature before server startup.
        def self.validate_features!
            rc = OneKS::Features.validate!
            return unless OpenNebula.is_error?(rc)

            Log.error(COMP, "Server initialization failed: #{rc.message}")
            exit(1)
        end

        # Loads the immutable chart catalogue before accepting requests or events.
        def self.validate_chart_catalogue!
            rc = OneKS::Chart.load!
            return unless OpenNebula.is_error?(rc)

            Log.error(COMP, "Server initialization failed: #{rc.message}")
            exit(1)
        end

        configure :development do
            # Replace external Kubernetes operations with local development fakes
            K8s.singleton_class.prepend(OneKS::K8sFake)
            VMWatchdog.prepend(OneKS::VMWatchdogFake)

            set :application_fake_enabled, OneKS::Features.enabled[:monitor]

            # Enable periodic encrypted pod, observation and readiness reports
            set :monitor_fake_enabled, OneKS::Features.enabled[:monitor]
        end

        configure :staging do
            set :dump_errors, true
            set :raise_errors, true
            set :show_exceptions, true
        end

        configure do
            bootstrap_server
        end

        Log.info COMP, "Starting OneKS server (env: #{settings.environment})"
        register OneKS::AppRoutes

        run!

    end

end
