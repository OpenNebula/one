#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2019-2025, OpenNebula Systems S.L.                               #
#                                                                            #
# Licensed under the OpenNebula Software License                             #
# (the "License"); you may not use this file except in compliance with       #
# the License. You may obtain a copy of the License as part of the software  #
# distribution.                                                              #
#                                                                            #
# See https://github.com/OpenNebula/one/blob/master/LICENSE.onsla            #
# (or copy bundled with OpenNebula in /usr/share/doc/one/).                  #
#                                                                            #
# Unless agreed to in writing, software distributed under the License is     #
# distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY   #
# KIND, either express or implied. See the License for the specific language #
# governing permissions and  limitations under the License.                  #
# -------------------------------------------------------------------------- #

require 'json'
require 'open3'
require 'base64'
require 'optparse'
require 'tempfile'
require 'fileutils'

options = {}

OptionParser.new do |opts|
    opts.banner = 'Usage: backup_purefa.rb [options]'

    opts.on('-x', '--diffs DIFFS_JSON', 'PureStorage FlashArray Volume Diff as JSON') do |v|
        options[:diffs] = v
    end

    opts.on('-d', '--device DEVICE', 'Attached Volume Device') do |v|
        options[:device] = v
    end

    opts.on('-o', '--out FILE', 'Output File') do |v|
        options[:out_file] = v
    end
end.parse!

raise 'Missing attached volume device' unless options.key?(:device)
raise 'Missing output file' unless options.key?(:out_file)

diffs    = options.key?(:diffs) ? JSON.parse(Base64.decode64(options[:diffs])) : false
device   = options[:device]
out_file = options[:out_file]

# Class for managing the necessary commands
module Command

    def cmd(command, args, opts = {})
        opts.each do |key, value|
            if value.class == Array
                value.each {|v| command << render_opt(key, v) }
            else
                command << render_opt(key, value)
            end
        end

        out, err, rc = Open3.capture3("#{command} #{args}", :stdin_data => opts[:stdin_data])

        if rc.exitstatus != 0
            raise StandardError, "Error executing '#{command} #{args}':\n#{out} #{err}"
        end

        out
    end

    def render_opt(name, value)
        return '' if name == :stdin_data

        if name.length == 1
            opt = " -#{name.to_s.gsub('_', '-')}"
        else
            opt = " --#{name.to_s.gsub('_', '-')}"
        end

        if value && !value.empty?
            opt << ' ' if name[-1] != '='
            opt << value.to_s
        end

        opt
    end

end

# Module for managing NBD connection
module Nbd

    class << self

        attr_reader :socket, :server_pid, :mount_pid, :mount_point

    end

    @server = nil

    def self.start(file)
        return if @server_pid

        @socket = "#{file}.socket"
        @server_pid = fork do
            exec('/usr/bin/qemu-nbd', \
                 '--cache=none', \
                 '--verbose', \
                 '-k', @socket, \
                 '-f', 'qcow2', \
                 '-t', file)
        end

        timeout = 10
        until File.socket?(@socket)
            sleep 0.5
            timeout -= 0.5
            break if timeout <= 0
        end
        raise 'Timeout waiting for qemu-nbd to start' if timeout <= 0

        @mount_point = "#{file}.nbdfuse"
        Dir.mkdir(@mount_point) unless Dir.exist?(@mount_point)

        @mount_pid = fork do
            exec('nbdfuse', '-o', 'noauto_cache', @mount_point, "nbd+unix:///?socket=#{@socket}")
        end

        timeout = 10
        until Dir.exist?(@mount_point)
            sleep 0.5
            timeout -= 0.5
            break if timeout <= 0
        end
        raise 'Timeout waiting for nbdfuse to start' if timeout <= 0

        sleep 0.1
    end

    def self.stop
        if @mount_point
            Process.kill('QUIT', @mount_pid)
            Process.waitpid(@mount_pid)
            @mount_pid = nil
            fuse_unmount(@mount_point)
            FileUtils.rm_rf(@mount_point) if Dir.exist?(@mount_point)
            @mount_point = nil
        end

        if @server_pid
            Process.kill('QUIT', @server_pid)
            Process.waitpid(@server_pid)
            @server_pid = nil
        end

        if @socket && File.exist?(@socket)
            File.unlink(@socket)
            @socket = nil
        end

        sleep(1)
    end

    def self.which(cmd)
        @__which_cache ||= {}
        return @__which_cache[cmd] if @__which_cache.key?(cmd)

        ENV['PATH'].to_s.split(File::PATH_SEPARATOR).each do |p|
            exe = File.join(p, cmd)
            return @__which_cache[cmd] = exe if File.executable?(exe)
        end

        @__which_cache[cmd] = nil
    end

    def self.fuse_unmounter_cmd
        which('fusermount3') || which('fusermount') || which('umount')
    end

    def self.fuse_unmount(path)
        cmd = fuse_unmounter_cmd
        return false unless cmd

        if File.basename(cmd) == 'umount'
            system(cmd, path.to_s)
        else
            system(cmd, '-u', path.to_s)
        end
    end

    def self.uri
        "nbd+unix:///?socket=#{@socket}"
    end

    def self.device_path
        "#{@mount_point}/nbd"
    end

