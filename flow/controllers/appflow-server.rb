# -------------------------------------------------------------------------- #
# Copyright 2010-2013, C12G Labs S.L.                                        #
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
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
else
    VAR_LOCATION = ONE_LOCATION + "/var"
    LOG_LOCATION = ONE_LOCATION + "/var"
    ETC_LOCATION = ONE_LOCATION + "/etc"
    RUBY_LIB_LOCATION = ONE_LOCATION+"/lib/ruby"
end

APPFLOW_AUTH    = VAR_LOCATION + "/.one/appflow_auth"

APPFLOW_LOG        = LOG_LOCATION + "/appflow-server.log"
CONFIGURATION_FILE = ETC_LOCATION + "/appflow-server.conf"

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+'/cloud'
$: << RUBY_LIB_LOCATION+'/oneapps/flow'

require 'CloudAuth'
require 'CloudServer'

require 'models'
require 'log'

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

conf[:auth] = 'opennebula'

set :bind, conf[:host]
set :port, conf[:port]

set :config, conf

include CloudLogger
enable_logging APPFLOW_LOG, conf[:debug_level].to_i

use Rack::Session::Pool, :key => 'appflow'

Log.logger = settings.logger
Log.level  = conf[:debug_level].to_i


LOG_COMP = "APPFLOW"

Log.info LOG_COMP, "Starting server"

begin
    ENV["ONE_CIPHER_AUTH"] = APPFLOW_AUTH
    cloud_auth = CloudAuth.new(settings.config)
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

        @client = OpenNebula::Client.new("#{username}:#{password}")
    else
        error 401, "A username and password must be provided"
    end
end



##############################################################################
# LCM thread
##############################################################################

t = Thread.new {
    require 'lcm/LifeCycleManager'

    ServiceLCM.new(conf[:lcm_interval], settings.cloud_auth).loop
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

    status 201
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
        when 'deploy'
            service.deploy
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

    status 201
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

    rc = case action['perform']
    when 'instantiate'
        rc = service_template.info
        if OpenNebula.is_error?(rc)
            error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
        end

        service = OpenNebula::Service.new(OpenNebula::Service.build_xml, @client)
        rc = service.allocate(service_template.template)
        if OpenNebula.is_error?(rc)
            error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
        end

        service.info

        body service.to_json
    when 'chown'
        if opts && opts['owner_id']
            args = Array.new
            args << opts['owner_id'].to_i
            args << (opts['group_id'].to_i || -1)

            service_template.chown(*args)
        else
            OpenNebula::Error.new("Action #{action['perform']}: " <<
                    "You have to specify a UID")
        end
    when 'chgrp'
        if opts && opts['group_id']
            service_template.chown(-1, opts['group_id'].to_i)
        else
            OpenNebula::Error.new("Action #{action['perform']}: " <<
                    "You have to specify a GID")
        end
    when 'chmod'
        if opts && opts['octet']
            service_template.chmod_octet(opts['octet'])
        else
            OpenNebula::Error.new("Action #{action['perform']}: " <<
                    "You have to specify an OCTET")
        end
    else
        OpenNebula::Error.new("Action #{action['perform']} not supported")
    end

    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    else
        status 201
    end
end