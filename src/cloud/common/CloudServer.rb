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

require 'OpenNebula'
require 'CloudAuth'

##############################################################################
# This class represents a generic Cloud Server using the OpenNebula Cloud
# API (OCA). Any cloud implementation should derive from this class
##############################################################################
class CloudServer

    ##########################################################################
    # Public attributes
    ##########################################################################
    attr_reader :config

    # Initializes the Cloud server based on a config file
    # config_file:: _String_ for the server. MUST include the following
    # variables:
    #   AUTH
    #   VM_TYPE
    #   XMLRPC
    def initialize(config)
        # --- Load the Cloud Server configuration file ---
        @config = config
        @cloud_auth = CloudAuth.new(@config)
    end

    def authenticate(env, params={})
        @cloud_auth.auth(env, params)
    end

    def client
        @cloud_auth.client
    end

    #
    # Prints the configuration of the server
    #
    def self.print_configuration(config)
        puts "--------------------------------------"
        puts "         Server configuration         "
        puts "--------------------------------------"
        pp config

        STDOUT.flush
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

    def self.get_instance_types(config)
        if config[:vm_type] == nil
            raise "No VM_TYPE defined."
        end

        instance_types = Hash.new

        if config[:vm_type].kind_of?(Array)
            config[:vm_type].each {|type|
                instance_types[type['NAME']]=type
            }
        else
            instance_types[config[:vm_type]['NAME']]=config[:vm_type]
        end

        instance_types
    end
end
