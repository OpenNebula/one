# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

##############################################################################
# The OCCI Server provides  compatible server based on the
# OpenNebula Engine
##############################################################################

##############################################################################
# Environment Configuration for the Cloud Server
##############################################################################
ONE_LOCATION=ENV["ONE_LOCATION"]

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

OCCI_AUTH          = VAR_LOCATION + "/.one/occi_auth"
OCCI_LOG           = LOG_LOCATION + "/occi-server.log"
CONFIGURATION_FILE = ETC_LOCATION + "/occi-server.conf"

TEMPLATE_LOCATION  = ETC_LOCATION + "/occi_templates"

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+"/cloud/occi"
$: << RUBY_LIB_LOCATION+"/cloud" # For the Repository Manager

################################################
# Required libraries
################################################
require 'rubygems'
require 'sinatra'
require 'yaml'
require 'erb'
require 'tempfile'
require 'fileutils'
require 'json'

require 'OCCIServer'
require 'CloudAuth'
require 'occi_application'

include OpenNebula

################################################################################
# Configuration
################################################################################

begin
    $occi_app = OCCIApplication.new
rescue Exception => e
    STDERR.puts e.message
    exit -1
end

# The logging will be configured in Rack, not in Sinatra
disable :logging

use Rack::CommonLogger, $occi_app.logger

# Set the host and port
set :bind, $occi_app.conf[:host]
set :port, $occi_app.conf[:port]

set :run, false

##############################################################################
# Helpers
##############################################################################

before do
    cache_control :no_store
    content_type 'application/xml', :charset => 'utf-8'

    begin
        username = $occi_app.cloud_auth.auth(request.env, params)
    rescue Exception => e
        $occi_app.logger.error {e.message}
        error 500, ""
    end

    if username.nil? #unable to authenticate
        $occi_app.logger.error {"User not authorized"}
        error 401, ""
    else
        @occi_server = $occi_app.new_occi_server(username)
    end
end

# Response treatment
helpers do
    def logger
        $occi_app.logger
    end

    def treat_response(result, rc)
        if OpenNebula::is_error?(result)
            logger.error {result.message}
            content_type 'text/plain', :charset => 'utf-8'
            halt rc, result.message
        end

        status rc
        result
    end
end

##############################################################################
# Actions
##############################################################################

get '/' do
    result,rc = @occi_server.get_collections(request)
    treat_response(result,rc)
end

###################################################
# Pool Resources methods
###################################################

get '/instance_type' do
    result,rc = @occi_server.get_instance_types(request)
    treat_response(result,rc)
end

post '/compute' do
   result,rc = @occi_server.post_compute(request)
   treat_response(result,rc)
end

get '/compute' do
    result,rc = @occi_server.get_computes(request)
    treat_response(result,rc)
end

post '/network' do
    result,rc = @occi_server.post_network(request)
    treat_response(result,rc)
end

get '/network' do
    result,rc = @occi_server.get_networks(request)
    treat_response(result,rc)
end

post '/storage' do
    result,rc = @occi_server.post_storage(request)
    treat_response(result,rc)
end

get '/storage' do
    result,rc = @occi_server.get_storages(request)
    treat_response(result,rc)
end

get '/user' do
    result,rc = @occi_server.get_users(request)
    treat_response(result,rc)
end

###################################################
# Entity Resources Methods
###################################################

get '/compute/:id' do
    result,rc = @occi_server.get_compute(request, params)
    treat_response(result,rc)
end

post '/compute/:id/action' do
    xml = XMLElement.new
    xml.initialize_xml(request.body, "ACTION")

    result,rc = case xml['PERFORM'].downcase
    when 'attachdisk' then
        @occi_server.attach_disk(request, params, xml)
    when 'detachdisk' then
        @occi_server.detach_disk(request, params, xml)
    else
        content_type 'text/plain', :charset => 'utf-8'
        halt 403, "Action #{xml['PERFORM']} not supported"
    end

    treat_response(result,rc)
end

delete '/compute/:id' do
    result,rc = @occi_server.delete_compute(request, params)
    treat_response(result,rc)
end

put '/compute/:id' do
    result,rc = @occi_server.put_compute(request, params)
    treat_response(result,rc)
end

get '/network/:id' do
    result,rc = @occi_server.get_network(request, params)
    treat_response(result,rc)
end

delete '/network/:id' do
    result,rc = @occi_server.delete_network(request, params)
    treat_response(result,rc)
end

put '/network/:id' do
    result,rc = @occi_server.put_network(request, params)
    treat_response(result,rc)
end

get '/storage/:id' do
    result,rc = @occi_server.get_storage(request, params)
    treat_response(result,rc)
end

post '/storage/:id/action' do
    xml = XMLElement.new
    xml.initialize_xml(request.body, "ACTION")

    result, rc = case xml['PERFORM'].downcase
    when 'clone' then
        @occi_server.clone_storage(request, params, xml)
    else
        halt 403, "Action #{xml['PERFORM']} not supported"
    end

    treat_response(result,rc)
end

delete '/storage/:id' do
    result,rc = @occi_server.delete_storage(request, params)
    treat_response(result,rc)
end

put '/storage/:id' do
    result,rc = @occi_server.put_storage(request, params)
    treat_response(result,rc)
end

get '/user/:id' do
    result,rc = @occi_server.get_user(request, params)
    treat_response(result,rc)
end

get '/instance_type/:id' do
    result,rc = @occi_server.get_instance_type(request, params)
    treat_response(result,rc)
end

Sinatra::Application.run!
