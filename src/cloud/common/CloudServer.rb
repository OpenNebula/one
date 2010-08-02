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
        @img_repo = OpenNebula::ImageRepository.new
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
    def one_client_user(name, password)
        client = Client.new("dummy:dummy")
        client.one_auth = "#{name}:#{password}"

        return client
    end

    # Gets the data associated with a user
    # name:: _String_ the name of the user
    # [return] _Hash_ with the user data
    def get_user_password(name)
        @user_pool.info
        return @user_pool["USER[NAME=\"#{name}\"]/PASSWORD"]
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
                template = image.to_one_template
                template << "\nPATH = #{file_path}"
            else
                error_msg = "Image not present, aborting."
                error = OpenNebula::Error.new(error_msg)
                return error
            end
        end

        rc = @img_repo.create(image, template)

        file[:tempfile].unlink
        
        if OpenNebula.is_error?(rc)
           return rc
        end

        return nil
    end

    # Finds out if a port is available on ip
    # ip:: _String_ IP address where the port to check is
    # port:: _String_ port to find out whether is open 
    # [return] _Boolean_ Newly created image object    
    def self.is_port_open?(ip, port)
      begin
        Timeout::timeout(2) do
          begin
            s = TCPSocket.new(ip, port)
            s.close
            return true
          rescue Errno::ECONNREFUSED, Errno::EHOSTUNREACH
            return false
          end
        end
      rescue Timeout::Error
      end

      return false
    end
end

