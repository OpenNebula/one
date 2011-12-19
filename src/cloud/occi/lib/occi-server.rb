# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
    TEMPLATE_LOCATION="/etc/one/occi_templates"
    CONFIGURATION_FILE = "/etc/one/occi-server.conf"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    TEMPLATE_LOCATION=ONE_LOCATION+"/etc/occi_templates"
    CONFIGURATION_FILE = ONE_LOCATION+"/etc/occi-server.conf"
end

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+"/cloud/occi"
$: << RUBY_LIB_LOCATION+"/cloud" # For the Repository Manager

################################################
# Required libraries
################################################
require 'rubygems'
require 'sinatra'
require 'yaml'

require 'OCCIServer'

include OpenNebula

##############################################################################
# Parse Configuration file
##############################################################################
begin
    conf = YAML.load_file(CONFIGURATION_FILE)
rescue Exception => e
    puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
    exit 1
end

conf[:template_location] = TEMPLATE_LOCATION

CloudServer.print_configuration(conf)

##############################################################################
# Sinatra Configuration
##############################################################################
set :config, conf

if CloudServer.is_port_open?(settings.config[:server],
                             settings.config[:port])
    puts "Port busy, please shutdown the service or move occi server port."
    exit
end

set :bind, settings.config[:server]
set :port, settings.config[:port]

##############################################################################
# Helpers
##############################################################################

before do
    @occi_server = OCCIServer.new(settings.config)
    begin
        result = @occi_server.authenticate(request.env)
    rescue Exception => e
        error 500, e.message
    end

    if result
        error 401, result
    end
end

# Response treatment
helpers do
    def treat_response(result,rc)
        if OpenNebula::is_error?(result)
            halt rc, result.message
        end

        status rc
        result
    end
end

##############################################################################
# Actions
##############################################################################

###################################################
# Pool Resources methods
###################################################

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

###################################################
# Entity Resources Methods
###################################################

get '/compute/:id' do
    result,rc = @occi_server.get_compute(request, params)
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

delete '/storage/:id' do
    result,rc = @occi_server.delete_storage(request, params)
    treat_response(result,rc)
end

put '/storage/:id' do
    result,rc = @occi_server.put_storage(request, params)
    treat_response(result,rc)
end
