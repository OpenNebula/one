#!/usr/bin/env ruby
# -*- coding: utf-8 -*-

# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
    LOG_LOCATION = "/var/log/one"
    VAR_LOCATION = "/var/lib/one"
    ETC_LOCATION = "/etc/one"
    SHARE_LOCATION = "/usr/share/one"
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
else
    VAR_LOCATION = ONE_LOCATION + "/var"
    LOG_LOCATION = ONE_LOCATION + "/var"
    ETC_LOCATION = ONE_LOCATION + "/etc"
    SHARE_LOCATION = ONE_LOCATION + "/share"
    RUBY_LIB_LOCATION = ONE_LOCATION+"/lib/ruby"
end

SUNSTONE_AUTH             = VAR_LOCATION + "/.one/sunstone_auth"
SUNSTONE_LOG              = LOG_LOCATION + "/sunstone.log"
CONFIGURATION_FILE        = ETC_LOCATION + "/sunstone-server.conf"

PLUGIN_CONFIGURATION_FILE = ETC_LOCATION + "/sunstone-plugins.yaml"

SUNSTONE_ROOT_DIR = File.dirname(__FILE__)

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+'/cloud'
$: << SUNSTONE_ROOT_DIR
$: << SUNSTONE_ROOT_DIR+'/models'

SESSION_EXPIRE_TIME = 60*60

DISPLAY_NAME_XPATH = 'TEMPLATE/SUNSTONE_DISPLAY_NAME'

##############################################################################
# Required libraries
##############################################################################
require 'rubygems'
require 'sinatra'
require 'erb'
require 'yaml'
require 'securerandom'
require 'tmpdir'
require 'fileutils'

require 'CloudAuth'
require 'SunstoneServer'
require 'SunstoneViews'

##############################################################################
# Configuration
##############################################################################

begin
    $conf = YAML.load_file(CONFIGURATION_FILE)
rescue Exception => e
    STDERR.puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
    exit 1
end

$conf[:debug_level] ||= 3

# Set the TMPDIR environment variable for uploaded images
ENV['TMPDIR']=$conf[:tmpdir] if $conf[:tmpdir]

CloudServer.print_configuration($conf)

#Sinatra configuration

set :config, $conf
set :bind, $conf[:host]
set :port, $conf[:port]

case $conf[:sessions]
when 'memory', nil
    use Rack::Session::Pool, :key => 'sunstone'
when 'memcache'
    memcache_server=$conf[:memcache_host]+':'<<
        $conf[:memcache_port].to_s

    STDERR.puts memcache_server

    use Rack::Session::Memcache,
        :memcache_server => memcache_server,
        :namespace => $conf[:memcache_namespace]
when 'memcache-dalli'
    require 'rack/session/dalli'
    memcache_server=$conf[:memcache_host]+':'<<
        $conf[:memcache_port].to_s

    STDERR.puts memcache_server

    use Rack::Session::Dalli,
      :memcache_server => memcache_server,
      :namespace => $conf[:memcache_namespace],
      :cache => Dalli::Client.new
else
    STDERR.puts "Wrong value for :sessions in configuration file"
    exit(-1)
end

use Rack::Deflater

# Enable logger

include CloudLogger
logger=enable_logging(SUNSTONE_LOG, $conf[:debug_level].to_i)

begin
    ENV["ONE_CIPHER_AUTH"] = SUNSTONE_AUTH
    $cloud_auth = CloudAuth.new($conf, logger)
rescue => e
    logger.error {
        "Error initializing authentication system" }
    logger.error { e.message }
    exit -1
end

set :cloud_auth, $cloud_auth


$views_config = SunstoneViews.new

#start VNC proxy

$vnc = OpenNebulaVNC.new($conf, logger)

configure do
    set :run, false
    set :vnc, $vnc
    set :erb, :trim => '-'
end

DEFAULT_TABLE_ORDER = "desc"
DEFAULT_PAGE_LENGTH = 10

