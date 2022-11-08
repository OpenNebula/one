#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                #
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

require 'json'
require 'open3'
require 'rexml/document'
require 'base64'
require 'getoptlong'

require_relative './kvm'

# rubocop:disable Style/GlobalVars
# rubocop:disable Style/ClassVars

#---------------------------------------------------------------------------
# Helper module to execute commands
#---------------------------------------------------------------------------
module Command

    def cmd(command, args, opts = {})
        opts.each do |key, value|
            if value.class == Array
                value.each {|v| command << render_opt(key, v) }
            else
                command << render_opt(key, value)
            end
        end

        File.write($debug, "#{command} #{args}\n", { mode => 'a' }) if $debug

        out, err, rc = Open3.capture3("#{command} #{args}")

        if rc.exitstatus != 0
            raise StandardError, "Error executing '#{command} #{args}':\n#{out} #{err}"
        end

        out
    end

    def render_opt(name, value)
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

#-------------------------------------------------------------------------------
# Setup an NBD server to pull changes, an optional map can be provided
#-------------------------------------------------------------------------------
module Nbd

    @@server = nil

    def self.start_nbd(file, map = '')
        return unless @@server.nil?

        @@socket = "#{File.realpath(file)}.socket"
        @@server = fork do
            args  = ['-r', '-k', @@socket, '-f', 'qcow2', '-t']
            args << '-B' << map unless map.empty?
            args  = file

            exec('qemu-nbd', *args)
        end

        sleep(1) # TODO: inotify or poll for @@socket
    end

    def self.stop_nbd
        Process.kill('QUIT', @@server)
        Process.waitpid(@@server)

        File.unlink(@@socket)

        @@server = nil
    end

    def self.uri
        "nbd+unix:///?socket=#{@@socket}"
    end

end

# ------------------------------------------------------------------------------
# This class abstracts the information and several methods to operate over
# disk images files
# ------------------------------------------------------------------------------
class QemuImg

    include Command

    def initialize(path)
        @path  = path
        @_info = nil

        @path  = File.realpath(path) if File.exist?(path)
    end

    #---------------------------------------------------------------------------
    # qemu-img command methods
    #---------------------------------------------------------------------------
    QEMU_IMG_COMMANDS = %w[convert create rebase info bitmap]

    QEMU_IMG_COMMANDS.each do |command|
        define_method(command.to_sym) do |args = '', opts|
            cmd("qemu-img #{command}", "#{@path} #{args}", opts)
        end
    end

    #---------------------------------------------------------------------------
    #  Image information methods
    #---------------------------------------------------------------------------
    def [](key)
        if !@_info
            out    = info(:output => 'json', :force_share => '')
            @_info = JSON.parse(out)
        end

        @_info[key]
    end

    #---------------------------------------------------------------------------
    # Pull changes since last checkpoint through the NBD server in this image
    #   1. Get list of dirty blocks
    #   2. Create increment qcow2 using NBD as backing file
    #   3. Pull changes reading (copy-on-write)
    #
    # Note: Increment files neeed rebase to reconstruct the increment chain
    #---------------------------------------------------------------------------
    def pull_changes(uri, map)
        exts = if !map || map.empty?
                   #TODO change for pattern include zero
                   extents(uri, '', 'data')
               else
                   extents(uri, map, 'dirty')
               end

        rc, msg = create(:f => 'qcow2', :F => 'raw', :b => uri)

        return [false, msg] unless rc

        exts.each do |e|
            cmd('qemu-io', @path,
                :C => '',
                :c => "\"r #{e['offset']} #{e['length']}\"",
                :f => 'qcow2')
        end
    end

    private

    #---------------------------------------------------------------------------
    # Gets the dirty extent information from the given map using an NBD server
    #---------------------------------------------------------------------------
    def extents(uri, map, description)
        opts = { :json => '' }

        if !map.empty?
            opts[:map=] = map
        else
            opts[:map]  = ''
        end

        out = cmd('nbdinfo', uri, opts)

        bmap = JSON.parse(out)
        exts = []

        bmap.each do |e|
            next if !e || e['description'] != description

            exts << e
        end

        exts
    end

