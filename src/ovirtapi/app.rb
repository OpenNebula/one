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

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
end

# %%RUBYGEMS_SETUP_BEGIN%%
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }

        # Suppress warnings from Rubygems
        # https://github.com/OpenNebula/one/issues/5379
        begin
            verb = $VERBOSE
            $VERBOSE = nil
            require 'rubygems'
            Gem.use_paths(real_gems_path)
        ensure
            $VERBOSE = verb
        end
    end
end
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << RUBY_LIB_LOCATION + '/cli'

require 'json'
require 'rexml/document'
require 'sinatra'
require 'logger'
require 'yaml'
require 'base64'
require_relative 'controllers/helper_functions'

# Load config
config_location = ENV['ONE_LOCATION'] ? "#{ENV['ONE_LOCATION']}/etc/one" : '/etc/one'
CONFIG = YAML.load_file("#{config_location}/ovirtapi-server.yml")

# Sinatra Settings
configure do
    set :port, CONFIG['sinatra']['port']
    set :logging, CONFIG['sinatra']['logging']
    set :bind, CONFIG['sinatra']['bind']
end

# App Constants
ONE_XMLRPC = CONFIG['app']['one_xmlrpc']
ENDPOINT = "http://#{ONE_XMLRPC}:#{CONFIG['app']['endpoint_port']}/RPC2"
CERT_PATH = CONFIG['app']['cert_path']
PUBLIC_IP = CONFIG['app']['public_ip']
ONEBEX_PORT = CONFIG['app']['onebex_port']
ONEBEX_PORT_SSL = CONFIG['app']['onebex_port_ssl']
TMP_IMAGES_PATH = CONFIG['app']['tmp_images_path']
DEBUG = CONFIG['app']['debug'] == 'true'
BACKUP_FREEZE = CONFIG['app']['backup_freeze'] || 'NONE'
VEEAM_DATASTORE = CONFIG['app']['veeam_datastore']
PORTS_PATH = CONFIG['app']['ports_path']
PORT_MAX = CONFIG['app']['port_max']
PORT_MIN = CONFIG['app']['port_min']

finalize_marker_timeout = begin
    timeout_value = CONFIG['app'].fetch('finalize_marker_timeout', 300)
    Integer(timeout_value.to_s, 10)
rescue ArgumentError, TypeError
    300
end

finalize_marker_timeout = 300 if finalize_marker_timeout <= 0
FINALIZE_MARKER_TIMEOUT = finalize_marker_timeout

# Validate required config values
[
    ['one_xmlrpc', ONE_XMLRPC],
    ['cert_path', CERT_PATH],
    ['public_ip', PUBLIC_IP],
    ['onebex_port', ONEBEX_PORT],
    ['port_max', PORT_MAX],
    ['port_min', PORT_MIN]
].each do |name, value|
    if value.nil? || value == 'nil'
        raise "Missing required configuration: app.#{name} is not set in ovirtapi-server.yml"
    end
end

# Logging
LOGGER = Logger.new(STDOUT)
if DEBUG
    LOGGER.level = Logger::DEBUG
    LOGGER.debug('Debug mode enabled')
else
    LOGGER.level = Logger::INFO
end

configure do
    set :logger, LOGGER
end

# Handle persistent INSTANCE_ID
id_file_path = '/var/lib/one/.one/ovirtapi-id'

begin
    if File.exist?(id_file_path)
        instance_id = File.read(id_file_path).strip
        INSTANCE_ID = instance_id unless instance_id.empty?
    end

    unless defined?(INSTANCE_ID)
        LOGGER.info('Generating new Instance ID...')
        new_id = SecureRandom.uuid

        FileUtils.mkdir_p(File.dirname(id_file_path))
        File.write(id_file_path, new_id)
        INSTANCE_ID = new_id
    end
rescue StandardError => e
    LOGGER.error("Error: Could not read/write instance ID file: (#{e.message})")
    exit(255)
end

# Log all constants
LOGGER.info('--- oVirt API Configuration ---')
LOGGER.info("ONE_XMLRPC: #{ONE_XMLRPC}")
LOGGER.info("ENDPOINT: #{ENDPOINT}")
LOGGER.info("CERT_PATH: #{CERT_PATH}")
LOGGER.info("PUBLIC_IP: #{PUBLIC_IP}")
LOGGER.info("ONEBEX_PORT: #{ONEBEX_PORT}")
LOGGER.info("ONEBEX_PORT_SSL: #{ONEBEX_PORT_SSL || 'Not configured (using HTTP)'}")
LOGGER.info("FINALIZE_MARKER_TIMEOUT: #{FINALIZE_MARKER_TIMEOUT}")
if CONFIG['app'].key?('image_unlock_timeout')
    LOGGER.warn('app.image_unlock_timeout is ignored; LOCKED images remain finalizing.')
end
LOGGER.info("TMP_IMAGES_PATH: #{TMP_IMAGES_PATH}")
LOGGER.info("INSTANCE_ID: #{INSTANCE_ID}")
LOGGER.info("DEBUG: #{DEBUG}")
LOGGER.info('-------------------------------')

