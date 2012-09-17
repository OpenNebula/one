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

APPFLOW_LOG        = LOG_LOCATION + "/appflow.log"
CONFIGURATION_FILE = ETC_LOCATION + "/appflow.yaml"

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+'/cloud'
$: << RUBY_LIB_LOCATION+'/apptools/flow'

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
helpers do
    def authorized?
        session[:ip] && session[:ip]==request.ip ? true : false
    end

    def build_session
        username = authenticate(request.env, params)
        if username
            session[:ip]   = request.ip
            session[:user] = username

            return [204, ""]
        end
    end

    def destroy_session
        session.clear
        return [204, ""]
    end

    def authenticate(env, params)
        begin
            username = settings.cloud_auth.auth(request.env, params)
        rescue Exception => e
            Log.error LOG_COMP, e.message
            error 500, "Server error"
        end

        if username.nil? #unable to authenticate
            Log.error LOG_COMP, "User not authorized"
            error 401, "User not authorized"
        else
            return username
        end
    end
end

before do
    unless request.path=='/login'
        if authorized?
            @client  = settings.cloud_auth.client(session[:user])
        else
            username = authenticate(request.env, params)
            if username
                @client  = settings.cloud_auth.client(username)
            end
        end
    end
end

after do
    unless request.path=='/login' || request.path=='/'
        unless session[:remember] == "true"
            if params[:timeout] == "true"
                env['rack.session.options'][:defer] = true
            else
                env['rack.session.options'][:expire_after] = 60*10
            end
        end
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
# Login
##############################################################################
post '/login' do
    build_session
end

post '/logout' do
    destroy_session
end

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
    #body Parser.render(service_pool)
    body service_pool.to_json
end

get '/service/:id' do
    service_pool = OpenNebula::ServicePool.new(@client)

    service = service_pool.get(params[:id])

    if OpenNebula.is_error?(service)
        error CloudServer::HTTP_ERROR_CODE[service.errno], service.message
    end

    status 200
    #body Parser.render(service)
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
            if service.state() == Service::STATE['DONE']
                OpenNebula::Error.new("Action #{action['perform']}: " <<
                        "Wrong state #{service.state_str()}")
            elsif service.state() != Service::STATE['UNDEPLOYING']
                service.shutdown
            end
        when 'chown'
            if opts && opts['uid']
                args = Array.new
                args << opts['uid'].to_i
                args << (opts['gid'].to_i || -1)

                service.chown(*args)
            else
                OpenNebula::Error.new("Action #{action['perform']}: " <<
                        "You have to specify a UID")
            end
        when 'chgrp'
            if opts && opts['gid']
                service.chown(-1, opts['gid'].to_i)
            else
                OpenNebula::Error.new("Action #{action['perform']}: " <<
                        "You have to specify a GID")
            end
        when 'chmod'
            if opts && opts['octet']
                service.chmod_octet(opts['octet'])
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

    #body Parser.render(s_template_pool)
    body s_template_pool.to_json
end

get '/service_template/:id' do
    service_template = OpenNebula::ServiceTemplate.new_with_id(params[:id], @client)

    rc = service_template.info
    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    status 200

    #body Parser.render(rc)
    body service_template.to_json
end

delete '/service_template/:id' do
    service_template = OpenNebula::ServiceTemplate.new_with_id(params[:id], @client)

    rc = service_template.delete
    if OpenNebula.is_error?(rc)
        error CloudServer::HTTP_ERROR_CODE[rc.errno], rc.message
    end

    status 201

    #body Parser.render(rc)
    #body service_template.to_json
end

post '/service_template' do
    #template = Parser.json_to_hash(request.body.read)

    #begin
    #    Validator.validate(template)
    #rescue
    #    error 403,
    #end

    #template_xml = Parser.hash_to_xml(template)

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

        #body Parser.render(rc)
        body service.to_json
    when 'chown'
        if opts && opts['uid']
            args = Array.new
            args << opts['uid'].to_i
            args << (opts['gid'].to_i || -1)

            service_template.chown(*args)
        else
            OpenNebula::Error.new("Action #{action['perform']}: " <<
                    "You have to specify a UID")
        end
    when 'chgrp'
        if opts && opts['gid']
            service_template.chown(-1, opts['gid'].to_i)
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