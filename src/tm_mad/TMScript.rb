
require 'pp'
require 'open3'
require 'ftools'

=begin rdoc

TMPlugin holds the name of the scripts that will be used for each
TransferManager script command. It is basically a hash where keys
are the names of the commands (uppercase) and contain the path of
the script that will be executed for that command.

It also contains some methods to execute the scripts, get the output
of the script (success/failure, error and log messages). The protocol
for scripts to do so is as follows:

* Log messages will be sent to STDOUT
* The script will return 0 if it succeded or any other value
  if there was a failure
* In case of failure the cause of the error will be written to STDERR
  wrapped by start and end marks as follows:

    ERROR MESSAGE --8<------
    error message for the failure
    ERROR MESSAGE ------>8--

=end
class TMPlugin < Hash
    # If a +scripts_file+ is supplied commands are loaded from it.
    def initialize(scripts_file=nil)
        super
        load_scripts(scripts_file) if scripts_file
    end
    
    # Sets the script path for the specific +command+
    def set(command, script)
        self[command]=script
    end
    
    # Executes the script associated with the +command+ using
    # specified arguments. +logger+ is a proc that takes a message
    # as its unique argument.
    #
    # Returns:
    # * It will return +nil+ if the +command+ is not defined.
    # * String with stderr output of the string (exit code and
    #   error message in case of failure)
    #
    # Note: the exit code will be written like this:
    #   ExitCode: 0
    def execute(logger, command, *args)
        # Command is not defined
        return nil if !self[command]
        
        # Generates the line to call the script with all the
        # arguments provided.
        cmd=[self[command], *args].join(" ")
        exec_local_command(cmd, logger)
    end
    
    private
    
    # Executes the command, get its exit code and logs every line that
    # comes from stdout. Returns whatever came from stderr.
    def exec_local_command(command, logger)
        cmd="#{command} ; echo ExitCode: $? 1>&2"
        stderr=""
        std=Open3.popen3(cmd) {|stdin, stdout, stderr_|
            # TODO: this should be sent to ONE and not to STDERR
            while !stdout.eof?
                log(stdout.readline, logger)
            end
            stderr_.read
        }
    end
    
    # Uses +logger+ to send +message+ to ONE
    def log(message, logger=nil)
        return nil if !logger
        
        logger.call(message)
    end
    
    def load_scripts(scripts_file)
        scripts_text=""
        
        if File.exist?(scripts_file)
            scripts_text=open(scripts_file).read
        else
            STDERR.puts("Can not open #{scripts_file}")
            STDERR.flush
            return
        end
        
        one_location=ENV['ONE_LOCATION']

        if one_location == nil 
            tm_commands_location = "/usr/lib/one/tm_commands/"
        else
            tm_commands_location = one_location + "/lib/tm_commands/"
        end
        
        scripts_text.each_line {|line|
            case line
            when /^\s*(#.*)?$/
                # skip empty or commented lines
                next
            when /^\s*(\w+)\s*=\s*(.*)\s*$/
                command=$1.strip.upcase
                path=$2.strip

                # Prepend default location for tm commands if the path does not
                # start with /
                path=tm_commands_location+path if path[0]!=?/
                
                self[command]=path
            else
                STDERR.puts("Can not parse line: #{line}")
            end
        }
    end
end

# This class will parse and execute TransferManager scripts.
class TMScript
    attr_accessor :lines
    
    # +script_text+ contains the script to be executed.
    # +logger+ is a lambda that receives a message and sends it
    # to ONE server
    def initialize(script_text, logger=nil)
        @lines=Array.new
        @logger=logger
        parse_script(script_text)
    end
    
    # Executes the script using the TMPlugin specified by +plugin+.
    # Returns an array where first element tells if succeded and the
    # second one is the error message in case of failure.
    def execute(plugin)
        result=@lines.each {|line|
            res=plugin.execute(@logger, *line)
            if !res
                log "COMMAND not found for: #{line.join(" ")}."
                res=[false, "COMMAND not found for: #{line.join(" ")}."]
            else
                res=parse_output(res)
            end
            
            # do not continue if command failed
            break res if !res[0]
        }
        
        result
    end
    
    private
    
    # Sends a log +message+ to ONE using +@logger+
    def log(message)
        @logger.call(message) if @logger
    end
    
    # Gets commands from the script and populates +@lines+
    def parse_script(script_text)
        script_text.each_line {|line|
            # skip if the line is commented
            next if line.match(/^\s*#/)
            # skip if the line is empty
            next if line.match(/^\s*$/)
            
            command=line.split(" ")
            command[0].upcase!
            @lines<< command
        }
    end
    
    # Gets exit code and error message (if failed) from
    # +stderr+
    def parse_output(err)
        exit_code=get_exit_code(err)
        if exit_code==0
            [true, ""]
        else
            [false, get_error_message(err)]
        end
    end
    
    # Gets exit code from STDERR
    def get_exit_code(str)
        tmp=str.scan(/^ExitCode: (\d*)$/)
        return nil if !tmp[0]
        tmp[0][0].to_i
    end
    
    # Parses error message from +stderr+ output
    def get_error_message(str)
        tmp=str.scan(/^ERROR MESSAGE --8<------\n(.*?)ERROR MESSAGE ------>8--$/m)
        return "Error message not available" if !tmp[0]
        tmp[0][0].strip
    end
end


if $0 == __FILE__
    require 'one_log'
    
    logger=ONELog.new
    
    log_proc=lambda{|message|
        logger.log("TRANSFER", "0", message)
    }
    
    log_proc.call(<<-EOT)
        Multiple
        lines log
        
        thingy
    EOT
    
    
    script_text="

    CLONE localhost:/tmp/source.img ursa:/tmp/one_jfontan/0/hda.img


    CLONE localhost:/tmp/source.img ursa:/tmp/one_jfontan/1/hda.img

    "

    plugin=TMPlugin.new
    plugin["CLONE"]="./tm_clone.sh"

    scr=TMScript.new(script_text, log_proc)
    pp scr.lines


    scr.execute(plugin)
end
