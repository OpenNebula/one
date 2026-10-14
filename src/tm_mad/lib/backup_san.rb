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

require 'open3'
require 'optparse'
require 'tempfile'

options = { :old_snap => nil }
OptionParser.new do |opts|
    opts.banner = 'Usage: backup_san.rb [options]'

    opts.on('-o', '--old OLD_SNAP', 'Old Snapshot') do |v|
        options[:old_snap] = v
    end

    opts.on('-n', '--new NEW_SNAP', 'New Snapshot') do |v|
        options[:new_snap] = v
    end

    opts.on('-f', '--out FILE', 'Output File') do |v|
        options[:out_file] = v
    end
end.parse!

old_snap = options[:old_snap]
new_snap = options[:new_snap]
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

# module to create backup files
module BackupSan

    extend Command

    BLOCK_SIZE = 2 * 1024 * 1024 # 2MB

    # Upper bound on the temporary payload buffered for a single qemu-io write.
    # Contiguous changed blocks are coalesced into one write, but never past
    # this size so transient disk usage stays bounded regardless of how much
    # of the LUN changed.
    MAX_RUN_SIZE = 256 * 1024 * 1024 # 256MB

    def self.run(old_snap:, new_snap:, out_file:)
        if !old_snap
            full_backup(new_snap, out_file)
        else
            incremental_backup(old_snap, new_snap, out_file)
        end
    end

    # Gather config file values
    def self.configure
        config = {
            :block_size     => BLOCK_SIZE
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

    # Generate full disk backup
    def self.full_backup(new_snap, out_file)
        command =  'qemu-img convert'
        opts    =  '-m 4 -f raw -O qcow2 '
        opts    << "#{new_snap} #{out_file}"

        output = cmd(command, opts)
        raise "File not found: '#{command} #{opts}':\n#{output}" \
            unless File.exist?(out_file)

        command
    end

    # Create incremental backup by comparing two snapshots
    def self.incremental_backup(old_snap, new_snap, out_file)
        # The overlay's virtual size must match the parent (old) device.
        old_size = device_size(old_snap)
        raise "Cannot read old device or it is empty: #{old_snap}" if old_size <= 0

        # Create the overlay WITHOUT a backing file. The write phase then never
        # opens the (iSCSI) parent device: only cluster-aligned changed blocks
        # are written, so untouched clusters stay unallocated (sparse) and read
        # as zero for now. The backing pointer is recorded afterwards with an
        # unsafe rebase (header only, no data I/O), yielding the same qcow2
        # overlay with backing_file = old that the restore chain expects.
        command = 'qemu-img create'
        opts    = "-f qcow2 #{out_file} #{old_size}"
        output  = cmd(command, opts)

        raise "File not found: '#{command} #{opts}':\n#{output}" \
            unless File.exist?(out_file)

        # Compare the old and new snapshots, output to the overlay
        unless make_changed_blocks(old_snap, new_snap, out_file)
            raise 'Checking for changed blocks failed'
        end

        # Record backing_file = old (raw) without rewriting any data.
        cmd('qemu-img rebase', "-u -f qcow2 -b #{old_snap} -F raw #{out_file}")
    rescue StandardError => e
        # OpenNebula::DriverLogger.log_error "An error occurred: #{e.message}"
        File.delete(out_file) if File.exist?(out_file)
        raise e
    ensure
        # Cleanup
        File.delete("#{out_file}_reference") if File.exist?("#{out_file}_reference")
    end

    # Size in bytes of a regular file or block device (LUN), 0 if unreadable.
    # File.size is unreliable for block devices, so seek to the end and report
    # the position instead.
    def self.device_size(path)
        File.open(path, 'rb') do |f|
            f.seek(0, IO::SEEK_END)
            f.pos
        end
    rescue StandardError
        0
    end

    # Compare the old and new snapshots, writing every changed block into the
    # qcow2 overlay. Writes go straight to the overlay with qemu-io, so no FUSE
    # mount, NBD server or elevated privileges are required (the driver runs as
    # the unprivileged oneadmin user).
    def self.make_changed_blocks(old_path, new_path, out_path)
        config = configure

        bs = config[:block_size].to_i
        bs = BLOCK_SIZE if bs <= 0

        blocks_changed = 0

        # Reusable buffer holding the payload for the current run of contiguous
        # changed blocks. Same directory as the overlay to stay on one FS.
        buffer = Tempfile.new(['backup_san', '.blk'], File.dirname(out_path))
        buffer.binmode

        run_offset = nil # guest offset where the buffered run of changes starts
        run_len    = 0   # bytes buffered for the current run

        flush = lambda do
            next if run_offset.nil?

            buffer.flush
            qemu_io_write(out_path, buffer.path, run_offset, run_len)
            buffer.truncate(0)
            buffer.rewind
            run_offset = nil
            run_len    = 0
        end

        begin
            offset = 0
            File.open(old_path, 'rb') do |old_f|
                File.open(new_path, 'rb') do |new_f|
                    new_f.seek(0, IO::SEEK_END)
                    raise "Cannot read new device or it is empty: #{new_path}" \
                        if new_f.pos <= 0

                    new_f.seek(0)

                    while (o = old_f.read(bs)) && (n = new_f.read(bs))
                        if o == n
                            flush.call
                        else
                            run_offset ||= offset
                            buffer.write(n)
                            run_len += n.bytesize
                            blocks_changed += 1
                            # Cap the buffered run; the next changed block will
                            # start a fresh (still contiguous) run.
                            flush.call if run_len >= MAX_RUN_SIZE
                        end
                        offset += bs
                    end
                    flush.call
                end
            end
        ensure
            buffer.close!
        end

        puts "blocks_changed=#{blocks_changed}"

        true
    rescue StandardError => e
        STDERR.puts "Error making changed blocks: #{e.message}"
        false
    end

    # Write +length+ bytes read from +src_path+ into the qcow2 overlay at guest
    # +offset+ using qemu-io. At this point the overlay has no backing file, so
    # qemu-io opens only the local overlay and allocates just the written
    # clusters, keeping the increment sparse. incremental_backup records
    # backing_file = old afterwards.
    def self.qemu_io_write(out_path, src_path, offset, length)
        sub = "write -s #{src_path} #{offset} #{length}"
        out, err, rc = Open3.capture3('qemu-io', '-c', sub, out_path)

        return if rc.exitstatus.zero?

        raise StandardError,
              "qemu-io write failed (offset=#{offset} len=#{length}):\n#{out} #{err}"
    end

end

begin
    BackupSan.run(:old_snap => old_snap, :new_snap => new_snap, :out_file => out_file)
rescue StandardError => e
    puts e.message
    exit(-1)
end
