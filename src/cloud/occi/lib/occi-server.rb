# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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
    VAR_LOCATION = "/var/lib/one"
    TEMPLATE_LOCATION="/etc/one/occi_templates"
    CONFIGURATION_FILE = "/etc/one/occi-server.conf"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    VAR_LOCATION = ONE_LOCATION+"/var"
    TEMPLATE_LOCATION=ONE_LOCATION+"/etc/occi_templates"
    CONFIGURATION_FILE = ONE_LOCATION+"/etc/occi-server.conf"
end

OCCI_AUTH = VAR_LOCATION + "/.one/occi_auth"

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
use Rack::Session::Pool, :key => 'occi'
set :public, Proc.new { File.join(root, "ui/public") }
set :views, settings.root + '/ui/views'
set :config, conf

if CloudServer.is_port_open?(settings.config[:server],
                             settings.config[:port])
    puts "Port busy, please shutdown the service or move occi server port."
    exit
end

set :bind, settings.config[:server]
set :port, settings.config[:port]

begin
    ENV["ONE_CIPHER_AUTH"] = OCCI_AUTH
    cloud_auth = CloudAuth.new(settings.config)
rescue => e
    puts "Error initializing authentication system"
    puts e.message
    exit -1
end

set :cloud_auth, cloud_auth

##############################################################################
# Helpers
##############################################################################

before do
    unless request.path=='/ui/login' || request.path=='/ui'
        if !authorized?
            begin
                username = settings.cloud_auth.auth(request.env, params)
            rescue Exception => e
                error 500, e.message
            end
        else
            username = session[:user]
        end

        if username.nil? #unable to authenticate
            error 401, ""
        else
            client  = settings.cloud_auth.client(username)
            @occi_server = OCCIServer.new(client, settings.config)
        end
    end
end

after do
    unless request.path=='/ui/login' || request.path=='/ui'
        unless session[:remember]
            if params[:timeout] == true
                env['rack.session.options'][:defer] = true
            else
                env['rack.session.options'][:expire_after] = 60*10
            end
        end
    end
end

# Response treatment
helpers do
    def authorized?
        session[:ip] && session[:ip]==request.ip ? true : false
    end

    def build_session
        begin
            username = settings.cloud_auth.auth(request.env, params)
        rescue Exception => e
            error 500, e.message
        end

        if username.nil?
            error 401, ""
        else
            client  = settings.cloud_auth.client(username)
            @occi_server = OCCIServer.new(client, settings.config)

            user_id = OpenNebula::User::SELF
            user    = OpenNebula::User.new_with_id(user_id, client)
            rc = user.info
            if OpenNebula.is_error?(rc)
                # Add a log message
                return [500, ""]
            end

            session[:ip] = request.ip
            session[:user] = username
            session[:remember] = params[:remember]

            if params[:remember]
                env['rack.session.options'][:expire_after] = 30*60*60*24
            end

            if params[:lang]
                session[:lang] = params[:lang]
            else
                session[:lang] = settings.config[:lang]
            end

            return [204, ""]
        end
    end

    def destroy_session
        session.clear
        return [204, ""]
    end


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

get '/user/:id' do
    result,rc = @occi_server.get_user(request, params)
    treat_response(result,rc)
end

##############################################
## UI
##############################################

post '/config' do
    begin
        body = JSON.parse(request.body.read)
    rescue
        [500, "POST Config: Error parsing configuration JSON"]
    end

    body.each do | key,value |
        case key
        when "lang" then session[:lang]=value
        end
    end
end

get '/ui/login' do
    redirect to('ui')
end

post '/ui/login' do
    build_session
end

post '/ui/logout' do
    destroy_session
end

get '/ui' do
    if !authorized?
        return File.read(File.dirname(__FILE__)+'/ui/templates/login.html')
    end

    time = Time.now + 60
    response.set_cookie("occi-user",
                        :value=>"#{session[:user]}",
                        :expires=>time)

    erb :index
end

post '/ui/upload' do
    file = Tempfile.new('uploaded_image')
    FileUtils.cp(request.env['rack.input'].path,file.path)
    request.params['file'] = file.path #so we can re-use occi post_storage()
    result,rc = @occi_server.post_storage(request)
    treat_response(result,rc)
end
