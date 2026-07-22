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

    # SeedVM dependency for control planes
    class SeedVM < K8sDependency

        # Defines OpenNebula class for this depencenty
        ONE_TYPE = OpenNebula::VirtualMachine.class.name
        DEP_TYPE = :MANAGED
        COMP     = 'SVM'

        # Dependency constants
        SEED_TIMEOUT   = 600
        APPLIANCE_DS   = 1
        APPLIANCE_NAME = 'OneKS Appliance'
        READY_STATE    = 'RUNNING'
        VM_API_UPDATE  = 'EVENT API one.vm.update'

        def initialize(opts: {})
            super(
                :opts => {
                    :destroy_on_ready => true
                }.merge(opts)
            )

            @creation_timeout = @opts.fetch(:creation_timeout, SEED_TIMEOUT)
            @appliance_name   = @opts.fetch(:appliance_name, APPLIANCE_NAME)
            @appliance_ds     = @opts.fetch(:appliance_ds, APPLIANCE_DS)

            @appliance_id = @opts.fetch(:appliance_id) do
                raise ArgumentError, 'Missing required option: appliance_id'
            end

            raise ArgumentError, 'Invalid appliance_id: cannot be nil or empty' \
                if @appliance_id.nil? || @appliance_id.to_s.strip.empty?
        end

        def create(group)
            Log.info(COMP, 'Creating Seed VM for ControlPlane provisioning', group.cluster_id)

            cluster = group.parent_cluster
            return cluster if OpenNebula.is_error?(cluster)

            template = ClusterDeployment.appliance_template(
                group.client, cluster.deployment, @appliance_id
            )
            return template if OpenNebula.is_error?(template)

            return OpenNebula::Error.new(
                "Cannot find #{@appliance_name} template (ID=#{@appliance_id})",
                OpenNebula::Error::EACTION
            ) if template.nil?

            vm_name = "#{group.uuid}-seed"

            # Render the groups specification to include
            # it in the vm template
            spec = group.render
            return spec if OpenNebula.is_error?(spec)

            extra_template = {
                :SCHED_REQUIREMENTS        => cluster.sched_requirements,
                :ONEAPP_ONEKS_CLUSTER_NAME => cluster.uuid,
                :ONEAPP_ONEKS_CLUSTER_SPEC => Base64.strict_encode64(spec),
                :NIC => [{ :NETWORK_ID => cluster.public_network_id }]
            }

            seed_id = template.instantiate(vm_name, false, Hash.to_raw(extra_template))

            return OpenNebula::Error.new(
                seed_id.message, OpenNebula::Error::EACTION
            ) if OpenNebula.is_error?(seed_id)

            Log.info(COMP, "Seed VM (ID=#{seed_id}) deployed successfully", group.cluster_id)
            @id = seed_id

            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "VM seed creation failed: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Monitor seed VM creation
        # @param group [K8sGroup] Group owning the seed vm
        # @param stop_flag [ODS::ThreadManager::StopFlag] Shared cancellation flag
        def wait_create(group, stop_flag)
            wait_seed_state(group, READY_STATE, stop_flag)
        rescue StandardError => e
            OpenNebula::Error.new(
                "Monitoring of seed VM failed: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def destroy(group)
            return unless @id

            vm = OpenNebula::VirtualMachine.new_with_id(@id, group.client)
            rc = vm.terminate(true)
            return rc if OpenNebula.is_error?(rc)

            Log.info(COMP, "Seed VM (ID=#{@id}) destroyed successfully", group.cluster_id)

            @id = nil
            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "VM seed destroy failed: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        private

        # Waits until the ONEKS_STATE of a single VM reaches the target value
        # @param group [K8sGroup] Group owning the seed VM
        # @param target [String] Expected ONEKS_STATE value
        # @param stop_flag [ODS::ThreadManager::StopFlag] Shared cancellation flag
        # @return [Boolean, OpenNebula::Error]
        #   - true if the VM reached the target state
        #   - OpenNebula::Error if there was a failure, timeout, or cancellation
        def wait_seed_state(group, target, stop_flag)
            return OpenNebula::Error.new(
                'Seed VM ID cannot be nil', OpenNebula::Error::EACTION
            ) if @id.nil?

            current = seed_state(group.client)

            # Return success if already at target
            return true if current == target
            return current if OpenNebula.is_error?(current)

            # Immediately fail if current state contains 'FAILURE'
            return OpenNebula::Error.new(
                "Seed VM #{@id} entered failure state: #{current}",
                OpenNebula::Error::EACTION
            ) if current.to_s.include?('FAILURE')

            Log.info(
                COMP,
                "Waiting for Seed VM (ID=#{@id}) to provision the ControlPlane",
                group.cluster_id
            )

            ODS::EventSubscriber.subscribe_for(
                VM_API_UPDATE, :timeout => @creation_timeout, :stop_flag => stop_flag
            ) do |xml|
                event_vm_id = xml.at_xpath("//PARAMETER[POSITION='2' and TYPE='IN']/VALUE")&.text
                event_vm_id ||= xml.at_xpath("//PARAMETER[POSITION='2']/VALUE")&.text

                # Ignore other VMs
                next unless event_vm_id&.match?(/\A\d+\z/)
                next unless event_vm_id.to_i == @id

                current = seed_state(group.client)
                Log.info(COMP, "Seed VM entered state #{current}", group.cluster_id)

                if OpenNebula.is_error?(current)
                    return OpenNebula::Error.new(
                        "VM #{@id} ONEKS_STATE read failed: #{current.message}",
                        OpenNebula::Error::EACTION
                    )
                elsif current == target
                    return true
                elsif current.to_s.include?('FAILURE')
                    return OpenNebula::Error.new(
                        "Seed VM #{@id} entered failure state: #{current}",
                        OpenNebula::Error::EACTION
                    )
                end
            end
        end

        def seed_state(client)
            vm = OpenNebula::VirtualMachine.new_with_id(@id, client)
            rc = vm.info

            return rc if OpenNebula.is_error?(rc)

            vm['USER_TEMPLATE/ONEKS_STATE']
        end

        class << self

            def ensure_requirements(opts = {})
                client = OpenNebula::Client.new

                appliance_id   = opts[:appliance_id]
                datastore_id   = opts[:appliance_ds]   || APPLIANCE_DS
                appliance_name = opts[:appliance_name] || APPLIANCE_NAME

                Log.info(
                    COMP,
                    "Ensuring #{appliance_name} (ID=#{appliance_id}) in datastore #{datastore_id}"
                )

                image = OneHelper::Image.find_by_marketplace_uuid(
                    client, appliance_id, datastore_id
                )
                return image if OpenNebula.is_error?(image)

                if image
                    template = OneHelper::Template.find_by_image(client, image.id)
                    return template if OpenNebula.is_error?(template)

                    if template
                        Log.info(
                            COMP,
                            "#{appliance_name} (ID=#{appliance_id}) already exists " \
                            "in datastore #{datastore_id}"
                        )

                        return true
                    end
                end

                rc = OneHelper::Marketplace.import(
                    client, appliance_name, appliance_id, datastore_id
                )
                return rc if OpenNebula.is_error?(rc)

                true
            rescue StandardError => e
                OpenNebula::Error.new(
                    "OneKS appliance requirement failed: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

        end

    end

end
