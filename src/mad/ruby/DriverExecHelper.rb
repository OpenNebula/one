# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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

# This module provides an abstraction to generate an execution context for
# OpenNebula Drivers. The module has been designed to be included as part
# of a driver and not to be used standalone.
module DriverExecHelper
    # Action result strings for messages
    RESULT = {
        :success => "SUCCESS",
        :failure => "FAILURE"
    }

    def self.failed?(rc_str)
        return rc_str == RESULT[:failure]
    end

    #Initialize module variables
    def initialize_helper(directory, options)
        @config = read_configuration
        @remote_scripts_base_path = @config['SCRIPTS_REMOTE_DIR']

        @local_actions = options[:local_actions]

        if ENV['ONE_LOCATION'] == nil
            @local_scripts_base_path = "/var/lib/one/remotes"
        else
            @local_scripts_base_path = "#{ENV['ONE_LOCATION']}/var/remotes"
        end

        # dummy paths
        @remote_scripts_path = File.join(@remote_scripts_base_path, directory)
        @local_scripts_path  = File.join(@local_scripts_base_path, directory)

        # mutex for logging
        @send_mutex = Mutex.new
    end

    #
    #                 METHODS FOR COMMAND LINE & ACTION PATHS
    #
    # Given the action name and the parameter returns full path of the script
    # and appends its parameters. It uses @local_actions hash to know if the
    # actions is remote or local. If the local actions has defined an special
    # script name this is used, otherwise the action name in downcase is
    # used as the script name.
    #
    # @param [String, Symbol] action name of the action
    # @param [String] parameters arguments for the script
    # @param [String, nil] default_name alternative name for the script
    # @param [String, ''] directory to append to the scripts path for actions
    # @return [String] command line needed to execute the action
    def action_command_line(action, parameters, default_name=nil, directory='')
        if action_is_local? action
            script_path=File.join(@local_scripts_path, directory)
        else
            script_path=File.join(@remote_scripts_path, directory)
        end

        File.join(script_path, action_script_name(action, default_name))+
            " "+parameters
    end

    # True if the action is meant to be executed locally
    #
    # @param [String, Symbol] action name of the action
    def action_is_local?(action)
        @local_actions.include? action.to_s.upcase
    end

    # Name of the script file for the given action
    #
    # @param [String, Symbol] action name of the action
    # @param [String, nil] default_name alternative name for the script
    def action_script_name(action, default_name=nil)
        name=@local_actions[action.to_s.upcase]

        if name
            name
        else
            default_name || action.to_s.downcase
        end
    end

    #
    #                METHODS FOR LOGS & COMMAND OUTPUT
    #
    # Sends a message to the OpenNebula core through stdout
    def send_message(action="-", result=RESULT[:failure], id="-", info="-")
        @send_mutex.synchronize {
            STDOUT.puts "#{action} #{result} #{id} #{info}"
            STDOUT.flush
        }
    end

    # Sends a log message to ONE. The +message+ can be multiline, it will
    # be automatically splitted by lines.
    def log(number, message)
        in_error_message=false
        msg=message.strip
        msg.each_line {|line|
            severity='I'

            l=line.strip

            if l=='ERROR MESSAGE --8<------'
                in_error_message=true
                next
            elsif l=='ERROR MESSAGE ------>8--'
                in_error_message=false
                next
            else
                if in_error_message
                    severity='E'
                elsif line.match(/^(ERROR|DEBUG|INFO):(.*)$/)
                    line=$2
                    case $1
                    when 'ERROR'
                        severity='E'
                    when 'DEBUG'
                        severity='D'
                    when 'INFO'
                        severity='I'
                    else
                        severity='I'
                    end
                end
            end

            send_message("LOG", severity, number, line.strip)
        }
    end

    # Generates a proc with that calls log with a hardcoded number. It will
    # be used to add loging to command actions
    def log_method(num)
        lambda {|message|
            log(num, message)
        }
    end

    #This method returns the result in terms
    def get_info_from_execution(command_exe)
        if command_exe.code == 0
            result = RESULT[:success]
            info   = command_exe.stdout
        else
            result = RESULT[:failure]
            info   = command_exe.get_error_message
        end

        info = "-" if info == nil || info.empty?

        [result, info]
    end

    #
    #
    # Simple parser for the config file generated by OpenNebula
    def read_configuration
        one_config=nil

        if ENV['ONE_LOCATION']
            one_config = ENV['ONE_LOCATION']+'/var/config'
        else
            one_config = '/var/lib/one/config'
        end

        config=Hash.new
        cfg=''

        begin
            open(one_config) do |file|
                cfg=file.read
            end

            cfg.split(/\n/).each do |line|
                m=line.match(/^([^=]+)=(.*)$/)

                if m
                    name=m[1].strip.upcase
                    value=m[2].strip

                    if config[name]
                        if config[name].instance_of? Array
                            config[name] << value
                        else
                            config[name] = [config[name], value]
                        end
                    else
                        config[name]=value
                    end
                end
            end
        rescue Exception => e
            STDERR.puts "Error reading config: #{e.inspect}"
            STDERR.flush
        end

        config
    end
end
