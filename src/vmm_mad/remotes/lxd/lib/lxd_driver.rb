#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby' unless defined?(RUBY_LIB_LOCATION)
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby' unless defined?(RUBY_LIB_LOCATION)
end
[RUBY_LIB_LOCATION, __dir__].each {|dir| $LOAD_PATH << dir }

require 'rest/container'
require 'rest/client'
require 'mapper/raw'
require 'mapper/qcow2'
require 'scripts_common' # TODO: Check if works on node-only VM
require 'opennebula' # TODO: Check if works on node-only VM

# Tools required by the vmm scripts
module LXDriver

    SEP = '-' * 40
    CONTAINERS = '/var/lib/lxd/containers/' # TODO: Fix hardcode

    # Container Info
    class Info < Hash

        # TODO: separate hash creation funcions and utility functions to avoid recreating hashes on non container creation actions
        # TODO: Create hash with one => lxd mappings
        # TODO: Create method/attr per xml requested item

        TEMPLATE_PREFIX = '//TEMPLATE/'

        def initialize(xml_file)
            @xml = OpenNebula::XMLElement.new
            @xml.initialize_xml(xml_file, 'VM')

            self['name'] = 'one-' + xml_single_element('ID')
            self['config'] = {}
            self['devices'] = {}

            memory
            cpu
            network
            storage
        end

        # Creates a dictionary for LXD containing $MEMORY RAM allocated
        def memory
            ram = single_element('MEMORY')
            ram = ram.to_s + 'MB'
            self['config']['limits.memory'] = ram
        end

        # Creates a dictionary for LXD  $CPU percentage and cores
        def cpu
            cpu = single_element('CPU')
            cpu = (cpu.to_f * 100).to_i.to_s + '%'
            self['config']['limits.cpu.allowance'] = cpu

            vcpu = single_element('VCPU')
            self['config']['limits.cpu'] = vcpu if vcpu
        end

        ###############
        #   Network   #
        ###############

        # Sets up the network interfaces configuration in devices
        def network
            nics = multiple_elements('NIC')
            nics.each do |nic|
                info = nic['NIC']
                name = "eth#{info['NIC_ID']}"
                eth = { 'name' => name, 'host_name' => info['TARGET'],
                        'parent' => info['BRIDGE'], 'hwaddr' => info['MAC'],
                        'nictype' => 'bridged', 'type' => 'nic' }

                self['devices'][name] = nic_io(eth, info)
            end
        end

        # Returns a hash with QoS NIC values if defined
        def nic_io(nic, info)
            lxdl = %w[limits.ingress limits.egress]
            onel = %w[INBOUND_AVG_BW OUTBOUND_AVG_BW]

            nic_limits = io(lxdl, onel, info)
            nic_limits.each do |key, value|
                nic_limits[key] = nic_unit(value)
            end
            nic.update(nic_limits)
        end

        def nic_unit(limit)
            (limit.to_i * 8).to_s + 'kbit'
        end

        ###############
        #   Storage   #
        ###############

        # Sets up the storage devices configuration in devices
        # TODO: io
        def storage
            disks = multiple_elements('DISK')

            # disks
            if disks.length > 1
                ds_id = get_sysds_id
                dss_path = get_datastores
                vm_id = vm_id
                bootme = get_rootfs_id
                disks.each {|d| disks.insert(0, d).uniq if d['ID'] == bootme }

                disks[1..-1].each do |disk|
                    info = disk['DISK']
                    disk_id = info['DISK_ID']

                    source = device_path(dss_path, ds_id, "#{vm_id}/mapper", disk_id)
                    path = info['TARGET'] # TODO: path is TARGET: hda, hdc, hdd
                    path = '/mnt/mnt' unless path.include?('/')

                    disk_config = { 'type' => 'disk', 'path' => path, 'source' => source }
                    disk_config.update(disk_common(info))

                    self['devices']['disk' + disk_id] = disk_config
                end
            end

            # root
            info = disks[0]['DISK']
            root = { 'type' => 'disk', 'path' => '/', 'pool' => 'default' }
            self['devices']['root'] = root.update(disk_common(info))

            # context
            self['devices'].update(context) if single_element('CONTEXT')
        end

        def disk_common(info)
            config = { 'readonly' => 'false' }
            config['readonly'] = 'true' if info['READONLY'] == 'yes'
            disk_io(config, info)
        end

        # TODO: TOTAL_IOPS_SEC
        def disk_io(disk, info)
            lxdl = %w[limits.read limits.write limits.max]
            onel = %w[READ_BYTES_SEC WRITE_BYTES_SEC TOTAL_BYTES_SEC]
            disk.update(io(lxdl, onel, info))
        end

        # TODO: attr
        # Returns the diskid corresponding to the root device
        def get_rootfs_id
            # TODO: Add support when path is /
            bootme = '0'
            boot_order = single_element('OS/BOOT')
            bootme = boot_order.split(',')[0][-1] if boot_order != ''
            bootme
        end

        # TODO: attr
        def get_sysds_id
            xml_single_element('//HISTORY_RECORDS/HISTORY/DS_ID')
        end

        # gets opennebula datastores path
        # TODO: attr
        def get_datastores
            disk = multiple_elements('DISK')[0]['DISK']
            source = disk['SOURCE']
            ds_id = disk['DATASTORE_ID']
            source.split(ds_id + '/')[0]
        end

        def device_path(dss_path, ds_id, vm_id, disk_id)
            "#{dss_path}/#{ds_id}/#{vm_id}/disk.#{disk_id}"
        end

        # TODO:
        def context
            info = complex_element('CONTEXT')
            disk_id = info['DISK_ID']
            source = device_path(get_datastores, get_sysds_id, "#{vm_id}/mapper", disk_id)
            data = { 'type' => 'disk', 'source' => source, 'path' => '/mnt' }
            { 'context' => data }
        end

        ###############
        #    Misc     #
        ###############

        def io(lxdl, onel, info)
            limits = keyfexist(lxdl, onel, info)
            if limits != {}
                limits.each do |limit, value|
                    limits[limit] = value
                end
            end
            limits
        end

        # Creates a hash with the keys defined in lxd_keys if the corresponding key in xml_keys with the same index is defined in info
        def keyfexist(lxd_keys, xml_keys, info)
            hash = {}
            0.upto(lxd_keys.length) do |i|
                value = info[xml_keys[i]]
                hash[lxd_keys[i]] = value if value
            end
            hash
        end

        # TODO: attr
        def vm_id
            single_element('VMID')
        end

        ###############
        # XML Parsing #
        ###############

        # Returns PATH's instance in XML
        def xml_single_element(path)
            @xml[path]
        end

        def single_element(path)
            xml_single_element(TEMPLATE_PREFIX + path)
        end

        # Returns an Array with PATH's instances in XML
        def xml_multiple_elements(path)
            elements = []
            @xml.retrieve_xmlelements(path).each {|d| elements.append(d.to_hash) }
            elements
        end

        def multiple_elements(path)
            xml_multiple_elements(TEMPLATE_PREFIX + path)
        end

        def complex_element(path)
            multiple_elements(path)[0][path]
        end

    end

    class << self

        ###############
        ##   Misc    ##
        ###############

        def log_init
            OpenNebula.log_info('Begin ' + SEP)
        end

        def log_end(time)
            time = time(time)
            OpenNebula.log_info("End #{time} #{SEP[(time.size - 1)..-1]}")
        end

        # Returns the time passed since time
        def time(time)
            (Time.now - time).to_s
        end

        # Returns a mapper class depending on the driver string
        def select_driver(driver)
            case driver
            when 'raw'
                RAW
            when 'qcow2'
                QCOW2
            end
        end

        ###############
        #  Container  #
        ###############

        # Saves deployment path to container yaml
        def deployment_save(xml, path, container)
            f = File.new(path, 'w')
            f.write(xml)
            f.close
            container.config['user.xml'] = path
            container.update
        end

        def deployment_get(container)
            Info.new(File.open(container.config['user.xml']))
        end

        def context(info, action)
            mountpoint = info.context['context']['source']
            device = mountpoint.dup
            device.slice!('/mapper')
            RAW.run(action, mountpoint, device)
        end

        # Sets up the container mounts for type: disk devices
        def container_storage(info, action)
            disks = info.multiple_elements('DISK')
            ds_id = info.get_sysds_id
            dss_path = info.get_datastores
            vm_id = info.vm_id
            bootme = info.get_rootfs_id

            disks.each do |disk|
                disk_info = disk['DISK']
                disk_id = disk_info['DISK_ID']

                mountpoint = info.device_path(dss_path, ds_id, "#{vm_id}/mapper", disk_id)
                mountpoint = CONTAINERS + 'one-' + vm_id if disk_id == bootme

                mapper = select_driver(disk_info['DRIVER'])
                device = info.device_path(dss_path, ds_id, vm_id, disk_id)
                mapper.run(action, mountpoint, device)
            end

            context(info, action) if info.single_element('CONTEXT')
        end

        # Reverts changes if container fails to start
        def container_start(container, info)
            raise LXDError, container.status if container.start != 'Running'
        rescue LXDError => e
            container_storage(info, 'unmap')
            OpenNebula.log_error('Container failed to start')
            container.delete
            raise e
        end

        # Creates or overrides a container if one existed
        def container_create(container, client)
            config = container.config
            devices = container.devices
            if Container.exist?(container.name, client)
                OpenNebula.log_info('Overriding container')
                container = Container.get(container.name, client)
                err_msg = 'A container with the same ID is already running'
                raise LXDError, err_msg if container.status == 'Running'

                container.config.update(config)
                container.devices.update(devices)
                container.update
            else
                container.create
            end
        end

        # TODO: VNC server
        def vnc(info); end

    end

end
