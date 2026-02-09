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

module OneForm

    # Provider Schema
    class ProvisionSchema < FormDocumentSchema

        params do
            required(:name).filled(:string)
            optional(:description).filled(:string)
            required(:deployment_file).filled(:string)
            optional(:onedeploy_tags).filled(:string)
            required(:provider_id).filled(:integer)

            required(:fireedge).hash do
                optional(:logo).filled(:string)
            end

            required(:user_inputs).array(:hash)
            required(:user_inputs_values).hash

            required(:one_objects).hash do
                required(:cluster).maybe(:hash)
                required(:hosts).maybe(:array)
                required(:networks).filled(:array)
                required(:datastores).filled(:array)
            end

            required(:state).filled(:integer)
            required(:tfstate).hash
            required(:historic).array(:hash)
            required(:registration_time).filled(:integer)
        end

    end

    # The ProvisionDocumentPool is a set of Provision document elements
    class ProvisionDocumentPool < OpenNebula::DocumentPoolJSON

        DOCUMENT_TYPE = 104

        def initialize(client, user_id = OpenNebula::Pool::INFO_ALL)
            super(client, user_id)
        end

        def list
            map(&:name)
        end

        def ids
            map(&:id)
        end

        def exists?(id)
            ids.include?(id)
        end

    end

    # Provider class
    class Provision < OpenNebula::DocumentJSON

        include OneHelper
        include Command

        attr_reader :client, :body, :tag

        conf = ConfigLoader.instance.conf

        DOCUMENT_TYPE = ProvisionDocumentPool::DOCUMENT_TYPE
        TEMPLATE_TAG  = 'PROVISION_BODY'
        REDACTED_MARK = '__redacted__'
        BASE_DIR      = conf[:work_dir]

        # Log configuration
        # Mon Feb 03 06:02:30 2025 [E]: Error message example
        MSG_FORMAT  = %(%s [%s]: %s\n)
        # Mon Feb 03 06:02:30 2025
        DATE_FORMAT = '%a %b %d %H:%M:%S %Y'

        PROVISION_ATTRS = [
            'name',
            'description',
            'deployment_file',
            'onedeploy_tags',
            'fireedge',
            'user_inputs',
            'user_inputs_values',
            'provider_id',
            'state',
            'tags',
            'tfstate',
            'one_objects',
            'registration_time',
            'historic'
        ]

        # List of attributes that can't be changed in update operation
        # registration_time: this is internal info managed by OneForm server
        IMMUTABLE_ATTRS = [
            'provider_id',
            'registration_time'
        ]

        # Attributes update properties
        UPDATE_ATTRS = [
            'name',
            'description',
            'user_inputs_values',
            'one_objects',
            'onedeploy_tags'
        ]

        REMOVABLE_RESOURCES = [
            'hosts',
            'networks',
            'datastores'
        ]

        # Provision states
        STATE = {
            'PENDING'                       => 0,
            'INIT'                          => 1,
            'PLANNING'                      => 2,
            'APPLYING'                      => 3,
            'CONFIGURING_PROVISION'         => 4,
            'CONFIGURING_ONE'               => 5,
            'RUNNING'                       => 6,
            'SCALING'                       => 7,
            'DEPROVISIONING_ONE'            => 8,
            'DEPROVISIONING'                => 9,
            'DONE'                          => 10,
            'INIT_FAILURE'                  => 11,
            'PLANNING_FAILURE'              => 12,
            'APPLYING_FAILURE'              => 13,
            'CONFIGURING_PROVISION_FAILURE' => 14,
            'CONFIGURING_ONE_FAILURE'       => 15,
            'SCALING_FAILURE'               => 16,
            'DEPROVISIONING_ONE_FAILURE'    => 17,
            'DEPROVISIONING_FAILURE'        => 18,
            'DONE_FAILURE'                  => 19
        }

        STATE_STR     = STATE.keys
        FAILED_STATES = STATE.keys.select {|state| state.include?('FAILURE') }

        # State transitions
        STATE_TRANSITIONS = {
            'PENDING'                       => ['INIT'],
            'INIT'                          => ['PLANNING', 'INIT_FAILURE'],
            'PLANNING'                      => ['APPLYING', 'PLANNING_FAILURE'],
            'APPLYING'                      => ['CONFIGURING_ONE', 'APPLYING_FAILURE'],
            'CONFIGURING_ONE'               => ['CONFIGURING_PROVISION', 'CONFIGURING_ONE_FAILURE'],
            'CONFIGURING_PROVISION'         => ['RUNNING', 'CONFIGURING_PROVISION_FAILURE'],
            'RUNNING'                       => ['SCALING', 'DEPROVISIONING_ONE'],
            'DEPROVISIONING_ONE'            => ['DEPROVISIONING', 'DEPROVISIONING_ONE_FAILURE'],
            'DEPROVISIONING'                => ['DONE', 'DEPROVISIONING_FAILURE', 'RUNNING'],
            'DONE'                          => ['DONE_FAILURE'],
            'INIT_FAILURE'                  => ['INIT'],
            'PLANNING_FAILURE'              => ['PLANNING'],
            'APPLYING_FAILURE'              => ['APPLYING'],
            'CONFIGURING_PROVISION_FAILURE' => ['CONFIGURING_PROVISION'],
            'CONFIGURING_ONE_FAILURE'       => ['CONFIGURING_ONE'],
            'SCALING_FAILURE'               => ['SCALING'],
            'DEPROVISIONING_ONE_FAILURE'    => ['DEPROVISIONING_ONE'],
            'DEPROVISIONING_FAILURE'        => ['DEPROVISIONING'],
            'DONE_FAILURE'                  => ['DONE'],
            'SCALING'                       => [
                'RUNNING', 'SCALING_FAILURE',
                'INIT', 'DEPROVISIONING_ONE'
            ]
        }

        RECOVER_STATES = {
            'INIT'                  => ['INIT_FAILURE'],
            'PLANNING'              => ['PLANNING_FAILURE'],
            'APPLYING'              => ['APPLYING_FAILURE'],
            'CONFIGURING_PROVISION' => ['CONFIGURING_PROVISION_FAILURE'],
            'CONFIGURING_ONE'       => ['CONFIGURING_ONE_FAILURE'],
            'SCALING'               => ['SCALING_FAILURE'],
            'DEPROVISIONING_ONE'    => ['DEPROVISIONING_ONE_FAILURE'],
            'DEPROVISIONING'        => ['DEPROVISIONING_FAILURE'],
            'DONE'                  => ['DONE_FAILURE']
        }

        ACTIONS = {
            :change_state        => 'State changed',
            :tf_resource_created => 'Resource provisioned',
            :tf_resource_deleted => 'Resource deprovisioned',
            :one_object_created  => 'OpenNebula object created',
            :one_object_deleted  => 'OpenNebula object deleted'
        }

        def initialize(client, opts = {})
            @tag = TEMPLATE_TAG

            xml = if opts[:id]
                      OpenNebula::Document.build_xml(opts[:id])
                  elsif opts[:xml]
                      opts[:xml]
                  else
                      OpenNebula::Document.build_xml
                  end

            super(xml, client)

            @logger = logger if opts[:id]
        end

        # Create a new Provision object from the given XML element
        #
        # @param [OpenNebula::Client] client the OpenNebula client
        # @param [String] XML object
        def self.new_from_xml(client, xml)
            Provision.new(client, :xml => xml)
        end

        # Create a new Provision object from the given ID
        # and tries to retrieve the body xml representation of the Provider
        #
        # @param [OpenNebula::Client] client the OpenNebula client
        # @param [String] id the object ID
        def self.new_from_id(client, id)
            provision = Provision.new(client, :id => id)
            rc = provision.info

            return rc if OpenNebula.is_error?(rc)

            provision
        end

        # Validate a Provision against the schema
        #
        # @return [nil, OpenNebula::Error] nil in case of success
        def self.validate(provision)
            schema = ProvisionSchema.new
            validation = schema.call(provision)

            return OpenNebula::Error.new(
                {
                    'message' => 'Error validating Provision',
                    'context' => validation.errors.to_h
                },
                OpenNebula::Error::ENOTDEFINED
            ) if validation.failure?
        end

        # Return provision folder "/var/lib/one/form/provision/<id>/"
        def dir
            File.join(BASE_DIR, "#{id}/")
        end

        def logdir
            File.join(LOG_LOCATION, 'oneform/')
        end

        # Return log file name as "/var/log/one/oneform/<id>.log"
        def logfile
            File.join(logdir, "#{id}.log")
        end

        def to_h(opts = {})
            include_sensitive = opts[:include_sensitive] == true

            document = to_hash.clone
            template = Marshal.load(Marshal.dump(@body))

            # Transforming state
            template['state'] = str_state
            # Removing tfstate
            template.delete('tfstate')

            # Transforming tags
            template['tags'] = tags_values

            ui        = template['user_inputs'] || []
            ui_values = (template['user_inputs_values'] || {}).dup

            # Removing component from inputs
            ui.each do |input|
                input.delete('component')
            end

            # Remove oneform_tags from user_inputs_values if tags exist
            if template['tags'].is_a?(Array) && !template['tags'].empty?
                ui_values.delete(:oneform_tags)
            end

            # Redact sensitive values
            unless include_sensitive
                ui.each do |input|
                    sensitive = input[:sensitive] || input['sensitive']
                    name      = input[:name] || input['name']
                    next unless sensitive && name

                    ui_values[name] = REDACTED_MARK if ui_values.key?(name)
                end
            end

            template['user_inputs_values'] = ui_values

            document['DOCUMENT']['TEMPLATE'][TEMPLATE_TAG] = template
            document
        end

        def to_json(*args)
            super
        end

        # Returns a logger for this provision. Provision::dir should exist before
        # calling this method
        #   @param min level to log Logger::[ERROR|WARN|INFO|DEBUG]
        def logger(level = 'debug')
            FileUtils.mkdir_p(dir) unless File.exist?(dir)
            FileUtils.mkdir_p(logdir) unless File.exist?(logdir)

            Log.new(:type  => 'file',
                    :level => level,
                    :path  => logfile)
        end

        # Returns the auth user token which is used by the provision
        #
        # @return [String] the one user auth token
        def user_auth
            @client.one_auth
        end

        ########################################################
        ## ATTRIBUTES                                         ##
        ########################################################

        # Updates internal provision objects by refreshing relevant data from OpenNebula
        def update_objects
            check_unmanaged_resources
            update_ars

            # Update provision body after completing all checks
            update

            # Force hosts updating only after provisioning
            return unless str_state == 'CONFIGURING_PROVISION'

            hosts.each do |host|
                @logger.info("Activating host #{host['id']}...")
                host_forceupdate(@client, host['id']) if host['id']
            end
        end

        # ------------------------------------------------------
        # User Inputs
        # ------------------------------------------------------

        def user_input_by_name(name)
            user_inputs.find {|ui| ui['name'] == name }
        end

        def add_user_input(user_input)
            user_inputs << user_input
        end

        def remove_user_input(name)
            user_inputs.reject! {|ui| ui['name'] == name }
        end

        def user_input_value(name)
            return unless user_inputs_values.key?(name)

            user_inputs_values[name]
        end

        def update_user_input_value(name, value)
            return unless user_inputs_values.key?(name)

            user_inputs_values[name] = value
        end

        def tags_inputs
            user_inputs.select {|ui| ui['name'] == 'oneform_tags' }
        end

        def tags_values
            tags = tags_inputs.to_h {|ui| [ui['name'], user_inputs_values[ui['name']]] }
            tags['oneform_tags'] || {}
        end

        def onprem_hosts
            user_inputs_values['oneform_onprem_hosts'] || []
        end

        #------------------------------------------------------
        # Cluster
        #------------------------------------------------------

        def cluster_empty?
            return cluster.empty? || cluster['id'].nil?
        end

        # ------------------------------------------------------
        # Hosts
        # ------------------------------------------------------

        def add_host(id, resource_id, resource_ip)
            return if hosts.any? {|h| h['name'] == resource_ip }

            register_action(
                Provision::ACTIONS[:tf_resource_created],
                "#{resource_ip} provisioned"
            )

            hosts << { 'id' => id.to_i, 'resource_id' => resource_id, 'name' => resource_ip }
        end

        def remove_host(resource_ip)
            return unless hosts.any? {|h| h['name'] == resource_ip }

            hosts.reject! {|h| h['name'] == resource_ip }

            register_action(
                Provision::ACTIONS[:tf_resource_deleted],
                "#{resource_ip} deprovisioned"
            )

            if onprem?
                remove_onprem(resource_ip)
            else
                user_inputs_values['oneform_hosts'] -= 1
            end
        end

        def host_name?(name)
            hosts.any? {|h| h['name'] == name }
        end

        def host_id?(id)
            hosts.any? {|h| h['id'] == id.to_i }
        end

        def hosts_ips
            return [] unless hosts

            hosts.map {|node| node['name'] }.compact
        end

        # Onprem hosts are supported through `oneform_onprem_hosts` user input
        # which is a list of IPs. This is used to identify the hosts that are not
        # managed by any public cloud provider.

        def add_onprem(host)
            return unless onprem?

            user_inputs_values['oneform_onprem_hosts'] << host \
                unless user_inputs_values['oneform_onprem_hosts'].include?(host)
        end

        def remove_onprem(host)
            return unless onprem?

            user_inputs_values['oneform_onprem_hosts'].reject! {|h| h == host }
        end

        def onprem?
            user_inputs_values.key?('oneform_onprem_hosts')
        end

        # ------------------------------------------------------
        # Networks
        # ------------------------------------------------------

        def oneform_public_ips
            user_inputs_values['oneform_public_ips'].to_i
        end

        def oneform_public_ips=(count)
            user_inputs_values['oneform_public_ips'] = count.to_i
        end

        # Returns the elastic network from the provision.
        #
        # It searches for a virtual network with 'vn_mad' set to 'elastic'.
        # If more than one network matches, an error is raised.
        #
        # @return [Hash, nil] the matching network or nil if none found
        def elastic_net
            return if networks.nil? || !networks.is_a?(Array)

            elastic_nets = networks.select do |net|
                net.dig('template', 'vn_mad') == 'elastic'
            end

            if elastic_nets.size > 1
                raise 'Multiple virtual networks with vn_mad = elastic found'
            end

            elastic_nets.first
        end

        # Adds an address range to OpenNebula object and elastic network's template
        #
        # @param ar [Hash] the address range to add
        def add_ar(net, ar)
            return unless net && net['template']

            vn_id = net['id']
            raise 'Virtual network ID is missing' unless vn_id

            net['template']['ar'] ||= []
            raise 'Network AR is not an array' unless net['template']['ar'].is_a?(Array)

            @logger.info("Adding an AR to network #{vn_id} using #{ar['ipam_mad']} drivers")

            network_add_ar(@client, vn_id, { 'AR' => ar })
            net['template']['ar'] << ar
        rescue StandardError => e
            @logger.error(e.message)

            return OpenNebula::Error.new(
                "Error adding AR to vnet #{vn_id}: #{e.message}"
            )
        end

        # Remove an address range from the OpenNebula object and elastic network's template
        #
        # @param ar [Hash] the address range ID to reomve
        def remove_ar(net, ar_id)
            return unless net && net['template'] && net['template']['ar'].is_a?(Array)

            vn_id = net['id']
            raise 'Virtual network ID is missing' unless vn_id

            ar_list = net['template']['ar']
            unless ar_list.any? {|ar| ar['ar_id'].to_i == ar_id.to_i }
                raise "Address range with AR_ID=#{ar_id} not found in the network body"
            end

            @logger.info("Removing AR #{ar_id} from network #{vn_id}")

            network_rm_ar(@client, vn_id, ar_id)
            ar_list.reject! {|ar| ar['ar_id'].to_i == ar_id.to_i }
        rescue StandardError => e
            @logger.error(e.message)

            return OpenNebula::Error.new(
                "Error removing AR #{ar_id} from vnet #{vn_id}: #{e.message}"
            )
        end

        # Allocates public IP addresses to the provision via the IPAM driver,
        # provisioning exactly the number specified by `oneform_public_ips`
        def add_public_ip_ars
            elastic = elastic_net

            raise 'Elastic network not found' unless elastic.is_a?(Hash)

            return if oneform_public_ips <= 0

            provider = Provider.new_from_id(@client, provider_id)
            ar_pool  = elastic.dig('template', 'ar') || []
            ar_pool  = [ar_pool] if ar_pool.is_a?(Hash)
            count    = oneform_public_ips - ar_pool.size

            return if count <= 0

            count.times do
                ar_data = {
                    'ipam_mad'     => provider.driver,
                    'provision_id' => id,
                    'size'         => 1
                }

                add_ar(elastic, ar_data)
            end
        end

        # Removes a public IP address range from the elastic vnet
        #
        # @param ar_id [Integer,String] the AR_ID to remove
        def remove_public_ip_ar(ar_id)
            net = elastic_net
            raise 'Elastic network not found' unless net.is_a?(Hash)

            vn_id = net['id']
            raise 'Virtual network ID is missing' unless vn_id

            vn = network_info(@client, vn_id)
            return unless vn && vn['AR_POOL']

            remove_ar(net, ar_id)
        end

        # Updates the ARs of the elastic network in the provision using OpenNebula data
        def update_ars
            net = elastic_net
            return unless net

            vn_id = net['id']
            return unless vn_id

            vn = network_info(@client, vn_id)
            return unless vn && vn['AR_POOL']

            raw_ars = vn['AR_POOL']['AR']
            new_ars = raw_ars.is_a?(Array) ? raw_ars.compact : [raw_ars].compact

            new_ars = new_ars.map do |ar|
                {
                    'ipam'   => ar['IPAM_MAD'],
                    'ar_id'  => ar['AR_ID'].to_i,
                    'ip'     => ar['EXTERNAL_IP']
                }
            end

            net['template']['ar'] = new_ars
        end

        # ------------------------------------------------------
        # Datastores
        # ------------------------------------------------------

        def system_ds
            return if datastores.nil? || !datastores.is_a?(Array)

            datastores.find do |ds|
                ds.dig('template', 'type') == 'SYSTEM_DS'
            end
        end

        def image_ds
            return if datastores.nil? || !datastores.is_a?(Array)

            datastores.find do |ds|
                ds.dig('template', 'type') == 'IMAGE_DS'
            end
        end

        def file_ds
            return if datastores.nil? || !datastores.is_a?(Array)

            datastores.find do |ds|
                ds.dig('template', 'type') == 'FILE_DS'
            end
        end

        ########################################################
        ## PROVIDER OPERATIONS                                ##
        ########################################################

        # Fetch the provision body and define the accessors
        def info
            rc = super(true)

            return rc if OpenNebula.is_error?(rc)

            @body.each do |key, _|
                next unless PROVISION_ATTRS.include?(key)

                self.class.define_method(key) do
                    @body[key]
                end

                next if key == 'state'

                self.class.define_method("#{key}=") do |new_value|
                    @body[key] = new_value
                end
            end

            ['cluster', 'hosts', 'networks', 'datastores'].each do |attr|
                self.class.define_method(attr) do
                    @body['one_objects'][attr]
                end

                self.class.define_method("#{attr}=") do |value|
                    @body['one_objects'][attr] = value
                end
            end
        end

        # Allocate a new provision
        #
        # @param [Provider] provider the provider object
        # @param [ProvisionTemplate] provision_template the provision template
        # @param [String] conf_name the deployment configuration name
        # @param [Hash] user_inputs_values the user inputs values
        #
        # @return [nil, OpenNebula::Error] nil in case of success
        def allocate(provider, provision_template)
            template = provision_template.to_hash

            template['state']               = STATE['PENDING']
            template['provider_id']         = provider.id
            template['registration_time']   = Time.now.to_i
            template['tfstate']             = {}
            template['historic']            = []

            rc = Provision.validate(template)
            return rc if OpenNebula.is_error?(rc)

            rc = super(template.slice(*PROVISION_ATTRS).to_json, template['name'])
            return rc if OpenNebula.is_error?(rc)

            # Update the provider info
            provider.add_provision_id(id)
            rc = provider.update

            return rc if OpenNebula.is_error?(rc)

            # Fill body once allocated
            rc = info
            return rc if OpenNebula.is_error?(rc)

            # Recreating the logger since now we have a valid ID
            @logger = logger

            @logger.info("Provision '#{template['name']}' allocated")
            @logger.debug("Using '#{provider.name}' provider")
        end

        # Delete the provision
        # @return [nil, OpenNebula::Error] nil in case of success
        def delete(from_db = false)
            # Try to remove the provision id from the provider
            @logger.info("Removing provider #{provider_id} from provision")

            begin
                provider = Provider.new_from_id(@client, provider_id)
                provider.remove_provision_id(id)
                provider.update
            rescue StandardError => _e
                return OpenNebula::Error.new(
                    "Error removing provision ID from provider #{provider_id}"
                )
            end

            return unless from_db

            rc = super()
            return rc if OpenNebula.is_error?(rc)

            @logger.info("Provision #{id} deleted from database")
        end

        # Update the provision info. It only accepts the
        # attributes defined in UPDATE_ATTRS, ignoring the rest
        #
        # @param [Hash] Hash with the new attributes values
        # @return [nil, OpenNebula::Error] nil in case of success
        def update(json = {})
            json =  JSON.parse(json) if json.is_a?(String)
            nbody = @body.clone

            UPDATE_ATTRS.each do |attribute|
                next unless json[attribute]

                nbody[attribute] = json[attribute]
            end

            rc = rename(nbody['name']) if nbody['name'] != name
            return rc if OpenNebula.is_error?(rc)

            rc = super(nbody.to_json)
            return rc if OpenNebula.is_error?(rc)

            @body = nbody
        rescue StandardError => e
            return OpenNebula::Error.new(
                "Error updating provision: #{e.message}"
            )
        end

        def decode_tfstate
            return unless tfstate

            decoded_state    = Base64.decode64(tfstate)
            @body['tfstate'] = JSON.parse(decoded_state)
        end

        def include_provider
            provider_id = @body['provider_id']
            return unless provider_id

            provider = OneForm::Provider.new_from_id(@client, provider_id)
            raise provider if OpenNebula.is_error?(provider)

            @body['provider'] = provider.body
            @body.delete('provider_id')
        end

        # ------------------------------------------------------
        # OpenNebula Objects
        # ------------------------------------------------------

        def create_one_objects(success_cb, failure_cb)
            @logger.info('Creating OpenNebula objects')

            provider = Provider.new_from_id(@client, provider_id)
            suffix   = "(provision_#{id})"
            tags     = {
                'oneform' => {
                    'provision_id' => id,
                    'provider_id'  => provider.id,
                    'driver'       => provider.driver
                }.merge(tags_values)
            }

            run_block(@logger, success_cb, failure_cb) do
                # Create the OpenNebula objects for each resource type
                # create_resources method automatically skip a resource if
                # already exists in OpenNebula (has an ID)
                one_resources.each do |_, meta|
                    next if meta[:collection].empty?

                    create_resources(self, meta[:type], meta[:collection], tags, suffix)
                end

                # Create ARs for the provision public network
                add_public_ip_ars if elastic_net
                # Update the provision with the objects created in OpenNebula
                update_objects

                @logger.info('OpenNebula objects created and registered successfully')
            end
        rescue StandardError => e
            @logger.error("Error creating OpenNebula objects: #{e.message} - #{e.backtrace}")

            return OpenNebula::Error.new(
                "Error creating OpenNebula objects for provision #{id}: #{e.message}"
            )
        ensure
            # Update the provision with the objects created in OpenNebula (if any)
            update
        end

        # Deletes the provision objects in OpenNebula
        #
        # @param resources [Hash] Hash with the resources to delete
        # @param success_cb [lambda] executed if command was success
        # @param failure_cb [lambda] executed if command failed
        # @return [nil, OpenNebula::Error] nil in case of success
        def delete_one_objects(resources, success_cb, failure_cb)
            msg_ctx = resources.empty? ? 'all provision objects' : resources.keys.join(', ')
            @logger.info("Deleting OpenNebula #{msg_ctx}")

            del_resources = {}

            # Filter resources from one_objects
            # If resources is empty, delete all resources
            # If resources is not empty, delete only the resources specified
            one_resources.to_a.reverse_each do |key, _data|
                if resources.empty? || resources.key?(key)
                    del_resources[key] = select_resources(key, resources)
                else
                    del_resources[key] = []
                end
            end

            run_block(@logger, success_cb, failure_cb) do
                # Disable hosts in order to avoid new operations (if any)
                del_resources['hosts']&.each do |host|
                    host_disable(@client, host['id']) if host['id']
                end

                del_resources.each do |key, del_resource|
                    next if del_resource.nil? || del_resource.empty?

                    resource_type       = one_resources[key][:type]
                    resource_child_type = one_resources[key][:child_types]

                    delete_resources(self, resource_type, resource_child_type, del_resource)
                end

                update
                @logger.info("OpenNebula #{msg_ctx} deleted")
            end
        rescue StandardError => e
            @logger.error("Error deleting OpenNebula objects: #{e.message} - #{e.backtrace}")

            return OpenNebula::Error.new(
                "Error deleting OpenNebula objects for provision #{id}: #{e.message}"
            )
        ensure
            # Update the provision with the deleted objects in OpenNebula (if any)
            update
        end

        # ------------------------------------------------------
        # Unmanaged Objects
        # ------------------------------------------------------

        # Check if the provision has unmanaged objects. Updating the provision accordingly.
        # These are objects not registered in the provision but still depend on provision
        # resources. In case of empty type list, update every resource type.
        # Unmanaged resources are added as a child of the resource.
        #
        # @param types [Array<String>, nil] Resource types to check (e.g. ['host_vms', 'ds_images'])
        # @return [Hash, OpenNebula::Error] Hash with unmanaged resources found, filtered by type
        def check_unmanaged_resources(types = nil)
            one_resources.each do |key, meta|
                next if types && !types.include?(key)

                # Ignoring cluster since its the parent of the provision
                # and every resource itself is a child of the cluster
                next if key == 'cluster'

                # Not all resources have checks for unmanaged resources
                next unless meta[:checks] && meta[:checks][:fetch]

                fetch   = meta[:checks][:fetch]
                context = meta[:checks][:context]

                meta[:collection].each do |obj|
                    next unless obj['id']

                    childs_info = {}

                    meta[:child_types].each do |child_type|
                        fetched_ids = fetch.call(obj['id'])
                        next if fetched_ids.nil? || fetched_ids.empty?

                        childs_info[child_type] = fetched_ids
                        obj['childs']         ||= {}

                        # Check new / del resources and log them
                        current_childs = obj['childs'][child_type] || []
                        new_ids        = fetched_ids - current_childs
                        removed_ids    = current_childs - fetched_ids

                        new_ids.each do |new_id|
                            @logger.info(
                                "Unmanaged resource found: #{child_type} " \
                                "#{new_id} in #{context}"
                            )
                        end

                        removed_ids.each do |removed_id|
                            @logger.info(
                                "Unmanaged resource removed: #{child_type} " \
                                "#{removed_id} in #{context}"
                            )
                        end
                    end

                    obj['childs'] = childs_info
                end
            end

            # Update the provision with the unmanaged resources found
            update
        rescue StandardError => e
            @logger.error("Error checking unmanaged resources: #{e.message}")

            return OpenNebula::Error.new(
                "Error checking unmanaged resources: #{e.message}",
                OpenNebula::Error::EINTERNAL
            )
        end

        # Returns all unmanaged resources for the provision
        # @return [Hash] Hash with unmanaged resources found
        # Example:
        # {
        #     'hosts' => {
        #         1 => { 'vms' => [1, 2, 4] },
        #         2 => { 'vms' => [3] }
        #     },
        #     'networks' => {
        #         10 => { 'vms' => [6, 7] }
        #     },
        #     'datastores' => {
        #         20 => { 'image' => [99] }
        #     }
        # }
        def unmanaged_resources_all
            unmanaged_resources = {}

            one_resources.each do |resource_type, meta|
                # Ignoring cluster since its the parent of the provision
                # and every resource itself is a child of the cluster
                next if resource_type == 'cluster'

                meta[:collection].each do |obj|
                    next unless obj['childs'] && !obj['childs'].empty?

                    unmanaged_resources[resource_type] ||= {}
                    unmanaged_resources[resource_type][obj['id']] = obj['childs'] \
                        if obj['childs'].any?
                end
            end

            unmanaged_resources
        end

        # Returns all unmanaged resources for the given resource type
        # @param resource_type [String] The resource type to check (e.g. 'hosts', 'networks')
        # @return [Hash] Hash with unmanaged resources found
        # Example: { 1 => { 'vms' => [1, 2, 4] } }
        def unmanaged_resources_for(resource_type)
            unmanaged_resources = {}

            return unmanaged_resources unless one_resources.key?(resource_type)

            meta = one_resources[resource_type.to_s]

            meta[:collection].each do |obj|
                next unless obj['childs'] && !obj['childs'].empty?

                unmanaged_resources[obj['id']] = obj['childs'] if obj['childs'].any?
            end

            unmanaged_resources
        end

        # Return unmanaged children for a specific resource by type and ID
        # @param resource_type [String] The resource type to check (e.g. 'hosts', 'networks')
        # @param id [Integer] The ID of the resource to check
        # @return [Hash] Hash with unmanaged resources found
        # Example: { 'vms' => [1, 2, 4] }
        def unmanaged_resources_for_id(resource_type, id)
            return {} unless one_resources.key?(resource_type)

            meta = one_resources[resource_type]
            obj  = meta[:collection].find {|r| r['id'] == id }

            return {} unless obj
            return {} unless obj['childs'] && !obj['childs'].empty?

            obj['childs'].select {|_type, ids| ids && !ids.empty? }
        end

        # Check if the provision has unmmanaged resources
        def unmanaged_resources?
            unmanaged_resources_all.any?
        end

        # Check if the provision has unmanaged resources for the given type
        def unmanaged_resources_for?(resource_type)
            unmanaged_resources_for(resource_type).any?
        end

        # Check if a specific resource has unmanaged children
        def unmanaged_resources_for_id?(resource_type, id)
            unmanaged_resources_for_id(resource_type, id).any?
        end

        ########################################################
        ## STATE TRANSITIONS                                  ##
        ########################################################

        def state=(new_state)
            return if STATE_STR[state] == new_state

            raise("State #{new_state} is not a valid state") \
            unless STATE_STR.include?(new_state)

            raise("Invalid state transition '#{STATE_STR[state]}' => '#{new_state}'") \
            unless STATE_TRANSITIONS[STATE_STR[state]].include?(new_state)

            @logger.info("State changed from #{STATE_STR[state]} to #{new_state}")

            register_action(
                ACTIONS[:change_state],
                "State changed from #{STATE_STR[state]} to #{new_state}"
            )

            @body['state'] = STATE[new_state]
            update
        end

        def str_state
            STATE_STR[state]
        end

        def retry_state
            str_state.gsub('_FAILURE', '')
        end

        def running?
            state == STATE['RUNNING']
        end

        def error_state?
            FAILED_STATES.include?(STATE_STR[state])
        end

        def can_recover?(state_name)
            return false unless RECOVER_STATES.key?(state_name)

            RECOVER_STATES[state_name].include?(STATE_STR[state])
        end

        def can_deprovision?
            return ['RUNNING', 'DEPROVISIONING_ONE_FAILURE', 'SCALING'].include?(STATE_STR[state])
        end

        def can_scale?
            return ['RUNNING', 'SCALING_FAILURE'].include?(STATE_STR[state])
        end

        ########################################################
        ## HISTORIC                                           ##
        ########################################################

        def register_action(name, desc)
            historic << {
                'action' => name,
                'description' => desc,
                'time' => Time.now.to_i
            }
        end

        private

        # Defines the resources information for each OpenNebula Object
        # managed by the provision, including the data itself of each resource
        # Note: this need to be an instance method since refers to instance
        # variables such :collections or @client
        def one_resources
            {
                'cluster' => {
                    :collection  => [cluster],
                    :type        => 'cluster',
                    :child_types => [],
                    :checks      => {}
                },
                'datastores' => {
                    :collection  => datastores,
                    :type        => 'datastore',
                    :child_types => ['image'],
                    :checks      => {
                        :fetch   => ->(id) { datastore_associated_objects(@client, id) },
                        :context => 'provision datastores'
                    }
                },
                'networks' => {
                    :collection  => networks,
                    :type        => 'network',
                    :child_types => ['vm'],
                    :checks      => {
                        :fetch   => ->(id) { network_associated_objects(@client, id) },
                        :context => 'provision networks leases'
                    }
                },
                'hosts' => {
                    :collection  => hosts,
                    :type        => 'host',
                    :child_types => ['vm'],
                    :checks      => {
                        :fetch   => ->(id) { host_associated_objects(@client, id) },
                        :context => 'provision hosts'
                    }
                }
            }
        end

        # Select resources from the collection based on the provided type and ids
        # If resources is empty, return all resources
        def select_resources(type, resources)
            collection = one_resources[type.to_s][:collection]
            return [] if collection.nil? || collection.empty?

            # If resources is empty, return all resources
            # Otherwise, filter by the specified ids in resources
            return collection if resources.empty?

            collection.select {|r| resources[type.to_s]&.include?(r['id']) }
        end

    end

end
