#!/usr/bin/env ruby
# -*- coding: utf-8 -*-

# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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
    LOG_LOCATION      ||= '/var/log/one'
    VAR_LOCATION      ||= '/var/lib/one'
    ETC_LOCATION      ||= '/etc/one'
    SHARE_LOCATION    ||= '/usr/share/one'
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
    SUNSTONE_LOCATION ||= '/usr/lib/one/sunstone'
else
    VAR_LOCATION      ||= ONE_LOCATION + '/var'
    LOG_LOCATION      ||= ONE_LOCATION + '/var'
    ETC_LOCATION      ||= ONE_LOCATION + '/etc'
    SHARE_LOCATION    ||= ONE_LOCATION + '/share'
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
    SUNSTONE_LOCATION ||= ONE_LOCATION + '/lib/sunstone'
end

VMS_LOCATION = VAR_LOCATION + "/vms"
VMM_EXEC_CONF = ETC_LOCATION + "/vmm_exec/vmm_exec_kvm.conf"

SUNSTONE_AUTH             = VAR_LOCATION + '/.one/sunstone_auth'
SUNSTONE_LOG              = LOG_LOCATION + '/sunstone.log'
CONFIGURATION_FILE        = ETC_LOCATION + '/sunstone-server.conf'
PLUGIN_CONFIGURATION_FILE = ETC_LOCATION + '/sunstone-plugins.yaml'
LOGOS_CONFIGURATION_FILE  = ETC_LOCATION + '/sunstone-logos.yaml'

SUNSTONE_ROOT_DIR = File.dirname(__FILE__)

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

# Extra bundled gems initialization
if File.directory?(GEMS_LOCATION)
    # for some platforms, we redistribute newer base Ruby gems which
    # should be loaded instead of default ones in the distributions
    %w[openssl json].each do |name|
        begin
            gem name
        rescue LoadError
            # ignore
        end
    end
end

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << RUBY_LIB_LOCATION + '/cloud'
$LOAD_PATH << SUNSTONE_ROOT_DIR
$LOAD_PATH << SUNSTONE_ROOT_DIR + '/models'
$LOAD_PATH << SUNSTONE_ROOT_DIR + '/models/OpenNebula2FA'

DISPLAY_NAME_XPATH = 'TEMPLATE/SUNSTONE/DISPLAY_NAME'
TABLE_ORDER_XPATH = 'TEMPLATE/SUNSTONE/TABLE_ORDER'
DEFAULT_VIEW_XPATH = 'TEMPLATE/SUNSTONE/DEFAULT_VIEW'
GROUP_ADMIN_DEFAULT_VIEW_XPATH = 'TEMPLATE/SUNSTONE/GROUP_ADMIN_DEFAULT_VIEW'
TABLE_DEFAULT_PAGE_LENGTH_XPATH = 'TEMPLATE/SUNSTONE/TABLE_DEFAULT_PAGE_LENGTH'
LANG_XPATH = 'TEMPLATE/SUNSTONE/LANG'
TWO_FACTOR_AUTH_SECRET_XPATH = 'TEMPLATE/SUNSTONE/TWO_FACTOR_AUTH_SECRET'
DEFAULT_ZONE_ENDPOINT_XPATH = 'TEMPLATE/SUNSTONE/DEFAULT_ZONE_ENDPOINT'

ONED_CONF_OPTS = {
    # If no costs are defined in oned.conf these values will be used
    'DEFAULT_COST' => {
        'CPU_COST' => 0,
        'MEMORY_COST' => 0,
        'DISK_COST' => 0
    },
    # Only these values will be shown when retrieving oned.conf from the browser
    'ALLOWED_KEYS' => [
        'DEFAULT_COST',
        'DS_MAD_CONF',
        'MARKET_MAD_CONF',
        'VM_MAD',
        'IM_MAD',
        'AUTH_MAD',
        'LOG'
    ],
    # Generate an array if there is only 1 element
    'ARRAY_KEYS' => [
        'DS_MAD_CONF',
        'MARKET_MAD_CONF',
        'VM_MAD',
        'IM_MAD'
    ]
}

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
require 'base64'
require 'rexml/document'
require 'uri'
require 'open3'
require 'syslog/logger'

