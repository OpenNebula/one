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

module OneBEX

    module Exporters

        # NBD exporter for exposing disk images through qemu-nbd.
        class NBD

            # Stores shared exporter configuration and logging dependencies.
            def initialize(config:, logger:)
                @config = config
                @logger = logger
            end

            # ----------------------------------------------------------------
            # Start NBD exporter
            # Starts qemu-nbd for a local source image, or reuses an NBD URI.
            #
            # Transfer hash attributes used by this exporter:
            #   Read:
            #     :transfer_id - unique transfer identifier used for logs/socket
            #     :source      - source image path or existing NBD URI
            #     :export_dir  - directory where the unix socket is created
            #     :format      - source image format passed to qemu-nbd
            #
            #   Written:
            #     :uri          - NBD URI used by later operations
            #     :external_nbd - true when :source is already an NBD URI
            #     :pid          - qemu-nbd process id for managed exports
            #     :socket       - unix socket path for managed exports
            # ----------------------------------------------------------------
            def start(xfr)
                source = xfr[:source]

                if source.nil? || source.empty?
                    raise 'Missing NBD source image'
                end

                if nbd_uri?(source)
                    @logger.info("Using existing NBD source for #{xfr[:transfer_id]}: #{source}")

                    xfr[:uri]          = source
                    xfr[:external_nbd] = true

                    return true
                end

                raise "NBD source image not found: #{source}" unless File.exist?(source)

                socket = File.join(xfr[:export_dir], "#{xfr[:transfer_id]}.socket")

                FileUtils.rm_f(socket)

                cmd = [
                    'qemu-nbd',
                    '-r',
                    '-k', socket,
                    '-f', xfr[:format],
                    '-t',
                    source
                ]

                @logger.info("Starting NBD exporter: #{cmd.shelljoin}")

                pid = Process.spawn(*cmd, :out => '/dev/null', :err => '/dev/null')

                xfr[:pid]    = pid
                xfr[:socket] = socket
                xfr[:uri]    = uri(socket)

                state = wait_process(
                    pid,
                    :timeout  => (@config[:nbd_start_timeout] || 10).to_i,
                    :interval => 0.1
                ) do
                    File.socket?(socket)
                end

                raise "qemu-nbd exited before creating socket #{socket}" if state == :exited

                true
            rescue StandardError => e
                @logger.error("Failed to start NBD transfer #{xfr[:transfer_id]}: #{e.message}")

                stop_process(pid) if pid
                FileUtils.rm_f(socket) if socket

                raise
            end

            # ----------------------------------------------------------------
            # Get block map
            # Returns the NBD block map converted to OneBEX extent entries.
            # ----------------------------------------------------------------
            def blocks(xfr)
                extents(xfr[:uri], xfr[:map]).map do |extent|
                    block(extent)
                end
            rescue StandardError => e
                @logger.error("Failed to get NBD block map for #{xfr[:transfer_id]}: #{e.message}")
                raise
            end

            # ----------------------------------------------------------------
            # Read disk data
            # Reads a byte range from the NBD export and returns binary data.
            # ----------------------------------------------------------------
            def data(xfr, range)
                expected = range[:length].to_i
                offset   = range[:start].to_i

                if expected <= 0
                    raise "Invalid read range: #{range}"
                end

                script = <<~PY
                    import sys
                    buf = h.pread(#{expected}, #{offset})
                    sys.stdout.buffer.write(buf)
                PY

                stdout, stderr, status = Open3.capture3(
                    'nbdsh',
                    '-u', xfr[:uri],
                    '-c', script
                )

                raise "nbdsh failed: #{stderr}" unless status.success?

                if stdout.bytesize != expected
                    raise "nbdsh returned #{stdout.bytesize} bytes, expected #{expected}"
                end

                stdout.b
            end

            # ----------------------------------------------------------------
            # Finish NBD exporter
            # Stops a managed qemu-nbd process and removes its unix socket.
            # ----------------------------------------------------------------
            def finish(xfr, force: false)
                return true if xfr[:external_nbd]

                stop_process(xfr[:pid], :force => force)

                FileUtils.rm_f(xfr[:socket]) if xfr[:socket]

                true
            rescue StandardError => e
                @logger.error(
                    "Failed to finish NBD transfer #{xfr[:transfer_id]}: " \
                    "#{e.message}"
                )

                raise
            end

            # ----------------------------------------------------------------
            # Get transfer info
            # Returns virtual disk size in MiB and the transfer format.
            # ----------------------------------------------------------------
            def info(xfr)
                out = cmd(
                    'nbdinfo',
                    '--size',
                    xfr[:uri]
                )

                size_bytes = out.to_i
                size_mib   = (size_bytes + 1024 * 1024 - 1) / (1024 * 1024)

                {
                    :SIZE   => size_mib,
                    :FORMAT => xfr[:format]
                }
            end

            # ----------------------------------------------------------------
            # Helpers
            # ----------------------------------------------------------------

            # Queries nbdinfo for block extents, optionally using a named map.
            def extents(uri, map = nil)
                map_arg = if map && !map.to_s.empty?
                              "--map=#{map}"
                          else
                              '--map'
                          end

                out  = cmd('nbdinfo', uri, '--json', map_arg)

                bmap = JSON.parse(out)
                exts = []

                bmap.each do |e|
                    next if e.nil?

                    exts << e
                end

                exts
            rescue StandardError => e
                @logger.error("Failed to get NBD extents from #{uri}: #{e.message}")
                raise
            end

            private

            # Builds an NBD URI for a unix socket path.
            def uri(socket)
                "nbd+unix:///?socket=#{socket}"
            end

            # Checks whether a source string is already an NBD URI.
            def nbd_uri?(source)
                source.to_s.start_with?('nbd://', 'nbd+unix://')
            end

            # Converts an nbdinfo extent hash to the API block format.
            def block(extent)
                description = extent['description'].to_s.downcase

                {
                    :start  => extent['offset'].to_i,
                    :length => extent['length'].to_i,
                    :dirty  => description == 'dirty',
                    :zero   => description == 'zero',
                    :hole   => description == 'hole'
                }
            end

            # Waits until a process exits or the optional readiness block passes.
            def wait_process(pid, timeout: 5, interval: 0.25)
                deadline = Time.now + timeout

                loop do
                    return :exited if Process.waitpid(pid, Process::WNOHANG)
                    return :ready if block_given? && yield

                    if Time.now >= deadline
                        raise Timeout::Error,
                              "Process #{pid} did not finish within #{timeout}s"
                    end

                    sleep interval
                end
            rescue Errno::ECHILD
                :exited
            end

            # Terminates a managed child process, escalating to KILL on timeout.
            def stop_process(pid, force: false)
                return if pid.nil?

                @logger.info("Stopping process #{pid}")

                Process.kill(force ? 'KILL' : 'TERM', pid)

                if force
                    Process.detach(pid)
                    return
                end

                wait_process(pid, :timeout => 5)
            rescue Timeout::Error
                @logger.warn("Process #{pid} did not stop, killing it")

                begin
                    Process.kill('KILL', pid)
                rescue StandardError => e
                    @logger.warn("Error killing process #{pid}: #{e.message}")
                end
            rescue StandardError => e
                @logger.warn("Error stopping process #{pid}: #{e.message}")
                nil
            end

            # Runs a command and returns stdout, raising on non-zero exit status.
            def cmd(*args)
                @logger.debug("Running command: #{args.shelljoin}")

                stdout, stderr, status = Open3.capture3(*args)

                raise "Command failed: #{args.shelljoin}\n#{stderr}" unless status.success?

                stdout
            end

        end

    end

end
