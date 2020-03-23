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
require 'command'

# This class reads and holds configuration attributes for the LXD driver
class FirecrackerConfiguration < Hash

    DEFAULT_CONFIGURATION = {
        :vnc => {
            :width   => '800',
            :height  => '600',
            :timeout => '300'
        },
        :datastore_location   => '/var/lib/one/datastores',
        :firecracker_location => '/usr/bin/firecracker',
        :uid => 9869,
        :gid => 9869,
        :shutdown_timeout => 10,
        :cgroup_location => '/sys/fs/cgroup',
        :cgroup_delete_timeout => 10
    }

    FIRECRACKERRC = '../../etc/vmm/firecracker/firecrackerrc'

    def initialize
        replace(DEFAULT_CONFIGURATION)

        begin
            merge!(YAML.load_file("#{__dir__}/#{FIRECRACKERRC}"))
        rescue StandardError => e
            OpenNebula.log_error e
        end
    end

end

# This class parses and wraps the information in the Driver action data
class OpenNebulaVM

    # rubocop:disable Naming/PredicateName
    # rubocop:disable Naming/AccessorMethodName

    attr_reader :xml, :vm_id, :vm_name, :sysds_path, :rootfs_id, :fcrc

    #---------------------------------------------------------------------------
    # Class Constructor
    #---------------------------------------------------------------------------
    def initialize(xml)
        @xml = XMLElement.new_s(xml)
        @xml = @xml.element('//VM')

        @vm_id    = Integer(@xml['//TEMPLATE/VMID'])
        @vm_name  = @xml['//DEPLOY_ID']
        @vm_name  = "one-#{@vm_id}" if @vm_name.empty?

        # Load Driver configuration
        @fcrc = FirecrackerConfiguration.new

        sysds_id = @xml['//HISTORY_RECORDS/HISTORY/DS_ID']
        @sysds_path = "#{@fcrc[:datastore_location]}/#{sysds_id}"

        return if wild?

        # Sets the DISK ID of the root filesystem
        disk = @xml.element('//TEMPLATE/DISK')

        return unless disk

        @rootfs_id = disk['DISK_ID']
        boot_order = @xml['//TEMPLATE/OS/BOOT']
        @rootfs_id = boot_order.split(',')[0][-1] unless boot_order.empty?
        @boot_args = @xml['//TEMPLATE/OS/KERNEL_CMD']
        @uid = @fcrc[:uid]
        @gid = @fcrc[:gid]
        @exec_file = @fcrc[:firecracker_location]
    end

    def has_context?
        !@xml['//TEMPLATE/CONTEXT/DISK_ID'].empty?
    end

    def wild?
        @vm_name && !@vm_name.include?('one-')
    end

    # Returns a Hash representing the LXC configuration for this OpenNebulaVM
    def to_fc
        fc = {}

        fc['name'] = @vm_name

        fc['deployment-file'] = {}
        fc['deployment-file']['boot-source'] = {}
        fc['deployment-file']['drives'] = []
        fc['deployment-file']['machine-config'] = {}
        fc['deployment-file']['network-interfaces'] = []
        fc['command-params'] = {}

        # Set logger info
        fc['deployment-file']['logger'] = {}
        fc['deployment-file']['logger']['log_fifo'] = 'logs.fifo'
        fc['deployment-file']['logger']['metrics_fifo'] = 'metrics.fifo'

        boot_source(fc['deployment-file']['boot-source'])
        drives(fc['deployment-file']['drives'])
        machine_config(fc['deployment-file']['machine-config'])
        nic(fc['deployment-file']['network-interfaces'])
        command_params(fc['command-params'])

        fc
    end

    #---------------------------------------------------------------------------
    # Container Attribute Mapping
    #---------------------------------------------------------------------------
    # Creates a dictionary for Firecracker containing $MEMORY RAM allocated
    def boot_source(hash)
        hash['kernel_image_path'] = 'kernel'
        hash['boot_args'] = @boot_args
    end

    def machine_config(hash)
        hash['mem_size_mib'] = Integer(@xml['//TEMPLATE/MEMORY'].to_s)

        vcpu = @xml['//TEMPLATE/VCPU']

        vcpu = 1 if vcpu.nil? || vcpu.empty?

        hash['vcpu_count'] = Integer(vcpu)

        hash['ht_enabled'] = false
    end

    def command_params(hash)
        hash['jailer'] = {}
        hash['firecracker'] = {}

        jailer_params(hash['jailer'])
        firecracker_params(hash['firecracker'])
    end

    def jailer_params(hash)
        hash['id'] = "one-#{vm_id}"
        hash['node'] = get_numa_node
        hash['exec-file'] = @exec_file
        hash['uid'] = @uid
        hash['gid'] = @gid
        hash['daemonize'] = '' unless vnc?
    end

    def firecracker_params(hash)
        hash['config-file'] = 'deployment.file'
    end

    #---------------------------------------------------------------------------
    # MicroVM Device Mapping: Networking
    #---------------------------------------------------------------------------

    def get_nics
        @xml.elements('//TEMPLATE/NIC')
    end

    def nic(array)
        get_nics.each do |n|
            eth = {
                'iface_id'            => "eth#{n['NIC_ID']}",
                'host_dev_name'       => "one-#{@vm_id}-#{n['NIC_ID']}",
                'guest_mac'           => n['MAC'],
                'allow_mmds_requests' => true # TODO, manage this
            }

            array << eth
        end
    end

    #---------------------------------------------------------------------------
    # MicroVM Device Mapping: Storage
    #---------------------------------------------------------------------------

    # Generate Context information
    def drives(array)
        get_disks.each do |n|
            disk_id = n['DISK_ID']

            drive = {
                'drive_id'       => "disk.#{disk_id}",
                'path_on_host'   => "disk.#{disk_id}",
                'is_root_device' => @rootfs_id == disk_id,
                'is_read_only'   => n['READONLY'].casecmp('yes') == 0
            }

            array << drive
        end

        return unless has_context?

        cid = Integer(@xml['//TEMPLATE/CONTEXT/DISK_ID'])
        drive = {
            'drive_id'       => "disk.#{cid}",
            'path_on_host'   => "disk.#{cid}",
            'is_root_device' => @rootfs_id == cid,
            'is_read_only'   => true
        }

        array << drive
    end

    def get_disks
        @xml.elements('//TEMPLATE/DISK')
    end

    def context(hash)
        cid = @xml['//TEMPLATE/CONTEXT/DISK_ID']

        return if cid.empty?

        source = disk_location(cid)

        hash['context'] = {
            'type'    => 'disk',
            'source'  => source,
            'path'    => '/context',
            'disk_id' => cid
        }
    end

    def disk_location(disk_id)
        datastore = @sysds_path
        datastore = File.readlink(@sysds_path) if File.symlink?(@sysds_path)
        "#{datastore}/#{@vm_id}/disk.#{disk_id}"
    end

    #---------------------------------------------------------------------------
    # MicroVM Device Mapping: NUMA
    #---------------------------------------------------------------------------

    def get_numa_node
        rc, nodes, = Command.execute('ls /sys/devices/system/node | grep node',
                                     false)

        return -1 unless rc.zero?

        nodes = nodes.split("\n")

        Integer(nodes[@vm_id % nodes.size].gsub('node', ''))
    end

    #---------------------------------------------------------------------------
    # Container Mapping: Extra Configuration & Profiles
    #---------------------------------------------------------------------------

    # Creates microVM vnc connection
    # Creates or closes a connection to a microVM rfb port depending on signal
    def vnc_command(signal, vnc_command)
        data = @xml.element('//TEMPLATE/GRAPHICS')
        return unless data && data['TYPE'].casecmp('vnc').zero?

        pass = data['PASSWD']
        pass = '-' if pass.empty?

        case signal
        when 'start'
            "#{data['PORT']} #{pass} #{vnc_command} #{@vm_name}\n"
        when 'stop'
            "-#{data['PORT']}\n"
        end
    end

    def vnc?
        data = @xml.element('//TEMPLATE/GRAPHICS')
        data && data['TYPE'].casecmp('vnc').zero?
    end

    # rubocop:enable Naming/PredicateName
    # rubocop:enable Naming/AccessorMethodName

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
