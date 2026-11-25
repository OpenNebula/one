#!/usr/bin/env ruby

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

ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    LIB_LOCATION      ||= '/usr/lib/one'
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
else
    LIB_LOCATION      ||= ONE_LOCATION + '/lib'
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
end

# %%RUBYGEMS_SETUP_BEGIN%%
require 'load_opennebula_paths'
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION

$LOAD_PATH.unshift('/var/lib/one-remotes')

require 'fileutils'
require 'tempfile'
require 'open3'
require 'rexml/document'
require 'English'
require 'shellwords'
require 'CommandManager'
require 'DriverLogger'

require_relative 'onebex'

# A helper module for running shell commands and handling LVM operations.
module LVMHelper

    # Gets a specific attribute for logical volumes.
    def self.get_lv_attr(attr, lv_path)
        command = ['sudo', 'lvs', '--noheadings', '-o', attr, lv_path]
        result  = LocalCommand.run(command.shelljoin)

        unless result.code == 0
            raise "Cannot read #{attr} for #{lv_path}: #{result.stderr}"
        end

        value = result.stdout.strip
        raise "Missing #{attr} for #{lv_path}" if value.empty?

        value
    end

    # Constructs the device mapper path for a thin pool.
    def self.get_tpool_device(vg_name, pool_name)
        "/dev/mapper/#{vg_name.gsub('-', '--')}-#{pool_name.gsub('-', '--')}-tpool"
    end

    # Constructs the device mapper path for a thin pool's metadata.
    def self.get_tmeta_device(vg_name, pool_name)
        "/dev/mapper/#{vg_name.gsub('-', '--')}-#{pool_name.gsub('-', '--')}_tmeta"
    end

    # Gets the full /dev/mapper path for a logical volume.
    def self.get_mapper_path(lv_path)
        vg_name = get_lv_attr('vg_name', lv_path)
        lv_name = get_lv_attr('lv_name', lv_path)

        "/dev/mapper/#{vg_name.gsub('-', '--')}-#{lv_name.gsub('-', '--')}"
    end

end

# Parses the XML output from the 'thin_delta' to find changed blocks.
class ThinDeltaParser

    attr_reader :records

    def initialize
        @records = []
    end

    def parse(xml_path)
        doc = REXML::Document.new(File.read(xml_path))

        block_size_sectors = doc.elements['//superblock'].attributes['data_block_size'].to_i
        block_size_bytes   = block_size_sectors * 512

        raise 'Invalid block size detected in thin_delta XML' if block_size_bytes <= 0

        # Selects ranges that are different or exist only in the newer snapshot.
        doc.elements.each('//diff/different | //diff/right_only') do |range|
            offset = range.attributes['begin'].to_i
            length = range.attributes['length'].to_i

            @records << {
                :offset => offset * block_size_bytes,
                :length => length * block_size_bytes
            }
        end
    end

end

# Manages writing changed extents to a file.
class ExtentWriter

    # Writes changed blocks from a source device to a target qcow2 file.
    #
    # @param source_dev [String] The source block device (/dev/mapper/vg-snap).
    # @param target_file [String] The final destination for the qcow2.
    # @param records [Array<Hash>] Array of hashes describing changed extents.
    def self.write(source_dev, target_file, records)
        unless File.blockdev?(source_dev)
            raise "Source device #{source_dev} is not a block device or does not exist."
        end

        # Use temporary file for the intermediate raw file.
        temp_raw_file = Tempfile.new(['inc_backup', '.raw'])
        temp_raw_path = temp_raw_file.path
        temp_raw_file.close!

        # Write to a temporary qcow2 file first.
        temp_qcow2_file = target_file + ".tmp.#{Process.pid}"

        begin
            # 1. Get the size from the source device.
            size = LocalCommand.run("blockdev --getsize64 #{source_dev}").stdout.strip

            # 2. Create a raw file with the virtual size.
            LocalCommand.run("truncate -s #{size} #{temp_raw_path}")

            # 3. dd to copy each changed block.
            records.each do |r|
                offset = r[:offset]
                length = r[:length]
                LocalCommand.run(
                    "dd if=#{source_dev} of=#{temp_raw_path} bs=4M " \
                    'iflag=skip_bytes,count_bytes oflag=seek_bytes ' \
                    "skip=#{offset} seek=#{offset} count=#{length} conv=notrunc"
                )
            end

            # 4. Convert the temporary raw file to temporary qcow2.
            LocalCommand.run(
                "qemu-img convert -f raw -O qcow2 #{temp_raw_path} " \
                "#{temp_qcow2_file}"
            )

            # 5. Rename the temp file to final destination.
            FileUtils.mv(temp_qcow2_file, target_file)
        rescue StandardError => e
            FileUtils.rm_f(temp_qcow2_file)
            raise e
        ensure
            # Cleanup
            FileUtils.rm_f(temp_raw_path)
        end
    end

