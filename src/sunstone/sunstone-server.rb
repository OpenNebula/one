#!/usr/bin/env ruby

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
# Required libraries
##############################################################################
require 'rubygems'
require 'sinatra'

require 'models/SunstoneServer'


##############################################################################
# Sinatra Configuration
##############################################################################
use Rack::Session::Pool


##############################################################################
# Helpers
##############################################################################
helpers do
    def authorized?
        session[:ip] && session[:ip]==request.ip ? true : false
    end

    def build_session
        auth = Rack::Auth::Basic::Request.new(request.env)
        if auth.provided? && auth.basic? && auth.credentials
            user = auth.credentials[0]
            sha1_pass = Digest::SHA1.hexdigest(auth.credentials[1])

            rc = SunstoneServer.authorize(user, sha1_pass)
            if rc[1]
                session[:user]     = user
                session[:user_id]  = rc[1]
                session[:password] = sha1_pass
                session[:ip]       = request.ip
                session[:remember] = params[:remember]

                if params[:remember]
                    env['rack.session.options'][:expire_after] = 30*60*60*24
                end

                return [204, ""]
            else
                return [rc.first, ""]
            end
        end

        return [401, ""]
    end

    def destroy_session
        session.clear
        return [204, ""]
    end
end

before do
    unless request.path=='/login' || request.path=='/'
        halt 401 unless authorized?

        @SunstoneServer = SunstoneServer.new(session[:user], session[:password])
    end
end

after do
    unless request.path=='/login' || request.path=='/'
        unless session[:remember]
            if params[:timeout] == true
                env['rack.session.options'][:defer] = true
            else
                env['rack.session.options'][:expire_after] = 60*10
            end
        end
    end
end

##############################################################################
# HTML Requests
##############################################################################
get '/' do
    redirect '/login' unless authorized?

    time = Time.now + 60
    response.set_cookie("one-user",
                        :value=>"#{session[:user]}",
                        :expires=>time)
    response.set_cookie("one-user_id",
                        :value=>"#{session[:user_id]}",
                        :expires=>time)

    File.read(File.dirname(__FILE__)+'/templates/index.html')
end

get '/login' do
    File.read(File.dirname(__FILE__)+'/templates/login.html')
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
# Config and Logs
##############################################################################
get '/config' do
    @SunstoneServer.get_configuration(session[:user_id])
end

get '/vm/:id/log' do
    @SunstoneServer.get_vm_log(params[:id])
end

##############################################################################
# GET Pool information
##############################################################################
get '/:pool' do
    @SunstoneServer.get_pool(params[:pool])
end

##############################################################################
# GET Resource information
##############################################################################
get '/:resource/:id' do
    @SunstoneServer.get_resource(params[:resource], params[:id])
end

##############################################################################
# Delete Resource
##############################################################################
delete '/:resource/:id' do
    @SunstoneServer.delete_resource(params[:resource], params[:id])
end

##############################################################################
# Create a new Resource
##############################################################################
post '/:pool' do
    @SunstoneServer.create_resource(params[:pool], request.body.read)
end

post '/vm/:id/stopvnc' do
    vm_id = params[:id]
    vnc_hash = session['vnc']

    if !vnc_hash || !vnc_hash[vm_id]
        msg = "It seems there is no VNC proxy running for this machine"
        return [403, OpenNebula::Error.new(msg).to_json]
    end

    rc = @SunstoneServer.stopvnc(vm_id, vnc_hash[vm_id])
    if rc[0] == 200
        session['vnc'].delete(vm_id)
    end

    rc
end

post '/vm/:id/startvnc' do
    vm_id = params[:id]

    vnc_hash = session['vnc']

    if !vnc_hash
        session['vnc']= {}
    elsif vnc_hash[vm_id]
        msg = "There is a VNC server running for this VM"
        return [403, OpenNebula::Error.new(msg).to_json]
    end

    rc = @SunstoneServer.startvnc(vm_id)
    if rc[0] == 200
        info = rc[1]
        session['vnc'][vm_id] = info[:pipe]
        info.delete(:pipe)

        [200, info.to_json]
    else
        rc
    end
end

##############################################################################
# Perform an action on a Resource
##############################################################################
post '/:resource/:id/action' do
    @SunstoneServer.perform_action(params[:resource], params[:id], request.body.read)
end

