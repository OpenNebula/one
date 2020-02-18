# rubocop:disable Naming/FileName
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

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    LOG_LOCATION      = '/var/log/one'
    VAR_LOCATION      = '/var/lib/one'
    ETC_LOCATION      = '/etc/one'
    LIB_LOCATION      = '/usr/lib/one'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    VAR_LOCATION      = ONE_LOCATION + '/var'
    LOG_LOCATION      = ONE_LOCATION + '/var'
    ETC_LOCATION      = ONE_LOCATION + '/etc'
    LIB_LOCATION      = ONE_LOCATION + '/lib'
end

ONEFLOW_AUTH       = VAR_LOCATION + '/.one/oneflow_auth'
ONEFLOW_LOG        = LOG_LOCATION + '/oneflow.log'
CONFIGURATION_FILE = ETC_LOCATION + '/oneflow-server.conf'

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << RUBY_LIB_LOCATION + '/cloud'
$LOAD_PATH << LIB_LOCATION + '/oneflow/lib'

require 'rubygems'
require 'sinatra'
require 'yaml'

require 'CloudAuth'
require 'CloudServer'

require 'models'
require 'log'

require 'LifeCycleManager'
require 'EventManager'

DEFAULT_VM_NAME_TEMPLATE = '$ROLE_NAME_$VM_NUMBER_(service_$SERVICE_ID)'

##############################################################################
# Configuration
##############################################################################

begin
    conf = YAML.load_file(CONFIGURATION_FILE)
rescue StandardError => e
    STDERR.puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
    exit 1
end

conf[:debug_level]      ||= 2
conf[:lcm_interval]     ||= 30
conf[:default_cooldown] ||= 300
conf[:shutdown_action]  ||= 'terminate'
conf[:action_number]    ||= 1
conf[:action_period]    ||= 60
conf[:vm_name_template] ||= DEFAULT_VM_NAME_TEMPLATE
conf[:auth]             = 'opennebula'

set :bind, conf[:host]
set :port, conf[:port]
set :config, conf

# rubocop:disable Style/MixinUsage
include CloudLogger
# rubocop:enable Style/MixinUsage

logger = enable_logging ONEFLOW_LOG, conf[:debug_level].to_i

use Rack::Session::Pool, :key => 'oneflow'

Log.logger = logger
Log.level  = conf[:debug_level].to_i

LOG_COMP = 'ONEFLOW'

Log.info LOG_COMP, 'Starting server'

begin
    ENV['ONE_CIPHER_AUTH'] = ONEFLOW_AUTH
    cloud_auth = CloudAuth.new(conf)
rescue StandardError => e
    message = "Error initializing authentication system : #{e.message}"
    Log.error LOG_COMP, message
    STDERR.puts message
    exit(-1)
end

set :cloud_auth, cloud_auth

##############################################################################
# Helpers
##############################################################################

before do
    auth = Rack::Auth::Basic::Request.new(request.env)

    if auth.provided? && auth.basic?
        username, password = auth.credentials

        @client = OpenNebula::Client.new("#{username}:#{password}",
                                         conf[:one_xmlrpc])
    else
        error 401, 'A username and password must be provided'
    end
end

# Set status error and return the error msg
#
# @param error_msg  [String]  Error message
# @param error_code [Integer] Http error code
def internal_error(error_msg, error_code)
    status error_code
    body error_msg
end

# Get HTTP error code based on OpenNebula eror code
#
# @param error [Integer] OpenNebula error code
def one_error_to_http(error)
    case error
    when OpenNebula::Error::ESUCCESS
        200
    when OpenNebula::Error::EAUTHORIZATION
        401
    when OpenNebula::Error::EAUTHENTICATION
        403
    when OpenNebula::Error::ENO_EXISTS
        404
    else
        500
    end
end

##############################################################################
# Defaults
##############################################################################

