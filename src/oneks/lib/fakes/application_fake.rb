# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License");            #
#--------------------------------------------------------------------------- #

module OneKS

    # Simulates the state callbacks emitted by the Kubernetes Application
    # controller. It is connected to K8sFake only in development mode.
    class ApplicationFake

        COMP     = 'APF'
        INTERVAL = 5

        def self.configure(k8s)
            fake = new
            rc   = fake.start
            raise rc.message if OpenNebula.is_error?(rc)

            k8s.application_fake = fake
            true
        end

        def initialize(**opts)
            unknown_options = opts.keys - [:interval, :dispatcher, :thread_manager]
            raise ArgumentError, "Unknown Application fake options: #{unknown_options.join(', ')}" \
                unless unknown_options.empty?

            @interval       = opts.fetch(:interval, INTERVAL).to_f
            @dispatcher     = opts[:dispatcher] || method(:dispatch)
            @thread_manager = opts[:thread_manager] || ODS::ThreadManager.instance
            @mutex          = Mutex.new
            @condition      = ConditionVariable.new
            @scheduled      = []
            @sequence       = 0
            @stopped        = false
            @started        = false

            raise ArgumentError, 'Application fake interval must be positive' \
                unless @interval.positive?
        end

        def start
            return true if @started

            @thread_manager.on_stop { stop }
            @thread_manager.start(:application_fake) { run }
            @started = true

            Log.info(COMP, 'Starting development Application fake')
            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "Application fake start failed: #{e.class}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        def stop
            @mutex.synchronize do
                @stopped = true
                @condition.broadcast
            end

            true
        end

        # Schedules state changes from the actual resolved chart hierarchy.
        def install(cluster_id, chart:, release_name:, applications: nil)
            entries = Array(applications)
            if entries.empty?
                entries = Application.entries(:chart => chart, :release_name => release_name)
            end

            schedule(cluster_id, ordered(entries), ['installing', 'ready'])
        end

        # Schedules deletion callbacks from the actual persisted runtime entries.
        def delete(cluster_id, applications:)
            schedule(cluster_id, ordered(Array(applications)), ['deleting', 'done'])
        end

        # Publishes every event whose deadline has elapsed. The explicit time is
        # useful for deterministic tests without sleeping.
        def run_once(now: monotonic_now)
            events = @mutex.synchronize do
                due, pending = @scheduled.partition {|item| item[:at] <= now }
                @scheduled = pending
                due
            end

            events.each {|item| publish(item) }
            true
        end

        private

        def schedule(cluster_id, entries, states)
            return true if entries.empty?

            now = monotonic_now

            @mutex.synchronize do
                return false if @stopped

                states.each_with_index do |state, state_index|
                    entries.each_with_index do |application, entry_index|
                        @sequence += 1
                        offset = (state_index * entries.size) + entry_index + 1
                        @scheduled << {
                            :at         => now + (@interval * offset),
                            :sequence   => @sequence,
                            :cluster_id => cluster_id.to_i,
                            :event      => 'app_state_changed',
                            :payload    => payload(application, state, state_index + 1)
                        }
                    end
                end

                @scheduled.sort_by! {|item| [item[:at], item[:sequence]] }
                @condition.signal
            end

            Log.debug(
                COMP,
                "Scheduled #{states.join(' -> ')} for #{entries.size} Applications",
                cluster_id
            )
            true
        end

        def payload(application, state, version_offset)
            event = {
                :state            => state,
                :release_name     => application.release_name,
                :resource_version => application.resource_version.to_i + version_offset
            }
            event[:parent] = application.parent if application.parent
            event
        end

        def ordered(entries)
            entries.reject {|application| application.parent.nil? } +
                entries.select {|application| application.parent.nil? }
        end

        def run
            loop do
                item = next_event
                break unless item

                publish(item)
            end
        end

        def next_event
            @mutex.synchronize do
                loop do
                    return if @stopped

                    if @scheduled.empty?
                        @condition.wait(@mutex)
                        next
                    end

                    remaining = @scheduled.first[:at] - monotonic_now
                    if remaining.positive?
                        @condition.wait(@mutex, remaining)
                        next
                    end

                    return @scheduled.shift
                end
            end
        end

        def publish(item)
            rc = @dispatcher.call(item[:cluster_id], item[:event], item[:payload])
            return true unless OpenNebula.is_error?(rc)

            Log.error(
                COMP,
                "Could not publish #{item[:event]} for " \
                "#{item.dig(:payload, :release_name)}: #{rc.message}",
                item[:cluster_id]
            )
            rc
        rescue StandardError => e
            Log.error(
                COMP,
                "Could not publish #{item[:event]} for " \
                "#{item.dig(:payload, :release_name)}: #{e.class}: #{e.message}",
                item[:cluster_id]
            )
            OpenNebula::Error.new(e.message, OpenNebula::Error::EACTION)
        end

        def dispatch(cluster_id, event, payload)
            ApiEvents.dispatch(
                ClusterLCM.instance,
                cluster_id,
                :event   => event,
                :payload => payload
            )
        end

        def monotonic_now
            Process.clock_gettime(Process::CLOCK_MONOTONIC)
        end

    end

end
