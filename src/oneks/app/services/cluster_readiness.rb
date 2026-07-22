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

    # Cluster readiness probes for OneKS network configuration.
    class ClusterReadiness

        COMP   = 'RDY'
        EVENTS = ODS::ResponseHelper::EventStream

        READINESS_CONF = SERVER_CONF[:readiness]
        TIMEOUT        = READINESS_CONF && READINESS_CONF[:timeout]
        EXTERNAL_URL   = READINESS_CONF && READINESS_CONF[:external_url]

        def initialize(client, deployment, family = K8sGroup::DEFAULT_FAMILY, stream: nil)
            @client     = client
            @deployment = deployment
            @family     = (family || K8sGroup::DEFAULT_FAMILY).to_s
            @stream     = stream

            @one_cluster     = deployment.dig(:cluster, :id)
            @private_network = deployment.dig(:networks, :private, :id)
            @public_network  = deployment.dig(:networks, :public, :id)
        end

        def run
            errors = []

            begin
                progress('Starting OneKS readiness checks', EVENTS::SUCCESS)

                checks = {
                    'Creating probe VM'                  => proc { create_probe_vm },
                    'Waiting for probe VM RUNNING state' => proc { wait_probe_vm_running },
                    'Waiting for probe VM context'       => proc { wait_probe_vm_context },
                    'Checking OneGate access'            => proc { check_onegate_access },
                    'Checking Internet connectivity'     => proc { check_internet_access },
                    'Checking private network paths'     => proc { check_network_access }
                }

                checks.each do |name, action|
                    progress(name, EVENTS::STARTED)
                    rc = action.call

                    if OpenNebula.is_error?(rc)
                        progress(name, EVENTS::FAILURE, rc.message)
                        errors << rc.message

                        break
                    end

                    progress(name, EVENTS::SUCCESS)
                rescue StandardError => e
                    message = "#{e.class}: #{e.message}"
                    progress(name, EVENTS::FAILURE, message)
                    errors << message

                    break
                end
            rescue StandardError => e
                errors << "OneKS readiness check failed: #{e.message}"
            ensure
                cleanup if @id

                if errors.empty?
                    progress(
                        'All OneKS readiness checks passed',
                        EVENTS::SUCCESS,
                        :abort_on_close => false
                    )
                else
                    progress(
                        'One or more OneKS readiness checks failed',
                        EVENTS::FAILURE,
                        :abort_on_close => false
                    )
                end
            end
        end

        private

        #------------------------------------------------------
        # Probe VM lifecycle
        #------------------------------------------------------

        def create_probe_vm
            appliance = oneks_appliance
            return appliance if OpenNebula.is_error?(appliance)

            cluster = OneHelper::Cluster.get(@client, @one_cluster)
            return cluster if OpenNebula.is_error?(cluster)

            datastore = OneHelper::Datastore.resolve_image_ds(
                @client, cluster, @deployment.dig(:datastores, :image, :id)
            )
            return datastore if OpenNebula.is_error?(datastore)

            template = OneHelper::Template.find_by_marketplace_uuid(
                @client, appliance[:id], datastore.id
            )
            return template if OpenNebula.is_error?(template)

            return OpenNebula::Error.new(
                "Cannot find #{appliance[:name]} template (ID=#{appliance[:id]}) " \
                "in image datastore #{datastore.id} (#{datastore.name})",
                OpenNebula::Error::EACTION
            ) if template.nil?

            vm_id = template.instantiate(
                "oneks-readiness-check-#{Time.now.to_i}",
                false,
                Hash.to_raw(
                    {
                        :NIC => [
                            { :NETWORK_ID => @public_network },
                            { :NETWORK_ID => @private_network }
                        ],
                        :SCHED_REQUIREMENTS => "CLUSTER_ID = #{@one_cluster}"
                    }
                )
            )

            return OpenNebula::Error.new(
                vm_id.message, OpenNebula::Error::EACTION
            ) if OpenNebula.is_error?(vm_id)

            @id = vm_id

            true
        end

        def wait_probe_vm_running
            rc = ODS::EventSubscriber.subscribe_for_state(
                [@id], :state => 'ACTIVE', :lcm_state => 'RUNNING', :timeout => TIMEOUT
            ) do |_key, _content, _xml|
                return true
            end

            return rc if OpenNebula.is_error?(rc)

            OpenNebula::Error.new(
                "OneKS probe VM (ID=#{@id}) failed to reach RUNNING",
                OpenNebula::Error::EACTION
            )
        rescue StandardError => e
            OpenNebula::Error.new(
                "OneKS probe VM monitoring failed: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def wait_probe_vm_context
            timeout    = Time.now + TIMEOUT
            last_error = nil

            while Time.now < timeout
                rc = OneHelper::VirtualMachine.exec(
                    @client, @id, '/bin/sh -c true', :timeout => 10
                )
                return true unless OpenNebula.is_error?(rc)

                last_error = rc.message
                sleep(5)
            end

            OpenNebula::Error.new(
                "Failed to execute commands on OneKS probe VM (ID=#{@id}) " \
                "via VM exec: #{last_error}",
                OpenNebula::Error::EACTION
            )
        rescue StandardError => e
            OpenNebula::Error.new(
                "OneKS probe VM exec wait failed: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def cleanup
            progress(
                'Cleanup probe VM',
                EVENTS::STARTED,
                :abort_on_close => false
            )

            vm = OpenNebula::VirtualMachine.new_with_id(@id, @client)
            rc = vm.terminate(true)
            if OpenNebula.is_error?(rc)
                progress(
                    'Cleanup probe VM',
                    EVENTS::FAILURE,
                    rc.message,
                    :abort_on_close => false
                )
                return rc
            end

            progress(
                'Cleanup probe VM',
                EVENTS::SUCCESS,
                :abort_on_close => false
            )

            @id = nil
            true
        rescue StandardError => e
            progress(
                'Cleanup probe VM',
                EVENTS::FAILURE,
                e.message,
                :abort_on_close => false
            )

            OpenNebula::Error.new(
                "OneKS probe VM destroy failed: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        #------------------------------------------------------
        # Readiness checks
        #------------------------------------------------------

        def check_onegate_access
            rc = OneHelper::VirtualMachine.exec(
                @client,
                @id,
                '/bin/sh -s',
                :stdin   => Base64.strict_encode64(onegate_access_script),
                :timeout => TIMEOUT
            )

            return OpenNebula::Error.new(
                "OneKS cluster cannot reach OneGate endpoint: #{rc.message}",
                OpenNebula::Error::EACTION
            ) if OpenNebula.is_error?(rc)

            true
        end

        def check_internet_access
            rc = OneHelper::VirtualMachine.exec(
                @client,
                @id,
                '/bin/sh -s',
                :stdin   => Base64.strict_encode64(internet_access_script),
                :timeout => TIMEOUT
            )

            return OpenNebula::Error.new(
                'OneKS cluster does not have DNS or outbound Internet ' \
                "connectivity: #{rc.message}",
                OpenNebula::Error::EACTION
            ) if OpenNebula.is_error?(rc)

            true
        end

        def check_network_access
            targets = network_probe_targets

            return OpenNebula::Error.new(
                'OneKS cluster cannot reach the required private network ' \
                "path: #{targets.message}",
                OpenNebula::Error::EACTION
            ) if OpenNebula.is_error?(targets)

            rc = OneHelper::VirtualMachine.exec(
                @client,
                @id,
                '/bin/sh -s',
                :stdin   => Base64.strict_encode64(network_access_script(targets)),
                :timeout => TIMEOUT
            )

            return OpenNebula::Error.new(
                'OneKS cluster cannot reach the required private network ' \
                "path: #{rc.message}",
                OpenNebula::Error::EACTION
            ) if OpenNebula.is_error?(rc)

            true
        end

        def onegate_access_script
            <<~SCRIPT
                set -eu
                #{context_loader}
                #{http_probe_helpers}

                if [ -z "${ONEGATE_ENDPOINT:-}" ]; then
                    echo "ONEGATE_ENDPOINT not found in the cluster context" >&2
                    exit 1
                fi

                probe_url "$ONEGATE_ENDPOINT" "OneGate endpoint"
            SCRIPT
        end

        def internet_access_script
            uri = URI(EXTERNAL_URL)
            external_host = uri.host || uri.path

            <<~SCRIPT
                set -eu
                #{http_probe_helpers}

                if command -v getent >/dev/null 2>&1; then
                    getent hosts #{Shellwords.escape(external_host)}
                elif command -v nslookup >/dev/null 2>&1; then
                    nslookup #{Shellwords.escape(external_host)}
                elif command -v host >/dev/null 2>&1; then
                    host #{Shellwords.escape(external_host)}
                else
                    echo "No DNS lookup tool found in the cluster" >&2
                    exit 127
                fi

                probe_url_strict #{Shellwords.escape(EXTERNAL_URL)} "Internet probe"
            SCRIPT
        end

        def network_access_script(targets)
            probes = targets.map do |target|
                "probe_url #{Shellwords.escape(target[:url])} #{Shellwords.escape(target[:name])}"
            end.join("\n")

            <<~SCRIPT
                set -eu
                #{http_probe_helpers}

                #{probes}
            SCRIPT
        end

        def context_loader
            <<~SCRIPT
                for context_file in \
                    /var/run/one-context/one_env \
                    /var/lib/one-context/one_env \
                    /etc/one-context.d/one_env \
                    /mnt/context.sh \
                    /context.sh; do
                    [ -r "$context_file" ] && . "$context_file"
                done
            SCRIPT
        end

        def http_probe_helpers
            <<~SCRIPT
                probe_url() {
                    url="$1"
                    label="$2"

                    if command -v curl >/dev/null 2>&1; then
                        http_code="$(curl -sS --connect-timeout 5 --max-time 15 \
                            -o /dev/null -w '%%{http_code}' "$url")" || {
                            echo "$label network is not reachable through $url" >&2
                            return 1
                        }

                        [ "$http_code" != "000" ] || {
                            echo "$label did not return an HTTP response through $url" >&2
                            return 1
                        }

                        return 0
                    fi

                    if command -v nc >/dev/null 2>&1 ||
                        { command -v timeout >/dev/null 2>&1 &&
                            command -v bash >/dev/null 2>&1; }; then
                        probe_tcp_url "$url" "$label"
                        return $?
                    fi

                    if command -v wget >/dev/null 2>&1; then
                        wget -q -T 15 -O /dev/null "$url" && return 0
                    fi

                    echo "No HTTP or TCP probe tool is available to probe $label" >&2
                    return 127
                }

                probe_tcp_url() {
                    url="$1"
                    label="$2"
                    target="${url#*://}"
                    target="${target%%/*}"
                    host="${target%%:*}"
                    port="${target##*:}"

                    if [ "$host" = "$port" ]; then
                        case "$url" in
                            https://*) port=443 ;;
                            http://*)  port=80 ;;
                            *)
                                echo "$label URL does not include a port: $url" >&2
                                return 1
                                ;;
                        esac
                    fi

                    if command -v nc >/dev/null 2>&1; then
                        nc -z -w 5 "$host" "$port" && return 0
                        echo "$label TCP connection failed to $host:$port" >&2
                        return 1
                    fi

                    if command -v timeout >/dev/null 2>&1 &&
                        command -v bash >/dev/null 2>&1; then
                        timeout 5 bash -c ': > "/dev/tcp/$1/$2"' sh "$host" "$port" &&
                            return 0
                        echo "$label TCP connection failed to $host:$port" >&2
                        return 1
                    fi

                    return 1
                }

                probe_url_strict() {
                    url="$1"
                    label="$2"

                    if command -v curl >/dev/null 2>&1; then
                        curl -fsSL --connect-timeout 5 --max-time 15 \
                            -o /dev/null "$url" && return 0
                    elif command -v wget >/dev/null 2>&1; then
                        wget -q -T 15 -O /dev/null "$url" && return 0
                    else
                        echo "Neither curl nor wget is available to probe $label" >&2
                        return 127
                    fi

                    echo "$label is not reachable through $url" >&2
                    return 1
                }
            SCRIPT
        end

        def network_probe_targets
            targets = []
            xmlrpc_tproxy = SERVER_CONF[:one_xmlrpc_tproxy].to_s

            unless xmlrpc_tproxy.strip.empty?
                private_network = OneHelper::VirtualNetwork.name(
                    @client, @private_network
                )
                return private_network if OpenNebula.is_error?(private_network)

                targets << {
                    :name => "OpenNebula XML-RPC TPROXY for #{private_network}",
                    :url  => xmlrpc_tproxy
                }
            end

            return OpenNebula::Error.new(
                'No private network targets configured', OpenNebula::Error::EACTION
            ) if targets.empty?

            targets
        end

        #------------------------------------------------------
        # Helpers
        #------------------------------------------------------

        def oneks_appliance
            family = ControlPlane.family_by_name(@family)
            return family if OpenNebula.is_error?(family)

            return OpenNebula::Error.new(
                "Control plane family #{@family} not found",
                OpenNebula::Error::EACTION
            ) if family.nil?

            appliances = ClusterDeployment.appliances_for(family)
            return appliances if OpenNebula.is_error?(appliances)

            appliance   = appliances.find {|item| item[:type].to_s == 'seed_vm' }
            appliance ||= appliances.first

            return OpenNebula::Error.new(
                "Control plane family #{@family} does not " \
                'define a OneKS appliance dependency',
                OpenNebula::Error::EACTION
            ) if appliance.nil?

            appliance
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error resolving OneKS readiness appliance: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Logs events to the server log file. If a stream is available,
        # sends the event to the client, returns otherwise
        def progress(name, state, context = nil, **opts)
            message = "#{name} (#{state})"
            message << " VM=#{@id}"   if @id
            message << ": #{context}" if context

            if state.to_s == EVENTS::FAILURE
                Log.error(COMP, message)
            else
                Log.debug(COMP, message)
            end

            return unless @stream

            @stream.progress(name, state, context, **opts)
        end

        class << self

            def run(client, deployment, family = K8sGroup::DEFAULT_FAMILY, stream: nil)
                new(client, deployment, family, :stream => stream).run
            end

            def enabled?
                !READINESS_CONF.nil?
            end

        end

    end

end
