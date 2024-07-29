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

require 'ActionManager'
require 'ffi-rzmq'

# OneFlow Event Manager
class EventManager

    attr_writer :lcm
    attr_reader :am

    LOG_COMP = 'EM'

    ACTIONS = [
        :wait_deploy_action,
        :wait_undeploy_action,
        :wait_scaleup_action,
        :wait_scaledown_action,
        :wait_add_action,
        :wait_remove_action,
        :wait_cooldown_action,
        :wait_deploy_nets_action,
        :wait_undeploy_nets_action,
        :wait_hold_action,
        :wait_release_action
    ]

    FAILURE_STATES = [
        'BOOT_FAILURE',
        'BOOT_MIGRATE_FAILURE',
        'PROLOG_MIGRATE_FAILURE',
        'PROLOG_FAILURE',
        'EPILOG_FAILURE',
        'EPILOG_STOP_FAILURE',
        'EPILOG_UNDEPLOY_FAILURE',
        'PROLOG_MIGRATE_POWEROFF_FAILURE',
        'PROLOG_MIGRATE_SUSPEND_FAILURE',
        'PROLOG_MIGRATE_UNKNOWN_FAILURE',
        'BOOT_UNDEPLOY_FAILURE',
        'BOOT_STOPPED_FAILURE',
        'PROLOG_RESUME_FAILURE',
        'PROLOG_UNDEPLOY_FAILURE'
    ]

    SUBSCRIBE_STATES = [
        'STOPPED',
        'SUSPENDED',
        'POWEROFF',
        'UNDEPLOYED'
    ]

    # --------------------------------------------------------------------------
    # Default configuration options for the module
    # --------------------------------------------------------------------------
    DEFAULT_CONF = {
        :cloud_auth  => nil,
        :am          => nil
    }

    def initialize(options)
        @conf = DEFAULT_CONF.merge(options)

        @cloud_auth = @conf[:cloud_auth]
        @lcm        = options[:lcm]
        @am         = ActionManager.new(@cloud_auth.conf[:concurrency], true)

        @context             = ZMQ::Context.new(1)
        @wait_timeout        = @cloud_auth.conf[:wait_timeout]
        @subscriber_endpoint = @cloud_auth.conf[:subscriber_endpoint]

        # Register Action Manager actions

        ACTIONS.each do |m|
            @am.register_action(m, method(m.to_s))
        end

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
    def wait_deploy_action(external_user, service_id, role_name, nodes, report)
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
                                external_user,
                                service_id,
                                role_name,
                                rc[1])
        else
            @lcm.trigger_action(:deploy_failure_cb,
                                service_id,
                                external_user,
                                service_id,
                                role_name)
        end
    end

    # Wait for networks to e ready
    #
    # @param external_user [String]  External user to impersonate
    # @param service_id    [Integer] Service ID
    # @param networks      [Array]   Network IDs to wait until ready
    def wait_deploy_nets_action(external_user, service_id, networks)
        Log.info LOG_COMP, "Waiting networks #{networks} to be (READY)"
        rc = wait_nets(networks, 'READY')

        if rc[0]
            action = :deploy_nets_cb
        else
            action = :deploy_nets_failure_cb
        end

        @lcm.trigger_action(action, service_id, external_user, service_id)
    end

    # Wait for networks to e ready
    #
    # @param external_user [String]  External user to impersonate
    # @param service_id [Integer]            Service ID
    # @param networks   [Array]              Network IDs to wait until ready
    def wait_undeploy_nets_action(external_user, service_id, networks)
        Log.info LOG_COMP, "Waiting networks #{networks} to be (DONE)"
        rc = wait_nets(networks, 'DONE')

        if rc[0]
            action = :undeploy_nets_cb
        else
            action = :undeploy_nets_failure_cb
        end

        @lcm.trigger_action(action, service_id, external_user, service_id)
    end

    # Wait for nodes to be in DONE
    # @param [String]  External user to impersonate for performing the action
    # @param [service_id] the service id
    # @param [role_name] the role name of the role which contains the VMs
    # @param [nodes] the list of nodes (VMs) to wait for
    def wait_undeploy_action(external_user, service_id, role_name, nodes)
        Log.info LOG_COMP, "Waiting #{nodes} to be (DONE, LCM_INIT)"
        rc = wait(nodes, 'DONE', 'LCM_INIT')

        if rc[0]
            @lcm.trigger_action(:undeploy_cb,
                                service_id,
                                external_user,
                                service_id,
                                role_name,
                                rc[1])
        else
            @lcm.trigger_action(:undeploy_failure_cb,
                                service_id,
                                external_user,
                                service_id,
                                role_name,
                                rc[1])
        end
    end

    # Wait for nodes to be in RUNNING if OneGate check required it will trigger
    # another action after VMs are RUNNING
    # @param [String]  External user to impersonate for performing the action
    # @param [Service] service the service
    # @param [Role] the role which contains the VMs
    # @param [Node] nodes the list of nodes (VMs) to wait for
    # @param [Bool] up true if scalling up false otherwise
    def wait_scaleup_action(external_user, service_id, role_name, nodes, report)
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
                                external_user,
                                service_id,
                                role_name,
                                rc[1])
        else
            @lcm.trigger_action(:scaleup_failure_cb,
                                service_id,
                                external_user,
                                service_id,
                                role_name)
        end
    end

    def wait_scaledown_action(external_user, service_id, role_name, nodes)
        Log.info LOG_COMP, "Waiting #{nodes} to be (DONE, LCM_INIT)"

        rc = wait(nodes, 'DONE', 'LCM_INIT')

        if rc[0]
            @lcm.trigger_action(:scaledown_cb,
                                service_id,
                                external_user,
                                service_id,
                                role_name,
                                rc[1])
        else
            @lcm.trigger_action(:scaledown_failure_cb,
                                service_id,
                                external_user,
                                service_id,
                                role_name,
                                rc[1])
        end
    end

    def wait_add_action(external_user, service_id, role_name, nodes, report)
        if report
            Log.info LOG_COMP, "Waiting #{nodes} to report ready"
            rc = wait_report_ready(nodes)
        else
            Log.info LOG_COMP, "Waiting #{nodes} to be (ACTIVE, RUNNING)"
            rc = wait(nodes, 'ACTIVE', 'RUNNING')
        end

        if rc[0]
            @lcm.trigger_action(:add_cb,
                                service_id,
                                external_user,
                                service_id,
                                role_name,
                                rc[1])
        else
            @lcm.trigger_action(:add_failure_cb,
                                service_id,
                                external_user,
                                service_id,
                                role_name)
        end
    end

    # Wait for nodes to be in DONE
    # @param [String]  External user to impersonate for performing the action
    # @param [service_id] the service id
    # @param [role_name] the role name of the role which contains the VMs
    # @param [nodes] the list of nodes (VMs) to wait for
    def wait_remove_action(external_user, service_id, role_name, nodes)
        Log.info LOG_COMP, "Waiting #{nodes} to be (DONE, LCM_INIT)"
        rc = wait(nodes, 'DONE', 'LCM_INIT')

        if rc[0]
            @lcm.trigger_action(:remove_cb,
                                service_id,
                                external_user,
                                service_id,
                                role_name,
                                rc[1])
        else
            @lcm.trigger_action(:remove_failure_cb,
                                service_id,
                                external_user,
                                service_id,
                                role_name,
                                rc[1])
        end
    end

    # Wait for nodes to be in DONE
    # @param [String]  External user to impersonate for performing the action
    # @param [service_id] the service id
    # @param [role_name] the role name of the role which contains the VMs
    # @param [nodes] the list of nodes (VMs) to wait for
    # rubocop:disable Layout/LineLength
    def wait_cooldown_action(external_user, service_id, role_name, cooldown_time)
        Log.info LOG_COMP, "Waiting #{cooldown_time}s for cooldown for " \
                           "service #{service_id} and role #{role_name}."

        sleep cooldown_time.to_i

        @lcm.trigger_action(:cooldown_cb,
                            service_id,
                            external_user,
                            service_id,
                            role_name)
    end
    # rubocop:enable Layout/LineLength

    # Wait for nodes to be in HOLD
    # @param [String]  External user to impersonate for performing the action
    # @param [service_id] the service id
    # @param [role_name] the role name of the role which contains the VMs
    # @param [nodes] the list of nodes (VMs) to wait for
    def wait_hold_action(external_user, service_id, role_name, nodes)
        Log.info LOG_COMP, "Waiting #{nodes} to be (HOLD, LCM_INIT)"
        wait(nodes, 'HOLD', 'LCM_INIT')

        @lcm.trigger_action(:hold_cb,
                            service_id,
                            external_user,
                            service_id,
                            role_name)
    end

    # Wait for nodes to be in RUNNING if OneGate check required it will trigger
    # another action after VMs are RUNNING
    # @param [String]  External user to impersonate for performing the action
    # @param [Service] service the service
    # @param [Role] the role which contains the VMs
    # @param [Node] nodes the list of nodes (VMs) to wait for
    def wait_release_action(external_user, service_id, role_name, nodes, report)
        if report
            Log.info LOG_COMP, "Waiting #{nodes} to report ready"
            rc = wait_report_ready(nodes)
        else
            Log.info LOG_COMP, "Waiting #{nodes} to be (ACTIVE, RUNNING)"
            rc = wait(nodes, 'ACTIVE', 'RUNNING')
        end

        if rc[0]
            @lcm.trigger_action(:release_cb,
                                service_id,
                                external_user,
                                service_id,
                                role_name,
                                rc[1])
        else
            @lcm.trigger_action(:deploy_failure_cb,
                                service_id,
                                external_user,
                                service_id,
                                role_name)
        end
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
            subscribe(subscriber, 'VM', node, state, lcm_state)

            (SUBSCRIBE_STATES + ['DONE']).each do |s|
                subscribe(subscriber, 'VM', node, s, 'LCM_INIT')
            end
        end

        key = ''
        content = ''

        until nodes.empty?
            rc = subscriber.recv_string(key)
            rc = subscriber.recv_string(content) if rc != -1

            # rubocop:disable Style/GuardClause
            if rc == -1 && ZMQ::Util.errno != ZMQ::EAGAIN
                # rubocop:enable Style/GuardClause
                next Log.error LOG_COMP, 'Error reading from subscriber.'
            elsif rc == -1
                Log.info LOG_COMP, "Timeout reached for VM #{nodes} =>"\
                                   " (#{state}, #{lcm_state})"

                rc = check_nodes(nodes, state, lcm_state, subscriber)

                rc_nodes[:successful].merge!(rc[:successful])
                rc_nodes[:failure].merge!(rc[:failure])

                next if !nodes.empty? && rc_nodes[:failure].empty?

                nodes.each do |id|
                    unsubscribe(subscriber, 'VM', id, state, lcm_state)

                    (SUBSCRIBE_STATES + ['DONE']).each do |s|
                        unsubscribe(subscriber, 'VM', id, s, 'LCM_INIT')
                    end
                end

                # If any node is in error wait action will fails
                return [false, rc_nodes] unless rc_nodes[:failure].empty?

                return [true, rc_nodes] # (nodes.empty? && fail_nodes.empty?)
            end

            states = { :state => state, :lcm_state => lcm_state }
            rc     = check_nodes_event(nodes, states, key, content, subscriber)

            rc_nodes[:successful].merge!(rc[:successful])
            rc_nodes[:failure].merge!(rc[:failure])
        end

        subscriber.close

        [true, rc_nodes]
    end

    def wait_nets(networks, state)
        subscriber = gen_subscriber

        rc_nets = { :successful => {}, :failure => {} }
        rc      = check_nets(networks, state, subscriber)

        # rc_nets[:successful] has the following structure
        #
        #   vnet_id => boolean
        #
        # = true means the VNET was deleted by external user
        # = false means the VNET state is in SUBSCRIBE_STATES
        rc_nets[:successful].merge!(rc[:successful])
        rc_nets[:failure].merge!(rc[:failure])

        if networks.empty? && rc_nets[:failure].empty?
            subscriber.close

            return [true, rc_nets]
        end

        networks.each do |network|
            [state, 'DONE', 'ERROR'].each do |s|
                subscribe(subscriber, 'NET', network, s)
            end
        end

        key     = ''
        content = ''

        until networks.empty?
            rc = subscriber.recv_string(key)
            rc = subscriber.recv_string(content) if rc != -1

            # rubocop:disable Style/GuardClause
            if rc == -1 && ZMQ::Util.errno != ZMQ::EAGAIN
                # rubocop:enable Style/GuardClause
                next Log.error LOG_COMP, 'Error reading from subscriber.'
            elsif rc == -1
                Log.info LOG_COMP, "Timeout reached for VNET #{networks} =>"\
                                   " (#{state})"

                rc = check_nets(networks, state, subscriber)

                rc_nets[:successful].merge!(rc[:successful])
                rc_nets[:failure].merge!(rc[:failure])

                next if !networks.empty? && rc_nets[:failure].empty?

                networks.each do |network|
                    [state, 'DONE', 'ERROR'].each do |s|
                        unsubscribe(subscriber, 'NET', network, s)
                    end
                end

                # If any node is in error wait action will fails
                return [false, rc_nets] unless rc_nets[:failure].empty?

                return [true, rc_nets] # (networks.empty? && fail_nets.empty?)
            end

            # Read information from hook message
            id      = retrieve_id(key)
            xml     = Nokogiri::XML(Base64.decode64(content))
            h_state = xml.xpath('//HOOK_MESSAGE/STATE').text

            Log.info LOG_COMP, "VNET #{id} reached (#{h_state})"

            case h_state
            when 'DONE'
                rc_nets[:successful][id] = true
            when 'ERROR'
                Log.error LOG_COMP, "VNET #{id} is in ERROR state"
                rc_nets[:failure][id] = false
            when h_state == state
                rc_nets[:successful][id] = false
            end

            [state, 'DONE', 'ERROR'].each do |s|
                unsubscribe(subscriber, 'NET', id, s)
            end

            networks.delete(id)
        end

        subscriber.close

        return [false, rc_nets] unless rc_nets[:failure].empty?

        [true, rc_nets]
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
                subscribe(subscriber, 'VM', node, s, 'LCM_INIT')
            end
        end

        key     = ''
        content = ''

        until nodes.empty?
            rc = subscriber.recv_string(key)
            rc = subscriber.recv_string(content) if rc != -1

            # rubocop:disable Style/GuardClause
            if rc == -1 && ZMQ::Util.errno != ZMQ::EAGAIN
                # rubocop:enable Style/GuardClause
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
                        unsubscribe(subscriber, 'VM', node, s, 'LCM_INIT')
                    end
                end

                # If any node is in error wait action will fails
                return [false, rc_nodes] unless rc_nodes[:failure].empty?

                return [true, rc_nodes] # (nodes.empty? && fail_nodes.empty?)
            end

            rc = check_nodes_event(nodes, {}, key, content, subscriber)

            if rc.is_a? Array
                next if !rc[1].match('READY=YES') || !nodes.include?(rc[0])
            else
                rc_nodes[:successful].merge!(rc[:successful])
                rc_nodes[:failure].merge!(rc[:failure])

                next
            end

            Log.info LOG_COMP, "Node #{rc[0]} reported ready"

            (SUBSCRIBE_STATES + ['DONE']).each do |s|
                unsubscribe(subscriber, 'VM', rc[0], s, 'LCM_INIT')
            end

            nodes.delete(rc[0])

            rc_nodes[:successful][rc[0]] = false
        end

        subscriber.setsockopt(ZMQ::UNSUBSCRIBE, 'EVENT API one.vm.update 1')

        subscriber.close

        [true, rc_nodes]
    end

    def check_nodes_event(nodes, states, key, content, subscriber)
        xml = Nokogiri::XML(Base64.decode64(content))

        # Read states we are waiting for
        state     = states[:state]
        lcm_state = states[:lcm_state]

        if key.include?('one.vm.update')
            id = Integer(xml.xpath(
                '//PARAMETER[POSITION=2 and TYPE=\'IN\']/VALUE'
            ).text)
            ready = xml.xpath(
                '//PARAMETER[POSITION=3 and TYPE=\'IN\']/VALUE'
            ).text

            # rubocop:disable Style/StringLiterals
            # Remove extra quotes
            ready.gsub!("\"", '')
            ready.gsub!('"', '')
            ready.gsub!(' ', '')
            # rubocop:enable Style/StringLiterals

            [id, ready]
        else
            # Read information from hook message
            id          = retrieve_id(key)
            h_state     = xml.xpath('//HOOK_MESSAGE/STATE').text
            h_lcm_state = xml.xpath('//HOOK_MESSAGE/LCM_STATE').text

            rc_nodes = { :successful => {}, :failure => {} }

            Log.info LOG_COMP,
                     "Node #{id} reached (#{h_state}, #{h_lcm_state})"

            if h_state == 'DONE'
                rc_nodes[:successful][id] = true
            elsif h_state == state && h_lcm_state == lcm_state
                rc_nodes[:successful][id] = false
            elsif SUBSCRIBE_STATES.include?(h_state)
                rc_nodes[:successful][id] = false
            end

            if FAILURE_STATES.include? h_lcm_state
                Log.error LOG_COMP, "Node #{id} is in FAILURE state"

                rc_nodes[:failure][id] = false
            else
                unsubscribe(subscriber, 'VM', id, state, lcm_state)

                (SUBSCRIBE_STATES + ['DONE']).each do |s|
                    unsubscribe(subscriber, 'VM', id, s, 'LCM_INIT')
                end

                nodes.delete(id)
            end

            rc_nodes
        end
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
                unsubscribe(subscriber, 'VM', node, state, lcm_state)

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

    def check_nets(networks, state, subscriber)
        rc = { :successful => {}, :failure => {} }

        networks.delete_if do |id|
            vnet = OpenNebula::VirtualNetwork.new_with_id(
                id,
                @cloud_auth.client
            )

            if OpenNebula.is_error?(vnet.info)
                Log.info LOG_COMP, "VNET #{id} reached (#{state})"

                [state, 'ERROR', 'DONE'].each do |s|
                    unsubscribe(subscriber, 'NET', id, s)
                end

                rc[:successful][id] = true
                next true
            end

            vnet_state = OpenNebula::VirtualNetwork::VN_STATES[vnet.state]

            if vnet_state == state
                Log.info LOG_COMP, "VNET #{id} reached (#{vnet_state})"

                [state, 'ERROR', 'DONE'].each do |s|
                    unsubscribe(subscriber, 'NET', id, s)
                end

                rc[:successful][id] = true
                next true
            elsif vnet_state == 'ERROR'
                Log.error LOG_COMP, "VNET #{id} is in FAILURE state"

                [state, 'ERROR', 'DONE'].each do |s|
                    unsubscribe(subscriber, 'NET', id, s)
                end

                rc[:failure][id] = false
                next true
            end

            false
        end

        rc
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
    # Functionns to subscribe/unsuscribe to event changes on VM/VNET
    ############################################################################

    def gen_subscriber
        subscriber = @context.socket(ZMQ::SUB)

        subscriber.setsockopt(ZMQ::RCVTIMEO, @wait_timeout * 10**3)
        subscriber.connect(@subscriber_endpoint)

        subscriber
    end

    def subscribe(subscriber, object, id, state, lcm_state = nil)
        subscriber.setsockopt(
            ZMQ::SUBSCRIBE,
            gen_filter(object, id, state, lcm_state)
        )
    end

    def unsubscribe(subscriber, object, id, state, lcm_state = nil)
        subscriber.setsockopt(
            ZMQ::UNSUBSCRIBE,
            gen_filter(object, id, state, lcm_state)
        )
    end

    def gen_filter(object, id, state, lcm_state)
        "EVENT STATE #{object}/#{state}/#{lcm_state}/#{id}"
    end

end