Role.init_default_cooldown(conf[:default_cooldown])
Role.init_default_shutdown(conf[:shutdown_action])
Role.init_force_deletion(conf[:force_deletion])
Role.init_default_vm_name_template(conf[:vm_name_template])

ServiceTemplate.init_default_vn_name_template(conf[:vn_name_template])

##############################################################################
# HTTP error codes
##############################################################################

VALIDATION_EC = 400 # bad request by the client
OPERATION_EC  = 405 # operation not allowed (e.g: in current state)
GENERAL_EC    = 500 # general error

##############################################################################
# LCM and Event Manager
##############################################################################

# TODO: make thread number configurable?
lcm = ServiceLCM.new(@client, 10, cloud_auth)

##############################################################################
# Service
##############################################################################

get '/service' do
    # Read-only object
    service_pool = OpenNebula::ServicePool.new(nil, @client)

    rc = service_pool.info
    if OpenNebula.is_error?(rc)
        return internal_error(rc.message, one_error_to_http(rc.errno))
    end

    status 200

    body service_pool.to_json
end

get '/service/:id' do
    service = Service.new_with_id(params[:id], @client)

    rc = service.info
    if OpenNebula.is_error?(rc)
        return internal_error(rc.message, one_error_to_http(rc.errno))
    end

    status 200

    body service.to_json
end

delete '/service/:id' do
    # Read-only object
    service = OpenNebula::Service.new_with_id(params[:id], @client)

    rc = service.info
    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    # Starts service undeploying async
    rc = lcm.undeploy_action(@client, service.id)

    if OpenNebula.is_error?(rc)
        return internal_error(rc.message, one_error_to_http(rc.errno))
    end

    status 204
end

post '/service/:id/action' do
    action = JSON.parse(request.body.read)['action']
    opts   = action['params']

    case action['perform']
    when 'recover'
        rc = lcm.recover_action(@client, params[:id])
    when 'chown'
        if opts && opts['owner_id']
            u_id = opts['owner_id'].to_i
            g_id = (opts['group_id'] || -1).to_i

            rc = lcm.chown_action(@client, params[:id], u_id, g_id)
        else
            rc = OpenNebula::Error.new("Action #{action['perform']}: " \
                                       'You have to specify a UID')
        end
    when 'chgrp'
        if opts && opts['group_id']
            g_id = opts['group_id'].to_i

            rc = lcm.chown_action(@client, params[:id], -1, g_id)
        else
            rc = OpenNebula::Error.new("Action #{action['perform']}: " \
                                       'You have to specify a GID')
        end
    when 'chmod'
        if opts && opts['octet']
            rc = lcm.chmod_action(@client, params[:id], opts['octet'])
        else
            rc = OpenNebula::Error.new("Action #{action['perform']}: " \
                                       'You have to specify an OCTET')
        end
    when 'rename'
        if opts && opts['name']
            rc = lcm.rename_action(@client, params[:id], opts['name'])
        else
            rc = OpenNebula::Error.new("Action #{action['perform']}: " \
                                       'You have to specify a name')
        end
    #     when 'update'
    #         if opts && opts['append']
    #             if opts['template_json']
    #                 begin
    #                     service.update(opts['template_json'], true)
    #                     status 204
    #                 rescue Validator::ParseException, JSON::ParserError => e
    #                     OpenNebula::Error.new(e.message)
    #                 end
    #             elsif opts['template_raw']
    #                 service.update_raw(opts['template_raw'], true)
    #                 status 204
    #             else
    #                 OpenNebula::Error.new("Action #{action['perform']}: " \
    #                                       'You have to provide a template')
    #             end
    #         else
    #             OpenNebula::Error.new("Action #{action['perform']}: " \
    #                                   'Only supported for append')
    #         end
    else
        rc = OpenNebula::Error.new("Action #{action['perform']} not supported")
    end

    if OpenNebula.is_error?(rc)
        return internal_error(rc.message, one_error_to_http(rc.errno))
    end

    status 204
end

