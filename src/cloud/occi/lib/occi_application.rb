# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'CloudServer'

class OCCIApplication
    #Configuration constants
    OCCI_AUTH  = VAR_LOCATION + "/.one/occi_auth"
    OCCI_LOG   = LOG_LOCATION + "/occi-server.log"
    CONF_FILE  = ETC_LOCATION + "/occi-server.conf"

    TEMPLATE_LOCATION  = ETC_LOCATION + "/occi_templates"

    #Attribute accesors
    attr_reader :conf
    attr_reader :logger
    attr_reader :cloud_auth

    def initialize()
        begin
            load_configuration

            init_logger

            init_auth

            if CloudServer.is_port_open?(@conf[:host], @conf[:port])
                raise "Port #{@conf[:port]} busy."
            end
        rescue
            raise
        end
    end

    def new_occi_server(username)
        OCCIServer.new(@cloud_auth.client(username), @conf, @logger)
    end

    private

    # Load the configuration for the OCCI Server
    def load_configuration
        begin
            @conf = YAML.load_file(CONFIGURATION_FILE)
        rescue Exception => e
            raise "Error parsing file #{CONFIGURATION_FILE}: #{e.message}"
        end

        @conf[:template_location] = TEMPLATE_LOCATION
        @conf[:debug_level]     ||= 3

        CloudServer.print_configuration(@conf)
    end

    #Initialize the log system
    def init_logger
        @logger = CloudLogger::CloudLogger.new(OCCI_LOG)

        @logger.level     = CloudLogger::DEBUG_LEVEL[@conf[:debug_level].to_i]
        @logger.formatter = proc do |severity, datetime, progname, msg|
             CloudLogger::MSG_FORMAT % [
                datetime.strftime( CloudLogger::DATE_FORMAT),
                severity[0..0],
                msg ]
        end
    end

    #Initialize the auth system
    def init_auth
        begin
            ENV["ONE_CIPHER_AUTH"] = OCCI_AUTH
            @cloud_auth = CloudAuth.new(@conf, @logger)
        rescue => e
            raise "Error initializing authentication system:  #{e.message}"
        end
    end
end
