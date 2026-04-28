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

require 'ffi-rzmq'

module OpenNebula

    module DocumentServer

        # Raised internally to stop an active subscription loop in a controlled way.
        class StopSubscription < StandardError; end

        # Handles asynchronous OpenNebula events received via ZMQ
        class EventSubscriber

            COMP = 'SUB'

            # Default additional VM states to subscribe
            SUBSCRIBE_STATES = []

            attr_reader :endpoint, :timeout, :context, :socket
            attr_accessor :states

            # Creates a new event subscriber.
            # @param endpoint [String] ZMQ endpoint to connect to
            # @param timeout [Integer] receive timeout in seconds
            # @param states [Array<String>, nil] extra VM states to subscribe
            def initialize(endpoint:, timeout:, states: nil)
                @context  = ZMQ::Context.new(1)
                @endpoint = endpoint
                @timeout  = timeout * 1000 # stored in milliseconds for ZMQ
                @socket   = create_subscriber
                @states   = states || SUBSCRIBE_STATES
            end

            # Builds a subscriber using SERVER_CONF defaults.
            # @param states [Array<String>, nil] extra VM states to subscribe
            # @return [EventSubscriber]
            def self.default_subscriber(states: nil)
                raise(
                    'SERVER_CONF is not defined. Please set SERVER_CONF ' \
                    'with :subscriber_endpoint and :subscriber_timeout'
                ) unless defined?(SERVER_CONF) && SERVER_CONF.is_a?(Hash)

                endpoint = SERVER_CONF[:subscriber_endpoint]
                timeout  = SERVER_CONF[:subscriber_timeout]

                raise 'SERVER_CONF must contain :subscriber_endpoint and :subscriber_timeout keys' \
                if endpoint.nil? || timeout.nil?

                new(:endpoint => endpoint, :timeout => timeout, :states => states)
            end

            # ------------------------------------------------------
            # Subscriptions handlers
            # ------------------------------------------------------

            # Subscribe to an API event and process notifications until stopped or timed out.
            # A temporary subscriber is created using the default configuration. The
            # subscription remains active until the block raises StopSubscription or the
            # timeout expires. If timeout is nil, the subscription runs indefinitely.
            # The subscriber is automatically closed before returning.
            #
            # @param call [String] API event name (e.g. "one.vm.allocate")
            # @param timeout [Integer, nil] maximum time in seconds, or nil to wait indefinitely
            # @param stop_flag [ODS::ThreadManager::StopFlag, nil] shared cancellation flag
            # @yield [xml] parsed Nokogiri XML document with the event payload
            #
            # @return [nil] if stopped manually via StopSubscription
            # @return [OpenNebula::Error] if timeout, cancellation, or an error occurs
            def self.subscribe_for(call, timeout: nil, stop_flag: nil)
                raise ArgumentError, 'block required' unless block_given?

                subscriber = default_subscriber
                started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)

                subscriber.subscribe(call)

                loop do
                    return OpenNebula::Error.new(
                        "#{call} subscriber cancelled", OpenNebula::Error::EACTION
                    ) if stop_flag&.true?

                    wait_ms = subscriber.timeout

                    unless timeout.nil?
                        elapsed   = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at
                        remaining = timeout - elapsed

                        return OpenNebula::Error.new(
                            "#{call} subscriber timed out after #{timeout} seconds",
                            OpenNebula::Error::EACTION
                        ) if remaining <= 0

                        wait_ms = (remaining * 1000).to_i.clamp(1, subscriber.timeout)
                    end

                    subscriber.socket.setsockopt(ZMQ::RCVTIMEO, wait_ms)

                    key, content = subscriber.recv_event
                    next if key.nil? || content.nil?

                    xml = subscriber.decode_xml(content)
                    next if xml.nil?

                    yield(xml)
                end
            rescue StopSubscription
                nil
            rescue StandardError => e
                Log.error(COMP, "#{call} subscriber loop crashed: #{e.class}: #{e.message}")

                OpenNebula::Error.new(
                    "#{call} subscriber loop crashed: #{e.class}: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            ensure
                subscriber.unsubscribe_api!(call) rescue nil if subscriber
                subscriber.close if subscriber
            end

            # Subscribe to state changes for a set of VMs and process notifications
            # until stopped or timed out.
            # A temporary subscriber is created using default configuration. For each
            # VM, subscribe_all! is called using the provided state/lcm_state pair.
            #
            # @param vm_ids [Array<Integer>] VM IDs to observe
            # @param state [String] current VM state to subscribe from
            # @param lcm_state [String] current VM LCM state to subscribe from
            # @param timeout [Integer] maximum time in seconds to wait
            # @yield [key, content, xml] event data for each received notification
            #
            # @return [nil] if stopped manually via StopSubscription
            # @return [OpenNebula::Error] if timeout is reached or an error occurs
            def self.subscribe_for_state(vm_ids, state:, lcm_state:, timeout: 300)
                raise ArgumentError, 'block required' unless block_given?

                subscriber = default_subscriber
                started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
                vm_ids     = vm_ids.map(&:to_i).uniq

                vm_ids.each do |vm_id|
                    subscriber.subscribe_all!(vm_id, state, lcm_state)
                end

                loop do
                    elapsed   = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at
                    remaining = timeout - elapsed

                    return OpenNebula::Error.new(
                        "state subscriber timed out after #{timeout} seconds",
                        OpenNebula::Error::EACTION
                    ) if remaining <= 0

                    subscriber.socket.setsockopt(
                        ZMQ::RCVTIMEO,
                        (remaining * 1000).to_i.clamp(1, subscriber.timeout)
                    )

                    key, content = subscriber.recv_event

                    next if key.nil? || content.nil?

                    xml = subscriber.decode_xml(content)
                    next if xml.nil?

                    yield(key, content, xml)
                end
            rescue StopSubscription
                nil
            rescue StandardError => e
                Log.error(COMP, "state subscriber loop crashed: #{e.class}: #{e.message}")

                OpenNebula::Error.new(
                    "state subscriber loop crashed: #{e.class}: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            ensure
                if subscriber
                    vm_ids&.each do |vm_id|
                        subscriber.unsubscribe_all!(vm_id, state, lcm_state) rescue nil
                    end

                    subscriber.close
                end
            end

            # ------------------------------------------------------
            # Low-level receive helpers
            # ------------------------------------------------------

            # Receives a single multipart event from the subscriber socket.
            # If a receive timeout happens (EAGAIN), this method returns [nil, nil]
            # so permanent watcher loops can continue without treating it as an error.
            # @return [Array<(String, String)>, Array<(nil, nil)>]
            #   key and content if an event was received, or [nil, nil] if timed out
            def recv_event
                key     = ''
                content = ''

                rc = @socket.recv_string(key)
                if rc == -1
                    return [nil, nil] if ZMQ::Util.errno == ZMQ::EAGAIN

                    raise "Error reading subscriber key: #{ZMQ::Util.errno}"
                end

                rc = @socket.recv_string(content)
                if rc == -1
                    return [nil, nil] if ZMQ::Util.errno == ZMQ::EAGAIN

                    raise "Error reading subscriber content: #{ZMQ::Util.errno}"
                end

                return [nil, nil] if key.empty? || content.empty?

                [key, content]
            end

            # Decodes a base64 event payload into XML.
            # Invalid base64 or malformed XML payloads are ignored and return nil.
            # @param content [String] base64 encoded XML payload
            # @return [Nokogiri::XML::Document, nil]
            def decode_xml(content)
                xml = begin
                    Nokogiri::XML(Base64.decode64(content))
                rescue StandardError
                    nil
                end

                return if xml.nil? || !xml.errors.empty?

                xml
            end

            # ------------------------------------------------------
            # Socket Management
            # ------------------------------------------------------

            # Creates and connects the underlying ZMQ SUB socket.
            # The socket is configured with the instance receive timeout.
            # @return [ZMQ::Socket]
            def create_subscriber
                socket = @context.socket(ZMQ::SUB)
                socket.setsockopt(ZMQ::RCVTIMEO, @timeout)
                socket.connect(@endpoint)

                socket
            end

            # Closes the socket and terminates the ZMQ context.
            def close
                @socket.close if @socket
                @context.terminate if @context
            end

            # ------------------------------------------------------
            # Subscription Management
            # ------------------------------------------------------

            # Subscribe to VM state changes
            #
            # @param subscriber [ZMQ] ZMQ subscriber object
            def subscribe(event)
                @socket.setsockopt(ZMQ::SUBSCRIBE, event)
            end

            # Unsubscribe from VM state changes
            #
            # @param subscriber [ZMQ] ZMQ subscriber object
            def unsubscribe(event)
                @socket.setsockopt(ZMQ::UNSUBSCRIBE, event)
            end

            def subscribe_state(object, id, state, lcm_state = nil)
                @socket.setsockopt(
                    ZMQ::SUBSCRIBE,
                    gen_filter(object, id, state, lcm_state)
                )
            end

            def unsubscribe_state(object, id, state, lcm_state = nil)
                @socket.setsockopt(
                    ZMQ::UNSUBSCRIBE,
                    gen_filter(object, id, state, lcm_state)
                )
            end

            # ------------------------------------------------------
            # Filter Generation
            # ------------------------------------------------------

            # Generates the ZMQ filter string used for VM/object state subscriptions.
            #
            # @param object [String]
            # @param id [Integer, String]
            # @param state [String]
            # @param lcm_state [String, nil]
            # @return [String]
            def gen_filter(object, id, state, lcm_state)
                "EVENT STATE #{object}/#{state}/#{lcm_state}/#{id}"
            end

            # ------------------------------------------------------
            # Bulk VM Subscriptions
            # ------------------------------------------------------

            # Subscribe to the provided VM state plus all configured follow-up states.
            # @param vm_id [Integer]
            # @param state [String]
            # @param lcm_state [String]
            # @return [void]
            def subscribe_all!(vm_id, state, lcm_state)
                subscribe_state('VM', vm_id, state, lcm_state)

                (@states + ['DONE']).each do |subs_state|
                    subscribe_state('VM', vm_id, subs_state, 'LCM_INIT')
                end
            end

            # Unsubscribe from all filters registered by subscribe_all!.
            #
            # @param vm_id [Integer]
            # @param state [String]
            # @param lcm_state [String]
            # @return [void]
            def unsubscribe_all!(vm_id, state, lcm_state)
                unsubscribe_state('VM', vm_id, state, lcm_state)

                (@states + ['DONE']).each do |subs_state|
                    unsubscribe_state('VM', vm_id, subs_state, 'LCM_INIT')
                end
            end

        end

    end

end