require "sunstone_qr_code"
require "sunstone_optp"
require "sunstone_2f_auth"
require 'CloudAuth'
require 'SunstoneServer'
require 'SunstoneViews'

require 'net/http'

begin
    require "SunstoneWebAuthn"
    webauthn_avail = true
rescue LoadError
    webauthn_avail = false
end

##############################################################################
# Configuration
##############################################################################

begin
    if Psych::VERSION > '4.0'
        $conf = YAML.load_file(CONFIGURATION_FILE, aliases: true)
    else
        $conf = YAML.load_file(CONFIGURATION_FILE)
    end
rescue Exception => e
    STDERR.puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
    exit 1
end

if $conf[:one_xmlrpc]
    ENV['ONE_XMLRPC'] = $conf[:one_xmlrpc].to_s unless ENV['ONE_XMLRPC']
end

if $conf[:one_xmlrpc_timeout]
    ENV['ONE_XMLRPC_TIMEOUT'] = $conf[:one_xmlrpc_timeout].to_s unless ENV['ONE_XMLRPC_TIMEOUT']
end

$conf[:webauthn_avail] = webauthn_avail

# Set Sunstone Session Timeout
$conf[:session_expire_time] ||= 3600

# Set the TMPDIR environment variable for uploaded images
ENV['TMPDIR']=$conf[:tmpdir] if $conf[:tmpdir]

CloudServer.print_configuration($conf)

#Sinatra configuration

set :config, $conf
set :bind, $conf[:host]
set :port, $conf[:port]
set :sockets, []

if (proxy = $conf[:proxy])
    env_proxy = proxy.start_with?('https') ? 'https_proxy' : 'http_proxy'
    ENV[env_proxy] = proxy
    ENV[env_proxy.upcase] = proxy
end

if (no_proxy = $conf[:no_proxy])
    ENV['no_proxy'] = no_proxy
    ENV['NO_PROXY'] = no_proxy
end

if ENV["APP_ENV"] &&
    !ENV["APP_ENV"].empty? &&
    %w{production development test}.include?(ENV["APP_ENV"])
    set :environment, ENV["APP_ENV"].to_sym
else
    case $conf[:env]
    when "dev"
        set :environment, :development
    else
        set :environment, :production
    end
end

case $conf[:sessions]
when 'memory', nil
    use Rack::Session::Pool, :key => 'sunstone',
                            :expire_after => $conf['session_expire_time']
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
      :cache => Dalli::Client.new(memcache_server, {:namespace => $conf[:memcache_namespace]})
else
    STDERR.puts "Wrong value for :sessions in configuration file"
    exit(-1)
end

use Rack::Deflater

# Enable logger

include CloudLogger

if $conf[:log]
    $conf[:debug_level] = $conf[:log][:level] || 3
else
    $conf[:debug_level] ||= 3
end

if $conf[:log] && $conf[:log][:system] == 'syslog'
    logger = Syslog::Logger.new('onegate')
else
    logger = enable_logging(SUNSTONE_LOG, $conf[:debug_level].to_i)
end

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

begin
    $views_config = SunstoneViews.new($conf[:mode])
rescue StandardError => e
    logger.error { e.message }
    exit -1
end

if $conf[:webauthn_avail]
    begin
        SunstoneWebAuthn.configure($conf)
    rescue => e
        logger.error {
            "Error initializing WebAuthn" }
        logger.error { e.message }
        exit -1
    end
end

#start VNC proxy
$vnc = SunstoneVNC.new($conf, logger)

#init Guacamole proxy
$guac = SunstoneGuac.new(logger)

#init VMRC proxy
$vmrc = SunstoneVMRC.new(logger)

configure do
    set :run, false
    set :vnc, $vnc
    set :vmrc, $vmrc
    set :erb, :trim => '-'
