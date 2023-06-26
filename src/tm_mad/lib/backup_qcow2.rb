#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

require_relative 'kvm'

#-------------------------------------------------------------------------------
# CONFIGURATION CONSTANTS
#   QEMU_IO_OPEN: options to open command for qemu-io
#   -t <cache_mode>: none, writeback (recommended)
#       wirteback = cache.writeback (fsync() after each write)
#       none      = cache.writeback | cache.direct (use O_DIRECT)
#   -i <io_mode>: io_uring, threads, native (requires cache_mode = none)
#
#   IO_ASYNC: if true issues aio_read commands instead of read
#   OUTSTAND_OPS: number of aio_reads before issuing a aio_flush commnand
#
#   BDRV_MAX_REQUEST is the limit for the sieze of qemu-io operations
#-------------------------------------------------------------------------------
LOG_FILE     = nil
QEMU_IO_OPEN = '-t none -i native -o driver=qcow2'
IO_ASYNC     = false
OUTSTAND_OPS = 8

BDRV_MAX_REQUEST = 2**30

# rubocop:disable Style/ClassVars

#---------------------------------------------------------------------------
# Helper module to execute commands
#---------------------------------------------------------------------------
module Command

    # rubocop:disable Style/HashSyntax
    def log(message)
        return unless LOG_FILE

        File.write(LOG_FILE, "#{Time.now.strftime('%H:%M:%S.%L')} #{message}\n", mode: 'a')
    end
    # rubocop:enable Style/HashSyntax

    def cmd(command, args, opts = {})
        opts.each do |key, value|
            if value.class == Array
                value.each {|v| command << render_opt(key, v) }
            else
                command << render_opt(key, value)
            end
        end

        log("[CMD]: #{command} #{args}")

        out, err, rc = Open3.capture3("#{command} #{args}", :stdin_data => opts[:stdin_data])

        log('[CMD]: DONE')

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
            args << file

            exec('qemu-nbd', *args)
        end

        sleep(1) # TODO: inotify or poll for @@socket
    end

    def self.stop_nbd
        Process.kill('QUIT', @@server)
        Process.waitpid(@@server)

        File.unlink(@@socket)

        @@server = nil

        sleep(1) # TODO: improve settle down FS/qemu locks
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
    QEMU_IMG_COMMANDS = ['convert', 'create', 'rebase', 'info', 'bitmap']

    QEMU_IMG_COMMANDS.each do |command|
        define_method(command.to_sym) do |args = '', opts|
            cmd("qemu-img #{command}", "#{@path} #{args}", opts)
        end
    end

    #---------------------------------------------------------------------------
    #  Image information methods.
    #
    #  Sample output of qemu image info output in json format
    #  {
    #  "backing-filename-format": "qcow2",
    #  "virtual-size": 268435456,
    #  "filename": "disk.0",
    #  "cluster-size": 65536,
    #  "format": "qcow2",
    #  "actual-size": 2510848,
    #  "format-specific": {
    #      "type": "qcow2",
    #      "data": {
    #          "compat": "1.1",
    #          "compression-type": "zlib",
    #          "lazy-refcounts": false,
    #          "bitmaps": [
    #              {
    #                  "flags": [
    #                      "auto"
    #                  ],
    #                  "name": "one-0-5",
    #                  "granularity": 65536
    #              },
    #              {
    #                  "flags": [
    #                      "auto"
    #                  ],
    #                  "name": "one-0-4",
    #                  "granularity": 65536
    #              }
    #          ],
    #          "refcount-bits": 16,
    #          "corrupt": false,
    #          "extended-l2": false
    #      }
    #  },
    #  "full-backing-filename": "/var/lib/one/datastores/1/e948982",
    #  "backing-filename": "/var/lib/one/datastores/1/e948982",
    #  "dirty-flag": false
    # }
    #---------------------------------------------------------------------------
    def [](key)
        if !@_info
            out    = info(:output => 'json', :force_share => '')
            @_info = JSON.parse(out)
        end

        @_info[key]
    end

    def bitmaps
        self['format-specific']['data']['bitmaps']
    rescue StandardError
        []
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
        # ----------------------------------------------------------------------
        # Get extents from NBD server
        # ----------------------------------------------------------------------
        exts = if !map || map.empty?
                   # TODO: change pattern to include zero
                   extents(uri, '', 'data')
               else
                   extents(uri, map, 'dirty')
               end

        rc, msg = create(:f => 'qcow2', :F => 'raw', :b => uri)

        return [false, msg] unless rc

        # ----------------------------------------------------------------------
        # Create a qemu-io script to pull changes
        # ----------------------------------------------------------------------
        io_script = "open -C #{QEMU_IO_OPEN} #{@path}\n"
        index     = -1

        exts.each do |e|
            ext_length = Integer(e['length'])
            new_exts   = []

            if ext_length > BDRV_MAX_REQUEST
                ext_offset = Integer(e['offset'])

                loop do
                    index += 1

                    blk_length = [ext_length, BDRV_MAX_REQUEST].min

                    new_exts << {
                        'offset' => ext_offset,
                        'length' => blk_length,
                        'index'  => index
                    }

                    ext_offset += BDRV_MAX_REQUEST
                    ext_length -= BDRV_MAX_REQUEST

                    break if ext_length <= 0
                end
            else
                index += 1

                new_exts << {
                    'offset' => e['offset'],
                    'length' => e['length'],
                    'index'  => index
                }
            end

            new_exts.each do |i|
                if IO_ASYNC
                    io_script << "aio_read -q #{i['offset']} #{i['length']}\n"
                    io_script << "aio_flush\n" if (i['index']+1)%OUTSTAND_OPS == 0
                else
                    io_script << "read -q #{i['offset']} #{i['length']}\n"
                end
            end
        end

        io_script << "aio_flush\n" if IO_ASYNC

        cmd('qemu-io', '', :stdin_data => io_script)
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

        # State variables for domain operations
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
    # List the checkpoints defined in the domain
    #    @return[Array]  an array of checkpint ids
    #---------------------------------------------------------------------------
    def checkpoints
        out = cmd("#{virsh} checkpoint-list", @dom, :name => '')
        out.strip!

        check_ids = []

        out.each_line do |l|
            m = l.match(/(one-[0-9]+)-([0-9]+)/)
            next unless m

            check_ids << m[2].to_i
        end

        check_ids
    end

    #---------------------------------------------------------------------------
    # Re-define the checkpoints. This method will fail if not present in storage
    #
    #   @param[Array]  Array of checkpoint ids to re-define
    #   @param[String] List of disks to include in the checkpoint
    #---------------------------------------------------------------------------
    def redefine_checkpoints(check_ids, disks_s)
        disks = disks_s.split ':'
        tgts  = []

        return if check_ids.empty? || disks.empty?

        # Create XML definition for the VM disks
        @vm.elements.each 'TEMPLATE/DISK' do |d|
            did = d.elements['DISK_ID'].text

            next unless disks.include? did

            tgts << d.elements['TARGET'].text
        end

        return if tgts.empty?

        disks = '<disks>'
        tgts.each {|tgt| disks << "<disk name='#{tgt}'/>" }
        disks << '</disks>'

        #-----------------------------------------------------------------------
        # Try to re-define checkpoints, will fail if not present in storage.
        # Can be queried using qemu-monitor
        #
        # out  = cmd("#{virsh} qemu-monitor-command", @dom,
        #           :cmd => '{"execute": "query-block","arguments": {}}')
        # outh = JSON.parse(out)
        #
        # outh['return'][0]['inserted']['dirty-bitmaps']
        #   => [{"name"=>"one-0-2", "recording"=>true, "persistent"=>true,
        #        "busy"=>false, "granularity"=>65536, "count"=>327680}]
        #-----------------------------------------------------------------------
        check_ids.each do |cid|
            checkpoint_xml = <<~EOS
                <domaincheckpoint>
                    <name>one-#{@vid}-#{cid}</name>
                    <creationTime>#{Time.now.to_i}</creationTime>
                    #{disks}
                </domaincheckpoint>
            EOS

            cpath = "#{@tmp_dir}/checkpoint.xml"

            File.open(cpath, 'w') {|f| f.write(checkpoint_xml) }

            cmd("#{virsh} checkpoint-create", @dom, :xmlfile => cpath,
                :redefine => '')
        end
    end

    #---------------------------------------------------------------------------
    # Re-define the parent_id checkpoint if not included in the checkpoint-list.
    # If the checkpoint is not present in storage the methods will fail.
    #
    #   @param[String] List of disks to include in the checkpoint
    #   @param[Integer] id of the checkpoint to define
    #---------------------------------------------------------------------------
    def define_parent(disks_s)
        return if @parent_id == -1

        check_ids = checkpoints

        # Remove current checkpoint (e.g. a previous failed backup operation)
        if check_ids.include? @backup_id
            cpname = "one-#{@vid}-#{@backup_id}"

            begin
                cmd("#{virsh} checkpoint-delete", @dom, :checkpointname => cpname)
            rescue StandardError
                cmd("#{virsh} checkpoint-delete", @dom, :checkpointname => cpname,
                    :metadata => '')
            end
        end

        return if check_ids.include? @parent_id

        redefine_checkpoints([@parent_id], disks_s)
    end

    #---------------------------------------------------------------------------
    # Cleans defined checkpoints up to the last two. This way we can retry
    # the backup operation in case it fails
    #---------------------------------------------------------------------------
    def clean_checkpoints(disks_s, all = false)
        return unless @checkpoint

        # Get a list of dirty checkpoints
        check_ids = checkpoints

        # Use first disk to get a list of defined bitmaps
        to_define = []

        disk_id = disks_s.split(':').first

        idisk = QemuImg.new("#{@vm_dir}/disk.#{disk_id}")

        idisk.bitmaps.each do |b|
            m = b['name'].match(/(one-[0-9]+)-([0-9]+)/)
            next unless m

            cid = m[2].to_i

            next if check_ids.include? cid

            to_define << cid
            check_ids << cid
        end unless idisk.bitmaps.nil?

        # Redefine checkpoints in libvirt and remove
        redefine_checkpoints(to_define, disks_s)

        check_ids.each do |cid|
            next if !all && cid >= @parent_id

            cmd("#{virsh} checkpoint-delete", "#{@dom} one-#{@vid}-#{cid}")
        end
    end

    #---------------------------------------------------------------------------
    #  Make a live backup for the VM.
    #   @param [Array] ID of disks that will take part on the backup
    #   @param [Boolean] if true do not generate checkpoint
    #---------------------------------------------------------------------------
    def backup_nbd_live(disks_s)
        init  = Time.now
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

        log("[BCK]: Incremental backup done in #{Time.now - init}s")
    ensure
        fsthaw
        stop_backup
    end

    def backup_full_live(disks_s)
        init  = Time.now
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
            disk.convert("#{@bck_dir}/disk.#{did}.0", :m => '4', :O => 'qcow2', :U => '')
        end

        log("[BCK]: Full backup done in #{Time.now - init}s")
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
        init  = Time.now
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

        dids.each do |d|
            idisk = QemuImg.new("#{@vm_dir}/disk.#{d}")

            idisk.bitmaps.each do |b|
                next if b['name'] == "one-#{@vid}-#{@parent_id}"

                idisk.bitmap(b['name'], :remove => '')
            end

            idisk.bitmap("one-#{@vid}-#{@backup_id}", :add => '')
        end if @checkpoint

        log("[BCK]: Incremental backup done in #{Time.now - init}s")
    end

    def backup_full(disks_s)
        init  = Time.now
        disks = disks_s.split ':'

        @vm.elements.each 'TEMPLATE/DISK' do |d|
            did = d.elements['DISK_ID'].text

            next unless disks.include? did

            sdisk = QemuImg.new("#{@vm_dir}/disk.#{did}")
            ddisk = "#{@bck_dir}/disk.#{did}.0"

            sdisk.convert(ddisk, :m => '4', :O => 'qcow2', :U => '')

            next unless @checkpoint

            bms = sdisk.bitmaps
            bms.each {|bm| sdisk.bitmap(bm['name'], :remove => '') } unless bms.nil?

            sdisk.bitmap("one-#{@vid}-0", :add => '')
        end

        log("[BCK]: Full backup done in #{Time.now - init}s")
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

    vm = KVMDomain.new(Base64.decode64(File.read(vxml)), :vm_dir => path)

    #---------------------------------------------------------------------------
    #  Stop operation. Only for full backups in live mode. It blockcommits
    #  changes and cleans snapshot.
    #---------------------------------------------------------------------------
    if stop
        vm.stop_backup_full_live(disk) if vm.parent_id == -1 && live
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
            vm.clean_checkpoints(disk, true)

            vm.backup_full_live(disk)
        else
            vm.define_parent(disk)

            vm.backup_nbd_live(disk)

            vm.clean_checkpoints(disk)
        end
    else
        if vm.parent_id == -1
            vm.backup_full(disk)
        else
            vm.backup_nbd(disk)
        end
    end
rescue StandardError => e
    puts e.message
    exit(-1)
end

# rubocop:enable Style/ClassVars
