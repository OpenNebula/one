# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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
    class Service < DocumentJSON

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
            'COOLDOWN'
        ]

        LOG_COMP = "SER"

        # Returns the service state
        # @return [Integer] the service state
        def state
            return @body['state'].to_i
        end

        # Returns the service strategy
        # @return [String] the service strategy
        def strategy
            return @body['deployment']
        end

        # Returns the string representation of the service state
        # @return the state string
        def state_str
            return STATE_STR[state]
        end

        # Sets a new state
        # @param [Integer] the new state
        # @return [true, false] true if the value was changed
        def set_state(state)
            if state < 0 || state > STATE_STR.size
                return false
            end

            @body['state'] = state

            msg = "New state: #{STATE_STR[state]}"
            Log.info LOG_COMP, msg, self.id()
            self.log_info(msg)

            return true
        end

        # Returns the owner username
        # @return [String] the service's owner username
        def owner_name()
            return self['UNAME']
        end

        # Replaces this object's client with a new one
        # @param [OpenNebula::Client] owner_client the new client
        def replace_client(owner_client)
            @client = owner_client
        end

        # Returns all the node Roles
        # @return [Hash<String,Role>] all the node Roles
        def get_roles
            return @roles
        end

        # Returns true if all the nodes are correctly deployed
        # @return [true, false] true if all the nodes are correctly deployed
        def all_roles_running?()
            @roles.each { |name, role|
                if role.state != Role::STATE['RUNNING']
                    return false
                end
            }

            return true
        end

        # Returns true if all the nodes are in done state
        # @return [true, false] true if all the nodes are correctly deployed
        def all_roles_done?()
            @roles.each { |name, role|
                if role.state != Role::STATE['DONE']
                    return false
                end
            }

            return true
        end

        # Returns true if any of the roles is in failed state
        # @return [true, false] true if any of the roles is in failed state
        def any_role_failed?()
            failed_states = [
                Role::STATE['FAILED_DEPLOYING'],
                Role::STATE['FAILED_UNDEPLOYING']]

            @roles.each { |name, role|
                if failed_states.include?(role.state)
                    return true
                end
            }

            return false
        end

        # Returns the running_status_vm option
        # @return [true, false] true if the running_status_vm option is enabled
        def ready_status_gate
            return @body['ready_status_gate']
        end

        def any_role_scaling?()
            @roles.each do |name, role|
                if role.state == Role::STATE['SCALING']
                    return true
                end
            end

            return false
        end

        def any_role_failed_scaling?()
            @roles.each do |name, role|
                if role.state == Role::STATE['FAILED_SCALING']
                    return true
                end
            end

            return false
        end

        def any_role_cooldown?()
            @roles.each do |name, role|
                if role.state == Role::STATE['COOLDOWN']
                    return true
                end
            end

            return false
        end

        # Create a new service based on the template provided
        # @param [String] template_json
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(template_json)
            template = JSON.parse(template_json)
            template['state'] = STATE['PENDING']

            if template['roles']
                template['roles'].each { |elem|
                    elem['state'] ||= Role::STATE['PENDING']
                }
            end

            super(template.to_json, template['name'])
        end

        # Shutdown the service. This action is called when user wants to shutdwon
        #   the Service
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def shutdown
            if ![Service::STATE['FAILED_SCALING'],
                    Service::STATE['DONE']].include?(self.state)
                self.set_state(Service::STATE['UNDEPLOYING'])
                return self.update
            else
                return OpenNebula::Error.new("Action shutdown: Wrong state" \
                    " #{self.state_str()}")
            end
        end

        # Recover a failed service.
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def recover
            if [Service::STATE['FAILED_DEPLOYING']].include?(self.state)
                @roles.each do |name, role|
                    if role.state == Role::STATE['FAILED_DEPLOYING']
                        role.set_state(Role::STATE['PENDING'])
                        role.recover_deployment()
                    end
                end

                self.set_state(Service::STATE['DEPLOYING'])

            elsif self.state == Service::STATE['FAILED_SCALING']
                @roles.each do |name, role|
                    if role.state == Role::STATE['FAILED_SCALING']
                        role.recover_scale()
                        role.set_state(Role::STATE['SCALING'])
                    end
                end

                self.set_state(Service::STATE['SCALING'])

            elsif self.state == Service::STATE['FAILED_UNDEPLOYING']
                @roles.each do |name, role|
                    if role.state == Role::STATE['FAILED_UNDEPLOYING']
                        role.set_state(Role::STATE['RUNNING'])
                    end
                end

                self.set_state(Service::STATE['UNDEPLOYING'])

            elsif self.state == Service::STATE['COOLDOWN']
                @roles.each do |name, role|
                    if role.state == Role::STATE['COOLDOWN']
                        role.set_state(Role::STATE['RUNNING'])
                    end
                end

                self.set_state(Service::STATE['RUNNING'])

            elsif self.state == Service::STATE['WARNING']
                @roles.each do |name, role|
                    if role.state == Role::STATE['WARNING']
                        role.recover_warning()
                    end
                end

            else
                return OpenNebula::Error.new("Action recover: Wrong state" \
                    " #{self.state_str()}")
            end

            return self.update
        end

        # Delete the service. All the VMs are also deleted from OpenNebula.
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def delete
            @roles.each { |name, role|
                role.delete()
            }

            return super()
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
                @body['roles'].each { |elem|
                    elem['state'] ||= Role::STATE['PENDING']
                    role = Role.new(elem, self)
                    @roles[role.name] = role
                }
            end

            return nil
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

        # Retrieve the service client
        def client
            @client
        end

        # Changes the owner/group
        #
        # @param [Integer] uid the new owner id. Set to -1 to leave the current one
        # @param [Integer] gid the new group id. Set to -1 to leave the current one
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

            @roles.each { |name, role|
                rc = role.chown(uid, gid)

                break if rc[0] == false
            }

            if rc[0] == false
                self.log_error("Chown operation failed, will try to rollback all VMs to the old user and group")
                update()

                super(old_uid, old_gid)

                @roles.each { |name, role|
                    role.chown(old_uid, old_gid)
                }

                return OpenNebula::Error.new(rc[1])
            end

            return nil
        end

        # Updates a role
        # @param [String] role_name
        # @param [String] template_json
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update_role(role_name, template_json)

            if ![Service::STATE['RUNNING'], Service::STATE['WARNING']].include?(self.state)
                return OpenNebula::Error.new("Update role: Wrong state" \
                    " #{self.state_str()}")
            end

            template = JSON.parse(template_json)

            # TODO: Validate template?

            role = @roles[role_name]

            if role.nil?
                return OpenNebula::Error.new("ROLE \"#{role_name}\" does not exist")
            end

            rc = role.update(template)

            if OpenNebula.is_error?(rc)
                return rc
            end

            # TODO: The update may not change the cardinality, only
            # the max and min vms...

            role.set_state(Role::STATE['SCALING'])

            role.set_default_cooldown_duration()

            self.set_state(Service::STATE['SCALING'])

            return self.update
        end

        def get_shutdown_action()
            return @body['shutdown_action']
        end

        # Replaces the raw template contents
        #
        # @param template [String] New template contents, in the form KEY = VAL
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update_raw(template_raw, append=false)
            super(template_raw, append)
        end

        private

        # @param [Logger::Severity] severity
        # @param [String] message
        def add_log(severity, message)
            severity_str = Logger::SEV_LABEL[severity][0..0]

            @body['log'] ||= Array.new
            @body['log'] << {
                :timestamp => Time.now.to_i,
                :severity  => severity_str,
                :message   => message
            }
        end
    end
end
