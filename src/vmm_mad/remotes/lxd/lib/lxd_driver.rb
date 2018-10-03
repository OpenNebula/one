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

require_relative 'container'
require_relative 'client'
require_relative '../mapper/raw'
require_relative '../mapper/qcow2'
require_relative '../../../scripts_common.rb'

ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby' unless defined?(RUBY_LIB_LOCATION)
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby' unless defined?(RUBY_LIB_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION

require 'opennebula'

# Tools required by the vmm scripts
module LXDriver

    SEP = '-' * 40
    CONTAINERS = '/var/lib/lxd/containers/' # TODO: Fix hardcode

    # Container Info
    class Info < Hash

        attr_accessor :xml

        TEMPLATE_PREFIX = '//TEMPLATE/'

        def initialize(xml_file)
            xml = OpenNebula::XMLElement.new
            xml.initialize_xml(xml_file, 'VM')
            self.xml = xml

            self['name'] = 'one-' + single_element('ID')
            self['config'] = {}
            self['devices'] = {}

            # TODO: deal with missing parameters
            memory
            cpu
            network
            storage
        end

        # Creates a dictionary for LXD containing $MEMORY RAM allocated
        def memory
            ram = single_element_pre('MEMORY')
            ram = ram.to_s + 'MB'
            self['config']['limits.memory'] = ram
        end

        # Creates a dictionary for LXD  $CPU percentage and cores
        def cpu
            cpu = single_element_pre('CPU')
            vcpu = single_element_pre('VCPU')
            cpu = (cpu.to_f * 100).to_i.to_s + '%'
            self['config']['limits.cpu.allowance'] = cpu
            self['config']['limits.cpu'] = vcpu
        end

        # Sets up the network interfaces configuration in devices
        def network
            nics = multiple_elements_pre('NIC')
            nics.each do |nic|
                info = nic['NIC']
                name = "eth#{info['NIC_ID']}"
                eth = { 'name' => name, 'host_name' => info['TARGET'],
                        'parent' => info['BRIDGE'], 'hwaddr' => info['MAC'],
                        'nictype' => 'bridged', 'type' => 'nic' }

                # Optional args
                eth['limits.ingress'] = nic_unit(info['INBOUND_AVG_BW']) if info['INBOUND_AVG_BW']
                eth['limits.egress'] = nic_unit(info['OUTBOUND_AVG_BW']) if info['OUTBOUND_AVG_BW']

                self['devices'][name] = eth
            end
        end

        def nic_unit(limit)
            (limit.to_i * 8).to_s + 'kbit'
        end

        ###############
        #   Storage   #
        ###############

        # Sets up the storage devices configuration in devices
        # TODO: readonly
        # TODO: io
        # TODO: source
        # TODO: path
        def storage
            # disks = multiple_elements_pre('DISK')
            # boot_order = single_element_pre('OS/BOOT')
            #     name = "disk#{disk['DISK_ID']}"
            #     self['devices'][name] = disk

            #     path = info['PATH']
            # bootme = 0
            # bootme = boot_order.split(',')[0][-1] if boot_order != ''

            # disks.each {|d| disks.insert(0, d).uniq if d['ID'] == bootme }

            # self['disks'] = disks
            # self['rootfs'] = disks[0]
            #     disk = { 'path' => path, 'source' => source }

            # io = {'limits.read' => '', 'limits.write' => '', 'limits.max' => '' }
            # io['limits.read'] = nic_unit(info['INBOUND_AVG_BW']) if info['INBOUND_AVG_BW']
            # io['limits.write'] = nic_unit(info['OUTBOUND_AVG_BW']) if info['OUTBOUND_AVG_BW']
        end

        # gets opennebula datastores path
        def get_datastores
            disk = multiple_elements_pre('DISK')[0]['DISK']
            source = disk['SOURCE']
            ds_id = disk['DATASTORE_ID']
            source.split(ds_id + '/')[0]
        end

        def context; end

        ###############
        # XML Parsing #
        ###############

        # Returns PATH's instance in XML
        def single_element(path)
            xml[path]
        end

        def single_element_pre(path)
            single_element(TEMPLATE_PREFIX + path)
        end

        # Returns an Array with PATH's instances in XML
        def multiple_elements(path)
            elements = []
            xml.retrieve_xmlelements(path).each {|d| elements.append(d.to_hash) }
            elements
        end

        def multiple_elements_pre(path)
            multiple_elements(TEMPLATE_PREFIX + path)
        end

    end

    class << self

        def log_init
            OpenNebula.log_info('Begin ' + SEP)
        end

        def log_end(time)
            time = time(time)
            OpenNebula.log_info("End #{time} #{SEP[(time.size - 1)..-1]}")
        end

        def time(time)
            (Time.now - time).to_s
        end

        # Sets up the container mounts for type: disk devices
        def disk(info, action)
            # TODO: improve use of conditions for root and actions
            disks = info.multiple_elements_pre('DISK')
            ds_id = info.single_element('//HISTORY_RECORDS/HISTORY/DS_ID')
            dss_path = info.get_datastores
            vm_id = info.single_element_pre('VMID')
            bootme = get_rootfs_id(info)
            mountpoint = CONTAINERS + 'one-' + vm_id

            disks.each do |disk|
                info = disk['DISK']
                disk_id = info['DISK_ID']

                if disk_id != bootme # non_rootfs
                    mountpoint = device_mapper_dir(dss_path, ds_id, vm_id, disk_id)
                    raise "failed to create #{mountpoint}" if action == 'map' && !system("mkdir -p #{mountpoint}")
                end

                mapper = select_driver(info['DRIVER'])
                device = device_path(dss_path, ds_id, vm_id, disk_id)
                mapper.run(action, mountpoint, device)
            end
        end

        # Returns the diskid corresponding to the root device
        def get_rootfs_id(info)
            # TODO: Add support when path is /
            bootme = '0'
            boot_order = info.single_element_pre('OS/BOOT')
            bootme = boot_order.split(',')[0][-1] if boot_order != ''
            bootme
        end

        def device_path(dss_path, ds_id, vm_id, disk_id)
            "#{dss_path}/#{ds_id}/#{vm_id}/disk.#{disk_id}"
        end

        def device_mapper_dir(dss_path, ds_id, vm_id, disk_id)
            # TODO: improve from device_path
            # TODO: use for Info.storage in 'source'
            "#{dss_path}/#{ds_id}/#{vm_id}/mapper/disk.#{disk_id}"
        end

        def select_driver(driver)
            case driver
            when 'raw'
                RAW
            when 'qcow2'
                QCOW2
            end
        end

        # Saves deployment path to container yaml
        def save_deployment(xml, path, container)
            f = File.new(path, 'w')
            f.write(xml)
            f.close
            container.config['user.xml'] = path
            container.update
        end

        # Reverts changes if container fails to start
        def start_container(container, info)
            raise LXDError, container.status if container.start != 'Running'
        rescue LXDError => e
            disk(info, 'unmap')
            OpenNebula.log_error('Container failed to start')
            container.delete
            raise e
        end

        def vnc; end

    end

end
