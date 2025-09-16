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

require 'CommandManager'
require 'rexml/document'

require_relative 'kvm'
require_relative 'shell'
require_relative 'backup_qcow2'

module TransferManager

    # Virtual Machine containing the disks to backup
    class VM

        include TransferManager::KVM

        def initialize(vm_xml, vm_dir, disks)
            @xml    = vm_xml
            @vm_dir = vm_dir
            @disks  = disks
        end

        def backup_disks_sh(options = {})
            disks       = options[:disks]
            backup_dir  = options[:backup_dir]
            ds          = options[:ds]
            live        = options[:live]
            deploy_id   = options[:deploy_id]
            bridge_host = options[:bridge_host]

            kvm = KVMDomain.new(@xml, @vm_dir, :backup_dir => backup_dir)

            snap_cmd = ''
            expo_cmd = ''

            snap_clup = ''
            expo_clup = ''

            xml_vm = REXML::Document.new(@xml).root

            bk_img_id_elem = xml_vm.elements['BACKUPS/BACKUP_IDS/ID']
            bk_img_id      = bk_img_id_elem&.text&.strip

            if bk_img_id.nil? || bk_img_id.empty?
                disk_format = 'qcow2'
            else
                client = OpenNebula::Client.new
                bk_img = OpenNebula::Image.new_with_id(bk_img_id, client)

                bk_img.info

                disk_format = bk_img['FORMAT']&.strip
            end

            @disks.compact.each do |d|
                did = d.id
                next unless disks.include? did.to_s

                # Pass the format for this disk (or nil if not set)
                cmds = d.backup_cmds(backup_dir, ds, live, disk_format)
                return nil unless cmds

                snap_cmd  << cmds[:snapshot].to_s
                expo_cmd  << cmds[:export].to_s
                snap_clup << cmds[:snapshot_clup].to_s
                expo_clup << cmds[:export_clup].to_s
            end

            freeze, thaw =
                if live
                    fsfreeze(@xml, deploy_id)
                else
                    ['', '']
                end

            eos1 = <<~EOS1
                set -ex -o pipefail

                # ----------------------
                # Prepare backup folder
                # ----------------------
                [ -d #{backup_dir} ] && rm -rf #{backup_dir}

                mkdir -p #{backup_dir}

                echo "#{Base64.encode64(@xml)}" > #{backup_dir}/vm.xml

                # --------------------------------
                # Create snapshots for disks
                # --------------------------------
                #{freeze}

                #{snap_cmd}

                #{thaw}
            EOS1

            eos2 = <<~EOS2
                set -ex -o pipefail

                # --------------------------------------
                # Save TPM state
                # --------------------------------------
                #{kvm.save_tpm_sh}

                # --------------------------
                # Export, convert & cleanup
                # --------------------------
                [ -d #{backup_dir} ] || mkdir -p #{backup_dir}

                #{expo_cmd}

                cd #{backup_dir}

                #{expo_clup}
            EOS2

            eos3 = <<~EOS3
                set -ex -o pipefail

                # --------------------------
                # Cleanup snapshots
                # --------------------------
                #{snap_clup}
            EOS3

            [
                [nil, eos1],
                [bridge_host, eos2],
                [nil, eos3]
            ].map {|(host, cmd)| TransferManager::Shell.sshwrap(host, cmd) }.join("\n\n")
        end

    end

    # This class includes methods manage backup images
    class BackupImage

        attr_reader :vm_id, :keep_last, :bj_id, :format

        # Given a sorted list of qcow2 files,
        # return a shell recipe that reconstructs the backing chain in-place.
        # rubocop:disable Layout/LineLength
        def self.reconstruct_chain(paths, opts = {})
            return '' unless paths.size > 1

            opts = {
                :workdir => nil
            }.merge!(opts)

            lhs = paths.last(paths.size - 1)
            rhs = paths.first(paths.size - 1)

            script = []

            lhs.zip(rhs).each do |target, backing|
                backing = "#{opts[:workdir] || File.dirname(backing)}/#{File.basename(backing)}"
                target  = "#{opts[:workdir] || File.dirname(target)}/#{File.basename(target)}"
                script << "qemu-img rebase -u -F qcow2 -b '#{backing}' '#{target}'"
            end

            script.join("\n")
        end
        # rubocop:enable Layout/LineLength

        # Given a sorted list of qcow2 files with backing chain properly reconstructed,
        # return a shell recipe that merges it into a single qcow2 image.
        # rubocop:disable Style/ParallelAssignment, Layout/LineLength
        def self.merge_chain(paths, opts = {})
            return '' unless paths.size > 1

            opts = {
                :workdir  => nil,
                :destdir  => nil,
                :sparsify => false,
                :clean    => false
            }.merge!(opts)

            dirname, basename = File.dirname(paths.last),
                                File.basename(paths.last)

            orig = "#{opts[:workdir] || dirname}/#{basename}"
            temp = "#{orig}.tmp"
            dest = opts[:destdir].nil? ? orig : "#{opts[:destdir]}/#{basename}"

            script = []

            if orig == dest
                script << "qemu-img convert -O qcow2 '#{orig}' '#{temp}'"
                script << "mv '#{temp}' '#{dest}'"
            else
                script << "qemu-img convert -O qcow2 '#{orig}' '#{dest}'"
            end

            if opts[:sparsify]
                script << "[ $(type -P virt-sparsify) ] && virt-sparsify -q --in-place '#{dest}'"
            end

            if opts[:clean]
                to_clean = paths.first(paths.size - 1)
                                .map {|p| "'#{p}'" } # single-quoted
                script << "rm -f #{to_clean.join(' ')}" unless to_clean.empty?
            end

            script.join("\n")
        end

        # Given a sorted list of qcow2 files with backing chain properly reconstructed,
        # return a shell recipe that commits all increments to the base image.
        # rubocop:disable Style/ParallelAssignment, Layout/LineLength
        def self.commit_chain(paths, opts = {})
            return '' unless paths.size > 1

            opts = {
                :workdir  => nil,
                :sparsify => false
            }.merge!(opts)

            firstdir, firstbase = File.split(paths.first)
            first = "#{opts[:workdir] || firstdir}/#{firstbase}"

            lastdir, lastbase = File.split(paths.last)
            last = "#{opts[:workdir] || lastdir}/#{lastbase}"

            script = []
            script << "qemu-img commit -f qcow2 -b '#{first}' '#{last}'"

            if opts[:sparsify]
                script << "[ $(type -P virt-sparsify) ] && virt-sparsify -q --in-place '#{first}'"
            end

            script.join("\n")
        end
        # rubocop:enable Style/ParallelAssignment, Layout/LineLength

        def initialize(action_xml)
            @action = REXML::Document.new(action_xml).root
            @increments = {}

            prefix = '/DS_DRIVER_ACTION_DATA/IMAGE'

            @action.each_element("#{prefix}/BACKUP_INCREMENTS/INCREMENT") do |inc|
                id = inc.elements['ID'].text.to_i

                @increments[id] = inc.elements['SOURCE'].text
            end

            @increments[0] = @action.elements["#{prefix}/SOURCE"].text if @increments.empty?

            # NOTE: In the case of backup images, there should always
            # be just a single ID in the VMS array.
            @vm_id = @action.elements["#{prefix}/VMS/ID"].text.to_i

            @bj_id = @action.elements["#{prefix}/TEMPLATE/BACKUP_JOB_ID"]&.text

            @keep_last = @action.elements['/DS_DRIVER_ACTION_DATA/EXTRA_DATA/KEEP_LAST']&.text.to_i

            @incr_id = @action.elements['/DS_DRIVER_ACTION_DATA/TEMPLATE/INCREMENT_ID']&.text.to_i

            @format = @action.elements["#{prefix}/FORMAT"]&.text
        end

        # Returns the backup protocol to use (e.g. rsync, restic+rbd) based
        # on backup format
        def proto(base)
            if @format == 'rbd'
                "#{base}+rbd"
            else
                base
            end
        end

        def last
            @increments[@increments.keys.last]
        end

        def selected
            @increments[@incr_id] unless @incr_id.nil?
        end

        def snapshots
            @increments.values
        end

        def chain
            @increments.map {|k, v| "#{k}:#{v}" }.join(',')
        end

        # Create the chain with the last N elements
        def chain_last(n)
            @increments.map {|k, v| "#{k}:#{v}" }.last(n).join(',')
        end

        # Create the chain with the first N elements
        def chain_first(n)
            @increments.map {|k, v| "#{k}:#{v}" }.first(n).join(',')
        end

        # Create the chain up to a given increment id
        def chain_up_to(id)
            @increments.map {|k, v| "#{k}:#{v}" if k <= id }.compact.join(',')
        end

        # Create the chain up to a given increment id
        def chain_keep_last(snap_id)
            chain_a = @increments.map {|k, v| "#{k}:#{v}" }.last(@keep_last)
            chain_a[0] = "#{@increments.keys[-@keep_last]}:#{snap_id}"

            chain_a.join(',')
        end

    end

    # This class includes methods to generate a recovery VM template based
    # on the XML stored in a Backup
    #
    # It supports several options to control the information that will be
    # recovered:
    #    - no_ip
    #    - no_nic
    class BackupRestore

        #-----------------------------------------------------------------------
        # Attributes that will be rejected when recovering the new template
        #-----------------------------------------------------------------------

        DISK_LIST = ['ALLOW_ORPHANS', 'CLONE', 'CLONE_TARGET', 'CLUSTER_ID', 'DATASTORE',
                     'DATASTORE_ID', 'DISK_SNAPSHOT_TOTAL_SIZE', 'DISK_TYPE', 'DRIVER',
                     'IMAGE', 'IMAGE_STATE', 'IMAGE_UID', 'IMAGE_UNAME',
                     'LN_TARGET', 'OPENNEBULA_MANAGED', 'ORIGINAL_SIZE', 'PERSISTENT',
                     'READONLY', 'SAVE', 'SOURCE', 'TARGET', 'TM_MAD', 'FORMAT']

        NIC_LIST = ['AR_ID', 'BRIDGE', 'BRIDGE_TYPE', 'CLUSTER_ID', 'NAME', 'NETWORK_ID', 'NIC_ID',
                    'TARGET', 'VLAN_ID', 'VN_MAD', 'VLAN_TAGGED_ID', 'PHYDEV']

        GRAPHICS_LIST = ['PORT']

        CONTEXT_LIST = ['DISK_ID', /ETH[0-9]?/, /PCI[0-9]?/]

        NUMA_NODE_LIST = ['CPUS', 'MEMORY_NODE_ID', 'NODE_ID']

        OS_LIST = ['UUID']

        PCI_COMMON = ['ADDRESS', 'BUS', 'DOMAIN', 'FUNCTION', 'NUMA_NODE', 'PCI_ID', 'SLOT',
                      'VM_ADDRESS', 'VM_BUS', 'VM_DOMAIN', 'VM_FUNCTION', 'VM_SLOT']

        PCI_MANUAL_LIST = NIC_LIST + PCI_COMMON + ['SHORT_ADDRESS']
        PCI_AUTO_LIST   = NIC_LIST + PCI_COMMON + ['VENDOR', 'DEVICE', 'CLASS']

        ATTR_LIST = ['AUTOMATIC_DS_REQUIREMENTS', 'AUTOMATIC_NIC_REQUIREMENTS',
                     'AUTOMATIC_REQUIREMENTS', 'VMID', 'TEMPLATE_ID', 'TM_MAD_SYSTEM',
                     'SECURITY_GROUP_RULE', 'ERROR']

        # options = {
        #   :vm_xml64  => XML representation of the VM, base64 encoded
        #   :backup_id => Internal ID used by the backup system
        #   :ds_id     => Datastore to create the images
        #   :proto     => Backup protocol
        #   :txml      => Object that responds to [] to get TEMPLATE attributes
        #   }
        def initialize(opts = {})
            txt = Base64.decode64(opts[:vm_xml64])
            xml = OpenNebula::XMLElement.build_xml(txt, 'VM')
            @vm = OpenNebula::VirtualMachine.new(xml, nil)

            @ds_id = opts[:ds_id]

            @base_name = begin
                opts[:txml]['TEMPLATE/NAME']
            rescue StandardError
                "#{@vm.id}-#{opts[:backup_id]}"
            end

            no_ip = begin
                opts[:txml]['TEMPLATE/NO_IP'].casecmp?('YES')
            rescue StandardError
                false
            end

            @no_nic = begin
                opts[:txml]['TEMPLATE/NO_NIC'].casecmp?('YES')
            rescue StandardError
                false
            end

            chain = begin
                inc_id = Integer(opts[:txml]['TEMPLATE/INCREMENT_ID'])
                opts[:bimage].chain_up_to(inc_id)
            rescue StandardError
                opts[:bimage].chain
            end

            @disk_id = begin
                opts[:txml]['TEMPLATE/DISK_ID']
            rescue StandardError
                nil
            end

            @bj_id = opts[:bimage].bj_id

            @base_url = "#{opts[:proto]}://#{opts[:ds_id]}/#{@bj_id}/#{chain}"

            return unless no_ip

            NIC_LIST << ['IP', 'IP6', 'IP6_ULA', 'IP6_GLOBAL', 'MAC']
            NIC_LIST.flatten!
        end

        # Creates Image templates for the backup disks.
        #
        # @param [Array] list of disks in the backup that should be restored,
        #                e.g. ["disk.0", "disk.3"]
        # @return [Hash] with the templates (for one.image.create) and name for
        #                each disk
        # {
        #   "0" =>
        #   {
        #      :template => "NAME=..."
        #      :name     => "16-734aec-disk-0"
        #   },
        #   "3" => {...}
        # }
        def disk_images(disks)
            type = 'OS'
            bck_disks = {}

            disks.each do |f|
                m = f.match(/disk\.([0-9]+)/)
                next unless m

                f.prepend('/') if f[0] != '/'

                disk_id = m[1]

                next if !@disk_id.nil? && @disk_id != disk_id

                type = if disk_id == '0'
                           'OS'
                       else
                           'DATABLOCK'
                       end

                name = "#{@base_name}-disk-#{disk_id}"

                tmpl = <<~EOS
                    NAME = "#{name}"
                    TYPE = "#{type}"

                    PATH = "#{@base_url}#{f}"
                    FROM_BACKUP_DS = "#{@ds_id}"
                EOS

                tmpl << "BACKUP_JOB_ID = \"#{@bj_id}\"" if @bj_id

                bck_disks[disk_id] = { :template => tmpl, :name => name }
            end

            bck_disks
        end

        # Generate a VM template to restore.
        #
        # @param [Array] With the restored disks as returned by disk images
        #        it must include the :image_id of the new image
        #
        # @return [String] to allocate the template or nil
        def vm_template(bck_disks)
            return unless @disk_id.nil?

            vm_h = @vm.to_hash

            template  = vm_h['VM']['TEMPLATE']
            utemplate = vm_h['VM']['USER_TEMPLATE']

            template.merge!(utemplate)

            remove_keys(DISK_LIST, template['DISK'])
            remove_keys(ATTR_LIST, template)
            remove_keys(CONTEXT_LIST, template['CONTEXT'])
            remove_keys(GRAPHICS_LIST, template['GRAPHICS'])
            remove_keys(NUMA_NODE_LIST, template['NUMA_NODE'])
            remove_keys(OS_LIST, template['OS'])
            remove_keys(PCI_MANUAL_LIST, template['PCI'])

            disks = [template['DISK']].flatten

            disks.each do |d|
                id = d['DISK_ID']
                type = d['TYPE'].upcase
                next unless id

                d.delete('DISK_ID')

                if type == 'FS'
                    # Volatile disk
                    d.delete('IMAGE_ID')

                    # If not included in backup, keep TYPE and SIZE to create new volatile disk
                    next unless bck_disks[id]
                end

                d.delete('TYPE')
                d.delete('SIZE')

                # CDROM keeps original image_id
                next if ['CDROM', 'RBD_CDROM'].include?(type)

                d['IMAGE_ID'] = bck_disks[id][:image_id].to_s
            end

            if @no_nic
                template.delete('NIC')
            else
                remove_keys(NIC_LIST, template['NIC'])
                remove_address(template['NIC'])
            end

            remove_empty(template)

            template['NAME'] = @base_name

            to_template(template)
        end

        private

        # Remove keys from a hash
        # @param [Array] of keys to remove
        # @param [Array, Hash] Array of attributes or attribute as a Hash
        def remove_keys(list, attr)
            return if attr.nil?

            if attr.instance_of? Array
                attr.each {|a| remove_keys(list, a) }
            else
                list.each do |e|
                    attr.reject! do |k, _v|
                        if e.class == Regexp
                            k.match(e)
                        else
                            k == e
                        end
                    end
                end
            end
        end

        # Remove empty attributes from Hash
        def remove_empty(attr)
            attr.reject! do |_k, v|
                v.reject! {|e| e.empty? } if v.instance_of? Array

                v.empty?
            end
        end

        # Sanity check - A NIC can only have one of IP / IP6 / MAC.
        def remove_address(nic)
            return if nic.nil?

            if nic.instance_of? Array
                nic.each {|n| remove_address(n) }
            else
                if nic['IP']
                    nic.delete('MAC')
                    nic.delete('IP6')
                    nic.delete('IP6_ULA')
                    nic.delete('IP6_GLOBAL')
                elsif nic['IP6']
                    nic.delete('MAC')
                end
            end
        end

        # Renders a template attribute in text form
        def render_template_value(str, value)
            if value.class == Hash
                str << "=[\n"

                str << value.collect do |k, v|
                    next if !v || v.empty?

                    '    ' + k.to_s.upcase + '=' + attr_to_s(v)
                end.compact.join(",\n")

                str << "\n]\n"
            elsif value.class == String
                str << "= #{attr_to_s(value)}\n"
            end
        end

        # Generates a template like string from a Hash
        def to_template(attributes)
            attributes.collect do |key, value|
                next if !value || value.empty?

                str_line=''

                if value.class==Array
                    value.each do |v|
                        str_line << key.to_s.upcase
                        render_template_value(str_line, v)
                    end
                else
                    str_line << key.to_s.upcase
                    render_template_value(str_line, value)
                end

                str_line
            end.compact.join('')
        end

        def attr_to_s(attr)
            attr.gsub!('"', '\"')
            "\"#{attr}\""
        end

    end

end