# Load controllers
require_relative 'controllers/cluster_controller'
require_relative 'controllers/network_controller'
require_relative 'controllers/storage_controller'
require_relative 'controllers/tag_controller'
require_relative 'controllers/user_controller'
require_relative 'controllers/vm_controller'
require_relative 'controllers/host_controller'
require_relative 'controllers/backup_controller'
require_relative 'controllers/disk_controller'
require_relative 'controllers/imagetransfer_controller'

# Start controllers
ImageTransferController.start
JobsController.start
UserController.start

# Set responses to JSON
before do
    content_type :json

    image_transfer_request = request.path.start_with?('/images/') &&
                             ['OPTIONS', 'PUT', 'PATCH'].include?(request.request_method)
    public_request = request.path == '/ovirt-engine/services/pki-resource' ||
                     request.path == '/ovirt-engine/sso/oauth/token' ||
                     image_transfer_request
    unless public_request || !request.env['HTTP_AUTHORIZATION'].to_s.strip.empty?
        halt 401, { :error => 'Authentication required' }.to_json
    end
end

after do
    next unless LOGGER.debug?
    next if request.path == '/ovirt-engine/sso/oauth/token'

    response_body = response.body.join # Join the array of response body parts into a single string
    # Never materialize binary uploads for logging; bound other request previews.
    if request.request_method == 'PUT' && request.path.start_with?('/images/')
        request_body = '[binary upload omitted]'
    else
        request.body.rewind
        request_body = request.body.read(4096)
        request.body.rewind
    end
    LOGGER.debug(' ')
    LOGGER.debug('↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧')
    LOGGER.debug("Request: #{request.request_method} #{request.path} | " \
                "Request Body: #{request_body} | " \
                "Response Status: #{response.status} | " \
                "Response Body: #{response_body} | ")
    LOGGER.debug('↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥↥')
    LOGGER.debug(' ')
end

# Check if credentials are valid by listing users with the client
def get_client(credentials)
    credentials = Base64.decode64(credentials) if credentials && !credentials.include?(':')
    username, password = credentials.to_s.split(':', 2)
    if username.to_s.empty? || password.to_s.empty?
        log_authentication_failure('invalid_credential_format')
        halt 401, { :message => 'Unauthorized: Invalid or missing credentials' }.to_json
    end

    client = OpenNebula::Client.new(credentials, ENDPOINT)

    user_pool = OpenNebula::UserPool.new(client)
    rc = user_pool.info

    if OpenNebula.is_error?(rc)
        log_authentication_failure('opennebula_validation_failed', rc.errno)
        if [OpenNebula::Error::EAUTHENTICATION, OpenNebula::Error::EAUTHORIZATION].include?(rc.errno)
            halt 401, { :message => 'Unauthorized: Invalid credentials' }.to_json
        end

        halt 500, Helper.fault_response('Unable to validate credentials with OpenNebula').to_json
    end

    return client
end

# Do not log credentials, tokens, or backend messages that may contain them.
def log_authentication_failure(reason, errno = nil)
    scheme = request.env['HTTP_AUTHORIZATION'].to_s.split(' ', 2).first.to_s.downcase
    scheme = 'other' unless ['basic', 'bearer', 'digest', 'negotiate'].include?(scheme)
    LOGGER.warn("Authentication failure: reason=#{reason} scheme=#{scheme} " \
                "method=#{request.request_method} path=#{request.path} backend_errno=#{errno}")
end

# Global error handlers to ensure any uncaught failures emit the fault payload
error Sinatra::NotFound do
    halt 404, Helper.fault_response('Resource not found').to_json
end

error Helper::LookupError do |err|
    halt err.status, Helper.fault_response(err.message).to_json
end

error Helper::Pagination::InvalidParameter do |err|
    halt 400, Helper.fault_response(err.message).to_json
end

error Helper::InvalidParameter do |err|
    halt 400, Helper.fault_response(err.message).to_json
end

error OpenNebula::Error do |err|
    LOGGER.error("OpenNebula error: #{err.message}")
    LOGGER.error("Backtrace: #{Array(err.backtrace).join("\n")}") if DEBUG
    halt 500, Helper.fault_response("OpenNebula error: #{err.message}", err).to_json
end

error StandardError do |err|
    LOGGER.error("Unhandled error: #{err.message}")
    LOGGER.error("Backtrace: #{Array(err.backtrace).join("\n")}") if DEBUG
    halt 500, Helper.fault_response('Internal server error.', err).to_json
end

API_PREFIX = '/ovirt-engine/api'

# Get Certificate
get '/ovirt-engine/services/pki-resource' do
    content_type 'text/plain'
    File.read(CERT_PATH)
end

