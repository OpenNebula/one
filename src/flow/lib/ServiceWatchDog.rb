# rubocop:disable Naming/FileName
# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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
require 'EventManager'

# Service watchdog class
class ServiceWD

    ############################################################################
    # Default configuration options for the module
    ############################################################################
    LOG_COMP = 'WD'

    DEFAULT_CONF = {
        :subscriber_endpoint  => 'tcp://localhost:2101',
        :timeout_s   => 30,
        :concurrency => 10,
        :cloud_auth  => nil
    }

    ############################################################################
    # WARNING STATES
    ############################################################################
    WARNING_STATES = %w[
        POWEROFF
        UNKNOWN
    ] + EventManager::FAILURE_STATES

    # Class constructor
    #
    # @param options [Hash] event manager options
    def initialize(client, options)
        @conf = DEFAULT_CONF.merge(options)

        @lcm        = options[:lcm]
        @context    = ZMQ::Context.new(1)
        @cloud_auth = @conf[:cloud_auth]
        @client     = client

        @services_nodes   = {}
        @services_threads = {}

        @nodes_mutex   = Mutex.new
        @threads_mutex = Mutex.new
    end

    # Start service WD thread
    #
    # @param service_id [Integer] Service ID to watch
    # @param roles      [Array]   Service roles with its nodes
    def start(service_id, roles)
        Log.info LOG_COMP, "Start watching #{service_id}"

        @threads_mutex.synchronize do
            @services_threads[service_id] = Thread.new do
                start_watching(service_id, roles)
            end
        end
    end

    # Stop service WD thread
    #
    # @param service_id [Integer] Service ID to stop
    def stop(service_id)
        Log.info LOG_COMP, "Stop watching #{service_id}"

        @threads_mutex.synchronize do
            return if @services_threads[service_id].nil?

            @services_threads[service_id].terminate

            @services_threads.delete(service_id)
        end

        stop_watching(service_id)
    end

    # Update service nodes
    #
    # @param service_id [Integer] Service ID to update
    # @param role_name  [String]  Role to update
    # @param node       [Integer] VM ID to delete
    def update(service_id, role_name, node)
        subscriber = gen_subscriber

        unsubscribe(node, subscriber)

        @nodes_mutex.synchronize do
            return if @services_nodes[service_id].nil?

            return if @services_nodes[service_id][role_name].nil?

            @services_nodes[service_id][role_name].delete(node)

            return unless @services_nodes[service_id][role_name].empty?

            # if all role nodes have been deleted, delete the rol
            @services_nodes[service_id].delete(role_name)
        end
    end

    private

    # Start watching service roles nodes
    #
    # @param service_id [Integer] Service ID to watch
    # @param roles      [Array]   Service roles with its nodes
    def start_watching(service_id, roles)
        @nodes_mutex.synchronize do
            @services_nodes[service_id] = {}

            roles.each do |name, role|
                @services_nodes[service_id][name] = {}
                @services_nodes[service_id][name] = role.nodes_ids
            end
        end

        # check that all nodes are in RUNNING state, if not, notify
        check_roles_state(client, service_id, roles)

        # subscribe to all nodes
        subscriber = gen_subscriber

        @nodes_mutex.synchronize do
            @services_nodes[service_id].each do |_, nodes|
                nodes.each do |node|
                    subscribe(node, subscriber)
                end
            end
        end

        key     = ''
        content = ''

        # wait for any STATE change
        loop do
            rc = subscriber.recv_string(key)
            rc = subscriber.recv_string(content) if rc != -1

            if rc == -1 && ZMQ::Util.errno != ZMQ::EAGAIN
                Log.error LOG_COMP, 'Error reading from subscriber.'
            end

            # key format: EVENT VM VM_ID/STATE/LCM_STATE
            next if key.nil?

            split_key = key.split

            # if there is no data skip
            next if split_key[2].nil?

            split_key = key.split[2].split('/')
            node      = split_key[0].to_i
            state     = split_key[1]
            lcm_state = split_key[2]
            role_name = find_by_id(service_id, node)

            # if the VM is not from the service skip
            next if role_name.nil?

            states         = {}
            states[:state] = state
            states[:lcm]   = lcm_state

            check_role_state(client, service_id, role_name, node, states)
        end
    end

    # Stop watching service roles nodes
    #
    # @service_id [Integer] Service ID to stop watching
    def stop_watching(service_id)
        # unsubscribe from all nodes
        subscriber = gen_subscriber

        @nodes_mutex.synchronize do
            @services_nodes[service_id].each do |_, nodes|
                nodes.each do |node|
                    unsubscribe(node, subscriber)
                end
            end

            @services_nodes.delete(service_id)
        end
    end

    # Get OpenNebula client
    def client
        # If there's a client defined use it
        return @client unless @client.nil?

        # If not, get one via cloud_auth
        @cloud_auth.client
    end

    # Get ZMQ subscriber object
    def gen_subscriber
        subscriber = @context.socket(ZMQ::SUB)

        # Set timeout (TODO add option for customize timeout)
        subscriber.setsockopt(ZMQ::RCVTIMEO, @conf[:timeout_s] * 10**3)
        subscriber.connect(@conf[:subscriber_endpoint])

        subscriber
    end

    # Subscribe to VM state changes
    #
    # @param vm_id      [Integer] VM ID to subscribe
    # @param subscriber [ZMQ]     ZMQ subscriber object
    def subscribe(vm_id, subscriber)
        subscriber.setsockopt(ZMQ::SUBSCRIBE, "EVENT VM #{vm_id}")
    end

    # Unsubscribe from VM state changes
    #
    # @param vm_id      [Integer] VM ID to unsubscribe
    # @param subscriber [ZMQ]     ZMQ subscriber object
    def unsubscribe(vm_id, subscriber)
        subscriber.setsockopt(ZMQ::UNSUBSCRIBE, "EVENT VM #{vm_id}")
    end

    # Check service roles state
    #
    # @param client     [OpenNebula::Client] Client to make API calls
    # @param service_id [Integer]            Service ID to check
    # @param roles      [Array]              Service roles with its nodes
    def check_roles_state(client, service_id, roles)
        roles.each do |name, role|
            role.nodes_ids.each do |node|
                check_role_state(client, service_id, name, node)
            end
        end
    end

    ############################################################################
    # HELPERS
    ############################################################################

    # Find role name for a given VM
    #
    # @param service_id [Integer] Service ID to get role from
    # @param node       [Integer] VM ID
    #
    # @return nil if don't find, role_name if found
    def find_by_id(service_id, node)
        ret = nil

        @nodes_mutex.synchronize do
            ret = @services_nodes[service_id].find do |_, nodes|
                nodes.include?(node)
            end
        end

        ret[0] unless ret.nil?
    end

    # Check role state
    #
    # @param client     [OpenNebula::Client] Client to make API calls
    # @param service_id [Integer]            Service ID to check
    # @param role_name  [String]             Role to check
    # @param node       [Integer]            VM ID
    # @param states     [Hash]               node state and node lcm state
    def check_role_state(client, service_id, role_name, node, states = nil)
        # if don't have the state, query it by creating a VM object
        if states.nil?
            vm = OpenNebula::VirtualMachine.new_with_id(node, client)
            vm.info

            vm_state     = OpenNebula::VirtualMachine::VM_STATE[vm.state]
            vm_lcm_state = OpenNebula::VirtualMachine::LCM_STATE[vm.lcm_state]
        else
            vm_state     = states[:state]
            vm_lcm_state = states[:lcm]
        end

        if WARNING_STATES.include?(vm_lcm_state) ||
           WARNING_STATES.include?(vm_state)
            action     = :error_wd_cb
            action_msg = 'Warning'
        elsif vm_state == 'DONE'
            action     = :done_wd_cb
            action_msg = 'Warning'
        elsif vm_lcm_state == 'RUNNING'
            action     = :running_wd_cb
            action_msg = 'Running'
        else
            # in case there is other state, ignore it
            return
        end

        Log.info LOG_COMP,
                 "#{action_msg} #{service_id}: #{role_name} is #{vm_state}"

        # execute callback
        @lcm.trigger_action(action,
                            service_id,
                            client,
                            service_id,
                            role_name,
                            node)
    end

end
# rubocop:enable Naming/FileName
