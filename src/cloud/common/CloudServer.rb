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

        if @config[:vm_type] == nil
            raise "No VM_TYPE defined."
        end

        @instance_types = Hash.new

        if @config[:vm_type].kind_of?(Array)
            @config[:vm_type].each {|type|
                @instance_types[type['NAME']]=type
            }
        else
            @instance_types[@config[:vm_type]['NAME']]=@config[:vm_type]
        end

        # --- Start an OpenNebula Session ---

        @one_client = Client.new(nil,@config[:one_xmlrpc])
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
    def one_client_user(name, password)
        client = Client.new("dummy:dummy")
	if name=="dummy"
	#STDERR.puts "#{password}"
            client.one_auth = "#{password}"	
	else
            client.one_auth = "#{name}:#{password}"
	end

        return client
    end

    # Gets the data associated with a user
    # name:: _String_ the name of the user
    # [return] _Hash_ with the user data
    def get_user_password(name)
        @user_pool.info
        return @user_pool["USER[NAME=\"#{name}\"]/PASSWORD"]
    end

    # Gets the username associated with a password
    # password:: _String_ the password
    # [return] _Hash_ with the username
    def get_username(password)
        @user_pool.info
	#STDERR.puts 'the password is ' + password
	#STDERR.puts @user_pool["User[PASSWORD=\"#{password}\"]"]
	username = @user_pool["User[PASSWORD=\"#{password}\"]/NAME"]
	return username if (username != nil)
	 
	# Check if the DN is part of a |-separted multi-DN password
	user_elts = Array.new
	@user_pool.each {|e| user_elts << e['PASSWORD']}
	multiple_users = user_elts.select {|e| e=~ /\|/ }
	matched = nil
	multiple_users.each do |e|
	   e.to_s.split('|').each do |w|
	       if (w == password)
	           matched=e
		   break
	       end
	   end
	   break if matched
	end
	if matched
	    password = matched.to_s
	end
	puts("The password is " + password)
        return @user_pool["USER[PASSWORD=\"#{password}\"]/NAME"]
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