# put '/service/:id/role/:name' do
#     service_pool = nil # OpenNebula::ServicePool.new(@client)
#
#     rc = nil
#     service_rc = service_pool.get(params[:id]) do |service|
#         begin
#             rc = service.update_role(params[:name], request.body.read)
#         rescue Validator::ParseException, JSON::ParserError => e
#             return internal_error(e.message, VALIDATION_EC)
#         end
#     end
#
#     if OpenNebula.is_error?(service_rc)
#         error CloudServer::HTTP_ERROR_CODE[service_rc.errno], service_rc.message
#     end
#
#     if OpenNebula.is_error?(rc)
#         error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
#     end
#
#     status 204
# end

post '/service/:id/role/:role_name/action' do
    action = JSON.parse(request.body.read)['action']
    opts   = action['params']

    # Use defaults only if one of the options is supplied
    if opts['period'].nil? && opts['number'].nil?
        opts['period'] = conf[:action_period] if opts['period'].nil?
        opts['number'] = conf[:action_number] if opts['number'].nil?
    end

    rc = lcm.sched_action(@client,
                          params[:id],
                          params[:role_name],
                          action['perform'],
                          opts['period'],
                          opts['number'])

    if OpenNebula.is_error?(rc)
        return internal_error(rc.message, one_error_to_http(rc.errno))
    end

    status 201
end

post '/service/:id/scale' do
    call_body = JSON.parse(request.body.read)

    rc = lcm.scale_action(@client,
                          params[:id],
                          call_body['role_name'],
                          call_body['cardinality'].to_i,
                          call_body['force'])

    if OpenNebula.is_error?(rc)
        return internal_error(rc.message, one_error_to_http(rc.errno))
    end

    status 201
    body
end

##############################################################################
# Service Template
##############################################################################

get '/service_template' do
    s_template_pool = OpenNebula::ServiceTemplatePool
                      .new(@client, OpenNebula::Pool::INFO_ALL)

    rc = s_template_pool.info
    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    status 200

    body s_template_pool.to_json
end

get '/service_template/:id' do
    service_template = OpenNebula::ServiceTemplate.new_with_id(params[:id],
                                                               @client)

    rc = service_template.info
    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    status 200

    body service_template.to_json
end

delete '/service_template/:id' do
    service_template = OpenNebula::ServiceTemplate.new_with_id(params[:id],
                                                               @client)

    rc = service_template.delete
    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    status 204
end

put '/service_template/:id' do
    service_template = OpenNebula::ServiceTemplate.new_with_id(params[:id],
                                                               @client)

    begin
        rc = service_template.update(request.body.read)
    rescue Validator::ParseException, JSON::ParserError => e
        return internal_error(e.message, VALIDATION_EC)
    end

    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    service_template.info

    status 200

    body service_template.to_json
end

post '/service_template' do
    xml        = OpenNebula::ServiceTemplate.build_xml
    s_template = OpenNebula::ServiceTemplate.new(xml, @client)

    begin
        rc = s_template.allocate(request.body.read)
    rescue Validator::ParseException, JSON::ParserError => e
        return internal_error(e.message, VALIDATION_EC)
    end

    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    s_template.info

    status 201

    # body Parser.render(rc)
    body s_template.to_json
end

