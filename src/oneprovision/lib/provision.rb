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

require 'base64'

module OneProvision

    # Provision
    class Provision

        attr_reader :id, :name, :clusters, :hosts, :datastores, :vnets

        # Class constructor
        def initialize(id, name = nil)
            @id          = id
            @name        = name
            @clusters    = []
            @hosts       = []
            @datastores  = []
            @vnets       = []
        end

        # Checks if the PROVISION exists
        #
        # @return [Boolean] True if exists, false if not
        def exists
            resource = Cluster.new
            pool     = resource.pool
            pool.info

            pool.each do |c|
                return true if c['TEMPLATE/PROVISION/PROVISION_ID'] == @id
            end

            false
        end

        # Retrieves all the PROVISION objects
        def refresh
            Utils.fail('Provision not found.') unless exists

            @clusters   = Cluster.new.get(@id)
            @datastores = Datastore.new.get(@id)
            @hosts      = Host.new.get(@id)
            @vnets      = Vnet.new.get(@id)

            @name       = @clusters[0]['TEMPLATE/PROVISION/NAME']
        end

        # Deletes the PROVISION
        #
        # @param cleanup [Boolean] True to delete running VMs and images
        def delete(cleanup = false)
            Utils.fail('Provision not found.') unless exists

            if running_vms? && !cleanup
                Utils.fail('Provision with running VMs can\'t be deleted')
            end

            if images? && !cleanup
                Utils.fail('Provision with images can\'t be deleted')
            end

            delete_vms if cleanup

            delete_images if cleanup

            OneProvisionLogger.info("Deleting provision #{@id}")

            # offline and (optionally) clean all hosts
            OneProvisionLogger.debug('Offlining OpenNebula hosts')

            @hosts.each do |host|
                Driver.retry_loop 'Failed to offline host' do
                    Utils.exception(host.offline)
                end
            end

            # undeploy hosts
            OneProvisionLogger.info('Undeploying hosts')

            threads = []

            Driver.retry_loop 'Failed to delete hosts' do
                @hosts.each do |host|
                    host = Host.new(host['ID'])

                    if Options.threads > 1
                        while Thread.list.count > Options.threads
                            threads.map do |thread|
                                thread.join(5)
                            end
                        end

                        threads << Thread.new do
                            host.delete
                        end
                    else
                        host.delete
                    end
                end

                threads.map(&:join)
            end

            # delete all other deployed objects
            OneProvisionLogger.info('Deleting provision objects')

            %w[datastores vnets clusters].each do |section|
                send(section).each do |obj|
                    msg = "#{section.chomp('s')} #{obj['ID']}"

                    Driver.retry_loop "Failed to delete #{msg}" do
                        OneProvisionLogger.debug("Deleting OpenNebula #{msg}")

                        Utils.exception(obj.delete)
                    end
                end
            end

            0
        end

        # Returns the binding of the class
        def _binding
            binding
        end

        # Checks the status of the PROVISION
        #
        # @return [String]
        #   - Pending:    if the HOSTS are being configured
        #   - Error:      if something went wrong
        #   - Configured: if HOSTS are configured
        def status
            @hosts.each do |h|
                h.info

                status = h['TEMPLATE/PROVISION_CONFIGURATION_STATUS']

                return status unless status.nil?
            end

            'configured'
        end

        # Creates a new PROVISION
        #
        # @param config [String] Path to the configuration file
        def create(config)
            Ansible.check_ansible_version

            begin
                # read provision file
                cfg = Utils.create_config(Utils.read_config(config))

                @name = cfg['name']

                OneProvisionLogger.info('Creating provision objects')

                cluster = nil
                cid     = nil

                Driver.retry_loop 'Failed to create cluster' do
                    cluster = create_cluster(cfg)
                    cid     = cluster.id
                end

                Mode.new_cleanup(true)

                Driver.retry_loop 'Failed to create some resources' do
                    create_resources(cfg, cid)
                end

                if cfg['hosts'].nil?
                    puts "ID: #{@id}"

                    return 0
                end

                Driver.retry_loop 'Failed to create hosts' do
                    create_hosts(cfg, cid)
                end

                # ask user to be patient, mandatory for now
                STDERR.puts 'WARNING: This operation can ' \
                    'take tens of minutes. Please be patient.'

                OneProvisionLogger.info('Deploying')

                deploy_ids = nil

                Driver.retry_loop 'Failed to deploy hosts' do
                    deploy_ids = deploy_hosts
                end

                if deploy_ids.nil? || deploy_ids.empty?
                    Utils.fail('Deployment failed, no ID got from driver')
                end

                OneProvisionLogger.info('Monitoring hosts')

                update_hosts(deploy_ids)

                Ansible.configure(@hosts)

                puts "ID: #{@id}"

                0
            rescue OneProvisionCleanupException
                delete

                -1
            end
        end

        # Configures the PROVISION
        #
        # @param force [Boolean] Force the configuration if the PROVISION
        #   is already configured
        def configure(force)
            Ansible.configure(@hosts, force)
        end

        private

        # Creates a new cluster
        #
        # @param cfg [Key-Value Object] Configuration of the PROVISION
        #
        # @return [OpenNebula::Cluster] The new cluster
        def create_cluster(cfg)
            msg = "Creating OpenNebula cluster: #{cfg['cluster']['name']}"

            OneProvisionLogger.debug(msg)

            # create new cluster
            cluster = Cluster.new
            cluster.create(cfg['cluster'], @id, @name)
            cluster = cluster.one
            cid = cluster.id

            @clusters << cluster

            OneProvisionLogger.debug("cluster created with ID: #{cid}")

            cluster
        end

        # Creates PROVISION resources (datastores and networks)
        #
        # @param cfg [Key-Value Object] Configuration of the PROVISION
        # @param cid [String]           Cluster ID
        def create_resources(cfg, cid)
            %w[datastores networks].each do |r|
                next if cfg[r].nil?

                cfg[r].each do |x|
                    if cfg['defaults'] && cfg['defaults']['driver']
                        driver = cfg['defaults']['provision']['driver']
                    end

                    msg = "Creating OpenNebula #{r}: #{x['name']}"

                    OneProvisionLogger.debug(msg)

                    erb = Utils.evaluate_erb(self, x)

                    if r == 'datastores'
                        datastore = Datastore.new
                        datastore.create(cid.to_i, erb, driver, @id, @name)
                        @datastores << datastore.one
                    else
                        vnet = Vnet.new
                        vnet.create(cid.to_i, erb, driver, @id, @name)
                        @vnets << vnet.one
                    end

                    r     = 'vnets' if r == 'networks'
                    rid   = instance_variable_get("@#{r}").last['ID']
                    rname = r.chomp('s').capitalize
                    msg   = "#{rname} created with ID: #{rid}"

                    OneProvisionLogger.debug(msg)
                end
            end
        end

        # Creates PROVISION hosts
        #
        # @param cfg [Key-Value Object] Configuration of the PROVISION
        # @param cid [String]           Cluster ID
        def create_hosts(cfg, cid)
            cfg['hosts'].each do |h|
                erb      = Utils.evaluate_erb(self, h)
                dfile    = Utils .create_deployment_file(erb, @id, @name)
                playbook = cfg['playbook']

                host = Host.new
                host = host.create(dfile.to_xml, cid.to_i, playbook)

                @hosts << host

                host.offline
            end
        end

        # Deploy PROVISION hosts
        #
        # @return [Array] Provider deploy ids
        def deploy_hosts
            deploy_ids = []
            threads    = []
            p_hosts    = 0

            @hosts.each do |host|
                p_hosts += 1

                host.info

                # deploy host
                pm = host['TEMPLATE/PM_MAD']
                id = host['ID']

                OneProvisionLogger.debug("Deploying host: #{id}")

                deploy_file = Tempfile.new("xmlDeploy#{id}")
                deploy_file.close

                Driver.write_file_log(deploy_file.path, host.to_xml)

                params = [deploy_file.path, 'TODO']

                if Options.threads > 1
                    threads << Thread.new do
                        output = Driver.pm_driver_action(pm, 'deploy', params)
                        Thread.current[:output] = output
                    end

                    if threads.size == Options.threads || p_hosts == @hosts.size
                        threads.map do |thread|
                            thread.join
                            deploy_ids << thread[:output]
                            deploy_file.unlink
                        end

                        threads.clear
                    end
                else
                    deploy_ids << Driver.pm_driver_action(pm, 'deploy', params)
                end
            end

            deploy_ids
        end

        # Updates PROVISION hosts with deploy_id
        #
        # @param deploy_ids [Array] Array with all the deploy ids
        def update_hosts(deploy_ids)
            @hosts.each do |h|
                deploy_id = deploy_ids.shift.strip

                h.add_element('//TEMPLATE/PROVISION', 'DEPLOY_ID' => deploy_id)
                h.update(h.template_str)

                host = Host.new(h['ID'])
                name = host.poll
                h.rename(name)
            end
        end

        # Checks if the PROVISION has running VMs
        #
        # @return [Boolean] True if there are running VMs
        def running_vms?
            @hosts.each do |host|
                Utils.exception(host.info)

                return true if host['HOST_SHARE/RUNNING_VMS'].to_i > 0
            end

            false
        end

        # Checks if the PROVISION has images in its datastores
        #
        # @return [Boolean] True if there are images
        def images?
            @datastores.each do |datastore|
                Utils.exception(datastore.info)

                images = datastore.retrieve_elements('IMAGES/ID')

                return true if images
            end

            false
        end

        # Deletes VMs from the PROVISION
        def delete_vms
            Driver.retry_loop 'Failed to delete running_vms' do
                hosts = []

                @hosts.each do |host|
                    Utils.exception(host.info)

                    hosts << host if host['HOST_SHARE/RUNNING_VMS'].to_i > 0
                end

                hosts.each do |host|
                    vm_ids = host.retrieve_elements('VMS/ID')

                    vm_ids.each do |id|
                        delete_object('vm', id)
                    end
                end

                if running_vms?
                    raise OneProvisionLoopException, 'Still found running VMs'
                end
            end
        end

        # Deletes images from the PROVISION
        def delete_images
            Driver.retry_loop 'Failed to delete images' do
                datastores = []

                @datastores.each do |datastore|
                    Utils.exception(datastore.info)

                    images = datastore.retrieve_elements('IMAGES/ID')

                    datastores << datastore if images
                end

                datastores.each do |datastore|
                    image_ids = datastore.retrieve_elements('IMAGES/ID')

                    image_ids.each do |id|
                        delete_object('image', id)
                    end
                end

                if images?
                    raise OneProvisionLoopException, 'Still found images'
                end
            end
        end

        # Deletes an object
        #
        # @param type [String] Type of the object (vm, image)
        # @param id   [String] ID of the object
        def delete_object(type, id)
            msg = "Deleting OpenNebula #{type} #{id}"

            OneProvision::OneProvisionLogger.debug(msg)

            object = nil
            client = OpenNebula::Client.new

            if type == 'vm'
                object = OpenNebula::VirtualMachine.new_with_id(id, client)
            else
                object = OpenNebula::Image.new_with_id(id, client)
            end

            Utils.exception(object.info)

            Utils.exception(object.delete)

            Utils.exception(object.wait_state('DONE')) if type == 'vm'
        end

    end

end
