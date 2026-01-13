#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

require 'rexml/document'
require 'opennebula'
require 'CommandManager' # SSHCommand, LocalCommand

# Extend string class with formatting utils
class String

    def trim_oneline
        strip.gsub("\n", ' - ').gsub(/\s\s+/, ' ')
    end

    # Indent the string to be included in a heredoc at depth n
    def hd_indent(n = 1)
        lines = split("\n").map {|line| '    ' * n + line }
        lines[0].strip!
        lines.join("\n")
    end

end

# Common code for Ruby drivers
module MAD

    # Trait for classes that wrap a XML element
    module XmlWrapper

        attr_reader :xml

        def [](xpath)
            @xml.elements[xpath]
        end

        # Return nil either if the node does not exist, or if it's empty
        def xml_text(xpath, required = false)
            val = self[xpath]&.text
            val = nil if val&.empty?
            raise "Missing required XML attribute: '#{xpath}'" if required && !val

            val
        end

    end

    # Trait for classes that wrap some LVM component
    module LVMWrapper

        # For some reason, using 'lvscan -q' instead of '-qq' sometimes returns an error 141. It
        # looks like it may be trying to show some prompt but no idea what.
        def self.lvmsync(sh)
            <<~EOF
                sync
                sudo lvscan > /dev/null
                #{sh.strip}
                sync
            EOF
        end

        def lvmsync(sh)
            LVMWrapper.lvmsync(sh)
        end

    end

    # TODO: join with tm_mad/lib/tm_action.rb
    #
    # Loads a bash formatted file to the current environment
    # Syntax:
    #   - Lines starting with # are ignored
    #   - VARIABLE=VALUE
    #   - export VARIABLE=VALUE
    #
    # @param [String] path to load environment from
    def self.load_env(filepath)
        env = {}
        File.readlines(filepath).each do |l|
            l.chomp!
            next if l.empty? || l[0] == '#'

            m = l.match(/(?:export)?\s*(\w+)=(.*)/)
            next unless m

            # Strip value of quotes of the same type
            val = m[2]
            if m[2][0] == m[2][-1] && ['"', "'"].include?(m[2][0])
                val = m[2][1..-2]
            end

            env[m[1]] = val
        end
        return env
    rescue StandardError
    end

    def self.run(host, script, errmsg = nil)
        script = <<~EOF
            set -eo pipefail
            #{script}
        EOF
        rc = if host
                 SSHCommand.run('/bin/bash -s', host, nil, script)
             else
                 LocalCommand.run('/bin/bash -s', nil, script)
             end
        raise StandardError, "#{errmsg}: #{rc.stderr.trim_oneline}" if rc.code != 0 && errmsg

        rc
    end

    # Standard LV
    class LV

        attr_reader :vgname, :lvname, :lvfname, :dev

        # Return volume size in bytes
        # rubocop:disable Naming/AccesorMethodName
        def self.get_size_sh(lvfname)
            <<~EOF
                sudo lvs --nosuffix --noheadings --units B -o lv_size #{lvfname}
            EOF
        end
        # rubocop:enable Naming/AccesorMethodName

        def initialize(vgname, lvname)
            @vgname  = vgname
            @lvname  = lvname
            @lvfname = "#{@vgname}/#{lvname}"

            @dev = Pathname.new('/dev') + @lvfname
        end

        def create_sh(size, opts = {})
            flags = ' -K -ay' if opts[:activate]

            <<~EOF
                sudo lvcreate#{flags} -W n -L #{size}M #{@vgname} -n #{@lvname} -ky
            EOF
        end

        def delete_sh(opts = {})
            flags = ' -q' if opts[:quiet]

            "sudo lvremove#{flags} -y '#{@lvfname}'\n"
        end

        # Some distributions like Debian don't add sbin directories in non-root users PATH
        def mkswap_sh
            "PATH=/usr/sbin:/sbin:$PATH mkswap -L swap #{@dev}\n"
        end

        def mkfs_sh(format, fs)
            script_dir = Pathname.new($PROGRAM_NAME).dirname
            ds_env     = MAD.load_env("#{script_dir}/../../etc/datastore/datastore.conf")

            supported_fs = ds_env['SUPPORTED_FS']&.split(',') || []

            return mkswap_sh if format == 'swap'

            # rubocop:disable Layout/LineLength
            raise StandardError, "Unsupported file system type: #{fs.inspect}. Supported types are: #{supported_fs}" \
                unless supported_fs.include?(fs)
            # rubocop:enable Layout/LineLength

            fs_opts = ds_env["FS_OPTS_#{fs}"] || ''
            # if ['ext2', 'ext3', 'ext4'].include?(fs)
            #     fs_opts += ' -F '
            if fs == 'xfs'
                # For XFS, force creation of FS even if it detects a previous filesystem
                fs_opts += ' -f '
            end

            "mkfs -t '#{fs}' #{fs_opts.strip} '#{@dev}'\n"
        end

        # Activate or deactivate volume
        def activate_sh(activate = true, opts = {})
            flags = ''
            flags += ' -q' if opts[:quiet]
            flags += activate ? ' -K -ay' : ' -an'

            "sudo lvchange#{flags} #{@lvfname}\n"
        end

        def extend_sh(extra_size)
            "sudo lvextend -L +#{extra_size}M #{@lvfname}\n"
        end

    end

    # Thin pool
    class ThinPool < LV

        # METHOD OVERRIDE
        # Create the pool. By default (safe mode) only creates it if it's not already created
        def create_sh(poolsize, _opts = {})
            # -ky enables activation skip, preventing possible data corruption e.g., in HA
            # -Zy is for auto-zeroing thin volumes. It already defaults to 'y' but just in case...
            <<~EOF
                # If the pool does not exist...
                if [ -z "$(sudo lvs --noheading -S 'vg_name = #{@vgname} && lv_name = #{@lvname}')" ]; then
                    # ... create it
                    sudo lvcreate -W n --thin -L '#{poolsize}M' '#{@lvfname}' -ky -Zy -an
                fi
            EOF
        end

        # METHOD OVERRIDE
        # Delete the pool, which also recursively deletes all its thin volumes
        # By default (safe mode) only deletes empty pools.
        def delete_sh(opts = {})
            <<~EOF
                # If the pool exists but no lv is using it...
                if [ -n "$(sudo lvs --noheading -S 'vg_name = #{@vgname} && lv_name = #{@lvname}')" ] &&
                    [ -z "$(sudo lvs --noheading -S 'vg_name = #{@vgname} && pool_lv = #{@lvname}')" ]; then
                    # ... delete it
                    #{super}
                fi
            EOF
        end

        # Extend pool size to fill all of its thin LVs
        def adjust_sh
            <<~EOF
                pool_size="$(#{self.class.get_size_sh(@lvfname).strip})"
                lvs_size=0
                for lv in $(sudo lvs --noheading -o lv_name -S 'vg_name = #{@vgname} && pool_lv = #{@lvname}'); do
                    lv_size="$(#{self.class.get_size_sh("#{@vgname}/$lv").strip})"
                    lvs_size=$((lvs_size + lv_size))
                done
                if [ "$lvs_size" -gt "$pool_size" ]; then
                    sudo lvextend -L ${lvs_size}B #{@lvfname}
                fi
            EOF
        end

    end

    # Thin volume
    class ThinLV < LV

        attr_reader :pool

        def initialize(vgname, lvname, pool)
            super(vgname, lvname)

            @pool = pool
            @snap_lv_prefix = "#{@lvname}_s"
        end

        # METHOD OVERRIDE
        # Create the volume, and the pool if it's needed beforehand
        def create_sh(size, opts = {})
            flags = ' -K -ay' if opts[:activate]

            <<~EOF
                #{@pool.create_sh(size).strip}
                sudo lvcreate#{flags} --thin -V #{size}M #{@pool.lvfname} -n #{@lvname} -ky
                #{@pool.adjust_sh.strip}
            EOF
        end

        # METHOD OVERRIDE
        # Delete the LV, and also the pool if it's empty afterwards
        def delete_sh(opts = {})
            cleanup_pool   = opts.fetch(:cleanup_pool, false)
            with_snapshots = opts.fetch(:with_snapshots, false)

            <<~EOF
                #{snaps_delete_sh(opts).strip if with_snapshots}
                #{super.strip}
                #{@pool.delete_sh(opts).strip if cleanup_pool}
            EOF
        end

        # Clone the volume using another one as external origin
        def clone_sh(from_lvname, size)
            from_lvfname = "#{@vgname}/#{from_lvname}"
            <<~EOF
                # Set base to read-only
                sudo lvchange -pr #{from_lvfname} 2> /dev/null || true

                # Deactivate base
                sudo lvchange -an #{from_lvfname}

                # Create own pool if needed
                #{@pool.create_sh(size).strip}

                # Create own LV as snapshot from the external origin base
                sudo lvcreate --snapshot --thinpool #{@pool.lvname} #{from_lvfname} -n #{@lvname} -ky -an

                # Extend clone LV to match pool size if size is bigger than base image
                pool_size="$(#{self.class.get_size_sh(@pool.lvfname).strip})"
                base_size="$(#{self.class.get_size_sh(@lvfname).strip})"
                if [ "$pool_size" -gt "$base_size" ]; then
                    sudo lvextend -L ${pool_size}B #{@lvfname}
                fi
            EOF
        end

        def extend_sh(extra_size)
            <<~EOF
                #{super.strip}
                #{@pool.adjust_sh.strip}
            EOF
        end

        # Return a snapshot as a new ThinLV
        def snap(snap_id)
            self.class.new(@vgname, snap_lvname(snap_id), @pool)
        end

        def snap_create_sh(snap_id, opts = {})
            flags = ' -K -ay' if opts[:activate]

            <<~EOF
                sudo lvcreate#{flags} -s -n #{snap_lvname(snap_id)} #{@lvfname}
                #{@pool.adjust_sh.strip}
            EOF
        end

        def snap_revert_sh(snap_id, opts = {})
            safe = opts.fetch(:safe, true)

            activate = opts.fetch(:activate, false)
            adjust   = opts.fetch(:adjust, true)

            cmd = <<~EOF
                #{delete_sh.strip}
                sudo lvcreate -s -n #{@lvname} #{@vgname}/#{snap_lvname(snap_id)}
                #{activate_sh.strip if activate}
                #{@pool.adjust_sh.strip if adjust}
            EOF

            if safe
                if_snap_exists_sh(snap_id, cmd)
            else
                cmd
            end
        end

        def snap_flatten_sh(snap_id, opts = {})
            safe = opts.fetch(:safe, true)
            cmd  = <<~EOF
                #{snap_revert_sh(snap_id, :safe => false, :adjust => false).strip}
                #{snaps_delete_sh.strip}
            EOF

            if safe
                if_snap_exists_sh(snap_id, cmd)
            else
                cmd
            end
        end

        def snaps_delete_sh(opts = {})
            flags = ' -q' if opts[:quiet]

            <<~EOF
                for lv in $(sudo lvs --noheading -o lv_name -S \
                            'vg_name = #{@vgname} && pool_lv = #{@pool.lvname} && lv_name =~ "#{@snap_lv_prefix}[0-9]+"'); do
                    sudo lvremove#{flags} -y "#{@vgname}/$lv"
                done
            EOF
        end

        def snap_delete_sh(snap_id)
            "sudo lvremove -y #{@vgname}/#{snap_lvname(snap_id)}\n"
        end

        def snap_lvname(snap_id)
            "#{@snap_lv_prefix}#{snap_id}"
        end

        private

        def if_snap_exists_sh(snap_id, cmd)
            snap_lvname = snap_lvname(snap_id)

            <<~EOF
                # If the snapshot exists...
                if [ -n "$(sudo lvs --noheading -S 'vg_name = #{@vgname} && lv_name = #{snap_lvname}')" ]; then
                    #{cmd.hd_indent}
                else
                    echo "Snapshot '#{@vgname}/#{snap_lvname}' not found; aborting"
                    exit 1
                fi
            EOF
        end

    end

    # TODO: join with tm_mad/lib/datastore.rb
    # Datastore
    class Datastore

        include XmlWrapper

        require 'pathname'

        attr_reader :base_path, :bridge

        def self.get_from_id(id)
            oneds = OpenNebula::Datastore.new_with_id(id, OpenNebula::Client.new)

            rc = oneds.info
            raise rc.message.to_s if OpenNebula.is_error?(rc)

            xml = REXML::Document.new(oneds.to_xml).root

            new(xml)
        end

        def initialize(xml)
            @xml = xml
            @xml = REXML::Document.new(@xml).root if @xml.is_a? String

            @id = xml_text('ID', true)
            @base_path = Pathname.new(xml_text('BASE_PATH', true))

            @bridge_list = xml_text('TEMPLATE/BRIDGE_LIST')&.split || []

            @bridge = pick_bridge if @bridge_list
        end

        # If BRIDGE_LIST is defined, return one randomly. Else, return nil (for execution in
        # frontend)
        def pick_bridge
            @bridge_list.sample
        end

        def run_bridge(script, errmsg = nil)
            MAD.run(@bridge, script, errmsg)
        end

    end

    # LVM Datastore
    class LVMDatastore < Datastore

        include LVMWrapper

        attr_reader :vgname

        def initialize(xml)
            super

            @vgname = "vg-one-#{@id}"
        end

        def monitor
            run_bridge(lvmsync(<<~EOF), 'Error getting VG size')
                sudo vgdisplay --separator : --units m -o vg_size,vg_free \
                   --nosuffix --noheadings -C #{@vgname}
            EOF
        end

        # Wrap the command in SYNCs to prevent LVM concurrency errors
        def run_bridge(script, errmsg = nil)
            super(lvmsync(script), errmsg)
        end

    end

    # Image
    class Image

        include XmlWrapper

        attr_reader :id, :path, :source, :format, :size, :fs, :persistent

        def self.get_from_id(id)
            oneds = OpenNebula::Image.new_with_id(id, OpenNebula::Client.new)
            rc    = oneds.info

            raise rc.message.to_s if OpenNebula.is_error?(rc)

            xml = REXML::Document.new(oneds.to_xml).root

            new(xml)
        end

        def initialize(xml)
            @xml = xml
            @xml = REXML::Document.new(@xml).root if @xml.is_a? String

            @id  = xml_text('ID', true)

            # image source, i.e., where to fetch it from to import it
            @path = xml_text('PATH')

            # image path, i.e., where the image is currently located
            @source = xml_text('SOURCE')

            @format = xml_text('FORMAT')
            @size   = xml_text('SIZE', true).to_i
            @fs     = xml_text('FS')

            @persistent = xml_text('PERSISTENT', true) == '1'
        end

    end

    # LVM Image, backed by either:
    # - ThinLV+ThinPool (persistent)
    # - a standard ThickLV (non-persistent)
    class LVMImage < Image

        include LVMWrapper

        attr_reader :lv

        def self.lvname(id)
            "img-one-#{id}"
        end

        def self.get_from_id(id)
            img   = Image.get_from_id(id)
            lvmds = LVMDatastore.get_from_id(img.xml_text('DATASTORE_ID', true))

            new(img.xml, lvmds)
        end

        def initialize(xml, lvmds)
            @xml = xml
            @xml = REXML::Document.new(@xml).root if @xml.is_a? String

            @ds = lvmds

            super(xml)

            lvname = self.class.lvname(@id)

            if @persistent
                pool = ThinPool.new(@ds.vgname, "#{lvname}-pool")
                @lv  = ThinLV.new(@ds.vgname, lvname, pool)
            else
                @lv = LV.new(@ds.vgname, lvname)
            end
        end

        def activate(activate = true)
            @ds.run_bridge(@lv.activate_sh(activate))
        end

        # Alias
        def deactivate
            activate(false)
        end

        # TODO: maybe join with same method from LVMDisk?
        # Create thin pool + volume. Tries to be atomic, i.e., on failure the half-created LV is
        # destroyed again.
        def create(activate = false)
            @ds.run_bridge(<<~EOF, 'Error creating LV')
                #{@lv.create_sh(@size, :activate => true).strip}
                #{@lv.mkfs_sh(@format, @fs).strip if @fs && @format != 'save_as'}
                #{@lv.activate_sh(false).strip unless activate}
            EOF
        rescue StandardError => e
            @ds.run_bridge(@lv.delete_sh(:cleanup_pool => true))
            raise e
        end

        # Activate the base image and copy
        def clone_from_path
            script = <<~EOF
                sudo lvchange -K -ay #{@path}
                dd if=/dev/#{@path} of=#{@lv.dev} bs=1M conv=sparse
                sudo lvchange -an #{@path}
                #{@lv.activate_sh(false).strip}
            EOF
            @ds.run_bridge(script)
        end

        # Activate persistent image as VM disk in a specific location (host)
        def activate_and_link(dst)
            vmdir  = dst.path.dirname
            script = <<~EOF
                mkdir -p '#{vmdir}'
                rm -f '#{vmdir.parent}/.monitor'
                #{@lv.activate_sh.strip}
                ln -s '#{@lv.dev}' '#{dst.path}'
            EOF

            MAD.run(dst.host, lvmsync(script), "Error linking disk #{@lv.lvfname} to #{dst}")
        end

        # Delete volume (+ snapshots + cleanup thin pool, if it's a persistent image)
        def delete
            @ds.run_bridge(@lv.delete_sh(:with_snapshots => true, :cleanup_pool => true),
                           'Error removing LV')
        end

    end

    # VM Disk
    class Disk

        include XmlWrapper

        attr_accessor :host
        attr_reader :id, :vm, :path, :imageid, :idsid, :sdsid, :size, :persistent

        def initialize(xml, vm)
            @xml = xml
            @vm  = vm

            @persistent =
                xml_text('PERSISTENT')&.downcase == 'yes' || xml_text('READONLY')&.downcase == 'yes'

            @id      = xml_text('DISK_ID', true)
            @imageid = xml_text('IMAGE_ID')
            @size    = xml_text('SIZE').to_i
            @idsid   = xml_text('DATASTORE_ID')
            @sdsid   = vm.sdsid

            @host = vm.host
            @path = Pathname.new "/var/lib/one/datastores/#{@sdsid}/#{vm.id}/disk.#{@id}"
        end

        # Path and system datastore ID depend on each other. It's sometimes useful to change them
        # (e.g., in the mv operation, where the disk is migrated between datastores) so we use this
        # helpers to keep the model consistent.
        def path=(path)
            @path  = Pathname.new(path)
            @sdsid = @path.dirname.dirname.basename.to_s
        end

        def sdsid=(sdsid)
            @sdsid = sdsid
            @path  = Pathname.new "/var/lib/one/datastores/#{@sdsid}/#{vm.id}/disk.#{@id}"
        end

    end

    # LVM Disk (cloned from non-persistent images)
    class LVMDisk < Disk

        include LVMWrapper

        attr_reader :lv

        # VM must be LVMVM
        def initialize(xml, vm)
            super(xml, vm)

            (lvname, pool) =
                if @persistent
                    lvname = LVMImage.lvname(@imageid)
                    [lvname, ThinPool.new(@vm.pool.vgname, "#{lvname}-pool")]
                else
                    ["#{LVMVM.lvname(@vm.id)}-#{@id}", @vm.pool]
                end
            @lv = ThinLV.new(@vm.pool.vgname, lvname, pool)
        end

        def symlink(opts)
            vmdir = @path.dirname

            script = <<~EOF
                # Symlink LV mapper device to local disk path
                mkdir -p '#{vmdir}'
                rm -f '#{vmdir.parent}/.monitor'
                ln -s '#{@lv.dev}' '#{@path}'
            EOF

            if opts[:sh]
                script
            else
                MAD.run(@host, lvmsync(script),
                        "Error symlinking disk (#{path} -> #{@lv.dev})")
            end
        end

        # TODO: maybe join with same method from LVMImage? -> format is different (e.g, "raw" for
        # swap disks); needs to be passed from outside
        # Create disk without a base image (volatile)
        # Create thin pool + volume. Tries to be atomic, i.e., on failure the half-created LV is
        # destroyed again.
        def create(dst, is_swap)
            MAD.run(dst.host, <<~EOF, 'Error creating LV')
                #{@lv.create_sh(@size, :activate => true).strip}
                #{@lv.mkswap_sh.strip if is_swap}
                ln -sf '#{@lv.dev}' '#{dst.path}'
            EOF
        rescue StandardError => e
            MAD.run(dst.host, @lv.delete_sh(:cleanup_pool => true))
            raise e
        end

        # Create thin pool + volume. Atomic.
        def clone_from_lv(from_lvname)
            script = <<~EOF
                #{@lv.clone_sh(from_lvname, @size).strip}

                #{@lv.activate_sh.strip}
                #{symlink(:sh => true).strip}
            EOF

            MAD.run(@host, lvmsync(script), "Error cloning disk #{@lv.lvfname} to #{@path}")
        rescue StandardError => e
            MAD.run(@host, lvmsync(@lv.delete_sh(:cleanup_pool => true)))
            raise e
        end

        # TODO: freeze/thaw VM when live
        def snap_create(snap_id, opts = {})
            MAD.run(@host, lvmsync(@lv.snap_create_sh(snap_id, opts).strip),
                    'Error creating snapshot')
        end

        def snap_revert(snap_id)
            MAD.run(@host, lvmsync(@lv.snap_revert_sh(snap_id, :activate => true)),
                    'Error reverting snapshot')
        end

        def snap_delete(snap_id)
            MAD.run(@host, lvmsync(@lv.snap_delete_sh(snap_id)), 'Error deleting snapshot')
        end

    end

    # VM
    class VM

        include XmlWrapper

        attr_reader :id, :host, :sdsid, :state, :state_str, :lcm_state, :lcm_state_str

        def self.get_from_id(id)
            onevm = OpenNebula::VirtualMachine.new_with_id(id, OpenNebula::Client.new)
            rc    = onevm.info

            raise rc.message.to_s if OpenNebula.is_error?(rc)

            xml = REXML::Document.new(onevm.to_xml).root

            new(xml)
        end

        def initialize(xml)
            @xml = xml
            @xml = REXML::Document.new(@xml).root if @xml.is_a? String

            @id    = xml_text('ID', true)
            @host  = xml_text('HISTORY_RECORDS/HISTORY[last()]/HOSTNAME', true)
            @sdsid = xml_text('HISTORY_RECORDS/HISTORY[last()]/DS_ID', true)

            @state     = xml_text('STATE', true)
            @state_str = OpenNebula::VirtualMachine::VM_STATE[@state.to_i]

            @lcm_state     = xml_text('LCM_STATE', true)
            @lcm_state_str = OpenNebula::VirtualMachine::LCM_STATE[@lcm_state.to_i]
        end

        def undeployed?
            ['UNDEPLOYED', 'STOPPED'].include?(@state_str) ||
                ['HOTPLUG_SAVEAS_UNDEPLOYED', 'HOTPLUG_SAVEAS_STOPPED'].include?(@lcm_state_str)
        end

        def disks
            @xml.get_elements('TEMPLATE/DISK').map {|e| disk_from_xml(e) }
        end

        def disk(disk_id)
            disk_from_xml(self["TEMPLATE/DISK[DISK_ID='#{disk_id}']"])
        end

        private

        def disk_from_xml(xml)
            Disk.new(xml, self)
        end

    end

    # LVM VM (VM having one or more LVM disks)
    class LVMVM < VM

        include LVMWrapper

        attr_reader :pool

        def self.lvname(id)
            "vm-one-#{id}"
        end

        def disk_lvname(disk_id)
            "#{self.class.lvname(@id)}-#{disk_id}"
        end

        def initialize(xml)
            super(xml)

            lvname = self.class.lvname(@id)
            lvmds  = LVMDatastore.get_from_id(xml_text('TEMPLATE/DISK[TM_MAD="lvm"]/DATASTORE_ID'))

            @pool = ThinPool.new(lvmds.vgname, "#{lvname}-pool")
        end

        private

        # Overwrite parent's method with a version that returns disks as either
        # generic Disk's or specific LVMDisk's whenever possible (TM_MAD == lvm)
        def disk_from_xml(xml)
            if xml.elements['TM_MAD'].text == 'lvm'
                LVMDisk.new(xml, self)
            else
                super
            end
        end

    end

end
