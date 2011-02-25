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

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
    ETC_LOCATION="/etc/one/"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    ETC_LOCATION=ONE_LOCATION+"/etc/"
end

$: << RUBY_LIB_LOCATION

require 'pp'

require 'rubygems'
require 'OpenNebulaDriver'
require 'simple_auth'
require 'simple_permissions'
require 'yaml'
require 'sequel'
require 'ssh_auth'

class AuthorizationManager < OpenNebulaDriver
    def initialize
        super(15, true)
        
        config_data=File.read(ETC_LOCATION+'/auth/auth.conf')
        STDERR.puts(config_data)
        @config=YAML::load(config_data)
        
        STDERR.puts @config.inspect
        
        database_url=@config[:database]
        @db=Sequel.connect(database_url)
        
        # Get authentication driver
        begin
            driver_prefix=@config[:authentication].capitalize
            driver_name="#{driver_prefix}Auth"
            driver=Kernel.const_get(driver_name.to_sym)
            @authenticate=driver.new
            
            STDERR.puts "Using '#{driver_prefix}' driver for authentication"
        rescue
            STDERR.puts "Driver '#{driver_prefix}' not found, "<<
                "using SimpleAuth instead"
            @authenticate=SimpleAuth.new
        end
        
        @permissions=SimplePermissions.new(@db, OpenNebula::Client.new,
            @config)
        
        register_action(:AUTHENTICATE, method('action_authenticate'))
        register_action(:AUTHORIZE, method('action_authorize'))
    end
    
    def action_authenticate(request_id, user_id, user, password, token)
        auth=@authenticate.auth(user_id, user, password, token)
        if auth==true
            send_message('AUTHENTICATE', RESULT[:success],
                request_id, 'Successfully authenticated')
        else
            send_message('AUTHENTICATE', RESULT[:failure],
                request_id, auth)
        end
    end
    
    def action_authorize(request_id, user_id, *tokens)
        begin
            auth=@permissions.auth(user_id, tokens.flatten)
        rescue Exception => e
            auth="Error: #{e}"
        end
        
        if auth==true
            send_message('AUTHORIZE', RESULT[:success],
                request_id, 'success')
        else
            send_message('AUTHORIZE', RESULT[:failure],
                request_id, auth)
        end
    end
end

begin
    am=AuthorizationManager.new
rescue Exception => e
    puts "Error: #{e}"
    exit(-1)
end

am.start_driver

