# -------------------------------------------------------------------------- #
# Copyright 2010-2015, C12G Labs S.L.                                        #
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

require 'rubygems'
require 'sinatra'
require 'yaml'

ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
    LOG_LOCATION = "/var/log/one"
    VAR_LOCATION = "/var/lib/one"
    ETC_LOCATION = "/etc/one"
    LIB_LOCATION = "/usr/lib/one"
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
else
    VAR_LOCATION = ONE_LOCATION + "/var"
    LOG_LOCATION = ONE_LOCATION + "/var"
    ETC_LOCATION = ONE_LOCATION + "/etc"
    LIB_LOCATION = ONE_LOCATION+"/lib"
    RUBY_LIB_LOCATION = ONE_LOCATION+"/lib/ruby"
end

ONEFLOW_AUTH    = VAR_LOCATION + "/.one/oneflow_auth"

ONEFLOW_LOG        = LOG_LOCATION + "/oneflow.log"
CONFIGURATION_FILE = ETC_LOCATION + "/oneflow-server.conf"

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+'/cloud'
$: << LIB_LOCATION+'/oneflow/lib'

require 'CloudAuth'
require 'CloudServer'

require 'models'
require 'log'

DEFAULT_VM_NAME_TEMPLATE = '$ROLE_NAME_$VM_NUMBER_(service_$SERVICE_ID)'

##############################################################################
# Configuration
##############################################################################

begin
    conf = YAML.load_file(CONFIGURATION_FILE)
rescue Exception => e
    STDERR.puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
    exit 1
end

conf[:debug_level]  ||= 2
conf[:lcm_interval] ||= 30
conf[:default_cooldown] ||= 300
conf[:shutdown_action] ||= 'shutdown'
conf[:action_number] ||= 1
conf[:action_period] ||= 60

conf[:auth] = 'opennebula'

set :bind, conf[:host]
set :port, conf[:port]

set :config, conf

include CloudLogger
logger = enable_logging ONEFLOW_LOG, conf[:debug_level].to_i

use Rack::Session::Pool, :key => 'oneflow'

Log.logger = logger
Log.level  = conf[:debug_level].to_i


LOG_COMP = "ONEFLOW"

Log.info LOG_COMP, "Starting server"

begin
    ENV["ONE_CIPHER_AUTH"] = ONEFLOW_AUTH
    cloud_auth = CloudAuth.new(conf)
rescue => e
    message = "Error initializing authentication system : #{e.message}"
    Log.error LOG_COMP, message
    STDERR.puts message
    exit -1
end

set :cloud_auth, cloud_auth

##############################################################################
# Helpers
##############################################################################


before do
    auth = Rack::Auth::Basic::Request.new(request.env)

    if auth.provided? && auth.basic?
        username, password = auth.credentials

        @client = OpenNebula::Client.new("#{username}:#{password}", conf[:one_xmlrpc])
    else
        error 401, "A username and password must be provided"
    end
end

##############################################################################
# Defaults
##############################################################################

Role.init_default_cooldown(conf[:default_cooldown])
Role.init_default_shutdown(conf[:shutdown_action])

conf[:vm_name_template] ||= DEFAULT_VM_NAME_TEMPLATE
Role.init_default_vm_name_template(conf[:vm_name_template])

##############################################################################
# LCM thread
##############################################################################

t = Thread.new {
    require 'LifeCycleManager'

    ServiceLCM.new(conf[:lcm_interval], cloud_auth).loop
}
t.abort_on_exception = true


##############################################################################
# Service
##############################################################################

get '/service' do
    service_pool = OpenNebula::ServicePool.new(@client, OpenNebula::Pool::INFO_ALL)

    rc = service_pool.info
    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    status 200

    body service_pool.to_json
end

get '/service/:id' do
    service_pool = OpenNebula::ServicePool.new(@client)

    service = service_pool.get(params[:id])

    if OpenNebula.is_error?(service)
        error CloudServer::HTTP_ERROR_CODE[service.errno], service.message
    end

    status 200

    body service.to_json
end

