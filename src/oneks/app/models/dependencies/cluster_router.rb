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

    # Cluster router dependency for control planes
    class ClusterRouter < OneKS::K8sDependency

        # OpenNebula resource type for this dependency
        ONE_TYPE = OpenNebula::VirtualRouter.class.name
        DEP_TYPE = :EXTERNAL
        COMP     = 'CVR'

        # Dependency constants
        CLUSTER_KEY           = 'CLUSTER_ID'
        VR_API_ALLOCATE       = 'EVENT API one.vrouter.allocate'
        VR_WAIT_TIMEOUT       = 300
        REQUIRED_TPROXY_PORTS = [5030, 2633]
        NETWORK_CONF          = File.join('remotes', 'etc', 'vnm', 'OpenNebulaNetwork.conf')

        def initialize(opts: {})
            super(
                :opts => {
                    :destroy_on_ready => false
                }.merge(opts)
            )

            @creation_timeout = @opts.fetch(:creation_timeout, VR_WAIT_TIMEOUT)
        end

        # Creation is handled externally, no action needed
        def create(_group)
            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "Cluster router creation failed: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Monitor cluster router creation by CAPONE
        # @param group [K8sGroup] Group owning the router
        # @param stop_flag [ODS::ThreadManager::StopFlag] Shared cancellation flag
        def wait_create(group, stop_flag)
            wait_for_vrouter(group, stop_flag)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Monitoring of cluster router failed: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def destroy(group)
            return unless @id

            rc = OneHelper::VRouter.delete(group.client, @id)
            return rc if OpenNebula.is_error?(rc)

            @id    = nil
            @ready = false
            true
        rescue StandardError => e
            self.state = :ERROR

            OpenNebula::Error.new(
                "Cluster router destroy failed: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        private

        # Waits until a vrouter is instantiated for the given group
        # @param group [K8sGroup] Group owning the router
        # @param stop_flag [ODS::ThreadManager::StopFlag] Shared cancellation flag
        # @return [Integer, OpenNebula::Error]
        #   - returns the VR ID if detected
        #   - OpenNebula::Error on timeout or error
        def wait_for_vrouter(group, stop_flag)
            Log.info(
                COMP,
                'Waiting for Cluster Router creation by the Seed VM',
                group.cluster_id
            )

            ODS::EventSubscriber.subscribe_for(
                VR_API_ALLOCATE, :timeout => @creation_timeout, :stop_flag => stop_flag
            ) do |xml|
                # If event nil, is not an event related to OneKS router
                event = OneKS::EventManager.parse_vr_event(group, xml)
                next unless event && event[:cluster_id] == group.cluster_id

                @id = event[:vr_id]

                Log.info(
                    COMP,
                    "Cluster Router (VR_ID=#{@id}) created by the Seed VM",
                    group.cluster_id
                )

                return @id
            end
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error waiting for vrouter for cluster #{group.cluster_id}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        class << self

            def ensure_requirements(_opts = {})
                network_conf = File.join(VAR_LOCATION, NETWORK_CONF)

                data = YAML.load_file(network_conf)
                tproxy = data[:tproxy] || data['tproxy']

                unless tproxy
                    raise(
                        'OneKS cluster router dependency requires TPROXY ' \
                        "to be enabled in #{network_conf}"
                    )
                end

                service_ports = Array(tproxy).map do |entry|
                    entry[:service_port] || entry['service_port']
                end.compact.map(&:to_i)

                missing_ports = REQUIRED_TPROXY_PORTS - service_ports

                raise(
                    'OneKS cluster router dependency requires TPROXY ' \
                    "service_port entries #{REQUIRED_TPROXY_PORTS.join(', ')} " \
                    "in #{network_conf}. Missing: #{missing_ports.join(', ')}"
                ) unless missing_ports.empty?

                true
            rescue Errno::ENOENT
                raise(
                    'OneKS cluster router dependency requires ' \
                    "#{network_conf} to exist"
                )
            end

        end

    end

end