end

$addons = OpenNebulaAddons.new(logger)

DEFAULT_TABLE_ORDER = "desc"
DEFAULT_PAGE_LENGTH = 10

SUPPORT = {
    :zendesk_url => "https://opennebula.zendesk.com/api/v2",
    :custom_field_version => 391130,
    :custom_field_severity => 391197,
    :author_id => 21231023,
    :author_name => "OpenNebula Support Team",
    :support_subscription => "https://opennebula.io/support/",
    :account => "https://opennebula.io/buy-support",
    :docs => "https://docs.opennebula.io/6.10/",
    :community => "https://opennebula.io/usec",
    :project => "OpenNebula"
}

UPGRADE = {
    :upgrade => "<span style='color: #0098c3' id='itemUpdate' style='display:none;'>Upgrade Available</span>&nbsp;<span style='color:#DC7D24'><i class='fas fa-exclamation-circle'></i></span>",
    :no_upgrade => "",
    :url => "https://opennebula.io/use/"
}

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

    def get_ovmf_uefis
        ovmf_uefis = []

        if File.exist?(VMM_EXEC_CONF)
            File.foreach(VMM_EXEC_CONF) do |line|
                if line =~ /^OVMF_UEFIS\s*=\s*"(.+)"$/
                    ovmf_uefis = $1.split(" ")
                    break
                end
            end
        else
            logger.error("Configuration file not found: #{VMM_EXEC_CONF}")
        end

        ovmf_uefis
    end

    def authorized?
        session[:ip] && session[:ip] == request.ip
    end

    def build_conf_locals
        logos_conf = nil
        begin
            if Psych::VERSION > '4.0'
                logos_conf = YAML.load_file(LOGOS_CONFIGURATION_FILE, aliases: true)
            else
                logos_conf = YAML.load_file(LOGOS_CONFIGURATION_FILE)
            end
        rescue Exception => e
            logger.error { "Error parsing config file #{LOGOS_CONFIGURATION_FILE}: #{e.message}" }
            error 500, ""
        end
        serveradmin_client = $cloud_auth.client(nil, session[:active_zone_endpoint])
        rc = OpenNebula::System.new(serveradmin_client).get_configuration
        if OpenNebula.is_error?(rc)
            logger.error { rc.message }
            error 500, ""
        end
        oned_conf_template = rc.to_hash()['OPENNEBULA_CONFIGURATION']
        oned_conf = {}
        ONED_CONF_OPTS['ALLOWED_KEYS'].each do |key|
            value = oned_conf_template[key]
            if key == 'DEFAULT_COST'
                if value
                    oned_conf[key] = value
                else
                    oned_conf[key] = ONED_CONF_OPTS['DEFAULT_COST']
                end
            else
                if ONED_CONF_OPTS['ARRAY_KEYS'].include?(key) && !value.is_a?(Array)
                    oned_conf[key] = [value]
                else
                    oned_conf[key] = value
                end
            end
        end
        $conf[:locals] = {
            :logos_conf => logos_conf,
            :oned_conf  => oned_conf,
            :support    => SUPPORT,
            :upgrade    => UPGRADE
        }
    end

    def get_fireedge_token(tfa)
        response = ""
        if $conf && $conf[:private_fireedge_endpoint] && !$conf[:private_fireedge_endpoint].empty?
          begin
            $conf[:private_fireedge_endpoint] = $conf[:private_fireedge_endpoint].downcase
            uri = URI($conf[:private_fireedge_endpoint]+'/fireedge/api/auth')
            user_pass = Base64.decode64(session[:auth])
            username = user_pass.split(":")[0]
            password = user_pass.split(":")[1]
            params = { :user => username, :token => password }
            if tfa && !tfa.empty?
              params[:token2fa] = tfa
            end
            fireedge_token = ""
            res = Net::HTTP.post_form(uri, params)
            fireedge_token = JSON.parse(res.body)['data']['token'] if res.is_a?(Net::HTTPSuccess)

            response = fireedge_token
          rescue StandardError => error
            logger.error { "Cannot connect with fireedge: #{error.message}" }
          end
        end
        return response
    end

    def build_session
        begin
            result = $cloud_auth.auth(request.env, params)
        rescue StandardError => e
            logger.error { e.message }
            return [500, '']
        end

        if result.nil?
            logger.info { 'Unauthorized login attempt' }
            return [401, '']
        end
        client  = $cloud_auth.client(result, $conf[:one_xmlrpc])
        user_id = OpenNebula::User::SELF

        user    = OpenNebula::User.new_with_id(user_id, client)
        rc = user.info
        if OpenNebula.is_error?(rc)
            logger.error { rc.message }
            return [500, '']
        end

        # two factor_auth
        isHOTPConfigured = (user[TWO_FACTOR_AUTH_SECRET_XPATH] && user[TWO_FACTOR_AUTH_SECRET_XPATH] != "")
        isWebAuthnConfigured = $conf[:webauthn_avail] && SunstoneWebAuthn.getCredentialIDsForUser(user.id).length > 0
        two_factor_auth_token = params[:two_factor_auth_token]
        if isHOTPConfigured || isWebAuthnConfigured
            if !two_factor_auth_token || two_factor_auth_token == ""
                return [202, { code: "two_factor_auth", uid: user.id }.to_json]
            end
            isTwoFactorAuthSuccessful = false
            if isHOTPConfigured && Sunstone2FAuth.authenticate(user[TWO_FACTOR_AUTH_SECRET_XPATH], two_factor_auth_token)
                isTwoFactorAuthSuccessful = true
            end
            if isWebAuthnConfigured && SunstoneWebAuthn.authenticate(user.id, two_factor_auth_token)
                isTwoFactorAuthSuccessful = true
            end
            if !isTwoFactorAuthSuccessful
                logger.info { "Unauthorized two factor authentication login attempt" }
                return [401, "Two factor authentication failed"]
            end
        end

        # If active zone endpoint is not defined, pull it
        # from user template if exists
        unless user[DEFAULT_ZONE_ENDPOINT_XPATH].nil? or user[DEFAULT_ZONE_ENDPOINT_XPATH].empty?
            session[:active_zone_endpoint] ||=
                   user[DEFAULT_ZONE_ENDPOINT_XPATH]
        end
        client_active_endpoint = $cloud_auth.client(result, session[:active_zone_endpoint])

        session[:user]         = user['NAME']
        session[:user_id]      = user['ID']
        session[:user_gid]     = user['GID']
        session[:user_gname]   = user['GNAME']
        session[:ip]           = request.ip
        session[:remember]     = params[:remember]
        session[:display_name] = user[DISPLAY_NAME_XPATH] || user['NAME']

        begin
            http_authorization_header = request.env['HTTP_AUTHORIZATION']
        rescue StandardError => e
            logger.error { 'Authorization header not received' }
        else
            begin
                if RUBY_VERSION > '2.0.0'
                    auth = http_authorization_header.match(/(?<basic>\w+) (?<pass>(\w|\W)+)/)
                    type, pass = auth[:basic], auth[:pass]
                else
                    type, pass = http_authorization_header.split(' ')
                end
            rescue StandardError => e
                logger.error { 'Invalid authorization header format' }
            else
                if type && type.downcase == 'basic'
                    session[:auth] = pass
                else
                    logger.info { 'Unauthorized login attempt or invalid authorization header' }
                    return [401, '']
                end
            end
        end

        #get firedge JWT
        session[:fireedge_token] = get_fireedge_token(two_factor_auth_token)

        csrftoken_plain = Time.now.to_f.to_s + SecureRandom.base64
        session[:csrftoken] = Digest::SHA256.hexdigest(csrftoken_plain)

        group = OpenNebula::Group.new_with_id(OpenNebula::Group::SELF, client_active_endpoint)
        rc = group.info
        if OpenNebula.is_error?(rc)
            logger.error { rc.message }
            return [500, '']
        end

        # User IU options initialization
        # Load options either from user settings or default config.
        # - LANG
        # - WSS CONECTION
        # - TABLE ORDER

        if user[LANG_XPATH]
            session[:lang] = user[LANG_XPATH]
        else
            session[:lang] = $conf[:lang]
        end

        if user[TABLE_DEFAULT_PAGE_LENGTH_XPATH]
            session[:page_length] = user[TABLE_DEFAULT_PAGE_LENGTH_XPATH]
        else
            session[:page_length] = DEFAULT_PAGE_LENGTH
        end

        wss = $conf[:vnc_proxy_support_wss]
        # limit to yes,no options
        session[:vnc_wss] = (wss == true || wss == 'yes' || wss == 'only' ?
                         'yes' : 'no')

        if user[TABLE_ORDER_XPATH]
            session[:table_order] = user[TABLE_ORDER_XPATH]
        else
            session[:table_order] = $conf[:table_order] || DEFAULT_TABLE_ORDER
        end

        if user[DEFAULT_VIEW_XPATH]
            session[:default_view] = user[DEFAULT_VIEW_XPATH]
        elsif group.contains_admin(user.id) && group[GROUP_ADMIN_DEFAULT_VIEW_XPATH]
            session[:default_view] = group[GROUP_ADMIN_DEFAULT_VIEW_XPATH]
        elsif group[DEFAULT_VIEW_XPATH]
            session[:default_view] = group[DEFAULT_VIEW_XPATH]
        else
            session[:default_view] = $views_config.available_views(session[:user], session[:user_gname]).first
        end

        # end user options

        # secure cookies
        if request.scheme == 'https'
            env['rack.session.options'][:secure] = true
        end
        # end secure cookies

        if params[:remember] == 'true'
            env['rack.session.options'][:expire_after] = 30*60*60*24-1
        end

        serveradmin_client = $cloud_auth.client()
        local_configuration = OpenNebula::System.new(serveradmin_client).get_configuration
        return [500, local_configuration.message] if OpenNebula.is_error?(local_configuration)

        session[:id_own_federation] = local_configuration['FEDERATION/ZONE_ID']

        serveradmin_client_active_endpoint = $cloud_auth.client(nil, session[:active_zone_endpoint])
        active_zone_configuration = OpenNebula::System.new(serveradmin_client_active_endpoint).get_configuration
        return [500, active_zone_configuration.message] if OpenNebula.is_error?(active_zone_configuration)

        return [500, "Couldn't find out zone identifier"] if !active_zone_configuration['FEDERATION/ZONE_ID']

        zone = OpenNebula::Zone.new_with_id(active_zone_configuration['FEDERATION/ZONE_ID'].to_i, client_active_endpoint)
        zone.info

        url_one_zone = zone.retrieve_elements("TEMPLATE/ONEFLOW_ENDPOINT")
        session[:zone_flow_url] = (url_one_zone && url_one_zone[0]) || $conf[:oneflow_server]

        session[:zone_name] = zone.name
        session[:zone_id]   = zone.id
        session[:federation_mode] = active_zone_configuration['FEDERATION/MODE'].upcase
        session[:mode] = $conf[:mode]

        [204, ""]
    end

    def destroy_session
        session.destroy
        [204, ""]
    end
