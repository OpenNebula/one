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

module OpenNebula

    # Service class as wrapper of DocumentJSON
    class Service < DocumentJSON

        attr_reader :roles, :client

        DOCUMENT_TYPE = 100

        STATE = {
            'PENDING'            => 0,
            'DEPLOYING'          => 1,
            'RUNNING'            => 2,
            'UNDEPLOYING'        => 3,
            'WARNING'            => 4,
            'DONE'               => 5,
            'FAILED_UNDEPLOYING' => 6,
            'FAILED_DEPLOYING'   => 7,
            'SCALING'            => 8,
            'FAILED_SCALING'     => 9,
            'COOLDOWN'           => 10
        }

        STATE_STR = %w[
            PENDING
            DEPLOYING
            RUNNING
            UNDEPLOYING
            WARNING
            DONE
            FAILED_UNDEPLOYING
            FAILED_DEPLOYING
            SCALING
            FAILED_SCALING
            COOLDOWN
        ]

        TRANSIENT_STATES = %w[
            DEPLOYING
            UNDEPLOYING
            SCALING
        ]

        FAILED_STATES = %w[
            FAILED_DEPLOYING
            FAILED_UNDEPLOYING
            FAILED_SCALING
        ]

        RECOVER_DEPLOY_STATES = %w[
            FAILED_DEPLOYING
            DEPLOYING
            PENDING
        ]

        RECOVER_UNDEPLOY_STATES = %w[
            FAILED_UNDEPLOYING
            UNDEPLOYING
        ]

        RECOVER_SCALE_STATES = %w[
            FAILED_SCALING
            SCALING
        ]

        LOG_COMP = 'SER'

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
            if transient_state?
                state != Service::STATE['UNDEPLOYING']
            else
               state != Service::STATE['DONE'] && !failed_state?
            end
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

        # Sets a new state
        # @param [Integer] the new state
        # @return [true, false] true if the value was changed
        # rubocop:disable Naming/AccessorMethodName
        def set_state(state)
            # rubocop:enable Naming/AccessorMethodName
            if state < 0 || state > STATE_STR.size
                return false
            end

            @body['state'] = state

            msg = "New state: #{STATE_STR[state]}"
            Log.info LOG_COMP, msg, id
            log_info(msg)

            true
        end

        # Returns the owner username
        # @return [String] the service's owner username
        def owner_name
            self['UNAME']
        end

        # Replaces this object's client with a new one
        # @param [OpenNebula::Client] owner_client the new client
        def replace_client(owner_client)
            @client = owner_client
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

        # Returns true if any of the roles is in failed state
        # @return [true, false] true if any of the roles is in failed state
        def any_role_failed?
            failed_states = [
                Role::STATE['FAILED_DEPLOYING'],
                Role::STATE['FAILED_UNDEPLOYING'],
                Role::STATE['FAILED_DELETING']
            ]

            @roles.each do |_name, role|
                if failed_states.include?(role.state)
                    return true
                end
            end

            false
        end

        # Returns the running_status_vm option
        # @return [true, false] true if the running_status_vm option is enabled
        def ready_status_gate
            @body['ready_status_gate']
        end

        def any_role_scaling?
            @roles.each do |_name, role|
                if role.state == Role::STATE['SCALING']
                    return true
                end
            end

            false
        end

        def any_role_failed_scaling?
            @roles.each do |_name, role|
                if role.state == Role::STATE['FAILED_SCALING']
                    return true
                end
            end

            false
        end

        def any_role_cooldown?
            @roles.each do |_name, role|
                if role.state == Role::STATE['COOLDOWN']
                    return true
                end
            end

            false
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

            super(template.to_json, template['name'])
        end

        # Recover a failed service.
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def recover
            if [Service::STATE['FAILED_DEPLOYING']].include?(state)
                @roles.each do |_name, role|
                    if role.state == Role::STATE['FAILED_DEPLOYING']
                        role.set_state(Role::STATE['PENDING'])
                    end
                end

                set_state(Service::STATE['DEPLOYING'])

            elsif state == Service::STATE['FAILED_SCALING']
                @roles.each do |_name, role|
                    if role.state == Role::STATE['FAILED_SCALING']
                        role.set_state(Role::STATE['SCALING'])
                    end
                end

                set_state(Service::STATE['SCALING'])

            elsif state == Service::STATE['FAILED_UNDEPLOYING']
                @roles.each do |_name, role|
                    if role.state == Role::STATE['FAILED_UNDEPLOYING']
                        role.set_state(Role::STATE['RUNNING'])
                    end
                end

                set_state(Service::STATE['UNDEPLOYING'])

            elsif state == Service::STATE['COOLDOWN']
                @roles.each do |_name, role|
                    if role.state == Role::STATE['COOLDOWN']
                        role.set_state(Role::STATE['RUNNING'])
                    end
                end

                set_state(Service::STATE['RUNNING'])

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

        # Delete the service. All the VMs are also deleted from OpenNebula.
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise

        def delete
            networks = JSON.parse(self['TEMPLATE/BODY'])['networks_values']

            networks.each do |net|
                next unless net[net.keys[0]].key? 'template_id'

                net_id = net[net.keys[0]]['id'].to_i

                rc = OpenNebula::VirtualNetwork
                     .new_with_id(net_id, @client).delete

                if OpenNebula.is_error?(rc)
                    log_info("Error deleting vnet #{net_id}: #{rc}")
                end
            end

            super()
        end

        def delete_roles
            @roles.each do |_name, role|
                role.set_state(Role::STATE['DELETING'])
                role.delete
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
                    role = Role.new(elem, self)
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

            role.set_state(Role::STATE['SCALING'])

            role.set_default_cooldown_duration

            set_state(Service::STATE['SCALING'])

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

        def deploy_networks
            body = JSON.parse(self['TEMPLATE/BODY'])

            return if body['networks_values'].nil?

            body['networks_values'].each do |net|
                rc = create_vnet(net) if net[net.keys[0]].key?('template_id')

                if OpenNebula.is_error?(rc)
                    return rc
                end

                rc = reserve(net) if net[net.keys[0]].key?('reserve_from')

                if OpenNebula.is_error?(rc)
                    return rc
                end
            end

            # Replace $attibute by the corresponding value
            resolve_attributes(body)

            # @body = template.to_hash

            update_body(body)
        end

        def delete_networks
            vnets = @body['networks_values']
            vnets_failed = []

            return if vnets.nil?

            vnets.each do |vnet|
                next unless vnet[vnet.keys[0]].key?('template_id') ||
                            vnet[vnet.keys[0]].key?('reserve_from')

                vnet_id = vnet[vnet.keys[0]]['id'].to_i

                rc = OpenNebula::VirtualNetwork
                     .new_with_id(vnet_id, @client).delete

                if OpenNebula.is_error?(rc)
                    vnets_failed << vnet_id
                end
            end

            vnets_failed
        end

        def can_scale?
            state == Service::STATE['RUNNING']
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
                    role = Role.new(elem, self)
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

        def create_vnet(net)
            extra = ''

            extra = net[net.keys[0]]['extra'] if net[net.keys[0]].key? 'extra'

            vntmpl_id = OpenNebula::VNTemplate
                        .new_with_id(net[net.keys[0]]['template_id']
                        .to_i, @client).instantiate(get_vnet_name(net), extra)

            # TODO, check which error should be returned
            return vntmpl_id if OpenNebula.is_error?(vntmpl_id)

            net[net.keys[0]]['id'] = vntmpl_id

            true
        end

        def reserve(net)
            get_vnet_name(net)
            extra = net[net.keys[0]]['extra'] if net[net.keys[0]].key? 'extra'

            return false if extra.empty?

            extra.concat("\nNAME=\"#{get_vnet_name(net)}\"\n")

            reserve_id = OpenNebula::VirtualNetwork
                         .new_with_id(net[net.keys[0]]['reserve_from']
                         .to_i, @client).reserve_with_extra(extra)

            return reserve_id if OpenNebula.is_error?(reserve_id)

            net[net.keys[0]]['id'] = reserve_id

            true
        end

        def get_vnet_name(net)
            "#{net.keys[0]}-#{id}"
        end

        def resolve_attributes(template)
            template['roles'].each do |role|
                if role['vm_template_contents']
                    # $CUSTOM1_VAR Any word character (letter, number, underscore)
                    role['vm_template_contents'].scan(/\$(\w+)/).each do |key|
                        # Check if $ var value is in custom_attrs_values
                        if template['custom_attrs_values'].key?(key[0])
                            role['vm_template_contents'].gsub!(
                                '$'+key[0],
                                template['custom_attrs_values'][key[0]])
                            next
                        end

                        # Check if $ var value is in networks
                        net = template['networks_values']
                              .find {|att| att.key? key[0] }

                        next if net.nil?

                        role['vm_template_contents'].gsub!(
                            '$'+key[0],
                            net[net.keys[0]]['id'].to_s
                        )
                    end
                end

                next unless role['user_inputs_values']

                role['vm_template_contents'] ||= ''
                role['user_inputs_values'].each do |key, value|
                    role['vm_template_contents'] += "\n#{key}=\"#{value}\""
                end
            end
        end

    end

end
