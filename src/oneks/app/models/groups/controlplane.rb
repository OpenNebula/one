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

    # Represents a control plane within a cluster
    class ControlPlane < K8sGroup

        include ODS::StateMachine

        DOCUMENT_ATTRS = K8sGroup::DOCUMENT_ATTRS + [:kubeconfig, :endpoint]
        FAMILIES_DIR   = File.join(ONEKS_SPEC_DIR, 'controlplanes')
        COMPONENT_NAME = name.split('::').last

        def self.validate_spec(spec)
            template = super(spec)
            return template if OpenNebula.is_error?(template)

            template.merge({ :kubeconfig => nil, :endpoint => nil })
        end

        #------------------------------------------------------
        # Group actions
        #------------------------------------------------------

        # Renders the control plane spec (chart definitions)
        # for the control plane
        # @return [Hash, OpenNebula::Error]
        def render
            cluster = parent_cluster
            return cluster if OpenNebula.is_error?(cluster)

            # OpenNebula environment values
            one_xmlrpc = SERVER_CONF[:one_xmlrpc_tproxy]
            one_auth   = ODS::AuthController.user_auth(@client)
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
                    :group_image_name     => base_shared_name('node'),
                    :group_template_name  => base_group_name('node'),
                    :router_image_name    => base_shared_name('router'),
                    :router_template_name => base_group_name('router')
                }
            )

            # Generate values for controlplane spec template
            values = {
                :cluster    => cluster_values,
                :group      => group_values,
                :one_auth   => one_auth,
                :one_xmlrpc => one_xmlrpc
            }

            # Render group templates before render main spec
            values[:templates] = self.class.family_templates(family).transform_values do |content|
                ERB.new(content, :trim_mode => '-').result_with_hash(values)
            end

            # Binding values and return template encoded
            cp_spec = FamilyHelper.spec_content(FAMILIES_DIR, family)
            ERB.new(cp_spec, :trim_mode => '-').result_with_hash(values)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error rendering Control Plane template: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def provision
            return if provisioned?

            spec = render
            return spec if OpenNebula.is_error?(spec)

            # Provisioning is handled by the Seed VM,
            # so cluster information is retrieved directly
            rc = K8s.gather_info(self, spec)
            return rc if OpenNebula.is_error?(rc)

            Log.info(COMP, 'Cluster information gathered successfully', id)

            # Update doc with new k8s values
            update
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error provisioning #{type}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def provisioned?
            super && !endpoint.nil? && !kubeconfig.nil?
        end

        def deprovision(*)
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
        end

        def scale(_target)
            return OpenNebula::Error.new(
                "#{type} does not support scaling operations",
                OpenNebula::Error::EACTION
            )
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error scaling #{type}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def upgrade
            spec = render
            return spec if OpenNebula.is_error?(spec)

            K8s.upgrade(@client, vms.first, spec)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error upgrading #{type}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def cleanup_dependencies
            rc = super()
            return rc if OpenNebula.is_error?(rc)

            # Delete also VR template
            OneHelper::Template.delete_by_name(@client, base_group_name('router'))
        end

    end

end
