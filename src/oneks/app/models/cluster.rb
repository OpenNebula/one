# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Ap@ache License, Version 2.0 (the "License"); you may    #
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

    # Cluster class
    class Cluster < ODS::Document

        include ODS::StateMachine

        attr_reader :client, :body, :tag

        COMP           = 'CLS'
        RESOURCE_NAME  = 'Kubernetes Cluster'
        TEMPLATE_TAG   = 'CLUSTER_BODY'
        DOCUMENT_TYPE  = 120
        DOCUMENT_ATTRS = [
            :name,
            :description,
            :state,
            :kubernetes_version,
            :deployment,
            :control_plane,
            :node_groups,
            :registration_time,
            :historic
        ]

        # Attributes that can be modified during an user update
        UPDATE_ATTRS = [
            :name,
            :description
        ]

        EVENTS = {
            :change_state     => 'State changed',
            :group_added      => 'Group added to cluster',
            :group_removed    => 'Group removed from cluster'
        }

        state_machine(
            :initial => :PENDING,
            :transitions => {
                :PENDING               => [:PROVISIONING],
                :PROVISIONING          => [:RUNNING, :PROVISIONING_FAILURE],
                :RUNNING               => [:DEPROVISIONING, :SCALING, :UPGRADING, :WARNING],
                :SCALING               => [:RUNNING, :SCALING_FAILURE],
                :UPGRADING             => [:RUNNING, :UPGRADING_FAILURE],
                :DEPROVISIONING        => [:DONE, :DEPROVISIONING_FAILURE],
                :DONE                  => [],

                # Failure transitions
                :PROVISIONING_FAILURE   => [:PROVISIONING],
                :SCALING_FAILURE        => [:SCALING, :RUNNING],
                :UPGRADING_FAILURE      => [:UPGRADING, :RUNNING],
                :DEPROVISIONING_FAILURE => [:DEPROVISIONING],
                :WARNING                => [:RUNNING],
                :ANY                    => [:DEPROVISIONING, :DONE]
            }
        )

        RECOVER_STATES = {
            :PROVISIONING_FAILURE   => :PROVISIONING,
            :SCALING_FAILURE        => :SCALING,
            :UPGRADING_FAILURE      => :UPGRADING,
            :DEPROVISIONING_FAILURE => :DEPROVISIONING,
            :WARNING                => :RUNNING
        }

        # Overrides the state setter from StateMachine to log state changes
        def state=(new_state)
            prev_state = state

            super(new_state)
            return if prev_state == state

            Log.info(
                COMP, "Cluster #{id} changed state from #{prev_state} to #{state}", id
            )

            register_event(
                :name => EVENTS[:change_state],
                :desc => "State changed from #{prev_state} to #{state}"
            )

            update
        end

        # Calculates cluster state based on its groups
        def reconciled_state
            grps = groups.map {|grp| K8sGroup.new_from_id(client, grp[:id]) }

            return :DONE    if groups.empty?
            return :WARNING if K8sGroup.any_failure?(grps)
            return :RUNNING if K8sGroup.all_running?(grps)

            state
        end

        def group_failure_state
            return :WARNING if running? || warning?

            {
                :PROVISIONING   => :PROVISIONING_FAILURE,
                :SCALING        => :SCALING_FAILURE,
                :UPGRADING      => :UPGRADING_FAILURE,
                :DEPROVISIONING => :DEPROVISIONING_FAILURE
            }[state.to_sym]
        rescue NoMethodError
            nil
        end

        #------------------------------------------------------
        # Object, template & schema methods
        #------------------------------------------------------

        def initialize(client, id: nil, xml: nil)
            super(client, :state_path => [:@body, :state], :id => id, :xml => xml)
        end

        def self.create(client, body)
            cp_spec   = ControlPlane.build_spec(body[:spec])
            cp_family = ControlPlane.family_by_name(cp_spec[:family])

            return OpenNebula::Error.new(
                "Control plane family #{cp_spec[:family]} not found",
                OpenNebula::Error::ENO_EXISTS
            ) if cp_family.nil?

            return OpenNebula::Error.new(
                "Kubernetes version #{body[:kubernetes_version]} not valid. " \
                "Valid versions: #{cp_family[:supported_k8s_versions].join(', ')}",
                ODS::ResponseHelper::VALIDATION_EC
            ) unless cp_family[:supported_k8s_versions].include?(body[:kubernetes_version])

            rc = ControlPlane.validate_spec(cp_spec)
            return rc if OpenNebula.is_error?(rc)

            rc = OneKS::ClusterDeployment.validate(client, body[:deployment], cp_family)
            return rc if OpenNebula.is_error?(rc)

            cluster = new(client)
            rc      = cluster.allocate(body, cp_spec)

            if OpenNebula.is_error?(rc)
                rollback = rollback_create(cluster)

                return OpenNebula::Error.new(
                    "Error creating cluster: #{rc.message}. Rollback failed: #{rollback.message}",
                    OpenNebula::Error::EACTION
                ) if OpenNebula.is_error?(rollback)

                return rc
            end

            cluster
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error creating cluster: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def uuid
            return unless control_plane

            if control_plane.respond_to?(:uuid)
                control_plane.uuid
            elsif control_plane.respond_to?(:[])
                control_plane[:uuid]
            end
        end

        def self.schema
            ClusterSchema.new
        end

        #------------------------------------------------------
        # Document operations
        #------------------------------------------------------

        # Allocate a new cluster document
        def allocate(body, spec)
            template = {
                :state             => 'PENDING',
                :control_plane     => {},
                :node_groups       => [],
                :historic          => [],
                :registration_time => Time.now.to_i
            }.merge(body)

            rc = super(template)
            return rc if OpenNebula.is_error?(rc)

            # Avoid duplicate name and description in cp
            cplane_spec = spec.dup
            cplane_spec.delete(:description)
            cplane_spec.delete(:name)

            cplane = K8sGroup.create(
                :type    => OneKS::ControlPlane,
                :cluster => self,
                :spec    => cplane_spec
            )

            return cplane if OpenNebula.is_error?(cplane)

            self.control_plane = K8sGroup.basic_attrs(cplane)
            update
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error allocating cluster: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def info(raw: false)
            # Skip dynamic definition for 'state'
            # since it's already defined
            super(:skip_methods => [:state], :raw => raw)
        end

        # Expand cluster references to include control plane and groups
        def expand_references!(plain: true)
            self.control_plane =
                if control_plane
                    cp = ControlPlane.new_from_id(@client, control_plane[:id])
                    plain ? cp&.plain_body : cp
                end

            self.node_groups =
                if node_groups
                    node_groups.map do |grp|
                        ng = NodeGroup.new_from_id(@client, grp[:id])
                        plain ? ng&.plain_body : ng
                    end
                end
        rescue StandardError => e
            Log.error(COMP, "Error expanding cluster elements: #{e.message}")
        end

        # Delete the cluster document
        def delete(force: false)
            groups = respond_to?(:node_groups) ? node_groups : []

            return OpenNebula::Error.new(
                'Cannot delete a Cluster with existing nodes',
                OpenNebula::Error::EACTION
            ) unless force || groups.empty?

            if force
                rc = delete_group_documents(:force => true)
                return rc if OpenNebula.is_error?(rc)
            end

            super()
        end

        # Change the owner and/or group of the cluster and its group documents
        def chown(uid, gid)
            rc = super(uid, gid)
            return rc if OpenNebula.is_error?(rc)

            each_group_document do |group|
                group_rc = group.chown(uid, gid)
                return group_rc if OpenNebula.is_error?(group_rc)
            end

            nil
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error changing cluster ownership: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Change the group of the cluster and its group documents
        def chgrp(gid)
            chown(-1, gid)
        end

        # Change the permissions of the cluster and its group documents
        def chmod_octet(octet)
            rc = super(octet)
            return rc if OpenNebula.is_error?(rc)

            each_group_document do |group|
                group_rc = group.chmod_octet(octet)
                return group_rc if OpenNebula.is_error?(group_rc)
            end

            nil
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error changing cluster permissions: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        #------------------------------------------------------
        # Cluster actions
        #------------------------------------------------------

        # Provision a cluster, which implies the CP provisioning
        def provision(actor:)
            Log.info(COMP, 'Starting cluster provisioning', id)

            rc = OneKS::ClusterLCM.instance.em.trigger_action(
                :name => :cluster_provision_action,
                :args => [id, actor]
            )
            return rc if OpenNebula.is_error?(rc)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error provisioning cluster: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        # Upgrade K8s spec of the entire cluster
        def upgrade(targert_version, actor:)
            return OpenNebula::Error.new(
                "Cluster is already in #{targert_version}", OpenNebula::Error::EACTION
            ) if targert_version == kubernetes_version

            self.kubernetes_version = targert_version

            # Update body with new k8s version before upgrading groups
            update

            groups.each {|group| upgrade_group(group[:id], :actor => actor) }
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error upgrading cluster: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Try to recover the groups of the cluster (if any is in warning or failure)
        def recover(actor:)
            unless warning? || failed?
                return OpenNebula::Error.new(
                    "Cluster #{id} is not in a recoverable state: #{state}",
                    OpenNebula::Error::EACTION
                )
            end

            recoverable = groups.any? do |group_ref|
                group = K8sGroup.new_from_id(@client, group_ref[:id])
                next false if OpenNebula.is_error?(group)

                K8sGroup.recovery_for(group.state)
            end

            unless recoverable
                return OpenNebula::Error.new(
                    "Cluster #{id} has no groups in a recoverable state",
                    OpenNebula::Error::EACTION
                )
            end

            Log.info(COMP, 'Starting cluster recovery', id)

            rc = OneKS::ClusterLCM.instance.em.trigger_action(
                :name => :cluster_recover_action,
                :args => [id, actor]
            )
            return rc if OpenNebula.is_error?(rc)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error recovering cluster: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Deprovision the cluster (delete flow)
        def deprovision(actor:, force: false)
            Log.info(COMP, 'Starting cluster deprovisioning', id)

            if force
                Log.warn(
                    COMP,
                    'Force deletion requested. The cluster will be removed from the ' \
                    'database without deprovisioning resources. Ensure all cluster ' \
                    'resources are manually cleaned up',
                    id
                )
                return delete(:force => true)
            end

            rc = OneKS::ClusterLCM.instance.em.trigger_action(
                :name => :cluster_deprovision_action,
                :args => [id, actor]
            )
            return rc if OpenNebula.is_error?(rc)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error deprovisioning cluster: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def register_event(name:, desc:)
            historic << {
                :action      => name,
                :description => desc,
                :time        => Time.now.to_i
            }
        end

        #------------------------------------------------------
        # Deployment configuration
        #------------------------------------------------------

        def deployment_cluster
            OneHelper::Cluster.body(@client, deployment_cluster_id)
        end

        def deployment_networks
            deployment[:networks].each_with_object({}) do |(role, network), acc|
                network_body = OneHelper::VirtualNetwork.body(@client, network[:id])
                return network_body if OpenNebula.is_error?(network_body)

                acc[role] = network_body.deep_merge(network)
            end
        end

        def public_network
            OneHelper::VirtualNetwork.get(@client, public_network_id)
        end

        def private_network
            OneHelper::VirtualNetwork.get(@client, private_network_id)
        end

        def deployment_cluster_id
            deployment.dig(:cluster, :id)
        end

        def public_network_id
            deployment.dig(:networks, :public, :id)
        end

        def private_network_id
            deployment.dig(:networks, :private, :id)
        end

        def sched_requirements
            "CLUSTER_ID = #{deployment_cluster_id}"
        end

        def deployment_info
            target_cluster = deployment_cluster
            return target_cluster if OpenNebula.is_error?(target_cluster)

            target_networks = deployment_networks
            return target_networks if OpenNebula.is_error?(target_networks)

            deployment.merge(
                :cluster  => target_cluster.deep_merge(deployment[:cluster]),
                :networks => target_networks,
                :sched_requirements => sched_requirements
            )
        end

        #------------------------------------------------------
        # NodeGroups accessors
        #------------------------------------------------------

        # Retrieve the leader VM of the cluster
        def leader
            return OpenNebula::Error.new(
                'Control plane group not found',
                OpenNebula::Error::EACTION
            ) unless control_plane

            cplane = ControlPlane.new_from_id(@client, control_plane[:id])

            return OpenNebula::Error.new(
                'No VMs found in control plane',
                OpenNebula::Error::EACTION
            ) if cplane.vms.nil? || cplane.vms.empty?

            cplane.vms.first
        end

        # Retrieve all VM groups (control plane + node groups)
        def groups
            [control_plane].compact + Array(node_groups)
        end

        def node_group(group_id)
            groups.find {|group| group[:id].to_i == group_id.to_i }
        end

        #------------------------------------------------------
        # NodeGroups actions
        #------------------------------------------------------

        # Creates a new group, scaling up the number of groups from
        # the cluster perspective
        def provision_group(spec, actor:)
            spec = OneKS::NodeGroup.build_spec(spec)

            rc = OneKS::NodeGroup.validate_spec(spec)
            return rc if OpenNebula.is_error?(rc)

            rc = can_add_group?
            return rc if OpenNebula.is_error?(rc)

            group = K8sGroup.create(
                :type    => OneKS::NodeGroup,
                :cluster => self,
                :spec    => spec
            )
            return group if OpenNebula.is_error?(group)

            rc = OneKS::ClusterLCM.instance.em.trigger_action(
                :name => :cluster_create_group_action,
                :args => [id, group.id, actor]
            )

            if OpenNebula.is_error?(rc)
                rollback = rollback_group_creation(group.id)

                return OpenNebula::Error.new(
                    "Error creating group: #{rc.message}. Rollback failed: #{rollback.message}",
                    OpenNebula::Error::EACTION
                ) if OpenNebula.is_error?(rollback)

                return rc
            end

            group
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error creating group: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Set a new VM target to the group
        def scale_group(group_id, target, actor:)
            node_group_action(group_id, :group_scale_action, target, :actor => actor)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error scaling group: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Update the group info
        def update_group(group_id, body)
            group = node_group_object(group_id)
            return group if OpenNebula.is_error?(group)

            rc = group.update(body)
            return rc if OpenNebula.is_error?(rc)

            rc = group.info(:raw => true)
            return rc if OpenNebula.is_error?(rc)

            group
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error updating group: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Upgrade the K8s group spec
        def upgrade_group(group_id, actor:)
            node_group_action(group_id, :group_upgrade_action, :actor => actor)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error upgrading group: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Try to recover a specific group
        def recover_group(group_id, actor:)
            group = groups.find {|grp| grp[:id].to_i == group_id.to_i }

            return OpenNebula::Error.new(
                "Group #{group_id} not found in Cluster #{id}",
                OpenNebula::Error::EACTION
            ) unless group

            group = K8sGroup.new_from_id(@client, group[:id])
            return group if OpenNebula.is_error?(group)

            unless K8sGroup.recovery_for(group.state)
                return OpenNebula::Error.new(
                    "Group #{group_id} is not in a recoverable state: #{group.state}",
                    OpenNebula::Error::EACTION
                )
            end

            rc = OneKS::ClusterLCM.instance.em.trigger_action(
                :name => :group_recover_action,
                :args => [group[:id], actor]
            )

            return rc if OpenNebula.is_error?(rc)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error recovering group: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Removes a group, scaling down the number of groups from
        # the cluster perspective
        def deprovision_group(group_id, actor:)
            return OpenNebula::Error.new(
                "Group (ID=#{group_id}) is the control plane of Cluster #{id} and " \
                'cannot be deleted  directly because it is managed by the Cluster',
                OpenNebula::Error::EACTION
            ) if control_plane && group_id.to_i == control_plane[:id].to_i

            group = node_group(group_id)

            return OpenNebula::Error.new(
                "Group (ID=#{group_id}) not found in Cluster #{id}",
                OpenNebula::Error::EACTION
            ) unless group

            rc = OneKS::ClusterLCM.instance.em.trigger_action(
                :name => :cluster_deprovision_group_action,
                :args => [id, group[:id], actor]
            )

            return rc if OpenNebula.is_error?(rc)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error deprovisioning group: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        #------------------------------------------------------
        # NodeGroups operations
        #------------------------------------------------------

        # Adds a VM group to the current cluster
        # @param group [K8sGroup] The Kubernetes Group to add
        # @return [nil, OpenNebula::Error]
        def add_group(group)
            rc = can_add_group?
            return rc if OpenNebula.is_error?(rc)

            Log.info(COMP, "Adding #{group.type} (ID=#{group.id}) to the cluster", id)
            node_groups << K8sGroup.basic_attrs(group)

            register_event(
                :name => EVENTS[:group_added],
                :desc => "#{group.type} (ID=#{group.id}) added"
            )
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error adding group to cluster: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def del_group(group_id)
            group = groups.find {|g| g[:id].to_i == group_id.to_i }

            return OpenNebula::Error.new(
                "Group (ID=#{group_id}) not found in Cluster #{id}",
                OpenNebula::Error::EACTION
            ) unless group

            if control_plane && control_plane[:id].to_i == group_id.to_i
                self.control_plane = nil
            else
                node_groups.reject! {|g| g[:id].to_i == group_id.to_i }
            end

            Log.info(COMP, "#{group[:type]} (ID=#{group[:id]}) removed", id)

            register_event(
                :name => EVENTS[:group_removed],
                :desc => "#{group[:type]} (ID=#{group[:id]}) removed"
            )

            group
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error deleting group: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def can_add_group?
            return OpenNebula::Error.new(
                "Cannot add a group while cluster is in '#{state}' state",
                OpenNebula::Error::EACTION
            ) unless [:PENDING, :RUNNING].include?(state)

            cplane = control_plane_object
            return cplane if OpenNebula.is_error?(cplane)

            return OpenNebula::Error.new(
                'Cannot add a group because the control plane' \
                ' is not in a running state', OpenNebula::Error::EACTION
            ) if cplane && (cplane.failed? || !cplane.running?)

            return OpenNebula::Error.new(
                'Cannot add a new group while the control plane is in an error state',
                OpenNebula::Error::EACTION
            ) if cplane && cplane.failed?
        end

        #------------------------------------------------------
        # Kubernetes information
        #------------------------------------------------------

        def kubeconfig
            cplane = control_plane_object
            return cplane if OpenNebula.is_error?(cplane)

            cplane.kubeconfig
        end

        #------------------------------------------------------
        # Serialization
        #------------------------------------------------------

        # Transform the document body to JSON
        def to_json(opts = {})
            document = to_hash.clone
            body     = @body.clone

            # Remove attributes (if exists)
            body.delete(:json_class)

            # Clean body
            body.delete(:user_inputs)

            document['DOCUMENT']['TEMPLATE'][TEMPLATE_TAG] = body
            document.to_json(opts)
        end

        private

        def node_group_action(group_id, action, *args, actor:)
            group = node_group(group_id)

            return OpenNebula::Error.new(
                "Group (ID=#{group_id}) not found in cluster #{id}",
                OpenNebula::Error::EACTION
            ) unless group

            rc = OneKS::ClusterLCM.instance.em.trigger_action(
                :name => action,
                :args => [group[:id], *args, actor]
            )

            return rc if OpenNebula.is_error?(rc)
        end

        def node_group_object(group_id)
            group = node_group(group_id)

            return OpenNebula::Error.new(
                "NodeGroup #{group_id} not found in Cluster #{id}",
                OpenNebula::Error::ENO_EXISTS
            ) unless group

            group = OneKS::NodeGroup.new_from_id(@client, group_id)
            return group if OpenNebula.is_error?(group)

            group
        end

        def control_plane_object
            return unless control_plane

            OneKS::ControlPlane.new_from_id(@client, control_plane[:id])
        end

        def each_group_document
            groups.each do |group_ref|
                group = K8sGroup.new_from_id(@client, group_ref[:id])
                return group if OpenNebula.is_error?(group)

                rc = yield(group)
                return rc if OpenNebula.is_error?(rc)
            end

            nil
        end

        def delete_group_documents(force: false)
            groups.each do |group_ref|
                group = K8sGroup.new_from_id(@client, group_ref[:id])

                # If fetching a referenced group returns an error during a forced
                # delete, assume it has already been removed.
                next if force && OpenNebula.is_error?(group)

                return group if OpenNebula.is_error?(group)

                rc = group.delete(:force => force)
                return rc if OpenNebula.is_error?(rc)
            end

            nil
        end

        def rollback_group_creation(group_id)
            group = OneKS::NodeGroup.new_from_id(@client, group_id)
            return group if OpenNebula.is_error?(group)

            rc = del_group(group_id)
            return rc if OpenNebula.is_error?(rc)

            rc = update
            return rc if OpenNebula.is_error?(rc)

            rc = group.delete
            return rc if OpenNebula.is_error?(rc)
        end

        def self.rollback_create(cluster)
            rc = cluster.delete(:force => true)
            return rc if OpenNebula.is_error?(rc)
        end

        #------------------------------------------------------
        # Historic
        #------------------------------------------------------

        def register_action(name, desc)
            historic << {
                'action' => name,
                'description' => desc,
                'time' => Time.now.to_i
            }
        end

    end

    # Kubernetes Cluster Schema
    class ClusterSchema < ODS::Schema

        params do
            required(:name).filled(:string)
            optional(:description).filled(:string)
            required(:state).filled(:string, :included_in? => Cluster.states.map(&:to_s))
            required(:kubernetes_version).filled(:string)
            required(:deployment).hash(ClusterDeployment::SCHEMA)
            required(:control_plane).value(:hash)
            required(:node_groups).value(:array)
            required(:historic).array(:hash)
            required(:registration_time).filled(:integer)
        end

        rule(:name) do
            next if ODS::RequestHelper.rfc1123_name?(value)

            key.failure(ODS::RequestHelper::RFC1123_ERROR)
        end

    end

end
