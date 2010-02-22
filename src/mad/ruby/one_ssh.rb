# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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

=begin rdoc

Here will be a description of SSH library and an example on
how to use it.

=end

require 'pp'
require 'open3'
require 'thread'
require 'ThreadScheduler'

# This class holds a command that will be executed on a remote host
# using ssh. Commands can have an associated callback that will be
# after they finish.
class SSHCommand
    attr_accessor :value, :code, :stdout, :stderr, :command
    attr_accessor :callback
    
    # Creates a new command
    def initialize(command)
        @command=command
        @callback=nil
    end
    
    # Runs the command on the specified host
    def run(host)
        (@stdout, @stderr)=execute(host, @command)
        @code=get_exit_code(@stderr)
    end
    
    # Executes callback associated to this command
    def exec_callback(num)
        if @callback
            @callback.call(self, num)
        end
    end
    
    #private
    
    # Gets exit code from STDERR
    def get_exit_code(str)
        tmp=str.scan(/^ExitCode: (\d*)$/)
        return nil if !tmp[0]
        tmp[0][0].to_i
    end
    
    # Executes a command in a remote machine
    def execute(host, command)
        std=exec_remote_command(host, command)
        [std[1].read, std[2].read]
    end
    
    # Low level local command execution
    def exec_local_command(command)
        std=Open3.popen3(
            "#{command} ;"+
            " echo ExitCode: $? 1>&2")
        [std[1].read, std[2].read]
    end
    
    # Low level remote command execution
    def exec_remote_command(host, command)
        Open3.popen3(
            "ssh -n #{host} #{command} ;"+
            " echo ExitCode: $? 1>&2")
    end
end

class SSHCommandList < Array
=begin
    def clone_actions
        new_array=Array.new
        self.each {|s|
            new_array << s.clone
        }
        new_array
    end
=end
end

# An action is composed by one or more SSHCommands that will be executed in an
# specific host. It holds a number that is the command identifier for a MAD.
class SSHAction
    attr_accessor :callback
    
    def initialize(number, host, actions)
        @number=number
        @host=host
        if actions.is_a?(SSHCommandList) || actions.is_a?(Array)
            @actions=clone_actions(actions)
        else
            @actions=SSHCommandList.new
            @actions<<actions
            # Really needed
            @actions=clone_actions(@actions)
        end
        @finished=false
        @callback=nil
    end
    
    def finished
        @finished
    end
    
    def run
        run_actions
        @finished=true
    end
    
    def run_actions
        @actions.each {|a|
            a.run(@host)
        }
    end
    
    def exec_callbacks
        @actions.each {|a|
            a.exec_callback(@number)
        }
        
        if @callback
            @callback.call(@actions, @number)
        end
    end
    
    private
    
    # Clone an array of sensors
    def clone_actions(actions)
        actions.collect{|a| a.clone }
    end
end

module SSHActionController
    
    def init_actions(num=10)
        @thread_scheduler=ThreadScheduler.new(num)
    end
    
    def send_ssh_action(action)
        @thread_scheduler.new_thread {
            action.run
            action.exec_callbacks
        }
    end
    
    def action_finalize(args)
        @thread_scheduler.shutdown
        super(args)
    end
end

=begin

EXAMPLE

def action_poll(args)
    action_name=args[0]
    action_number=args[1]
    action_host=args[2]
    action_dom=args[3]
    
    poll=SSHCommand.new("xm poll #{action_dom}")
    poll.callback = lambda {|a,num|
        if a.code==0
            STDOUT.puts("POLL #{num} SUCCESS #{a.stdout}")
        else
            STDOUT.puts("POLL #{num} FAILURE #{a.stderr}")
        end
        STDOUT.flush
    }
    
    cmd_list=SSHCommandList.new
    cmd_list<<poll
    
    poll_action=SSHAction.new(action_number, action_host, cmd_list)
    
    send_ssh_action(poll_action)
end

=end