post '/service_template/:id/action' do
    service_template = OpenNebula::ServiceTemplate.new_with_id(params[:id],
                                                               @client)
    action = JSON.parse(request.body.read)['action']
    opts   = action['params']
    opts   = {} if opts.nil?

    # rubocop:disable Style/ConditionalAssignment
    case action['perform']
    when 'instantiate'
        rc = service_template.info

        if OpenNebula.is_error?(rc)
            return internal_error(rc.message, one_error_to_http(rc.errno))
        end

        merge_template = opts['merge_template']
        service_json   = JSON.parse(service_template.to_json)

        # Check custom_attrs
        body         = service_json['DOCUMENT']['TEMPLATE']['BODY']
        custom_attrs = body['custom_attrs']

        if merge_template
            custom_attrs_values = merge_template['custom_attrs_values']
        end

        if custom_attrs && !(custom_attrs.is_a? Hash)
            return internal_error('Wrong custom_attrs format',
                                  VALIDATION_EC)
        end

        if custom_attrs_values && !(custom_attrs_values.is_a? Hash)
            return internal_error('Wrong custom_attrs_values format',
                                  VALIDATION_EC)
        end

        if custom_attrs &&
           custom_attrs_values &&
           !(custom_attrs.keys - custom_attrs_values.keys).empty?
            return internal_error('Every custom_attrs key must have its ' \
                                  'value defined at custom_attrs_value',
                                  VALIDATION_EC)
        end

        # Check networks
        networks = body['networks']
        networks_values = merge_template['networks_values'] if merge_template

        if networks && !(networks.is_a? Hash)
            return internal_error('Wrong networks format', VALIDATION_EC)
        end

        if networks_values && networks_values.find {|v| !v.is_a? Hash }
            return internal_error('Wrong networks_values format', VALIDATION_EC)
        end

        if networks && networks_values && !(networks.keys -
            networks_values.collect {|i| i.keys }.flatten).empty?
            return internal_error('Every network key must have its value ' \
                                  'defined at networks_value', VALIDATION_EC)
        end

        # Creates service document
        service = service_template.instantiate(merge_template)

        if OpenNebula.is_error?(service)
            return internal_error(service.message,
                                  one_error_to_http(service.errno))
        elsif service.is_a? StandardError
            # there was a JSON validation error
            return internal_error(service.message, GENERAL_EC)
        else
            # Starts service deployment async
            rc = lcm.deploy_action(@client, service.id)

            if OpenNebula.is_error?(rc)
                return internal_error(rc.message, one_error_to_http(rc.errno))
            end

            service_json = service.nil? ? '' : service.to_json

            status 201
            body service_json
        end
    when 'chown'
        if opts && opts['owner_id']
            args = []
            args << opts['owner_id'].to_i
            args << (opts['group_id'].to_i || -1)

            status 204
            service_template.chown(*args)
        else
            OpenNebula::Error.new("Action #{action['perform']}: "\
                                  'You have to specify a UID')
        end
    when 'chgrp'
        if opts && opts['group_id']
            status 204
            service_template.chown(-1, opts['group_id'].to_i)
        else
            OpenNebula::Error.new("Action #{action['perform']}: "\
                                  'You have to specify a GID')
        end
    when 'chmod'
        if opts && opts['octet']
            status 204
            service_template.chmod_octet(opts['octet'])
        else
            OpenNebula::Error.new("Action #{action['perform']}: "\
                                  'You have to specify an OCTET')
        end
    when 'update'
        append = opts['append'] == true

        if opts && opts['template_json']
            begin
                service_template.update(opts['template_json'], append)

                status 204
            rescue Validator::ParseException, JSON::ParserError => e
                return internal_error(e.message, VALIDATION_EC)
            end
        elsif opts && opts['template_raw']
            service_template.update_raw(opts['template_raw'], append)

            status 204
        else
            OpenNebula::Error.new("Action #{action['perform']}: "\
                                  'You have to provide a template')
        end
    when 'rename'
        status 204
        service_template.rename(opts['name'])
    when 'clone'
        rc = service_template.clone(opts['name'])
        if OpenNebula.is_error?(rc)
            error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
        end

        new_stemplate = OpenNebula::ServiceTemplate.new_with_id(rc, @client)
        new_stemplate.info
        if OpenNebula.is_error?(new_stemplate)
            error CloudServer::HTTP_ERROR_CODE[new_stemplate.errno],
                  new_stemplate.message
        end

        status 201
        body new_stemplate.to_json
    else
        OpenNebula::Error.new("Action #{action['perform']} not supported")
    end
    # rubocop:enable Style/ConditionalAssignment

    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end
end
# rubocop:enable Naming/FileName
