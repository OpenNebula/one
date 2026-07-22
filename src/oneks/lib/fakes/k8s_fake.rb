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

    # Fake K8s Helper for testing
    module K8sFake

        COMP           = 'K8S'
        DUMMY_EXEC_CMD = '/bin/echo k8s-dummy '
        DEFAULT_DS     = 1

        ACTIONS = {
            :apply      => 'Kubernetes apply (dummy)',
            :upgrade    => 'Kubernetes upgrade (dummy)',
            :delete     => 'Kubernetes delete (dummy)',
            :scale      => 'Kubernetes scale (dummy)',
            :kubeconfig => 'Kubeconfig retrieval (dummy)'
        }

        # Ensures group state by manually creating all cluster resources
        def gather_info(group, spec = nil)
            if spec
                manifest = load_manifest(spec)
                return manifest if OpenNebula.is_error?(manifest)

                # Cluster info
                parent = group.parent_cluster

                # Images
                cluster = resource_by_kind(manifest, 'ONECluster')
                images  = cluster.dig('spec', 'images')
                rc      = create_images(group.client, images)
                return rc if OpenNebula.is_error?(rc)

                # Templates
                templates = cluster.dig('spec', 'templates')
                rc        = create_templates(group.client, templates)
                return rc if OpenNebula.is_error?(rc)

                Log.info(COMP, 'Cluster templates created', group.cluster_id)

                # Virtual Router dependency
                if K8sGroup.find_dep_by_name(group, 'ClusterRouter').nil?
                    vrouter = cluster.dig('spec', 'virtualRouter')
                    vr_dep  = create_vrouter_dep(
                        group.client, vrouter, parent.public_network_id, parent.private_network_id
                    )
                    return vr_dep if OpenNebula.is_error?(vr_dep)

                    Log.info(COMP, 'Cluster Router created', group.cluster_id)

                    rc = group.add_dependency(vr_dep)
                    return rc if OpenNebula.is_error?(rc)

                    Log.info(
                        COMP, 'Cluster Router added as controlplane dependency', group.cluster_id
                    )

                    # WARNING: This call assumes it is executed from a thread-safe context
                    group.update
                end

                # Control Plane
                rke2_cp       = resource_by_kind(manifest, 'RKE2ControlPlane')
                replicas      = rke2_cp.dig('spec', 'replicas')
                template      = resource_by_kind(manifest, 'ONEMachineTemplate')
                template_name = template.dig('spec', 'template', 'spec', 'templateName')

                rc = instantiate_group(group.client, replicas, template_name)
                return rc if OpenNebula.is_error?(rc)

                Log.info(COMP, 'Controlplane created', group.cluster_id)
            end

            # Gather info
            endpoint = retrieve_endpoint(group)
            return endpoint if OpenNebula.is_error?(endpoint)

            group.endpoint   = endpoint
            group.kubeconfig = dummy_kubeconfig

            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error gathering cluster info: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def apply(client, leader, spec)
            return OpenNebula::Error.new(
                "Invalid #{ACTIONS[:apply]} arguments", OpenNebula::Error::EACTION
            ) if leader.nil? || spec.nil? || spec.strip.empty?

            manifest = load_manifest(spec)
            return manifest if OpenNebula.is_error?(manifest)

            rke2_ng       = resource_by_kind(manifest, 'MachineDeployment')
            replicas      = rke2_ng.dig('spec', 'replicas')
            template      = resource_by_kind(manifest, 'ONEMachineTemplate')
            template_name = template.dig('spec', 'template', 'spec', 'templateName')

            rc = instantiate_group(client, replicas, template_name)
            return rc if OpenNebula.is_error?(rc)

            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error running #{ACTIONS[:apply]} on VM #{leader}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def upgrade(_client, leader, spec)
            return OpenNebula::Error.new(
                "Invalid #{ACTIONS[:upgrade]} arguments", OpenNebula::Error::EACTION
            ) if leader.nil? || spec.nil? || spec.strip.empty?

            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error running #{ACTIONS[:upgrade]} on VM #{leader}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def delete(client, leader, group_uuid)
            return OpenNebula::Error.new(
                "Invalid #{ACTIONS[:delete]} arguments", OpenNebula::Error::EACTION
            ) if leader.nil? || group_uuid.nil? || group_uuid.strip.empty?

            cluster = kscluster_from_vm(client, leader)
            return cluster if OpenNebula.is_error?(cluster)

            group = K8sGroup.find_by_uuid(cluster.groups, group_uuid)
            return OpenNebula::Error.new(
                "Group #{group_uuid} not found in Cluster #{cluster.id}",
                OpenNebula::Error::EACTION
            ) if group.nil? || group.empty?

            errors = []
            group.vms.each do |vm_id|
                rc = OneHelper::VirtualMachine.delete(client, vm_id, :force => true)
                if OpenNebula.is_error?(rc)
                    errors << { :vm_id => vm_id, :error => rc.message }
                    next
                end
            end

            return OpenNebula::Error.new(
                "Error running #{ACTIONS[:delete]} for group '#{group_uuid}': " \
                "failed to destroy VMs: #{errors}",
                OpenNebula::Error::EACTION
            ) unless errors.empty?

            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error running #{ACTIONS[:delete]} for group '#{group_uuid}': #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def scale(client, leader, group_uuid, target)
            return OpenNebula::Error.new(
                "Invalid #{ACTIONS[:scale]} arguments", OpenNebula::Error::EACTION
            ) if leader.nil? || group_uuid.nil? || target.nil?

            cluster = kscluster_from_vm(client, leader)
            return cluster if OpenNebula.is_error?(cluster)

            group = K8sGroup.find_by_uuid(cluster.groups, group_uuid)
            return OpenNebula::Error.new(
                "Group #{group_uuid} not found in Cluster #{cluster.id}",
                OpenNebula::Error::EACTION
            ) if group.nil? || group.empty?

            diff = target - group.vms.size

            if diff.positive?
                rc = instantiate_group(client, diff, group.base_group_name('node'))
                return rc if OpenNebula.is_error?(rc)
            elsif diff.negative?
                group.vms.first(diff.abs).each do |vm_id|
                    rc = OneHelper::VirtualMachine.delete(client, vm_id, :force => true)
                    return rc if OpenNebula.is_error?(rc)
                end
            end

            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error running #{ACTIONS[:scale]} for group '#{group_uuid}': #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def kubeconfig(_client, leader)
            return OpenNebula::Error.new(
                "Invalid #{ACTIONS[:kubeconfig]} arguments", OpenNebula::Error::EACTION
            ) if leader.nil?

            dummy_kubeconfig
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error running #{ACTIONS[:kubeconfig]} for VM #{leader}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        private

        def kscluster_from_vm(client, vm_id)
            vm = OpenNebula::VirtualMachine.new_with_id(vm_id, client)
            rc = vm.info
            return rc if OpenNebula.is_error?(rc)

            cluster_id = vm['USER_TEMPLATE/ONEKS/CLUSTER_ID']
            return cluster_id if OpenNebula.is_error?(cluster_id)

            cluster = OneKS::Cluster.new_from_id(client, cluster_id)
            return cluster if OpenNebula.is_error?(cluster)

            cluster.expand_references!(:plain => false)

            cluster
        end

        def create_images(client, images)
            images.each do |image|
                name    = image['imageName']
                content = image['imageContent']
                next if name.nil? || name.strip.empty?

                return OpenNebula::Error.new(
                    "Image '#{name}' does not include imageContent in manifest",
                    OpenNebula::Error::EACTION
                ) if content.nil? || content.strip.empty?

                image = OneHelper::Image.find(client, name)
                return image if OpenNebula.is_error?(image)
                next if image

                content = Hash.to_raw(content) if content.is_a?(Hash)
                rc      = OneHelper::Image.create(client, append_name(content, name), DEFAULT_DS)
                return rc if OpenNebula.is_error?(rc)
            end

            true
        end

        def append_name(content, name)
            template = content.to_s.strip

            return %(NAME = "#{name}") if template.empty?
            return template if template.match?(/^\s*NAME\s*=/m)

            "#{template}\nNAME = \"#{name}\""
        end

        def create_templates(client, templates)
            templates.each do |template|
                name    = template['templateName']
                content = template['templateContent']
                next if name.nil? || name.strip.empty?

                return OpenNebula::Error.new(
                    "Template '#{name}' does not include templateContent in manifest",
                    OpenNebula::Error::EACTION
                ) if content.nil? || content.strip.empty?

                content  = Hash.to_raw(content) if content.is_a?(Hash)
                template = OneHelper::Template.find(client, name)
                return template if OpenNebula.is_error?(template)
                next if template

                rc = OneHelper::Template.create(client, append_name(content, name))
                return rc if OpenNebula.is_error?(rc)
            end

            true
        end

        def create_vrouter_dep(client, vrouter, public_net, private_net)
            template_name = vrouter['templateName']
            public_name   = OneHelper::VirtualNetwork.name(client, public_net)
            return public_name if OpenNebula.is_error?(public_name)

            private_name = OneHelper::VirtualNetwork.name(client, private_net)
            return private_name if OpenNebula.is_error?(private_name)

            template = {
                'NAME' => vrouter['templateName'],
                'NIC'  => [
                    {
                        'NETWORK' => public_name,
                        'FLOATING_IP'   => 'YES',
                        'FLOATING_ONLY' => 'YES'
                    },
                    {
                        'NETWORK' => private_name,
                        'FLOATING_IP'   => 'YES',
                        'FLOATING_ONLY' => 'NO'
                    }
                ]
            }

            dep = K8sDependency.create(:cluster_router)
            return dep if OpenNebula.is_error?(dep)

            vrouter = OneHelper::VRouter.create(client, template)
            return vrouter if OpenNebula.is_error?(vrouter)

            vr_template = OneHelper::Template.find(client, template_name)
            return OpenNebula::Error.new(
                "Template '#{template_name}' not found", OpenNebula::Error::EACTION
            ) if vr_template.nil?

            return vr_template if OpenNebula.is_error?(vr_template)

            rc = vrouter.instantiate(1, vr_template.id, template_name, false, '')
            return rc if OpenNebula.is_error?(rc)

            dep.ready = true
            dep.id    = vrouter.id

            return dep
        end

        def instantiate_group(client, replicas, template_name)
            template = OneHelper::Template.find(client, template_name)

            return OpenNebula::Error.new(
                "Template '#{template_name}' not found",
                OpenNebula::Error::EACTION
            ) if template.nil?

            return template if OpenNebula.is_error?(template)

            content = template.to_hash['VMTEMPLATE']['TEMPLATE']
            content['HYPERVISOR'] = 'dummy'
            content['NAME']       = template_name.to_s

            raw_template = Hash.to_raw(content)

            replicas.times do
                rc = OneHelper::VirtualMachine.create(client, raw_template)
                return rc if OpenNebula.is_error?(rc)
            end

            true
        end

        def dummy_kubeconfig
            <<~KUBECONFIG
                apiVersion: v1
                kind: Config
                clusters:
                - name: dummy-cluster
                  cluster:
                    server: https://oneks-cluster:6443
                    insecure-skip-tls-verify: true
                users:
                - name: dummy-user
                  user:
                    token: dummy-token
                contexts:
                - name: dummy
                  context:
                    cluster: dummy-cluster
                    user: dummy-user
                current-context: dummy
            KUBECONFIG
        end

    end

end