delete '/service/:id' do
    service_pool = OpenNebula::ServicePool.new(@client)

    rc = nil
    service = service_pool.get(params[:id]) { |service|
        rc = service.delete
    }

    if OpenNebula.is_error?(service)
        error CloudServer::HTTP_ERROR_CODE[service.errno], service.message
    end

    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    status 204
end

post '/service/:id/action' do
    service_pool = OpenNebula::ServicePool.new(@client)
    action = JSON.parse(request.body.read)['action']
    opts   = action['params']

    rc = nil
    service = service_pool.get(params[:id]) { |service|
        rc = case action['perform']
        when 'shutdown'
            service.shutdown
        when 'recover', 'deploy'
            service.recover
        when 'chown'
            if opts && opts['owner_id']
                args = Array.new
                args << opts['owner_id'].to_i
                args << (opts['group_id'] || -1).to_i

                ret = service.chown(*args)

                if !OpenNebula.is_error?(ret)
                    Log.info(LOG_COMP, "Service owner changed to #{args[0]}:#{args[1]}", params[:id])
                end

                ret
            else
                OpenNebula::Error.new("Action #{action['perform']}: " <<
                        "You have to specify a UID")
            end
        when 'chgrp'
            if opts && opts['group_id']
                ret = service.chown(-1, opts['group_id'].to_i)

                if !OpenNebula.is_error?(ret)
                    Log.info(LOG_COMP, "Service group changed to #{opts['group_id']}", params[:id])
                end

                ret
            else
                OpenNebula::Error.new("Action #{action['perform']}: " <<
                        "You have to specify a GID")
            end
        when 'chmod'
            if opts && opts['octet']
                ret = service.chmod_octet(opts['octet'])

                if !OpenNebula.is_error?(ret)
                    Log.info(LOG_COMP, "Service permissions changed to #{opts['octet']}", params[:id])
                end

                ret
            else
                OpenNebula::Error.new("Action #{action['perform']}: " <<
                        "You have to specify an OCTET")
            end
        else
            OpenNebula::Error.new("Action #{action['perform']} not supported")
        end
    }

    if OpenNebula.is_error?(service)
        error CloudServer::HTTP_ERROR_CODE[service.errno], service.message
    end

    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    status 201
end

put '/service/:id/role/:name' do

    service_pool = OpenNebula::ServicePool.new(@client)

    rc = nil
    service = service_pool.get(params[:id]) do |service|
        begin
            rc = service.update_role(params[:name], request.body.read)
        rescue Validator::ParseException, JSON::ParserError
            return error 400, $!.message
        end
    end

    if OpenNebula.is_error?(service)
        error CloudServer::HTTP_ERROR_CODE[service.errno], service.message
    end

    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    status 204
end

post '/service/:id/role/:role_name/action' do
    service_pool = OpenNebula::ServicePool.new(@client)
    action = JSON.parse(request.body.read)['action']
    opts   = action['params']

    rc = nil
    service = service_pool.get(params[:id]) { |service|
        roles = service.get_roles

        role = roles[params[:role_name]]
        if role.nil?
            rc = OpenNebula::Error.new("Role '#{params[:role_name]}' not found")
        else
            # Use defaults only if one of the options is supplied
            if opts['period'].nil? ^ opts['number'].nil?
                opts['period'] = conf[:action_period] if opts['period'].nil?
                opts['number'] = conf[:action_number] if opts['number'].nil?
            end

            rc = role.batch_action(action['perform'], opts['period'], opts['number'])
        end
    }

    if OpenNebula.is_error?(service)
        error CloudServer::HTTP_ERROR_CODE[service.errno], service.message
    end

    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    status 201
    body rc.to_json
end

##############################################################################
# Service Template
##############################################################################

get '/service_template' do
    s_template_pool = OpenNebula::ServiceTemplatePool.new(@client, OpenNebula::Pool::INFO_ALL)

    rc = s_template_pool.info
    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    status 200

    body s_template_pool.to_json
end

get '/service_template/:id' do
    service_template = OpenNebula::ServiceTemplate.new_with_id(params[:id], @client)

    rc = service_template.info
    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    status 200

    body service_template.to_json