get API_PREFIX.to_s do
    auth_header = request.env['HTTP_AUTHORIZATION']
    auth_type = auth_header.split(' ').first.downcase rescue 'basic'
    raw = auth_header.split(' ').last
    credentials = auth_type == 'bearer' ? raw : Base64.decode64(raw)
    client = get_client(credentials)

    _rc, hosts = HostController.get_ovirt_hosts(client)
    host_count = hosts[:host].count rescue 0
    _rc, storagedomains = StorageController.get_ovirt_storagedomains(client)
    storage_domain_count = storagedomains[:storage_domain].count rescue 0
    user_count = UserController.get_user(client).count
    _rc, vm_data = VmController.get_ovirt_vms(client)
    vm_count = vm_data[:vm].count rescue 0

    user_id = Helper.int_to_uuid(UserController.get_user(client, credentials.split(':').first).id)

    {
        :product_info => {
            :instance_id => INSTANCE_ID,
          :name => 'OpenNebula oVirt API',
          :version => {
              :build => '0',
            :full_version => '0.0.0',
            :major => '0',
            :minor => '0',
            :revision => '0'
          }
        },
      :summary => {
          :hosts => {
              :active => host_count,
            :total => host_count
          },
        :storage_domains => {
            :active => storage_domain_count,
          :total => storage_domain_count
        },
        :users => {
            :active => user_count,
          :total => user_count
        },
        :vms => {
            :active => vm_count,
          :total => vm_count
        }
      },
      :effective_user => {
          :id => user_id
      },
      :links => [
          {
              :href => '/ovirt-engine/api/clusters',
            :rel => 'clusters'
          },
          {
              :href => '/ovirt-engine/api/datacenters',
            :rel => 'datacenters'
          },
          {
              :href => '/ovirt-engine/api/hosts',
            :rel => 'hosts'
          },
          {
              :href => '/ovirt-engine/api/storagedomains',
            :rel => 'storagedomains'
          },
          {
              :href => '/ovirt-engine/api/tags',
            :rel => 'tags'
          },
          {
              :href => '/ovirt-engine/api/vms',
            :rel => 'vms'
          },
          {
              :href => '/ovirt-engine/api/disks',
            :rel => 'disks'
          },
          {
              :href => '/ovirt-engine/api/vnicprofiles',
            :rel => 'vnicprofiles'
          },
          {
              :href => '/ovirt-engine/api/imagetransfers',
            :rel => 'imagetransfers'
          }
      ]
    }.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#oauth-authentication
get '/ovirt-engine/sso/oauth/token' do
    username = params['username']
    password = params['password']

    if username.nil? || password.nil? || username.empty? || password.empty?
        LOGGER.error('Missing username or password in token request')
        status 400
        return { :error => 'Missing username or password' }.to_json
    end

    content_type :json
    result = UserController.get_token(username, password)
    if result.is_a?(Array)
        status_code, body = result
        halt status_code, body.to_json
    end
    result
rescue OpenNebula::Error => e
    LOGGER.error("Authentication failed: #{e.message}")
    halt 401, { :error => 'Authentication failed' }.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#oauth-authentication
post '/ovirt-engine/sso/oauth/token' do
    username = params['username']
    password = params['password']

    if username.nil? || password.nil? || username.empty? || password.empty?
        LOGGER.error('Missing username or password in token request')
        status 400
        return { :error => 'Missing username or password' }.to_json
    end

    content_type :json
    result = UserController.get_token(username, password)
    if result.is_a?(Array)
        status_code, body = result
        halt status_code, body.to_json
    end
    result
rescue OpenNebula::Error => e
    LOGGER.error("Authentication failed: #{e.message}")
    halt 401, { :error => 'Authentication failed' }.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/tags/methods/list
