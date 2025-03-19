# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

module OpenNebula

    # Service class as wrapper of DocumentJSON
    class Service < DocumentJSON

        attr_reader :roles, :client

        DOCUMENT_TYPE = 100

        STATE = {
            'PENDING'                 => 0,
            'DEPLOYING'               => 1,
            'RUNNING'                 => 2,
            'UNDEPLOYING'             => 3,
            'WARNING'                 => 4,
            'DONE'                    => 5,
            'FAILED_UNDEPLOYING'      => 6,
            'FAILED_DEPLOYING'        => 7,
            'SCALING'                 => 8,
            'FAILED_SCALING'          => 9,
            'COOLDOWN'                => 10,
            'DEPLOYING_NETS'          => 11,
            'UNDEPLOYING_NETS'        => 12,
            'FAILED_DEPLOYING_NETS'   => 13,
            'FAILED_UNDEPLOYING_NETS' => 14,
            'HOLD'                    => 15
        }

        STATE_STR = [
            'PENDING',
            'DEPLOYING',
            'RUNNING',
            'UNDEPLOYING',
            'WARNING',
            'DONE',
            'FAILED_UNDEPLOYING',
            'FAILED_DEPLOYING',
            'SCALING',
            'FAILED_SCALING',
            'COOLDOWN',
            'DEPLOYING_NETS',
            'UNDEPLOYING_NETS',
            'FAILED_DEPLOYING_NETS',
            'FAILED_UNDEPLOYING_NETS',
            'HOLD'
        ]

        TRANSIENT_STATES = [
            'DEPLOYING',
            'UNDEPLOYING',
            'SCALING',
            'COOLDOWN',
            'DEPLOYING_NETS',
            'UNDEPLOYING_NETS'
        ]

        FAILED_STATES = [
            'FAILED_DEPLOYING',
            'FAILED_UNDEPLOYING',
            'FAILED_SCALING',
            'FAILED_DEPLOYING_NETS',
            'FAILED_UNDEPLOYING_NETS'
        ]

        RECOVER_DEPLOY_STATES = [
            'FAILED_DEPLOYING',
            'DEPLOYING',
            'PENDING'
        ]

        RECOVER_UNDEPLOY_STATES = [
            'FAILED_UNDEPLOYING',
            'UNDEPLOYING',
            'FAILED_UNDEPLOYING_NETS'
        ]

        RECOVER_SCALE_STATES = [
            'FAILED_SCALING',
            'SCALING'
        ]

        RECOVER_DEPLOY_NETS_STATES = ['DEPLOYING_NETS', 'FAILED_DEPLOYING_NETS']

        RECOVER_UNDEPLOY_NETS_STATES = [
            'UNDEPLOYING_NETS',
            'FAILED_UNDEPLOYING_NETS'
        ]

        # List of attributes that can't be changed in update operation
        #
        # user_inputs: it only has sense when deploying, not in running
        # user_inputs_values: it only has sense when deploying, not in running
        # deployment: changing this, changes the undeploy operation
        # log: this is just internal information, no sense to change it
        # name: this has to be changed using rename operation
        # networks: it only has sense when deploying, not in running
        # networks_values: it only has sense when deploying, not in running
        # ready_status_gate: it only has sense when deploying, not in running
        # state: this is internal information managed by OneFlow server
        # start_time: this is internal information managed by OneFlow server
        IMMUTABLE_ATTRS = [
            'user_inputs',
            'user_inputs_values',
            'deployment',
            'log',
            'name',
            'networks',
            'networks_values',
            'ready_status_gate',
            'state',
            'start_time'
        ]

        LOG_COMP = 'SER'

        # Returns the service name
        # @return [String] the service name
        def name
            @body['name']
        end

        # Returns the service state
        # @return [Integer] the service state
        def state
            @body['state'].to_i
        end

        # Returns the service strategy
        # @return [String] the service strategy
        def strategy
            @body['deployment']
        end

        # Returns the string representation of the service state
        # @return the state string
        def state_str
            STATE_STR[state]
        end

        # Returns true if the service is in transient state
        # @return true if the service is in transient state, false otherwise
        def transient_state?
            TRANSIENT_STATES.include? STATE_STR[state]
        end

        # Return true if the service is in failed state
        # @return true if the service is in failed state, false otherwise
        def failed_state?
            FAILED_STATES.include? STATE_STR[state]
        end

        # Return true if the service can be undeployed
        # @return true if the service can be undeployed, false otherwise
        def can_undeploy?
            # rubocop:disable Style/IfWithBooleanLiteralBranches
            if (transient_state? && state != Service::STATE['UNDEPLOYING']) ||
                state == Service::STATE['DONE'] || failed_state?
                false
            else
                true
            end
            # rubocop:enable Style/IfWithBooleanLiteralBranches
        end

        # Return true if the service can be updated
        # @return true if the service can be updated, false otherwise
        def can_update?
            !transient_state? && !failed_state?
        end

        def can_recover_deploy?
            RECOVER_DEPLOY_STATES.include? STATE_STR[state]
        end

        def can_recover_undeploy?
            RECOVER_UNDEPLOY_STATES.include? STATE_STR[state]
        end

        def can_recover_scale?
            RECOVER_SCALE_STATES.include? STATE_STR[state]
        end

        def can_recover_deploy_nets?
            RECOVER_DEPLOY_NETS_STATES.include?(STATE_STR[state])
        end

        def can_recover_undeploy_nets?
            RECOVER_UNDEPLOY_NETS_STATES.include?(STATE_STR[state])
        end

        # Return true if the service is running
        # @return true if the service is runnning, false otherwise
        def running?
            state_str == 'RUNNING'
        end

        # Returns the running_status_vm option
        # @return [true, false] true if the running_status_vm option is enabled
        def report_ready?
            @body['ready_status_gate']
        end

        def uname
            self['UNAME']
        end

        def uid
            self['UID'].to_i
        end

        def gid
            self['GID'].to_i
        end

        # Returns the on_hold service option
        # @return [true, false] true if the on_hold option is enabled
        def on_hold?
            @body['on_hold']
        end

        # Change the `on_hold` option value
        def on_hold=(on_hold)
            @body['on_hold'] = on_hold
        end

        # Replaces this object's client with a new one
        # @param [OpenNebula::Client] owner_client the new client
        def replace_client(owner_client)
            @client = owner_client
        end

        # Sets a new state
        # @param [Integer] the new state
        # @return [true, false] true if the value was changed
        def state=(state)
            return if state < 0 || state > STATE_STR.size

            @body['state'] = state.to_i

            msg = "New state: #{STATE_STR[state]}"
            Log.info LOG_COMP, msg, id
            log_info(msg)
        end

        # Returns true if all the nodes are correctly deployed
        # @return [true, false] true if all the nodes are correctly deployed
        def all_roles_running?
            @roles.each do |_name, role|
                if role.state != Role::STATE['RUNNING']
                    return false
                end
            end

            true
        end

        # Returns true if all the nodes are in done state
        # @return [true, false] true if all the nodes are correctly deployed
        def all_roles_done?
            @roles.each do |_name, role|
                if role.state != Role::STATE['DONE']
                    return false
                end
            end

            true
        end

        # Returns true if all the nodes are in hold state
        # @return [true, false] true if all the nodes are in hold state
        def all_roles_hold?
            @roles.each do |_name, role|
                if role.state != Role::STATE['HOLD']
                    return false
                end
            end

            true
        end

        # Returns virtual networks IDs
        # @return [Array] Array of integers containing the IDs
        def networks(deploy)
            ret = []

            return ret unless @body['networks_values']

            @body['networks_values'].each do |vnet|
                vnet.each do |_, net|
                    next if net.key?('id') && !deploy

                    ret << net['id'].to_i
                end
            end

            ret
        end

        # Create a new service based on the template provided
        # @param [String] template_json
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(template_json)
            template = JSON.parse(template_json)
            template['state'] = STATE['PENDING']

            if template['roles']
                template['roles'].each do |elem|
                    elem['state'] ||= Role::STATE['PENDING']
                end
            end

            template['start_time'] = Integer(Time.now)

            super(template.to_json, template['name'])
        end

        # Recover a failed service.
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def recover
            if [Service::STATE['FAILED_DEPLOYING']].include?(state)
                @roles.each do |_name, role|
                    if role.state == Role::STATE['FAILED_DEPLOYING']
                        role.state = Role::STATE['PENDING']
                    end
                end

                self.state = Service::STATE['DEPLOYING']

            elsif state == Service::STATE['FAILED_SCALING']
                @roles.each do |_name, role|
                    if role.state == Role::STATE['FAILED_SCALING']
                        role.state = Role::STATE['SCALING']
                    end
                end

                self.state = Service::STATE['SCALING']

            elsif state == Service::STATE['FAILED_UNDEPLOYING']
                @roles.each do |_name, role|
                    if role.state == Role::STATE['FAILED_UNDEPLOYING']
                        role.state = Role::STATE['RUNNING']
                    end
                end

                self.state = Service::STATE['UNDEPLOYING']

            elsif state == Service::STATE['COOLDOWN']
                @roles.each do |_name, role|
                    if role.state == Role::STATE['COOLDOWN']
                        role.state = Role::STATE['RUNNING']
                    end
                end

                self.state = Service::STATE['RUNNING']

            elsif state == Service::STATE['WARNING']
                @roles.each do |_name, role|
                    if role.state == Role::STATE['WARNING']
                        role.recover_warning
                    end
                end
            else
                OpenNebula::Error.new('Action recover: Wrong state' \
                                      " #{state_str}")
            end
        end

        # Retrieves the information of the Service and all its Nodes.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def info
            rc = super
            if OpenNebula.is_error?(rc)
                return rc
            end

            @roles = {}

            if @body['roles']
                @body['roles'].each do |elem|
                    elem['state'] ||= Role::STATE['PENDING']
                    role = Role.for(elem, self)
                    @roles[role.name] = role
                end
            end

            nil
        end

        # Adds a role to the service
        #
        # @param template [Hash] Role information
        #
        # @return [OpenNebula::Role] New role
        def add_role(template)
            template['state'] ||= Role::STATE['PENDING']
            role                = Role.for(template, self)

            if @roles[role.name]
                return OpenNebula::Error.new("Role #{role.name} already exists")
            end

            @roles[role.name] = role
            @body['roles'] << template if @body && @body['roles']

            role
        end

        # Removes a role from the service
        #
        # @param name [String] Role name to delete
        def remove_role(name)
            @roles.delete(name)

            @body['roles'].delete_if do |role|
                role['name'] == name
            end
        end

        # Retrieves the information of the Service and all its Nodes.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def info_roles
            @roles = {}

            if @body['roles']
                @body['roles'].each do |elem|
                    elem['state'] ||= Role::STATE['PENDING']
                    role = Role.for(elem, self)
                    @roles[role.name] = role
                end
            end

            nil
        end

        # Add an info message in the service information that will be stored
        #   in OpenNebula
        # @param [String] message
        def log_info(message)
            add_log(Logger::INFO, message)
        end

        # Add an error message in the service information that will be stored
        #   in OpenNebula
        # @param [String] message
        def log_error(message)
            add_log(Logger::ERROR, message)
        end

        # Changes the owner/group
        #
        # @param [Integer] uid the new owner id. Use -1 to leave the current one
        # @param [Integer] gid the new group id. Use -1 to leave the current one
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chown(uid, gid)
            old_uid = self['UID'].to_i
            old_gid = self['GID'].to_i

            rc = super(uid, gid)

            if OpenNebula.is_error?(rc)
                return rc
            end

            @roles.each do |_name, role|
                rc = role.chown(uid, gid)

                break if rc[0] == false
            end

            if rc[0] == false
                log_error('Chown operation failed, will try to rollback ' \
                          'all VMs to the old user and group')

                update

                super(old_uid, old_gid)

                @roles.each do |_name, role|
                    role.chown(old_uid, old_gid)
                end

                return OpenNebula::Error.new(rc[1])
            end

            nil
        end

        # Updates a role
        # @param [String] role_name
        # @param [String] template_json
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update_role(role_name, template_json)
            if ![Service::STATE['RUNNING'], Service::STATE['WARNING']]
               .include?(state)

                return OpenNebula::Error.new('Update role: Wrong state' \
                                             " #{state_str}")
            end

            template = JSON.parse(template_json)

            # TODO: Validate template?

            role = @roles[role_name]

            if role.nil?
                return OpenNebula::Error.new("ROLE \"#{role_name}\" " \
                                             'does not exist')
            end

            rc = role.update(template)

            if OpenNebula.is_error?(rc)
                return rc
            end

            # TODO: The update may not change the cardinality, only
            # the max and min vms...

            role.state = Role::STATE['SCALING']

            role.set_default_cooldown_duration

            self.state = Service::STATE['SCALING']

            update
        end

        def shutdown_action
            @body['shutdown_action']
        end

        # Replaces the template contents
        #
        # @param template_json [String] New template contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(template_json = nil, append = false)
            if template_json
                template = JSON.parse(template_json)

                if append
                    rc = info

                    if OpenNebula.is_error? rc
                        return rc
                    end

                    template = @body.merge(template)
                end

                template_json = template.to_json
            end

            super(template_json, append)
        end

        # Replaces the raw template contents
        #
        # @param template [String] New template contents, in the form KEY = VAL
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update_raw(template_raw, append = false)
            super(template_raw, append)
        end

        # Check that changes values are correct
        #
        # @param template_json [String]  New template
        # @param append        [Boolean] True to append template to the current
        #
        # @return [Boolean, String] True, nil if everything is correct
        #                           False, attr if attr was changed
        def check_new_template(template_json, append)
            template = JSON.parse(template_json)

            if append
                IMMUTABLE_ATTRS.each do |attr|
                    next if template[attr].nil?

                    return [false, "service/#{attr}"]
                end
            else
                if template['roles'].size != @roles.size
                    return [false, 'service/roles size']
                end

                IMMUTABLE_ATTRS.each do |attr|
                    next if template[attr] == @body[attr]

                    return [false, "service/#{attr}"]
                end

                template['roles'].each do |role|
                    # Role name can't be changed, if it is changed some problems
                    # may appear, as name is used to reference roles
                    return [false, 'name'] unless @roles[role['name']]

                    rc = @roles[role['name']].check_new_template(role)

                    return rc unless rc[0]
                end
            end

            [true, nil]
        end

        # Fills the service template with the provided values.
        #
        # This method replaces placeholders in the service template with corresponding values
        # Placeholders are expected to be in the format $key.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error otherwise
        def fill_template
            generate_template_contents
        rescue StandardError => e
            Log.error LOG_COMP, "Error generating VM template contents: #{e.message}"
            OpenNebula::Error('Error generating VM template contents')
        end

        def deploy_networks(deploy = true)
            body = if deploy
                       JSON.parse(self['TEMPLATE/BODY'])
                   else
                       @body
                   end

            return if body['networks_values'].nil?

            body['networks_values'].each do |vnet|
                vnet.each do |name, net|
                    next if net.key?('id')

                    if net.key?('template_id')
                        rc = create_vnet(name, net)
                    elsif net.key?('reserve_from')
                        rc = reserve(name, net)
                    end

                    return rc if OpenNebula.is_error?(rc)

                    net['id'] = rc
                end
            end if deploy

            # @body = template.to_hash

            update_body(body)
        end

        def delete_networks
            vnets        = @body['networks_values']
            vnets_failed = []

            return if vnets.nil?

            vnets.each do |vnet|
                vnet.each do |_, net|
                    next unless net.key?('template_id') || net.key?('reserve_from')

                    rc = OpenNebula::VirtualNetwork.new_with_id(
                        net['id'],
                        @client
                    ).delete

                    vnets_failed << net['id'] if OpenNebula.is_error?(rc)
                end
            end

            vnets_failed
        end

        def can_scale?
            state == Service::STATE['RUNNING']
        end

        # Check if role is terminated or not
        #
        # @param role [OpenNebula::Role] Role information
        #
        # @return [Boolean]
        #   True if the service should be undeployed
        #   False otherwise
        def check_role(role)
            return unless @body['automatic_deletion']

            return unless role.nodes.empty?

            ret = true

            @body['roles'].each {|r| ret &= r['nodes'].empty? }

            ret
        end

        private

        # Maximum number of log entries per service
        # TODO: Make this value configurable
        MAX_LOG = 50

        def update_body(body)
            @body = body

            # Update @roles attribute with the new @body content
            @roles = {}
            if @body['roles']
                @body['roles'].each do |elem|
                    elem['state'] ||= Role::STATE['PENDING']
                    role = Role.for(elem, self)
                    @roles[role.name] = role
                end
            end

            # Update @xml attribute with the new body content
            @xml.at_xpath('/DOCUMENT/TEMPLATE/BODY').children[0].content = @body
        end

        # @param [Logger::Severity] severity
        # @param [String] message
        def add_log(severity, message)
            severity_str = Logger::SEV_LABEL[severity][0..0]

            @body['log'] ||= []
            @body['log'] << {
                :timestamp => Time.now.to_i,
                :severity  => severity_str,
                :message   => message
            }

            # Truncate the number of log entries
            @body['log'] = @body['log'].last(MAX_LOG)
        end

        def create_vnet(name, net)
            extra = ''
            extra = net['extra'] if net.key? 'extra'

            OpenNebula::VNTemplate.new_with_id(
                net['template_id'].to_i,
                @client
            ).instantiate(get_vnet_name(name), extra)
        end

        def reserve(name, net)
            extra = ''
            extra = net['extra'] if net.key? 'extra'

            return false if !extra || extra.empty?

            extra.concat("\nNAME=\"#{get_vnet_name(name)}\"\n")

            OpenNebula::VirtualNetwork.new_with_id(
                net['reserve_from'].to_i,
                @client
            ).reserve_with_extra(extra)
        end

        def get_vnet_name(net)
            "#{net}-#{id}"
        end

        # Generates and updates the `template_contents` for each role within a service.
        # This method handles VM attributes (like MEMORY, CPU, etc.) and CONTEXT attributes
        # within `template_contents` for each role. The contents are generated by combining
        # the `user_inputs_values` from both the service and the individual role, with the
        # role inputs taking precedence over the service inputs.
        #
        # The method also resolves network configurations for each role by mapping network
        # IDs from the service-level `networks_values` to the NICs defined in the role's
        # `template_contents`.
        #
        # @example
        #   Given the following input data:
        #   template_contents = {
        #     'MEMORY' => '1024',
        #     'NIC'   => [
        #       {
        #         'NAME' => 'NIC_0',
        #         'NETWORK_ID' => '$private'
        #       }
        #     ]
        #   }
        #
        #   networks_values    = [{"private": {"id":"0"}}]
        #   user_inputs_values = {"ATT_A": "VALUE_A"}
        #
        #   After executing `generate_template_contents`, the result would be:
        #   {
        #     'ATT_A'   => 'VALUE_A',
        #     'MEMORY' => '1024',
        #     'NIC' => [
        #       {
        #         'NAME' => 'NIC_0',
        #         'NETWORK_ID' => '0'
        #       }
        #     ],
        #     'CONTEXT' => {
        #       'ATT_A' => '$VALUE_A',
        #     }
        #   }
        #
        def generate_template_contents
            service_inputs   = @body['user_inputs_values'] || {}
            service_networks = @body['networks_values'] || []

            @body['roles'].each do |role|
                template_contents = role['template_contents'] || {}
                role_inputs      = role['user_inputs_values'] || {}
                role_nets        = template_contents['NIC'] || []

                # Resolve networks
                unless role_nets.empty?
                    template_contents['NIC'] = resolve_networks(role_nets, service_networks)
                end

                # Resolve inputs
                unless service_inputs.empty? && role_inputs.empty?
                    # role inputs have precedence over service inputs
                    role_inputs = service_inputs.deep_merge(role_inputs)

                    # Add the role inputs to the template_contents,
                    # creating the CONTEXT section in case it doesn't exist
                    template_contents['CONTEXT'] = {} unless template_contents.key?('CONTEXT')

                    role_inputs.each do |key, value|
                        template_contents[key] = value
                        template_contents['CONTEXT'][key] = "$#{key}"
                    end
                end

                role['template_contents'] = template_contents
            end
        end

        # Replaces the `NETWORK_ID` placeholders in the given NICs with their corresponding
        # network IDs based on the provided `networks_values`. This method is used to resolve
        # dynamic network references (e.g., `$private`) in the role's NIC configuration with
        # the actual network IDs.
        #
        # @param nics [Array<Hash>] An array of NIC hashes for a role. Each NIC hash should
        #                           contain a  `NETWORK_ID` key, which may have a value that
        #                           is a placeholder in the form `$network_name`.
        # @param networks_values [Array<Hash>] An array of network values, where each value
        #                                      is a hash containing a network name as the key
        #                                      and a network configuration as the value. The network
        #                                      configuration should include an `id` key with the
        #                                      actual network ID.
        #
        # @return [Array<Hash>] An array of NIC hashes with the `NETWORK_ID` placeholders replaced
        #                       by the corresponding network IDs from `networks_values`.
        #
        # @example
        #   Given the following input data:
        #   nics = [
        #     { 'NAME' => 'NIC_0', 'NETWORK_ID' => '$private' },
        #     { 'NAME' => 'NIC_1', 'NETWORK_ID' => '1' }
        #   ]
        #
        #   networks_values = [{ 'private' => { 'id' => '0' } }]
        #
        #   After calling `resolve_networks(nics, networks_values)`, the result would be:
        #   [
        #     { 'NAME' => 'NIC_0', 'NETWORK_ID' => '0' },
        #     { 'NAME' => 'NIC_1', 'NETWORK_ID' => '1' }
        #   ]
        def resolve_networks(nics, networks_values)
            nics.each do |nic|
                next unless nic['NETWORK_ID']

                match = nic['NETWORK_ID'].match(/\$(\w+)/)
                next unless match

                net_name          = match[1]
                network           = networks_values.find {|att| att.key?(net_name) }
                nic['NETWORK_ID'] = network[net_name]['id'] if network
            end

            nics
        end

    end

end
