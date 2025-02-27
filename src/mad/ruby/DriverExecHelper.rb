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

# This module provides an abstraction to generate an execution context for
# OpenNebula Drivers. The module has been designed to be included as part
# of a driver and not to be used standalone.
module DriverExecHelper

    # Action result strings for messages
    RESULT = {
        :success => 'SUCCESS',
        :failure => 'FAILURE'
    }

    # Log severity map to oned char log level
    SEVERITY_MAP = {
        'ERROR' => 'E',
        'INFO'  => 'I',
        'WARN'  => 'W',
        'DEBUG' => 'D'
    }

    def self.failed?(rc_str)
        rc_str == RESULT[:failure]
    end

    # Initialize module variables
    def initialize_helper(directory, options)
        @config = read_configuration
        @remote_scripts_base_path = @config['SCRIPTS_REMOTE_DIR']

        @local_actions = options[:local_actions]
        @per_drvr_local_actions = options[:per_drvr_local_actions] || []

        if ENV['ONE_LOCATION'].nil?
            @local_scripts_base_path = '/var/lib/one/remotes'
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
    # When action is a String starting with '/' it's considered alreay full
    # path command and no modification is performed apart from adding params.
    #
    # @param [String, Symbol] action name of the action
    # @param [String] parameters arguments for the script
    # @param [String, nil] default_name alternative name for the script
    # @param [String, ''] directory to append to the scripts path for actions
    # @return [String] command line needed to execute the action
    def action_command_line(action, parameters, default_name = nil, directory = '')
        if action.is_a?(String) && action[0] == '/'
            return action + ' ' + parameters if parameters

            return action
        elsif action_is_local?(action, directory)
            script_path=File.join(@local_scripts_path, directory)
        else
            script_path=File.join(@remote_scripts_path, directory)
        end

        File.join(script_path, action_script_name(action, default_name))+
            ' '+parameters
    end

    # True if the action is meant to be executed locally
    #
    # @param [String, Symbol] action name of the action
    # @param [String, Symbol] driver name
    def action_is_local?(action, driver = '')
        @local_actions.include? action.to_s.upcase if driver.empty?

        @local_actions.include? action.to_s.upcase or
            @per_drvr_local_actions.include? "#{driver}-#{action}"
    end

    # Name of the script file for the given action
    #
    # @param [String, Symbol] action name of the action
    # @param [String, nil] default_name alternative name for the script
    def action_script_name(action, default_name = nil)
        name=@local_actions[action.to_s.upcase]

        name || default_name || action.to_s.downcase
    end

    #
    #                METHODS FOR LOGS & COMMAND OUTPUT
    #
    # Sends a message to the OpenNebula core through stdout
    # rubocop:disable Metrics/ParameterLists
    def send_message(action = '-', result = RESULT[:failure], id = '-', info = '-')
        @send_mutex.synchronize do
            STDOUT.puts "#{action} #{result} #{id} #{info}"
            STDOUT.flush
        end
    end
    # rubocop:enable Metrics/ParameterLists

    # Sends a log message to ONE. The +message+ can be multiline, it will
    # be automatically splitted by lines.
    def log(number, message, all = true, options = {})
        msg = message.strip

        msg.each_line do |line|
            m = line.match(/^(ERROR|DEBUG|INFO):(.*)$/)

            if m
                severity = SEVERITY_MAP[m[1]]
                line     = m[2]
            elsif all
                severity = 'I'
            else
                severity = nil
            end

            line.strip!

            line = Zlib::Deflate.deflate(line, Zlib::BEST_COMPRESSION) if options[:compress]
            line = Base64.strict_encode64(line) if options[:encode]

            send_message('LOG', severity, number, line) if severity
        end
    end

    # Generates a proc with that calls log with a hardcoded number. It will
    # be used to add loging to command actions
    def log_method(num, options = {})
        lambda {|message, all = true|
            log(num, message, all, options)
        }
    end


    #This methods process the command output:
    #  - Log messages written to STDERR are sent to oned as LOG commands
    #  - In case of error, non log lines in STDERR are merged and returned as info
    #  - In case of success, STDOUT is returned as info
    #
    # TODO Review calls to method to encode/zip info as with LOG messages
    def get_info_from_execution(command_exe, opts = {})
        o = {
            :compress => false,
            :encode   => false
        }.merge(opts)

        err_info = ''

        command_exe.stderr.each_line do |line|
            line.strip!

            m = line.match(/^(ERROR|INFO|WARN|DEBUG):\s+(\d+)?\s*(.*)$/)
            if !m
                err_info << line
                next
            end

            sev = SEVERITY_MAP[m[1]]
            id  = begin
                Integer(m[2])
            rescue StandardError
                '-1'
            end

            msg = m[3].strip

            msg = Zlib::Deflate.deflate(msg, Zlib::BEST_COMPRESSION) if o[:compress]
            msg = Base64.strict_encode64(msg) if o[:encode]

            send_message('LOG', sev, id, msg)
        end

        if command_exe.code == 0
            result = RESULT[:success]
            info   = command_exe.stdout
        else
            result = RESULT[:failure]
            info   = err_info.tr("\n", ' ').strip
        end

        info = '-' if info.empty?

        [result, info]
    end

    #
    # Simple parser for the config file generated by OpenNebula
    def read_configuration
        one_config=nil

        if ENV['ONE_LOCATION']
            one_config = ENV['ONE_LOCATION']+'/var/config'
        else
            one_config = '/var/lib/one/config'
        end

        config = {}
        cfg    = ''

        begin
            File.open(one_config, 'r') do |file|
                cfg=file.read
            end

            cfg.split("\n").each do |line|
                m=line.match(/^([^=]+)=(.*)$/)

                next unless m

                name  = m[1].strip.upcase
                value = m[2].strip

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
        rescue StandardError => e
            STDERR.puts "Error reading config: #{e.inspect}"
            STDERR.flush
        end

        config
    end

end
