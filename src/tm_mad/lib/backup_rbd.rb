#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                  #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #
$LOAD_PATH.unshift('/var/tmp/one')

require 'fileutils'
require 'tempfile'
require 'English'
require 'tmpdir'
require 'open3'
require 'CommandManager'
require 'DriverLogger'

require_relative 'onebex'
require_relative 'rbd_parser'

#-------------------------------------------------------------------------------
# Setup an NBD server to pull changes, an optional map can be provided
#-------------------------------------------------------------------------------
module Nbd

    @server = nil
    @socket = nil

    def self.start_nbd(file, map = '', timeout_seconds = 10)
        return unless @server.nil?

        @socket = "#{File.realpath(file)}.socket"
        @server = fork do
            args  = ['-k', @socket, '-f', 'qcow2', '-t']
            args << '-B' << map unless map.empty?
            args << file

            exec('qemu-nbd', *args)
        end

        # Wait for the NBD socket to appear
        start_time = Time.now

        until File.exist?(@socket)
            if Time.now - start_time > timeout_seconds
                Process.kill('TERM', @server) rescue nil # Try to kill if it's still running
                Process.waitpid(@server) rescue nil

                raise "Timed out waiting for qemu-nbd socket to appear at #{@socket}"
            end

            sleep(0.1)
        end
    end

    def self.stop_nbd
        return unless @server # Ensure server was started

        Process.kill('QUIT', @server)
        Process.waitpid(@server) # Wait for the child process to terminate

        # No sleep here, waitpid ensures the process is gone and socket should be released
        File.unlink(@socket) if File.exist?(@socket)

        @server = nil
        @socket = nil
    end

    def self.uri
        raise 'NBD server not started.' if @socket.nil?

        "nbd+unix:///?socket=#{@socket}"
    end

end

# --- Pull changes using qemu-io ---
def pull_changes(diff_parser, nbd_uri)
    io_script  = ''
    temp_files = [] # Array to store Tempfile objects

    begin
        diff_parser.records.each do |extent|
            offset = extent[:offset]
            length = extent[:length]

            next if length == 0

            if extent[:type] == :write
                tmp_file = Tempfile.new('rbd-diff', Dir.tmpdir)

                temp_files << tmp_file # Store the Tempfile object

                # Set permissions for security
                File.chmod(0o600, tmp_file.path)
                tmp_file.write(extent[:data])
                tmp_file.flush

                io_script << "write -s #{tmp_file.path} #{offset} #{length}\n"
            elsif extent[:type] == :zero
                io_script << "write -z #{offset} #{length}\n"
            end
        end

        io_script << "flush\n"
        io_script << "quit\n"

        # Execute qemu-io.
        _out = ''
        err = ''

        status = Open3.popen3('qemu-io', '-f', 'raw', nbd_uri) do |stdin, stdout, stderr, wait_thr|
            stdin_thread = Thread.new do
                begin
                    stdin.write(io_script)
                ensure
                    stdin.close
                end
            end

            stdout_thread = Thread.new do
                _out = stdout.read
            end

            stderr_thread = Thread.new do
                err = stderr.read
            end

            stdin_thread.join
            stdout_thread.join
            stderr_thread.join

            unless err.empty?
                $stderr.puts "qemu-io STDERR: #{err}"
            end

            wait_thr.value
        end

        raise "qemu-io command failed with status #{status.exitstatus}" unless status.success?
    ensure
        # Clean up temporary files
        temp_files.each do |tf|
            tf.close
            tf.unlink
        end
    end
end

interactive = ARGV.first == '--interactive'
ARGV.shift if interactive

expected_args = interactive ? 6 : 4

if ARGV.length != expected_args
    puts 'Error: Missing arguments.'
    puts "Usage: #{$PROGRAM_NAME} <rbd_image> <start_snap_name> " \
         '<end_snap_fullname> <output_filename>'
    puts "       #{$PROGRAM_NAME} --interactive <rbd_image> <start_snap_name> " \
         '<end_snap_fullname> <output_filename> <disk_id> <size_mib>'
    exit 1
end

ceph_user  = ENV['CEPH_USER']
ceph_key   = ENV['CEPH_KEY']
ceph_conf  = ENV['CEPH_CONF']

rbd_image, start_snap_name, end_snap_fullname, filename, disk_id, size_mib = ARGV[0..5]