end

# ------------------------------------------------------------------------------
# This class represents a KVM domain, includes information about the associated
# OpenNebula VM
# ------------------------------------------------------------------------------
class KVMDomain

    include TransferManager::KVM
    include Command

    attr_reader :parent_id, :backup_id, :checkpoint

    #---------------------------------------------------------------------------
    # @param vm[REXML::Document] OpenNebula XML VM information
    # @param opts[Hash] Vm attributes:
    #   - :vm_dir VM folder (/var/lib/one/datastores/<DS_ID>/<VM_ID>)
    #---------------------------------------------------------------------------
    def initialize(vm_xml, opts = {})
        @vm  = REXML::Document.new(vm_xml).root

        @vid = @vm.elements['ID'].text
        @dom = @vm.elements['DEPLOY_ID'].text

        @backup_id = 0
        @parent_id = -1

        @checkpoint = false

        mode = @vm.elements['BACKUPS/BACKUP_CONFIG/MODE']

        if mode
            case mode.text
            when 'FULL'
                @backup_id = 0
                @parent_id = -1

                @checkpoint = false
            when 'INCREMENT'
                li = @vm.elements['BACKUPS/BACKUP_CONFIG/LAST_INCREMENT_ID'].text.to_i

                @backup_id = li + 1
                @parent_id = li

                @checkpoint = true
            end
        end

        @vm_dir  = opts[:vm_dir]
        @tmp_dir = "#{opts[:vm_dir]}/tmp"
        @bck_dir = "#{opts[:vm_dir]}/backup"

        @socket  = "#{opts[:vm_dir]}/backup.socket"
        @ongoing = false
        @frozen  = nil
    end

    # "pause" the VM before excuting any FS related operation. The modes are:
    #   - NONE (no operation)
    #   - AGENT (domfsfreeze - domfsthaw)
    #   - SUSPEND (suspend - resume)
    #
    # @return [String, String] freeze and thaw commands
    def fsfreeze
        @frozen = begin
            @vm.elements['/VM/BACKUPS/BACKUP_CONFIG/FS_FREEZE'].text.upcase
        rescue StandardError
            'NONE'
        end

        case @frozen
        when 'AGENT'
            cmd("#{virsh} domfsfreeze", @dom)
        when 'SUSPEND'
            cmd("#{virsh} suspend", @dom)
        end
    end

    def fsthaw
        return unless @frozen

        case @frozen
        when 'AGENT'
            cmd("#{virsh} domfsthaw", @dom)
        when 'SUSPEND'
            cmd("#{virsh} resume", @dom)
        end
    ensure
        @frozen = nil
    end

    #---------------------------------------------------------------------------
    # Re-define the parent_id checkpoint if not included in the checkpoint-list.
    # If the checkpoint is not present in storage the methods will fail.
    #
    #   @param[String] List of disks to include in the checkpoint
    #   @param[Integer] id of the checkpoint to define
    #---------------------------------------------------------------------------
    def define_checkpoint(disks_s)
        return if @parent_id == -1

        #-----------------------------------------------------------------------
        #  Check if the parent_id checkpoint is already defined for this domain
        #-----------------------------------------------------------------------
        out = cmd("#{virsh} checkpoint-list", @dom, :name => '')
        out.strip!

        check_ids = []

        out.each_line do |l|
            m = l.match(/(one-[0-9]+)-([0-9]+)/)
            next unless m

            check_ids << m[2].to_i
        end

        return if check_ids.include? @parent_id

        #-----------------------------------------------------------------------
        # Try to re-define checkpoint, will fail if not present in storage.
        # Can be queried using qemu-monitor
        #
        # out = cmd("#{virsh} qemu-monitor-command", @dom,
        #           :cmd => '{"execute": "query-block","arguments": {}}')
        #-----------------------------------------------------------------------
        disks = disks_s.split ':'
        tgts  = []

        @vm.elements.each 'TEMPLATE/DISK' do |d|
            did = d.elements['DISK_ID'].text

            next unless disks.include? did

            tgts << d.elements['TARGET'].text
        end

        return if tgts.empty?

        disks = '<disks>'
        tgts.each {|tgt| disks << "<disk name='#{tgt}'/>" }
        disks << '</disks>'

        checkpoint_xml = <<~EOS
            <domaincheckpoint>
                <name>one-#{@vid}-#{@parent_id}</name>
                <creationTime>#{Time.now.to_i}</creationTime>
                #{disks}
            </domaincheckpoint>
        EOS

        cpath = "#{@tmp_dir}/checkpoint.xml"

        File.open(cpath, 'w') {|f| f.write(checkpoint_xml) }

        cmd("#{virsh} checkpoint-create", @dom,
            :xmlfile => cpath, :redefine => '')
    end

    #---------------------------------------------------------------------------
    # Cleans defined checkpoints up to the last one taken for this backup
    #---------------------------------------------------------------------------
    def clean_checkpoints(all = false)
        return unless @checkpoint

        out = cmd("#{virsh} checkpoint-list", @dom, :name => '')
        out.strip!

        out.each_line do |l|
            m = l.match(/(one-[0-9]+)-([0-9]+)/)
            next if !m || (!all && m[2].to_i == @backup_id)

            cmd("#{virsh} checkpoint-delete", "#{@dom} #{m[1]}-#{m[2]}")
        end
    end

    #---------------------------------------------------------------------------
    #  Make a live backup for the VM.
    #   @param [Array] ID of disks that will take part on the backup
    #   @param [Boolean] if true do not generate checkpoint
    #---------------------------------------------------------------------------
    def backup_nbd_live(disks_s)
        disks = disks_s.split ':'

        fsfreeze

        start_backup(disks, @backup_id, @parent_id, @checkpoint)

        fsthaw

        @vm.elements.each 'TEMPLATE/DISK' do |d|
            did = d.elements['DISK_ID'].text
            tgt = d.elements['TARGET'].text

            next unless disks.include? did

            ipath = "#{@bck_dir}/disk.#{did}.#{@backup_id}"
            idisk = QemuImg.new(ipath)

            if @parent_id == -1
                map = ''
            else
                map = "qemu:dirty-bitmap:backup-#{tgt}"
            end

            idisk.pull_changes(mkuri(tgt), map)
        end
    ensure
        fsthaw
        stop_backup
    end

    def backup_full_live(disks_s)
        disks = disks_s.split ':'
        dspec = []
        qdisk = {}

        disk_xml = '<disks>'

        @vm.elements.each 'TEMPLATE/DISK' do |d|
            did = d.elements['DISK_ID'].text
            tgt = d.elements['TARGET'].text

            next unless disks.include? did

            overlay = "#{@tmp_dir}/overlay_#{did}.qcow2"

            File.open(overlay, 'w') {}

            dspec << "#{tgt},file=#{overlay}"

            disk_xml << "<disk name='#{tgt}'/>"

            qdisk[did] = QemuImg.new("#{@vm_dir}/disk.#{did}")
        end

        disk_xml << '</disks>'

        opts = {
            :name   => "one-#{@vid}-backup",
            :disk_only => '',
            :atomic    => '',
            :diskspec  => dspec
        }

        checkpoint_xml = <<~EOS
            <domaincheckpoint>
               <name>one-#{@vid}-0</name>
               #{disk_xml}
             </domaincheckpoint>
        EOS

        cpath = "#{@tmp_dir}/checkpoint.xml"

        File.open(cpath, 'w') {|f| f.write(checkpoint_xml) }

        fsfreeze

        cmd("#{virsh} snapshot-create-as", @dom, opts)

        cmd("#{virsh} checkpoint-create", @dom, :xmlfile => cpath) if @checkpoint

        fsthaw

        qdisk.each do |did, disk|
            disk.convert("#{@bck_dir}/disk.#{did}.0", :m => '4', :O => 'qcow2')
        end
    ensure
        fsthaw
    end

    def stop_backup_full_live(disks_s)
        disks = disks_s.split ':'

        @vm.elements.each 'TEMPLATE/DISK' do |d|
            did = d.elements['DISK_ID'].text
            tgt = d.elements['TARGET'].text

            next unless disks.include? did

            opts = {
                :base   => "#{@vm_dir}/disk.#{did}",
                :active => '',
                :pivot  => '',
                :keep_relative => ''
            }

            cmd("#{virsh} blockcommit", "#{@dom} #{tgt}", opts)
        end

        cmd("#{virsh} snapshot-delete", @dom.to_s,
            :snapshotname => "one-#{@vid}-backup",
            :metadata     => '')
    end

    #---------------------------------------------------------------------------
    #  Make a backup for the VM. (see make_backup_live)
    #---------------------------------------------------------------------------
    def backup_nbd(disks_s)
        disks = disks_s.split ':'

        if @parent_id == -1
            nbd_map = ''
            map     = ''
        else
            nbd_map = "one-#{@vid}-#{@parent_id}"
            map     = "qemu:dirty-bitmap:#{nbd_map}"
        end

        dids = []

        @vm.elements.each 'TEMPLATE/DISK' do |d|
            did = d.elements['DISK_ID'].text

            dids << did if disks.include? did
        end

        dids.each do |d|
            idisk = QemuImg.new("#{@bck_dir}/disk.#{d}.#{@backup_id}")

            Nbd.start_nbd("#{@vm_dir}/disk.#{d}", nbd_map)

            idisk.pull_changes(Nbd.uri, map)
        ensure
            Nbd.stop_nbd
        end

        # TODO: Check if baking files needs bitmap
        dids.each do |d|
            idisk = QemuImg.new("#{@vm_dir}/disk.#{d}")

            idisk.bitmap("one-#{@vid}-#{@backup_id}", :add => '')
        end if @checkpoint
    end

    def backup_full(disks_s)
        disks = disks_s.split ':'

        @vm.elements.each 'TEMPLATE/DISK' do |d|
            did = d.elements['DISK_ID'].text

            next unless disks.include? did

            sdisk = QemuImg.new("#{@vm_dir}/disk.#{d}")
            ddisk = "#{@bck_dir}/disk.#{did}.0"

            sdisk.convert(ddisk, :m => '4', :O => 'qcow2')
            sdisk.bitmap("one-#{@vid}-0", :add => '') if @checkpoint
        end
    end

    private

    # Generate nbd URI to query block bitmaps for a device
    def mkuri(target)
        "nbd+unix:///#{target}?socket=#{@socket}"
    end

    #---------------------------------------------------------------------------
    # Start a Backup operation on the domain (See make_backup_live)
    #---------------------------------------------------------------------------
    def start_backup(disks, bck_id, pid, checkpoint)
        parent = "one-#{@vid}-#{pid}"
        bname  = "one-#{@vid}-#{bck_id}"

        parent_xml = "<incremental>#{parent}</incremental>" if pid != -1

        backup_xml = <<~EOS
            <domainbackup mode='pull'>
              #{parent_xml}
              <server transport='unix' socket='#{@socket}'/>
              <disks>
        EOS

        checkpoint_xml = <<~EOS
            <domaincheckpoint>
              <name>#{bname}</name>
              <disks>
        EOS

        @vm.elements.each 'TEMPLATE/DISK' do |d|
            did = d.elements['DISK_ID'].text
            tgt = d.elements['TARGET'].text
            szm = d.elements['SIZE'].text

            next unless disks.include? did

            spath = "#{@tmp_dir}/scracth.#{did}.qcow2"

            simg = QemuImg.new(spath)
            simg.create("#{szm}M", :f => 'qcow2')

            backup_xml << <<~EOS
                <disk name='#{tgt}' backup='yes' type='file'>
                  <scratch file='#{spath}'/>
                </disk>
            EOS

            checkpoint_xml << "<disk name='#{tgt}'/>"
        end

        checkpoint_xml << <<~EOS
              </disks>
            </domaincheckpoint>
        EOS

        backup_xml << <<~EOS
              </disks>
            </domainbackup>
        EOS

        backup_path = "#{@tmp_dir}/backup.xml"
        check_path  = "#{@tmp_dir}/checkpoint.xml"

        File.open(backup_path, 'w') {|f| f.write(backup_xml) }

        File.open(check_path, 'w') {|f| f.write(checkpoint_xml) }

        opts = { :reuse_external => '', :backupxml => backup_path }
        opts[:checkpointxml] = check_path if checkpoint

        cmd("#{virsh} backup-begin", @dom, opts)

        @ongoing = true
    end

    #---------------------------------------------------------------------------
    # Stop an ongoing Backup operation on the domain
    #---------------------------------------------------------------------------
    def stop_backup
        return unless @ongoing

        cmd("#{virsh} domjobabort", @dom, {})
    ensure
        @ongoing = false
    end

