#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

module TransferManager

    # This class includes methods manage backup images
    class BackupImage

        attr_reader :vm_id, :keep_last, :bj_id

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
                     'IMAGE', 'IMAGE_ID', 'IMAGE_STATE', 'IMAGE_UID', 'IMAGE_UNAME',
                     'LN_TARGET', 'OPENNEBULA_MANAGED', 'ORIGINAL_SIZE', 'PERSISTENT',
                     'READONLY', 'SAVE', 'SIZE', 'SOURCE', 'TARGET', 'TM_MAD', 'TYPE', 'FORMAT']

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
                next unless id
                next unless bck_disks[id]

                d.delete('DISK_ID')

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
