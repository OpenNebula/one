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
require 'opennebula/document_json'

module OneProvision

    # Provision class as wrapper of DocumentJSON
    class Provision < DocumentJSON

        attr_reader :body

        DOCUMENT_TYPE = 103

        STATE = {
            'PENDING'     => 0,
            'DEPLOYING'   => 1,
            'CONFIGURING' => 2,
            'RUNNING'     => 3,
            'ERROR'       => 4,
            'DONE'        => 5
        }

        STATE_STR = %w[
            PENDING
            DEPLOYING
            CONFIGURING
            RUNNING
            ERROR
            DONE
        ]

        # Available resources that can be created with the provision
        #
        # Note: order is important, some objects depend on others
        # Objects without dependencies need to be created firstly, then the rest
        RESOURCES = %w[images
                       marketplaceapps
                       templates
                       vntemplates
                       flowtemplates]

        INFRASTRUCTURE_RESOURCES = %w[datastores networks]

        FULL_CLUSTER = INFRASTRUCTURE_RESOURCES + %w[hosts clusters]

        # Allocates a new document
        #
        # @param template [Hash]   Document information
        # @param provider [String] Provision provider
        def allocate(template, provider)
            rc = nil

            begin
                rc = to_json(template, provider)

                return rc if OpenNebula.is_error?(rc)
            rescue StandardError => e
                return OpenNebula::Error.new(e)
            end

            super(rc, template['name'])
        end

        # Returns provision state
        #
        # @return [Intenger] Provision state
        def state
            Integer(@body['state'])
        end

        # Returns provision state in string format
        #
        # @return [String] Provision state
        def state_str
            STATE_STR[state]
        end

        # Changes provision state
        #
        # @param state [Integer] New state
        def state=(state)
            @body['state'] = state
        end

        # Returns provision infrastructure objects
        def infrastructure_objects
            @body['provision']['infrastructure']
        end

        # Returns provision hosts
        def hosts
            infrastructure_objects['hosts']
        end

        # Returns provision datastores
        def datastores
            infrastructure_objects['datastores']
        end

        # Returns provision resources objects
        def resource_objects
            @body['provision']['resource']
        end

        # Returns provision provider
        def provider
            @body['provider']
        end

        # Returns infrastructure + resource objects
        def objects
            infrastructure_objects.merge(resource_objects)
        end

        # Deploys a new provision
        #
        # @param config   [String]   Path to deployment file
        # @param cleanup  [Boolean]  True to cleanup everything
        # @param timeout  [Integer]  Timeout in seconds to connect to hosts
        # @param skip     [Symbol]   Skip provision, configuration or anything
        # @param provider [Provider] Provider to deploy the provision
        #
        # @return [Integer] Provision ID
        def deploy(config, cleanup, timeout, skip, provider)
            Ansible.check_ansible_version

            begin
                cfg = Utils.read_config(config)

                if provider
                    # Respect user information, only add provider info if
                    # the user hasn't specified any
                    cfg['defaults'] = {} unless cfg['defaults']

                    # Get user UID to see if merge is possible or not
                    # only merge attributes if the provider is owned by user
                    info = Nokogiri::XML(@client.call('user.info', -1))
                    uid  = info.xpath('/USER/ID').text

                    # Get provider connection information
                    conn = provider.connection

                    if uid == provider['UID']
                        cfg['defaults']['provision'] = conn.merge(
                            cfg['defaults']['provision']
                        )

                        OneProvisionLogger.debug('Merging provider connection')
                    else
                        cfg['defaults']['provision'] = conn

                        OneProvisionLogger.debug('Using provider connection')
                    end
                end

                # read provision file
                cfg = Utils.create_config(cfg)

                # read provider information
                if provider
                    provider = provider['NAME']
                else
                    provider = Provision.read_provider(cfg)
                end

                unless provider
                    return OpenNebula::Error.new('No provider found')
                end

                # @name is used for ERB evaluation
                @name = cfg['name']

                OneProvisionLogger.info('Creating provision objects')

                rc = Driver.retry_loop 'Failed to create cluster' do
                    create_cluster(cfg)
                end

                # If cluster fails to create and user select skip, exit
                exit if rc == :skip

                Mode.new_cleanup(true)

                create_infra_resources(cfg, cfg['cluster']['id'])
                create_hosts(cfg, cfg['cluster']['id'])

                allocate(cfg, provider)

                self.info

                # @id is used for ERB evaluation
                @id = self['ID']

                if skip != :all && hosts && !hosts.empty?
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
                end

                if skip == :none
                    configure
                else
                    hosts.each do |h|
                        host = Host.new
                        host.info(h['id'])

                        host.one.enable
                    end
                end

                create_virtual_resources(cfg)

                self.state = STATE['RUNNING']

                add_provision_id

                update

                self['ID']
            rescue OneProvisionCleanupException
                delete(cleanup, timeout)

                self.state = STATE['DONE']

                update

                -1
            end
        end

        # Configures provision hosts
        #
        # @param force [Boolean] Force the configuration although provision
        #   is already configured
        def configure(force = false)
            if state == STATE['DONE']
                return OpenNebula::Error.new(
                    'Provision is DONE, can\'t configure it'
                )
            end

            if state == STATE['RUNNING'] && !force
                return OpenNebula::Error.new('Provision already configured')
            end

            self.state = STATE['CONFIGURING']

            update

            rc = Ansible.configure(hosts)

            if rc == 0
                self.state = STATE['RUNNING']
            else
                self.state = STATE['ERROR']
            end

            update
        end

        # Deletes provision objects
        #
        # @param cleanup [Boolean] True to delete running VMs and images
        # @param timeout [Integer] Timeout for deleting running VMs
        def delete(cleanup, timeout)
            if state == STATE['DONE']
                return OpenNebula::Error.new(
                    'Provision is DONE, can\'t delete it'
                )
            end

            rc = info

            return rc if OpenNebula.is_error?(rc)

            if running_vms? && !cleanup
                Utils.fail('Provision with running VMs can\'t be deleted')
            end

            if images? && !cleanup
                Utils.fail('Provision with images can\'t be deleted')
            end

            delete_vms(timeout) if cleanup

            delete_images(timeout) if cleanup

            OneProvisionLogger.info("Deleting provision #{self['ID']}")

            if hosts
                # offline and (optionally) clean all hosts
                OneProvisionLogger.debug('Offlining OpenNebula hosts')

                hosts.each do |h|
                    Driver.retry_loop 'Failed to offline host' do
                        host = Host.new

                        host.info(h['id'])

                        Utils.exception(host.one.offline)
                    end
                end

                # undeploy hosts
                OneProvisionLogger.info('Undeploying hosts')

                threads = []

                Driver.retry_loop 'Failed to delete hosts' do
                    hosts.delete_if do |host|
                        id   = host['id']
                        host = Host.new(provider)

                        host.info(id)

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

                    true
                end
            end

            # delete rest provision objects
            OneProvisionLogger.info('Deleting provision objects')

            # Marketapps are turned into images and VM templates
            delete_objects(RESOURCES - ['marketplaceapps'], resource_objects)

            # Hosts are previously deleted
            delete_objects(FULL_CLUSTER - ['hosts'], infrastructure_objects)

            self.state = STATE['DONE']

            update

            0
        end

        # Updates provision objects
        #
        # @param object    [String] Object type to update
        # @param operation [Symbol] :append or :remove
        # @param id        [String] Object ID
        # @param name      [String] Object name
        def update_objects(object, operation, id, name = nil)
            rc = info

            return rc if OpenNebula.is_error?(rc)

            if FULL_CLUSTER.include?(object)
                path = 'infrastructure'
            else
                path = 'resource'
            end

            if operation == :append
                @body['provision'][path][object] << { :id => id, :name => name }
            else
                o = Resource.object(object, provider)
                o.info(id)

                rc = o.delete

                return rc if OpenNebula.is_error?(rc)

                @body['provision'][path][object].delete_if do |obj|
                    true if obj['id'].to_s == id.to_s
                end
            end

            update
        end

        # Returns the binding of the class
        def _binding
            binding
        end

        # Reads provider name from template
        #
        # @param template [Hash] Provision information
        #
        # @return [String] Provider name
        def self.read_provider(template)
            provider = nil

            # Provider can be set in provision defaults or in hosts
            # it's the same for all hosts, taking the first one is enough
            if template['defaults'] && template['defaults']['provision']
                provider = template['defaults']['provision']['provider']
            end

            if !provider && template['hosts'][0]['provision']
                provider = template['hosts'][0]['provision']['provider']
            end

            provider
        end

        private

        # Generates document JSON information
        #
        # @param template [Hash]   Provision information
        # @param provider [String] Provision provider
        #
        # @return [JSON] Document information in JSON format
        def to_json(template, provider)
            document = {}

            document['name']        = template['name']
            document['description'] = template['description']
            document['start_time']  = Time.now.to_i
            document['state']       = STATE['DEPLOYING']
            document['provider']    = provider

            # Fill provision objects information
            document['provision'] = {}
            document['provision']['infrastructure'] = {}

            FULL_CLUSTER.each do |r|
                next unless template[r]

                document['provision']['infrastructure'][r] = []

                template[r].each do |o|
                    obj         = {}
                    obj['name'] = o['name']
                    obj['id']   = o['id']

                    document['provision']['infrastructure'][r] << obj
                end
            end

            # Resources are allocated later
            document['provision']['resource'] = {}

            document.to_json
        end

        # Creates a new cluster
        #
        # @param cfg [Hash] Provision information
        #
        # @return [OpenNebula::Cluster]
        def create_cluster(cfg)
            msg = "Creating OpenNebula cluster: #{cfg['cluster']['name']}"

            OneProvisionLogger.debug(msg)

            cluster = Cluster.new
            id      = cluster.create(cfg['cluster'])

            # Update cluster information in template
            cfg['cluster']['id'] = id

            cfg['clusters'] = []
            cfg['clusters'] << { 'name' => cfg['cluster']['name'], 'id' => id }

            OneProvisionLogger.debug("Cluster created with ID: #{id}")
        end

        # Creates provision infrastructure resources
        #
        # @param cfg       [Hash]    Provision information
        # @param resources [Array]   Resource names
        # @param cid       [Integer] Cluster ID
        def create_resources(cfg, resources, cid = nil)
            resources.each do |r|
                next if cfg[r].nil?

                cfg[r].each do |x|
                    Driver.retry_loop 'Failed to create some resources' do
                        obj = Resource.object(r)

                        next if obj.nil?

                        x = Utils.evaluate_erb(self, x)

                        OneProvisionLogger.debug(
                            "Creating #{r[0..-2]} #{x['name']}"
                        )

                        yield(r, obj, x, cid)

                        obj.template_chown(x)
                        obj.template_chmod(x)
                    end

                    update
                end
            end
        end

        # Creates provision infrastructure resources
        #
        # @param cfg [Hash]    Provision information
        # @param cid [Integer] Cluster ID
        def create_infra_resources(cfg, cid)
            create_resources(cfg, INFRASTRUCTURE_RESOURCES, cid) do |_,
                                                                     obj,
                                                                     x,
                                                                     c|
                x['id']   = obj.create(x, c)
                x['name'] = obj.one['NAME']
            end
        end

        # Creates provision resources
        #
        # @param cfg [Hash] Provision information
        def create_virtual_resources(cfg)
            create_resources(cfg, RESOURCES) do |r, obj, x, _|
                ret                 = obj.create(x)
                resource_objects[r] = [] unless resource_objects[r]

                if ret.is_a? Array
                    # Marketplace app
                    unless resource_objects['images']
                        resource_objects['images'] = []
                    end

                    unless resource_objects['templates']
                        resource_objects['templates'] = []
                    end

                    resource_objects['images'] << ret[0]
                    resource_objects['templates'] << ret[1]
                else
                    resource_objects[r] << { 'id'   => ret,
                                             'name' => obj.one['NAME'] }
                end
            end
        end

        # Creates provision hosts
        #
        # @param cfg [Hash]    Provision information
        # @param cid [Integer] Cluster ID
        def create_hosts(cfg, cid)
            return unless cfg['hosts']

            cfg['hosts'].each do |h|
                Driver.retry_loop 'Failed to create some host' do
                    erb   = Utils.evaluate_erb(self, h)
                    dfile = Utils.create_deployment_file(erb)

                    playbooks = cfg['playbook']
                    playbooks = playbooks.join(',') if playbooks.is_a? Array

                    host      = Host.new
                    host      = host.create(dfile.to_xml, cid, playbooks)
                    h['id']   = Integer(host['ID'])
                    h['name'] = host['NAME']

                    host.offline
                end
            end
        end

        # Deploys provision hosts
        #
        # @return [Array] Provider deploy ids
        def deploy_hosts
            deploy_ids = []
            threads    = []
            p_hosts    = 0

            hosts.each do |h|
                p_hosts += 1

                host = Host.new(provider)
                host.info(h['id'])
                host = host.one

                # deploy host
                pm = provider
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

                    if threads.size == Options.threads || p_hosts == hosts.size
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

        # Updates provision hosts with deploy_id
        #
        # @param deploy_ids [Array] Array with all the deploy ids
        def update_hosts(deploy_ids)
            hosts.each do |h|
                host = Host.new(provider)
                host.info(h['id'])

                deploy_id = deploy_ids.shift.strip

                host.one.add_element('//TEMPLATE/PROVISION',
                                     'DEPLOY_ID' => deploy_id)
                host.one.update(host.one.template_str)

                name = host.poll

                host.one.rename(name)

                h['name'] = name
            end
        end

        # Checks if provision has running VMs
        #
        # @return [Boolean] True if there are running VMs
        def running_vms?
            return unless hosts

            hosts.each do |h|
                host = Host.new

                Utils.exception(host.info(h['id']))

                return true if Integer(host.one['HOST_SHARE/RUNNING_VMS']) > 0
            end

            false
        end

        # Checks if provision has images in its datastores
        #
        # @return [Boolean] True if there are images
        def images?
            return unless datastores

            datastores.each do |d|
                datastore = Datastore.new

                Utils.exception(datastore.info(d['id']))

                images = datastore.one.retrieve_elements('IMAGES/ID')

                next unless images

                images.delete_if do |image|
                    next unless resource_objects['images']

                    resource_objects['images'].find do |value|
                        true if Integer(image) == Integer(value['id'])
                    end
                end

                return true if images && !images.empty?
            end

            false
        end

        # Deletes provision VMs
        #
        # @param timeout [Integer] Timeout for deleting running VMs
        def delete_vms(timeout)
            Driver.retry_loop 'Failed to delete running_vms' do
                d_hosts = []

                hosts.each do |h|
                    host = Host.new

                    Utils.exception(host.info(h['id']))

                    next unless Integer(host.one['HOST_SHARE/RUNNING_VMS']) > 0

                    d_hosts << host.one
                end

                d_hosts.each do |host|
                    vm_ids = host.retrieve_elements('VMS/ID')

                    vm_ids.each do |id|
                        delete_object('vm', id, timeout)
                    end
                end

                if running_vms?
                    raise OneProvisionLoopException, 'Still found running VMs'
                end
            end
        end

        # Deletes provision images
        #
        # @param timeout [Integer] Timeout for deleting running VMs
        def delete_images(timeout)
            Driver.retry_loop 'Failed to delete images' do
                d_datastores = []

                datastores.each do |d|
                    datastore = Datastore.new

                    Utils.exception(datastore.info(d['id']))

                    images = datastore.one.retrieve_elements('IMAGES/ID')

                    d_datastores << datastore.one if images
                end

                d_datastores.each do |datastore|
                    image_ids = datastore.retrieve_elements('IMAGES/ID')

                    image_ids.each do |id|
                        delete_object('image', id, timeout)
                    end
                end

                if images?
                    raise OneProvisionLoopException, 'Still found images'
                end
            end
        end

        # Deletes an object
        #
        # @param type    [String]  Type of the object (vm, image)
        # @param id      [String]  ID of the object
        # @param timeout [Integer] Timeout for deleting running VMs
        def delete_object(type, id, timeout)
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

            if type == 'vm'
                Utils.exception(object.wait_state('DONE', timeout))
            else
                Utils.exception(wait_image_delete(object, timeout))
            end
        end

        # Waits until the image is deleted
        #
        # @param image   [OpenNebula::Image] Image to wait
        # @param timeout [Integer ]          Timeout for delete
        def wait_image_delete(image, timeout)
            timeout.times do
                rc = image.info

                return true if OpenNebula.is_error?(rc)

                sleep 1
            end

            raise OneProvisionLoopExeception, 'Timeout expired for deleting' /
                                              " image #{image['ID']}"
        end

        # Deletes provision objects
        #
        # @param resources [Array] Resources names
        # @param objects   [Array] Objects information to delete
        def delete_objects(resources, objects)
            resources.each do |resource|
                next unless objects[resource]

                objects[resource].delete_if do |obj|
                    msg = "#{resource.chomp('s')} #{obj['id']}"

                    Driver.retry_loop "Failed to delete #{msg}" do
                        OneProvisionLogger.debug("Deleting OpenNebula #{msg}")

                        o = Resource.object(resource)
                        o.info(obj['id'])

                        Utils.exception(o.delete)
                    end

                    true
                end
            end
        end

        # Add provision ID into objects template to improve search operations
        def add_provision_id
            objects.each do |key, value|
                value.each do |obj|
                    resource = Resource.object(key)
                    resource.info(obj['id'])

                    if key != 'flowtemplates'
                        resource.one.update("PROVISION_ID=#{self['ID']}", true)
                    else
                        resource.one.update("{\"PROVISION_ID\":#{self['ID']}}",
                                            true)
                    end
                end
            end
        end

    end

end
