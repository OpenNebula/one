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

require 'fileutils'
require 'json'
require 'open3'
require 'timeout'

require_relative 'nbd_pool'

require File.expand_path('../../tm/lib/rbd_parser', __dir__)

module OneBEX

    module Exporters

        # RBD exporter for exposing Ceph snapshots and RBD diff extents.
        class RBD

            def initialize(config:, logger:)
                @config = config
                @logger = logger
            end

            # ----------------------------------------------------------------
            # Start RBD exporter
            # Starts qemu-nbd for a Ceph RBD snapshot.
            #
            # Transfer hash attributes used by this exporter:
            #   Read:
            #     :transfer_id - unique transfer identifier used for logs/socket
            #     :source      - qemu RBD URI exposed through qemu-nbd
            #     :export_dir  - directory where the unix socket is created
            #     :format      - source image format passed to qemu-nbd
            #
            #   :disk attributes read:
            #     mode         - full or incremental
            #     diff         - RBD diff file for incremental exports
            #     size         - exported disk size in MiB
            #
            #   Written:
            #     :uri          - NBD URI used by later operations
            #     :pid          - qemu-nbd process id for managed exports
            #     :socket       - unix socket path for managed exports
            #     :nbd_pool     - persistent clients, one per concurrent reader
            # ----------------------------------------------------------------
            def start(xfr)
                disk = xfr[:disk] || {}

                xfr[:mode]   = (disk['mode'] || 'full').to_s.downcase
                xfr[:format] = (xfr[:format] || 'raw').to_s
                xfr[:source] = xfr[:source].to_s
                xfr[:diff]   = disk['diff']

                raise 'Missing RBD source' if xfr[:source].empty?

                if xfr[:mode] == 'incremental' && xfr[:diff].to_s.empty?
                    raise 'Missing RBD diff file for incremental export'
                end

                socket = File.join(xfr[:export_dir], "#{xfr[:transfer_id]}.socket")
                errlog = File.join(xfr[:export_dir], "#{xfr[:transfer_id]}.qemu-nbd.err")

                FileUtils.rm_f(socket)
                FileUtils.rm_f(errlog)

                command = [
                    'qemu-nbd',
                    '-r',
                    '-k', socket,
                    '-f', 'rbd',
                    '-t',
                    "--shared=#{(@config[:max_readers] || 5).to_i + 1}",
                    xfr[:source]
                ]

                @logger.info("Starting RBD exporter for #{xfr[:transfer_id]}")

                err = File.open(errlog, File::WRONLY | File::CREAT | File::TRUNC, 0o600)

                pid = Process.spawn(*command, :out => '/dev/null', :err => err)
                err.close
                err = nil

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

                if state == :exited
                    error = File.read(errlog)

                    raise "qemu-nbd exited before creating socket #{socket}: #{error}"
                end

                start_nbd_pool(xfr)

                true
            rescue StandardError => e
                err.close if err && !err.closed?

                @logger.error("Failed to start RBD transfer #{xfr[:transfer_id]}: #{e.message}")

                xfr[:nbd_pool]&.close(:force => true)
                stop_process(pid) if pid
                FileUtils.rm_f(socket) if socket
                FileUtils.rm_f(errlog) if errlog

                raise
            end

            # ----------------------------------------------------------------
            # Get exporter options
            # Returns exporter's supported features and reader and writer limits.
            # ----------------------------------------------------------------
            def options(_xfr)
                readers = Integer(@config[:max_readers] || 5)

                {
                    :features    => ['checksum', 'extents', 'flush', 'zero'],
                    :max_readers => readers,
                    :max_writers => 1
                }
            end

            # ----------------------------------------------------------------
            # Get block map
            # Returns the RBD exporter block map converted to OneBEX extent entries.
            # ----------------------------------------------------------------
            def blocks(xfr)
                case xfr[:mode]
                when 'full'
                    extents(xfr[:uri]).map {|extent| block(extent) }
                when 'incremental'
                    diff_parser(xfr).records
                else
                    raise "Unsupported RBD export mode: #{xfr[:mode]}"
                end
            rescue StandardError => e
                @logger.error(
                    "Failed to get RBD block map for #{xfr[:transfer_id]}: " \
                    "#{e.message}"
                )

                raise
            end

            # ----------------------------------------------------------------
            # Read disk data
            # Reads a byte range from the NBD export and returns binary data.
            # ----------------------------------------------------------------
            def data(xfr, range)
                expected = range[:length].to_i
                offset   = range[:start].to_i

                if !expected.positive? || offset < 0
                    raise "Invalid read range: #{range}"
                end

                xfr.fetch(:nbd_pool).read(offset, expected)
            end

            # ----------------------------------------------------------------
            # Finish RBD exporter
            # Stops persistent clients, then the managed qemu-nbd and its socket.
            # ----------------------------------------------------------------
            def finish(xfr, force: false)
                xfr[:nbd_pool]&.close(:force => force)
                stop_process(xfr[:pid], :force => force)

                FileUtils.rm_f(xfr[:socket]) if xfr[:socket]

                true
            rescue StandardError => e
                @logger.error(
                    "Failed to finish RBD transfer #{xfr[:transfer_id]}: " \
                    "#{e.message}"
                )

                raise
            end

            # ----------------------------------------------------------------
            # Get transfer info
            # Returns virtual disk size in MiB and the transfer format.
            # ----------------------------------------------------------------
            def info(xfr)
                size_mib = (size_bytes(xfr) + 1024 * 1024 - 1) / (1024 * 1024)

                {
                    :SIZE   => size_mib,
                    :FORMAT => xfr[:format]
                }
            end

            # ----------------------------------------------------------------
            # Helpers
            # ----------------------------------------------------------------

            private

            # Creates a separate pool for each transfer.
            def start_nbd_pool(xfr)
                xfr[:nbd_pool] = NBDPool.new(
                    :uri           => xfr[:uri],
                    :size          => Integer(@config[:max_readers] || 5),
                    :start_timeout => (@config[:nbd_start_timeout] || 10).to_i
                )
            end

            # Queries nbdinfo for allocation extents.
            def extents(uri)
                stdout, stderr, status = Open3.capture3(
                    'nbdinfo', uri, '--json', '--map'
                )

                unless status.success?
                    raise "nbdinfo failed for #{uri}: #{stderr}"
                end

                JSON.parse(stdout).compact
            end

            # Converts an nbdinfo extent hash to the API block format.
            def block(extent)
                flags = extent['description'].to_s.downcase.split(',')

                {
                    :start  => extent['offset'].to_i,
                    :length => extent['length'].to_i,
                    :dirty  => true,
                    :zero   => flags.include?('zero'),
                    :hole   => flags.include?('hole')
                }
            end

            # Parses and caches the RBD diff file.
            def diff_parser(xfr)
                xfr[:diff_parser] ||= RbdDiffParser.new(
                    :record_mode => :extents
                ).parse(xfr[:diff])
            end

            # Builds an NBD URI for a unix socket path.
            def uri(socket)
                "nbd+unix:///?socket=#{socket}"
            end

            # Returns the exported RBD snapshot size in bytes.
            def size_bytes(xfr)
                size = (xfr[:disk] || {})['size']

                raise 'Missing RBD export size' if size.to_s.empty?

                size.to_i * 1024 * 1024
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

        end

    end

end

OneBEX::Exporters.register('rbd', OneBEX::Exporters::RBD)