end

before do
    cache_control :no_store
    content_type 'application/json', :charset => 'utf-8'
    @request_body = request.body.read
    request.body.rewind

    unless %w(/ /login /vnc /spice /version /webauthn_options_for_get /ws /vmrc /guac).include?(request.path)
        halt [401, "csrftoken"] unless authorized? && valid_csrftoken?
    end

    request_vars = {}

    request.env.each do |k, v|
        if v && String === v && !v.empty?
            request_vars[k] = v
        end
    end

    hpref        = "HTTP-"
    head_zone    = "ZONENAME"
    reqenv       = request_vars

    zone_name_header = reqenv[head_zone] ? reqenv[head_zone] : reqenv[hpref+head_zone]

    # Try with underscores
    if zone_name_header.nil?
        hpref        = "HTTP_"
        head_zone    = "ZONENAME"

        zone_name_header = reqenv[head_zone] ? reqenv[head_zone] : reqenv[hpref+head_zone]
    end

    if zone_name_header && !zone_name_header.empty?
        client = $cloud_auth.client(session[:user], session[:active_zone_endpoint])
        zpool = ZonePoolJSON.new(client)

        rc = zpool.info

        halt [500, rc.to_json] if OpenNebula.is_error?(rc)

        found = false
        zpool.each{|z|
            if z.name == zone_name_header
                found = true
                serveradmin_client = $cloud_auth.client(nil, z['TEMPLATE/ENDPOINT'])
                rc = OpenNebula::System.new(serveradmin_client).get_configuration

                if OpenNebula.is_error?(rc)
                    msg = "Zone #{zone_name_header} not available " + rc.message
                    logger.error { msg }
                    halt [410, OpenNebula::Error.new(msg).to_json]
                end

                if !rc['FEDERATION/ZONE_ID']
                    msg = "Couldn't find out zone identifier"
                    logger.error { msg }
                    halt [500, OpenNebula::Error.new(msg).to_json]
                end

                session[:zone_flow_url] = z['TEMPLATE/ONEFLOW_ENDPOINT'] || $conf[:oneflow_server]
                session[:active_zone_endpoint] = z['TEMPLATE/ENDPOINT']
                session[:zone_name] = zone_name_header
                session[:zone_id]   = z.id
            end
         }

         if !found
            msg = "Zone #{zone_name_header} does not exist"
            logger.error { msg }
            halt [404, OpenNebula::Error.new(msg).to_json]
        end
    end

    client = $cloud_auth.client(session[:user], session[:active_zone_endpoint])

    @SunstoneServer = SunstoneServer.new(client, $conf, logger)