##############################################################################
# Helpers
##############################################################################
helpers do
    def valid_csrftoken?
        csrftoken = nil

        if params[:csrftoken]
            csrftoken = params[:csrftoken]
        else
            begin
                # Extract "csrftoken" and remove from @request_body if present
                request_body  = JSON.parse(@request_body)
                csrftoken     = request_body.delete("csrftoken")
                @request_body = request_body.to_json
            rescue
            end
        end

        session[:csrftoken] && session[:csrftoken] == csrftoken
    end

    def authorized?
        session[:ip] && session[:ip] == request.ip
    end

    def build_session
        begin
            result = $cloud_auth.auth(request.env, params)
        rescue Exception => e
            logger.error { e.message }
            return [500, ""]
        end

        if result.nil?
            logger.info { "Unauthorized login attempt" }
            return [401, ""]
        else
            client  = $cloud_auth.client(result, session[:active_zone_endpoint])
            user_id = OpenNebula::User::SELF

            user    = OpenNebula::User.new_with_id(user_id, client)
            rc = user.info
            if OpenNebula.is_error?(rc)
                logger.error { rc.message }
                return [500, ""]
            end

            session[:user]         = user['NAME']
            session[:user_id]      = user['ID']
            session[:user_gid]     = user['GID']
            session[:user_gname]   = user['GNAME']
            session[:ip]           = request.ip
            session[:remember]     = params[:remember]
            session[:display_name] = user[DISPLAY_NAME_XPATH] || user['NAME']

            csrftoken_plain = Time.now.to_f.to_s + SecureRandom.base64
            session[:csrftoken] = Digest::MD5.hexdigest(csrftoken_plain)

            group = OpenNebula::Group.new_with_id(user['GID'], client)
            rc = group.info
            if OpenNebula.is_error?(rc)
                logger.error { rc.message }
                return [500, ""]
            end

            #User IU options initialization
            #Load options either from user settings or default config.
            # - LANG
            # - WSS CONECTION
            # - TABLE ORDER

            if user['TEMPLATE/LANG']
                session[:lang] = user['TEMPLATE/LANG']
            else
                session[:lang] = $conf[:lang]
            end

            if user['TEMPLATE/TABLE_DEFAULT_PAGE_LENGTH']
                session[:page_length] = user['TEMPLATE/TABLE_DEFAULT_PAGE_LENGTH']
            else
                session[:page_length] = DEFAULT_PAGE_LENGTH
            end

            wss = $conf[:vnc_proxy_support_wss]
            #limit to yes,no options
            session[:vnc_wss] = (wss == true || wss == "yes" || wss == "only" ?
                             "yes" : "no")

            if user['TEMPLATE/TABLE_ORDER']
                session[:table_order] = user['TEMPLATE/TABLE_ORDER']
            else
                session[:table_order] = $conf[:table_order] || DEFAULT_TABLE_ORDER
            end

            if user['TEMPLATE/DEFAULT_VIEW']
                session[:default_view] = user['TEMPLATE/DEFAULT_VIEW']
            elsif group.contains_admin(user.id) && group['TEMPLATE/GROUP_ADMIN_DEFAULT_VIEW']
                session[:default_view] = group['TEMPLATE/GROUP_ADMIN_DEFAULT_VIEW']
            elsif group['TEMPLATE/DEFAULT_VIEW']
                session[:default_view] = group['TEMPLATE/DEFAULT_VIEW']
            else
                session[:default_view] = $views_config.available_views(session[:user], session[:user_gname]).first
            end

            #end user options

            if params[:remember] == "true"
                env['rack.session.options'][:expire_after] = 30*60*60*24-1
            end

            serveradmin_client = $cloud_auth.client(nil, session[:active_zone_endpoint])
            rc = OpenNebula::System.new(serveradmin_client).get_configuration
            return [500, rc.message] if OpenNebula.is_error?(rc)
            return [500, "Couldn't find out zone identifier"] if !rc['FEDERATION/ZONE_ID']

            zone = OpenNebula::Zone.new_with_id(rc['FEDERATION/ZONE_ID'].to_i, client)
            zone.info
            session[:zone_name] = zone.name

            session[:federation_mode] = rc['FEDERATION/MODE'].upcase

            return [204, ""]
        end
    end

    def destroy_session
        session.clear
        return [204, ""]
    end

    def cloud_view_instance_types
        $conf[:instance_types] || []
    end
end

before do
    cache_control :no_store
    content_type 'application/json', :charset => 'utf-8'

    @request_body = request.body.read
    request.body.rewind

    unless %w(/ /login /vnc /spice).include?(request.path)
        halt 401 unless authorized? && valid_csrftoken?
    end

    if env['HTTP_ZONE_NAME']
        client = $cloud_auth.client(session[:user], session[:active_zone_endpoint])
        zpool = ZonePoolJSON.new(client)

        rc = zpool.info

        halt [500, rc.to_json] if OpenNebula.is_error?(rc)

        found = false
        zpool.each{|z|
            if z.name == env['HTTP_ZONE_NAME']
                found = true
                serveradmin_client = $cloud_auth.client(nil, z['TEMPLATE/ENDPOINT'])
                rc = OpenNebula::System.new(serveradmin_client).get_configuration

                if OpenNebula.is_error?(rc)
                    msg = "Zone #{env['HTTP_ZONE_NAME']} not available " + rc.message
                    logger.error { msg }
                    halt [410, OpenNebula::Error.new(msg).to_json]
                end

                if !rc['FEDERATION/ZONE_ID']
                    msg = "Couldn't find out zone identifier"
                    logger.error { msg }
                    halt [500, OpenNebula::Error.new(msg).to_json]
                end

                session[:active_zone_endpoint] = z['TEMPLATE/ENDPOINT']
                session[:zone_name] = env['HTTP_ZONE_NAME']
            end
         }

         if !found
            msg = "Zone #{env['HTTP_ZONE_NAME']} does not exist"
            logger.error { msg }
            halt [404, OpenNebula::Error.new(msg).to_json]
        end
    end

    client = $cloud_auth.client(session[:user], session[:active_zone_endpoint])

    @SunstoneServer = SunstoneServer.new(client,$conf,logger)
