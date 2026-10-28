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

# Utilities Functions module
#
# This module provides helper methods for working with NetApp resources which
# are not directly related to a specific NetApp object.
module UtilitiesFunctions

    def with_retry(exception_class = StandardError, retries: 5, delay: 2)
        attempts = 0
        begin
            yield
        rescue exception_class => e
            attempts += 1

            raise e if attempts > retries

            sleep delay
            retry
        end
    end

    def parse_size(size_str)
        m = size_str.to_s.match(/\A([\d.]+)\s*([KMGTP])?B?\z/i)
        raise ArgumentError, "Invalid size format: #{size_str}" unless m

        number = m[1].to_f
        unit   = m[2] && m[2].upcase
        mult   = case unit
                 when 'K' then 1024
                 when 'M' then 1024**2
                 when 'G' then 1024**3
                 when 'T' then 1024**4
                 when 'P' then 1024**5
                 else 1
                 end
        (number * mult).to_i
    end

end

# Utilities class
class Utilities

    include UtilitiesFunctions

end

# iSCSI Functions Module
#
# This module provides all the necessary methods to scan specific LUNs on iSCSI
# in order to build the multipath device so it can be attached to a VM or accessed
# for taking backups or other actions.
module Iscsi

    # A NetApp-style WWN ends with the LUN serial number in hex, which is how a
    # discovered device can be tied back to the LUN that should be behind it.
    def self.serial_to_wwn_tail(serial)
        serial.to_s.each_byte.map {|b| format('%02x', b) }.join
    end

    WWN_TYPES = { 't10.' => '1', 'eui.' => '2', 'naa.' => '3' }

    SCSI_SCAN_COMMAND = "echo '%s %s %s' | sudo tee " \
                        '/sys/class/scsi_host/host%s/scan >/dev/null'
    SCSI_WWN_COMMAND  = '/lib/udev/scsi_id --page 0x83 --whitelisted \'%s\''
    SYNC_COMMAND      = <<~BASH
        CMD=$(command -v blockdev 2>/dev/null || echo /usr/sbin/blockdev)
        sudo $CMD --flushbufs %s
    BASH

    @provider = nil
    @by_path_devices = []

    def by_path_devices(host)
        return @by_path_devices unless @by_path_devices.empty?

        @by_path_devices = [] # safety
        path_base = '/dev/disk/by-path/ip-%s-iscsi-%s-lun-%s'
        sessions_data = portal_sessions(host, @provider.target)

        sessions_data.each do |session|
            current_path = format(path_base, session[:portal], @provider.target, id)

            # A session with no path to this LUN is legitimate (selective LUN
            # map, a down/half-open session). Skip it instead of handing the
            # by-path string downstream as if it were a device.
            begin
                current_device = sd_from_path(host, current_path, :retries => 0)
            rescue StandardError => e
                OpenNebula::DriverLogger.log_warning \
                    "No device for LUN #{id} on portal #{session[:portal]}, " \
                    "skipping path: #{e.message}"
                next
            end

            @by_path_devices << current_device if current_device
        end

        raise "Could not find devices for LUN mapping #{@uuid}" if @by_path_devices.empty?

        @by_path_devices
    end

    def check_valid_device(host, path)
        rc = @provider.action.ssh(
            :cmds => "dd if=#{path} of=/dev/null count=1 bs=512",
            :host => host
        )
        return true if rc.code == 0

        raise "Failed to access the device #{path} on host #{host}"
    end

    def sd_from_path(host, path, retries: 60)
        @__sd_cache ||= {}
        key = [host, path].join('|')
        return @__sd_cache[key] if @__sd_cache.key?(key)

        dev = nil
        with_retry(:retries => retries, :delay => 0.50) do
            # -e (not -f) so a path whose target does not exist fails here
            # instead of echoing the path back as if it were a device
            rc = @provider.action.ssh(
                :cmds => "readlink -e #{path}",
                :host => host,
                :nostdout => false,
                :silent => true
            )
            out = rc.stdout.to_s.strip
            raise "Device path not present yet: #{path}" if rc.code != 0 || out.empty?
            raise "Unexpected target for #{path}: #{out}" unless out.start_with?('/dev/')

            dev = out
        end

        @__sd_cache[key] = dev
        dev
    end

    def remove_scsi_device(host, device, flush: true)
        device = sd_from_path(host, device) unless device.start_with?('/dev/sd')
        return unless device.start_with?('/dev/sd')

        name = device.delete_prefix('/dev/')
        path = "/sys/block/#{name}/device/delete"

        begin
            flush_device_io(host, device) if flush
        rescue StandardError => e
            raise "Could not flush device #{device}: #{e}"
        end

        with_retry do
            break unless scsi_device_present?(host, name)

            rc = @provider.action.ssh(
                :cmds => "echo 1 | sudo tee #{path} >/dev/null",
                :host => host,
                :nostderr => false,
                :silent => true
            )

            break if rc.code == 0 && !scsi_device_present?(host, name)

            raise "Could not remove SCSI device #{device} " \
                  "(rc=#{rc.code}): #{rc.stderr.strip}"
        end
    end

    def scsi_device_present?(host, name)
        rc = @provider.action.ssh(
            :cmds => "test -e /sys/block/#{name}",
            :host => host,
            :nostderr => true,
            :silent => true
        )
        rc.code == 0
    end

    def wait_for_device_removal(host, devices)
        list = devices.map {|d| "/dev/#{d}" }.join(' ')
        script = <<~BASH
            set -e
            deadline=$((SECONDS+30))
            while :; do
                all_gone=1
                for p in "$@"; do
                    if [ -e "$p" ]; then all_gone=0; break; fi
                done
                [ $all_gone -eq 1 ] && exit 0
                [ $SECONDS -ge $deadline ] && exit 1
                sleep 0.5
            done
        BASH
        rc = @provider.action.ssh(
            :cmds => "bash -s -- #{list} <<'EOS'\n#{script}\nEOS\n",
            :host => host,
            :nostdout => false,
            :silent => true
        )
        return true if rc.code == 0

        raise 'SCSI Devices not removed after 30 seconds'
    end

    def device_info(host, device)
        rc = @provider.action.ssh(
            :cmds => "dev=$(readlink -f #{device}); bn=$(basename \"$dev\"); " \
                     'link=$(readlink -f /sys/block/$bn); echo "$link"',
            :host => host,
            :nostdout => false
        )
        raise "Failed to resolve #{device}" if rc.code != 0

        link = rc.stdout.strip
        # Typical: .../hostH/targetH:C:T/H:C:T:L/block/sdX
        # Extract H:C:T:L using some regex
        hctl_info_command = "p='#{link}'; " \
                            'case "$p" in ' \
                            '*/host*/*/target*/*:*:*:*/block/*) echo "$p" | ' \
                            "awk -F'/' '{print $(NF-2)}' ;; " \
                            '*) echo "" ;; esac'

        rc = @provider.action.ssh(
            :cmds => hctl_info_command,
            :host => host,
            :nostdout => false
        )
        raise "Failed to get hctl info for #{device}" if rc.code != 0

        hctl = rc.stdout.strip
        scsi_host, channel, idv, lun = (hctl.split(':') + [nil, nil, nil, nil])[0, 4]

        { :device => device, :host => scsi_host, :channel => channel, :id => idv, :lun => lun }
    end

    def device_size_b(host, device_path)
        script = <<~BASH
            CMD=$(command -v blockdev 2>/dev/null || echo /usr/sbin/blockdev)
            $CMD --getsize64 #{device_path}
        BASH

        rc = @provider.action.ssh(
            :cmds => script,
            :host => host,
            :nostdout => false
        )
        raise "Failed to get size for #{device_path}" if rc.code != 0

        rc.stdout.strip.to_i
    end

    def device_size_mb(host, device_path)
        device_size_b(host, device_path) / 1024 / 1024
    end

    def device_size(host, device_path)
        device_size_mb(host, device_path)
    end

    def process_lun_id(lun_ids)
        if lun_ids.is_a?(Array)
            lun_ids.map {|l| format_lun_id(l) }
        else
            format_lun_id(lun_ids)
        end
    end

    def sysfs_wwn(host, devices, mpath = nil)
        if mpath
            begin
                dm = sd_from_path(host, mpath[:device])
                rc = @provider.action.ssh(
                    :cmds => "cat /sys/block/#{File.basename(dm)}/dm/uuid",
                    :host => host,
                    :nostdout => false
                )
                wwid = rc.stdout.strip[6..-1]
                return wwid if wwid && !wwid.empty?
            rescue StandardError => e
                raise "Could not get WWN for multipath device #{mpath}: #{e}"
            end
        end

        # Normalize once for correct comparisons later
        dev_basenames = Array(devices).map {|d| File.basename(d.to_s) }

        wwid = sysfs_wwid(host, devices)
        glob_pattern = '/dev/disk/by-id/scsi-'
        rc = @provider.action.ssh(
            :cmds => "ls #{glob_pattern}*",
            :host => host,
            :nostdout => false
        )
        raise 'Could not list SCSI devices' if rc.code != 0

        wwn_paths = rc.stdout.strip.split("\n")

        if wwid && wwn_paths.include?("#{glob_pattern}#{wwid}")
            return wwid
        end

        wwn_paths.each do |wwn_path|
            begin
                rc = @provider.action.ssh(
                    :cmds => "test -L '#{wwn_path}'",
                    :host => host,
                    :nostdout => false,
                    :silent => true
                )
                next if rc.code != 0

                # wwn_path = @provider.action.ssh(
                resolved = @provider.action.ssh(
                    :cmds => "readlink -f '#{wwn_path}'",
                    :host => host,
                    :nostdout => false,
                    :silent => true
                ).stdout.to_s.strip

                if resolved.start_with?('/dev/')
                    name = resolved[5..-1] # "dm-7" or "sdd"

                    if name.start_with?('dm-')
                        slaves_path = "/sys/block/#{name}/slaves"
                        rc = @provider.action.ssh(
                            :cmds => "ls #{slaves_path}",
                            :host => host,
                            :nostdout => false
                        )
                        slaves = rc.stdout.to_s.strip.split("\n").reject \
                            {|s| ['.', '..'].include?(s) }

                        # if devices.any? {|d| slaves.include?(d) }
                        if dev_basenames.any? {|d| slaves.include?(d) }
                            # return wwn_path[glob_pattern.length..-1]
                            return File.basename(wwn_path).sub(/^scsi-/, '')
                        end
                    # elsif devices.include?(name)
                    #     return wwn_path[glob_pattern.length..-1]
                    elsif dev_basenames.include?(name)
                        return File.basename(wwn_path).sub(/^scsi-/, '')
                    end
                end
            rescue StandardError => e
                raise "Could not get WWN for device #{wwn_path}: #{e}"
            end
        end

        ''
    end

    def sysfs_wwid(host, devices)
        devices.each do |device|
            rc = @provider.action.ssh(
                :cmds => "cat /sys/block/#{File.basename(device)}/device/wwid",
                :host => host,
                :nostdout => false
            )
            next if rc.code != 0

            wwid = rc.stdout.to_s.strip
            next if wwid.empty?

            return wwid if wwid && !wwid.empty?

            udev_wwid  = WWN_TYPES[wwid[0..3]] || '8'
            udev_wwid << wwid[4..-1]
            return udev_wwid
        end

        ''
    end

    def scsi_wwn(host, path)
        rc = @provider.action.ssh(
            :cmds => format(SCSI_WWN_COMMAND, path),
            :host => host,
            :nostdout => false
        )
        return if rc.code != 0

        rc.stdout.strip
    end

    def multipath_running?(host)
        rc = @provider.action.ssh(
            :cmds => 'sudo multipathd show status',
            :host => host,
            :nostdout => false
        )
        raise 'Could not get multipath status' if rc.code != 0

        running = rc.code == 0 && !rc.stdout.strip.start_with?('error receiving packet')
        return true if running

        false
    end

    def dm_name(host, dm)
        rc = @provider.action.ssh(
            :cmds => "cat /sys/block/#{dm}/dm/name",
            :host => host,
            :nostdout => false
        )
        return '' if rc.code != 0

        rc.stdout.strip
    end

    def find_sysfs_multipath_dm(host, devices)
        real_devices = devices.map {|d| sd_from_path(host, d) }.compact
        return if real_devices.empty?

        cmd = real_devices.map do |d|
            "bn=$(basename #{d}); ls -1 /sys/block/$bn/holders 2>/dev/null || true"
        end.join(' ; ')

        rc = @provider.action.ssh(:cmds => cmd, :host => host, :nostdout => false)
        dm = rc.stdout.to_s.split("\n").find {|l| l.start_with?('dm-') }
        dm ? dm.strip : nil
    end

    def needs_flush?(host, path, path_used, was_multipath)
        return false if was_multipath
        return false unless path_used

        path = @provider.action.ssh(
            :cmds => "readlink -f #{path}",
            :host => host,
            :nostdout => false,
            :silent => true
        ).stdout.strip

        path_used = @provider.action.ssh(
            :cmds => "readlink -f #{path_used}",
            :host => host,
            :nostdout => false,
            :silent => true
        ).stdout.strip

        return true if path == path_used

        return !was_multipath && path.split(path_used)[0] != '/dev/'
    end

    def running_long?(time)
        (Time.now - time) > 5
    end

    def remove_connection(
        host = false,
        force: false,
        path_used: nil,
        was_multipath: false
    )
        start_time = Time.now
        devices_names = by_path_devices(host)
        if running_long?(start_time)
            OpenNebula::DriverLogger.log_info \
                "Removing connection took #{Time.now - start_time} seconds"
        end
        start_time = Time.now

        multipath_dm = find_sysfs_multipath_dm(host, devices_names)
        if running_long?(start_time)
            OpenNebula::DriverLogger.log_info \
                "Finding multipath device took #{Time.now - start_time} seconds"
        end
        start_time = Time.now
        multipath_name = multipath_dm ? dm_name(host, multipath_dm) : nil
        if running_long?(start_time)
            OpenNebula::DriverLogger.log_info \
                "Finding multipath name took #{Time.now - start_time} seconds"
        end
        start_time = Time.now

        # Handle Multipath
        if multipath_name
            begin
                flush_multipath_device(host, multipath_name)
                multipath_name = nil # Mark as flushed
            rescue StandardError => e
                raise e unless force

                multipath_name = nil # indicates it's missing
            end
        end
        if running_long?(start_time)
            OpenNebula::DriverLogger.log_info \
                "Flushing multipath device took #{Time.now - start_time} seconds"
        end
        start_time = Time.now

        # Check if multipathd is running
        multipath_running = multipath_running?(host)

        # Remove each device
        threads = devices_names.map do |device_name|
            next unless device_name

            Thread.new do
                max_attempts = 10
                attempts     = 0

                # Tell multipathd to remove the path (if running)
                begin
                    start_time = Time.now
                    multipath_del_path(host, device_name) if multipath_running
                    if running_long?(start_time)
                        OpenNebula::DriverLogger.log_info \
                            "Removing path from multipathd took #{Time.now - start_time} seconds"
                    end

                    # Determine if flush is needed

                    flush = needs_flush?(host, device_name, path_used, was_multipath)

                    # Remove the SCSI device
                    start_time = Time.now
                    remove_scsi_device(host, device_name, :flush => flush)
                    if running_long?(start_time)
                        OpenNebula::DriverLogger.log_info \
                            "Removing SCSI device took #{Time.now - start_time} seconds"
                    end
                rescue StandardError => e
                    raise e unless force

                    attempts += 1
                    if attempts < max_attempts
                        sleep 1
                        retry
                    end

                    raise e
                end
            end
        end

        threads.each(&:join)

        if running_long?(start_time)
            OpenNebula::DriverLogger.log_info \
                "Removing devices took #{Time.now - start_time} seconds"
        end
        start_time = Time.now

        # Wait for device removal
        begin
            wait_for_device_removal(host, devices_names)
            if running_long?(start_time)
                OpenNebula::DriverLogger.log_info \
                    "Waiting for device removal took #{Time.now - start_time} seconds"
            end
        rescue StandardError => e
        ensure
            # Cleanup symlinks
            remove_scsi_symlinks(host, devices_names)
        end

        multipath_name
    end

    def remove_scsi_symlinks(host, devices)
        find_command  = 'sudo find /dev/disk/by-id -type l \('
        find_command << devices.map {|d| " -lname '#{d}'" }.join(' -o ')
        find_command << ' \) -exec unlink {} \;'

        rc = @provider.action.ssh(
            :cmds => find_command,
            :host => host,
            :nostderr => false
        )
        return if rc.code != 0 && rc.stderr.include?('No such file or directory')

        raise "Could not remove SCSI symlinks: #{rc.stderr}" if rc.code != 0
    end

    def flush_device_io(host, device)
        rc = @provider.action.ssh(
            :cmds => "test -e #{device}",
            :host => host,
            :nostdout => false
        )
        raise "Device #{device} not found" if rc.code != 0

        with_retry do
            Timeout.timeout(30) do
                rc = @provider.action.ssh(
                    :cmds     => format(SYNC_COMMAND, device),
                    :host     => host,
                    :nostderr => false,
                    :silent   => true
                )
                raise "Could not flush device #{device}: #{rc.stderr}" if rc.code != 0
            end
        end
    end

    def flush_multipath_device(host, device)
        with_retry do
            Timeout.timeout(30) do
                rc = @provider.action.ssh(
                    :cmds     => "sudo multipath -f #{device}",
                    :host     => host,
                    :nostderr => false,
                    :silent   => true
                )
                next if rc.stderr.include?('is not a valid argumen')
                raise "Could not flush multipath device #{device}: #{rc.stderr}" \
                    if rc.code != 0
            end
        end
    end

    def wait_for_path(host, path)
        with_retry(:retries => 60, :delay => 0.5) do
            rc = @provider.action.ssh(
                :cmds => "udevadm settle --timeout=6; test -e #{path}",
                :host => host,
                :silent => true
            )
            raise "Path #{path} not found" if rc.code != 0
        end
        true
    end

    def wait_for_rw(host, wwn, device_path)
        with_retry(:retries => 10, :delay => 0.5) do
            Timeout.timeout(30) do
                rc = @provider.action.ssh(
                    :cmds     => 'lsblk -J -o NAME,RO',
                    :host     => host,
                    :nostdout => false,
                    :silent   => true
                )
                raise "Could not get lsblk data: #{rc.stderr}" if rc.code != 0

                data = JSON.parse(rc.stdout)
                data['blockdevices'].each do |device|
                    name = device['name']
                    ro   = device['ro']

                    next if !name.include?(wwn) || !ro

                    @provider.action.ssh(
                        :cmds => 'sudo multipath -r',
                        :host => host
                    )
                    raise "Multipath device #{device_path} is still read-only"
                end
            end
            true
        end
    end

    def session_data(host, session)
        glob_pattern = "/sys/class/iscsi_host/host*/device/session#{session}/target*"
        rc = @provider.action.ssh(
            :cmds => "ls -d #{glob_pattern}",
            :host => host,
            :nostdout => false,
            :silent => true
        )
        # return if rc.code != 0

        paths = rc.stdout.to_s.split("\n").compact

        if paths.any?
            _, channel, target = paths.first.split('/').last.split(':')
        else
            target = channel = '-'
            glob_pattern = "/sys/class/iscsi_host/host*/device/session#{session}"
            rc = @provider.action.ssh(
                :cmds => "ls -d #{glob_pattern}",
                :host => host,
                :nostdout => false,
                :silent => true
            )

            # A session that vanished between listing and lookup has no
            # entry; fall through to the raise rather than returning nil,
            # which callers would index
            paths = rc.code == 0 ? rc.stdout.to_s.split("\n").compact : []
        end

        if paths.empty?
            raise "Could not find iSCSI device for session #{session} with LUN ID #{id}"
        end

        scsi_host = paths.first[/host(\d+)/, 1]

        { :host => scsi_host, :channel => channel, :target => target, :id => id }
    end

    def scan_scsi(host, scsi_host, channel = '-', target = '-')
        # SCSI_SCAN_COMMAND = "echo '%s %s %s' > /sys/class/scsi_host/host%s/scan"
        scan_command = format(SCSI_SCAN_COMMAND, channel, target, id, scsi_host)
        with_retry(:retries => 3, :delay => 1) do
            @provider.action.ssh(
                :cmds => scan_command,
                :host => host,
                :err_msg => "Scsi scan failed: #{scan_command}"
            )
        end
    end

    def find_device_by_hctl(host, session)
        hctl = session_data(host, session)

        glob_pattern  = "/sys/class/scsi_host/host#{hctl[:host]}"
        glob_pattern << "/device/session#{hctl[:session]}"
        glob_pattern << "/target#{hctl[:host]}:#{hctl[:channel]}:#{hctl[:target]}"
        glob_pattern << "#{target_path}/#{hctl[:host]}:#{hctl[:channel]}:#{hctl[:target]}:"
        glob_pattern << "#{hctl[:id]}/block/*"

        device = @provider.action.ssh(
            :cmds => "ls #{glob_pattern}",
            :host => host,
            :nostdout => false
        )
        return if device.code != 0

        File.basename(device.stdout.split("\n").compact.first)
    end

    def find_multipath_device_path(host, wwn)
        paths = [
            "/dev/disk/by-id/dm-uuid-mpath-#{wwn}",
            "/dev/mapper/#{wwn}"
        ]

        paths.each do |path|
            return path if wait_for_path(host, path)
        end

        return false
    end

    def find_multipath_device(host, device)
        rc = @provider.action.ssh(
            :cmds => "sudo multipath -l #{device}",
            :host => host,
            :nostdout => false,
            :nostderr => false
        )
        raise "Could not find multipath device #{device}: #{rc.stderr}" if rc.code != 0

        lines = rc.stdout.split("\n").map(&:strip).reject(&:empty?)
        return if lines.empty?

        mdev_name = lines[0].split.first
        mdev_path = "/dev/mapper/#{mdev_name}"

        mdev_exists = wait_for_path(host, mdev_path)

        return unless mdev_exists

        devices = Array(lines[3..-1]).each_with_object([]) do |line, arr|
            next if line.include?('policy') || line.strip.empty?

            # Skip lines with tree characters (like "|-", "`-", etc.)
            next if line =~ /^[`|+-]/ && line.include?(':')

            parts = line.split(/\s+/) # Split on any whitespace
            next unless parts.size >= 3

            # Extract SCSI address (e.g., "4:0:0:50" from "4:0:0:50 sdd 8:48")
            address = parts[0].split(':')
            next unless address.size == 4

            arr << {
                :device => "/dev/#{parts[1]}", # Actual device name (sdd)
                :host => address[0],
                :channel => address[1],
                :id => address[2],
                :lun => address[3]
            }
        end

        {
            :device => mdev_path,
            :name => mdev_name,
            :devices => devices
        }
    end

    def multipath_reconfigure(host)
        @provider.action.ssh(
            :cmds => 'sudo multipathd reconfigure',
            :host => host,
            :nostdout => false
        ).stdout
    end

    def multipath_resize_map(host, dm_path)
        if dm_path.start_with?('/dev/disk/by-')
            dm_path = sd_from_path(host, dm_path)
        end

        command = "sudo multipathd resize map #{dm_path}"
        rc = @provider.action.ssh(
            :cmds => command,
            :host => host,
            :nostdout => false
        )

        if rc.stdout.include?('fail') || rc.stdout.include?('timeout')
            raise "Could not resize map #{dm_path}"
        end

        rc.stdout
    end

    def refresh_size(host, device_path)
        by_path_devices(host).each do |sd_path|
            device    = device_info(host, sd_path)
            device_id = "#{device[:host]}:#{device[:channel]}:#{device[:id]}:#{id}"

            @provider.action.ssh(
                :cmds     => "echo '1' | sudo tee " \
                             "/sys/bus/scsi/drivers/sd/#{device_id}/rescan >/dev/null",
                :host     => host,
                :nostderr => false
            )
        end

        if multipath_running?(host)
            map = device_path
            map = File.basename(map) if map.start_with?('/dev/mapper/')

            begin
                multipath_resize_map(host, map)
            rescue StandardError => e
                OpenNebula::DriverLogger.log_warning \
                    "Could not resize multipath map #{map}: #{e.message}"
            end
        end

        device_size_b(host, device_path)
    end

    def update_size(host, original_size, multipath: true)
        device_paths = by_path_devices(host)

        device_paths.each do |device_path|
            unless check_valid_device(host, device_path)
                raise "Path status is down for #{device_path}, cannot update size"
            end
        end

        new_size = 0

        device_paths.each do |device_path|
            device     = device_info(host, device_path)
            device_id  = "#{device[:host]}:#{device[:channel]}:#{device[:id]}:#{id}"
            scsi_path  = "/sys/bus/scsi/drivers/sd/#{device_id}"
            start_size = original_size * 1024 * 1024

            attempts = 0
            with_retry(:retries => 10, :delay => 1) do
                attempts += 1
                rc = @provider.action.ssh(
                    :cmds => "echo '1' | sudo tee #{scsi_path}/rescan",
                    :host => host,
                    :nostderr => false
                )
                sleep 0.05

                new_size = device_size(host, device_path)
                raise "Could not update size for #{device_path}: #{rc.stderr}" \
                    if new_size == start_size
            end
        end

        scsi_wwn = scsi_wwn(host, device_paths.first)

        if multipath
            mpath_device = find_multipath_device_path(host, scsi_wwn)
            if mpath_device
                multipath_reconfigure(host)
                multipath_resize_map(host, mpath_device)

                new_size = device_size(host, mpath_device)
            end
        end

        new_size
    end

    # Removes devices that sit at this LUN id on the target's sessions but
    # report another LUN, left behind when that LUN was unmapped or deleted
    # without the host being cleaned up. The kernel does not re-probe an id
    # that still has a device, so until it is gone the LUN just mapped never
    # shows up there.
    #
    # Only devices that are provably dead are removed: not held by any
    # device-mapper map, and the provider confirms (stale_lun_released?) that
    # the LUN they report is gone from the array or mapped nowhere. Anything
    # else is left in place for foreign_device? to report. Runs before the
    # scan, so a by-path link shared by several sessions to one portal cannot
    # keep resolving to a stale device on one of them.
    def clear_stale_devices(host, sessions, lun_id)
        return unless respond_to?(:expected_wwn) && respond_to?(:stale_lun_released?)

        expected = expected_wwn
        return if expected.nil? || expected.empty?

        globs = sessions.map do |s|
            "/sys/class/iscsi_session/session#{s[:session]}/device/target*/*:#{lun_id}/block/*"
        end

        script = <<~BASH
            for b in #{globs.join(' ')}; do
                [ -e "$b" ] || continue
                n=$(basename "$b")
                h=$(ls "/sys/block/$n/holders" 2>/dev/null | wc -l)
                w=$(cat "/sys/block/$n/device/wwid" 2>/dev/null)
                echo "$n $h $w"
            done
        BASH

        rc = @provider.action.ssh(
            :cmds => script,
            :host => host,
            :nostdout => false,
            :silent => true
        )
        return if rc.code != 0

        released = Hash.new {|h, wwid| h[wwid] = stale_lun_released?(wwid) }
        stale    = []

        rc.stdout.to_s.split("\n").each do |line|
            name, holders, wwid = line.split(' ', 3)
            next if wwid.nil? || wwid.empty?
            next if wwid.downcase.end_with?(expected.downcase)

            if holders.to_i > 0
                OpenNebula::DriverLogger.log_warning \
                    "Stale device /dev/#{name} at LUN #{lun_id} reports #{wwid} but is " \
                    'held by a device-mapper map; leaving it in place'
                next
            end

            stale << name if released[wwid]
        end

        return if stale.empty?

        cmd = stale.map do |name|
            "echo 1 | sudo tee /sys/block/#{name}/device/delete >/dev/null"
        end.join(' ; ')

        @provider.action.ssh(
            :cmds => cmd,
            :host => host,
            :err_msg => "Could not remove stale devices #{stale.join(', ')}"
        )
        wait_for_device_removal(host, stale)

        @__sd_cache&.delete_if {|_, dev| stale.include?(File.basename(dev.to_s)) }

        OpenNebula::DriverLogger.log_warning \
            "Removed stale devices #{stale.join(', ')} at LUN #{lun_id}: the LUN " \
            'they reported is no longer mapped on the array'
    rescue StandardError => e
        OpenNebula::DriverLogger.log_warning \
            "Could not clear stale devices at LUN #{lun_id}: #{e.message}"
    end

    # True when the device at our by-path is not the LUN we mapped, because a
    # LUN that held this id earlier was unmapped without the host being cleaned
    # up. Reports and skips the path. Devices that are provably dead have
    # already been removed by clear_stale_devices; one that is still here could
    # not be shown dead (it is held by a map, or its LUN still has a mapping,
    # possibly through an id that is not ours), so it is left alone.
    def foreign_device?(host, dev)
        return false unless respond_to?(:expected_wwn)

        expected = expected_wwn
        return false if expected.nil? || expected.empty?

        actual = sysfs_wwid(host, [dev]).to_s
        return false if actual.empty?
        return false if actual.downcase.end_with?(expected.downcase)

        OpenNebula::DriverLogger.log_warning \
            "Device #{dev} at LUN #{id} reports #{actual}, which is not the LUN " \
            'just mapped. Skipping it as stale; the host needs a SCSI rescan ' \
            'to clear it.'

        true
    end

    def verify_wwn(wwn, devices)
        return unless respond_to?(:expected_wwn)

        expected = expected_wwn
        return if expected.nil? || expected.empty?
        return if wwn.to_s.downcase.end_with?(expected.downcase)

        raise "Device #{devices} for LUN #{id} reports WWN #{wwn}, which does " \
              "not match the expected serial (#{expected}). Likely " \
              'a stale device from a LUN that previously held this id.'
    end

    def multipath_add_wwid(host, wwid)
        rc = @provider.action.ssh(
            :cmds => "sudo multipath -a #{wwid}",
            :host => host,
            :err_msg => "Could not add WWID #{wwid}",
            :nostderr => false
        )
        unless rc.code == 0
            OpenNebula::DriverLogger.log_error \
                "Could not add WWID #{wwid} on host #{host}: #{rc.stderr}"
        end
        rc.code == 0
    end

    def multipath_add_path(host, path)
        rc = @provider.action.ssh(
            :cmds => "sudo multipathd add path #{path}",
            :host => host,
            :nostderr => false
        )
        return if rc.code == 0

        mpath_check = @provider.action.ssh(
            :cmds => "sudo multipathd show path #{path}",
            :host => host,
            :nostdout => false
        )
        if mpath_check.code == 0 && mpath.stdout.include?('running')
            OpenNebula::DriverLogger.log_info "Path #{path} already exists on host #{host}"
            return
        end
        OpenNebula::DriverLogger.log_error \
            "Could not add path #{path} on host #{host}: #{rc.stderr}"
    end

    def multipath_del_path(host, path)
        @provider.action.ssh(
            :cmds => "sudo multipathd del path #{path}",
            :host => host,
            :err_msg => "Could not delete path #{path}"
        )
    end

    def multipath_del_map(host, mpath)
        map_name = dm_name(mpath)
        return unless map_name

        rc = @provider.action.ssh(
            :cmds => "sudo multipathd del map #{map_name}",
            :host => host
        )
        if rc.code != 0
            OpenNebula::DriverLogger.log_error \
                "Could not delete map #{map_name} on host #{host}: #{rc.stderr}"
            return
        end

        raise "Could not delete map #{map_name} on host #{host}: #{rc.stderr}" \
            if dm_name(mpath)
    end

    def wait_for_mpath_device(host, mpath)
        return if mpath.nil?

        with_retry(:retries => 30, :delay => 0.5) do
            Timeout.timeout(30) do
                rc = @provider.action.ssh(
                    :cmds => "sudo multipath -C #{sd_from_path(host, mpath[:device])}",
                    :host => host,
                    :nostdout => false,
                    :silent => true
                )
                raise "Could not find multipath device #{mpath}" if rc.code != 0

                return true
            end
        end
    end

    def portal_sessions(host, target)
        session_command =  "sudo iscsiadm -m session -P3 | awk -v target=\"#{target}\" '"
        session_command << <<~AWK
            /^Target:/ {
                if (index($0, target)) {
                    in_target = 1
                } else {
                    in_target = 0
                }
                next
            }

            in_target && /Current Portal:/ {
                # Split on ": " to get the portal value (e.g., "10.0.1.204:3260,1029")
                split($0, parts, ": ")
                portal = parts[2]
                sub(/,.*/, "", portal)
                next
            }

            in_target && /SID:/ {
                print portal, $NF
            }'
        AWK

        rc = @provider.action.ssh(
            :cmds => session_command,
            :host => host,
            :nostdout => false,
            :nostderr => false,
            :forward => true
        )
        raise "Could not get sessions for target #{target}: #{rc.stderr}" if rc.code != 0

        rc.stdout.split("\n").map {|s| { :portal => s.split[0], :session => s.split[1] } }
    end

    def setup_disk(host: false)
        device_path = '/dev/disk/by-path/ip-%s-iscsi-%s-lun-%s'
        warned      = {}

        with_retry(RuntimeError, :retries => 3, :delay => 1) do
            sessions_data = portal_sessions(host, @provider.target)
            raise "No iSCSI sessions for target #{@provider.target}" if sessions_data.nil?

            devices = []
            errors  = []
            mutex   = Mutex.new
            lun_id  = id

            clear_stale_devices(host, sessions_data, lun_id)

            threads = sessions_data.map do |session|
                Thread.new do
                    begin
                        hctl = session_data(host, session[:session])
                        scan_scsi(host, hctl[:host], hctl[:channel], hctl[:target])

                        path = format(device_path, session[:portal], @provider.target, lun_id)
                        wait_for_path(host, path)

                        dev = sd_from_path(host, path)

                        if foreign_device?(host, dev)
                            raise "#{path} holds a stale device for another LUN"
                        end

                        mutex.synchronize { devices << dev }
                    rescue StandardError => e
                        mutex.synchronize do
                            errors << "portal #{session[:portal]}: #{e.message}"
                        end
                    end
                end
            end

            threads.each(&:join)

            # Surface paths that never showed up even when others did: the
            # copy will succeed on the remaining paths and the failure would
            # otherwise only appear at teardown.
            errors.each do |error|
                next if warned[error]

                warned[error] = true
                OpenNebula::DriverLogger.log_warning \
                    "No path to LUN #{lun_id} via #{error}"
            end

            if devices.empty?
                mapping = respond_to?(:describe) ? describe : "LUN #{lun_id}"
                portals = sessions_data.map {|s| s[:portal] }.join(', ')
                reason  = errors.empty? ? '' : ": #{errors.last}"

                raise "No device for #{mapping} on any portal (#{portals})#{reason}"
            end

            devices.each {|dev| multipath_add_path(host, dev) }

            mpath = find_multipath_device(host, devices.first)

            if mpath.nil? && devices.size == 1
                # With find_multipaths enabled multipathd will not build a map
                # for a device with a single path unless its WWID is already
                # known, and a LUN that only some of the portals report
                # legitimately has one path. Register it rather than failing the
                # deployment over a working, if degraded, device.
                wwid = scsi_wwn(host, devices.first)

                if wwid && !wwid.empty?
                    OpenNebula::DriverLogger.log_warning \
                        "LUN #{lun_id} was found on a single path " \
                        "(#{devices.first}): registering WWID #{wwid} so " \
                        'multipath can map it'

                    multipath_add_wwid(host, wwid)
                    multipath_reconfigure(host)
                    multipath_add_path(host, devices.first)

                    mpath = find_multipath_device(host, devices.first)
                end
            end

            raise "Could not find multipath device for #{devices}" if mpath.nil?

            wait_for_mpath_device(host, mpath)
            # return sd_from_path(host, "/dev/mapper/#{sysfs_wwn(host, devices, mpath)}")
            wwn = sysfs_wwn(host, devices, mpath)
            raise "Could not get WWN for multipath device #{mpath}" if wwn.nil?

            verify_wwn(wwn, devices)

            wwn_path = "/dev/mapper/#{wwn}"
            wait_for_rw(host, wwn, wwn_path)
            return "/dev/mapper/#{wwn}"
        end
    end

end
