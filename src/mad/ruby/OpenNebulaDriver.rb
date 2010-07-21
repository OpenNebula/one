# -------------------------------------------------------------------------- */
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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

# Author:: dsa-research.org
# Copyright:: (c) 2009 Universidad Computense de Madrid
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

    RESULT = {
        :success => "SUCCESS",
        :failure => "FAILURE"
    }

    def initialize(concurrency=10, threaded=true)
        super(concurrency,threaded)

        register_action(:INIT, method("init"))

        @send_mutex=Mutex.new
    end

    def send_message(action="-", result=RESULT[:failure], id="-", info="-")
        @send_mutex.synchronize {
            STDOUT.puts "#{action} #{result} #{id} #{info}"
            STDOUT.flush
        }
    end

    # Sends a log message to ONE. The +message+ can be multiline, it will
    # be automatically splitted by lines.
    def log(number, message)
        msg=message.strip
        msg.each_line {|line|
            send_message("LOG", "-", number, line.strip)
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
end

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
