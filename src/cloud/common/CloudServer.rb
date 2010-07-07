# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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
require 'pp'

##############################################################################
# This class represents a generic Cloud Server using the OpenNebula Cloud
# API (OCA). Any cloud implementation should derive from this class
##############################################################################
class CloudServer

    ##########################################################################
    # Public attributes
    ##########################################################################
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
        
        @instance_types = Hash.new

        if @config[:vm_type].kind_of?(Array)
            @config[:vm_type].each {|type|
                @instance_types[type['NAME']]=type
            }
        else
            @instance_types[@config[:vm_type]['NAME']]=@config[:vm_type]
        end

        # --- Start a Repository Manager ---
    
        @rm = RepoManager.new(@config[:database])
        Image.image_dir = @config[:image_dir]

        # --- Start an OpenNebula Session ---
        
        @one_client = Client.new()
        @user_pool  = UserPool.new(@one_client)
    end

    #
    # Prints the configuration of the server
    #
    def print_configuration
        puts "--------------------------------------"
        puts "         Server configuration         "
        puts "--------------------------------------"
        pp @config

        puts "--------------------------------------"
        puts "      Registered Instance Types       "
        puts "--------------------------------------"
        pp @instance_types 
    end

    ###########################################################################
    # USER and OpenNebula Session Methods
    ###########################################################################

    # Generates an OpenNebula Session for the given user
    # user:: _Hash_ the user information  
    # [return] an OpenNebula client session 
    def one_client_user(user)
        client = Client.new("dummy:dummy")
        client.one_auth = "#{user[:name]}:#{user[:password]}"
    
        return client
    end

    # Authenticates a user
    # name:: _String_ of the user
    # password:: _String_ of the user
    # [return] true if authenticated    
    def authenticate?(name, password)
        user = get_user(name)

        return user && user.password == password
    end

    # Gets the data associated with a user
    # name:: _String_ the name of the user
    # [return] _Hash_ with the user data
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
   

    ###########################################################################
    # Repository Methods
    ###########################################################################

    # Adds a new image to the repository and deletes the temp_file
    # uid:: _Integer_ owner of the image
    # path:: _String_ path of the tmp file
    # metadata:: Additional metadata for the file
    # [return] _Image_ Newly created image object
    def add_image(uid, file, metadata={})
        image = @rm.add(uid,file.path,metadata)
        file.unlink

        return image
    end

    # Gets an image from the repository
    # image_id:: _Integer_ Image identifier
    # [return] _Image_ Image object
    def get_image(image_id)
        return @rm.get(image_id)
    end
end

