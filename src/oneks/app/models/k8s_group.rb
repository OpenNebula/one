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

    # Represents a group of VMs
    class K8sGroup < ODS::Document

        VM_DELETION_STATES = ['EPILOG', 'CLEANUP_DELETE']

        include ODS::StateMachine
        include ODS::Errorable
        include ODS::Jobable
        include ODS::Historyable

        attr_reader :client, :body, :tag

        @families = {}

        COMP           = 'GRP'
        DEFAULT_FAMILY = 'general'
        RESOURCE_NAME  = 'Kubernetes Group'
        TEMPLATE_TAG   = 'GROUP_BODY'
        DOCUMENT_TYPE  = 121
        DOCUMENT_ATTRS = [
            :uuid,
            :name,
            :description,
            :cluster_id,
            :family,
            :flavour,
            :type,
            :state,
            :vms,
            :dependencies,
            :user_inputs,
            :user_inputs_values,
            :historic,
            :registration_time
        ]

        # Attributes that can be modified during an user update
        UPDATE_ATTRS = [
            :name,
            :description
        ]

        ATTRIBUTE_CLASSES = {
            :dependencies => K8sDependency
        }

        EVENTS = {
            :change_state     => 'State changed',
            :vm_added         => 'VM added to the group',
            :vm_removed       => 'VM removed from the group',
            :vm_ready_changed => 'VM readiness changed'
        }

        state_machine(
            :initial => :PENDING,
            :transitions => {
                :PENDING        => [:BOOTSTRAPPING],
                :BOOTSTRAPPING  => [:PROVISIONING, :BOOTSTRAPPING_FAILURE],
                :PROVISIONING   => [:RUNNING, :PROVISIONING_FAILURE],
                :RUNNING        => [:SCALING, :DEPROVISIONING, :WARNING],
                :SCALING        => [:RUNNING, :SCALING_FAILURE],
                :DEPROVISIONING => [:DONE, :DEPROVISIONING_FAILURE],
                :DONE           => [],
                :ANY            => [:DEPROVISIONING, :DONE],
                :WARNING        => [:RUNNING, :SCALING, :DEPROVISIONING],
                :BOOTSTRAPPING_FAILURE => [:BOOTSTRAPPING],
                :PROVISIONING_FAILURE   => [:PROVISIONING],
                :SCALING_FAILURE        => [:SCALING],
                :DEPROVISIONING_FAILURE => [:DEPROVISIONING]
            }
        )

        RECOVER_STATES = {
            :BOOTSTRAPPING_FAILURE  => :BOOTSTRAPPING,
            :PROVISIONING_FAILURE   => :PROVISIONING,
            :SCALING_FAILURE        => :SCALING,
            :DEPROVISIONING_FAILURE => :DEPROVISIONING,
            :WARNING                => :RUNNING
        }

        # Overrides the state setter from StateMachine to log state changes
        def state=(new_state)
            prev_state = state

            super(new_state)
            return if prev_state == state

            Log.info(
                COMP,
                "#{type} (ID=#{id}) changed state from #{prev_state} to #{state}",
                cluster_id
            )

            register_event(
                :change_state,
                :description => "State changed from #{prev_state} to #{state}"
            )

            clear_error unless RECOVER_STATES.key?(state)
        end

        #------------------------------------------------------
        # Object, template & schema methods
        #------------------------------------------------------

        def initialize(client, id: nil, xml: nil)
            super(client, :state_path => [:@body, :state], :id => id, :xml => xml)
        end

        def self.schema
            K8sGroupSchema.new
        end

        #------------------------------------------------------
        # Document operations
        #------------------------------------------------------

        # Allocate a new k8sgroup document
        def allocate(cluster, spec)
            template = self.class.validate_spec(spec)
            return template if OpenNebula.is_error?(template)

            return OpenNebula::Error.new(
                "Cannot allocate a #{self.class::COMPONENT_NAME} without an associated cluster",
                OpenNebula::Error::EACTION
            ) unless cluster && cluster.id

            # Ensure group name and add cluster id to the template before allocation
            name     = K8sGroup.ensure_unique_name(template[:name], cluster.groups)
            template = template.merge(:name => name, :cluster_id => cluster.id)

            return OpenNebula::Error.new(
                'Invalid cluster_id: expected a non-negative cluster ID',
                OpenNebula::Error::EACTION
            ) unless template[:cluster_id].to_i >= 0

            super(template)
        end

        # Populate the document body
        def info(raw: false)
            # Skip dynamic definition for 'state'
            # since it's already defined
            rc = super(:skip_methods => [:state], :raw => raw)
            return rc if OpenNebula.is_error?(rc)

            normalize_legacy_vms!
        end

        # Delete the k8sgroup document
        def delete(force: false)
            return OpenNebula::Error.new(
                'Cannot delete a k8sGroup with existing VMs',
                OpenNebula::Error::EACTION
            ) unless force || vms.empty?

            # Store values before deletion to log the result after removal
            removed_id   = id
            removed_type = type
            from_cluster = cluster_id

            rc = super()
            return rc if OpenNebula.is_error?(rc)

            Log.info(
                COMP,
                "#{removed_type} (ID=#{removed_id}) was deleted successfully",
                from_cluster
            )
        end

        #------------------------------------------------------
        # Templates and inputs
        #------------------------------------------------------

        def base_name
            "#{SERVER_CONF[:base_name]}-#{family}".downcase
        end

        def base_class_name
            "#{SERVER_CONF[:base_name]}-#{type}-#{family}".downcase
        end

        # Generate a unique name for resources that must be distinct per group
        # (e.g. VM templates). The name includes the group ID and the provided
        # suffix to avoid collisions between groups
        def base_group_name(suffix)
            "#{base_name}-group-#{id}-#{suffix}".downcase
        end

        # Generate a shared name for resources that are common across groups
        # (e.g. images). The name does not include the group ID so it can be
        # reused by multiple groups
        def base_shared_name(suffix)
            "#{base_name}-#{suffix}"
        end

        def expected_size
            user_inputs_values[:count]
        end

        def expected_size=(value)
            user_inputs_values[:count] = value
        end

        #------------------------------------------------------
        # Group dependencies
        #------------------------------------------------------

        def add_dependency(dep)
            raise ArgumentError, 'Dependency must inherit from K8sDependency' \
            unless dep.is_a?(OneKS::K8sDependency)

            dependencies << dep
        end

        def del_dependency(dep_name)
            idx = dependencies.index {|d| d.name.to_s == dep_name.to_s }
            return unless idx

            dependencies.delete_at(idx)
        end

        #------------------------------------------------------
        # Group operations
        #------------------------------------------------------

        def vm_ids
            vms.map {|vm| vm[:id] }
        end

        def find_vm(vm_id)
            vms.find {|vm| vm[:id].to_i == vm_id.to_i }
        end

        def add_vm(vm_id)
            raise ArgumentError, 'vm_id cannot be nil' if vm_id.nil?
            raise ArgumentError, "VM #{vm_id} is already registered in this group" \
                if vm_registered?(vm_id)

            cluster = parent_cluster
            raise cluster.message if OpenNebula.is_error?(cluster)

            vms << {
                :id    => vm_id,
                :ready => !cluster.feature_enabled?(:monitor),
                :pods  => []
            }

            register_event(:vm_added, :description => "VM #{vm_id} added")

            vm_id
        end

        def del_vm(vm_id)
            idx = vms.index {|vm| vm[:id].to_i == vm_id.to_i }
            return false unless idx

            vms.delete_at(idx)

            register_event(:vm_removed, :description => "VM #{vm_id} removed")

            true
        end

        def vm_registered?(vm_id)
            !find_vm(vm_id).nil?
        end

        def update_vm_ready(vm_id, ready)
            vm = find_vm(vm_id)
            raise ArgumentError, "VM #{vm_id} is not registered in this group" unless vm

            return false if vm[:ready] == ready

            vm[:ready] = ready

            register_event(
                :vm_ready_changed,
                :description => "VM #{vm_id} K8s readiness changed to #{ready}"
            )

            true
        end

        def update_vm_pods(vm_id, pods)
            vm = find_vm(vm_id)
            raise ArgumentError, "VM #{vm_id} is not registered in this group" unless vm

            vm[:pods] = pods
        end

        # Returns all pods stored by the group enriched with their owning VM ID.
        def pods
            Array(vms).flat_map do |vm|
                Array(vm[:pods]).map do |pod|
                    pod.merge(:vm_id => vm[:id])
                end
            end
        end

        def empty?
            vms.empty?
        end

        def all_running?
            vm_ids.all? do |vm_id|
                vm = OpenNebula::VirtualMachine.new_with_id(vm_id, @client)
                rc = vm.info

                if OpenNebula.is_error?(rc)
                    Log.error(COMP, "Error retrieving VM #{vm_id}: #{rc.message}")
                    next false
                end

                vm.lcm_state_str == 'RUNNING'
            end
        end

        def all_nodes_ready?
            return expected_size.to_i.zero? if vms.empty?

            vms.all? {|vm| vm[:ready] }
        end

        # Prevent re-running provisioning when the group has already
        # reached its expected size. This avoids cases where CAPONE
        # has already created the nodes after the cluster entered
        # an error state
        def provisioned?
            expected_size == vms.size
        end

        def ready?
            provisioned? && all_running? && all_nodes_ready?
        end

        def parent_cluster
            OneKS::Cluster.new_from_id(@client, cluster_id, :raw => true)
        end

        #------------------------------------------------------
        # Group actions
        # Each K8sGroup subclass must implement these methods
        # if not implemented in the parent class
        #------------------------------------------------------

        # Bootstraps group dependencies
        # Stops and returns an OpenNebula::Error if any dependency fails.
        # @param cluster [Cluster] The cluster object
        def bootstrap_dependencies
            dependencies.reject(&:ready?).each do |dep|
                begin
                    rc = dep.create(self)
                    return rc if OpenNebula.is_error?(rc)
                rescue StandardError => e
                    return OpenNebula::Error.new(
                        "Bootstrap failed for dependency #{dep.class}: #{e.message}",
                        OpenNebula::Error::EACTION
                    )
                end
            end

            true
        end

        # Attempts to recover all registered dependencies for the group.
        # Destroys dependency resources and removes their persisted definitions
        # so the next bootstrap always recreates them from scratch.
        def recover_dependencies
            dependencies.dup.each do |dep|
                begin
                    dep.ready = false

                    rc = dep.recover(self)
                    return rc if OpenNebula.is_error?(rc)

                    del_dependency(dep.name)
                rescue StandardError => e
                    return OpenNebula::Error.new(
                        "Recovery failed for dependency #{dep.class}(#{dep.name}): #{e.message}",
                        OpenNebula::Error::EACTION
                    )
                end
            end

            # Delete any VMs associated with the group in case they were created by a dependency
            vm_ids.each do |vm_id|
                rc = OneHelper::VirtualMachine.delete(@client, vm_id, :force => true)
                return rc if OpenNebula.is_error?(rc) && rc.errno != OpenNebula::Error::ENO_EXISTS

                del_vm(vm_id)
            end

            rc = cleanup_dependencies
            return rc if OpenNebula.is_error?(rc)

            true
        end

        # Destroy all dependencies registered in the group.
        # @return [true, OpenNebula::Error] true if successful, or an error if any destroy fails
        def cleanup_dependencies
            dependencies.dup.each do |dep|
                begin
                    rc = dep.destroy(self)
                    return rc if OpenNebula.is_error?(rc)

                    del_dependency(dep.name)
                rescue StandardError => e
                    return OpenNebula::Error.new(
                        "Destroy failed for dependency #{dep.class}(#{dep.name}): #{e.message}",
                        OpenNebula::Error::EACTION
                    )
                end
            end

            # Delete associated templates
            rc = OneHelper::Template.delete_by_name(@client, base_group_name('node'))
            return rc if OpenNebula.is_error?(rc)

            true
        end

        # Render group resources (e.g templates or manifests)
        def render
            raise NotImplementedError
        end

        # Provision the group resources
        def provision
            raise NotImplementedError
        end

        # Remove all resources associated with the group
        def deprovision(force: false)
            raise NotImplementedError
        end

        # Scale the group to the desired target size
        def scale(target)
            raise NotImplementedError
        end

        #------------------------------------------------------
        # Serialization
        #------------------------------------------------------

        def plain_body
            body = super()
            body[:dependencies] = body[:dependencies].map(&:to_h)

            body.delete(:user_inputs)
            body.delete(:kubeconfig)
            body.delete(:historic)
            body.delete('historic')

            body
        end

        # Builds the public group representation
        def to_h(opts = {})
            document = super(opts)
            body     = document['DOCUMENT']['TEMPLATE'][TEMPLATE_TAG]

            body.delete(:json_class)
            body[:dependencies] = Array(body[:dependencies]).map do |dependency|
                value = dependency.respond_to?(:to_h) ? dependency.to_h : dependency
                value.delete(:json_class) if value.is_a?(Hash)
                value
            end

            body.delete(:user_inputs)
            body.delete(:kubeconfig)
            body.delete(:historic)
            body.delete(:active_job)

            document
        end

        # Transforms the public group representation to JSON
        def to_json(opts = {})
            to_h(opts).to_json
        end

        private

        # Converts the legacy VM ID list into the current persisted records
        def normalize_legacy_vms!
            return unless @body[:vms].is_a?(Array)
            return unless @body[:vms].all? {|vm| vm.is_a?(Integer) }

            @body[:vms] = @body[:vms].map do |vm_id|
                { :id => vm_id, :ready => true, :pods => [] }
            end
        end

        class << self

            #------------------------------------------------------
            # Factories, searches and utils
            # -----------------------------------------------------

            # Creates a new K8sGroup object of the specified type
            # @param type [Class] subclass of K8sGroup
            # @param cluster [Cluster] cluster object
            # @param spec [Hash] specification for the group
            # @param kwargs [Hash] additional constructor arguments
            # @return [K8sGroup, OpenNebula::Error, ODS::ValidationError]
            def create(type:, cluster:, spec:, **kwargs)
                raise(
                    ArgumentError,
                    "Invalid K8sGroup class '#{type}'. Must inherit from K8sGroup"
                ) unless type.is_a?(Class) && type <= K8sGroup

                group = type.new(cluster.client, **kwargs)
                return group if OpenNebula.is_error?(group)

                rc = group.allocate(cluster, spec)
                return rc if OpenNebula.is_error?(rc)

                group
            rescue ODS::ValidationError => e
                ODS::ValidationError.new(
                    {
                        'message' => e.message,
                        'context' => e.context
                    },
                    OpenNebula::Error::ENOTDEFINED
                )
            rescue OpenNebula::Error => e
                OpenNebula::Error.new(
                    "Error creating #{type.name}: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Build the template hash with all group info without allocating it
            # In case of validation errors, returns an OpenNebula::Error with the error message
            def validate_spec(spec)
                family_name = default_family(spec[:family]).to_s
                family      = family_by_name(family_name)
                raise(ArgumentError, "Family '#{family_name}' not found") unless family

                spec = spec.merge(:family => family_name)

                # Generate base kubernetes name + uuid
                component = const_defined?(:COMPONENT_NAME) ? self::COMPONENT_NAME : 'group'
                k8s_name  = "#{component}-#{spec[:family]}-#{spec[:flavour]}"
                            .downcase
                            .tr('_', '-')
                uuid      = "#{k8s_name}-#{SecureRandom.hex(6)}"

                # Set default name if missing
                spec[:name] ||= uuid

                # Build user_inputs and input values for the selected flavour
                ui, ui_values = FamilyHelper.build_inputs_for_flavour(
                    family, spec[:flavour], spec[:values]
                )

                template = {
                    :uuid               => uuid,
                    :name               => spec[:name],
                    :description        => spec[:description],
                    :family             => spec[:family].to_s,
                    :flavour            => spec[:flavour].to_s,
                    :type               => self::COMPONENT_NAME,
                    :cluster_id         => -1,
                    :state              => 'PENDING',
                    :vms                => [],
                    :dependencies       => [],
                    :user_inputs        => ui,
                    :user_inputs_values => ui_values,
                    :historic           => [],
                    :registration_time  => Time.now.to_i
                }.compact

                rc = validate(template)
                return rc if OpenNebula.is_error?(rc)

                template
            end

            # Builds a specification hash from input attributes
            # @param body [Hash] input attributes
            # @return [Hash] normalized specification hash
            def build_spec(body)
                body.slice(
                    :name,
                    :description,
                    :flavour
                ).merge(
                    :family => default_family(body[:family]),
                    :values => body[:user_inputs_values]
                )
            end

            def default_family(family)
                family.to_s.strip.empty? ? DEFAULT_FAMILY : family
            end

            # Returns a basic hash of a group main attributes
            # @param group [K8sGroup] the group object
            # @return [Hash] keys :id, :uuid, :type, :flavour, :family
            def basic_attrs(group)
                {
                    :id       => group.id,
                    :name     => group.name,
                    :uuid     => group.uuid,
                    :type     => group.type,
                    :flavour  => group.flavour,
                    :family   => group.family
                }
            end

            def recovery_for(state)
                RECOVER_STATES[state.to_sym]
            rescue NoMethodError
                nil
            end

            #------------------------------------------------------
            # Families management
            #------------------------------------------------------

            # Loads all family definitions and validates their dependencies
            # @return [true, OpenNebula::Error] true if successful,
            #   or error if any validation fails
            def validate_conf!
                rc = load_families
                return rc if OpenNebula.is_error?(rc)

                rc = ensure_requirements
                return rc if OpenNebula.is_error?(rc)

                true
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Failed to validate K8sGroup configuration: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

            # Loads family definitions from filesystem
            # @return [Hash<Symbol, Hash>, OpenNebula::Error] loaded families
            def load_families
                list = FamilyHelper.families(self::FAMILIES_DIR)
                return list if OpenNebula.is_error?(list)

                @families = list.each_with_object({}) do |family, acc|
                    acc[family[:family]] = family

                    Log.debug(
                        COMP,
                        "#{self::COMPONENT_NAME} family '#{family[:family]}' loaded " \
                        "with #{(family[:dependencies] || []).size} dependencies"
                    )
                end

                @families
            end

            # Returns all loaded families
            # @param except [Array<String, Symbol>, String, Symbol] top-level family keys to exclude
            # @return [Array<Hash>] family definitions
            def families(except: [])
                values = (@families || {}).values
                return values if except.empty?

                values.map {|family| family.reject {|k, _| except.include?(k) } }
            end

            # Retrieves a specific family by name
            # @param name [String] family name
            # @param except [Array<Symbol>] top-level family keys to exclude
            # @return [Hash, nil] family definition or nil if not found
            def family_by_name(name, except: [])
                family = (@families || {}).values.find {|f| f[:family] == name }
                return family if family.nil? || except.empty?

                family.reject {|k, _| except.include?(k) }
            end

            # Returns the templates of a given family
            # @param name [String] family name
            # @return [Array<Hash>] templates of the family, or empty array if none
            def family_templates(name)
                family_by_name(name)&.dig(:templates) || []
            end

            # Builds input definitions for a given family and flavour
            # @param family_name [String] family name
            # @param flavour_name [String] flavour name
            # @param exclude_defaults [Boolean] whether to exclude inputs with default values
            # @return [Hash, OpenNebula::Error] user inputs and options or error if not found
            def inputs_for(family_name, flavour_name, exclude_defaults: false)
                family = family_by_name(family_name)

                return OpenNebula::Error.new(
                    "Family #{family_name} not found",
                    OpenNebula::Error::ENO_EXISTS
                ) unless family

                ui, = FamilyHelper.build_inputs_for_flavour(family, flavour_name)
                flavour = family[:flavours]&.find {|f| f[:name] == flavour_name }

                return OpenNebula::Error.new(
                    "Flavour #{flavour_name} not found in family #{family_name}",
                    OpenNebula::Error::ENO_EXISTS
                ) unless flavour

                if exclude_defaults
                    ui = ui.select do |input|
                        !input.key?(:default) || input[:default].nil?
                    end
                end

                override = flavour.fetch(:override_defaults, true)

                {
                    :user_inputs => ui,
                    :options => {
                        :override_defaults => override
                    }
                }
            end

            # Generates a unique group name within the provided list of groups
            # @param name [String] base name
            # @param groups [Array<Hash>] existing groups to check against
            # @return [String] unique name
            def ensure_unique_name(name, groups)
                base = name
                idx  = 0

                loop do
                    candidate = idx.zero? ? base : "#{base}-#{idx}"
                    idx += 1

                    exists = groups.any? do |g|
                        g[:name] == candidate
                    end

                    break candidate unless exists
                end
            end

            #------------------------------------------------------
            # Queries
            #------------------------------------------------------

            def find_by_id(groups, id)
                groups.find {|g| g.id == id }
            end

            def find_by_uuid(groups, uuid)
                groups.find {|g| g.uuid == uuid }
            end

            def find_by_vm(groups, vm_id)
                groups.find {|group| group.vm_registered?(vm_id) }
            end

            def find_dep_by_name(group, dep_name)
                group.dependencies.find {|d| d.name.to_s == dep_name.to_s }
            end

            def all_running?(groups)
                groups.all? {|g| g.state == :RUNNING }
            end

            def any_failure?(groups)
                groups.any? {|g| g.failed? || g.warning? }
            end

            #------------------------------------------------------
            # Requirements and dependencies
            #------------------------------------------------------

            # Returns the dependency definitions for a group family
            # @param group [K8sGroup]
            # @return [Array<Hash>] dependency definitions
            def dependency_conf_for(group)
                group.class.family_by_name(group.family)&.dig(:dependencies) || []
            end

            # Ensures that all dependency classes defined for all families
            # satisfy their static requirements.
            # @return [true, OpenNebula::Error]
            def ensure_requirements
                errors = []

                @families.each_value do |family|
                    deps = family[:dependencies] || []
                    deps.each do |dep|
                        begin
                            klass = K8sDependency.object_class(dep[:type])
                            raise "Unknown #{dep[:type]} dependency" if klass.nil?

                            rc = klass.ensure_requirements(dep[:opts] || {})

                            if OpenNebula.is_error?(rc)
                                errors << "Family #{family[:family]} dependency #{dep[:type]} " \
                                          "failed for #{self::COMPONENT_NAME}: #{rc.message}"

                                Log.error(
                                    COMP,
                                    "Dependency '#{dep[:type]}' verification failed for " \
                                    "#{self::COMPONENT_NAME} #{family[:family]} family: " \
                                    "#{rc.message}"
                                )

                                next
                            end

                            Log.debug(
                                COMP,
                                "Dependency '#{dep[:type]}' verified successfully " \
                                "for #{self::COMPONENT_NAME} #{family[:family]} family"
                            )
                        rescue StandardError => e
                            errors << "Family #{family[:family]} dependency #{dep[:type]} " \
                                      "failed for #{self::COMPONENT_NAME}: #{e.message}"

                            Log.error(
                                COMP,
                                "Dependency '#{dep[:type]}' verification failed for " \
                                "#{self::COMPONENT_NAME} #{family[:family]} family: #{e.message}"
                            )
                        end
                    end
                end

                return true if errors.empty?

                OpenNebula::Error.new(
                    "Dependency requirement validation failed:\n  - #{errors.join("\n  - ")}",
                    OpenNebula::Error::EACTION
                )
            end

            # Instantiates the dependencies defined for the group family
            # and registers them in the group.
            # @param group [K8sGroup]
            # @return [true, OpenNebula::Error] true on success, or an error otherwise
            def build_dependencies(group)
                dependency_conf_for(group).each do |conf|
                    dep = K8sDependency.create(conf[:type], :opts => conf[:opts] || {})
                    return dep if OpenNebula.is_error?(dep)

                    # Avoid adding duplicate dependencies
                    next unless K8sGroup.find_dep_by_name(group, dep.name).nil?

                    rc = group.add_dependency(dep)
                    return rc if OpenNebula.is_error?(rc)
                end

                true
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Failed to build dependencies for #{self::COMPONENT_NAME} " \
                    "#{group.family} family: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

        end

    end

end
