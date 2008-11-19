# --------------------------------------------------------------------------
# Copyright 2002-2008 GridWay Team, Distributed Systems Architecture
# Group, Universidad Complutense de Madrid
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# --------------------------------------------------------------------------

require "thread"

# Author:: dsa-research.org
# Copyright:: (c) 2007 Universidad Computense de Madrid
# License:: Apache License

# This class provides basic messaging and logging functionality.
#
# A MAD inherits this class and only has to provide methods
# for each action it wants to receive. This methods will be
# named action_<name_of_the_action>. For example a method that
# handles INIT message should be like this:
#
#   def action_init(args)
#     call_some_function(args[2], args[3])
#     send_message("INIT", "SUCCESS")
#   end


class ONEMad
    
    ##
    #  Debug constants
    ##
    ERROR, DEBUG=[0,1]

    
    # * +num_params_in+: number of parameters that mensages will have
    # * +num_params_out+: number of parameters that mensages sent back
    #   will have
    def initialize(num_params_in, num_params_out=nil)
        @num_params=num_params_in
        if !num_params_out
            @num_params_out=num_params_in
        else
            @num_params_out=num_params_out
        end
        @debug_level = -1
        @send_mutex=Mutex.new
    end
    
    # Sends a message to the logger
    def log(str, level)
        
        if level == ERROR
            str = "------- ERROR ---------------\n" +
            str + "\n-----------------------------"
        end

        if @debug_level != -1 and level <= @debug_level
             
            str.split("\n").each{|line|
                @logger.puts(Time.now.ctime + ": " + line.strip)
                @logger.flush
            }
            
        end
    end
    
    # Sets the logger file, this can be an open file
    def set_logger(logger, level)
        @debug_level = level.to_i
        @logger=logger
    end
    
    # Main loop that will get messages from STDIN and call any
    # action associated to the message.
    def loop
        while true
            exit(-1) if STDIN.eof?
            str=STDIN.gets
            next if !str
            
            line=str.split(/\s+/)
            
            log(str,DEBUG)
            
            args=Array.new
            args+=line[0..(@num_params-2)]
            args<<line[(@num_params-1)..-1].join(' ') if line.length>=@num_params
            process args
        end
    end
    
    # Sends a message to ONE, this takes an array with the message and arguments.
    # If the message is shorter than the number of parameters specified in the
    # initialization more marameters will be added containing '-'.
    def send_message(*args)
        @send_mutex.synchronize {
            to_send=args
            if args.length<@num_params_out
                (@num_params_out-args.length).times{ to_send<<'-' }
            end
            STDOUT.puts to_send.join(' ')
            STDOUT.flush
            log(to_send.join(' '),DEBUG)
        }
    end
    
    # Sends a log message to ONE. The +message+ can be multiline, it will
    # be automatically splitted by lines.
    def mad_log(command, number, message)
        msg=message.strip
        msg.each_line {|line|
            send_message("LOG", "-", number, line.strip)
        }
    end
    
    # Proceses each message received, called by +loop+.
    def process(args)
        return nil if !args or !args[0]
        action=args[0].downcase
        if self.respond_to?("action_#{action}")
            self.action_debug(args)
            self.send("action_#{action}", args)
        else
            self.action_debug(args)
        end
    end
    
    # Action called when there is not a handler for a message. By default it
    # logs the message, but can be redefined to do any other thing.
    def action_debug(args)
        #@logger.puts(args.join(';'))
    end
    
    # Default FINALIZE action. Exists the program.
    def action_finalize(args)
        exit(0)
    end

    # Functions for VM deployment
    # TODO: Move elsewhere
    def get_local_deployment_file(remote_deployment_file)
        local_deployment_file=nil

        one_location=ENV["ONE_LOCATION"]
        m=remote_deployment_file.match(/.*?\/(\d+)\/images\/(deployment.\d+)$/)
        local_deployment_file="#{one_location}/var/#{m[1]}/#{m[2]}" if m

        return local_deployment_file
    end

    def execute_local_command(cmd_string)
        command=SSHCommand.new(cmd_string)
        stdout, stderr=command.exec_local_command(cmd_string)
        exit_code=command.get_exit_code(stderr)
        if exit_code!=0
            return stderr
        else
            nil
        end
    end
 
        
end