end

after do
    unless request.path == '/login' || request.path == '/' || request.path == '/'
        # secure cookies
        if request.scheme == 'https'
            env['rack.session.options'][:secure] = true
        end
        # end secure cookies
        unless session[:remember] == "true"
            if params[:timeout] == "true"
                env['rack.session.options'][:defer] = true
            else
                env['rack.session.options'][:expire_after] = $conf[:session_expire_time]
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

    if $conf[:locals].nil?
      build_conf_locals
    end

    erb :index, :locals =>  {
            :logos_conf => $conf[:locals][:logos_conf],
            :oned_conf  => $conf[:locals][:oned_conf],
            :support    => $conf[:locals][:support],
            :upgrade    => $conf[:locals][:upgrade]
    }
end

get '/ws' do
    logger.info { 'Incomming WS connection' }
    if request.websocket?
        request.websocket do |ws|
            ws.onopen do
                logger.info { "New client registered" }
                settings.sockets << ws
            end

            ws.onmessage do |msg|
                logger.info { "New message received: #{msg}" }
            end

            ws.onclose do
                logger.info { "Client disconnected." }
                settings.sockets.delete(ws)
            end
        end
    end
end

get '/login' do
    content_type 'text/html', :charset => 'utf-8'
    if !authorized?
        erb :login
    else
        redirect to('/')
    end
