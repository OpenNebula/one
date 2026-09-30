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

require 'net/http'

module OneKS

    # Simulates the callbacks produced by the in-cluster Kubernetes monitor
    class MonitorFake

        COMP          = 'MNF'
        INTERVAL      = 60
        STARTUP_DELAY = 1
        HTTP_TIMEOUT  = 5

        READINESS_STATES = [
            :PROVISIONING,
            :SCALING,
            :UPGRADING,
            :RUNNING,
            :WARNING
        ]

        CONTROL_PLANE_PODS = [
            {
                :pod       => 'capi-controller-manager-594df9bb6b-6jwrz',
                :namespace => 'capi-system'
            },
            {
                :pod       => 'capone-controller-manager-68fcf7756b-gzwj4',
                :namespace => 'capone-system'
            },
            {
                :pod       => 'cert-manager-687484f946-5rpn2',
                :namespace => 'cert-manager'
            }
        ]

        # Builds a monitor with the credentials and isolated pools used by the server
        def self.build(cloud_auth:, endpoint:)
            # Keep monitor reads separate from the mutable pools used by the LCMs
            c_pool = OneKS::ClusterDocumentPool.new(:auth => cloud_auth)
            g_pool = OneKS::K8sGroupDocumentPool.new(:auth => cloud_auth)

            new(
                :cluster_pool => c_pool,
                :group_pool   => g_pool,
                :endpoint     => endpoint,
                :auth         => cloud_auth
            )
        end

        # Builds, starts and connects a monitor to the development VM watchdog
        def self.configure(vm_watchdog, cloud_auth:, endpoint:)
            monitor = build(:cloud_auth => cloud_auth, :endpoint => endpoint)
            raise monitor.message if OpenNebula.is_error?(monitor)

            rc = monitor.start
            raise rc.message if OpenNebula.is_error?(rc)

            vm_watchdog.monitor = monitor
            true
        end

        def initialize(cluster_pool:, group_pool:, endpoint:, auth:, **opts)
            unknown_options = opts.keys - [:interval, :startup_delay, :requester]
            raise ArgumentError, "Unknown monitor fake options: #{unknown_options.join(', ')}" \
                unless unknown_options.empty?

            interval      = opts.fetch(:interval, INTERVAL)
            startup_delay = opts.fetch(:startup_delay, STARTUP_DELAY)
            requester     = opts[:requester]

            raise ArgumentError, 'Monitor fake interval must be positive' \
                unless interval.to_f.positive?

            @cluster_pool  = cluster_pool
            @group_pool    = group_pool
            @endpoint      = endpoint.to_s.sub(%r{/+$}, '')
            @auth          = auth
            @interval      = interval.to_f
            @startup_delay = startup_delay.to_f
            @requester     = requester || method(:http_post)
            @thread_manager = ODS::ThreadManager.instance
            @mutex          = Mutex.new
            @condition      = ConditionVariable.new
            @events         = {}
            @application_groups = {}
            # Avoid replaying an accepted queued readiness in the immediate snapshot
            @reported_ready = {}
            @stopped        = false
            @started        = false

            raise ArgumentError, 'Monitor fake endpoint cannot be empty' if @endpoint.empty?

            authentication
        end

        def start
            return true if @started

            @thread_manager.on_stop { stop }
            @thread_manager.start(:monitor_fake) { run }
            @started = true

            Log.info(COMP, 'Starting development monitor fake')
            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "Monitor fake start failed: #{e.class}: #{e.message}",
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

        def enqueue_node_ready(cluster_id, group_id, vm_id)
            return false if cluster_id.nil? || group_id.nil? || vm_id.nil?

            @mutex.synchronize do
                return false if @stopped

                event = {
                    :cluster_id => cluster_id.to_i,
                    :group_id   => group_id.to_i,
                    :vm_id      => vm_id.to_i
                }
                key = readiness_key(cluster_id, group_id, vm_id)

                @events[key] = event
                @condition.signal
            end

            true
        end

        def run_once
            rc = @cluster_pool.info
            return rc if OpenNebula.is_error?(rc)
            return true if stopped?

            @cluster_pool.ids.each do |cluster_id|
                break if stopped?

                cluster = @cluster_pool.get(cluster_id)

                if OpenNebula.is_error?(cluster)
                    log_error("Could not load Cluster #{cluster_id}: #{cluster.message}")
                    next
                end

                begin
                    report_cluster(cluster)
                rescue StandardError => e
                    log_error(
                        "Could not report Cluster #{cluster_id}: #{e.class}: #{e.message}",
                        cluster_id
                    )
                end
            end

            true
        rescue StandardError => e
            OpenNebula::Error.new(
                "Monitor fake cycle failed: #{e.class}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        private

        def run
            wait_until(monotonic_now + @startup_delay)
            next_snapshot = monotonic_now

            loop do
                action, event = next_action(next_snapshot)
                break unless action

                if action == :event
                    begin
                        rc = publish_node_ready(**event)
                        remember_ready_report(event) unless OpenNebula.is_error?(rc)
                    rescue StandardError => e
                        log_error(
                            "Could not publish readiness for VM #{event[:vm_id]}: " \
                            "#{e.class}: #{e.message}", event[:cluster_id]
                        )
                    end
                else
                    rc = run_once
                    log_error(rc.message) if OpenNebula.is_error?(rc)
                    next_snapshot = monotonic_now + @interval
                end
            end
        end

        def next_action(snapshot_at)
            @mutex.synchronize do
                loop do
                    return if @stopped

                    unless @events.empty?
                        _key, event = @events.shift

                        return [:event, event]
                    end

                    return [:snapshot, nil] if monotonic_now >= snapshot_at

                    remaining = snapshot_at - monotonic_now
                    next unless remaining.positive?

                    @condition.wait(@mutex, remaining)
                end
            end
        end

        def wait_until(deadline)
            @mutex.synchronize do
                until @stopped
                    remaining = deadline - monotonic_now
                    break unless remaining.positive?

                    @condition.wait(@mutex, remaining)
                end
            end
        end

        def report_cluster(cluster)
            groups = []

            cluster.groups.each do |reference|
                break if stopped?

                group = @group_pool.get(reference[:id])

                if OpenNebula.is_error?(group)
                    log_error(
                        "Could not load Group #{reference[:id]}: #{group.message}", cluster.id
                    )
                    next
                end

                groups << group
            end

            return true if stopped?

            reconcile_readiness(cluster, groups)
            return true if stopped?

            pods             = {}
            observations     = []
            running_groups   = groups.select(&:running?)
            application_pods = application_pods_by_group(cluster, running_groups)

            running_groups.each do |group|
                break if stopped?

                snapshot = snapshot_for(group)
                append_application_pods(
                    snapshot, group, Array(application_pods[group.id])
                )

                pods[group.id.to_s] = snapshot[:pods]
                observations.concat(snapshot[:observations])
            end

            return true if stopped?

            publish(
                cluster,
                "/clusters/#{cluster.id}/pods",
                pods
            )
            return true if stopped?

            publish(
                cluster,
                "/clusters/#{cluster.id}/observations",
                observations
            )
        end

        # Builds a complete runtime snapshot from the current group.
        def snapshot_for(group)
            observations = []
            pods = Array(group.vms).to_h {|vm| [vm[:id].to_s, []] }
            return { :pods => pods, :observations => observations } unless
                group.type.to_s == 'ControlPlane' && !pods.empty?

            vm_pods = pods.values.first
            CONTROL_PLANE_PODS.each do |attributes|
                pod = attributes.merge(:state => 'Running', :reason => '')

                vm_pods << pod
                observations << pod_observation(pod)
            end

            { :pods => pods, :observations => observations }
        end

        # Assigns every root installation and its dependencies to one random
        # running NodeGroup. The assignment stays stable while the installation
        # and selected NodeGroup remain present.
        def application_pods_by_group(cluster, groups)
            installations = Array(cluster.applications).group_by do |application|
                application.parent || application.release_name
            end
            active_keys = installations.keys.map do |release_name|
                [cluster.id.to_i, release_name]
            end

            @application_groups.delete_if do |key, _group_id|
                key.first == cluster.id.to_i && !active_keys.include?(key)
            end

            eligible_groups = groups.select do |group|
                group.type.to_s == 'NodeGroup' && !Array(group.vms).empty?
            end
            return {} if eligible_groups.empty?

            installations.each_with_object({}) do |(release_name, applications), result|
                key = [cluster.id.to_i, release_name]
                group_id = @application_groups[key]
                group = eligible_groups.find do |candidate|
                    group_id && candidate.id.to_i == group_id.to_i
                end

                unless group
                    group = eligible_groups.sample
                    @application_groups[key] = group.id
                end

                result[group.id] ||= []
                result[group.id].concat(applications)
            end
        end

        # Adds one synthetic pod per persisted Application entry to one
        # NodeGroup, distributing them across its VMs in a stable order.
        def append_application_pods(snapshot, group, applications)
            vm_ids = Array(group.vms).map {|vm| vm[:id].to_s }
            return if vm_ids.empty?

            applications.each_with_index do |application, index|
                pod = {
                    :pod       => "fake-app-#{application.release_name}",
                    :namespace => 'default',
                    :state     => application_pod_state(application.state),
                    :reason    => application.error_msg
                }
                vm_id = vm_ids[index % vm_ids.size]

                snapshot[:pods].fetch(vm_id) << pod
                snapshot[:observations] << pod_observation(pod)
            end
        end

        def application_pod_state(state)
            case state
            when 'ready'
                'Running'
            when 'error'
                'Failed'
            when 'deleting'
                'Terminating'
            else
                'Pending'
            end
        end

        def pod_observation(pod)
            {
                :resource  => 'pods',
                :namespace => pod[:namespace],
                :name      => pod[:pod],
                :path      => 'status.phase',
                :value     => pod[:state],
                :createdAt => Time.now.to_i
            }
        end

        def reconcile_readiness(cluster, groups)
            groups.each do |group|
                break if stopped?
                next unless READINESS_STATES.include?(group.state.to_sym)

                Array(group.vms).each do |vm|
                    break if stopped?

                    if vm[:ready]
                        forget_ready_report(cluster.id, group.id, vm[:id])
                        next
                    end

                    # A queued callback may be accepted before its LCM update is visible
                    next if consume_ready_report(cluster.id, group.id, vm[:id])

                    publish_node_ready(
                        :cluster_id => cluster.id,
                        :group_id   => group.id,
                        :vm_id      => vm[:id],
                        :cluster    => cluster
                    )
                end
            end
        end

        def publish_node_ready(cluster_id:, group_id:, vm_id:, cluster: nil)
            return true if stopped?

            cluster ||= @cluster_pool.get(cluster_id)

            if OpenNebula.is_error?(cluster)
                log_error("Could not load Cluster #{cluster_id}: #{cluster.message}")
                return cluster
            end

            return true if stopped?

            publish(
                cluster,
                "/clusters/#{cluster_id}/nodegroups/#{group_id}/events",
                {
                    :event   => 'node_ready',
                    :payload => { :vm_id => vm_id, :ready => true }
                }
            )
        end

        def publish(cluster, path, data)
            return true if stopped?

            payload = MonitorPayload.encode(data, cluster.monitor_key)

            if OpenNebula.is_error?(payload)
                log_error("Could not encode #{path}: #{payload.message}", cluster.id)
                return payload
            end

            rc = @requester.call(path, { :payload => payload })
            log_error("Request #{path} failed: #{rc.message}", cluster.id) \
                if OpenNebula.is_error?(rc)

            rc
        end

        def stopped?
            @mutex.synchronize { @stopped }
        end

        def remember_ready_report(event)
            key = readiness_key(event[:cluster_id], event[:group_id], event[:vm_id])

            @mutex.synchronize { @reported_ready[key] = true }
        end

        def consume_ready_report(cluster_id, group_id, vm_id)
            key = readiness_key(cluster_id, group_id, vm_id)

            @mutex.synchronize { !@reported_ready.delete(key).nil? }
        end

        def forget_ready_report(cluster_id, group_id, vm_id)
            key = readiness_key(cluster_id, group_id, vm_id)

            @mutex.synchronize { @reported_ready.delete(key) }
        end

        def readiness_key(cluster_id, group_id, vm_id)
            [cluster_id.to_i, group_id.to_i, vm_id.to_i]
        end

        def http_post(path, envelope)
            uri     = URI("#{@endpoint}#{path}")
            request = Net::HTTP::Post.new(uri)
            username, password = authentication

            request.basic_auth(username, password)
            request['Content-Type'] = 'application/json'
            request.body = envelope.to_json

            http = Net::HTTP.new(uri.host, uri.port, nil)
            http.use_ssl      = uri.scheme == 'https'
            http.open_timeout = HTTP_TIMEOUT
            http.read_timeout = HTTP_TIMEOUT

            response = http.start {|client| client.request(request) }
            return true if response.is_a?(Net::HTTPSuccess)

            OpenNebula::Error.new(
                "HTTP #{response.code}: #{response.body}", OpenNebula::Error::EACTION
            )
        rescue StandardError => e
            OpenNebula::Error.new(
                "#{e.class}: #{e.message}", OpenNebula::Error::EACTION
            )
        end

        # CloudAuth rotates its server token, so resolve it for every request.
        def authentication
            auth = @auth.respond_to?(:client) ? @auth.client.one_auth : @auth
            username, password = auth.to_s.split(':', 2)

            raise ArgumentError, 'Monitor fake authentication is invalid' \
                if username.to_s.empty? || password.to_s.empty?

            [username, password]
        end

        def log_error(message, cluster_id = nil)
            Log.error(COMP, message, cluster_id)
        end

        def monotonic_now
            Process.clock_gettime(Process::CLOCK_MONOTONIC)
        end

    end

end
