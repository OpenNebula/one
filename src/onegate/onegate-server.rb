#!/usr/bin/env ruby
# -*- coding: utf-8 -*-

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

ONEGATE_AUTH = VAR_LOCATION + "/.one/onegate_auth"

ONEGATE_LOG = LOG_LOCATION + "/onegate.log"
CONFIGURATION_FILE = ETC_LOCATION + "/onegate-server.conf"

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+'/cloud'

require 'rubygems'
require 'sinatra'
require 'yaml'

require 'CloudAuth'
require 'CloudServer'

require 'opennebula'
include OpenNebula

begin
    $conf = YAML.load_file(CONFIGURATION_FILE)
    CloudServer.print_configuration($conf)
rescue Exception => e
    STDERR.puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
    exit 1
end

set :bind, $conf[:host]
set :port, $conf[:port]

set :config, $conf

include CloudLogger
logger = enable_logging(ONEGATE_LOG, $conf[:debug_level].to_i)

begin
    ENV["ONE_CIPHER_AUTH"] = ONEGATE_AUTH
    $cloud_auth = CloudAuth.new($conf, logger)
rescue => e
    logger.error { "Error initializing authentication system" }
    logger.error { e.message }
    exit(-1)
end

set :cloud_auth, $cloud_auth

helpers do
    def authenticate(env, params)
        begin
            result = $cloud_auth.auth(env, params)
        rescue Exception => e
            logger.error { "Unauthorized login attempt #{e.message}" }
            halt 401, "Not authorized"
        end

        if result.nil?
            logger.info { "Unauthorized login attempt" }
            halt 401, "Not authorized"
        else
            return $cloud_auth.client(result)
        end
    end
end

put '/vm/:id' do
    client = authenticate(request.env, params)

    halt 401, "Not authorized" if client.nil?

    vm = VirtualMachine.new_with_id(params[:id], client)
    rc = vm.info

    if OpenNebula.is_error?(rc)
        logger.error {"VMID:#{params[:id]} vm.info error: #{rc.message}"}
        halt 404, rc.message
    end

    rc = vm.update(request.body.read, true)

    if OpenNebula.is_error?(rc)
        logger.error {"VMID:#{params[:id]} vm.update error: #{rc.message}"}
        halt 500, rc.message
    end

    [200, ""]
end
