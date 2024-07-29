# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'base64'
require 'ffi-rzmq'
require 'nokogiri'
require 'EventManager'

# Service watchdog class
class ServiceWD

    ############################################################################
    # Default configuration options for the module
    ############################################################################
    LOG_COMP = 'WD'

    DEFAULT_CONF = {
        :concurrency => 10,
        :cloud_auth  => nil
    }

    ############################################################################
    # WARNING STATES
    ############################################################################
    WARNING_STATES = [
        'POWEROFF',
        'UNKNOWN'
    ] + EventManager::FAILURE_STATES

    # Class constructor
    #
    # @param options [Hash] event manager options
    def initialize(options)
        @conf = DEFAULT_CONF.merge(options)

        @lcm                 = options[:lcm]
        @context             = ZMQ::Context.new(1)
        @cloud_auth          = @conf[:cloud_auth]
        @wait_timeout        = @cloud_auth.conf[:wait_timeout]
        @subscriber_endpoint = @cloud_auth.conf[:subscriber_endpoint]

        # Array of running services to watch
        @mutex    = Mutex.new
        @services = []
    end

    # Start services WD
    #
    # @param service_pool [ServicePool] All services to check
    def start(service_pool)
        Log.info LOG_COMP, 'Start watch dog'

        service_pool.info_all

        # check that all nodes are in RUNNING state, if not, notify
        check_roles_state(service_pool)

        # subscribe to all nodes
        subscriber = gen_subscriber

        subscribe(subscriber)

        key     = ''
        content = ''

        # wait for any STATE change
        loop do
            rc = subscriber.recv_string(key)
            rc = subscriber.recv_string(content) if rc != -1

            if rc == -1 && ZMQ::Util.errno != ZMQ::EAGAIN
                Log.error LOG_COMP, 'Error reading from subscriber.'
            end

            # key format: EVENT SERVICE SERVICE_ID
            next if key.nil?

            split_key = key.split

            # if there is no data skip
            next if content.nil?

            xml = Nokogiri::XML(Base64.decode64(content))

            service_id = split_key[2].to_i
            check      = false

            @mutex.synchronize do
                check = @services.include?(service_id)
            end

            next unless check

            node       = xml.xpath('/HOOK_MESSAGE/VM/ID').text.to_i
            state      = xml.xpath('/HOOK_MESSAGE/STATE').text
            lcm_state  = xml.xpath('/HOOK_MESSAGE/LCM_STATE').text
            role_name  = xml.xpath('/HOOK_MESSAGE/VM//ROLE_NAME').text

            # if the VM is not from the service skip
            next if role_name.nil?

            states         = {}
            states[:state] = state
            states[:lcm]   = lcm_state

            check_role_state(service_id, role_name, node, states)
        end
    end

    # Stop service WD thread
    def stop
        Log.info LOG_COMP, 'Stop watch dog'

        # unsubscribe from all nodes
        subscriber = gen_subscriber

        unsubscribe(subscriber)
    end

    # Add service to watch dog
    #
    # @param service [Service] Service information
    def add_service(service)
        @mutex.synchronize do
            @services << Integer(service.id)
        end

        service.roles.each do |name, role|
            role.nodes_ids.each do |node|
                check_role_state(service.id, name, node)
            end
        end
    end

    # Remove service from watch dog
    #
    # @param service_id [String] Service ID
    def remove_service(service_id)
        @mutex.synchronize do
            @services.delete(service_id.to_i)
        end
    end

    private

    # Get ZMQ subscriber object
    def gen_subscriber
        subscriber = @context.socket(ZMQ::SUB)

        # Set timeout (TODO add option for customize timeout)
        subscriber.setsockopt(ZMQ::RCVTIMEO, @wait_timeout * 10**3)
        subscriber.connect(@subscriber_endpoint)

        subscriber
    end

    # Subscribe to VM state changes
    #
    # @param subscriber [ZMQ] ZMQ subscriber object
    def subscribe(subscriber)
        subscriber.setsockopt(ZMQ::SUBSCRIBE, 'EVENT SERVICE')
    end

    # Unsubscribe from VM state changes
    #
    # @param subscriber [ZMQ] ZMQ subscriber object
    def unsubscribe(subscriber)
        subscriber.setsockopt(ZMQ::UNSUBSCRIBE, 'EVENT SERVICE')
    end

    # Check service roles state
    #
    # @param service_pool [ServicePool]        All services to check
    def check_roles_state(service_pool)
        service_pool.each do |service|
            service.info

            if service.state != Service::STATE['RUNNING'] &&
               service.state != Service::STATE['WARNING']
                next
            end

            @mutex.synchronize do
                @services << Integer(service.id)
            end

            roles = service.roles

            next unless roles

            roles.each do |name, role|
                nodes_ids = role.nodes_ids

                next unless nodes_ids

                if nodes_ids.empty?
                    # If there are no VM, the role should be running
                    @lcm.trigger_action(:running_wd_cb,
                                        service.id,
                                        nil,
                                        service.id,
                                        name,
                                        [])
                end

                nodes_ids.each do |node|
                    check_role_state(service.id, name, node)
                end
            end
        end
    end

    ############################################################################
    # HELPERS
    ############################################################################

    # Check role state
    #
    # @param service_id [Integer]            Service ID to check
    # @param role_name  [String]             Role to check
    # @param node       [Integer]            VM ID
    # @param states     [Hash]               node state and node lcm state
    def check_role_state(service_id, role_name, node, states = nil)
        # if don't have the state, query it by creating a VM object
        if states.nil?
            vm = OpenNebula::VirtualMachine.new_with_id(node,
                                                        @cloud_auth.client)
            vm.info

            vm_state     = OpenNebula::VirtualMachine::VM_STATE[vm.state]
            vm_lcm_state = OpenNebula::VirtualMachine::LCM_STATE[vm.lcm_state]
        else
            vm_state     = states[:state]
            vm_lcm_state = states[:lcm]
        end

        if WARNING_STATES.include?(vm_lcm_state) ||
           WARNING_STATES.include?(vm_state)
            action = :error_wd_cb
        elsif vm_state == 'DONE'
            action = :done_wd_cb
        elsif vm_lcm_state == 'RUNNING'
            action = :running_wd_cb
        else
            # in case there is other state, ignore it
            return
        end

        # execute callback
        @lcm.trigger_action(action,
                            service_id,
                            nil,
                            service_id,
                            role_name,
                            node)
    end

end