end

delete '/service_template/:id' do
    service_template = OpenNebula::ServiceTemplate.new_with_id(params[:id], @client)

    rc = service_template.delete
    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    status 204
end

put '/service_template/:id' do
    service_template = OpenNebula::ServiceTemplate.new_with_id(params[:id], @client)

    begin
        rc = service_template.update(request.body.read)
    rescue Validator::ParseException, JSON::ParserError
        error 400, $!.message
    end

    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    service_template.info

    status 200
    body service_template.to_json
end

post '/service_template' do
    s_template = OpenNebula::ServiceTemplate.new(
                    OpenNebula::ServiceTemplate.build_xml,
                    @client)

    begin
        rc = s_template.allocate(request.body.read)
    rescue Validator::ParseException, JSON::ParserError
        error 400, $!.message
    end

    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    s_template.info

    status 201
    #body Parser.render(rc)
    body s_template.to_json
end

post '/service_template/:id/action' do
    service_template = OpenNebula::ServiceTemplate.new_with_id(params[:id], @client)

    action = JSON.parse(request.body.read)['action']

    opts   = action['params']
    opts   = {} if opts.nil?

    rc = case action['perform']
    when 'instantiate'
        rc = service_template.info
        if OpenNebula.is_error?(rc)
            error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
        end

        merge_template = opts['merge_template']

        if !merge_template.nil?
            begin
                orig_template = JSON.parse(service_template.template)

                instantiate_template = orig_template.merge(merge_template)

                ServiceTemplate.validate(instantiate_template)

                instantiate_template["roles"].each { |role|
                    if role["vm_template_contents"]
                        # $CUSTOM1_VAR Any word character (letter, number, underscore)
                        role["vm_template_contents"].scan(/\$(\w+)/).each { |key|
                            if instantiate_template["custom_attrs_values"].has_key?(key[0])
                                role["vm_template_contents"].gsub!(
                                    "$"+key[0],
                                    instantiate_template["custom_attrs_values"][key[0]])
                            end
                        }
                    end

                    if role["user_inputs_values"]
                        role["vm_template_contents"] ||= ""
                        role["user_inputs_values"].each{ |key, value|
                            role["vm_template_contents"] += "\n#{key}=#{value}"
                        }
                    end
                }

                instantiate_template_json = instantiate_template.to_json

            rescue Validator::ParseException, JSON::ParserError
                error 400, $!.message
            end
        else
            instantiate_template_json = service_template.template
        end

        service = OpenNebula::Service.new(OpenNebula::Service.build_xml, @client)
        rc = service.allocate(instantiate_template_json)
        if OpenNebula.is_error?(rc)
            error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
        end

        service.info

        status 201
        body service.to_json
    when 'chown'
        if opts && opts['owner_id']
            args = Array.new
            args << opts['owner_id'].to_i
            args << (opts['group_id'].to_i || -1)

            service_template.chown(*args)
            status 204
        else
            OpenNebula::Error.new("Action #{action['perform']}: " <<
                    "You have to specify a UID")
        end
    when 'chgrp'
        if opts && opts['group_id']
            service_template.chown(-1, opts['group_id'].to_i)
            status 204
        else
            OpenNebula::Error.new("Action #{action['perform']}: " <<
                    "You have to specify a GID")
        end
    when 'chmod'
        if opts && opts['octet']
            service_template.chmod_octet(opts['octet'])
            status 204
        else
            OpenNebula::Error.new("Action #{action['perform']}: " <<
                    "You have to specify an OCTET")
        end
    when 'update'
        if opts && opts['template_json']
            begin
                rc = service_template.update(opts['template_json'])
                status 204
            rescue Validator::ParseException, JSON::ParserError
                OpenNebula::Error.new($!.message)
            end
        else
            OpenNebula::Error.new("Action #{action['perform']}: " <<
                    "You have to provide a template")
        end
    else
        OpenNebula::Error.new("Action #{action['perform']} not supported")
    end

    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end
end