end

get '/two_factor_auth_hotp_qr_code' do
    content_type 'image/svg+xml'
    issuer = $conf[:two_factor_auth_issuer].nil?? "sunstone-opennebula" : $conf[:two_factor_auth_issuer]
    totp = SunstoneOPTP.build(params[:secret], issuer)
    totp_uri = totp.provisioning_uri(session[:user])
    qr_code = SunstoneQRCode.build(totp_uri)
    [200, qr_code.as_svg]
end

get '/webauthn_options_for_create' do
    content_type 'application/json'
    if !$conf[:webauthn_avail]
        return [501, '']
    end
    options = SunstoneWebAuthn.getOptionsForCreate(session[:user_id], session[:user])
    [200, options]
end

get '/webauthn_options_for_get' do
    content_type 'application/json'
    if !$conf[:webauthn_avail]
        return [501, '']
    end
    begin
        user_id = Integer(params[:uid]).to_s
    rescue ArgumentError => e
        return [401, '']
    end
    options = SunstoneWebAuthn.getOptionsForGet(user_id)
    if options.nil?
        return [204, '']
    end
    [200, options]
end

get '/vnc' do
    content_type 'text/html', :charset => 'utf-8'
    if !authorized?
        erb :login
    else
        erb :vnc, :locals =>  {
            :logos_conf => $conf[:locals][:logos_conf],
            :oned_conf  => $conf[:locals][:oned_conf],
            :support    => $conf[:locals][:support],
            :upgrade    => $conf[:locals][:upgrade]
        }
    end
