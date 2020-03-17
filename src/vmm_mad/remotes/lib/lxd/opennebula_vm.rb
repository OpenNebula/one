# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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
require 'yaml'

# This class reads and holds configuration attributes for the LXD driver
class LXDConfiguration < Hash

    DEFAULT_CONFIGURATION = {
        :vnc => {
            :command => '/bin/login',
            :width   => '800',
            :height  => '600',
            :timeout => '300'
        },
        :filesystem => 'ext4',
        :datastore_location => '/var/lib/one/datastores'
    }

    LXDRC = '../../etc/vmm/lxd/lxdrc'

    def initialize
        replace(DEFAULT_CONFIGURATION)

        begin
            merge!(YAML.load_file("#{__dir__}/#{LXDRC}"))
        rescue => e
            OpenNebula.log_error e
        end
    end

end

# This class parses and wraps the information in the Driver action data
class OpenNebulaVM

    attr_reader :xml, :vm_id, :vm_name, :sysds_path, :rootfs_id, :lxdrc

    #---------------------------------------------------------------------------
    # Class Constructor
    #---------------------------------------------------------------------------
    def initialize(xml)
        @xml = XMLElement.new_s(xml)
        @xml = @xml.element('//VM')

        @vm_id    = @xml['//TEMPLATE/VMID']
        @vm_name  = @xml['//DEPLOY_ID']
        @vm_name  = "one-#{@vm_id}" if @vm_name.empty?

        # Load Driver configuration
        @lxdrc = LXDConfiguration.new

        sysds_id = @xml['//HISTORY_RECORDS/HISTORY/DS_ID']
        @sysds_path = "#{@lxdrc[:datastore_location]}/#{sysds_id}"

        return if wild?

        # Sets the DISK ID of the root filesystem
        disk = @xml.element('//TEMPLATE/DISK')

        return unless disk

        @rootfs_id = disk['DISK_ID']
        boot_order = @xml['//TEMPLATE/OS/BOOT']
        @rootfs_id = boot_order.split(',')[0][-1] unless boot_order.empty?
    end

    def context?
        !@xml['//TEMPLATE/CONTEXT/DISK_ID'].empty?
    end

    def wild?
        @vm_name && !@vm_name.include?('one-')
    end

    # Returns a Hash representing the LXC configuration for this OpenNebulaVM
    def to_lxc
        lxc = {}

        lxc['name'] = @vm_name

        lxc['config']  = {}
        lxc['devices'] = {}

        profile(lxc)
        memory(lxc['config'])
        cpu(lxc['config'])
        extra_config(lxc['config'])
        network(lxc['devices'])
        storage(lxc['devices']) unless wild?

        lxc
    end

    #---------------------------------------------------------------------------
    # Container Attribute Mapping
    #---------------------------------------------------------------------------
    # Creates a dictionary for LXD containing $MEMORY RAM allocated
    def memory(hash)
        hash['limits.memory'] = "#{@xml['//TEMPLATE/MEMORY']}MB"
    end

    # Creates a dictionary for LXD  $CPU percentage and cores
    def cpu(hash)
        cpu = @xml['//TEMPLATE/CPU']
        hash['limits.cpu.allowance'] = "#{(cpu.to_f * 100).to_i}%"

        vcpu = @xml['//TEMPLATE/VCPU']
        return if vcpu.empty?

        numa = @xml.element('//TEMPLATE//NUMA_NODE')

        if numa.nil?
            hash['limits.cpu'] = vcpu
        else # pin CPU
            cores = numa['CPUS']
            cores += "-#{cores}" if cores.length == 1

            hash['limits.cpu'] = cores
        end
    end

    #---------------------------------------------------------------------------
    # Container Device Mapping: Networking
    #---------------------------------------------------------------------------
    # Get nic by mac
    def get_nic_by_mac(mac)
        get_nics.each do |n|
            return n if n['MAC'] == mac
        end
    end

    def get_nics
        @xml.elements('//TEMPLATE/NIC')
    end

    # Sets up the network interfaces configuration in devices
    def network(hash)
        get_nics.each do |n|
            hash.update(nic(n))
        end
    end

    # Creates a nic hash from NIC xml root
    def nic(info)
        eth = {
            'name'      => "eth#{info['NIC_ID']}",
            'host_name' => info['TARGET'],
            'parent'    => info['BRIDGE'],
            'hwaddr'    => info['MAC'],
            'nictype'   => 'bridged',
            'type'      => 'nic'
        }

        nic_map = {
            'limits.ingress' => 'INBOUND_AVG_BW',
            'limits.egress'  => 'OUTBOUND_AVG_BW'
        }

        io_map(nic_map, eth, info) {|v| "#{v.to_i * 8}kbit" }

        { "eth#{info['NIC_ID']}" => eth }
    end

    #---------------------------------------------------------------------------
    # Container Device Mapping: Storage
    #---------------------------------------------------------------------------
    # Get disk by target
    def get_disk_by_target(value)
        get_disk_by('TARGET', value)
    end

    # Get disk by id
    def get_disk_by_id(value)
        get_disk_by('DISK_ID', value)
    end

    # Get a disk depending on the filter xml key and the matching value
    def get_disks_by(filter, value)
        get_disks.each do |n|
            return n if n[filter] == value
        end
    end

    # Context disk XML
    def context_disk
        @xml.element('//TEMPLATE/CONTEXT')
    end

    # Disk XML array
    def get_disks
        @xml.elements('//TEMPLATE/DISK')
    end

    # Sets up the storage devices configuration in devices
    def storage(hash)
        get_disks.each do |n|
            next if swap?(n)

            hash.update(disk(n, nil, nil))
        end

        context(hash)
    end

    # Generate Context information
    def context(hash)
        cid = @xml['//TEMPLATE/CONTEXT/DISK_ID']

        return if cid.empty?

        source = disk_mountpoint(cid)

        hash['context'] = {
            'type'   => 'disk',
            'source' => source,
            'path'   => '/context'
        }
    end

    # Returns the disk mountpoint on the LXD node fs
    def disk_mountpoint(disk_id)
        datastore = @sysds_path
        datastore = File.readlink(@sysds_path) if File.symlink?(@sysds_path)
        "#{datastore}/#{@vm_id}/mapper/disk.#{disk_id}"
    end

    # @return [String] the canonical disk path for the given disk
    def disk_source(disk)
        disk_id   = disk['DISK_ID']
        disk_type = disk['DISK_TYPE']

        return "#{@sysds_path}/#{@vm_id}/disk.#{disk_id}" unless disk_type == 'RBD'

        src = disk['SOURCE']

        if disk['CLONE'] == 'YES'
            "#{src}-#{vm_id}-#{disk_id}"
        elsif volatile?(disk)
            "#{disk['POOL_NAME']}/one-sys-#{vm_id}-#{disk_id}"
        else
            src
        end
    end

    # Creates a disk hash from DISK xml element
    def disk(info, source, path)
        disk_id = info['DISK_ID']
        disk    = {}

        #-----------------------------------------------------------------------
        # Source & Path attributes
        #-----------------------------------------------------------------------
        if disk_id == @rootfs_id
            disk_name = 'root'
            disk = { 'type' => 'disk', 'path' => '/', 'pool' => 'default' }
        else
            source ||= disk_mountpoint(disk_id)

            unless path
                path = info['TARGET']
                path = "/media/#{disk_id}" unless path[0] == '/'
            end

            disk_name = "disk#{disk_id}"

            source = source.gsub('//', '/') if source.include?('//')

            disk = { 'type' => 'disk', 'source' => source, 'path' => path }
        end

        #-----------------------------------------------------------------------
        # Readonly attributes
        #-----------------------------------------------------------------------
        if info['READONLY'].casecmp('yes').zero?
            disk['readonly'] = 'true'
        else
            disk['readonly'] = 'false'
        end

        #-----------------------------------------------------------------------
        # IO limits
        #-----------------------------------------------------------------------
        tbytes = info['TOTAL_BYTES_SEC']
        tiops  = info['TOTAL_IOPS_SEC']

        if tbytes && !tbytes.empty?
            disk['limits.max'] = tbytes
        elsif tiops && !tiops.empty?
            disk['limits.max'] = "#{tiops}iops"
        end

        if tbytes.empty? && tiops.empty?
            disk_map = {
                'limits.read'  => 'READ_BYTES_SEC',
                'limits.write' => 'WRITE_BYTES_SEC'
            }

            mapped = io_map(disk_map, disk, info) {|v| v }

            if !mapped
                disk_map = {
                    'limits.read'  => 'READ_IOPS_SEC',
                    'limits.write' => 'WRITE_IOPS_SEC'
                }

                io_map(disk_map, disk, info) {|v| "#{v}iops" }
            end
        end

        { disk_name => disk }
    end

    def swap?(disk)
        return disk['TYPE'] == 'swap'
    end

    def volatile?(disk)
        return disk['TYPE'] == 'fs'
    end

    #---------------------------------------------------------------------------
    # Container Mapping: Extra Configuration & Profiles
    #---------------------------------------------------------------------------
    def extra_config(hash)
        security = {
            'security.privileged' => 'false',
            'security.nesting'    => 'false'
        }

        security.each_key do |key|
            item  = "LXD_SECURITY_#{key.split('.').last.swapcase}"

            value = @xml["//USER_TEMPLATE/#{item}"]
            security[key] = value unless value.empty?
        end

        hash.merge!(security)

        raw_data = {}

        data = @xml['//TEMPLATE/RAW/DATA']
        type = @xml['//TEMPLATE/RAW/TYPE']

        if !data.empty? && type.casecmp('lxd').zero?
            begin
                raw_data = JSON.parse("{#{data}}")
            rescue
            end
        end

        hash.merge!(raw_data) unless raw_data.empty?
    end

    def profile(hash)
        profile = @xml['//USER_TEMPLATE/LXD_PROFILE']

        if profile.empty?
            profile = 'default'
        else
            begin
                LXDClient.new.get("profiles/#{profile}")
            rescue LXDError => e
                raise e unless e.code == 404

                OpenNebula.log_error "Profile \"#{profile}\" not found\n#{e}"
                profile = 'default'
            end
        end

        hash['profiles'] = [profile]
    end

    def device_info(devices, key, filter)
        devices.each do |device|
            return device[key] if device[key].value?(filter)
        end
    end

    # Creates container vnc connection
    # Creates or closes a connection to a container rfb port depending on signal
    def vnc_command(signal, lxc_command)
        data = @xml.element('//TEMPLATE/GRAPHICS')
        return unless data && data['TYPE'].casecmp('vnc').zero?

        pass = data['PASSWD']
        pass = '-' if pass.empty?

        case signal
        when 'start'
            command = @lxdrc[:vnc][:command]
            command = data['COMMAND'] unless data['COMMAND'].empty?

            "#{data['PORT']} #{pass} #{lxc_command} exec #{@vm_name} #{command}\n"
        when 'stop'
            "-#{data['PORT']}\n"
        end
    end

    private

    # Maps IO limits from an OpenNebula VM configuration to a LXD configuration
    #   map: Hash that defines LXD name to OpenNebula name mapping
    #   lxd_conf: Hash with LXD configuration
    #   one_conf: XML Element with OpenNebula Configuration
    #
    #   Block: To transform OpenNebula value
    def io_map(map, lxd_conf, one_conf)
        mapped = false

        map.each do |key, value|
            one_value = one_conf[value]

            next if one_value.empty?

            lxd_conf[key] = yield(one_value)

            mapped = true
        end

        mapped
    end

end

# This class abstracts the access to XML elements. It provides basic methods
# to get elements by their xpath
class XMLElement

    def initialize(xml)
        @xml = xml
    end

    # Create a new XMLElement using a xml document in a string
    def self.new_s(xml_s)
        xml = nil
        xml = REXML::Document.new(xml_s).root unless xml_s.empty?

        new(xml)
    end

    # Gets the text associated to a th element. The element is select by
    # its xpath. If not found an empty string is returned
    def [](key)
        element = @xml.elements[key.to_s]

        return '' if (element && !element.has_text?) || !element

        element.text
    end

    # Return an XMLElement for the given xpath
    def element(key)
        e = @xml.elements[key.to_s]

        element = nil
        element = XMLElement.new(e) if e

        element
    end

    # Get elements by xpath. This function returns an Array of XMLElements
    def elements(key)
        collection = []

        @xml.elements.each(key) do |pelem|
            collection << XMLElement.new(pelem)
        end

        collection
    end

end
