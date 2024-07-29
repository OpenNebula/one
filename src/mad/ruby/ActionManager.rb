# -------------------------------------------------------------------------- */
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'thread'

=begin rdoc

This class provides support to handle actions. Class methods, or actions, can be
registered in the action manager. The manager will wait for actions to be
triggered (thread-safe), and will execute them concurrently. The action manager
can be used to synchronize different objects in different threads

== Example

    class Sample
        attr_reader :am

        def initialize
            @am = ActionManager.new(15,true)

            @am.register_action("SLEEP",method("sleep_action"))
        end

        def sleep_action(secs)
            sleep(secs)
        end

        def finalize_action
            p "Exiting..."
            @am.stop_listener
        end
    end


    s = Sample.new

    s.@am.start_listener

#   Objects in other threads can trigger actions like this
#   s.am.trigger_action("SLEEP",rand(3)+1)
#   s.am.trigger_action("FINALIZE")
=end

class ActionManager

    # Creates a new Action Manager
    #
    # +concurrency+ is the maximun number of actions that can run at the same
    # time
    # +threaded+ if true actions will be executed by default in a different
    # thread
    def initialize(concurrency=10, threaded=true)
        @finalize       = false
        @actions        = Hash.new
        @threaded       = threaded

        @concurrency    = concurrency
        @num_running    = 0

        @action_queue   = Array.new
        @action_running = Hash.new

        @threads_mutex  = Mutex.new
        @threads_cond   = ConditionVariable.new
    end

    # Registers a new action in the manager. An action is defined by:
    #
    # +aname+ name of the action, it will identify the action
    # +method+ it's invoked with call. It should be a Proc or Method object
    # +threaded+ execute the action in a new thread
    def register_action(aname, method, threaded=nil)
        threaded ||= @threaded

        @actions[aname]={
            :method     => method,
            :threaded   => threaded
        }
    end

    # Triggers the execution of the action.
    #
    # +aname+ name of the action
    # +action_id+ an id to identify the action (to cancel it later)
    # +aargs+ arguments to call the action
    def trigger_action(aname, action_id, *aargs)

        @threads_mutex.synchronize {
            return if @finalize

            if aname == :FINALIZE
                finalize if respond_to?(:finalize)
                @finalize = true
                @threads_cond.signal if @num_running == 0
                return
            end

            if !@actions.has_key?(aname)
                return
            end

            arity=@actions[aname][:method].arity

            if arity < 0
                # Last parameter is an array
                arity = -arity - 1
                if arity > aargs.length
                    # Message has not enough parameters
                    return
                end
                # Converts last parameters to an array
                aargs[arity..-1]=[aargs[arity..-1]]
            else
                if arity != aargs.length
                    return
                end
            end

            @action_queue << @actions[aname].merge(:args => aargs,
                    :id => action_id)

            if @num_running < @concurrency
                @threads_cond.signal
            end
        }
    end

    def cancel_action(action_id)
        @threads_mutex.synchronize {
            action = @action_running[action_id]
            if action
                thread = action[:thread]
            else
                thread = nil
            end

            if thread
                thread.kill

                @num_running -= 1
                delete_running_action(action_id)

                @threads_cond.signal
            else
                i = @action_queue.select{|x| x[:id] == action_id}.first
                @action_queue.delete(i) if i
            end
        }
    end

    def start_listener
        while true
            @threads_mutex.synchronize {
                while ((@concurrency - @num_running)==0) || empty_queue
                    @threads_cond.wait(@threads_mutex)

                    return if (@finalize && @num_running == 0)
                end

                run_action
            }
        end
    end

    protected

    def delete_running_action(action_id)
        @action_running.delete(action_id)
    end

    def get_runable_action
        @action_queue.shift
    end

    def empty_queue
        @action_queue.size==0
    end

    def run_action
        action = get_runable_action

        if action
            @num_running += 1

            if action[:threaded]
                thread = Thread.new {
                    begin
                        action[:method].call(*action[:args])
                    ensure
                        @threads_mutex.synchronize {
                            @num_running -= 1
                            delete_running_action(action[:id])

                            @threads_cond.signal
                        }
                    end
                }

                action[:thread] = thread
                @action_running[action[:id]] = action
            else
                action[:method].call(*action[:args])

                @num_running -= 1
            end
        end
    end
end

if __FILE__ == $0

    class Sample
        attr_reader :am

        def initialize
            @am = ActionManager.new(15,true)

            @am.register_action(:SLEEP,method("sleep_action"))
#            @am.register_action(:SLEEP,Proc.new{|s,i| p s ; sleep(s)})
            @am.register_action(:NOP,method("nop_action"))

            def @am.get_runable_action
                action = super
                puts "getting: #{action.inspect}"
                action
            end

            def @am.delete_running_action(action_id)
                puts "deleting: #{action_id}"
                super(action_id)
            end
       end

        def sleep_action(secs, id)
            p "ID: #{id} sleeping #{secs} seconds"
            sleep(secs)
            p "ID: #{id} Awaken!"
        end

        def nop_action
            p " - Just an action"
        end

    end

    s = Sample.new

    Thread.new {
        sleep 1

        100.times {|n|
           s.am.trigger_action(:SLEEP,n,rand(3)+1,n)
           s.am.trigger_action(:NOP,100+n)
        }

        s.am.trigger_action(:SLEEP,301,5,301)

        s.am.cancel_action(301)

        s.am.trigger_action(:FINALIZE,0)

        s.am.trigger_action(:SLEEP,999,rand(3)+1,999)
        s.am.trigger_action(:SLEEP,333,rand(3)+1,333)
    }

    s.am.start_listener
end

