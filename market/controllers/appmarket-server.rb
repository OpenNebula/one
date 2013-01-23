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
require 'haml'
require 'redcarpet'

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

APPMARKET_LOG      = LOG_LOCATION + "/appmarket-server.log"
CONFIGURATION_FILE = ETC_LOCATION + "/appmarket-server.conf"

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+'/cloud'
$: << RUBY_LIB_LOCATION+'/oneapps/market'

require 'models'
require 'session'
require 'parser'
require 'mailer'

require 'pp'

configure do
    set :views,  File.join(File.dirname(__FILE__), '..', 'views')

    if settings.respond_to? :public_folder
        set :public_folder, File.join(File.dirname(__FILE__), '..', 'public')
    else
        set :public, File.join(File.dirname(__FILE__), '..', 'public')
    end

    # Initialize DB with admin credentials
    if User.list(nil).empty?
        User.bootstrap(CONF['user'])
    end

    set :bind, CONF[:host]
    set :port, CONF[:port]

    set :config, CONF
end

use Rack::Session::Pool, :key => 'appmarket'

helpers do
    def build_session
        @session = Session.new(request.env)

        if params[:remember] == "true"
            env['rack.session.options'][:expire_after] = 30*60*60*24
        end

        session[:ip] = request.ip
        session[:instance] = @session
    end
end


before do
    if request.env['PATH_INFO'] == '/'
        redirect '/appliance'
    end

    if request.path != '/login' && request.path != '/logout'
        if session[:ip] && session[:ip]==request.ip
            @session = session[:instance]
        else
            build_session
        end

        unless @session.authorize(request.env)
            if request.env["HTTP_ACCEPT"] && request.env["HTTP_ACCEPT"].split(',').grep(/text\/html/).empty?
                error 401, "User not authorized"
            else
                redirect '/appliance'
            end
        end
    end
end

#
# Login
#

post '/login' do
    build_session
    halt 401, "User not authroized" if @session.anonymous?
end

post '/logout' do
    session.clear
    redirect '/appliance'
end

#
# User
#

get '/user' do
    if request.env["HTTP_ACCEPT"] && request.env["HTTP_ACCEPT"].split(',').grep(/text\/html/).empty?
        Parser.generate_body({'sEcho' => "1", 'users' => User.list(@session)})
    else
        haml :user_index
    end
end

get '/user/:id' do
    begin
        @user = User.show(@session, params[:id])
    rescue BSON::InvalidObjectId
        error 404, $!.message
    end

    if @user.nil?
        error 404, "User not found"
    end

    if request.env["HTTP_ACCEPT"] && request.env["HTTP_ACCEPT"].split(',').grep(/text\/html/).empty?
        Parser.generate_body(@user)
    else
        haml :user_show
    end
end

post '/user/:id/enable' do
    begin
        user = User.show(@session, params[:id])
    rescue BSON::InvalidObjectId
        error 404, $!.message
    end

    if user.nil?
        error 404, "User not found"
    end

    begin
        update_result = User.enable(@session, params[:id])
    rescue BSON::InvalidObjectId
        error 404, $!.message
    rescue Validator::ParseException
        error 400, $!.message
    end

    #if update_result != true
    #    status 404
    #end

    if settings.config['mail']
        Mailer.send_enable(user['email'], user['username'])
    end
end

post '/user' do
    begin
        object_id = User.create(@session, Parser.parse_body(request))
    rescue Validator::ParseException
        error 400, $!.message
    rescue Mongo::OperationFailure
        error 400, "The username/organization already exists in the OpenNebula Marketplace"
    end

    Parser.generate_body({"_id" => object_id})
end

put '/user/:id' do
    begin
        @user = User.update(@session, params[:id], Parser.parse_body(request))
    rescue BSON::InvalidObjectId
        error 404, $!.message
    rescue Validator::ParseException
        error 400, $!.message
    rescue
        error 400, $!.message
    end

    status 200
end

delete '/user/:id' do
    begin
        @user = User.delete(@session, params[:id])
    rescue BSON::InvalidObjectId
        error 404, $!.message
    end
end

#
# Appliance
#

get '/appliance' do
    if request.env["HTTP_ACCEPT"] && request.env["HTTP_ACCEPT"].split(',').grep(/text\/html/).empty?
        Parser.generate_body({'sEcho' => "1", 'appliances' => Appliance.list(@session)})
    else
        haml :appliance_index
    end
end

get '/appliance/:id' do
    begin
        @app = Appliance.show(@session, params[:id])
    rescue BSON::InvalidObjectId
        error 404, $!.message
    end

    if @app.nil?
        error 404, "Appliance not found"
    end

    appliance_url = request.env['rack.url_scheme'] +
                    '://' +
                    request.env['HTTP_HOST'] +
                    request.env['REQUEST_URI']

    @app['links'] = {
        'download' => {
            'href' => appliance_url + '/download'
        }
    }

    if request.env["HTTP_ACCEPT"] && request.env["HTTP_ACCEPT"].split(',').grep(/text\/html/).empty?
        Parser.generate_body(@app)
    else
        render = Redcarpet::Render::HTML.new(
            :filter_html => true,
            :no_images => false,
            :no_links => false,
            :no_styles => true,
            :safe_links_only => true,
            :with_toc_data => true,
            :hard_wrap => true,
            :xhtml => true)

        @markdown = Redcarpet::Markdown.new(render,
            :autolink => true,
            :space_after_headers => true)

        haml :appliance_show
    end
end

post '/appliance' do
    begin
        object_id = Appliance.create(@session, Parser.parse_body(request))
    rescue Validator::ParseException
        error 400, $!.message
    rescue
        error 400, $!.message
    end

    Parser.generate_body({"_id" => object_id})
end

delete '/appliance/:id' do
    begin
        @app = Appliance.delete(@session, params[:id])
    rescue BSON::InvalidObjectId
        error 404, $!.message
    end
end

put '/appliance/:id' do
    begin
        @app = Appliance.update(@session, params[:id], Parser.parse_body(request))
    rescue BSON::InvalidObjectId
        error 404, $!.message
    rescue Validator::ParseException
        error 400, $!.message
    rescue
        error 400, $!.message
    end

    status 200
end

get '/appliance/:id/download' do
    begin
        url = Appliance.file_url(@session, params[:id])
    rescue BSON::InvalidObjectId
        error 404, $!.message
    end

    if url.nil?
        error 404, "Appliance not found"
    end

    redirect url
end
