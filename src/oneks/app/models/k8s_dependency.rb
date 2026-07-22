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

    # Base dependency handler for OneKS dependencies
    class K8sDependency

        attr_reader :name, :type, :opts
        attr_accessor :id, :ready

        # Objects supported by dependencies
        OBJECTS = {
            :seed_vm        => 'OneKS::SeedVM',
            :cluster_router => 'OneKS::ClusterRouter'
        }
        SOURCES = [
            :MANAGED,   # created/managed by oneks
            :EXTERNAL   # created externally but tracked by the server
        ]

        class << self

            # Factory method to create dependency objects
            #
            # @param object [String] dependency object type (seed_vm, cluster_router)
            # @param opts [Hash] dependency options
            # @return [K8sDependency]
            def create(object, opts: {})
                klass = object_class(object)

                return OpenNebula::Error.new(
                    "Unsupported dependency object #{object}",
                    OpenNebula::Error::EACTION
                ) unless klass

                klass.new(:opts => opts)
            end

            # Ensures all requirements are met before this dependency can be used.
            # Must be implemented by subclasses.
            def ensure_requirements(opts = {})
                raise NotImplementedError
            end

            # Notify to a group that the dependency is ready.
            # This method must always be called in a context where the group is accessed
            # in a thread-safe, blocking manner to prevent race conditions or unintended
            # overwrites of dependencies.
            #
            # @param group [K8sGroup] the group object
            # @param source [K8sDependency] dependency instance with runtime state
            # @return [true, OpenNebula::Error] true if updated, error if not found or invalid
            def notify_ready(group, source)
                dep = K8sGroup.find_dep_by_name(group, source.name)

                return OpenNebula::Error.new(
                    "Dependency #{source.name} not found in group #{group.id}",
                    OpenNebula::Error::EACTION
                ) if dep.nil?

                dep.id    = source.id
                dep.ready = true
            end

            # Check if all dependencies are ready
            def all_ready?(deps)
                deps.all? {|d| d.ready? }
            end

            def object_class(object)
                class_name = OBJECTS[object.to_sym]
                return unless class_name

                class_name.split('::').reduce(Object) {|mod, name| mod.const_get(name) }
            rescue NameError
                nil
            end

        end

        def initialize(opts: {})
            dep_name = self.class.name.split('::').last
            dep_type = self.class::DEP_TYPE

            raise ArgumentError, "Invalid dependency type #{dep_type}" \
                unless SOURCES.include?(dep_type)

            @name  = dep_name
            @type  = dep_type
            @id    = nil
            @ready = false
            @opts  = opts
        end

        def destroy_on_ready?
            @opts[:destroy_on_ready] || false
        end

        def ready?
            @ready
        end

        # Creates the dependency in OpenNebula.
        # Subclasses must implement this method to define the creation logic,
        # including setting the dependency's ID and updating its state.
        def create(group)
            raise NotImplementedError
        end

        # Wait until resource is ready
        # Subclasses must implement this method to define the callback logic
        # after creation, implementing the stop flag as well for error handling
        def wait_create(group, stop_flag)
            raise NotImplementedError
        end

        # Destroys the dependency.
        # Subclasses must implement this method to properly delete or clean up
        # the dependency from OpenNebula.
        def destroy(group)
            raise NotImplementedError
        end

        # Attempts to recover the dependency from a failed or warning state.
        # By default just retry to destroy
        # Subclasses can reimplement this method to provide specific recovery logic,
        # e.g., retrying creation, fixing configuration, or resetting state.
        def recover(group)
            # Destroy and cleanup the previous created resources
            if @id
                rc = destroy(group)
                raise rc if OpenNebula.is_error?(rc)
            end
        rescue StandardError => e
            OpenNebula::Error.new(
                "Recover failed during destroy #{@name} dependency: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        #------------------------------------------------------
        # Serialization
        #------------------------------------------------------

        def to_h
            {
                :name  => @name,
                :type  => @type,
                :id    => @id,
                :ready => @ready,
                :opts  => @opts
            }
        end

        def to_json(*args)
            to_h.merge(JSON.create_id => self.class.name).to_json(*args)
        end

        def self.json_create(hash)
            klass = self

            if self == K8sDependency && hash[:json_class]
                klass = hash[:json_class].split('::').reduce(Object) do |mod, name|
                    mod.const_get(name)
                end
            end

            obj = klass.new(:opts => hash[:opts])

            obj.instance_variable_set(:@id, hash[:id])       if hash.key?(:id)
            obj.instance_variable_set(:@ready, hash[:ready]) if hash.key?(:ready)

            obj
        rescue NameError => e
            raise ArgumentError, "Invalid dependency class in JSON payload: #{e.message}"
        end

    end

end
