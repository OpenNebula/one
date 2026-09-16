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

module OneForm

    # Provision LifeCycle Manager
    class ProvisionLCM < ODS::JobWorkflow

        include Singleton

        workflow_id :provision

        step :init,
             :state        => :INIT,
             :dependencies => [:provider],
             :success      => ODS::Job.next(:planning),
             :failure      => :INIT_FAILURE,
             :on_cancel    => :cancelable

        step :planning,
             :state        => :PLANNING,
             :dependencies => [:provider],
             :success      => ODS::Job.next(:applying),
             :failure      => :PLANNING_FAILURE,
             :recover      => :init,
             :on_cancel    => :cancelable

        step :applying,
             :state        => :APPLYING,
             :dependencies => [:provider],
             :success      => ODS::Job.next(:reconcile_apply),
             :failure      => :APPLYING_FAILURE,
             :ensure       => :save_tfstate,
             :recover      => :init,
             :on_cancel    => :cancelable

        step :reconcile_apply,
             :success => ODS::Job.next(:configuring_provision),
             :failure => :APPLYING_FAILURE

        step :configuring_provision,
             :state        => :CONFIGURING_PROVISION,
             :dependencies => [:provider],
             :success      => ODS::Job.next(:running),
             :failure      => :CONFIGURING_PROVISION_FAILURE,
             :ensure       => :cleanup,
             :on_cancel    => :cancelable

        step :running,
             :success => {
                 :running        => ODS::Job.complete(:RUNNING),
                 :deprovisioning => ODS::Job.next(:deprovisioning_one, :args => { :force => true })
             }

        step :scaling,
             :state   => :SCALING,
             :success => {
                 :init           => ODS::Job.next(:init, :args => {}),
                 :deprovisioning => ODS::Job.next(:deprovisioning_one),
                 :running        => ODS::Job.complete(:RUNNING)
             },
             :failure => :SCALING_FAILURE

        step :deprovisioning_one,
             :state     => :DEPROVISIONING_ONE,
             :success   => ODS::Job.next(:init_deprovision),
             :failure   => :DEPROVISIONING_ONE_FAILURE,
             :on_cancel => :cancelable

        step :init_deprovision,
             :state        => :DEPROVISIONING,
             :dependencies => [:provider],
             :success      => ODS::Job.next(:deprovisioning),
             :failure      => :DEPROVISIONING_FAILURE,
             :on_cancel    => :cancelable

        step :deprovisioning,
             :state        => :DEPROVISIONING,
             :dependencies => [:provider],
             :success      => {
                 :running   => ODS::Job.next(:running),
                 :destroyed => ODS::Job.next(:refresh),
                 :done      => ODS::Job.next(:done)
             },
             :failure      => :DEPROVISIONING_FAILURE,
             :ensure       => :save_tfstate,
             :recover      => :init,
             :on_cancel    => :cancelable

        step :refresh,
             :success   => ODS::Job.next(:reconcile_destroy),
             :failure   => :DEPROVISIONING_FAILURE,
             :ensure    => :save_tfstate,
             :recover   => :init,
             :on_cancel => :cancelable

        step :reconcile_destroy,
             :success => {
                 :running => ODS::Job.next(:running),
                 :done    => ODS::Job.next(:done)
             },
             :failure => :DEPROVISIONING_FAILURE

        step :done,
             :state   => :DONE,
             :success => {
                 :deleted => ODS::Job.complete(:DONE, :owner_deleted => true)
             },
             :failure => :DONE_FAILURE

        FAILURE_STATES = {
            :INIT                  => :INIT_FAILURE,
            :PLANNING              => :PLANNING_FAILURE,
            :APPLYING              => :APPLYING_FAILURE,
            :CONFIGURING_PROVISION => :CONFIGURING_PROVISION_FAILURE,
            :SCALING               => :SCALING_FAILURE,
            :DEPROVISIONING_ONE    => :DEPROVISIONING_ONE_FAILURE,
            :DEPROVISIONING        => :DEPROVISIONING_FAILURE,
            :DONE                  => :DONE_FAILURE
        }

        stable_states :RUNNING, :DONE
        failure_states FAILURE_STATES

        # Prepares the Terraform workspace and builds its initialization command
        # @param provision [Provision] Provision owning the Terraform workspace
        # @param provider [Provider] Provider used to prepare the workspace
        # @param _opts [Hash] Additional job arguments
        def init(provision, provider:, **_opts)
            command = Terraform.init(provision, provider)
            raise command.message if OpenNebula.is_error?(command)

            ODS::Job.run(command)
        end

        # Builds the Terraform plan command for the provision
        # @param provision [Provision] Provision being planned
        # @param _opts [Hash] Additional job arguments
        def planning(provision, **_opts)
            command = Terraform.plan(provision)
            raise command.message if OpenNebula.is_error?(command)

            ODS::Job.run(command)
        end

        # Builds the Terraform apply command for the provision
        # @param provision [Provision] Provision being applied
        # @param _opts [Hash] Additional job arguments
        def applying(provision, **_opts)
            command = Terraform.apply(provision)
            raise command.message if OpenNebula.is_error?(command)

            ODS::Job.run(command)
        end

        # Reconciles Terraform hosts before creating the OpenNebula resources
        # @param provision [Provision] Provision receiving the reconciled hosts
        # @param _opts [Hash] Additional job arguments
        def reconcile_apply(provision, **_opts)
            rc = Terraform.reconcile(provision)
            raise rc.message if OpenNebula.is_error?(rc)

            rc = provision.update
            raise rc.message if OpenNebula.is_error?(rc)

            ODS::Job.success
        end

        # Creates the OpenNebula resources and builds the Ansible command
        # @param provision [Provision] Provision being configured
        # @param provider [Provider] Provider supplying the configuration
        # @param _opts [Hash] Additional job arguments
        def configuring_provision(provision, provider:, **_opts)
            rc = provision.resources.create
            raise rc.message if OpenNebula.is_error?(rc)

            # Return the command so the scheduler can execute and cancel Ansible
            command = Ansible.configure(provider, provision)
            raise command.message if OpenNebula.is_error?(command)

            ODS::Job.run(command)
        end

        # Cleans execution workspaces after configuration finishes
        # @param provision [Provision] Provision whose workspaces are cleaned
        # @param _opts [Hash] Additional job arguments
        def cleanup(provision, **_opts)
            errors = [Ansible.cleanup(provision), Terraform.cleanup(provision)]
                     .select {|result| OpenNebula.is_error?(result) }
            raise errors.map(&:message).join('; ') unless errors.empty?

            ODS::Job.success
        end

        # Activates provision hosts and completes or removes an empty provision
        # @param provision [Provision] Provision entering its stable state
        # @param _opts [Hash] Additional job arguments
        def running(provision, **_opts)
            rc = provision.resources.activate_hosts
            raise rc.message if OpenNebula.is_error?(rc)

            return ODS::Job.success(:running) unless provision.resources.hosts.empty?

            ODS::Job.success(:deprovisioning)
        end

        # Dispatches a scaling request to its specific implementation
        # @param provision [Provision] Provision being scaled
        # @param action [String, Symbol] Scaling action to execute
        # @param opts [Hash] Action-specific arguments
        def scaling(provision, action:, **opts)
            case action.to_sym
            when :add_hosts        then add_hosts(provision, **opts)
            when :delete_hosts     then delete_hosts(provision, **opts)
            when :add_public_ips   then add_public_ips(provision, **opts)
            when :delete_public_ip then delete_public_ip(provision, **opts)
            else
                raise "Unknown scaling action #{action}"
            end
        end

        # Adds on-premises hosts or updates the requested cloud host count
        # @param provision [Provision] Provision receiving the hosts
        # @param hosts [Array<String>, nil] On-premises host addresses
        # @param target_hosts [Integer, nil] Requested cloud host count
        # @param _opts [Hash] Additional job arguments
        def add_hosts(provision, hosts: nil, target_hosts: nil, **_opts)
            if hosts
                hosts.each {|host| provision.values.add_onprem_host(host) }
            else
                provision.values.hosts = target_hosts
            end

            rc = provision.update
            raise rc.message if OpenNebula.is_error?(rc)

            ODS::Job.success(:init)
        end

        # Resolves hosts and prepares their selective deprovisioning
        # @param provision [Provision] Provision owning the hosts
        # @param uuids [Array<String>] Terraform UUIDs of the hosts to remove
        # @param _opts [Hash] Additional job arguments
        def delete_hosts(provision, uuids:, **_opts)
            requested_uuids = uuids.map(&:to_s)

            hosts = provision.resources.hosts.select do |resource|
                requested_uuids.include?(resource.uuid.to_s)
            end

            missing_uuids = requested_uuids - hosts.map {|host| host.uuid.to_s }

            raise "Hosts with UUIDs #{missing_uuids.join(', ')} were not found" \
                unless missing_uuids.empty?

            opts = {
                :resources       => { :hosts => hosts.filter_map(&:id) },
                :terraform_uuids => hosts.map(&:uuid)
            }

            ODS::Job.success(:deprovisioning, :args => opts)
        end

        # Updates the requested public IP count and reconciles its address ranges
        # @param provision [Provision] Provision receiving public IPs
        # @param target_public_ips [Integer] Requested public IP count
        # @param _opts [Hash] Additional job arguments
        def add_public_ips(provision, target_public_ips:, **_opts)
            provision.values.public_ips = target_public_ips

            rc = provision.update
            raise rc.message if OpenNebula.is_error?(rc)

            rc = provision.resources.allocate_public_ips
            raise rc.message if OpenNebula.is_error?(rc)

            ODS::Job.success(:running)
        end

        # Removes a public IP address range and updates the requested count
        # @param provision [Provision] Provision owning the address range
        # @param ar_id [Integer, String] Address range identifier
        # @param target_public_ips [Integer] Remaining requested public IP count
        # @param _opts [Hash] Additional job arguments
        def delete_public_ip(provision, ar_id:, target_public_ips:, **_opts)
            rc = provision.resources.delete_public_ip(ar_id)
            raise rc.message if OpenNebula.is_error?(rc)

            provision.values.public_ips = target_public_ips

            rc = provision.update
            raise rc.message if OpenNebula.is_error?(rc)

            ODS::Job.success(:running)
        end

        # Deletes selected OpenNebula resources before destroying Terraform resources
        # @param provision [Provision] Provision being deprovisioned
        # @param resources [Hash] OpenNebula resource IDs grouped by type
        # @param force [Boolean] Skip the final unmanaged-resource protection
        # @param opts [Hash] Arguments forwarded to Terraform destruction
        def deprovisioning_one(provision, resources: {}, force: false, **opts)
            unless force
                unmanaged = provision.resources.unmanaged(resources)
                raise unmanaged.message if OpenNebula.is_error?(unmanaged)

                raise(
                    'Unmanaged resources found before deletion, ' \
                    "use force to delete them: #{unmanaged}"
                ) unless unmanaged.empty?

            end

            rc = provision.resources.delete(resources)
            raise rc.message if OpenNebula.is_error?(rc)

            ODS::Job.success(:args => opts)
        end

        # Prepares the Terraform workspace before deprovisioning resources
        # @param provision [Provision] Provision being deprovisioned
        # @param provider [Provider] Provider used to prepare the workspace
        # @param opts [Hash] Additional job arguments
        # @return [ODS::Job::Run] Terraform initialization runtime outcome
        def init_deprovision(provision, provider:, **_opts)
            command = Terraform.init(provision, provider)
            raise command.message if OpenNebula.is_error?(command)

            ODS::Job.run(command)
        end

        # Executes Terraform destruction for selected resources
        # @param provision [Provision] Provision being destroyed
        # @param terraform_uuids [Array<String>, nil] Terraform resources to destroy
        # @param _opts [Hash] Additional job arguments from older persisted contexts
        def deprovisioning(provision, terraform_uuids: nil, **_opts)
            cluster_allocated = provision.resources.cluster&.id
            resources =
                if terraform_uuids
                    Array(terraform_uuids).compact
                elsif cluster_allocated
                    provision.resources.hosts
                             .select {|host| host.id.nil? }
                             .map(&:uuid)
                else
                    []
                end

            if !cluster_allocated || !resources.empty?
                command = Terraform.destroy(provision, resources)

                raise command.message if OpenNebula.is_error?(command)

                return ODS::Job.run(
                    command,
                    :result => ODS::Job.success(:destroyed, :args => {})
                ) if command
            end

            ODS::Job.success(
                cluster_allocated ? :running : :done,
                :args => {}
            )
        end

        # Refreshes Terraform state and outputs after destruction
        # @param provision [Provision] Provision whose Terraform state is refreshed
        # @param _opts [Hash] Additional job arguments
        # @return [ODS::Job::Run] Terraform refresh runtime outcome
        def refresh(provision, **_opts)
            command = Terraform.refresh(provision)
            raise command.message if OpenNebula.is_error?(command)

            ODS::Job.run(command)
        end

        # Reconciles Terraform hosts and selects the next deprovisioning step
        # @param provision [Provision] Provision receiving the reconciled hosts
        # @param _opts [Hash] Additional job arguments
        def reconcile_destroy(provision, **_opts)
            rc = Terraform.reconcile(provision)
            raise rc.message if OpenNebula.is_error?(rc)

            rc = provision.update
            raise rc.message if OpenNebula.is_error?(rc)

            ODS::Job.success(provision.resources.cluster&.id ? :running : :done)
        end

        # Deletes the provision document and completes its lifecycle
        # @param provision [Provision] Provision to delete
        # @param _opts [Hash] Additional job arguments
        def done(provision, **_opts)
            FileUtils.rm_rf(provision.dir) if File.exist?(provision.dir)

            rc = provision.delete
            raise rc.message if OpenNebula.is_error?(rc)

            ODS::Job.success(:deleted)
        end

        # Deletes a completed provision without scheduling a job
        # @param provision_id [Integer] Provision document ID
        # @param actor [String] Username requesting the deletion
        # @return [true, OpenNebula::Error] Whether the provision was deleted
        def delete_done(provision_id, actor:)
            result = pool.get(provision_id, actor) do |provision|
                next OpenNebula::Error.new(
                    "Cannot delete provision in state #{provision.state_str}",
                    OpenNebula::Error::EACTION
                ) unless provision.state == :DONE

                done(provision)
            end

            return result if OpenNebula.is_error?(result)

            true
        end

        # Persists the latest Terraform state in the provision when available
        # @param provision [Provision] Provision whose state must be preserved
        # @param _opts [Hash] Additional job arguments
        # @return [ODS::Job::Success] Successful persistence outcome
        def save_tfstate(provision, **_opts)
            result = Terraform.save_state(provision)
            raise result.message if OpenNebula.is_error?(result)

            if result
                result = provision.update
                raise result.message if OpenNebula.is_error?(result)
            end

            ODS::Job.success
        end

    end

end
