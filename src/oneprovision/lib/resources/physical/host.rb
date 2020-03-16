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

require 'resources/resource'

module OneProvision

    # Host
    class Host < Resource

        # Mutex to synchronize delete operations
        # rubocop:disable Style/ClassVars
        @@mutex = Mutex.new
        # rubocop:enable Style/ClassVars

        # Class constructor
        def initialize
            super

            @pool = OpenNebula::HostPool.new(@client)
            @type = 'host'
        end

        # Checks if there are Running VMs on the HOST
        def running_vms?
            @one['HOST_SHARE/RUNNING_VMS'].to_i > 0
        end

        # Establishes an SSH connection to the HOST
        #
        # @param command [String] Command to execute in the HOST
        def ssh(command)
            check

            ip          = @one['NAME']
            private_key = @one['TEMPLATE/PROVISION_CONNECTION/PRIVATE_KEY']
            remote_user = @one['TEMPLATE/PROVISION_CONNECTION/REMOTE_USER']

            begin
                exec("ssh -i #{private_key} #{remote_user}@#{ip} '#{command}'")
            rescue StandardError => e
                puts e.message unless e.is_a? SystemExit

                -1
            end
        end

        # Gets the public IP of the HOST
        #
        # @return [String] Public IP which is the NAME of the HOST
        def poll
            poll = monitoring

            if poll.key? 'GUEST_IP_ADDRESSES'
                name = poll['GUEST_IP_ADDRESSES'].split(',')[0][1..-1] # TODO
            elsif poll.key? 'AWS_PUBLIC_IP_ADDRESS'
                name = poll['AWS_PUBLIC_IP_ADDRESS'][2..-3]
            else
                Utils.fail('Failed to get provision name')
            end

            name
        end

        # Creates a new HOST in OpenNebula
        #
        # @param dfile    [String]  XML with all the HOST information
        # @param cluster  [Integer] ID of the CLUSTER where
        #                               the HOST will be allocated
        # @param playbook [String]  Ansible playbook for configuring the HOST
        #
        # @retun [OpenNebula::Host] The ONE HOST object
        def create(dfile, cluster, playbook)
            xhost = OpenNebula::XMLElement.new
            xhost.initialize_xml(dfile, 'HOST')

            name = xhost['NAME']

            OneProvisionLogger.debug("Creating OpenNebula host: #{name}")

            one = OpenNebula::Client.new
            host = OpenNebula::Host.new(OpenNebula::Host.build_xml, one)

            im   = xhost['TEMPLATE/IM_MAD']
            vm   = xhost['TEMPLATE/VM_MAD']

            host.allocate(name, im, vm, cluster)
            host.update(xhost.template_str, true)

            if !playbook.nil?
                host.update("ANSIBLE_PLAYBOOK=#{playbook}", true)
            end

            host.offline
            host.info

            OneProvisionLogger.debug("host created with ID: #{host['ID']}")

            host
        end

        # Resumes the HOST
        def resume
            pm_mad = @one['TEMPLATE/PM_MAD']

            check

            begin
                # create resume deployment file
                resume_file = Tempfile.new('xmlResume')
                resume_file.close
                Driver.write_file_log(resume_file.path, @one.to_xml)

                OneProvisionLogger.info("Resuming host: #{@one.id}")

                params = [resume_file.path, @one.name]

                Driver.pm_driver_action(pm_mad, 'deploy', params, @one)

                OneProvisionLogger.debug("Enabling OpenNebula host: #{@one.id}")

                name = poll
                @one.rename(name)
                @one.enable
            ensure
                resume_file.unlink
            end
        end

        # Powers off the HOST
        def poweroff
            pm_mad    = @one['TEMPLATE/PM_MAD']
            deploy_id = @one['TEMPLATE/PROVISION/DEPLOY_ID']
            name      = @one.name

            check

            OneProvisionLogger.info("Powering off host: #{@one.id}")

            params = [deploy_id, name, 'SHUTDOWN_POWEROFF']

            Driver.pm_driver_action(pm_mad, 'shutdown', params, @one)

            OneProvisionLogger.debug("Offlining OpenNebula host: #{@one.id}")

            # Fix broken pipe exception on ubuntu 14.04
            @one.info

            @one.offline
        end

        # Reboots or resets the HOST
        #
        # @param hard [Boolean] True to reset the HOST, false to reboot the HOST
        def reboot(hard)
            reset(hard)
        end

        # Deletes the HOST
        def delete
            pm_mad    = @one['TEMPLATE/PM_MAD']
            deploy_id = @one['TEMPLATE/PROVISION/DEPLOY_ID']
            name      = @one.name
            id        = @one.id

            check

            # offline ONE host
            if @one.state != 8
                OneProvisionLogger.debug("Offlining OpenNebula host: #{id}")

                @@mutex.synchronize do
                    Utils.exception(@one.offline)
                end
            end

            if deploy_id
                # unprovision host
                OneProvisionLogger.debug("Undeploying host: #{id}")

                params = [deploy_id, name]

                Driver.pm_driver_action(pm_mad, 'cancel', params, @one)
            end

            # delete ONE host
            OneProvisionLogger.debug("Deleting OpenNebula host: #{id}")

            @@mutex.synchronize do
                Utils.exception(@one.delete)
            end
        end

        # Configures the HOST
        #
        # @param force [Boolean] Force the configuration if the HOST
        #   is already configured
        def configure(force)
            Ansible.configure([@one], force)
        end

        # Checks that the HOST is a baremetal HOST
        def check
            pm_mad = @one['TEMPLATE/PM_MAD']

            Utils.fail('Not a valid bare metal host') if pm_mad.nil?
            Utils.fail('Not a valid bare metal host') if pm_mad.empty?
        end

        # Monitors the HOST
        #
        # @return [Key-Value object] All the monitoring information, such as
        #   IPS, MEMORY, CPU..
        def monitoring
            pm_mad    = @one['TEMPLATE/PM_MAD']
            deploy_id = @one['TEMPLATE/PROVISION/DEPLOY_ID']
            name      = @one.name
            id        = @one.id

            OneProvisionLogger.debug("Monitoring host: #{id}")

            Driver.retry_loop 'Monitoring metrics failed to parse' do
                check

                params = [deploy_id, name]

                pm_ret = Driver.pm_driver_action(pm_mad, 'poll', params, @one)

                begin
                    poll = {}

                    pm_ret = pm_ret.split(' ').map do |x|
                        x.split('=', 2)
                    end

                    pm_ret.each do |key, value|
                        poll[key.upcase] = value
                    end

                    poll
                rescue StandarError
                    raise OneProvisionLoopException
                end
            end
        end

        # Resets or reboots the HOST
        #
        # @param hard [Boolean] True to reset, false to reboot
        def reset(hard)
            if hard
                reset_reboot('reset', 'Resetting')
                name = poll
                @one.rename(name)
            else
                reset_reboot('reboot', 'Rebooting')
            end
        end

        # Resets or reboots the HOST
        #
        # @param action [String] Action to execute (reset, reboot)
        # @param action [String] Message for logging
        def reset_reboot(action, message)
            pm_mad    = @one['TEMPLATE/PM_MAD']
            deploy_id = @one['TEMPLATE/PROVISION/DEPLOY_ID']
            name      = @one.name

            check

            OneProvisionLogger.debug("Offlining OpenNebula host: #{@one.id}")
            @one.offline

            OneProvisionLogger.info("#{message} host: #{@one.id}")
            Driver.pm_driver_action(pm_mad, action, [deploy_id, name], @one)

            OneProvisionLogger.debug("Enabling OpenNebula host: #{@one.id}")

            @one.info
            @one.enable
        end

        # Info an specific object
        #
        # @param id [String] Object ID
        def info(id)
            @one = OpenNebula::Host.new_with_id(id, @client)
            @one.info
        end

        private

        # Create new object
        def new_object
            @one = OpenNebula::Host.new(OpenNebula::Host.build_xml, @client)
        end

    end

end
