# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

module OpenNebula

    # Generic log function
    def self.log_function(severity, message)
        STDERR.puts "#{severity}: #{File.basename $0}: #{message}"
    end
	
    # Logs an info message
    def self.log_info(message)
        log_function("INFO", message)
    end

    # Logs an error message
    def self.log_error(message)
        log_function("ERROR", message)
    end

    # Logs a debug message
    def self.log_debug(message)
        log_function("DEBUG", message)
    end

    # Alias log to log_info in the singleton class
    class << self
        alias :log :log_info
    end

    # This function is used to pass error message to the mad
    def self.error_message(message)
        STDERR.puts format_error_message(message)
    end

    #This function formats an error message for OpenNebula
    def self.format_error_message(message)
        error_str = "ERROR MESSAGE --8<------\n"
        error_str << message
        error_str << "\nERROR MESSAGE ------>8--"
        
        return error_str
    end
     
    # Executes a command, if it fails returns error message and exits
    # If a second parameter is present it is used as the error message when
    # the command fails
    def self.exec_and_log(command, message=nil)
        output=`#{command} 2>&1 1>/dev/null`
        code=$?.exitstatus

        if code!=0
            log_error "Command \"#{command}\" failed."
            log_error output
            if !message
                error_message output
            else
                error_message message
            end
            exit code
        end
        log "Executed \"#{command}\"."
    end

end
