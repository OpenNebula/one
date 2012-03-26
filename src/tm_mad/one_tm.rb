#!/usr/bin/env ruby

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

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
    ETC_LOCATION="/etc/one/"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    ETC_LOCATION=ONE_LOCATION+"/etc/"
end

$: << RUBY_LIB_LOCATION

require 'pp'
require 'OpenNebulaDriver'
require 'CommandManager'
require 'getoptlong'

# This class provides basic messaging and logging functionality to implement 
# TransferManager Drivers. A TransferManager driver is a program (or a set of) 
# that  specialize the OpenNebula behavior to distribute disk images in a 
# specific datastore to the hosts
class TransferManagerDriver < OpenNebulaDriver

    # Register TRANSFER action, and tm drivers available
    # @param tm_type [Array] of tm types
    # @param options [Hash] basic options for an OpenNebula driver
    def initialize(tm_type, options={})
        @options={
            :concurrency => 15,
            :threaded    => true,
            :retries     => 0
        }.merge!(options)

        super('tm/', @options)

        if tm_type == nil
            @types = Dir["#{@local_scripts_path}/*/"].map do |d|
                d.split('/')[-1]
            end
        elsif tm_type.class == String
            @types = [tm_type]
        else
            @types = tm_type
        end

        # register actions
        register_action(:TRANSFER, method("action_transfer"))
    end

    # Driver Action: TRANSFER id script_file
    # Executes a transfer script
    def action_transfer(id, script_file)

        script = parse_script(script_file)

        if script.nil?
            send_message("TRANSFER", 
                         RESULT[:failure],
                         id, 
                         "Transfer file '#{script_file}' does not exist")
            return
        end

        script.each { |command|
            result, info = do_transfer_action(id, command)

            if result == RESULT[:failure]
                send_message("TRANSFER", result, id, info)
                return 
            end
        }

        send_message("TRANSFER", RESULT[:success], id)
    end

    private

    # Parse a script file
    # @param sfile [String] path to the transfer script
    # @return lines [Array] with the commands of the script. Each command is an
    #         array itself.
    def parse_script(sfile)
        return nil if !File.exist?(sfile)

        stext = File.read(sfile)
        lines = Array.new

        stext.each_line {|line|
            next if line.match(/^\s*#/) # skip if the line is commented
            next if line.match(/^\s*$/) # skip if the line is empty
            
            command = line.split(" ")

            lines << command
        }

        return lines
    end

    # Executes a single transfer action (command), as returned by the parse 
    # method
    # @param id [String] with the OpenNebula ID for the TRANSFER action
    # @param command [Array]
    def do_transfer_action(id, command)
        cmd  = command[0].downcase
        tm   = command[1]
        args = command[2..-1].join(" ")

        if not @types.include?(tm)
            return RESULT[:failure], "Transfer Driver '#{tm}' not available"
        end

        path = File.join(@local_scripts_path, tm, cmd)
        path << " " << args

        rc = LocalCommand.run(path, log_method(id))

        result, info = get_info_from_execution(rc)

        return result, info
    end
end

################################################################################
################################################################################
# TransferManager Driver Main program
################################################################################
################################################################################

opts = GetoptLong.new(
    [ '--threads',  '-t', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--tm-types', '-d', GetoptLong::OPTIONAL_ARGUMENT ]
)

tm_type = nil
threads = 15

begin
    opts.each do |opt, arg|
        case opt
            when '--threads'
                threads = arg.to_i
            when '--tm-types'
                tm_type = arg.split(',').map {|a| a.strip }
        end
    end
rescue Exception => e
    exit(-1)
end

tm_driver = TransferManagerDriver.new(tm_type, :concurrency => threads)
tm_driver.start_driver
