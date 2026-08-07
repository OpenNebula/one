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
require 'rexml/document'
require 'shellwords'

module OneBEX

    module Exporters

        # LVM exporter for exposing prepared LVM volumes directly.
        class LVM

            SECTOR_SIZE = 512

            # Stores shared exporter configuration and logging dependencies.
            def initialize(config:, logger:)
                @config = config
                @logger = logger
            end

            # ----------------------------------------------------------------
            # Start LVM exporter
            # Records an already prepared LVM block device for later reads.
            #
            # Transfer hash attributes used by this exporter:
            #   Read:
            #     :transfer_id - unique transfer identifier used for logs
            #     :source      - prepared LV/block-device path
            #     :format      - transfer format returned by info
            #     :disk        - disk export data from interactive_exports.json
            #
            #   :disk attributes read:
            #     mode    - full or incremental
            #     from_id - older thin volume id for incremental exports
            #     to_id   - newer thin volume id for incremental exports
            #     tpool   - thin-pool device used by dmsetup
            #     tmeta   - thin metadata device used by thin_delta
            #     size    - fallback device size in MiB
            #
            #   Written:
            #     :device  - block device used by reads
            #     :mode    - normalized export mode
            #     :format  - normalized transfer format
            #     :from_id - older thin volume id
            #     :to_id   - newer thin volume id
            #     :tpool   - thin-pool device
            #     :tmeta   - thin metadata device
            # ----------------------------------------------------------------
            def start(xfr)
                disk = xfr[:disk] || {}

                xfr[:device]  = xfr[:source].to_s
                xfr[:mode]    = (disk['mode'] || 'full').to_s.downcase
                xfr[:format]  = (xfr[:format] || 'qcow2').to_s
                xfr[:from_id] = disk['from_id']
                xfr[:to_id]   = disk['to_id']
                xfr[:tpool]   = disk['tpool']
                xfr[:tmeta]   = disk['tmeta']

                if xfr[:device].empty?
                    raise 'Missing LVM source device'
                end

                unless File.exist?(xfr[:device])
                    raise "LVM source device not found: #{xfr[:device]}"
                end

                unless File.blockdev?(xfr[:device]) || File.file?(xfr[:device])
                    raise "LVM source is not a block device: #{xfr[:device]}"
                end

                @logger.info(
                    "Using LVM source for #{xfr[:transfer_id]}: " \
                    "#{xfr[:device]}, mode=#{xfr[:mode]}"
                )

                true
            rescue StandardError => e
                @logger.error(
                    "Failed to start LVM transfer #{xfr[:transfer_id]}: " \
                    "#{e.message}"
                )

                raise
            end

            # ----------------------------------------------------------------
            # Get block map
            # Returns full-disk or thin_delta-derived OneBEX extent entries.
            # ----------------------------------------------------------------
            def blocks(xfr)
                case xfr[:mode]
                when 'full'
                    [
                        {
                            :start  => 0,
                            :length => size_bytes(xfr),
                            :dirty  => true,
                            :zero   => false,
                            :hole   => false
                        }
                    ]
                when 'incremental'
                    thin_delta_extents(xfr)
                else
                    raise "Unsupported LVM export mode: #{xfr[:mode]}"
                end
            rescue StandardError => e
                @logger.error(
                    "Failed to get LVM block map for #{xfr[:transfer_id]}: " \
                    "#{e.message}"
                )

                raise
            end

            # ----------------------------------------------------------------
            # Read disk data
            # Reads a byte range from the LVM block device and returns binary data.
            # ----------------------------------------------------------------
            def data(xfr, range)
                expected = range[:length].to_i
                offset   = range[:start].to_i

                raise "Invalid read range: #{range}" if expected <= 0 || offset < 0

                File.open(xfr[:device], 'rb') do |io|
                    io.binmode

                    data = io.pread(expected, offset)
                    data = ''.b if data.nil?

                    if data.bytesize != expected
                        raise "LVM read returned #{data.bytesize} bytes, " \
                              "expected #{expected}"
                    end

                    data.b
                end
            rescue StandardError => e
                @logger.error(
                    "Failed to read LVM data for #{xfr[:transfer_id]}: " \
                    "#{e.message}"
                )

                raise
            end

            # ----------------------------------------------------------------
            # Finish LVM exporter
            # ----------------------------------------------------------------
            def finish(_xfr)
                true
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

            # Queries thin_delta for changed extents between two thin volume ids.
            def thin_delta_extents(xfr)
                missing = [:from_id, :to_id, :tpool, :tmeta].select do |key|
                    xfr[key].to_s.empty?
                end

                unless missing.empty?
                    raise "Missing LVM incremental field(s): #{missing.join(', ')}"
                end

                reserved = false

                begin
                    cmd(
                        'sudo',
                        '-n',
                        'dmsetup',
                        'message',
                        xfr[:tpool],
                        '0',
                        'reserve_metadata_snap'
                    )

                    reserved = true

                    xml = cmd(
                        'thin_delta',
                        '--metadata-snap',
                        '--thin1', xfr[:from_id].to_s,
                        '--thin2', xfr[:to_id].to_s,
                        xfr[:tmeta]
                    )

                    parse_thin_delta(xml)
                ensure
                    if reserved
                        begin
                            cmd(
                                'sudo',
                                '-n',
                                'dmsetup',
                                'message',
                                xfr[:tpool],
                                '0',
                                'release_metadata_snap'
                            )
                        rescue StandardError => e
                            @logger.warn(
                                'Failed to release LVM metadata snapshot ' \
                                "#{xfr[:tpool]}: #{e.message}"
                            )
                        end
                    end
                end
            end

            # Parses thin_delta XML into OneBEX extent entries.
            def parse_thin_delta(xml)
                doc = REXML::Document.new(xml)

                superblock = doc.elements['//superblock']
                raise 'Missing superblock in thin_delta XML' if superblock.nil?

                block_size_sectors = superblock.attributes['data_block_size'].to_i
                block_size_bytes   = block_size_sectors * SECTOR_SIZE

                raise 'Invalid block size detected in thin_delta XML' \
                    if block_size_bytes <= 0

                extents = []

                doc.elements.each('//diff/different | //diff/right_only') do |range|
                    begin_blocks  = range.attributes['begin'].to_i
                    length_blocks = range.attributes['length'].to_i

                    next if length_blocks <= 0

                    extents << {
                        :start  => begin_blocks * block_size_bytes,
                        :length => length_blocks * block_size_bytes,
                        :dirty  => true,
                        :zero   => false,
                        :hole   => false
                    }
                end

                normalize_extents(extents)
            end

            def normalize_extents(extents)
                sorted = extents.sort_by {|extent| extent[:start] }
                return [] if sorted.empty?

                merged = [sorted.shift.dup]

                sorted.each do |extent|
                    last = merged.last

                    if extent[:start] <= last[:start] + last[:length]
                        new_end = [last[:start]  + last[:length],
                                   extent[:start] + extent[:length]].max
                        last[:length] = new_end - last[:start]
                    else
                        merged << extent.dup
                    end
                end

                merged
            end

            # Returns the device size in bytes, falling back to disk size in MiB.
            def size_bytes(xfr)
                return File.size(xfr[:device]) if File.file?(xfr[:device])

                cmd('blockdev', '--getsize64', xfr[:device]).to_i
            rescue StandardError
                size = (xfr[:disk] || {})['size']

                raise if size.to_s.empty?

                size.to_i * 1024 * 1024
            end

            # Runs a command and returns stdout, raising on non-zero exit status.
            def cmd(*args)
                @logger.debug("Running command: #{args.shelljoin}")

                stdout, stderr, status = Open3.capture3(*args)

                raise "Command failed: #{args.shelljoin}\n#{stderr}" \
                    unless status.success?

                stdout
            end

        end

    end

end
