# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

require 'English'
require 'shellwords'

module OpenNebula

    # Functions for uniform driver logging
    module DriverLogger

        ############################################################################
        ## Logging: split by severity, intended for developers/admins or to be
        ## parsed by machines (e.g., log files at /var/log/one).

        # Generic log function
        def self.log_function(severity, message)
            lines = message.lines.map {|l| "#{severity}: #{File.basename $PROGRAM_NAME}: #{l}" }
            STDERR.puts lines.join
        end

        # Logs an info message
        def self.log_info(message)
            log_function('INFO', message)
        end

        # Logs an info message
        def self.log_warning(message)
            log_function('WARNING', message)
        end

        # Logs an error message
        def self.log_error(message)
            log_function('ERROR', message)
        end

        # Logs a debug message
        def self.log_debug(message)
            log_function('DEBUG', message)
        end

        # Alias log to log_info in the singleton class
        class << self

            alias log log_info

        end

        ############################################################################
        ## Reporting: messages intended to be shown to the end user, for example
        ## via the user template's ERROR attribute.

        def self.report(message)
            STDERR.puts message
        end

    end

end