get "#{API_PREFIX}/tags" do
    token = request.env['HTTP_AUTHORIZATION'].split(' ').last
    client = get_client(token)
    user = token.split(':').first
    rc, data = TagController.get_tags(client, user)
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/data_centers/methods/list
get "#{API_PREFIX}/datacenters" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    rc, data = ClusterController.get_ovirt_dcs(client, :max => params[:max],
                                            :search => params[:search])
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/data_centers/methods/list
get "#{API_PREFIX}/datacenters/:id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    dc_id = Helper.uuid_to_int(params[:id])
    rc, data = ClusterController.get_ovirt_dcs(client, :id => dc_id.to_i)
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/attached_storage_domains/methods/list
get "#{API_PREFIX}/datacenters/:id/storagedomains" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    dc_id = Helper.uuid_to_int(params[:id])
    rc, data = ClusterController.get_ovirt_dc_storagedomains(client, dc_id.to_i)
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/data_center_networks/methods/list
get "#{API_PREFIX}/datacenters/:id/networks" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    dc_id = Helper.uuid_to_int(params[:id])
    rc, data = ClusterController.get_ovirt_dc_networks(client, dc_id)
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vnic_profiles/methods/list
get "#{API_PREFIX}/vnicprofiles" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    rc, data = NetworkController.get_ovirt_vnicprofiles(client)
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vnic_profile/methods/get
get "#{API_PREFIX}/vnicprofiles/:id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vn_id = Helper.uuid_to_int(params[:id])
    rc, data = NetworkController.get_ovirt_vnicprofiles(client, :id => vn_id)
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/clusters/methods/list
get "#{API_PREFIX}/clusters" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    rc, data = ClusterController.get_ovirt_clusters(client, :max => params[:max],
                                                 :search => params[:search])
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/cluster/methods/get
get "#{API_PREFIX}/clusters/:id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    cluster_id = Helper.uuid_to_int(params[:id])
    rc, data = ClusterController.get_ovirt_clusters(client, :id => cluster_id)
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/storagedomains/methods/list
get "#{API_PREFIX}/storagedomains" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    rc, data = StorageController.get_ovirt_storagedomains(client, :max => params[:max],
                                                      :search => params[:search])
    halt rc if rc!=200
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/assigned_tags/methods/add
post "#{API_PREFIX}/vms/:id/tags" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    TagController.add_vm_tag(client, params[:id], JSON.parse(request.body.read)['name'])
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/hosts/methods/list
get "#{API_PREFIX}/hosts" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    rc, data = HostController.get_ovirt_hosts(client, :max => params[:max],
                                           :search => params[:search], :follows => params[:follow])
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/host/methods/get
get "#{API_PREFIX}/hosts/:id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    host_id = Helper.uuid_to_int(params[:id])
    rc, data = HostController.get_ovirt_hosts(client, :id => host_id, :follows => params[:follow])
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/host_statistics/methods/list
get "#{API_PREFIX}/hosts/:id/statistics" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    host_id = Helper.uuid_to_int(params[:id])
    rc, data = HostController.get_ovirt_host_statistics(client, host_id)
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm_backups/methods/list
get "#{API_PREFIX}/vms/:id/backups" do
    content_type :json

    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)

    vm_id = Helper.uuid_to_int(params[:id])
    rc, body = BackupController.get_ovirt_backups_for_vm(client, vm_id)
    halt rc, body
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm_backups/methods/add
post "#{API_PREFIX}/vms/:id/backups" do
    begin
        auth_token = request.env['HTTP_AUTHORIZATION']&.split(' ')&.last
        halt 401, { :error => 'Unauthorized' }.to_json unless auth_token

        client = OpenNebula::Client.new(auth_token, ENDPOINT)

        request_body = JSON.parse(request.body.read) rescue halt(
            400,
            { :error => 'Invalid JSON format' }.to_json
        )

        if request_body.key?('from_checkpoint_id')
            from_checkpoint_id = request_body['from_checkpoint_id']
        else
            from_checkpoint_id = nil
        end
        LOGGER.info("Request body: #{request_body}")
        veeam_description = request_body['description']
        vm_id = Helper.uuid_to_int(params[:id])

        status_code, message = BackupController.perform_backup(client, vm_id, from_checkpoint_id,
                                                               veeam_description)

        halt status_code, message
    rescue Helper::LookupError
        raise
    rescue OpenNebula::Error => e
        halt 500, Helper.fault_response("OpenNebula error: #{e.message}").to_json
    rescue JSON::ParserError
        halt 400, { :error => 'Invalid JSON format' }.to_json
    rescue StandardError => e
        halt 500, Helper.fault_response("Internal server error: #{e.message}").to_json
    end
end

get "#{API_PREFIX}/vms/:id/backups/:backup_id" do
    begin
        auth_token = request.env['HTTP_AUTHORIZATION']&.split(' ')&.last
        halt 401, { :error => 'Unauthorized' }.to_json unless auth_token

        client = OpenNebula::Client.new(auth_token, ENDPOINT)

        vm_id = Helper.uuid_to_int(params[:id])
        vm = VmController.get_one_vms(client, :vm_id => vm_id)

        vm_hash = vm.to_hash
        hist = vm_hash['VM']['HISTORY_RECORDS']['HISTORY']
        host = hist.is_a?(Array) ? hist.last['HOSTNAME'] : hist['HOSTNAME']

        if host.nil?
            LOGGER.error "Unable to find host for VM #{vm_id}"
            halt 500, Helper.fault_response("Unable to find host for VM #{vm_id}")
        end

        if ONEBEX_PORT.to_s.empty?
            LOGGER.error 'OneBEX Port not defined. Please configure it in config/environment.rb.'
            halt 500, Helper.fault_response('OneBEX Port not defined.')
        end

        onebex_url = "http://#{host}:#{ONEBEX_PORT}"

        status_response = nil

        begin
            status_response = ImageTransferController.onebex_status(
                URI(onebex_url),
                vm_id
            )

            LOGGER.info "OneBEX status for VM #{vm_id}: #{status_response}"
        rescue StandardError => e
            LOGGER.warn "Could not get OneBEX status for VM #{vm_id}: #{e.message}"
        end

        mapping_path = BackupController.get_mapping_file_path(client)
        entry = nil
        if mapping_path && File.exist?(mapping_path)
            mapping = BackupController.read_backup_mapping(mapping_path)
            entry = mapping[params[:backup_id]]
        end

        phase = BackupController.pending_backup_phase(vm, entry, status_response)
        mapping_pending = entry &&
                          (entry['backup_id'].to_s.empty? || entry['increment_src'].to_s.empty?)
        if phase == 'succeeded' && mapping_pending
            BackupController.update_vm_backup(client, vm, params[:backup_id], params[:id])
        end

        veeam_description = BackupController.get_veeam_description(vm)

        decrypted_id = BackupController.decrypt_backup_uuid(
            client,
            params[:backup_id]
        )

        response = BackupController.onebex_backup_to_ovirtbackup(
            vm_id,
            params[:backup_id],
            decrypted_id[:checkpoint],
            veeam_description,
            phase
        )

        LOGGER.info("Backup response: #{response}")

        status 200
        content_type :json
        response
    rescue JSON::ParserError
        halt 400, { :error => 'Invalid JSON format' }.to_json
    rescue Helper::LookupError
        raise
    rescue StandardError => e
        LOGGER.error("Error getting backup #{params[:backup_id]}: #{e.message}")
        halt 500, Helper.fault_response("Internal server error: #{e.message}").to_json
    end
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/disks/methods/list
get "#{API_PREFIX}/disks" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    rc, data = DiskController.get_ovirt_disks(client, :max => params[:max],
                                           :search => params[:search])
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/disk/methods/get
get "#{API_PREFIX}/disks/:id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    rc, data = DiskController.get_ovirt_disk(client, params[:id])
    halt rc, data.to_json
