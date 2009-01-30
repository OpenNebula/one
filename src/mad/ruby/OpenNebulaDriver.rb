# -------------------------------------------------------------------------- */
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
# Complutense de Madrid (dsa-research.org)                                   */
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
    def initialize(concurrency=10, threaded=true)
        super(concurrency,threaded)
        @send_mutex=Mutex.new
    end

    def send_message(*args)
        @send_mutex.synchronize {
            STDOUT.puts args.join(' ')
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

    def start_driver
        loop_thread = Thread.new { loop }
        start_listener
        loop_thread.kill!
    end

private

    def loop
        while true
            exit(-1) if STDIN.eof?

            str=STDIN.gets
            next if !str

            args   = str.split(/\s+/)
            next if args.length == 0

            action = args.shift.upcase

            trigger_action(action,*args)
        end
    end
end

if __FILE__ == $0

    class SampleDriver < OpenNebulaDriver
        def initialize
            super(15,true)

            register_action("SLEEP",method("my_sleep"))
        end

        def response(action,result,info)
            send_message(action,result,info)
        end

        def my_sleep(timeout, num)
            log(num,"Sleeping #{timeout} seconds")
            sleep(timeout.to_i)
            log(num,"Done with #{num}")

            response("SLEEP","SUCCESS",num.to_s)
        end
    end

    sd = SampleDriver.new
    sd.start_driver

end