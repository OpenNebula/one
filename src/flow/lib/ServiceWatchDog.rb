# rubocop:disable Naming/FileName
# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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
        :subscriber_endpoint  => 'tcp://localhost:2101',
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

        @lcm          = options[:lcm]
        @context      = ZMQ::Context.new(1)
        @cloud_auth   = @conf[:cloud_auth]
        @wait_timeout = @cloud_auth.conf[:wait_timeout]
        @client       = client

        # Array of running services to watch
        @mutex    = Mutex.new
        @services = []

        # Services to wait until ready
        #   service_id => :role  => role_name
        #                 :nodes => [nodes]
        @mutex_ready = Mutex.new
        @ready       = {}
    end

    # Start services WD
    #
    # @param service_pool [ServicePool] All services to check
    def start(service_pool)
        Log.info LOG_COMP, 'Start watch dog'

        service_pool.info_all

        # check that all nodes are in RUNNING state, if not, notify
        check_roles_state(client, service_pool)

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

            check_role_state(client, service_id, role_name, node, states)
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
    # @param service_id [String] Service ID
    def add_service(service_id)
        @mutex.synchronize do
            @services << service_id.to_i
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

    def wait_ready
        subscriber = gen_subscriber

        subscriber.setsockopt(ZMQ::SUBSCRIBE, 'EVENT API one.vm.update 1')

        key     = ''
        content = ''

        loop do
            rc = subscriber.recv_string(key)
            rc = subscriber.recv_string(content) if rc != -1

            # rubocop:disable Style/GuardClause
            if rc == -1 && ZMQ::Util.errno != ZMQ::EAGAIN
                next Log.error LOG_COMP, 'Error reading from subscriber.'
            elsif rc == -1
                check_nodes_report
                check_ready

                next
            end

            # rubocop:enable Style/GuardClause

            xml = Nokogiri::XML(Base64.decode64(content))

            id = xml.xpath(
                '//PARAMETER[POSITION=2 and TYPE=\'IN\']/VALUE'
            ).text.to_i
            data = xml.xpath(
                '//PARAMETER[POSITION=3 and TYPE=\'IN\']/VALUE'
            ).text
            data = data.split("\n").map do |part|
                part.match(/(.+)="(.+)"/)[1..2]
            end

            ready = data.find {|v| v[0] == 'READY' }[1]

            # rubocop:disable Style/StringLiterals
            # Remove extra quotes
            ready.gsub!("\"", '')
            ready.gsub!('"', '')
            ready.gsub!(' ', '')
            # rubocop:enable Style/StringLiterals

            next unless ready == 'YES'

            Log.info LOG_COMP, "Node #{id} reported ready"

            @mutex_ready.synchronize do
                service_id = @ready.find do |_, d|
                    next unless d

                    d[:nodes].include?(id)
                end

                if service_id
                    service_id = service_id[0]

                    @ready[service_id][:nodes].delete(id)
                end
            end

            check_ready
        end

        subscriber.setsockopt(ZMQ::UNSUBSCRIBE, 'EVENT API one.vm.update 1')

        subscriber.close
    end

    def add_wait_ready(service_id, role_name, nodes)
        @mutex_ready.synchronize do
            @ready[service_id.to_i] = {}

            @ready[service_id.to_i][:role]  = role_name
            @ready[service_id.to_i][:nodes] = nodes
        end

        check_nodes_report
        check_ready
    end

    private

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
        subscriber.setsockopt(ZMQ::RCVTIMEO, @wait_timeout * 10**3)
        subscriber.connect(@conf[:subscriber_endpoint])

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
    # @param client       [OpenNebula::Client] Client to make API calls
    # @param service_pool [ServicePool]        All services to check
    def check_roles_state(client, service_pool)
        service_pool.each do |service|
            service.info

            if service.state != Service::STATE['RUNNING'] &&
               service.state != Service::STATE['WARNING']
                next
            end

            @mutex.synchronize do
                @services << service.id.to_i
            end

            service.roles.each do |name, role|
                role.nodes_ids.each do |node|
                    check_role_state(client, service.id, name, node)
                end
            end
        end
    end

    def check_nodes_report
        client = @cloud_auth.client

        @mutex_ready.synchronize do
            @ready.each do |_service_id, data|
                data[:nodes].delete_if do |node|
                    vm = OpenNebula::VirtualMachine.new_with_id(node, client)

                    vm.info

                    if vm['/VM/USER_TEMPLATE/READY'] == 'YES'
                        next true
                    end

                    vm_lcm_state = OpenNebula::VirtualMachine::LCM_STATE[
                        vm.lcm_state
                    ]

                    # if the VM is in failure, it won't report ready
                    if EventManager::FAILURE_STATES.include? vm_lcm_state
                        Log.error LOG_COMP, "Node #{node} is in FAILURE state"
                        next false
                    end

                    # if !READY and VM is not in failure state, keep waiting
                    false
                end
            end
        end
    end

    def check_ready
        @mutex_ready.synchronize do
            @ready.each do |service_id, data|
                next unless data

                next unless data[:nodes].empty?

                @lcm.trigger_action(:deploy_cb,
                                    service_id,
                                    client,
                                    service_id,
                                    data[:role])

                @ready.delete(service_id)
            end
        end
    end

    ############################################################################
    # HELPERS
    ############################################################################

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