end

put "#{API_PREFIX}/disks/:id" do
    get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    halt 200
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/disks/methods/add
post "#{API_PREFIX}/disks" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    body = JSON.parse(request.body.read)
    backup_ds = BackupController.find_backup_ds(client)
    rc, data = DiskController.create_disk(client,
                                          body['name'],
                                          Helper.uuid_to_int(
                                              body['storage_domains']['storage_domain'].first['id']
                                          ),
                                          body['provisioned_size'],
                                          backup_ds)
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/disk/methods/get
delete "#{API_PREFIX}/disks/:id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    disk_uuid = params[:id]
    rc, data = DiskController.delete_disk(client, disk_uuid)

    accepts_xml = request.env['HTTP_ACCEPT'].to_s.split(',').any? do |entry|
        media_type, *parameters = entry.split(';')
        next false unless ['application/xml', 'text/xml'].include?(media_type.strip.downcase)

        quality = parameters.find {|parameter| parameter.strip.start_with?('q=') }
        quality.nil? || quality.split('=', 2).last.to_f > 0
    end

    if rc == 200 && accepts_xml
        action = REXML::Document.new
        root = action.add_element('action')
        root.add_element('job', data.fetch('job')) if data['job']
        root.add_element('status').text = data.fetch('status')
        content_type 'application/xml'
        halt rc, action.to_s
    end

    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/disk_attachments/methods/list
get "#{API_PREFIX}/vms/:id/diskattachments" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    DiskController.get_vm_diskattachments(client, vm_id.to_i).to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/disk_attachment/methods/get
get "#{API_PREFIX}/vms/:id/diskattachments/:disk_id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    DiskController.get_vm_diskattachment(client, vm_id.to_i, params[:disk_id]).to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/disk_attachment/methods/remove
delete "#{API_PREFIX}/vms/:id/diskattachments/:disk_id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    disk_uuid = params[:disk_id]

    rc = DiskController.delete_vm_diskattachment(client, vm_id.to_i, disk_uuid)

    # Ensure a valid HTTP status is returned
    halt rc
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/disk_attachments/methods/add
post "#{API_PREFIX}/vms/:id/diskattachments" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    request_body = JSON.parse(request.body.read)
    vm_id = Helper.uuid_to_int(params[:id])
    disk_id = DiskController.decrypt_disk_uuid(request_body['disk']['id'])[:disk_id]
    rc, data = DiskController.create_vm_diskattachment(client, vm_id.to_i, disk_id.to_i)
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm/methods/start
post "#{API_PREFIX}/vms/:id/start" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    rc, data = VmController.start_vm(client, vm_id.to_i)
    halt rc, data
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm/methods/stop
post "#{API_PREFIX}/vms/:id/stop" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    stop_response = VmController.stop_vm(client, vm_id.to_i)
    if stop_response.is_a?(Array)
        halt stop_response[0], stop_response[1]
    end
    halt stop_response
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm/methods/shutdown
post "#{API_PREFIX}/vms/:id/shutdown" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    shutdown_response = VmController.shutdown_vm(client, vm_id.to_i)
    if shutdown_response.is_a?(Array)
        halt shutdown_response[0], shutdown_response[1]
    end
    halt shutdown_response
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm/methods/poweroff
post "#{API_PREFIX}/vms/:id/poweroff" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    rc, data = VmController.poweroff_vm(client, vm_id.to_i)
    halt rc, data.to_json
end

post "#{API_PREFIX}/vms/:id/snapshots" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    request_body = JSON.parse(request.body.read)
    description = request_body['description']
    rc, data = VmController.take_snapshot(client, vm_id.to_i, description)

    halt rc, data.to_json
end

get "#{API_PREFIX}/vms/:id/snapshots/:snap_id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    rc, data = VmController.get_snapshot(client, vm_id.to_i, params[:snap_id])
    halt rc, data.to_json
end

delete "#{API_PREFIX}/vms/:id/snapshots/:snap_id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    rc, data = VmController.delete_snapshot(client, vm_id.to_i, params[:snap_id])
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm/methods/remove
delete "#{API_PREFIX}/vms/:id" do
    detach_only = Helper.parse_boolean_parameter(params[:detach_only], 'detach_only')
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    termination_response = VmController.terminate_vm(client, vm_id.to_i, detach_only)
    if termination_response
        halt termination_response[0], termination_response[1].to_json
    end
    halt 200
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm_nics/methods/list
get "#{API_PREFIX}/vms/:id/nics" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    NetworkController.get_ovirt_nics(client, vm_id.to_i, :follows => params[:follow]).to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm_nic/methods/get
get "#{API_PREFIX}/vms/:id/nics/:nic_id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    nic_id = Helper.uuid_to_int(params[:nic_id])
    NetworkController.get_ovirt_nics(client, vm_id.to_i,
                                     :nic_id => nic_id, :follows => params[:follow]).to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm_nic/methods/remove