end

after do
    unless request.path=='/login' || request.path=='/' || request.path=='/'
        unless session[:remember] == "true"
            if params[:timeout] == "true"
                env['rack.session.options'][:defer] = true
            else
                env['rack.session.options'][:expire_after] = SESSION_EXPIRE_TIME
            end
        end
    end
end

##############################################################################
# Custom routes
##############################################################################
if $conf[:routes]
    $conf[:routes].each { |route|
        require "routes/#{route}"
    }
end

##############################################################################
# HTML Requests
##############################################################################
get '/' do
    content_type 'text/html', :charset => 'utf-8'
    if !authorized?
        return erb :login
    end

    response.set_cookie("one-user", :value=>"#{session[:user]}")

    erb :index
end

get '/login' do
    content_type 'text/html', :charset => 'utf-8'
    if !authorized?
        erb :login
    end
end

get '/vnc' do
    content_type 'text/html', :charset => 'utf-8'
    if !authorized?
        erb :login
    else
        erb :vnc
    end
end

get '/spice' do
    content_type 'text/html', :charset => 'utf-8'
    if !authorized?
        erb :login
    else
        erb :spice
    end
end

##############################################################################
# Login
##############################################################################
post '/login' do
    build_session
end

post '/logout' do
    destroy_session
end

##############################################################################
# User configuration and VM logs
##############################################################################

get '/config' do
    uconf = {
        :user_config => {
            :lang => session[:lang],
            :vnc_wss  => session[:vnc_wss],
        },
        :system_config => {
            :marketplace_url => $conf[:marketplace_url],
            :vnc_proxy_port => $vnc.proxy_port
        }
    }

    [200, uconf.to_json]
end

post '/config' do
    @SunstoneServer.perform_action('user',
                               OpenNebula::User::SELF,
                               @request_body)

    user = OpenNebula::User.new_with_id(
                OpenNebula::User::SELF,
                $cloud_auth.client(session[:user], session[:active_zone_endpoint]))

    rc = user.info
    if OpenNebula.is_error?(rc)
        logger.error { rc.message }
        error 500, ""
    end

    session[:lang]         = user['TEMPLATE/LANG'] if user['TEMPLATE/LANG']
    session[:vnc_wss]      = user['TEMPLATE/VNC_WSS'] if user['TEMPLATE/VNC_WSS']
    session[:default_view] = user['TEMPLATE/DEFAULT_VIEW'] if user['TEMPLATE/DEFAULT_VIEW']
    session[:table_order]  = user['TEMPLATE/TABLE_ORDER'] if user['TEMPLATE/TABLE_ORDER']
    session[:page_length]  = user['TEMPLATE/TABLE_DEFAULT_PAGE_LENGTH'] if user['TEMPLATE/TABLE_DEFAULT_PAGE_LENGTH']
    session[:display_name] = user[DISPLAY_NAME_XPATH] || user['NAME']

    [204, ""]
end

get '/infrastructure' do
    serveradmin_client = $cloud_auth.client(nil, session[:active_zone_endpoint])

    hpool = OpenNebula::HostPool.new(serveradmin_client)

    rc = hpool.info

    if OpenNebula.is_error?(rc)
        logger.error { rc.message }
        error 500, ""
    end

    set = Set.new

    xml = XMLElement.new
    xml.initialize_xml(hpool.to_xml, 'HOST_POOL')
    xml.each('HOST/HOST_SHARE/PCI_DEVICES/PCI') do |pci|
        set.add({
            :device => pci['DEVICE'],
            :class  => pci['CLASS'],
            :vendor => pci['VENDOR'],
            :device_name => pci['DEVICE_NAME']
        })
    end

    infrastructure = {
        :pci_devices => set.to_a
    }

    [200, infrastructure.to_json]
end

get '/vm/:id/log' do
    @SunstoneServer.get_vm_log(params[:id])
