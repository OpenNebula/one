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

include OpenNebula

##############################################################################
# Configuration
##############################################################################
# Set Configuration settings
begin
    conf = YAML.load_file(CONFIGURATION_FILE)
rescue Exception => e
    STDERR.puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
    exit 1
end

conf[:template_location] = TEMPLATE_LOCATION
conf[:debug_level] ||= 3

CloudServer.print_configuration(conf)

set :config, conf


# Enable Logger
include CloudLogger
enable_logging OCCI_LOG, settings.config[:debug_level].to_i


# Set Sinatra configuration
use Rack::Session::Pool, :key => 'occi'

set :public_folder, Proc.new { File.join(root, "ui/public") }
set :views, settings.root + '/ui/views'

if settings.config[:server]
    settings.config[:host] ||= settings.config[:server]
    warning = "Warning: :server: configuration parameter has been deprecated."
    warning << " Use :host: instead."
    settings.logger.warn warning
end

if CloudServer.is_port_open?(settings.config[:host],
                             settings.config[:port])
    settings.logger.error {
        "Port #{settings.config[:port]} busy, please shutdown " <<
        "the service or move occi server port."
    }
    exit -1
end

set :bind, settings.config[:host]
set :port, settings.config[:port]


# Create CloudAuth
begin
    ENV["ONE_CIPHER_AUTH"] = OCCI_AUTH
    cloud_auth = CloudAuth.new(settings.config, settings.logger)
rescue => e
    settings.logger.error {"Error initializing authentication system"}
    settings.logger.error {e.message}
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
                logger.error {e.message}
                error 500, ""
            end
        else
            username = session[:user]
        end

        if username.nil? #unable to authenticate
            logger.error {"User not authorized"}
            error 401, ""
        else
            client  = settings.cloud_auth.client(username)
            @occi_server = OCCIServer.new(client,
                                          settings.config,
                                          settings.logger)
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
            logger.error {e.message}
            error 500, ""
        end

        if username.nil?
            logger.error {"User not authorized"}
            error 401, ""
        else
            client  = settings.cloud_auth.client(username)
            @occi_server = OCCIServer.new(client,
                                          settings.config,
                                          settings.logger)

            user_id = OpenNebula::User::SELF
            user    = OpenNebula::User.new_with_id(user_id, client)
            rc = user.info
            if OpenNebula.is_error?(rc)
                logger.error {rc.message}
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
            logger.error {result.message}
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

get '/instance_type/:id' do
    result,rc = @occi_server.get_instance_type(request, params)
    treat_response(result,rc)
end

##############################################
## OCCI UI (Self-Service)
##############################################

get '/ui/config' do
    wss = settings.config[:vnc_proxy_support_wss]
    wss = (wss == true || wss == "yes" || wss == "only" ? "yes" : "no")

    vnc = settings.config[:vnc_enable] ? "yes" : "no"

    config =  "<UI_CONFIGURARION>"
    config << "  <LANG>#{session[:lang]}</LANG>"
    config << "  <WSS>#{wss}</WSS>"
    config << "  <VNC>#{vnc}</VNC>"
    config << "</UI_CONFIGURARION>"

    return [200, config]
end

post '/ui/config' do
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

    return 200
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

    time = Time.now + 60*10
    response.set_cookie("occi-user",
                        :value=>"#{session[:user]}",
                        :expires=>time)

    erb :index
end

post '/ui/upload' do
    #so we can re-use occi post_storage()
    request.params['file'] = {:tempfile => request.env['rack.input']}
    result,rc = @occi_server.post_storage(request)
    treat_response(result,rc)
end

post '/ui/startvnc/:id' do
    if !settings.config[:vnc_enable]
        return [403, "VNC sessions are disabled"]
    end

    vm_id    = params[:id]
    vnc_hash = session['vnc']

    if !vnc_hash
        session['vnc'] = {}
    elsif vnc_hash[vm_id]
        #return existing information
        info = vnc_hash[vm_id].clone
        info.delete(:pipe)

        return [200, info.to_json]
    end

    rc = @occi_server.startvnc(vm_id, settings.config)

    if rc[0] == 200
        info = rc[1]
        session['vnc'][vm_id] = info.clone
        info.delete(:pipe)

        rc = [200, info.to_json]
    end

    return rc
end

post '/ui/stopvnc/:id' do
    if !settings.config[:vnc_enable]
        return [403, "VNC sessions are disabled"]
    end

    vm_id    = params[:id]
    vnc_hash = session['vnc']

    if !vnc_hash || !vnc_hash[vm_id]
        return [403, "It seems there is no VNC proxy running for this machine"]
    end

    rc = @occi_server.stopvnc(vnc_hash[vm_id][:pipe])

    if rc[0] == 200
        session['vnc'].delete(vm_id)
    end

    return rc
end
