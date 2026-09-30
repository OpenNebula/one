# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License");            #
#--------------------------------------------------------------------------- #

module OneKS

    # Represents the flat runtime state of an application installation in a
    # Cluster. Chart compilation belongs to ApplicationPlan.
    class Application

        attr_reader :id, :release_name, :target_namespace, :state, :parent,
                    :resource_version, :error_msg

        # Creates one runtime application entry.
        # @param attributes [Hash] Persisted runtime attributes
        def initialize(attributes)
            @id               = attributes.fetch(:id)
            @release_name     = attributes.fetch(:release_name)
            @target_namespace = attributes[:target_namespace]
            @state            = attributes.fetch(:state)
            @parent           = attributes[:parent]
            @resource_version = attributes[:resource_version]
            @error_msg        = attributes[:error_msg]
        end

        class << self

            # Builds the root and dependency entries persisted before an apply.
            # @param chart [Chart] Root catalogue application definition
            # @param release_name [String] Root Helm release name
            # @return [Array<Application>] Root application followed by its dependencies
            def entries(chart:, release_name:, target_namespace: nil)
                root = new(
                    :id               => chart.id,
                    :release_name     => release_name,
                    :target_namespace => target_namespace,
                    :state            => 'installing',
                    :resource_version => nil
                )

                dependencies = chart.ordered_dependencies.map do |dependency|
                    new(
                        :id               => dependency.id,
                        :release_name     => dependency.install_defaults.fetch('releaseName'),
                        :state            => 'installing',
                        :parent           => release_name,
                        :resource_version => nil
                    )
                end

                [root] + dependencies
            end

            # Returns one runtime entry identified by its Helm release name.
            # @param applications [Array<Application>] Persisted Cluster application entries
            # @param release_name [String] Helm release name to find
            # @return [Application, nil] Matching entry or nil when it does not exist
            def by_release(applications, release_name)
                Array(applications).find do |application|
                    application.release_name == release_name
                end
            end

            # Returns the root and direct dependencies of one root release.
            # @param applications [Array<Application>] Persisted Cluster application entries
            # @param release_name [String] Root Helm release name
            # @return [Array<Application>] Entries belonging to the root release
            def release_group(applications, release_name)
                Array(applications).select do |application|
                    application.release_name == release_name || application.parent == release_name
                end
            end

            # Finds a duplicate or already persisted release in an installation.
            # @param entries [Array<Application>] Runtime entries proposed for installation
            # @param applications [Array<Application>] Persisted Cluster application entries
            # @return [String, nil] Conflicting release name or nil when all are unique
            def conflicting_release(entries, applications)
                duplicate = entries.group_by(&:release_name).find {|_name, items| items.size > 1 }
                return duplicate.first if duplicate

                collision = entries.find do |entry|
                    by_release(applications, entry.release_name)
                end

                collision&.release_name
            end

            # Applies one monotonic event to a matching runtime entry.
            # @param applications [Array<Application>] Persisted Cluster application entries
            # @param state [String] State reported by the Kubernetes monitor
            # @param release_name [String] Release name reported by the monitor
            # @param resource_version [Integer] Monotonic event version
            # @param parent [String, nil] Optional parent release reported by the monitor
            # @param error_msg [String, nil] Error reported for an error state
            # @return [Symbol] Event processing result
            def apply_event(applications, **event)
                state            = event.fetch(:state)
                release_name     = event.fetch(:release_name)
                resource_version = event.fetch(:resource_version)
                parent           = event[:parent]
                error_msg        = event[:error_msg]
                application = by_release(applications, release_name)

                return :unknown_release unless application
                return :parent_mismatch if parent && application.parent.to_s != parent.to_s
                return :stale unless application.accepts_event?(resource_version)

                case state
                when 'done'
                    if application.parent
                        root_release = application.parent
                        applications.delete(application)

                        dependencies_left = applications.any? do |entry|
                            entry.parent == root_release
                        end

                        unless dependencies_left
                            root = by_release(applications, root_release)
                            applications.delete(root) if root
                        end

                        :removed
                    else
                        dependencies_left = applications.any? do |entry|
                            entry.parent == application.release_name
                        end

                        if dependencies_left
                            application.update_state!('deleting', resource_version)
                            :updated
                        else
                            applications.delete(application)
                            :removed
                        end
                    end
                when 'error'
                    application.fail!(error_msg, resource_version)
                    :updated
                else
                    application.update_state!(state, resource_version)
                    :updated
                end
            end

            # Checks whether installation can leave its ODS wait.
            # @param applications [Array<Application>] Persisted Cluster application entries
            # @param release_name [String] Root Helm release name
            # @return [Boolean] true when every entry is ready or one has failed
            def install_complete?(applications, release_name)
                entries = release_group(applications, release_name)
                root = by_release(entries, release_name)

                !failed_entry(entries).nil? || (!root.nil? && entries.all? do |entry|
                    entry.state == 'ready'
                end)
            end

            # Checks whether deletion can leave its ODS wait.
            # @param applications [Array<Application>] Persisted Cluster application entries
            # @param release_name [String] Root Helm release name
            # @return [Boolean] true when all entries are gone or one has failed
            def delete_complete?(applications, release_name)
                entries = release_group(applications, release_name)

                entries.empty? || !failed_entry(entries).nil?
            end

            # Returns the failed entry for one installation.
            # @param applications [Array<Application>] Persisted Cluster application entries
            # @param release_name [String] Root Helm release name
            # @return [Application, nil] Failed entry or nil when none have failed
            def failed_entry(applications, release_name = nil)
                entries = release_name ? release_group(applications, release_name) : applications

                Array(entries).find(&:failed?)
            end

            # Marks failed entries as deleting before retrying cleanup.
            # @param applications [Array<Application>] Persisted Cluster application entries
            # @param release_name [String] Root Helm release name
            # @return [Boolean] true when one or more entries changed
            def mark_deleting(applications, release_name)
                changed = false

                release_group(applications, release_name).each do |application|
                    next unless application.failed?

                    application.deleting!
                    changed = true
                end
                changed
            end

            # Reconstructs one runtime entry from its persisted representation.
            # @param attributes [Hash] String- or symbol-keyed persisted attributes
            # @return [Application] Deserialized runtime application
            def json_create(attributes)
                attributes = attributes.to_h do |key, value|
                    [key.to_sym, value]
                end

                new(attributes)
            end

        end

        # Checks whether this entry contains an application failure.
        # @return [Boolean] true when the runtime state is error
        def failed?
            state == 'error'
        end

        # Checks whether an event is newer than the persisted runtime entry.
        # @param version [Integer] Monotonic version received from Kubernetes
        # @return [Boolean] true when the event is newer than the persisted version
        def accepts_event?(version)
            resource_version.nil? || version.to_i > resource_version.to_i
        end

        # Applies an accepted state update and clears a previous error.
        # @param new_state [String] State reported by the Kubernetes monitor
        # @param version [Integer] Accepted monotonic event version
        # @return [Application] Updated runtime application
        def update_state!(new_state, version)
            @state            = new_state
            @resource_version = version
            @error_msg        = nil

            self
        end

        # Applies an accepted failure update.
        # @param message [String] Error reported by the Kubernetes monitor
        # @param version [Integer] Accepted monotonic event version
        # @return [Application] Failed runtime application
        def fail!(message, version)
            @state            = 'error'
            @resource_version = version
            @error_msg        = message

            self
        end

        # Prepares a failed entry for an installation retry while preserving
        # the last accepted resource version.
        # @return [Application] Runtime application in installing state
        def retrying!
            @state     = 'installing'
            @error_msg = nil

            self
        end

        # Applies a local execution failure without changing monitor version.
        # @param message [String] Local execution failure
        # @return [Application] Failed runtime application
        def fail_locally!(message)
            @state     = 'error'
            @error_msg = message

            self
        end

        # Prepares a failed entry for a deletion retry.
        # @return [Application] Runtime application in deleting state
        def deleting!
            @state     = 'deleting'
            @error_msg = nil

            self
        end

        # Returns the flat runtime representation persisted in the Cluster body.
        # @return [Hash] Serializable runtime application attributes
        def to_h
            attributes = {
                :id               => id,
                :release_name     => release_name,
                :state            => state,
                :resource_version => resource_version
            }

            attributes[:target_namespace] = target_namespace if target_namespace
            attributes[:parent]    = parent if parent
            attributes[:error_msg] = error_msg if error_msg
            attributes
        end

        # Serializes the runtime application without static chart metadata.
        # @param args [Array] JSON generator arguments
        # @return [String] JSON representation of the runtime application
        def to_json(*args)
            to_h.to_json(*args)
        end

    end

end
