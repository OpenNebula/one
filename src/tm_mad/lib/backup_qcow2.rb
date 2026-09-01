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

require 'base64'
require 'getoptlong'

require_relative 'backup_command'
require_relative 'backup_kvm'

if __FILE__ == $PROGRAM_NAME
    opts = GetoptLong.new(
        ['--disk', '-d', GetoptLong::REQUIRED_ARGUMENT],
        ['--vxml', '-x', GetoptLong::REQUIRED_ARGUMENT],
        ['--path', '-p', GetoptLong::REQUIRED_ARGUMENT],
        ['--live', '-l', GetoptLong::NO_ARGUMENT],
        ['--stop', '-s', GetoptLong::NO_ARGUMENT]
    )

    begin
        path = disk = vxml = ''
        live = stop = false

        opts.each do |opt, arg|
            case opt
            when '--disk'
                disk = arg
            when '--path'
                path = arg
            when '--live'
                live = true
            when '--stop'
                stop = true
            when '--vxml'
                vxml = arg
            end
        end

        vm = KVMDomain.new(Base64.decode64(File.read(vxml)), path,
                           :backup_dir => File.dirname(vxml))

        #---------------------------------------------------------------------------
        # Stop operation. Only for full backups in live mode. It blockcommits
        # changes and cleans snapshot.
        #---------------------------------------------------------------------------
        if stop
            if vm.parent_id == -1 && live && @inc_mode != :snapshot
                vm.stop_backup_full_live(disk)
            end

            exit(0)
        end

        #---------------------------------------------------------------------------
        # Cancel logic. When SIGTERM is received it kills all subtasks and
        # terminates current backup operation
        #---------------------------------------------------------------------------
        pipe_r, pipe_w = IO.pipe

        Thread.new do
            loop do
                rs, _ws, _es = IO.select([pipe_r])
                break if rs[0] == pipe_r
            end

            Cancel.killall_subtasks

            exit(-1)
        end

        Signal.trap(:TERM) do
            pipe_w.write 'W'
        end

        #---------------------------------------------------------------------------
        # Backup operation
        #   - (live - full) Creates a snapshot to copy the disks via qemu-convert
        #     all previous defined checkpoints are cleaned.
        #   - (live - increment) starts a backup operation in libvirt and pull changes
        #     through NBD server using qemu-io copy-on-read feature
        #   - (poff - full) copy disks via qemu-convert
        #   - (poff - incremental) starts qemu-nbd server to pull changes from the
        #     last checkpoint
        #
        #  Interactive backups
        #   When interactive mode is enabled, the TM prepares the disk export sources,
        #   starts the OneBEX server, and waits for an external backup server to start
        #   the export of the backup.
        #---------------------------------------------------------------------------
        backup_type = if vm.parent_id == -1
                          :full
                      elsif vm.inc_mode == :cbt
                          :cbt
                      else
                          :snapshot
                      end

        case backup_type
        when :full
            vm.clean_checkpoints(disk, true) if live

            if live && vm.interactive
                vm.backup_full_live_interactive(disk)
            elsif live
                vm.backup_full_live(disk)
            elsif vm.interactive
                vm.backup_full_interactive(disk)
            else
                vm.backup_full(disk)
            end

        when :cbt
            vm.define_parent(disk) if live

            if live && vm.interactive
                vm.backup_nbd_live_interactive(disk)
            elsif live
                vm.backup_nbd_live(disk)
            elsif vm.interactive
                vm.backup_nbd_interactive(disk)
            else
                vm.backup_nbd(disk)
            end

            vm.clean_checkpoints(disk) if live

        when :snapshot
            if live
                vm.backup_snapshot_live(disk)
            else
                vm.backup_snapshot(disk)
            end
        end
    rescue StandardError => e
        puts e.message
        exit(-1)
    end
end
