
require 'pp'
require 'open3'
require 'thread'


class SSHCommand
    attr_accessor :value, :code, :stdout, :stderr, :command
    attr_accessor :callback
    
    def initialize(command)
        @command=command
    end
    
    def run(host)
        (@stdout, @stderr)=execute(host, @command)
        @code=get_exit_code(@stderr)
    end
    
    def exec_callback(num)
        @callback.call(self, num) if @callback
    end
    
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
    def clone_actions
        new_array=Array.new
        self.each {|s|
            new_array << s.clone
        }
        new_array
    end
end

class SSHAction
    attr_accessor :callback
    
    def initialize(number, host, actions)
        @number=number
        @host=host
        if actions.is_a? SSHCommandList
            @actions=clone_actions(actions)
        else
            @actions=SSHCommandList.new
            @actions<<actions
            # Really needed
            @actions=clone_actions(@actions)
        end
        @finished=false
    end
    
    def finished
        @finished
    end
    
    def run
        @thread=Thread.new {
            run_actions
            @finished=true
        }   
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
        
        @callback.call(@actions, @number) if @callback
    end
    
    
    # Clone an array of sensors
    def clone_actions(actions)
        actions.collect{|a| a.clone }
    end
end

module SSHActionController
    
    def init_actions
        @actions=Array.new
        @action_mutex=Mutex.new
        start_action_thread
    end
    
    def send_ssh_action(number, host, action)
        @action_mutex.lock
        action.run
        @actions << action
        @action_mutex.unlock
    end
    
    def start_action_thread
        @action_thread=Thread.new {
            while true
                @action_mutex.lock
                done=@actions.select{|a| a.finished }
                @action_mutex.unlock

                if done.length>0
                    done.each{|a|
                        #STDOUT.puts a.get_result
                        #STDOUT.flush
                        a.exec_callbacks
                    }

                    @action_mutex.lock
                    @actions-=done
                    @action_mutex.unlock
                end
                sleep(1)
            end
        }
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