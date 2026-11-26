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
                    'Checking connectivity'              => proc { check_internet_access },
                    'Checking OneGate access'            => proc { check_onegate_access },
                    'Checking OpenNebula XML-RPC access' => proc { check_network_access }
                }

                checks['Checking OneKS monitor access'] = proc { check_oneks_access } \
                    if Features::Monitor.configured?

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
                if @id
                    cleanup_rc = cleanup
                    if OpenNebula.is_error?(cleanup_rc)
                        errors << "Probe VM cleanup failed: #{cleanup_rc.message}"
                    end
                end

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

            return true if errors.empty?

            OpenNebula::Error.new(errors.join('; '), OpenNebula::Error::EACTION)
        end

        private

        #------------------------------------------------------
        # Probe VM lifecycle
        #------------------------------------------------------

        def create_probe_vm
            appliance = oneks_appliance
            return appliance if OpenNebula.is_error?(appliance)

            appliance = ClusterDeployment.appliance(@client, @deployment, appliance[:id])
            return appliance if OpenNebula.is_error?(appliance)

            return OpenNebula::Error.new(
                "Cannot find #{appliance[:name]} template (ID=#{appliance[:id]}) " \
                "for OpenNebula cluster #{@one_cluster}",
                OpenNebula::Error::EACTION
            ) if appliance.nil?

            extra_template = {
                :SCHED_REQUIREMENTS => OneHelper::Template.sched_requirements(
                    appliance[:template], @one_cluster.nil? ? nil : "CLUSTER_ID = #{@one_cluster}"
                ),
                :NIC => [
                    { :NETWORK_ID => @public_network },
                    { :NETWORK_ID => @private_network }
                ]
            }

            vm_id = appliance[:template].instantiate(
                "oneks-readiness-check-#{Time.now.to_i}",
                false,
                Hash.to_raw(extra_template.compact)
            )

            return OpenNebula::Error.new(
                vm_id.message, OpenNebula::Error::EACTION
            ) if OpenNebula.is_error?(vm_id)

            @id = vm_id

            true
        end

        def wait_probe_vm_running
            current = probe_vm_running_status
            return current if current

            rc = ODS::EventSubscriber.subscribe_for_state(
                [@id],
                :state     => 'ACTIVE',
                :lcm_state => 'RUNNING',
                :timeout   => TIMEOUT
            ) do |_key, _content, _xml|
                result = probe_vm_running_status
                return result if result
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

        def probe_vm_running_status
            vm = OpenNebula::VirtualMachine.new_with_id(@id, @client)
            rc = vm.info

            return OpenNebula::Error.new(
                "Cannot read OneKS probe VM (ID=#{@id}): #{rc.message}",
                OpenNebula::Error::EACTION
            ) if OpenNebula.is_error?(rc)
            return true if vm.state_str == 'ACTIVE' && vm.lcm_state_str == 'RUNNING'

            return OpenNebula::Error.new(
                "OneKS probe VM (ID=#{@id}) entered #{vm.state_str}/#{vm.lcm_state_str}",
                OpenNebula::Error::EACTION
            ) if ['DONE', 'FAILED'].include?(vm.state_str)

            nil
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
            output = probe_output(onegate_access_script, 'OneGate access failed')
            return output if OpenNebula.is_error?(output)

            response = JSON.parse(output)
            return true if response.is_a?(Hash) && response['VM'].is_a?(Hash) &&
                           response['VM']['ID'].to_s == @id.to_s

            OpenNebula::Error.new(
                'OneGate did not return information for the probe VM', OpenNebula::Error::EACTION
            )
        rescue JSON::ParserError
            OpenNebula::Error.new('OneGate returned invalid JSON', OpenNebula::Error::EACTION)
        end

        def check_oneks_access
            endpoint = SERVER_CONF[:monitor][:endpoint].to_s.sub(%r{/+\z}, '') + '/'

            status_format = '%{http_code}' # rubocop:disable Style/FormatStringToken
            script = probe_script(
                "http_request --output /dev/null --write-out '#{status_format}' " \
                "#{Shellwords.escape(endpoint)}"
            )

            output = probe_output(script, 'OneKS API access failed')
            return output if OpenNebula.is_error?(output)
            return true if ['200', '401', '403'].include?(output.strip)

            OpenNebula::Error.new(
                "OneKS API returned unexpected HTTP status #{output.strip}",
                OpenNebula::Error::EACTION
            )
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
            request = XMLRPC::Marshal.dump_call('one.system.version', '')
            script  = probe_script(
                "http_request --fail --header 'Content-Type: text/xml' " \
                "--data-binary #{Shellwords.escape(request)} " \
                "#{Shellwords.escape(SERVER_CONF[:one_xmlrpc_tproxy].to_s)}"
            )
            output = probe_output(script, 'OpenNebula XML-RPC access failed')
            return output if OpenNebula.is_error?(output)

            begin
                response = XMLRPC::Marshal.load_response(output)
            rescue StandardError
                return OpenNebula::Error.new(
                    'OpenNebula returned an invalid XML-RPC response', OpenNebula::Error::EACTION
                )
            end

            return true if response.is_a?(Array) && response[0] == true &&
                           response[1].is_a?(String) && response[1].match?(/\A\d+\.\d+/)
            return true if response.is_a?(Array) && response[0] == false &&
                           [OpenNebula::Error::EAUTHENTICATION,
                            OpenNebula::Error::EAUTHORIZATION].include?(response[2])

            OpenNebula::Error.new(
                'OpenNebula returned an unexpected XML-RPC response', OpenNebula::Error::EACTION
            )
        end

        def onegate_access_script
            probe_script(<<~SCRIPT)
                if [ -z "${ONEGATE_ENDPOINT:-}" ] || [ -z "${VMID:-}" ] ||
                    [ -z "${TOKENTXT:-}" ]; then
                    echo "OneGate endpoint, VM ID or token missing from the VM context" >&2
                    exit 1
                fi

                http_request --fail --header "X-ONEGATE-VMID: $VMID" \
                    --header "X-ONEGATE-TOKEN: $TOKENTXT" "${ONEGATE_ENDPOINT%/}/vm"
            SCRIPT
        end

        def internet_access_script
            uri = URI(EXTERNAL_URL)
            external_host = uri.host || uri.path

            <<~SCRIPT
                set -eu

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

                url=#{Shellwords.escape(EXTERNAL_URL)}

                if command -v curl >/dev/null 2>&1; then
                    curl -fsSL --connect-timeout 5 --max-time 15 \
                        -o /dev/null "$url" && exit 0
                elif command -v wget >/dev/null 2>&1; then
                    wget -q -T 15 -O /dev/null "$url" && exit 0
                else
                    echo "Neither curl nor wget is available for the Internet probe" >&2
                    exit 127
                fi

                echo "Internet probe is not reachable through $url" >&2
                exit 1
            SCRIPT
        end

        # Loads the VM context and runs a probe command using the VM routing table
        def probe_script(command)
            <<~SCRIPT
                set -eu
                #{context_loader}

                if ! command -v curl >/dev/null 2>&1; then
                    echo "curl is required for service checks" >&2
                    exit 127
                fi

                http_request() {
                    curl -sS --noproxy '*' \
                        --connect-timeout 5 --max-time 15 "$@"
                }

                #{command}
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
                    if [ -r "$context_file" ]; then
                        . "$context_file"
                    fi
                done
            SCRIPT
        end

        #------------------------------------------------------
        # Helpers
        #------------------------------------------------------

        def probe_output(script, failure)
            rc = OneHelper::VirtualMachine.exec(
                @client, @id, '/bin/sh -s',
                :stdin => Base64.strict_encode64(script), :timeout => TIMEOUT
            )
            return OpenNebula::Error.new(
                "#{failure}: #{rc.message}", OpenNebula::Error::EACTION
            ) if OpenNebula.is_error?(rc)

            rc[:stdout].to_s
        end

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