end

opts = GetoptLong.new(
    ['--disks', '-d', GetoptLong::REQUIRED_ARGUMENT],
    ['--vmxml', '-x', GetoptLong::REQUIRED_ARGUMENT],
    ['--path', '-p', GetoptLong::REQUIRED_ARGUMENT],
    ['--live', '-l', GetoptLong::NO_ARGUMENT],
    ['--debug', '-v', GetoptLong::NO_ARGUMENT],
    ['--stop', '-s', GetoptLong::NO_ARGUMENT]
)

begin
    path = disks = vmxml = ''
    live = stop = false

    $debug = nil

    opts.each do |opt, arg|
        case opt
        when '--disks'
            disks = arg
        when '--path'
            path = arg
        when '--live'
            live = true
        when '--stop'
            stop = true
        when '--vmxml'
            vmxml = arg
        when '--debug'
            $debug = "/tmp/one.backup.#{Time.now.to_i}"
        end
    end

    vm = KVMDomain.new(Base64.decode64(File.read(vmxml)), :vm_dir => path)

    #---------------------------------------------------------------------------
    #  Stop operation. Only for full backups in live mode. It blockcommits
    #  changes and cleans snapshot.
    #---------------------------------------------------------------------------
    if stop
        vm.stop_backup_full_live(disks) if vm.parent_id == -1 && live
        exit(0)
    end

    #---------------------------------------------------------------------------
    #  Backup operation
    #   - (live - full) Creates a snapshot to copy the disks via qemu-convert
    #     all previous defined checkpoints are cleaned.
    #   - (live - increment) starts a backup operation in libvirt and pull changes
    #     through NBD server using qemu-io copy-on-read feature
    #   - (poff - full) copy disks via qemu-convert
    #   - (poff - incremental) starts qemu-nbd server to pull changes from the
    #     last checkpoint
    #---------------------------------------------------------------------------
    if live
        if vm.parent_id == -1
            vm.clean_checkpoints(true)

            vm.backup_full_live(disks)
        else
            vm.define_checkpoint(disks)

            vm.backup_nbd_live(disks)

            vm.clean_checkpoints
        end
    else
        if vm.parent_id == -1
            vm.backup_full(disks)
        else
            vm.backup_nbd(disks)
        end
    end
rescue StandardError => e
    puts e.message
    exit(-1)
end

# rubocop:enable Style/GlobalVars
# rubocop:enable Style/ClassVars
