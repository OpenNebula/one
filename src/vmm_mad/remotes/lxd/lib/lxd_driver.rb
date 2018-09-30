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
require_relative '../mapper/mapper'
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
    DATASTORES = '/var/lib/one/datastores/' # TODO: Fix hardcode

    # Container Info
    class Info < Hash

        attr_accessor :xml

        TEMPLATE_PREFIX = '//TEMPLATE/'

        def initialize(xml)
            self.xml = xml
            self['name'] = 'one-' + single_element('ID')
            self['config'] = {}
            self['devices'] = {}
            memory
            cpu
            network
            # storage
            # vnc
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

        # Sets up the storage devices configuration in devices
        # TODO: readonly
        # TODO: Read boot order
        def storage
            disks = multiple_elements_pre('DISK')
            boot_order = single_element_pre('OS/BOOT')

            bootme = 0
            bootme = boot_order.split(',')[0][-1] if boot_order != ''

            disks.each {|d| disks.insert(0, d).uniq if d['ID'] == bootme }

            self['rootfs'] = info['DISK'][0]
        end

        def rootfs(bootme)
            #  info = disk['DISK']
            #  self['rootfs'] = disks[0]

            # root_info = multiple_elements_pre('DISK')[bootme]['DISK']

            # Optional args
            # io = {'limits.read' => '', 'limits.write' => '', 'limits.max' => '' }
            # io['limits.ingress'] = nic_unit(info['INBOUND_AVG_BW']) if info['INBOUND_AVG_BW']
            # io['limits.egress'] = nic_unit(info['OUTBOUND_AVG_BW']) if info['OUTBOUND_AVG_BW']
        end

        def datablock
            # disks.each do |disk|
            #     next if info['DISK_ID'] == bootme

            #         name = "disk#{info['DISK_ID']}"
            #         ds_id = info['DATASTORE_ID']
            #         disk_id = info['DISK_ID']
            #         vm_id = info['VM_ID']
            #         driver = info['DRIVER']

            #         device = device_path(ds_id, vm_id, disk_id)

            #         # TODO: Mapping actions should be done outside of initialize
            #         # Mapper.run('map', dir, driver, device)

            #         disk = {}
            #         self['devices'][name] = disk
            #         end
            # end
        end

        def context; end

        def vnc; end

        def nic_unit(limit)
            (limit.to_i * 8).to_s + 'kbit'
        end

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

        def disk(disks)
            disks.each do |disk|

                vm_id = disk['VM_ID']
                ds_id = disk['DATASTORE_ID']
                disk_id = disk['DISK_ID']
                st_driver = disk['DRIVER']
                device = device_path(ds_id, vm_id, disk_id)

                if disk['DISK_ID'].zero? # rootfs
                    source = CONTAINERS + container.name
                    # io = {'limits.read' => '', 'limits.write' => '', 'limits.max' => '' }
                    # io['limits.ingress'] = nic_unit(info['INBOUND_AVG_BW']) if info['INBOUND_AVG_BW']
                    # io['limits.egress'] = nic_unit(info['OUTBOUND_AVG_BW']) if info['OUTBOUND_AVG_BW']
                # else
                #     name = "disk#{disk['DISK_ID']}"
                #     source = info['SOURCE']
                #     path = info['PATH']

                #     disk = {}
                #     self['devices'][name] = disk

                Mapper.run('map', source, st_driver, device)
            end
        end

        def device_path(ds_id, vm_id, disk_id)
            "#{DATASTORES}/#{ds_id}/#{vm_id}/disk.#{disk_id}"
        end

        def save_deployment(xml, path, container)
            f = File.new(path, 'w')
            f.write(xml)
            f.close
            container.config['user.xml'] = path
            container.update
        end

        def start_container(container)
            raise LXDError, container.status if container.start != 'Running'
        rescue LXDError => e
            # TODO: Fix mapper
            Mapper.run('unmap', LXDriver::CONTAINERS + container.name)
            OpenNebula.log_error('Container failed to start')
            container.delete
            raise e
        end

    end

end