end

def checked_command(*args)
    result = LocalCommand.run(args.shelljoin)
    raise "Command failed: #{args.first}: #{result.stderr}" unless result.code == 0

    result.stdout
end

# Called while the frontend holds the VG lock.
def prepare_delta(origin_lv, from_snap_lv, to_snap_lv, delta_file_path)
    # Activate LV
    checked_command('sudo', 'lvchange', '-K', '-ay', to_snap_lv)

    # LVM metadata
    vg_name   = LVMHelper.get_lv_attr('vg_name', origin_lv)
    pool_name = LVMHelper.get_lv_attr('pool_lv', origin_lv)
    tpool_dev = LVMHelper.get_tpool_device(vg_name, pool_name)
    tmeta_dev = LVMHelper.get_tmeta_device(vg_name, pool_name)

    from_id = LVMHelper.get_lv_attr('thin_id', from_snap_lv)
    to_id   = LVMHelper.get_lv_attr('thin_id', to_snap_lv)

    # Reserve and release snapshot metadata
    reserved = false
    begin
        OpenNebula::DriverLogger.log_info "Getting changed blocks from #{from_id} to #{to_id}"

        checked_command('sudo', 'dmsetup', 'message', tpool_dev, '0', 'reserve_metadata_snap')
        reserved = true

        File.open(delta_file_path, 'w') do |file|
            pid = Process.spawn(
                'thin_delta', '--metadata-snap', '--thin1', from_id,
                '--thin2', to_id, tmeta_dev, :out => file
            )

            _, status = Process.wait2(pid)
            raise 'thin_delta failed' unless status.success?
        end
    ensure
        # Release only a successfully reserved snapshot
        if reserved
            checked_command('sudo', 'dmsetup', 'message', tpool_dev, '0', 'release_metadata_snap')
        end
    end
end

# Called without the frontend lock after preparation has completed.
def export_delta(to_snap_lv, delta_file_path, output_file, opts = {})
    interactive = opts[:interactive]
    source_dev = LVMHelper.get_mapper_path(to_snap_lv)

    if interactive
        disk_id = opts[:disk_id]
        size    = opts[:size]

        if disk_id.to_s.empty? || size.to_s.empty?
            raise 'Invalid disk id or size for interactive LVM export'
        end

        exports_path = File.join(File.dirname(output_file), 'interactive_exports.json')

        TransferManager::OneBEX.write_exports(
            exports_path,
            disk_id,
            :source   => source_dev,
            :target   => output_file,
            :exporter => 'lvm',
            :format   => 'qcow2',
            :mode     => 'incremental',
            :size     => size.to_i,
            :delta    => delta_file_path
        )

        return
    end

    # Parse delta file (get changed blocks)
    parser = ThinDeltaParser.new
    parser.parse(delta_file_path)

    # No changes
    if parser.records.empty?
        OpenNebula::DriverLogger.log_info 'No changes between snapshots. Empty qcow2 incremental.'

        size = checked_command('blockdev', '--getsize64', source_dev).strip
        checked_command('qemu-img', 'create', '-f', 'qcow2', output_file, size)
        return
    end

    # Write extents to final file
    OpenNebula::DriverLogger.log_info "Changed blocks found: #{parser.records.size}, writing..."
    ExtentWriter.write(source_dev, output_file, parser.records)

    OpenNebula::DriverLogger.log_info "LVM Thin Backup completed successfully: #{output_file}"
end

# --- Entry ---
if __FILE__ == $PROGRAM_NAME
    operation   = ARGV.shift
    interactive = operation == '--export' && ARGV.first == '--interactive'

    ARGV.shift if interactive

    expected = if operation == '--prepare'
                   4
               elsif interactive
                   5
               else
                   3
               end

    unless ['--prepare', '--export'].include?(operation) && ARGV.length == expected
        warn "Usage: #{$PROGRAM_NAME} --prepare <origin> <previous> <current> <delta>"
        warn "       #{$PROGRAM_NAME} --export [--interactive] " \
             '<current> <delta> <output> [<disk_id> <size_mib>]'
        exit 1
    end

    begin
        if operation == '--prepare'
            prepare_delta(*ARGV)
        else
            export_delta(ARGV[0], ARGV[1], ARGV[2],
                         :interactive => interactive, :disk_id => ARGV[3], :size => ARGV[4])
        end
    rescue StandardError => e
        OpenNebula::DriverLogger.report "LVM Thin Backup failed: #{e.message}"
        OpenNebula::DriverLogger.report e.backtrace.join("\n")
        exit 1
    end
end
