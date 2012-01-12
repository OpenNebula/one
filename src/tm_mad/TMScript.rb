
# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'pp'
require 'open3'
require 'CommandManager'

=begin rdoc

TMPlugin holds the name of the scripts that will be used for each
TransferManager script command. It is basically a hash where keys
are the names of the commands (uppercase) and contain the path of
the script that will be executed for that command.

It also contains some methods to execute the scripts, get the output
of the script (success/failure, error and log messages).

=end
class TMPlugin < Hash
    # If a +scripts_file+ is supplied commands are loaded from it.
    def initialize(scripts_file=nil)
        # Pass nil default value to hash initialization or it will use
        # scripts file as the default value if the key does not exist
        super(nil)
        load_scripts(scripts_file) if scripts_file
    end
   
    # Executes the script associated with the +command+ using
    # specified arguments. +logger+ is a proc that takes a message
    # as its unique argument.
    #
    # Returns:
    # * It will return +nil+ if the +command+ is not defined.
    # * LocalCommand object (exit code and
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

        local_command = LocalCommand.run(cmd, logger)

        logger.call(local_command.stdout) if logger

        local_command
    end
    
    private
    
    # Loads definitions of commands from the configuration file
    def load_scripts(scripts_file)
        scripts_text=""
        
        if File.exist?(scripts_file)
            scripts_text = File.read(scripts_file)
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
                command = $1.strip.upcase
                path    = $2.strip

                # Prepend default location for tm commands if the path does not
                # start with /
                path = tm_commands_location+path if path[0]!=?/
                
                self[command] = path
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
    # to OpenNebula server
    def initialize(script_text, logger=nil)
        @lines  = Array.new
        @logger = logger

        parse_script(script_text)
    end
    
    # Executes the script using the TMPlugin specified by +plugin+.
    # Returns an array where first element tells if succeded and the
    # second one is the error message in case of failure.
    def execute(plugin)
        return [true,""] if @lines.empty?
        
        result = @lines.each {|line|
            res = plugin.execute(@logger, *line)

            if !res
                @logger.call("COMMAND not found: #{line.join(" ")}.") if @logger

                res = [false, "COMMAND not found: #{line.join(" ")}."]
            else
                if res.code == 0
                    res = [true, ""]
                else
                    res = [false, res.get_error_message]
                end
            end

            # do not continue if command failed
            break res if !res[0]
        }
        
        result
    end
    
    private
    
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
end


if $0 == __FILE__

=begin
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
    
=end

    log_proc=lambda{|message|
        puts message
    }

    script_text="

    CLONE localhost:/tmp/source.img ursa:/tmp/one_jfontan/0/hda.img


    CLONE localhost:/tmp/source.img ursa:/tmp/one_jfontan/1/hda.img

    WRONG the program for WRONG does not exist
    ERROR a command not in plugin

    "

    plugin=TMPlugin.new
    plugin["OTHER"]="./tm_clone.sh"
    plugin["CLONE"]="echo"
    plugin["WRONG"]="it_does_not_exist"
 
    scr=TMScript.new(script_text, log_proc)
    pp scr.lines


    scr.execute(plugin)
end
