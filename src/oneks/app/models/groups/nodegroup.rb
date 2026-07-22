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

    # Represents a node group within a cluster
    class NodeGroup < K8sGroup

        include ODS::StateMachine

        FAMILIES_DIR   = File.join(ONEKS_SPEC_DIR, 'nodegroups')
        COMPONENT_NAME = name.split('::').last

        #------------------------------------------------------
        # Group actions
        #------------------------------------------------------

        # Renders the nodegroup spec (chart definitions)
        # @return [Hash, OpenNebula::Error]
        def render
            cluster = parent_cluster
            return cluster if OpenNebula.is_error?(cluster)

            one_auth = ODS::AuthController.user_auth(@client)
            return one_auth if OpenNebula.is_error?(one_auth)

            deployment = cluster.deployment_info
            return deployment if OpenNebula.is_error?(deployment)

            cluster_values = cluster.plain_body.merge(
                {
                    :uuid       => cluster.uuid,
                    :deployment => deployment
                }
            )

            group_values = plain_body.merge(
                {
                    :group_image_name    => base_shared_name('node'),
                    :group_template_name => base_group_name('node')
                }
            )

            # Generate values for nodegroup spec template
            values = {
                :cluster  => cluster_values,
                :group    => group_values,
                :one_auth => one_auth
            }

            # Render group templates before rendering main spec
            templates_map = self.class.family_templates(family)

            values[:templates] = templates_map.each_with_object({}) do |(key, content), templates|
                rendered_template = ERB.new(content, :trim_mode => '-').result_with_hash(values)

                template = OneHelper::Template.find(@client, base_group_name('node'))
                return template if OpenNebula.is_error?(template)

                template ||= OneHelper::Template.create(@client, rendered_template)
                return template if OpenNebula.is_error?(template)

                templates[key] = template
            end

            # Binding values and return template
            ng_spec = FamilyHelper.spec_content(FAMILIES_DIR, family)
            ERB.new(ng_spec, :trim_mode => '-').result_with_hash(values)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error rendering #{type} template: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def provision
            return if provisioned?

            cluster = parent_cluster
            return cluster if OpenNebula.is_error?(cluster)

            spec = render
            return spec if OpenNebula.is_error?(spec)

            K8s.apply(cluster.client, cluster.leader, spec)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error provisioning #{type}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def deprovision(force: false)
            if force
                errors = []

                vms.each do |vm_id|
                    rc = OneHelper::VirtualMachine.delete(@client, vm_id, :force => true)
                    if OpenNebula.is_error?(rc)
                        errors << { :vm_id => vm_id, :error => rc.message }
                        next
                    end
                end

                return OpenNebula::Error.new(
                    "Error deprovisioning #{type}: failed to destroy VMs: #{errors}",
                    OpenNebula::Error::EACTION
                ) unless errors.empty?
            else
                cluster = parent_cluster
                return cluster if OpenNebula.is_error?(cluster)

                rc = K8s.delete(cluster.client, cluster.leader, uuid)
                return rc if OpenNebula.is_error?(rc)
            end
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error deprovisioning #{type}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def scale(target)
            cluster = parent_cluster
            return cluster if OpenNebula.is_error?(cluster)

            target             = [target, 0].max
            self.expected_size = target

            K8s.scale(cluster.client, cluster.leader, uuid, target)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error scaling #{type}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def upgrade
            cluster = parent_cluster
            return cluster if OpenNebula.is_error?(cluster)

            spec = render
            return spec if OpenNebula.is_error?(spec)

            K8s.upgrade(cluster.client, cluster.leader, spec)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error upgrading #{type}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

    end

end
