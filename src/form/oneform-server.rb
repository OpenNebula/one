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

APP_NAME = 'oneform'

module OneForm

    # OneForm's public configuration keeps the legacy host/port shape. ODS
    # receives the equivalent server settings generated during startup.
    module ServerConfig

        def self.normalize!(config)
            config[:server] = config[:server].merge(
                :bind => config[:host],
                :port => config[:port]
            )
        end

    end

end

require_relative '../ods/ods-server'

OneForm::ServerConfig.normalize!(SERVER_CONF)

require_relative 'config/environment'

# OpenNebula Formation provisioning engine
module OneForm

    # OneForm Server
    class Server < ODS::Base

        COMP = 'SRV'

        configure do
            SERVER_CONF[:server].each do |key, value|
                set key, value
            end

            begin
                ODS::ThreadManager.instance.configure(
                    APP_NAME, :shutdown_timeout => SERVER_CONF[:shutdown_timeout]
                )

                # Provision lifecycle management
                provision_pool = OneForm::ProvisionDocumentPool.new(:auth => settings.cloud_auth)
                scheduler      = ODS::JobScheduler.new(
                    :concurrency      => SERVER_CONF[:concurrency],
                    :shutdown_timeout => SERVER_CONF[:shutdown_timeout]
                )
                thread_manager = ODS::ThreadManager.instance

                lcm = OneForm::ProvisionLCM.instance.configure(provision_pool, scheduler)

                scheduler.register(lcm)
                scheduler.start

                thread_manager.start(:lcm) { lcm.catch_up }

                at_exit { thread_manager.stop! }
            rescue StandardError => e
                Log.error COMP, "Server startup failed configuring lifecycle manager: #{e.message}"
                exit(1)
            end

            # Automatically synchronize OneForm drivers during startup
            rc = OneForm::Driver.sync

            if OpenNebula.is_error?(rc)
                Log.error COMP, "Server startup failed synchronizing drivers: #{rc.message}"
                exit(1)
            end

            begin
                # Create the onprem provider by default when server starts
                client = settings.cloud_auth.client('oneadmin')
                pool   = OneForm::ProviderDocumentPool.new(:client => client)
                rc     = pool.ensure_type!('onprem', { :connection => {} })

                raise rc if OpenNebula.is_error?(rc)
            rescue StandardError => e
                Log.error COMP, "Server startup failed ensuring onprem provider: #{e.message}"
                exit(1)
            end
        end

        Log.info COMP, "Starting OneForm server (env: #{settings.environment})"

        register OneForm::AppRoutes
        run!

    end

end
