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

require 'ActionManager'
require 'ffi-rzmq'

# OneFlow Event Manager
class EventManager

    attr_writer :lcm
    attr_reader :am

    LOG_COMP = 'EM'

    ACTIONS = {
        'WAIT_DEPLOY'    => :wait_deploy,
        'WAIT_UNDEPLOY'  => :wait_undeploy,
        'WAIT_SCALEUP'   => :wait_scaleup,
        'WAIT_SCALEDOWN' => :wait_scaledown,
        'WAIT_COOLDOWN'  => :wait_cooldown
    }

    FAILURE_STATES = %w[
        BOOT_FAILURE
        BOOT_MIGRATE_FAILURE
        PROLOG_MIGRATE_FAILURE
        PROLOG_FAILURE
        EPILOG_FAILURE
        EPILOG_STOP_FAILURE
        EPILOG_UNDEPLOY_FAILURE
        PROLOG_MIGRATE_POWEROFF_FAILURE
        PROLOG_MIGRATE_SUSPEND_FAILURE
        PROLOG_MIGRATE_UNKNOWN_FAILURE
        BOOT_UNDEPLOY_FAILURE
        BOOT_STOPPED_FAILURE
        PROLOG_RESUME_FAILURE
        PROLOG_UNDEPLOY_FAILURE
    ]

    SUBSCRIBE_STATES = %w[
        STOPPED
        SUSPENDED
        POWEROFF
        UNDEPLOYED
    ]

    # --------------------------------------------------------------------------
    # Default configuration options for the module
    # --------------------------------------------------------------------------
    DEFAULT_CONF = {
        :subscriber_endpoint  => 'tcp://localhost:2101',
        :cloud_auth  => nil,
        :am          => nil
    }

    def initialize(options)
        @conf = DEFAULT_CONF.merge(options)

        @cloud_auth = @conf[:cloud_auth]
        @lcm        = options[:lcm]
        @am         = ActionManager.new(@cloud_auth.conf[:concurrency], true)

        @context      = ZMQ::Context.new(1)
        @wait_timeout = @cloud_auth.conf[:wait_timeout]

        # Register Action Manager actions
        @am.register_action(ACTIONS['WAIT_DEPLOY'],
                            method('wait_deploy_action'))
        @am.register_action(ACTIONS['WAIT_UNDEPLOY'],
                            method('wait_undeploy_action'))
        @am.register_action(ACTIONS['WAIT_COOLDOWN'],
                            method('wait_cooldown'))
        @am.register_action(ACTIONS['WAIT_SCALEUP'],
                            method('wait_scaleup_action'))
        @am.register_action(ACTIONS['WAIT_SCALEDOWN'],
                            method('wait_scaledown_action'))

        Thread.new { @am.start_listener }
    end

    ############################################################################
    # Actions
    ############################################################################

    # Wait for nodes to be in RUNNING if OneGate check required it will trigger
    # another action after VMs are RUNNING
    # @param [Service] service the service
    # @param [Role] the role which contains the VMs
    # @param [Node] nodes the list of nodes (VMs) to wait for
    def wait_deploy_action(client, service_id, role_name, nodes, report)
        if report
            Log.info LOG_COMP, "Waiting #{nodes} to report ready"
            rc = wait_report_ready(nodes)
        else
            Log.info LOG_COMP, "Waiting #{nodes} to be (ACTIVE, RUNNING)"
            rc = wait(nodes, 'ACTIVE', 'RUNNING')
        end

        if rc[0]
            @lcm.trigger_action(:deploy_cb,
                                service_id,
                                client,
                                service_id,
                                role_name,
                                rc[1])
        else
            @lcm.trigger_action(:deploy_failure_cb,
                                service_id,
                                client,
                                service_id,
                                role_name)
        end
    end

    # Wait for nodes to be in DONE
    # @param [service_id] the service id
    # @param [role_name] the role name of the role which contains the VMs
    # @param [nodes] the list of nodes (VMs) to wait for
    def wait_undeploy_action(client, service_id, role_name, nodes)
        Log.info LOG_COMP, "Waiting #{nodes} to be (DONE, LCM_INIT)"
        rc = wait(nodes, 'DONE', 'LCM_INIT')

        if rc[0]
            @lcm.trigger_action(:undeploy_cb,
                                service_id,
                                client,
                                service_id,
                                role_name,
                                rc[1])
        else
            @lcm.trigger_action(:undeploy_failure_cb,
                                service_id,
                                client,
                                service_id,
                                role_name,
                                rc[1])
        end
    end

    # Wait for nodes to be in RUNNING if OneGate check required it will trigger
    # another action after VMs are RUNNING
    # @param [Service] service the service
    # @param [Role] the role which contains the VMs
    # @param [Node] nodes the list of nodes (VMs) to wait for
    # @param [Bool] up true if scalling up false otherwise
    def wait_scaleup_action(client, service_id, role_name, nodes, report)
        if report
            Log.info LOG_COMP, "Waiting #{nodes} to report ready"
            rc = wait_report_ready(nodes)
        else
            Log.info LOG_COMP, "Waiting #{nodes} to be (ACTIVE, RUNNING)"
            rc = wait(nodes, 'ACTIVE', 'RUNNING')
        end

        if rc[0]
            @lcm.trigger_action(:scaleup_cb,
                                service_id,
                                client,
                                service_id,
                                role_name,
                                rc[1])
        else
            @lcm.trigger_action(:scaleup_failure_cb,
                                service_id,
                                client,
                                service_id,
                                role_name)
        end
    end

    def wait_scaledown_action(client, service_id, role_name, nodes)
        Log.info LOG_COMP, "Waiting #{nodes} to be (DONE, LCM_INIT)"

        rc = wait(nodes, 'DONE', 'LCM_INIT')

        if rc[0]
            @lcm.trigger_action(:scaledown_cb,
                                service_id,
                                client,
                                service_id,
                                role_name,
                                rc[1])
        else
            @lcm.trigger_action(:scaledown_failure_cb,
                                service_id,
                                client,
                                service_id,
                                role_name,
                                rc[1])
        end
    end

    # Wait for nodes to be in DONE
    # @param [service_id] the service id
    # @param [role_name] the role name of the role which contains the VMs
    # @param [nodes] the list of nodes (VMs) to wait for
    def wait_cooldown(client, service_id, role_name, cooldown_time)
        Log.info LOG_COMP, "Waiting #{cooldown_time}s for cooldown for " \
                           "service #{service_id} and role #{role_name}."

        sleep cooldown_time.to_i

        @lcm.trigger_action(:cooldown_cb,
                            service_id,
                            client,
                            service_id,
                            role_name)
    end

    private

    ############################################################################
    # Helpers
    ############################################################################

    def retrieve_id(key)
        key.split('/')[-1].to_i
    end

    def wait(nodes, state, lcm_state)
        subscriber = gen_subscriber

        rc_nodes = { :successful => {}, :failure => {} }
        rc       = check_nodes(nodes, state, lcm_state, subscriber)

        # rc_nodes[:successful] has the following structure
        #
        #   node_id => boolean
        #
        # = true means the VM was deleted by external user
        # = false means the VM state is in SUBSCRIBE_STATES
        rc_nodes[:successful].merge!(rc[:successful])
        rc_nodes[:failure].merge!(rc[:failure])

        if nodes.empty? && rc_nodes[:failure].empty?
            subscriber.close

            return [true, rc_nodes]
        end

        nodes.each do |node|
            subscribe(node, state, lcm_state, subscriber)

            (SUBSCRIBE_STATES + ['DONE']).each do |s|
                subscribe(node, s, 'LCM_INIT', subscriber)
            end
        end

        key = ''
        content = ''

        until nodes.empty?
            rc = subscriber.recv_string(key)
            rc = subscriber.recv_string(content) if rc != -1

            if rc == -1 && ZMQ::Util.errno != ZMQ::EAGAIN
                next Log.error LOG_COMP, 'Error reading from subscriber.'
            elsif rc == -1
                Log.info LOG_COMP, "Timeout reached for VM #{nodes} =>"\
                                   " (#{state}, #{lcm_state})"

                rc = check_nodes(nodes, state, lcm_state, subscriber)

                rc_nodes[:successful].merge!(rc[:successful])
                rc_nodes[:failure].merge!(rc[:failure])

                next if !nodes.empty? && rc_nodes[:failure].empty?

                nodes.each do |id|
                    unsubscribe(id, state, lcm_state, subscriber)

                    (SUBSCRIBE_STATES + ['DONE']).each do |s|
                        unsubscribe(id, s, 'LCM_INIT', subscriber)
                    end
                end

                # If any node is in error wait action will fails
                return [false, rc_nodes] unless rc_nodes[:failure].empty?

                return [true, rc_nodes] # (nodes.empty? && fail_nodes.empty?)
            end

            id = retrieve_id(key)
            rc = check_nodes([id], state, lcm_state, subscriber)

            rc_nodes[:successful].merge!(rc[:successful])
            rc_nodes[:failure].merge!(rc[:failure])

            nodes.delete(id)

            unsubscribe(id, state, lcm_state, subscriber)

            (SUBSCRIBE_STATES + ['DONE']).each do |s|
                unsubscribe(id, s, 'LCM_INIT', subscriber)
            end
        end

        subscriber.close

        [true, rc_nodes]
    end

    def wait_report_ready(nodes)
        rc_nodes = { :successful => {}, :failure => {} }
        rc       = check_nodes_report(nodes)

        # rc_nodes[:successful] has the following structure
        #
        #   node_id => boolean
        #
        # = true means the VM was deleted by external user
        # = false means the VM state is in SUBSCRIBE_STATES
        rc_nodes[:successful].merge!(rc[:successful])
        rc_nodes[:failure].merge!(rc[:failure])

        return [true, rc_nodes] if nodes.empty? && rc_nodes[:failure].empty?

        subscriber = gen_subscriber

        subscriber.setsockopt(ZMQ::SUBSCRIBE, 'EVENT API one.vm.update 1')

        nodes.each do |node|
            (SUBSCRIBE_STATES + ['DONE']).each do |s|
                subscribe(node, s, 'LCM_INIT', subscriber)
            end
        end

        key     = ''
        content = ''

        until nodes.empty?
            rc = subscriber.recv_string(key)
            rc = subscriber.recv_string(content) if rc != -1

            # rubocop:disable Style/GuardClause
            if rc == -1 && ZMQ::Util.errno != ZMQ::EAGAIN
                next Log.error LOG_COMP, 'Error reading from subscriber.'
            elsif rc == -1
                Log.info LOG_COMP, "Timeout reached for VM #{nodes} to report"

                rc = check_nodes_report(nodes)

                rc_nodes[:successful].merge!(rc[:successful])
                rc_nodes[:failure].merge!(rc[:failure])

                next if !nodes.empty? && rc_nodes[:failure].empty?

                subscriber.setsockopt(ZMQ::UNSUBSCRIBE,
                                      'EVENT API one.vm.update 1')

                nodes.each do |node|
                    (SUBSCRIBE_STATES + ['DONE']).each do |s|
                        unsubscribe(node, s, 'LCM_INIT', subscriber)
                    end
                end

                # If any node is in error wait action will fails
                return [false, rc_nodes] unless rc_nodes[:failure].empty?

                return [true, rc_nodes] # (nodes.empty? && fail_nodes.empty?)
            end

            # rubocop:enable Style/GuardClause

            id = retrieve_id(key)
            rc = check_nodes_report([id])

            rc_nodes[:successful].merge!(rc[:successful])
            rc_nodes[:failure].merge!(rc[:failure])

            unless rc[:successful].empty?
                nodes.delete(id)

                (SUBSCRIBE_STATES + ['DONE']).each do |s|
                    unsubscribe(id, s, 'LCM_INIT', subscriber)
                end

                next
            end

            xml = Nokogiri::XML(Base64.decode64(content))

            id = xml.xpath(
                '//PARAMETER[POSITION=2 and TYPE=\'IN\']/VALUE'
            ).text.to_i
            ready = xml.xpath(
                '//PARAMETER[POSITION=3 and TYPE=\'IN\']/VALUE'
            ).text

            # rubocop:disable Style/StringLiterals
            # Remove extra quotes
            ready.gsub!("\"", '')
            ready.gsub!('"', '')
            ready.gsub!(' ', '')
            # rubocop:enable Style/StringLiterals

            next if !ready.match('READY=YES') || !nodes.include?(id)

            Log.info LOG_COMP, "Node #{id} reported ready"

            (SUBSCRIBE_STATES + ['DONE']).each do |s|
                unsubscribe(id, s, 'LCM_INIT', subscriber)
            end

            nodes.delete(id)
            rc_nodes[:successful][id] = false
        end

        subscriber.setsockopt(ZMQ::UNSUBSCRIBE, 'EVENT API one.vm.update 1')

        subscriber.close

        [true, rc_nodes]
    end

    def check_nodes(nodes, state, lcm_state, subscriber)
        rc_nodes = { :successful => {}, :failure => {} }

        nodes.delete_if do |node|
            vm = OpenNebula::VirtualMachine
                 .new_with_id(node, @cloud_auth.client)

            vm.info

            vm_state     = OpenNebula::VirtualMachine::VM_STATE[vm.state]
            vm_lcm_state = OpenNebula::VirtualMachine::LCM_STATE[vm.lcm_state]

            Log.info LOG_COMP,
                     "Node #{node} reached (#{vm_state},#{vm_lcm_state})"

            if vm_state == 'DONE' ||
               (vm_state == state && vm_lcm_state == lcm_state)
                unsubscribe(node, state, lcm_state, subscriber)

                rc_nodes[:successful][node] = true
                next true
            elsif SUBSCRIBE_STATES.include?(vm_state)
                rc_nodes[:successful][node] = false
                next true
            end

            if FAILURE_STATES.include? vm_lcm_state
                Log.error LOG_COMP, "Node #{node} is in FAILURE state"

                rc_nodes[:failure][node] = false

                next true
            end

            false
        end

        rc_nodes
    end

    def check_nodes_report(nodes)
        rc_nodes = { :successful => {}, :failure => {} }

        nodes.delete_if do |node|
            vm = OpenNebula::VirtualMachine.new_with_id(node,
                                                        @cloud_auth.client)

            vm.info

            vm_state     = OpenNebula::VirtualMachine::VM_STATE[vm.state]
            vm_lcm_state = OpenNebula::VirtualMachine::LCM_STATE[vm.lcm_state]

            if vm_state == 'DONE'
                rc_nodes[:successful][node] = true
                next true
            elsif SUBSCRIBE_STATES.include?(vm_state)
                rc_nodes[:successful][node] = false
                next true
            end

            if vm['/VM/USER_TEMPLATE/READY'] &&
               vm['/VM/USER_TEMPLATE/READY'].strip == 'YES'
                rc_nodes[:successful][node] = false

                next true
            end

            # if the VM is in failure, it won't report ready
            if FAILURE_STATES.include? vm_lcm_state
                Log.error LOG_COMP, "Node #{node} is in FAILURE state"

                rc_nodes[:failure][node] = false

                next true
            end

            # if !READY and VM is not in failure state, keep waiting
            false
        end

        rc_nodes
    end

    ############################################################################
    #  Functionns to subscribe/unsuscribe to event changes on VM
    ############################################################################

    def gen_subscriber
        subscriber = @context.socket(ZMQ::SUB)
        # Set timeout (TODO add option for customize timeout)
        subscriber.setsockopt(ZMQ::RCVTIMEO, @wait_timeout * 10**3)
        subscriber.connect(@conf[:subscriber_endpoint])

        subscriber
    end

    def subscribe(vm_id, state, lcm_state, subscriber)
        subscriber.setsockopt(ZMQ::SUBSCRIBE,
                              gen_filter(vm_id, state, lcm_state))
    end

    def unsubscribe(vm_id, state, lcm_state, subscriber)
        subscriber.setsockopt(ZMQ::UNSUBSCRIBE,
                              gen_filter(vm_id, state, lcm_state))
    end

    def gen_filter(vm_id, state, lcm_state)
        "EVENT STATE VM/#{state}/#{lcm_state}/#{vm_id}"
    end

end
# rubocop:enable Naming/FileName
