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

require "ActionManager"
require "CommandManager"

# Author:: dsa-research.org
# Copyright:: (c) OpenNebula Project Leads (OpenNebula.org)
# License:: Apache License

# This class provides basic messaging and logging functionality
# to implement OpenNebula Drivers. A driver is a program that
# specialize the OpenNebula behavior by interfacing with specific
# infrastructure functionalities.
#
# A Driver inherits this class and only has to provide methods
# for each action it wants to receive. The method must be associated
# with the action name through the register_action function
class OpenNebulaDriver < ActionManager
    # @return [String] Base path for scripts
    attr_reader :local_scripts_base_path, :remote_scripts_base_path
    # @return [String] Path for scripts
    attr_reader :local_scripts_path, :remote_scripts_path

    # This function parses a string with this form:
    #
    #   'deploy,shutdown,poll=poll_ganglia, cancel '
    #
    # and returns a hash:
    #
    #   {"POLL"=>"poll_ganglia", "DEPLOY"=>nil, "SHUTDOWN"=>nil,
    #     "CANCEL"=>nil}
    #
    # @param [String] str imput string to parse
    # @return [Hash] parsed actions
    def self.parse_actions_list(str)
        actions=Hash.new
        str_splitted=str.split(/\s*,\s*/).map {|s| s.strip }

        str_splitted.each do |a|
            m=a.match(/([^=]+)(=(.*))?/)
            next if !m

            action=m[1].upcase

            if m[2]
                script=m[3]
                script.strip! if script
            else
                script=nil
            end

            actions[action]=script
        end

        actions
    end

    # Action result strings for messages
    RESULT = {
        :success => "SUCCESS",
        :failure => "FAILURE"
    }

    # Initialize OpenNebulaDriver object
    #
    # @param [String] directory path inside the remotes directory where the
    #   scripts are located
    # @param [Hash] options named options to change the object's behaviour
    # @option options [Number] :concurrency (10) max number of threads
    # @option options [Boolean] :threaded (true) enables or disables threads
    # @option options [Number] :retries (0) number of retries to copy scripts
    #   to the remote host
    # @option options [Hash] :local_actions ({}) hash with the actions
    #   executed locally and the name of the script if it differs from the
    #   default one. This hash can be constructed using {parse_actions_list}
    def initialize(directory, options={})
        @options={
            :concurrency => 10,
            :threaded => true,
            :retries => 0,
            :local_actions => {}
        }.merge!(options)

        super(@options[:concurrency], @options[:threaded])

        @retries = @options[:retries]
        @send_mutex=Mutex.new
        @local_actions=@options[:local_actions]

        # set default values
        @config = read_configuration
        @remote_scripts_base_path=@config['SCRIPTS_REMOTE_DIR']
        if ENV['ONE_LOCATION'] == nil
            @local_scripts_base_path = "/var/lib/one/remotes"
        else
            @local_scripts_base_path = "#{ENV['ONE_LOCATION']}/var/remotes"
        end

        # dummy paths
        @remote_scripts_path=File.join(@remote_scripts_base_path, directory)
        @local_scripts_path=File.join(@local_scripts_base_path, directory)

        register_action(:INIT, method("init"))
    end

    # Sends a message to the OpenNebula core through stdout
    def send_message(action="-", result=RESULT[:failure], id="-", info="-")
        @send_mutex.synchronize {
            STDOUT.puts "#{action} #{result} #{id} #{info}"
            STDOUT.flush
        }
    end

    # Calls remotes or local action checking the action name and
    # @local_actions. Optional arguments can be specified as a hash
    #
    # @param [String] parameters arguments passed to the script
    # @param [Number, String] id action identifier
    # @param [String] host hostname where the action is going to be executed
    # @param [String, Symbol] aname name of the action
    # @param [Hash] ops extra options for the command
    # @option ops [String] :stdin text to be writen to stdin
    # @option ops [String] :script_name default script name for the action,
    #   action name is used by defaults
    def do_action(parameters, id, host, aname, ops={})
        options={
            :stdin => nil,
            :script_name => nil
        }.merge(ops)

        params=parameters+" #{id} #{host}"

        command=action_command_line(aname, params, options[:script_name])

        if action_is_local? aname
            local_action(command, id, aname)
        else
            remotes_action(command, id, host, aname, @remote_scripts_path,
                options[:stdin])
        end
    end

    # Given the action name and the parameter returns full path of the script
    # and appends its parameters. It uses @local_actions hash to know if the
    # actions is remote or local. If the local actions has defined an special
    # script name this is used, otherwise the action name in downcase is
    # used as the script name.
    #
    # @param [String, Symbol] action name of the action
    # @param [String] parameters arguments for the script
    # @param [String, nil] default_name alternative name for the script
    # @return [String] command line needed to execute the action
    def action_command_line(action, parameters, default_name=nil)
        if action_is_local? action
            script_path=@local_scripts_path
        else
            script_path=@remote_scripts_path
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

    # Execute a command associated to an action and id in a remote host.
    #
    # @param [String] command command line to execute the script
    # @param [Number, String] id action identifier
    # @param [String] host hostname where the action is going to be executed
    # @param [String, Symbol] aname name of the action
    # @param [String] remote_dir path where the remotes reside
    # @param [String, nil] std_in input of the string from the STDIN
    def remotes_action(command, id, host, aname, remote_dir, std_in=nil)
        command_exe = RemotesCommand.run(command,
                                         host,
                                         remote_dir,
                                         log_method(id),
                                         std_in,
                                         @retries)
        if command_exe.code == 0
            result = RESULT[:success]
            info   = command_exe.stdout
        else
            result = RESULT[:failure]
            info   = command_exe.get_error_message
        end

        info = "-" if info == nil || info.empty?

        send_message(aname,result,id,info)
    end

    # Execute a command associated to an action and id on localhost
    #
    # @param [String] command command line to execute the script
    # @param [Number, String] id action identifier
    # @param [String, Symbol] aname name of the action
    def local_action(command, id, aname)
        command_exe = LocalCommand.run(command, log_method(id))

        if command_exe.code == 0
            result = RESULT[:success]
            info   = command_exe.stdout
        else
            result = RESULT[:failure]
            info   = command_exe.get_error_message
        end

        info = "-" if info == nil || info.empty?

        send_message(aname,result,id,info)
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

    # Start the driver. Reads from STDIN and executes methods associated with
    # the messages
    def start_driver
        loop_thread = Thread.new { loop }
        start_listener
        loop_thread.kill
    end

