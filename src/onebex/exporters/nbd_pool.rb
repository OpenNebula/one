# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

require 'open3'
require 'timeout'

module OneBEX

    module Exporters

        # Owns a fixed number of persistent nbdsh clients for one transfer.
        class NBDPool

            def initialize(uri:, size:, start_timeout: 10)
                raise 'max_readers must be positive' unless size.positive?

                @workers = []
                @queue = Queue.new

                script = <<~PY
                    import sys
                    print('READY', flush=True)
                    for line in sys.stdin:
                        offset, length = map(int, line.split())
                        sys.stdout.buffer.write(h.pread(length, offset))
                        sys.stdout.buffer.flush()
                PY

                size.times do
                    stdin, stdout, waiter = Open3.popen2('nbdsh', '-u', uri, '-c', script)
                    worker = { :stdin => stdin, :stdout => stdout, :waiter => waiter }
                    @workers << worker
                    stdin.sync = true
                    stdout.binmode

                    Timeout.timeout(start_timeout) do
                        unless stdout.gets == "READY\n"
                            raise 'nbdsh initialization failed'
                        end
                    end

                    @queue << worker
                end
            rescue StandardError
                close(:force => true)
                raise
            end

            # A checked-out client is used by exactly one reader at a time.
            def read(offset, length)
                worker = @queue.pop
                raise 'NBD readers are closed' unless worker && !@queue.closed?
                raise 'nbdsh process not running' unless worker[:waiter].alive?

                data = Timeout.timeout(60) do
                    worker[:stdin].puts("#{offset} #{length}")
                    worker[:stdout].read(length)
                end

                unless data && data.bytesize == length
                    raise "nbdsh returned #{data&.bytesize || 0} bytes, expected #{length}"
                end

                data.b
            rescue StandardError
                # A failed or timed-out response cannot be safely reused.
                @queue.close
                raise
            ensure
                begin
                    @queue << worker if worker && !@queue.closed?
                rescue ClosedQueueError
                    nil
                end
            end

            # Closing the queue also releases readers waiting for a client.
            def close(force: false)
                @queue&.close

                (@workers || []).each do |worker|
                    waiter = worker[:waiter]

                    begin
                        worker[:stdin].close unless worker[:stdin].closed?

                        if force || !waiter.join(5)
                            Process.kill('KILL', waiter.pid) if waiter.alive?
                            waiter.join
                        end
                    rescue Errno::ESRCH
                        waiter.join
                    ensure
                        worker[:stdout].close unless worker[:stdout].closed?
                    end
                end
            end

        end

    end

end
