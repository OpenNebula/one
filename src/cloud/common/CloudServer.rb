# -------------------------------------------------------------------------- #
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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

require 'repo_manager'
require 'Configuration'
require 'OpenNebula'

###############################################################################
# This class represents a generic Cloud Server using the OpenNebula Cloud
# API (OCA). Any cloud implementation should derive from this class
###############################################################################
class CloudServer

    ###########################################################################
    # Public attributes
    ###########################################################################
    attr_reader :config
    attr_reader :one_client

    # Initializes the Cloud server based on a config file
    # config_file:: _String_ for the server. MUST include the following 
    # variables:
    #   USER
    #   PASSWORD
    #   VM_TYPE
    #   IMAGE_DIR
    #   DATABASE
    def initialize(config_file)

        # --- Load the Cloud Server configuration file ---

        @config = Configuration.new(config_file)
        @auth   = "#{@config[:user]}:#{@config[:password]}"
        
        @instance_types = Hash.new

        if @config[:vm_type].kind_of?(Array)
            @config[:vm_type].each {|type|
                @instance_types[type['NAME']]=type
            }
        else
            @instance_types[@config[:vm_type]['NAME']]=@config[:vm_type]
        end

        # --- Start a Repository Manager ---
    
        Image.image_dir = @config[:image_dir]
        @rm = RepoManager.new(@config[:database])

        # --- Start an OpenNebula Session ---
        
        @one_client = Client.new(@auth)
        @user_pool  = UserPool.new(@one_client)
    end

    # Generates an OpenNebula Session for the given user
    # user_name:: _String_ the name of the user   
    def one_client_user(user_name)

        user = get_user(user_name)
 
        if !user
            error = OpenNebula::Error.new("User not found")
            return error
        end
    
        client = Client.new("dummy:dummy")
        client.one_auth = "#{user[:name]}:#{user[:password]}"
    
        return client
    end

    # Authenticates a user
    #
    def authenticate?(name, password)
        user = get_user(name)

        return user && user.password == password
    end

private
    def get_user(name)
        user = nil
    
        @user_pool.info
        @user_pool.each{ |u|
            if u.name==name
                user=Hash.new

                user[:id]       = u.id
                user[:name]     = u.name
                user[:password] = u[:password]
            end
        }
        return user
   end
end

