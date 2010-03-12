# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'thread'

=begin rdoc
Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)

This class manages a pool of threads with a maximun number of concurrent running jobs.

== Example

Creates 1000 threads that sleep 1 second and executes them with a concurrency of 100.

    th=ThreadScheduler.new(100)

    1000.times {
        th.new_thread {
            sleep 1
        }
    }
=end

class ThreadScheduler
    # Creates a new thread pool
    #
    # +concurrent_number+ is the maximun number of threads that can run
    # at the same time
    def initialize(concurrent_number=10)
        @concurrent_number=concurrent_number
        @thread_queue=Array.new
        @running_threads=0
        @threads_mutex=Mutex.new
        @threads_cond=ConditionVariable.new
        start_thread_runner
    end
    
    # Creates a new job that will be placed on the queue. It will be scheduled
    # when there is room at the selected concurrency level. Job is a block.
    def new_thread(&block)
        @threads_mutex.synchronize {
            @thread_queue<<block
            
            if @running_threads < @concurrent_number
                # Awakes thread runner only if there is room for a new thread
                @threads_cond.signal
            end
        }
    end
    
    # Kills the thread that manages job queues. Should be called before
    # exiting
    def shutdown
        @thread_runner.kill!
    end
    
    private
    
    # Selects new jobs to be run as threads
    #
    # NOTE: should be called inside a syncronize block
    def run_new_thread
        thread = @thread_queue.shift
        
        if thread
            @running_threads += 1

            Thread.new {
                thread.call

                @threads_mutex.synchronize {
                    # Tell thread runner that the thread has finished
                    @running_threads -= 1
                    @threads_cond.signal
                }
            }
        end
    end
    
    def start_thread_runner
        @thread_runner=Thread.new {
            while true
                @threads_mutex.synchronize {
                    while ((@concurrent_number-@running_threads)==0) ||
                            @thread_queue.size==0
                        @threads_cond.wait(@threads_mutex)
                    end
                    
                    run_new_thread
                }
            end
        }
    end
end

if __FILE__ == $0
    
    th=ThreadScheduler.new(20)

    100.times {|n|
        100.times {|m|
            th.new_thread {
                puts "Starting #{m+n*100}"
                sleep 1
                #puts "Finishing #{m+n*100}"
            }
        }
    }

    th.new_thread {
        sleep 4
        th.shutdown
        exit(0)
    }

    sleep 3600
end