delete "#{API_PREFIX}/vms/:id/nics/:nic_id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    nic_id = Helper.uuid_to_int(params[:nic_id])
    NetworkController.detach_ovirt_nic(client, vm_id.to_i, nic_id.to_i)
    halt 200
end

get "#{API_PREFIX}/vms/:id/reporteddevices" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    NetworkController.get_ovirt_reported_devices(client, vm_id.to_i, :max => params[:max]).to_json
end

get "#{API_PREFIX}/vms/:id/reporteddevices/:device_id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    NetworkController.get_ovirt_reported_devices(client, vm_id.to_i,
                                                 :device_id => params[:device_id]).to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm_nics/methods/add
post "#{API_PREFIX}/vms/:id/nics" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    body = JSON.parse(request.body.read)
    vm_id = Helper.uuid_to_int(params[:id])
    vnet_id = Helper.uuid_to_int(body['vnic_profile']['id'])
    result = NetworkController.attach_ovirt_nic(client, vm_id.to_i, vnet_id.to_i)
    halt result[0], result[1].to_json if result.is_a?(Array)

    result.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm_checkpoints/methods/list
get "#{API_PREFIX}/vms/:id/checkpoints" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    rc, data = BackupController.get_ovirt_checkpoints(client, vm_id.to_i)
    halt rc, data
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm_checkpoint/methods/remove
delete "#{API_PREFIX}/vms/:vm_id/checkpoints/:id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:vm_id])
    rc, data = BackupController.mark_checkpoint_invalid(client, vm_id.to_i, params[:id])
    halt rc, data
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/snapshots/methods/list
get "#{API_PREFIX}/vms/:id/snapshots" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    rc, data = VmController.get_ovirt_snapshots(client, vm_id.to_i)
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm/methods/get
get "#{API_PREFIX}/vms/:id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    rc, data = VmController.get_ovirt_vms(client, :vm_id => vm_id.to_i, :follows => params[:follow])
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vms/methods/list
get "#{API_PREFIX}/vms" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    rc, data = VmController.get_ovirt_vms(client, :follows => params[:follow],
                                       :search => params[:search], :max => params[:max])
    halt rc, data.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vms/methods/add
post "#{API_PREFIX}/vms" do
    begin
        client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
        body = JSON.parse(request.body.read)

        if body.dig('initialization', 'configuration', 'data')
            vm_template = body['initialization']['configuration']['data'].to_s
            cluster_id = body['cluster']['id']
            name = body['name']

            # Check if the template is an OVF document
            if vm_template.match?(/<\s*(?:[\w\-]+:)?Envelope\b/i)
                LOGGER.info('Detected OVF format. Translating to OpenNebula template...')

                # Catch both returned values
                one_template_str, disk_prefix = VmController.create_template_from_ovf(vm_template,
                                                                                      cluster_id)

                # Pass the disk_prefix into the method
                result = VmController.create_vm_from_text_template(client, one_template_str,
                                                                   disk_prefix)
            else
                LOGGER.info('Detected standard OpenNebula XML format.')
                # Proceed with your original XML manipulation method
                result = VmController.create_vm_from_template(client, vm_template, cluster_id,
                                                              name)
            end
        else
            result = VmController.create_vm(client, body)
        end
        halt result[0], result[1].to_json if result.is_a?(Array)

        halt 201, result.to_json
    rescue Helper::LookupError
        raise
    rescue StandardError => e
        LOGGER.error("Error: #{e.message}")
        LOGGER.error("Backtrace: #{e.backtrace.join("\n")}")
        halt 500, Helper.fault_response("Internal server error: #{e.message}").to_json
    end
end

get "#{API_PREFIX}/imagetransfers" do
    get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    content_type :json
    halt 200, [].to_json
end

post "#{API_PREFIX}/imagetransfers" do
    begin
        auth_token = request.env['HTTP_AUTHORIZATION']&.split(' ')&.last
        halt 401, { :error => 'Unauthorized' }.to_json unless auth_token

        client = OpenNebula::Client.new(auth_token, ENDPOINT)

        request_body = JSON.parse(request.body.read) rescue halt(
            400,
            { :error => 'Invalid JSON format' }.to_json
        )
        direction = request_body['direction']
        transfer_format = request_body['format'] # "raw" or "cow"
        if direction=='download'
            backup_id = request_body['backup']['id']
            # disk_uuid = request_body['disk']['id']
            disk = DiskController.decrypt_disk_uuid(request_body['disk']['id'])
            status_code, message = ImageTransferController.create_transfer_download(client,
                                                                                    backup_id,
                                                                                    disk,
                                                                                    transfer_format)
        elsif direction=='upload'
            # Refers to persistent image ID
            disk_id = DiskController.decrypt_disk_uuid(request_body['disk']['id'])[:disk_id]
            status_code, message = ImageTransferController.create_transfer_upload(client, disk_id,
                                                                                  transfer_format)
        else
            LOGGER.error "Received wrong direction value for ImageTransfer: #{direction}"
            halt 400,
                 {
                     :error => "Received wrong direction value for ImageTransfer: #{direction}"
                 }.to_json
        end
        halt status_code, message.to_json
    rescue Helper::LookupError
        raise
    rescue OpenNebula::Error => e
        LOGGER.error("Error: #{e.message}")
        LOGGER.error("Backtrace: #{e.backtrace.join("\n")}")
        halt 500, Helper.fault_response("OpenNebula error: #{e.message}").to_json
    rescue JSON::ParserError
        LOGGER.error("Error: #{e.message}")
        LOGGER.error("Backtrace: #{e.backtrace.join("\n")}")
        halt 400, { :error => 'Invalid JSON format' }.to_json
    rescue StandardError => e
        LOGGER.error("Error: #{e.message}")
        LOGGER.error("Backtrace: #{e.backtrace.join("\n")}")
        halt 500, Helper.fault_response("Internal server error: #{e.message}").to_json
    end