end

get '/guac' do
    content_type 'text/html', :charset => 'utf-8'
    if !authorized?
        erb :login
    else
        erb :guac, :locals =>  {
            :logos_conf => $conf[:locals][:logos_conf],
            :oned_conf  => $conf[:locals][:oned_conf],
            :support    => $conf[:locals][:support],
            :upgrade    => $conf[:locals][:upgrade]
        }
    end
end

get '/vmrc' do
    content_type 'text/html', :charset => 'utf-8'
    if !authorized?
        erb :login
    else
        erb :vmrc, :locals =>  {
            :logos_conf => $conf[:locals][:logos_conf],
            :oned_conf  => $conf[:locals][:oned_conf],
            :support    => $conf[:locals][:support],
            :upgrade    => $conf[:locals][:upgrade]
        }
    end
end

get '/spice' do
    content_type 'text/html', :charset => 'utf-8'
    if !authorized?
        erb :login
    else
        erb :spice, :locals =>  {
            :logos_conf => $conf[:locals][:logos_conf],
            :oned_conf  => $conf[:locals][:oned_conf],
            :support    => $conf[:locals][:support],
            :upgrade    => $conf[:locals][:upgrade]
        }
    end
end

get '/version' do
    version = {}

    version["version"] = OpenNebula::VERSION

    [200, version.to_json]
end

get '/ovmf_uefis' do
    content_type 'application/json', :charset => 'utf-8'
    ovmf_uefis = {}
    ovmf_uefis["ovmf_uefis"] = get_ovmf_uefis
    [200, ovmf_uefis.to_json]
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

    session[:lang]         = user[LANG_XPATH] if user[LANG_XPATH]
    session[:default_view] = user[DEFAULT_VIEW_XPATH] if user[DEFAULT_VIEW_XPATH]
    session[:table_order]  = user[TABLE_ORDER_XPATH] if user[TABLE_ORDER_XPATH]
    session[:page_length]  = user[TABLE_DEFAULT_PAGE_LENGTH_XPATH] if user[TABLE_DEFAULT_PAGE_LENGTH_XPATH]
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

    infrastructure = {}

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

    infrastructure[:pci_devices] = set.to_a

    set = Set.new

    xml.each('HOST/TEMPLATE/CUSTOMIZATION') do |customization|
        set.add(customization['NAME'])
    end

    infrastructure[:vcenter_customizations] = set.to_a

    set_cpu_models = Set.new
    set_kvm_machines = Set.new

    xml.each('HOST/TEMPLATE') do |kvm|
        if !kvm['KVM_CPU_MODELS'].nil?
            set_cpu_models += kvm['KVM_CPU_MODELS'].split(" ")
        end
        if !kvm['KVM_MACHINES'].nil?
            set_kvm_machines += kvm['KVM_MACHINES'].split(" ")
        end
    end

    infrastructure[:kvm_info] = { :set_cpu_models => set_cpu_models.to_a, :set_kvm_machines => set_kvm_machines.to_a }

    set_lxd_profiles = Set.new

    xml.each('HOST/TEMPLATE/LXD_PROFILES') do |lxd_profiles|
        set_lxd_profiles += lxd_profiles.text.split(" ")
    end

    infrastructure[:lxd_profiles] = set_lxd_profiles.to_a

    [200, infrastructure.to_json]
