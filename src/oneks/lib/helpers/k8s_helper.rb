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

    # Helper methods for Kubernetes operations
    module K8s

        COMP = 'K8S'

        KUBECTL_PATH    = SERVER_CONF[:kubectl_path]
        KUBECONFIG_PATH = SERVER_CONF[:kubeconfig_path]
        K8S_TIMEOUT     = SERVER_CONF[:k8s_timeout]

        ACTIONS = {
            :apply      => 'Kubernetes apply',
            :upgrade    => 'Kubernetes upgrade',
            :delete     => 'Kubernetes delete',
            :scale      => 'Kubernetes scale',
            :kubeconfig => 'Kubeconfig retrieval'
        }

        class << self

            # Gather information from the K8s Cluster
            # @param group [K8sGroup] Kubernetes group to operate with
            # @param leader [Hash] Cluster spec to check values
            def gather_info(group, _spec = nil)
                Log.info(COMP, 'Gathering cluster info', group.cluster_id)

                endpoint = retrieve_endpoint(group)
                return endpoint if OpenNebula.is_error?(endpoint)

                if endpoint
                    Log.info(COMP, 'Cluster API endpoint retrieved successfully', group.cluster_id)
                    group.endpoint = endpoint
                end

                kconfig = retrieve_kubeconfig(group)
                return kconfig if OpenNebula.is_error?(kconfig)

                if kconfig
                    Log.info(COMP, 'Cluster kubeconfig retrieved successfully', group.cluster_id)
                    group.kubeconfig = kconfig
                end
            end

            # Apply Kubernetes spec to the VM
            # @param client [OpenNebula::Client] OpenNebula client
            # @param leader [Integer] VM ID of the cluster leader
            # @param spec [String] Kubernetes spec content
            # @return [true, OpenNebula::Error]
            def apply(client, leader, spec)
                return OpenNebula::Error.new(
                    "Invalid #{ACTIONS[:apply]} arguments", OpenNebula::Error::EACTION
                ) if leader.nil? || spec.nil? || spec.strip.empty?

                cmd = "#{KUBECTL_PATH} --kubeconfig #{KUBECONFIG_PATH} apply -f -"
                rc  = OneHelper::VirtualMachine.exec(
                    client, leader, cmd,
                    :stdin   => Base64.strict_encode64(spec),
                    :timeout => K8S_TIMEOUT
                )
                return rc if OpenNebula.is_error?(rc)

                true
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error running #{ACTIONS[:apply]} on VM #{leader}: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Upgrade a MachineDeployment from Kubernetes
            # @param client [OpenNebula::Client] OpenNebula client
            # @param leader [Integer] VM ID of the cluster leader
            # @param spec [String] Kubernetes spec content
            # @return [true, OpenNebula::Error]
            def upgrade(client, leader, spec)
                spec    = YAML.load_stream(spec)
                rke2_md = spec.find {|doc| doc['kind'] == 'MachineDeployment' }

                return OpenNebula::Error.new(
                    'MachineDeployment resource not found in rendered manifest',
                    OpenNebula::Error::EACTION
                ) unless rke2_md

                apply(client, leader, rke2_md.to_yaml)
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error running #{ACTIONS[:upgrade]} on VM #{leader}: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Delete Kubernetes resource from the VM
            # @param client [OpenNebula::Client] OpenNebula client
            # @param leader [Integer] VM ID of the cluster leader
            # @param group_uuid [String] Kubernetes group identifier to delete
            def delete(client, leader, group_uuid)
                return OpenNebula::Error.new(
                    "Invalid #{ACTIONS[:delete]} arguments", OpenNebula::Error::EACTION
                ) if leader.nil? || group_uuid.nil? || group_uuid.strip.empty?

                resource = "RKE2ConfigTemplate/#{group_uuid} " \
                           "MachineDeployment/#{group_uuid} " \
                           "ONEMachineTemplate/#{group_uuid} " \
                           "MachineHealthCheck/#{group_uuid}"

                cmd = "#{KUBECTL_PATH} --kubeconfig #{KUBECONFIG_PATH} delete #{resource}"
                rc  = OneHelper::VirtualMachine.exec(
                    client, leader, cmd,
                    :timeout => K8S_TIMEOUT
                )

                return rc if OpenNebula.is_error?(rc)

                true
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error running #{ACTIONS[:delete]} for group '#{group_uuid}': #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Scale Kubernetes node group on the VM
            # @param client [OpenNebula::Client] OpenNebula client
            # @param leader [Integer] VM ID of the cluster leader
            # @param group_uuid [String] Kubernetes node group identifier to scale
            # @param target [Integer] Number of replicas
            def scale(client, leader, group_uuid, target)
                return OpenNebula::Error.new(
                    "Invalid #{ACTIONS[:scale]} arguments", OpenNebula::Error::EACTION
                ) if leader.nil? || group_uuid.nil? || target.nil?

                cmd = "#{KUBECTL_PATH} --kubeconfig #{KUBECONFIG_PATH} " \
                      "scale machinedeployment #{group_uuid} --replicas=#{target}"
                rc  = OneHelper::VirtualMachine.exec(
                    client, leader, cmd,
                    :timeout => K8S_TIMEOUT
                )

                return rc if OpenNebula.is_error?(rc)

                true
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error running #{ACTIONS[:scale]} for group '#{group_uuid}': #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Retrieve kubeconfig from the VM
            # @param client [OpenNebula::Client] OpenNebula client
            # @param leader [Integer] VM ID of the cluster leader
            def kubeconfig(client, leader)
                return OpenNebula::Error.new(
                    "Invalid #{ACTIONS[:kubeconfig]} arguments", OpenNebula::Error::EACTION
                ) if leader.nil?

                cmd = "/usr/bin/base64 #{KUBECONFIG_PATH}"
                rc  = OneHelper::VirtualMachine.exec(
                    client, leader, cmd,
                    :timeout => K8S_TIMEOUT
                )
                return rc if OpenNebula.is_error?(rc)

                return OpenNebula::Error.new(
                    "Kubeconfig retrieval failed on VM #{leader}: empty output",
                    OpenNebula::Error::EACTION
                ) if rc[:stdout].empty?

                Base64.decode64(rc[:stdout])
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error running #{ACTIONS[:kubeconfig]} for VM #{leader}: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            def load_manifest(spec)
                manifest = YAML.load_stream(spec)

                return OpenNebula::Error.new(
                    'Manifest is empty', OpenNebula::Error::EACTION
                ) if manifest.empty?

                manifest
            rescue Psych::SyntaxError => e
                OpenNebula::Error.new("Invalid manifest: #{e.message}", OpenNebula::Error::EACTION)
            end

            def resource_by_kind(resources, kind)
                resources.find {|resource| resource['kind'] == kind }
            end

            def retrieve_kubeconfig(group)
                return OpenNebula::Error.new(
                    'Unable to extract kubeconfig: no VMs associated with the ControlPlane',
                    OpenNebula::Error::EACTION
                ) if group.vms.nil? || group.vms.empty?

                kubeconfig_string = K8s.kubeconfig(group.client, group.vms.first)
                return kubeconfig_string if OpenNebula.is_error?(kubeconfig_string)

                kubeconfig_hash = YAML.safe_load(kubeconfig_string, :aliases => true)

                return OpenNebula::Error.new(
                    "Group #{group.id} endpoint not available", OpenNebula::Error::EACTION
                ) unless group.endpoint

                kubeconfig_hash['clusters'].each do |cluster|
                    if cluster['cluster'] && cluster['cluster']['server']
                        cluster['cluster']['server'] = group.endpoint
                    end
                end

                kubeconfig_hash.to_yaml
            end

            def retrieve_endpoint(group)
                vrouter = K8sGroup.find_dep_by_name(group, 'ClusterRouter')
                return if vrouter.nil?

                endpoint = OneHelper::VRouter.public_endpoint(group.client, vrouter.id)
                return endpoint if OpenNebula.is_error?(endpoint)

                "https://#{endpoint}:6443"
            end

        end

    end

end