begin
    OpenNebula::DriverLogger.log_info 'Starting Ceph full backup.'

    exports_path = File.join(File.dirname(filename.to_s), 'interactive_exports.json')

    rbd_source_path = "rbd:#{end_snap_fullname}"
    rbd_source_path += ":id=#{ceph_user}" unless ceph_user.to_s.empty?
    rbd_source_path += ":keyfile=#{ceph_key}" unless ceph_key.to_s.empty?
    rbd_source_path += ":conf=#{ceph_conf}" unless ceph_conf.to_s.empty?

    if start_snap_name.upcase == 'NONE'
        # Full Backup
        output_file = filename.to_s

        if interactive
            TransferManager::OneBEX.write_exports(
                exports_path,
                disk_id,
                {
                    :source   => rbd_source_path,
                    :exporter => 'rbd',
                    :format   => 'raw',
                    :mode     => 'full',
                    :size     => size_mib.to_i
                }
            )

            OpenNebula::DriverLogger.log_info(
                "Ceph interactive full backup ready: #{output_file}"
            )

            exit 0
        end

        FileUtils.rm(output_file) if File.exist?(output_file)

        command = "qemu-img convert -f rbd -O qcow2 \"#{rbd_source_path}\" \"#{output_file}\""
        LocalCommand.run(command)

        OpenNebula::DriverLogger.log_info "Ceph Backup completed successfully: #{output_file}"
    else
        # Incremental Backup
        output_qcow_path = filename.to_s

        rbd_backing_path = "rbd:#{rbd_image}@#{start_snap_name}"
        rbd_backing_path += ":id=#{ceph_user}" unless ceph_user.to_s.empty?
        rbd_backing_path += ":keyfile=#{ceph_key}" unless ceph_key.to_s.empty?
        rbd_backing_path += ":conf=#{ceph_conf}" unless ceph_conf.to_s.empty?

        rbd_target_path = end_snap_fullname.to_s
        temp_rdiff_path = nil

        rbd_cmd = 'rbd'
        rbd_cmd += " --id #{ceph_user}" if ceph_user && !ceph_user.empty?
        rbd_cmd += " --keyfile #{ceph_key}" if ceph_key && !ceph_key.empty?
        rbd_cmd += " --conf #{ceph_conf}" if ceph_conf && !ceph_conf.empty?

        interactive_ready = false

        begin
            temp_dir = interactive ? File.dirname(filename.to_s) : Dir.tmpdir
            temp_rdiff_path = File.join(temp_dir,
                                        "rbd-diff-#{Process.pid}-#{Time.now.to_i}.rdiff")

            #--- STEP 1: Generating temporary diff
            diff_cmd = "#{rbd_cmd} export-diff --from-snap #{start_snap_name} " \
                       "\"#{rbd_target_path}\" \"#{temp_rdiff_path}\""
            LocalCommand.run(diff_cmd)

            if interactive
                TransferManager::OneBEX.write_exports(
                    exports_path,
                    disk_id,
                    {
                        :source       => rbd_source_path,
                        :exporter     => 'rbd',
                        :format       => 'raw',
                        :mode         => 'incremental',
                        :size         => size_mib.to_i,
                        :diff         => temp_rdiff_path
                    }
                )

                interactive_ready = true

                OpenNebula::DriverLogger.log_info(
                    "Ceph interactive incremental backup ready: #{output_qcow_path}"
                )

                exit 0
            end

            diff_parser = RbdDiffParser.new(:record_mode => payload)
            diff_parser.parse(temp_rdiff_path)

            raise 'ERROR: Could not determine size from rdiff.' unless diff_parser.size

            #--- STEP 2: Creating destination QCOW2 with backing file
            FileUtils.rm(output_qcow_path) if File.exist?(output_qcow_path)

            create_cmd = "qemu-img create -f qcow2 -b \"#{rbd_backing_path}\" " \
                         "-F rbd \"#{output_qcow_path}\" #{diff_parser.size}"
            LocalCommand.run(create_cmd)

            #--- STEP 3: Start NBD server and pull changes
            Nbd.start_nbd(output_qcow_path)

            begin
                pull_changes(diff_parser, Nbd.uri)
            ensure
                Nbd.stop_nbd
            end

            # --- STEP 4: Changing backing file to empty
            rebase_cmd = "qemu-img rebase -u -b \"\" -F qcow2 \"#{output_qcow_path}\""
            LocalCommand.run(rebase_cmd)

            OpenNebula::DriverLogger.log_info(
                "Ceph Backup completed successfully: #{output_qcow_path}"
            )
        ensure
            if temp_rdiff_path && !interactive_ready && File.exist?(temp_rdiff_path)
                FileUtils.rm(temp_rdiff_path)
            end
        end
    end
rescue StandardError => e
    OpenNebula::DriverLogger.report "RBD Backup failed: #{e.message}"
    OpenNebula::DriverLogger.report e.backtrace.join("\n")
    exit(-1)
end