private

    def init
        send_message("INIT",RESULT[:success])
    end

    def loop
        while true
            exit(-1) if STDIN.eof?

            str=STDIN.gets
            next if !str

            args   = str.split(/\s+/)
            next if args.length == 0

            action = args.shift.upcase.to_sym

            if (args.length == 0) || (!args[0])
                action_id = 0
            else
                action_id = args[0].to_i
            end

            if action == :DRIVER_CANCEL
                cancel_action(action_id)
                log(action_id,"Driver command for #{action_id} cancelled")
            else
                trigger_action(action,action_id,*args)
            end
        end
    end

    def read_configuration
        one_config=nil

        if ENV['ONE_LOCATION']
            one_config=ENV['ONE_LOCATION']+'/var/config'
        else
            one_config='/var/lib/one/config'
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
                    config[name]=value
                end
            end
        rescue Exception => e
            STDERR.puts "Error reading config: #{e.inspect}"
            STDERR.flush
        end

        config
    end
end

################################################################
################################################################

if __FILE__ == $0

    class SampleDriver < OpenNebulaDriver
        def initialize
            super(15,true)

            register_action(:SLEEP,method("my_sleep"))
        end

        def my_sleep(num, timeout)
            log(num,"Sleeping #{timeout} seconds")
            sleep(timeout.to_i)
            log(num,"Done with #{num}")

            send_message("SLEEP",RESULT[:success],num.to_s)
        end
    end

    sd = SampleDriver.new
    sd.start_driver
end
