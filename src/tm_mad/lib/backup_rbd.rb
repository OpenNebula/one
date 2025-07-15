#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                  #
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

require 'fileutils'
require 'tempfile'
require 'json'
require 'English'
require 'tmpdir'
require 'open3'

def run_cmd(cmd, ignore_err: false)
    stdout_str  = `#{cmd} 2>&1`
    exit_status = $CHILD_STATUS.exitstatus

    if exit_status != 0 && !ignore_err
        raise "Command error: #{cmd}\nExit status: #{exit_status}\nOutput: #{stdout_str}"
    end

    stdout_str
end

# --- Class to Parse .rdiff ---
class RbdDiffParser

    MAGIC_HEADER_V1 = "rbd diff v1\n".freeze
    MAGIC_HEADER_V2 = "rbd diff v2\n".freeze

    attr_reader :version, :size, :records

    def initialize
        @records = []
        @size = nil
        @version = nil
    end

    def parse(file_path)
        File.open(file_path, 'rb') do |file|
            detect_version(file)

            loop do
                tag_byte = file.read(1)
                break unless tag_byte

                tag = tag_byte.chr
                break if tag == 'e'

                process_record(tag, file)
            end
        end

        self
    end

    private

    def detect_version(file)
        header = file.read(MAGIC_HEADER_V1.bytesize)

        @version =
            case header
            when MAGIC_HEADER_V1
                1
            when MAGIC_HEADER_V2
                2
            else
                raise 'Unknown diff header. Not an rbd diff v1 or v2 file.'
            end
    end

    def process_record(tag, file)
        file.read(8) if @version == 2 && ['f', 't', 's'].include?(tag)

        case tag
        when 'f', 't'
            len = file.read(4).unpack1('L<')
            file.read(len)
        when 's'
            @size = file.read(8).unpack1('Q<')
        when 'w'
            read_write_record(file)
        when 'z'
            read_zero_record(file)
        else
            raise "Unknown diff tag '#{tag}' at position #{file.pos - 1}."
        end
    end

    def read_write_record(file)
        file.read(8) if @version == 2

        offset = file.read(8).unpack1('Q<')
        length = file.read(8).unpack1('Q<')
        data   = file.read(length)

        @records << { :type => :write, :offset => offset, :length => length, :data => data }
    end

    def read_zero_record(file)
        file.read(8) if @version == 2

        offset = file.read(8).unpack1('Q<')
        length = file.read(8).unpack1('Q<')

        @records << { :type => :zero, :offset => offset, :length => length }
    end

end

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
        status = Open3.popen3('qemu-io', '-f', 'raw', nbd_uri) do |stdin, _stdout, stderr, wait_thr|
            stdin.write(io_script)
            stdin.close

            err_output = stderr.read

            unless err_output.empty?
                $stderr.puts "qemu-io STDERR: #{err_output}"
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

# --- Main ---
if ARGV.length < 4
    puts 'Error: Missing arguments.'
    puts "Usage: #{$PROGRAM_NAME} <rbd_image> <start_snap_name> " \
     '<end_snap_fullname> <output_filename>'
    exit 1
end

ceph_user  = ENV['CEPH_USER']
ceph_key   = ENV['CEPH_KEY']
ceph_conf  = ENV['CEPH_CONF']

rbd_image, start_snap_name, end_snap_fullname, filename = ARGV[0..3]

begin
    if start_snap_name.upcase == 'NONE'
        # Full Backup
        output_file = filename.to_s

        rbd_source_path = "rbd:#{end_snap_fullname}"
        rbd_source_path += ":id=#{ceph_user}" unless ceph_user.to_s.empty?
        rbd_source_path += ":keyfile=#{ceph_key}" unless ceph_key.to_s.empty?
        rbd_source_path += ":conf=#{ceph_conf}" unless ceph_conf.to_s.empty?

        FileUtils.rm(output_file) if File.exist?(output_file)

        command = "qemu-img convert -f rbd -O qcow2 \"#{rbd_source_path}\" \"#{output_file}\""
        run_cmd(command)
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

        begin
            temp_rdiff_path = File.join(Dir.tmpdir,
                                        "rbd-diff-#{Process.pid}-#{Time.now.to_i}.rdiff")

            #--- STEP 1: Generating temporary diff
            diff_cmd = "#{rbd_cmd} export-diff --from-snap #{start_snap_name} " \
                       "\"#{rbd_target_path}\" \"#{temp_rdiff_path}\""
            run_cmd(diff_cmd)

            #--- STEP 2: Creating destination QCOW2 with backing file
            diff_parser = RbdDiffParser.new
            diff_parser.parse(temp_rdiff_path)

            raise 'ERROR: Could not determine size from rdiff.' unless diff_parser.size

            FileUtils.rm(output_qcow_path) if File.exist?(output_qcow_path)

            create_cmd = "qemu-img create -f qcow2 -b \"#{rbd_backing_path}\" " \
                         "-F rbd \"#{output_qcow_path}\" #{diff_parser.size}"
            run_cmd(create_cmd)

            #--- STEP 3: Start NBD server and pull changes
            Nbd.start_nbd(output_qcow_path)

            begin
                pull_changes(diff_parser, Nbd.uri)
            ensure
                Nbd.stop_nbd
            end

            # --- STEP 4: Changing backing file to empty
            rebase_cmd = "qemu-img rebase -u -b \"\" -F qcow2 \"#{output_qcow_path}\""
            run_cmd(rebase_cmd)
        ensure
            if temp_rdiff_path && File.exist?(temp_rdiff_path)
                FileUtils.rm(temp_rdiff_path)
            end
        end
    end
rescue StandardError => e
    puts e.message
    exit(-1)
end
