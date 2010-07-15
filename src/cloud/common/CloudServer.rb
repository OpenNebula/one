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
   
   def xml_to_hash(xml)
       begin
           hash = Crack::XML.parse(xml)
       rescue Exception => e
           error = OpenNebula::Error.new(e.message)
           return error
       end    
       
       return hash
   end
   
   def get_template_path(instance_type_name)
       if instance_type_name.nil?
           instance_type=@instance_types.first
       end
       
       instance_type=@instance_types[instance_type_name]
       
       if !instance_type
           error = OpenNebula::Error.new("Bad instance type")
           return error    
       end
       
       return @config[:template_location]+"/#{instance_type['TEMPLATE']}" 
   end

    ###########################################################################
    # Repository Methods
    ###########################################################################

    # Adds a new image to the repository and deletes the temp_file
    # uid:: _Integer_ owner of the image
    # path:: _String_ path of the tmp file
    # metadata:: Additional metadata for the file
    # [return] _Image_ Newly created image object
    def add_image(image, file=nil)
        if file
            if file[:tempfile]
                file_path = file[:tempfile].path
            else
                error_msg = "Image not present, aborting."
                error = OpenNebula::Error.new(error_msg)
                return error
            end
        
            if !File.exists?(file_path)
                error_msg = "Image file could not be found, aborting."
                error = OpenNebula::Error.new(error_msg)
                return error
            end
        end
            
        template = image.to_one_template

        rc = image.allocate(template)
        if OpenNebula.is_error?(rc)
           return rc
        end

        # Copy the Image file
        image.info
        template=image.to_hash
        template=template['IMAGE']['TEMPLATE']
        
        if file_path
            rc = image.copy(file_path, image['SOURCE'])
            file[:tempfile].unlink
        elsif template['SIZE'] and template['FSTYPE']
            rc = image.mk_datablock(
                    template['SIZE'], 
                    template['FSTYPE'], 
                    image['SOURCE'])
        end
        
        if OpenNebula.is_error?(rc)
           image.delete
           return rc
        end
 
        return nil
    end

    # Gets an image from the repository
    # image_id:: _Integer_ Image identifier
    # [return] _Image_ Image object
    def get_image(image_id)
        return nil
    end
end

