# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'opennebula'

##############################################################################
# This class represents a generic Cloud Server using the OpenNebula Cloud
# API (OCA). Any cloud implementation should derive from this class
##############################################################################
class CloudServer
    ##########################################################################
    # Class Constants. Define the OpenNebula Error and HTTP codes mapping
    ##########################################################################
    HTTP_ERROR_CODE = {
        OpenNebula::Error::EAUTHENTICATION => 401,
        OpenNebula::Error::EAUTHORIZATION  => 403,
        OpenNebula::Error::ENO_EXISTS      => 404,
        OpenNebula::Error::EACTION         => 500,
        OpenNebula::Error::EXML_RPC_API    => 500,
        OpenNebula::Error::EINTERNAL       => 500,
        OpenNebula::Error::ENOTDEFINED     => 500
    }

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
    def initialize(config, logger=nil)
        # --- Load the Cloud Server configuration file ---
        @config  = config
        @@logger = logger
    end

    def self.logger
        return @@logger
    end

    def logger
        return @@logger
    end

    #
    # Prints the configuration of the server
    #
    def self.print_configuration(config)
        puts "--------------------------------------"
        puts "         Server configuration         "
        puts "--------------------------------------"
        pp config
        puts "--------------------------------------"
        puts

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
end

module CloudLogger
    require 'logger'

    DEBUG_LEVEL = [
        Logger::ERROR, # 0
        Logger::WARN,  # 1
        Logger::INFO,  # 2
        Logger::DEBUG  # 3
    ]

    # Mon Feb 27 06:02:30 2012 [Clo] [E]: Error message example
    MSG_FORMAT  = %{%s [%s]: %s\n}

    # Mon Feb 27 06:02:30 2012
    DATE_FORMAT = "%a %b %d %H:%M:%S %Y"

    # Patch logger class to be compatible with Rack::CommonLogger
    class CloudLogger < Logger

        def initialize(path)
            super(path)
        end

        def write(msg)
            info msg.chop
        end

        def add(severity, message = nil, progname = nil, &block)
            rc = super(severity, message, progname, &block)
            @logdev.dev.flush

            rc
        end
    end

    def enable_logging(path=nil, debug_level=3)
        path ||= $stdout
        logger = CloudLogger.new(path)
        logger.level = DEBUG_LEVEL[debug_level]
        logger.formatter = proc do |severity, datetime, progname, msg|
            MSG_FORMAT % [
                datetime.strftime(DATE_FORMAT),
                severity[0..0],
                msg ]
        end

        # Add the logger instance to the Sinatra settings
        set :logger, logger

        # The logging will be configured in Rack, not in Sinatra
        disable :logging

        # Use the logger instance in the Rack  methods
        use Rack::CommonLogger, logger

        helpers do
            def logger
                settings.logger
            end
        end

        logger
    end
end