end

# Module for making incremental backups using PureFA Volume Diffs
module BackupPureFA

    extend Command

    BLOCK_SIZE = 4 * 1024 # 4K

    def self.run(diffs:, device:, out_file:)
        diffs ? incremental_backup(diffs, device, out_file) : full_backup(device, out_file)
    end

    def self.configure
        config = {
            :block_size     => BLOCK_SIZE_PUREFA
        }
        return config unless File.exist?('/var/lib/one-remotes/etc/tm/san/backup.conf')

        cfg_lines = cmd(
            'grep', '-v -e \'^\s*#\' -e \'^\s*$\' /var/lib/one-remotes/etc/tm/san/backup.conf'
        )

        cfg_lines.split("\n").each do |line|
            next if line.strip.empty?

            key, value = line.split('=')
            next unless value

            config[key.strip.downcase.to_sym] = value.strip
        end

        return config
    end

    def self.full_backup(device, outfile)
        command =  'qemu-img convert'
        opts    =  '-m 4 -f raw -O qcow2 '
        opts    << "#{device} #{outfile}"

        output = cmd(command, opts)
        raise "File not found: '#{command} #{opts}':\n#{output}" \
            unless File.exist?(outfile)

        command
    end

    def self.incremental_backup(diffs, device, outfile)
        command =  'qemu-img create'
        opts    =  '-f qcow2 -o backing_file='
        opts    << "#{device},backing_fmt=raw #{outfile}"
        output  =  cmd(command, opts)

        raise "File not found: '#{command} #{opts}':\n#{output}" \
            unless File.exist?(outfile)

        # Compare the old and new snapshots, output to the overlay
        unless make_changed_blocks(diffs, device, outfile)
            raise 'Checking for changed blocks failed'
        end
    rescue StandardError => e
        File.delete(outfile) if File.exist?(outfile)
        raise e
    end

    def self.make_changed_blocks(diffs, device, outfile)
        Nbd.start(outfile)
        blocks_changed = 0

        File.open(device, 'rb') do |dev|
            File.open(Nbd.device_path, 'r+b') do |out|
                out.binmode
                out.sync = true
                diffs.each do |diff|
                    offset = diff['offset'].to_i
                    length = diff['length'].to_i
                    out.seek(offset, IO::SEEK_SET)
                    dev.seek(offset, IO::SEEK_SET)
                    out.write(dev.read(length))
                    out.fsync
                    blocks_changed += (length / BLOCK_SIZE)
                end
            end
        end

        puts "blocks_changed=#{blocks_changed}"

        true
    ensure
        Nbd.stop rescue nil
    end

end

begin
    BackupPureFA.run(:diffs => diffs, :device => device, :out_file => out_file)
rescue StandardError => e
    puts e.message
    exit(-1)
end
