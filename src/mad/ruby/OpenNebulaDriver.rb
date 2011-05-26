# -------------------------------------------------------------------------- */
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    */
# not use this file except in compliance with the License. You may obtain    */
# a copy of the License at                                                   */
#                                                                            */
# http://www.apache.org/licenses/LICENSE-2.0                                 */
#                                                                            */
# Unless required by applicable law or agreed to in writing, software        */
# distributed under the License is distributed on an "AS IS" BASIS,          */
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
# See the License for the specific language governing permissions and        */
# limitations under the License.                                             */
# -------------------------------------------------------------------------- */

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
# with the action name through the register_action func

class OpenNebulaDriver < ActionManager
    # This function parses a string with this form:
    #
    #   'deploy,shutdown,poll=poll_ganglia, cancel '
    #
    # and returns a hash:
    #
    #   {"POLL"=>"poll_ganglia", "DEPLOY"=>nil, "SHUTDOWN"=>nil,
    #       "CANCEL"=>nil}
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

    RESULT = {
        :success => "SUCCESS",
        :failure => "FAILURE"
    }

    def initialize(concurrency=10, threaded=true, retries=0,
                directory='subsystem', local_actions={})
        super(concurrency, threaded)

        @retries = retries
        @send_mutex=Mutex.new
        @local_actions=local_actions

        # set default values
        @config = read_configuration
        @remote_scripts_base_path=@config['SCRIPTS_REMOTE_DIR']
        if ONE_LOCATION == nil
            @local_scripts_base_path = "/var/lib/one/remotes"
        else
            @local_scripts_base_path = "#{ENV['ONE_LOCATION']}/var/remotes"
        end

        # dummy paths
        @remote_scripts_path=File.join(@remote_scripts_base_path, directory)
        @local_scripts_path=File.join(@local_scripts_base_path, directory)

        register_action(:INIT, method("init"))
    end

    # -------------------------------------------------------------------------
    # Sends a message to the OpenNebula core through stdout
    # -------------------------------------------------------------------------
    def send_message(action="-", result=RESULT[:failure], id="-", info="-")
        @send_mutex.synchronize {
            STDOUT.puts "#{action} #{result} #{id} #{info}"
            STDOUT.flush
        }
    end

    # -------------------------------------------------------------------------
    # Calls remotes or local action checking the action name and @local_actions
    # -------------------------------------------------------------------------
    def do_action(parameters, id, host, aname, std_in=nil)
        command=action_command_line(aname, parameters)

        if @local_actions.include? aname.to_s.upcase
            local_action(command, id, aname)
        else
            remotes_action(command, id, host, aname, @remote_scripts_path,
                std_in)
        end
    end

    # Given the action name and the parameter returns full path of the script
    # and appends its parameters. It uses @local_actions hash to know if the
    # actions is remote or local. If the local actions has defined an special
    # script name this is used, otherwise the action name in downcase is
    # used as the script name.
    def action_command_line(action, parameters)
        action_name=action.to_s.upcase
        action_script=action.to_s.downcase

        if @local_actions.include? action_name
            if @local_actions[action_name]
                action_script=@local_actions[action_name]
            end
            action_script_path=File.join(@local_scripts_path, action_script)
        else
            action_script_path=File.join(@remote_scripts_path, action_script)
        end

        action_script_path+" "+parameters
    end

    # True if the action is meant to be executed locally
    def action_is_local?(action)
        @local_actions.include? action.to_s.upcase
    end

    # Name of the script file for the given action
    def action_script_name(action)
        name=@local_actions[action.to_s.upcase]

        if name
            name
        else
            action.to_s.downcase
        end
    end

    # -------------------------------------------------------------------------
    # Execute a command associated to an action and id in a remote host.
    # -------------------------------------------------------------------------
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

    # -------------------------------------------------------------------------
    # Execute a command associated to an action and id on localhost
    # -------------------------------------------------------------------------
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

    # -------------------------------------------------------------------------
    # Sends a log message to ONE. The +message+ can be multiline, it will
    # be automatically splitted by lines.
    # -------------------------------------------------------------------------
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

    # -------------------------------------------------------------------------
    # Generates a proc with that calls log with a hardcoded number. It will
    # be used to add loging to command actions
    # -------------------------------------------------------------------------
    def log_method(num)
        lambda {|message|
            log(num, message)
        }
    end

    # -------------------------------------------------------------------------
    # Start the driver. Reads from STDIN and executes methods associated with
    # the messages
    # -------------------------------------------------------------------------
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
end

# -------------------------------------------------------------------------
# -------------------------------------------------------------------------
# -------------------------------------------------------------------------
# -------------------------------------------------------------------------
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
