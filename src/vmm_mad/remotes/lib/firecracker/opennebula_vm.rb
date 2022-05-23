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
require 'yaml'
require 'command'

require_relative '../lib/xmlparser'
require_relative '../lib/opennebula_vm'
require_relative '../../scripts_common'

# This class reads and holds configuration attributes for the Firecracker driver
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
        :cgroup_delete_timeout => 10,
        :numa_policy => 'random'
    }

    FIRECRACKERRC = '../../etc/vmm/firecracker/firecrackerrc'

    def initialize
        replace(DEFAULT_CONFIGURATION)

        begin
            merge!(YAML.load_file("#{__dir__}/#{FIRECRACKERRC}"))
        rescue StandardError => e
            OpenNebula.log_error e
        end

        super
    end

end

# This class parses and wraps the information in the Driver action data
class FirecrackerVM < OpenNebulaVM

    # rubocop:disable Naming/PredicateName
    # rubocop:disable Naming/AccessorMethodName

    attr_reader :fcrc

    #---------------------------------------------------------------------------
    # Class Constructor
    #---------------------------------------------------------------------------
    def initialize(xml)
        # Load Driver configuration
        @fcrc = FirecrackerConfiguration.new

        super(xml, @fcrc)

        return if wild?

        @uid = @fcrc[:uid]
        @gid = @fcrc[:gid]
        @exec_file = @fcrc[:firecracker_location]
    end

    # Returns a Hash representing the Firecracker configuration for the VM
    def to_fc
        fc = {}

        fc['boot-source'] = {}
        fc['drives'] = []
        fc['machine-config'] = {}
        fc['network-interfaces'] = []

        # Set logger info
        fc['logger'] = {}
        fc['logger']['log_path'] = LOG_FILE
        fc['logger']['level'] = 'Debug'

        # Set metrics info
        fc['metrics'] = {}
        fc['metrics']['metrics_path'] = METRICS_FILE
        fc['metrics']['level'] = 'Debug'

        boot_source(fc['boot-source'])
        drives(fc['drives'])
        machine_config(fc['machine-config'])
        nic(fc['network-interfaces'])

        fc.to_json
    end

    def command_params
        hash = {}
        hash['jailer'] = {}
        hash['firecracker'] = {}

        jailer_params(hash['jailer'])
        firecracker_params(hash['firecracker'])

        hash
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

    def log_path
        "#{location}/#{LOG_FILE}"
    end

    def metrics_path
        "#{location}/#{METRICS_FILE}"
    end

    private

    LOG_FILE = 'logs.fifo'
    METRICS_FILE = 'metrics.fifo'

    #---------------------------------------------------------------------------
    # MicroVM Attribute Mapping
    #---------------------------------------------------------------------------
    # Creates a dictionary for Firecracker containing vm information

    def boot_source(hash)
        hash['kernel_image_path'] = 'kernel'
        hash['boot_args'] = @xml['//TEMPLATE/OS/KERNEL_CMD']

        initrd = @xml['//TEMPLATE/OS/INITRD']

        return if initrd.nil? || initrd.empty?

        hash['initrd_path'] = File.basename(initrd, '/')
    end

    def machine_config(hash)
        hash['mem_size_mib'] = Integer(@xml['//TEMPLATE/MEMORY'].to_s)

        vcpu = @xml['//TEMPLATE/VCPU']

        vcpu = 1 if vcpu.nil? || vcpu.empty?

        hash['vcpu_count'] = Integer(vcpu)

        ht = @xml['//TEMPLATE/TOPOLOGY/THREADS']
        hash['ht_enabled'] = !(ht.nil? || ht.empty? || Integer(ht.to_s) <= 1)
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

    #---------------------------------------------------------------------------
    # MicroVM Device Mapping: NUMA
    #---------------------------------------------------------------------------

    def get_numa_node
        rc, nodes, = Command.execute('ls /sys/devices/system/node | grep node',
                                     false)

        return -1 unless rc.zero?

        nodes = nodes.split("\n")

        case @fcrc[:numa_policy].downcase
        when 'rr'
            rr_policy(nodes)
        when 'random'
            random_policy(nodes)
        else
            random_policy(nodes)
        end
    end

    def rr_policy(nodes)
        Integer(nodes[@vm_id % nodes.size].gsub('node', ''))
    end

    def random_policy(nodes)
        Integer(nodes.sample.gsub('node', ''))
    end

    # rubocop:enable Naming/PredicateName
    # rubocop:enable Naming/AccessorMethodName

end
