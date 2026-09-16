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

    # Provider class
    class Provision < ODS::Document

        include ODS::StateMachine
        include ODS::Errorable
        include ODS::Jobable
        include ODS::Historyable

        attr_reader :client, :body, :tag

        DOCUMENT_TYPE = 104
        COMP          = 'PRV'
        RESOURCE_NAME = 'Provision'
        TEMPLATE_TAG  = 'PROVISION_BODY'
        BASE_DIR      = SERVER_CONF[:work_dir]

        DOCUMENT_ATTRS = [
            :name,
            :description,
            :deployment_file,
            :onedeploy_tags,
            :fireedge,
            :user_inputs,
            :user_inputs_values,
            :provider_id,
            :state,
            :tags,
            :tfstate,
            :one_objects,
            :registration_time
        ]

        # Attributes update properties
        UPDATE_ATTRS = [
            :name,
            :description
        ]

        ATTRIBUTE_CLASSES = {
            :user_inputs_values => Values
        }

        REMOVABLE_RESOURCES = ResourceManager::REMOVABLE_TYPES

        EVENTS = {
            :change_state        => 'State changed',
            :tf_resource_created => 'Resource provisioned',
            :tf_resource_deleted => 'Resource deprovisioned',
            :one_object_created  => 'OpenNebula object created',
            :one_object_deleted  => 'OpenNebula object deleted'
        }

        # State transitions
        state_machine(
            :initial => :PENDING,
            :transitions => {
                :PENDING               => [:INIT],
                :INIT                  => [:PLANNING, :INIT_FAILURE],
                :PLANNING              => [:APPLYING, :PLANNING_FAILURE],
                :APPLYING              => [:CONFIGURING_PROVISION, :APPLYING_FAILURE],
                :CONFIGURING_PROVISION => [:RUNNING, :CONFIGURING_PROVISION_FAILURE],
                :RUNNING               => [:SCALING, :DEPROVISIONING_ONE],
                :SCALING               => [:RUNNING, :SCALING_FAILURE, :INIT, :DEPROVISIONING_ONE],
                :DEPROVISIONING_ONE    => [:DEPROVISIONING, :DEPROVISIONING_ONE_FAILURE],
                :DEPROVISIONING        => [:DONE, :DEPROVISIONING_FAILURE, :RUNNING],
                :DONE                  => [:DONE_FAILURE],

                # Failure transitions
                :INIT_FAILURE                  => [:INIT],
                :PLANNING_FAILURE              => [:PLANNING],
                :APPLYING_FAILURE              => [:APPLYING],
                :CONFIGURING_PROVISION_FAILURE => [:CONFIGURING_PROVISION],
                :SCALING_FAILURE               => [:SCALING],
                :DEPROVISIONING_ONE_FAILURE    => [:DEPROVISIONING_ONE],
                :DEPROVISIONING_FAILURE        => [:DEPROVISIONING],
                :DONE_FAILURE                  => [:DONE],
                :ANY                           => [:DEPROVISIONING_ONE]
            }
        )

        RECOVER_STATES = {
            :INIT_FAILURE                  => :INIT,
            :PLANNING_FAILURE              => :PLANNING,
            :APPLYING_FAILURE              => :APPLYING,
            :CONFIGURING_PROVISION_FAILURE => :CONFIGURING_PROVISION,
            :SCALING_FAILURE               => :SCALING,
            :DEPROVISIONING_ONE_FAILURE    => :DEPROVISIONING_ONE,
            :DEPROVISIONING_FAILURE        => :DEPROVISIONING,
            :DONE_FAILURE                  => :DONE
        }

        # Initializes a provision document
        # @param client [OpenNebula::Client] OpenNebula client
        # @param id [Integer, nil] Existing document ID
        # @param xml [String, nil] Existing document XML
        def initialize(client, id: nil, xml: nil)
            super(
                client,
                :state_path => [:@body, :state],
                :id         => id,
                :xml        => xml
            )
        end

        # Changes the provision state
        # @param new_state [Symbol] Target lifecycle state
        def state=(new_state)
            prev_state = state

            super(new_state)
            return if prev_state == state

            clear_error unless RECOVER_STATES.key?(state)

            Log.info(
                COMP, "Provision #{id} changed state from #{prev_state} to #{state}", id
            )

            register_event(
                :change_state,
                :description => "State changed from #{prev_state} to #{state}"
            )
        end

        # Returns the validation schema used by provision documents
        def self.schema
            ProvisionSchema.new(:document_class => self)
        end

        # Returns the provision lifecycle manager
        def self.lcm
            OneForm::ProvisionLCM.instance
        end

        # Creates and allocates a provision from a driver and compatible provider
        # @param client [OpenNebula::Client] OpenNebula client
        # @param attributes [Hash] Driver, deployment, provider and input values
        # @return [Provision, OpenNebula::Error] Allocated provision or creation error
        def self.from_driver(client, attributes)
            driver_name     = attributes[:driver].downcase
            deployment_type = attributes[:deployment_type].downcase
            provider_id     = attributes[:provider_id].to_i

            driver = OneForm::Driver.from_name(driver_name)
            return driver if OpenNebula.is_error?(driver)

            return OpenNebula::Error.new(
                'Provision creation is not allowed from a disabled driver',
                OpenNebula::Error::ENOTDEFINED
            ) unless driver.enabled?

            driver.merge(attributes)
            body = driver.deployment_body(deployment_type)
            return body if OpenNebula.is_error?(body)

            provider = OneForm::Provider.new_from_id(client, provider_id)
            return provider if OpenNebula.is_error?(provider)

            driver_type = File.basename(driver.system_path)

            return OpenNebula::Error.new(
                "The specified provider '#{provider.driver}' is not compatible with " \
                "the '#{driver_type}' driver used for this provision.",
                OpenNebula::Error::ENOTDEFINED
            ) if provider.driver != driver_type

            provision = new(client)
            rc        = provision.allocate(provider, body)

            return rc if OpenNebula.is_error?(rc)

            provision
        end

        # Returns the provision working directory
        def dir
            File.join(BASE_DIR, "#{id}/")
        end

        # ------------------------------------------------------
        # Provision data
        # ------------------------------------------------------

        # Returns the desired state of the provision
        def values
            user_inputs_values
        end

        # Returns the current (real) state of the provision resources
        def resources
            @resources ||= ResourceManager.new(self)
        end

        # ------------------------------------------------------
        # Provision actions
        # ------------------------------------------------------

        # Loads the provision body and its typed attributes
        # @param raw [Boolean] Skip document attribute parsing
        def info(raw: false)
            rc = super(
                :skip_methods => [:state, :one_objects],
                :raw => raw
            )
            return rc if OpenNebula.is_error?(rc)

            @body[:user_inputs_values] = Values.json_create(@body[:user_inputs_values])
            @resources = nil

            rc
        end

        # Persists allowed changes and invalidates the cached resource manager
        # @param json [Hash, String] Attributes to update
        def update(json = {})
            rc = super
            return rc if OpenNebula.is_error?(rc)

            @resources = nil

            rc
        end

        # Allocates and registers a new provision document
        # @param provider [Provider] Provider owning the provision
        # @param provision_template [Hash] Provision document body
        def allocate(provider, provision_template)
            template = provision_template.to_hash

            template[:state]             = self.class.initial_state.to_s
            template[:provider_id]       = provider.id
            template[:registration_time] = Time.now.to_i
            template[:tfstate]           = ''
            rc = super(template)
            return rc if OpenNebula.is_error?(rc)

            # Update the provider info
            provider.add_provision_id(id)
            rc = provider.update

            return rc if OpenNebula.is_error?(rc)

            Log.info(COMP, "Provision #{template[:name]} allocated", id)
            Log.debug(COMP, "Using #{provider.name} provider", id)
        end

        # Detaches the provision from its provider and deletes the document
        def delete
            # Try to remove the provision id from the provider
            Log.info(COMP, "Removing provider #{provider_id} from provision", id)

            begin
                provider = Provider.new_from_id(@client, provider_id)
                return provider if OpenNebula.is_error?(provider)

                provider.remove_provision_id(id)
                rc = provider.update
                return rc if OpenNebula.is_error?(rc)
            rescue StandardError => _e
                return OpenNebula::Error.new(
                    "Error removing provision ID from provider #{provider_id}"
                )
            end

            rc = super()
            return rc if OpenNebula.is_error?(rc)

            Log.info(COMP, "Provision #{id} deleted from database", id)
        end

        #------------------------------------------------------
        # Lifecycle actions
        #------------------------------------------------------

        # Starts the provision lifecycle
        # @param actor [String] Username requesting the operation
        def provision(actor:)
            result = self.class.lcm.request(id, actor) do |provision|
                next OpenNebula::Error.new(
                    "Provision #{provision.id} cannot be provisioned in state " \
                    "#{provision.state_str}",
                    OpenNebula::Error::EACTION
                ) unless provision.state == :PENDING

                Log.info(COMP, 'Starting provision', provision.id)

                ODS::Job.request(:init)
            end

            return result if OpenNebula.is_error?(result)

            rc = info
            return rc if OpenNebula.is_error?(rc)

            result
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error provisioning: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Starts either a full or partial deprovision operation
        # @param force [Boolean] Skip lifecycle and unmanaged-resource protections
        # @param resources [Hash] OpenNebula resource IDs selected for removal, ALL if empty
        # @param actor [String] Username requesting the operation
        # @return [true, OpenNebula::Error] Whether deprovisioning was scheduled or an error
        def deprovision(actor:, force: false, resources: {})
            return self.class.lcm.delete_done(id, :actor => actor) if state == :DONE

            result = self.class.lcm.request(id, actor) do |provision|
                next OpenNebula::Error.new(
                    "Cannot deprovision provision in state #{provision.state_str}",
                    OpenNebula::Error::EACTION
                ) unless force || provision.can_deprovision?

                invalid_keys = resources.keys - REMOVABLE_RESOURCES

                next OpenNebula::Error.new(
                    "Invalid resources types found: #{invalid_keys.join(', ')}; " \
                    "only #{REMOVABLE_RESOURCES.join(', ')} are allowed",
                    OpenNebula::Error::EACTION
                ) unless invalid_keys.empty?

                invalid_values = resources.reject {|_, ids| ids.is_a?(Array) }

                next OpenNebula::Error.new(
                    'Deprovision resource IDs must be arrays',
                    OpenNebula::Error::EACTION
                ) unless invalid_values.empty?

                unless force
                    unmanaged = provision.resources.unmanaged(resources)
                    next unmanaged if OpenNebula.is_error?(unmanaged)

                    unless unmanaged.empty?
                        next OpenNebula::Error.new(
                            {
                                'message' => 'Unmanaged resources found, ' \
                                             'use `force` option to delete them',
                                'context' => unmanaged
                            },
                            OpenNebula::Error::EACTION
                        )
                    end
                end

                Log.info(COMP, 'Starting provision deprovisioning', provision.id)

                opts = {
                    :force     => force,
                    :resources => resources
                }

                ODS::Job.request(
                    :deprovisioning_one,
                    :args    => opts,
                    :replace => RECOVER_STATES.key?(provision.state)
                )
            end

            return result if OpenNebula.is_error?(result)

            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error deprovisioning: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Recovers the active job associated with the failure state
        # @param force [Boolean] Force protections used by the failed operation
        # @param actor [String] Username requesting the operation
        def recover(actor:, force: false)
            self.class.lcm.request_recovery(id, actor) do |provision|
                recovery_state = RECOVER_STATES[provision.state]

                next OpenNebula::Error.new(
                    "Provision #{provision.id} cannot be recovered in state " \
                    "#{provision.state_str}",
                    OpenNebula::Error::EACTION
                ) unless recovery_state

                job = provision.active_job

                next OpenNebula::Error.new(
                    "Provision #{provision.id} has no action to recover",
                    OpenNebula::Error::EACTION
                ) unless job

                Log.info(
                    COMP,
                    "Recovering provision from state #{provision.state_str}",
                    provision.id
                )

                args         = job.args.dup
                args[:force] = true if force

                ODS::Job.recover(
                    :state   => recovery_state,
                    :args    => args
                )
            end
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error recovering: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Requests cancellation of the active lifecycle operation
        # @param actor [String] Username requesting the cancellation
        # @param oneadmin [Boolean] Whether the actor belongs to the oneadmin group
        # @return [Symbol, OpenNebula::Error] requested or an error
        def cancel(actor:, oneadmin: false)
            self.class.lcm.request_cancellation(id, actor, :oneadmin => oneadmin)
        end

        # Starts the creation of cloud or on-premises hosts
        # @param amount [Integer, nil] Number of cloud hosts to add
        # @param hosts [Array<String>, nil] On-premises host addresses to add
        # @param actor [String] Username requesting the operation
        def add_hosts(actor:, amount: nil, hosts: nil)
            self.class.lcm.request(id, actor) do |provision|
                next OpenNebula::Error.new(
                    "Cannot add hosts to provision #{provision.id} " \
                    "in state #{provision.state_str}",
                    OpenNebula::Error::EACTION
                ) unless [:RUNNING, :SCALING_FAILURE].include?(provision.state)

                next OpenNebula::Error.new(
                    'Only on-cloud provisions can add hosts by count',
                    OpenNebula::Error::EACTION
                ) if amount && provision.values.onprem?

                next OpenNebula::Error.new(
                    'Only on-premises provisions can add explicit hosts',
                    OpenNebula::Error::EACTION
                ) if !amount && !provision.values.onprem?

                Log.info(COMP, 'Starting provision host creation', provision.id)
                opts = {
                    :action       => :add_hosts,
                    :hosts        => hosts,
                    :target_hosts => amount ? provision.values.hosts + amount : nil
                }

                ODS::Job.request(
                    :scaling,
                    :args    => opts,
                    :replace => RECOVER_STATES.key?(provision.state)
                )
            end
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error adding hosts: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Starts deletion of hosts identified by their OpenNebula IDs
        # @param host_ids [Array<Integer>] OpenNebula IDs of the hosts to delete
        # @param actor [String] Username requesting the operation
        # @return [true, OpenNebula::Error] Whether host deletion was scheduled or an error
        def delete_hosts(host_ids, actor:)
            result = self.class.lcm.request(id, actor) do |provision|
                next OpenNebula::Error.new(
                    "Cannot delete hosts from provision #{provision.id} " \
                    "in state #{provision.state_str}",
                    OpenNebula::Error::EACTION
                ) unless [:RUNNING, :SCALING_FAILURE].include?(provision.state)

                hosts = host_ids.map {|host_id| provision.owned_host(host_id) }
                error = hosts.find {|host| OpenNebula.is_error?(host) }
                next error if error

                Log.info(
                    COMP,
                    "Starting deletion of hosts #{host_ids.join(', ')}",
                    provision.id
                )
                opts = {
                    :action => :delete_hosts,
                    :uuids  => hosts.map(&:uuid)
                }

                ODS::Job.request(
                    :scaling,
                    :args    => opts,
                    :replace => RECOVER_STATES.key?(provision.state)
                )
            end

            return result if OpenNebula.is_error?(result)

            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error deleting hosts: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Starts allocation of public IPs in the provision public network
        # @param amount [Integer] Number of public IPs to add
        # @param actor [String] Username requesting the operation
        def add_public_ips(amount:, actor:)
            self.class.lcm.request(id, actor) do |provision|
                next OpenNebula::Error.new(
                    "Cannot add public IPs to provision #{provision.id} " \
                    "in state #{provision.state_str}",
                    OpenNebula::Error::EACTION
                ) unless [:RUNNING, :SCALING_FAILURE].include?(provision.state)

                Log.info(COMP, "Starting allocation of #{amount} public IPs", provision.id)
                opts = {
                    :action            => :add_public_ips,
                    :target_public_ips => provision.values.public_ips + amount
                }

                ODS::Job.request(
                    :scaling,
                    :args    => opts,
                    :replace => RECOVER_STATES.key?(provision.state)
                )
            end
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error adding public IPs: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Starts deletion of one public IP address range
        # @param ar_id [Integer] OpenNebula address range ID
        # @param actor [String] Username requesting the operation
        # @return [true, OpenNebula::Error] Whether public IP deletion was scheduled or an error
        def delete_public_ip(ar_id, actor:)
            result = self.class.lcm.request(id, actor) do |provision|
                next OpenNebula::Error.new(
                    "Cannot delete public IPs from provision #{provision.id} " \
                    "in state #{provision.state_str}",
                    OpenNebula::Error::EACTION
                ) unless [:RUNNING, :SCALING_FAILURE].include?(provision.state)

                Log.info(COMP, "Starting deletion of public IP AR #{ar_id}", provision.id)
                opts = {
                    :action            => :delete_public_ip,
                    :ar_id             => ar_id,
                    :target_public_ips => [provision.values.public_ips - 1, 0].max
                }

                ODS::Job.request(
                    :scaling,
                    :args    => opts,
                    :replace => RECOVER_STATES.key?(provision.state)
                )
            end

            return result if OpenNebula.is_error?(result)

            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error deleting public IP: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Checks whether the provision accepts a deprovision operation
        def can_deprovision?
            [:RUNNING, :DEPROVISIONING_ONE_FAILURE, :SCALING_FAILURE].include?(state)
        end

        #------------------------------------------------------
        # Serialization
        #------------------------------------------------------

        # Builds the provision response with a safe active job summary
        # @param opts [Hash] ODS serialization options
        # @return [Hash] Provision representation
        def to_h(opts = {})
            opts     = {} unless opts.is_a?(Hash)
            document = super(opts)
            body     = document['DOCUMENT']['TEMPLATE'][TEMPLATE_TAG]

            body[:tags] = values.tags

            # Remove long attributes, they have a sepparated API endpoint
            body.delete(:tfstate)
            body.delete(:user_inputs)
            body[:provider].delete(:user_inputs) if body[:provider].is_a?(Hash)

            # Remove tags from values
            body[:user_inputs_values].delete(:oneform_tags) \
                if body[:user_inputs_values].is_a?(Hash) && !body[:tags].empty?

            document
        end

        # Decodes a serialized Terraform state into the provision body
        def decode_tfstate
            return unless tfstate.is_a?(String) && !tfstate.empty?

            decoded_state   = Base64.decode64(tfstate)
            @body[:tfstate] = JSON.parse(decoded_state, :symbolize_names => true)
        end

        # Embeds an already-authorized provider body in the serialized response.
        #
        # The caller is responsible for redacting provider credentials before passing
        # the body, because provision ownership does not imply provider ownership.
        #
        # @param provider_body [Hash] Serialized and authorized provider body
        # @return [Hash] Embedded provider body
        def include_provider(provider_body)
            @body[:provider] = provider_body
            @body.delete(:provider_id)

            provider_body
        end

        protected

        def owned_host(host_id)
            host = Array(resources.hosts).find do |candidate|
                candidate.id && candidate.id.to_i == host_id.to_i
            end

            return OpenNebula::Error.new(
                "Host #{host_id} does not belong to provision #{id}",
                OpenNebula::Error::ENO_EXISTS
            ) unless host

            body = ODS::OneHelper::Host.body(client, host_id)
            return body if OpenNebula.is_error?(body)

            uuid = body.dig(:template, :oneform, :uuid)
            return host if uuid && uuid.to_s == host.uuid.to_s

            OpenNebula::Error.new(
                "Host #{host_id} does not belong to provision #{id}",
                OpenNebula::Error::ENO_EXISTS
            )
        end

    end

end
