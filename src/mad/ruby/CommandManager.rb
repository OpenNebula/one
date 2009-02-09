
require 'pp'
require 'open3'

# Generic command executor that holds the code shared by all the command
# executors. Commands can have an associated callback that will be
# after they finish.
class GenericCommand
    attr_accessor :value, :code, :stdout, :stderr, :command
    attr_accessor :callback
    
    # Creates the new command:
    # +command+: string with the command to be executed
    def initialize(command, logger=nil)
        @command=command
        @logger=logger
        @callback=nil
    end
    
    def log(message)
        @logger.call(message) if @logger
    end
    
    # Runs the command and calls the callback if it is defined
    # +data+: variable to pass to the callaback to provide data
    # or to share with other callbacks
    def run(data=nil)
        
        log("About to execute #{command}")
        
        (@stdout, @stderr)=execute
        @code=get_exit_code(@stderr)
        
        log("Command executed, exit code: #{@code}")
        
        @callback.call(self, data) if @callback
        
        if @code!=0
            log("Command execution fail. STDERR follows.")
            log(@stderr)
        end
        
        return @code
    end
    
private

    # Gets exit code from STDERR
    def get_exit_code(str)
        tmp=str.scan(/^ExitCode: (\d*)$/)
        return nil if !tmp[0]
        tmp[0][0].to_i
    end
    
    # Low level command execution. This method has to be redefined
    # for each kind of command execution. Returns an array with
    # +stdout+ and +stderr+ of the command execution.
    def execute
        puts "About to execute \"#{@command}\""
        ["", "ExitCode: 0"]
    end
    
end

# Executes commands in the machine where it is called. See documentation
# for GenericCommand
class LocalCommand < GenericCommand
private

    def execute
        std=Open3.popen3(
            "#{command} ;"+
            " echo ExitCode: $? 1>&2")
        std[0].close if !std[0].closed?
            
        stdout=std[1].read
        std[1].close if !std[1].closed?

        stderr=std[2].read
        std[2].close if !std[2].closed?

        [stdout, stderr]
    end
end

# Executes commands in a remote machine ussing ssh. See documentation
# for GenericCommand
class SSHCommand < GenericCommand
    attr_accessor :host
    
    # This one takes another parameter. +host+ is the machine
    # where de command is going to be executed
    def initialize(command, host, logger=nil)
        @host=host
        super(command, logger)
    end
    
private

    def execute
        std=Open3.popen3(
            "ssh -n #{host} #{command} ;"+
            " echo ExitCode: $? 1>&2")
        std[0].close if !std[0].closed?
        
        stdout=std[1].read
        std[1].close if !std[1].closed?
        
        stderr=std[2].read
        std[2].close if !std[2].closed?
        
        [stdout, stderr]
    end
end


if $0 == __FILE__
    
    data={}
    
    command=GenericCommand.new("uname -a")
    command.callback=lambda {|obj,data|
        puts obj.stderr
        
        data[1]=[obj.command, obj.code]
    }
    
    command.run(data)
    
    local_command=LocalCommand.new("uname -a")
    local_command.callback=lambda {|obj,data|
        puts "STDOUT:"
        puts obj.stdout
        puts
        puts "STDERR:"
        puts obj.stderr
        
        data[2]=[obj.command, obj.code]
    }
    
    local_command.run(data)
    
    ssh_command=SSHCommand.new("uname -a", "localhost")
    ssh_command.callback=lambda {|obj,data|
        puts "STDOUT:"
        puts obj.stdout
        puts
        puts "STDERR:"
        puts obj.stderr
        
        data[3]=[obj.command, obj.host, obj.code]
    }
    
    ssh_command.run(data)
    
    pp data
end




