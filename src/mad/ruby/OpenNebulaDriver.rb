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

require 'ActionManager'
require 'CommandManager'

require 'DriverExecHelper'
require 'base64'

# This class provides basic messaging and logging functionality
# to implement OpenNebula Drivers. A driver is a program that
# specialize the OpenNebula behavior by interfacing with specific
# infrastructure functionalities.
#
# A Driver inherits this class and only has to provide methods
# for each action it wants to receive. The method must be associated
# with the action name through the register_action function
class OpenNebulaDriver < ActionManager

    include DriverExecHelper

    # @return [String] Base path for scripts
    attr_reader :local_scripts_base_path, :remote_scripts_base_path
    # @return [String] Path for scripts
    attr_reader :local_scripts_path, :remote_scripts_path

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
    def initialize(directory, options = {})
        @options={
            :concurrency => 10,
            :threaded => true,
            :retries => 0,
            :local_actions => {},
            :timeout => nil
        }.merge!(options)

        super(@options[:concurrency], @options[:threaded])

        @retries = @options[:retries]
        @timeout = @options[:timeout]

        # Set default values
        initialize_helper(directory, @options)

        register_action(:INIT, method('init'))
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
    # @option ops [Bool] :respond if defined will send result to ONE core
    # @option ops [Bool] :base64 encode the information sent to ONE core
    # @option ops [Bool] :zip compress the information sent to ONE core
    def do_action(parameters, id, host, aname, ops = {})
        options = {
            :stdin => nil,
            :script_name => nil,
            :respond => true,
            :ssh_stream => nil,
            :base64 => false,
            :zip => false,
            :no_extra_params => false
        }.merge(ops)

        params = parameters
        params = "#{params} #{id} #{host}" unless options[:no_extra_params]
        command = action_command_line(aname, params, options[:script_name])

        # if options[:is_local] is not specified (nil)
        # we rely uniquely in actions_is_local?
        if action_is_local?(aname) or options[:is_local]
            stdin = Base64.strict_encode64(options[:stdin].to_s)
            execution = LocalCommand.run(command,
                                         log_method(id),
                                         stdin,
                                         @timeout)
        elsif options[:ssh_stream]
            if options[:stdin]
                cmdin = "cat << 'EOT' | #{command}"
                stdin = "#{options[:stdin]}\nEOT\n"
            else
                cmdin = command
                stdin = nil
            end

            execution = options[:ssh_stream].run(cmdin,
                                                 stdin,
                                                 command,
                                                 @timeout)
        else
            execution = RemotesCommand.run(command,
                                           host,
                                           @remote_scripts_base_path,
                                           log_method(id),
                                           options[:stdin],
                                           @retries,
                                           @timeout)
        end

        result, info = get_info_from_execution(execution)

        if options[:respond]
            info = Zlib::Deflate.deflate(info, Zlib::BEST_COMPRESSION) if options[:zip]
            info = Base64.strict_encode64(info) if options[:base64]

            send_message(aname, result, id, info)
        end

        [result, info]
    end

    # Start the driver. Reads from STDIN and executes methods associated with
    # the messages
    def start_driver
        Thread.new { loop }
        start_listener
    end

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
        actions = {}
        str_splitted = str.split(/\s*,\s*/).map {|s| s.strip }

        str_splitted.each do |a|
            m=a.match(/([^=]+)(=(.*))?/)
            next unless m

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

    private

    def init
        send_message('INIT', RESULT[:success])
    end

    def loop
        Kernel.loop do
            exit!(-1) if STDIN.eof?

            str = STDIN.gets
            next unless str

            args = str.split(/\s+/)
            next if args.empty?

            if args.first.empty?
                STDERR.puts "Malformed message: #{str.inspect}"
                next
            end

            action = args.shift.upcase.to_sym

            if args.empty? || !args[0]
                action_id = 0
            else
                action_id = args[0].to_i
            end

            if action == :DRIVER_CANCEL
                cancel_action(action_id)
                log(action_id, "Driver command for #{action_id} cancelled")
            else
                trigger_action(action, action_id, *args)
            end
        end
    end

end