end

get "#{API_PREFIX}/imagetransfers/:uuid" do
    begin
        auth_token = request.env['HTTP_AUTHORIZATION']&.split(' ')&.last
        halt 401, { :error => 'Unauthorized' }.to_json unless auth_token

        _client = OpenNebula::Client.new(auth_token, ENDPOINT)

        status_code, response = ImageTransferController.get_transfer(params[:uuid])

        halt status_code, response.to_json
    rescue OpenNebula::Error => e
        halt 500, Helper.fault_response("OpenNebula error: #{e.message}").to_json
    rescue StandardError => e
        halt 500, Helper.fault_response("Internal server error: #{e.message}").to_json
    end
end

options '/images/:transfer_id' do
    begin
        response = {
            :features => [
                'checksum',
                'extents',
                'flush',
                'zero'
            ],
          :max_readers => 1,
          :max_writers => 1
        }.to_json

        halt 200, response
    rescue OpenNebula::Error => e
        halt 500, Helper.fault_response("OpenNebula error: #{e.message}").to_json
    rescue StandardError => e
        halt 500, Helper.fault_response("Internal server error: #{e.message}").to_json
    end
end

post "#{API_PREFIX}/imagetransfers/:uuid/finalize" do
    begin
        auth_token = request.env['HTTP_AUTHORIZATION']&.split(' ')&.last
        halt 401, { :error => 'Unauthorized' }.to_json unless auth_token

        client = OpenNebula::Client.new(auth_token, ENDPOINT)

        status_code, response = ImageTransferController.finalize_transfer(client, params[:uuid])

        halt status_code, response.to_json
    rescue Helper::LookupError
        raise
    rescue OpenNebula::Error => e
        LOGGER.error("OpenNebula error: #{e.message}")
        halt 500, Helper.fault_response("OpenNebula error: #{e.message}").to_json
    rescue StandardError => e
        LOGGER.error("Internal server error: #{e.message}")
        halt 500, Helper.fault_response("Internal server error: #{e.message}").to_json
    end
end

post "#{API_PREFIX}/imagetransfers/:uuid/cancel" do
    begin
        auth_token = request.env['HTTP_AUTHORIZATION']&.split(' ')&.last
        halt 401, { :error => 'Unauthorized' }.to_json unless auth_token

        client = OpenNebula::Client.new(auth_token, ENDPOINT)

        status, response = ImageTransferController.finalize_transfer(
            client, params[:uuid], :cancel => true
        )

        halt status, response.to_json
    rescue Helper::LookupError
        raise
    rescue OpenNebula::Error => e
        halt 500, Helper.fault_response("OpenNebula error: #{e.message}").to_json
    rescue StandardError => e
        halt 500, Helper.fault_response("Internal server error: #{e.message}").to_json
    end
end

put '/images/:transfer_id' do
    begin
        # Extract image_id from URL params
        transfer_id = params[:transfer_id]

        # Validate the image_id format (UUID)
        unless transfer_id =~ /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            LOGGER.error('Invalid transfer ID format')
            halt 400, { :error => 'Invalid transfer ID format' }.to_json
        end

        # Check if the Range header exists
        range_header = request.env['HTTP_CONTENT_RANGE']

        # Chunk of bytes, splitted upload
        if range_header
            # Parse the Content Range header (format: "bytes=start-end")
            match_data = range_header.match(%r{bytes (\d+)-(\d+)/(\d+)})

            unless match_data
                LOGGER.error "Invalid Range format: #{match_data}"
                halt 400, { :error => 'Invalid Range format. Expected: bytes=start-end' }.to_json
            end

            start_byte = match_data[1].to_i
            end_byte = match_data[2].to_i
            total_size = match_data[3].to_i

        # Whole image upload in a single PUT request
        else
            start_byte = 0
            end_byte = request.content_length.to_i - 1
            total_size = request.content_length.to_i
        end

        rc, body = ImageTransferController.write_disk_range(transfer_id, start_byte, end_byte,
                                                            request.body, total_size)
        headers['Server'] = 'imageio/2.5.0'

        halt rc, body
    rescue Errno::ENOENT
        halt 404, { :error => 'Device file not found' }.to_json
    rescue Errno::EACCES
        halt 403, { :error => 'Permission denied accessing device file' }.to_json
    rescue StandardError => e
        LOGGER.error("Error: #{e.message}")
        LOGGER.error("Backtrace: #{e.backtrace.join("\n")}")
        halt 500, Helper.fault_response('Internal server error.', e).to_json
    end