end

get '/vm/:id/log' do
    @SunstoneServer.get_vm_log(params[:id])
end

##############################################################################
# Monitoring
##############################################################################

get '/:resource/monitor' do
    @SunstoneServer.get_pool_monitoring(params[:resource])
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
# GET FireEdge token
##############################################################################
get '/auth_fireedge' do
    if !session[:fireedge_token].empty?
      response = {:token => session[:fireedge_token]}
      [200,  response.to_json]
    else
      fireedge_token = get_fireedge_token("")
      if !fireedge_token.empty?
        session[:fireedge_token] = fireedge_token
        response = {:token => session[:fireedge_token]}
        [200,  response.to_json]
      else
        response = {:token => ""}
        [400,  response.to_json]
      end
    end
end

##############################################################################
# GET Pool information
##############################################################################
get '/:pool' do
    zone_client = nil
    filter = params[:pool_filter]

    if params[:zone_id] && session[:federation_mode] != "STANDALONE"
        zone = OpenNebula::Zone.new_with_id(params[:zone_id].to_i,
                                            $cloud_auth.client(session[:user],
                                            session[:active_zone_endpoint]))

        rc   = zone.info
        return [500, rc.message] if OpenNebula.is_error?(rc)
        zone_client = $cloud_auth.client(session[:user],
                                         zone['TEMPLATE/ENDPOINT'])
    end

    if params[:pool_filter].nil?
        filter = session[:user_uid]
    end

    @SunstoneServer.get_pool(params[:pool],
                             filter,
                             zone_client)
end

##############################################################################
# GET Resource information
##############################################################################
get '/:resource/:id/template' do
    @SunstoneServer.get_template(params[:resource], params[:id])
end

get '/:resource/:id' do
    if  params[:extended] && params[:extended] != "false"
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
# Download marketplaceapp
##############################################################################
get '/marketplaceapp/:id/download' do
    dl_resource = @SunstoneServer.download_marketplaceapp(params[:id])

    # If the first element of dl_resource is a number, it is the exit_code after
    # an error happend, so return it.
    return dl_resource if dl_resource[0].kind_of?(Fixnum)

    download_cmd, filename = dl_resource

    # Send headers
    headers['Cache-Control']       = "no-transform" # Do not use Rack::Deflater
    headers['Content-Disposition'] = "attachment; filename=\"#{filename}\""

    content_type :'application/octet-stream'

    # Start stream
    stream do |out|
        Open3.popen3(download_cmd) do |_,o,e,w|

            until o.eof?
                # Read in chunks of 16KB
                out << o.read(16384)
            end

            if !w.value.success?
                error_message = "downloader.sh: " << e.read
                logger.error { error_message }

                if request.user_agent == "OpenNebula CLI"
                    out << "@^_^@ #{error_message} @^_^@"
                end
            end
        end
    end
end

##############################################################################
# Create a marketPlacetApp
##############################################################################
post '/marketplaceapp/:type/create' do
    @SunstoneServer.createMarketApp(params[:type], @request_body)
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
# Start Guacamole Session for a target VM
##############################################################################
post '/vm/:id/guac/:type' do
    vm_id = params[:id]
    type_connection = params[:type]

    user = OpenNebula::User.new_with_id(
        OpenNebula::User::SELF,
        $cloud_auth.client(session[:user], session[:active_zone_endpoint]))

    rc = user.info
    if OpenNebula.is_error?(rc)
        logger.error { rc.message }
        error 500, ""
    end

    @SunstoneServer.startguac(vm_id, type_connection, $guac, user)
end

##############################################################################
# Start VMRC Session for a target VM
##############################################################################
post '/vm/:id/startvmrc' do
  vm_id = params[:id]
  serveradmin_client = $cloud_auth.client(nil, session[:active_zone_endpoint])
  @SunstoneServer.startvmrc(vm_id, $vmrc, serveradmin_client)
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