end

##############################################################################
# Monitoring
##############################################################################

get '/:resource/monitor' do
    @SunstoneServer.get_pool_monitoring(
        params[:resource],
        params[:monitor_resources])
end

get '/user/:id/monitor' do
    @SunstoneServer.get_user_accounting(params)
end

get '/group/:id/monitor' do
    params[:gid] = params[:id]
    @SunstoneServer.get_user_accounting(params)
end

get '/:resource/:id/monitor' do
    @SunstoneServer.get_resource_monitoring(
        params[:id],
        params[:resource],
        params[:monitor_resources])
end

##############################################################################
# Accounting
##############################################################################

get '/vm/accounting' do
    @SunstoneServer.get_vm_accounting(params)
end

##############################################################################
# Showback
##############################################################################

get '/vm/showback' do
    @SunstoneServer.get_vm_showback(params)
end

##############################################################################
# Marketplace
##############################################################################
get '/marketplace' do
    @SunstoneServer.get_appliance_pool
end

get '/marketplace/:id' do
    @SunstoneServer.get_appliance(params[:id])
end

##############################################################################
# GET Pool information
##############################################################################
get '/:pool' do
    zone_client = nil

    if params[:zone_id] && session[:federation_mode] != "STANDALONE"
        zone = OpenNebula::Zone.new_with_id(params[:zone_id].to_i,
                                            $cloud_auth.client(session[:user],
                                                session[:active_zone_endpoint]))

        rc   = zone.info
        return [500, rc.message] if OpenNebula.is_error?(rc)
        zone_client = $cloud_auth.client(session[:user],
                                         zone['TEMPLATE/ENDPOINT'])
    end

    @SunstoneServer.get_pool(params[:pool],
                             session[:user_gid],
                             zone_client)
end

##############################################################################
# GET Resource information
##############################################################################

get '/:resource/:id/template' do
    @SunstoneServer.get_template(params[:resource], params[:id])
end

get '/:resource/:id' do
    if params[:extended]
        @SunstoneServer.get_resource(params[:resource], params[:id], true)
    else
        @SunstoneServer.get_resource(params[:resource], params[:id])
    end
end

##############################################################################
# Delete Resource
##############################################################################
delete '/:resource/:id' do
    @SunstoneServer.delete_resource(params[:resource], params[:id])
end

##############################################################################
# Upload image
##############################################################################
post '/upload' do
    tmpfile = nil

    name = params[:tempfile]

    if !name
        [500, OpenNebula::Error.new("There was a problem uploading the file, " \
                "please check the permissions on the file").to_json]
    else
        tmpfile = File.join(Dir.tmpdir, name)
        res = @SunstoneServer.upload(params[:img], tmpfile)
        FileUtils.rm(tmpfile)
        res
    end
end

post '/upload_chunk' do
    info = env['rack.request.form_hash']
    chunk_number = info['resumableChunkNumber'].to_i - 1
    chunk_size = info['resumableChunkSize'].to_i
    chunk_current_size = info['resumableCurrentChunkSize'].to_i
    chunk_start = chunk_number * chunk_size
    chunk_end = chunk_start + chunk_current_size - 1
    identifier = info['']
    size = info['resumableTotalSize'].to_i

    file_name = info['resumableIdentifier']
    file_path = File.join(Dir.tmpdir, file_name)

    tmpfile=info['file'][:tempfile]

    begin
        chunk = tmpfile.read
    rescue => e
        STDERR.puts e.backtrace
        return [500, OpenNebula::Error.new("Could not read the uploaded " \
                                           "chunk.".to_json)]
    end

    if File.exist? file_path
        mode = "r+"
    else
        mode = "w"
    end

    begin
        open(file_path, mode) do |f|
            f.seek(chunk_start)
            f.write_nonblock(chunk)
        end
        tmpfile.unlink
    rescue => e
        STDERR.puts e.backtrace
        return [500, OpenNebula::Error.new("Can not write to the temporary" \
                                           " image file").to_json]
    end

    ""
end

##############################################################################
# Create a new Resource
##############################################################################
post '/:pool' do
    @SunstoneServer.create_resource(params[:pool], @request_body)
end

##############################################################################
# Start VNC Session for a target VM
##############################################################################
post '/vm/:id/startvnc' do
    vm_id = params[:id]
    @SunstoneServer.startvnc(vm_id, $vnc)
end

##############################################################################
# Perform an action on a Resource
##############################################################################
post '/:resource/:id/action' do
    @SunstoneServer.perform_action(params[:resource],
                                   params[:id],
                                   @request_body)
end

Sinatra::Application.run! if(!defined?(WITH_RACKUP))
