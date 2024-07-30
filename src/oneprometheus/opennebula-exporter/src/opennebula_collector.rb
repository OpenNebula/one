# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

require 'opennebula'
require 'prometheus/client'

require_relative 'opennebula_server_collector'
require_relative 'opennebula_host_collector'
require_relative 'opennebula_datastore_collector'
require_relative 'opennebula_vm_collector'


module Prometheus

    # Patch base classes to clear internal stores each scrape
    # this allows for some metrics to disappear between scrapes
    # Concurrent scrapes are not supported
    module Client
        class Registry
            def clear
                @mutex.synchronize do
                    @metrics.each_value { |m| m.clear if m }
                end
            end
        end

        class Metric
            def clear
                @store.clear
            end
        end

        class DataStores::Synchronized
            private

            class MetricStore
                def clear
                    synchronize { @internal_store.clear }
                end
            end
        end
    end

    module Middleware
        # OpenNebulaCollector Rack middlware

        # By default metrics are registered on the global registry. Set the
        # `:registry` option to use a custom registry.

        # By default metrics all have the namespace "opennebula". Set
        # `:namespace` to something else if you like.
        class OpenNebulaCollector
            attr_reader :app, :registry

            NAMESPACE = 'opennebula'

            def initialize(app, options = {})
                @app      = app
                @registry = Client.registry
                @client   = OpenNebula::Client.new
                @co_mutex = Mutex.new

                @collectors = []

                @collectors << OpenNebulaServerCollector.new(
                                      @registry, @client, NAMESPACE)
                @collectors << OpenNebulaHostCollector.new(
                                      @registry, @client, NAMESPACE)
                @collectors << OpenNebulaDatastoreCollector.new(
                                      @registry, @client, NAMESPACE)
                @collectors << OpenNebulaVMCollector.new(
                                      @registry, @client, NAMESPACE)
            end

            def call(env)
                collect(env) { @app.call(env) }
            end

            protected

            def collect(env)
                response = yield

                @co_mutex.synchronize do
                    @registry.clear

                    @collectors.each do |c|
                        begin
                            c.collect
                        rescue StandardError
                            nil
                        end
                    end
                end

                response
            rescue StandardError
                nil
            end

        end
    end
end
