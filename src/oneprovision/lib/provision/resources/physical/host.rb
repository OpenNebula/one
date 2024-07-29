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

require 'provision/resources/resource'

module OneProvision

    # Host
    class Host < Resource

        # Mutex to synchronize delete operations
        # rubocop:disable Style/ClassVars
        @@mutex = Mutex.new
        # rubocop:enable Style/ClassVars

        # Class constructor
        #
        # @param provider   [Provider] Host provider
        # @param p_template [Hash]     Resource information in hash form
        def initialize(provider, p_template = nil)
            super(p_template)

            @pool     = OpenNebula::HostPool.new(@client)
            @type     = 'host'
            @provider = provider
        end

        # Creates host deployment file
        #
        # @return [Nokogiri::XML] XML with the host information
        def create_deployment_file
            ssh_key = Utils.try_read_file(
                @p_template['connection']['public_key']
            ) if @p_template['connection']
            config = Base64.strict_encode64(
                @p_template['configuration'].to_yaml
            ) if @p_template['configuration']

            reject = ['im_mad', 'vm_mad', 'provision', 'connection', 'configuration', 'count']

            Nokogiri::XML::Builder.new do |xml|
                xml.HOST do
                    xml.NAME "provision-#{SecureRandom.hex(24)}"
                    xml.TEMPLATE do
                        xml.IM_MAD @p_template['im_mad']
                        xml.VM_MAD @p_template['vm_mad']
                        xml.PROVISION do
                            @p_template['provision'].each do |key, value|
                                next if key == 'provider'

                                xml.send(key.upcase, value)
                            end
                        end

                        if @p_template['configuration']
                            xml.PROVISION_CONFIGURATION_BASE64 config
                        end

                        if @p_template['connection']
                            xml.PROVISION_CONNECTION do
                                @p_template['connection'].each do |key, value|
                                    xml.send(key.upcase, value)
                                end
                            end
                        end

                        if @p_template['connection']
                            xml.CONTEXT do
                                if @p_template['connection']['public_key']
                                    xml.SSH_PUBLIC_KEY ssh_key
                                end
                            end
                        end

                        @p_template.each do |key, value|
                            next if reject.include?(key)

                            xml.send(key.upcase, value)
                        end
                    end
                end
            end.doc.root
        end

        # Checks if there are Running VMs on the HOST
        def running_vms?
            Integer(@one['HOST_SHARE/RUNNING_VMS']) > 0
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
        def poll(tf)
            Terraform.p_load

            terraform = Terraform.singleton(@provider, tf)
            terraform.poll(@one['ID']).gsub("\n", '')
        end

        # Creates a new HOST in OpenNebula
        #
        # @param dfile     [String]  XML with all the HOST information
        # @param cluster   [Integer] ID of the CLUSTER where
        #
        # @retun [OpenNebula::Host] The ONE HOST object
        def create(dfile, cluster)
            xhost = OpenNebula::XMLElement.new
            xhost.initialize_xml(dfile, 'HOST')

            name = xhost['NAME']

            OneProvisionLogger.debug("Creating OpenNebula host: #{name}")

            one  = OpenNebula::Client.new
            host = OpenNebula::Host.new(OpenNebula::Host.build_xml, one)

            im = xhost['TEMPLATE/IM_MAD']
            vm = xhost['TEMPLATE/VM_MAD']

            host.allocate(name, im, vm, cluster)
            host.update(xhost.template_str, true)

            host.offline
            host.info

            OneProvisionLogger.debug("host created with ID: #{host['ID']}")

            host
        end

        # Deletes the HOST
        #
        # @param force [Boolean] Force host deletion
        # @param provision [OpenNebula::Provision] Provision information
        # @param tf [Hash] Terraform :conf and :state
        #
        # @return [Array]
        #   - Terraform state in base64
        #   - Terraform config in base64
        def delete(force, provision, tf = nil)
            check

            id = @one.id

            # offline ONE host
            if @one.state != 8
                OneProvisionLogger.debug("Offlining OpenNebula host: #{id}")

                @@mutex.synchronize do
                    if force
                        @one.offline
                    else
                        Utils.exception(@one.offline)
                    end
                end
            end

            if tf && !tf.empty?
                Terraform.p_load

                terraform   = Terraform.singleton(@provider, tf)
                state, conf = terraform.destroy_host(provision, id)
            end

            # delete ONE host
            OneProvisionLogger.debug("Deleting OpenNebula host: #{id}")

            @@mutex.synchronize do
                if force
                    @one.delete
                else
                    Utils.exception(@one.delete)
                end
            end

            if state && conf
                [state, conf]
            else
                0
            end
        end

        # Configures the HOST
        def configure
            Ansible.configure([{ 'id' => @one['ID'] }])
        end

        # Checks that the HOST is a baremetal HOST
        def check
            Utils.fail('Not a valid bare metal host') if @provider.nil?
        end

        # Info an specific object
        #
        # @param id [String] Object ID
        def info(id)
            @one = OpenNebula::Host.new_with_id(id, @client)
            @one.info(true)
        end

        private

        # Create new object
        def new_object
            @one = OpenNebula::Host.new(OpenNebula::Host.build_xml, @client)
        end

    end

end