end

patch '/images/:transfer_id' do
    # Extract image_id from URL params
    transfer_id = params[:transfer_id]

    # Validate the image_id format (UUID)
    unless transfer_id =~ /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        halt 400, { :error => 'Invalid transfer ID format' }.to_json
    end

    body = JSON.parse(request.body.read)

    unless body['op'] == 'flush'
        halt 400, ''
    end

    halt 200
end

post "#{API_PREFIX}/vms/:id/backups/:backup_id/finalize" do
    begin
        auth_token = request.env['HTTP_AUTHORIZATION']&.split(' ')&.last
        halt 401, { :error => 'Unauthorized' }.to_json unless auth_token

        client = OpenNebula::Client.new(auth_token, ENDPOINT)

        backup = BackupController.decrypt_backup_uuid(client, params[:backup_id])
        vm_id = backup[:vm_id]

        rc, msg = ImageTransferController.finalize_backup(client, vm_id)

        BackupController.mark_backup_finalized(client, params[:backup_id]) unless rc != 200

        halt rc, msg.to_json
    rescue Helper::LookupError
        raise
    rescue OpenNebula::Error => e
        halt 500, Helper.fault_response("OpenNebula error: #{e.message}").to_json
    rescue JSON::ParserError
        halt 400, { :error => 'Invalid JSON format' }.to_json
    rescue StandardError => e
        LOGGER.error("Error: #{e.message}")
        LOGGER.error("Backtrace: #{e.backtrace.join("\n")}")
        halt 500, Helper.fault_response('Internal server error.', e).to_json
    end
end

# Return disk list for a given backup (uses VEEAM_DISKS attribute when present)
get "#{API_PREFIX}/vms/:id/backups/:backup_id/disks" do
    begin
        auth_token = request.env['HTTP_AUTHORIZATION']&.split(' ')&.last
        halt 401, { :error => 'Unauthorized' }.to_json unless auth_token

        client = OpenNebula::Client.new(auth_token, ENDPOINT)
        backup = BackupController.get_backup(client, params[:backup_id])
        halt 401, { :error => 'Unauthorized' }.to_json if backup == 401
        halt 404, { :error => 'Backup not found' }.to_json if backup.nil?

        # Prefer explicit VEEAM_DISKS attribute on the backup image template
        veeam_disks_attr = backup.to_hash.dig('IMAGE', 'TEMPLATE', 'VEEAM_DISKS') rescue nil
        disk_uuids = []
        if veeam_disks_attr
            begin
                disk_uuids = JSON.parse(veeam_disks_attr)
            rescue StandardError => _e
                LOGGER.warn('VEEAM_DISKS attribute exists but is not valid' \
                    " JSON for backup #{params[:backup_id]}")
                disk_uuids = []
            end
        end

        # Fallback: compute from VM referenced by backup
        if disk_uuids.empty?
            backup_hash = backup.to_hash['IMAGE'] rescue nil
            vm_one_id = backup_hash.dig('VMS', 'ID') rescue nil
            if (vm_one_id.is_a?(Integer) && vm_one_id >= 0) ||
                    (vm_one_id.is_a?(String) && vm_one_id.match?(/\A[0-9]+\z/))
                disk_uuids = BackupController.compute_disk_uuids_for_vm(client, vm_one_id.to_i)
            end
        end

        # Build oVirt-style disk objects for each uuid
        disks = []
        disk_uuids.each do |uuid|
            status, disk = DiskController.get_ovirt_disk(client, uuid)
            disks << disk if status == 200 && !disk.nil?
        end

        halt 200, { :disk => disks }.to_json
    rescue Helper::LookupError
        raise
    rescue StandardError => e
        LOGGER.error("Error fetching backup disks: #{e.message}")
        halt 500, Helper.fault_response('Internal server error.', e).to_json
    end
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm/methods/update
put "#{API_PREFIX}/vms/:id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    body = JSON.parse(request.body.read)
    vm_id = Helper.uuid_to_int(params[:id])
    update_response = VmController.update_vm(client, vm_id.to_i, body)
    if update_response.is_a?(Array)
        halt update_response[0], update_response[1].to_json
    end
    halt 200, update_response.to_json
end

# Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vm_nic/methods/update
# Curretnyl works the same as a getter since Veeam is not actually trying to change anything
put "#{API_PREFIX}/vms/:id/nics/:nic_id" do
    client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    vm_id = Helper.uuid_to_int(params[:id])
    nic_id = Helper.uuid_to_int(params[:nic_id])
    NetworkController.get_ovirt_nics(client, vm_id.to_i, :nic_id => nic_id).to_json
end

get "#{API_PREFIX}/jobs/:job_id" do
    _client = get_client(request.env['HTTP_AUTHORIZATION'].split(' ').last)
    job = JobsController.get_job(params[:job_id])
    if job.nil?
        LOGGER.error "Job #{params[:job_id]} not found"
        halt 404, 'Job not found'
    end
    halt 200, job.to_json
end

Sinatra::Application.run! if __FILE__ == $PROGRAM_NAME
