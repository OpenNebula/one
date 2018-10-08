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
require 'xml_tools'
require 'mapper/raw'
require 'mapper/qcow2'
require 'scripts_common' # TODO: Check if works on node-only VM
require 'opennebula' # TODO: Check if works on node-only VM

# Tools required by the vmm scripts
module LXDriver

    SEP = '-' * 40
    CONTAINERS = '/var/lib/lxd/containers/' # TODO: Fix hardcode

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

        ###############
        #   Network   #
        ###############

        # TODO: QoS
        # Creates a nic hash
        def nic(name, host_name, bridge, mac)
            { 'name' => name, 'host_name' => host_name,
              'parent' => bridge, 'hwaddr' => mac,
              'nictype' => 'bridged', 'type' => 'nic' }
        end

        def nic_unit(limit)
            (limit.to_i * 8).to_s + 'kbit'
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

        ###############
        #   Storage   #
        ###############

        # TODO: IO
        # TODO: disk_common
        # Creates a disk hash
        def disk(source, path)
            { 'type' => 'disk', 'source' => source, 'path' => path }
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

        # Returns a mapper class depending on the driver string
        def select_driver(driver)
            case driver
            when 'raw'
                RAW
            when 'qcow2'
                QCOW2
            end
        end

        def device_path(info, vm_id, disk_id)
            "#{info.datastores}/#{info.sysds_id}/#{vm_id}/disk.#{disk_id}"
        end

        ###############
        #    Misc     #
        ###############

        # Creates a hash with the keys defined in lxd_keys if the
        # corresponding key in xml_keys with the same index is defined in info
        def keyfexist(lxd_keys, xml_keys, info)
            hash = {}
            0.upto(lxd_keys.length) do |i|
                value = info[xml_keys[i]]
                hash[lxd_keys[i]] = value if value
            end
            hash
        end

        # Maps existing one_limits into lxd_limits
        def io(lxdl, onel, info)
            limits = keyfexist(lxdl, onel, info)
            if limits != {}
                limits.each do |limit, value|
                    limits[limit] = value
                end
            end
            limits
        end

        # TODO: VNC server
        def vnc(info); end

        # TODO: Check if not needed (XML available STDIN)
        # Saves deployment path to container yaml
        def deployment_save(xml, path, container)
            f = File.new(path, 'w')
            f.write(xml)
            f.close
            container.config['user.xml'] = path
            container.update
        end

        def deployment_get(container)
            XML.new(File.open(container.config['user.xml']))
        end

        ###############
        #  Container  #
        ###############

        # Mount context iso in the LXD node
        def context(mountpoint, action)
            device = mountpoint.dup
            device.slice!('/mapper')
            RAW.run(action, mountpoint, device)
        end

        # Sets up the container mounts for type: disk devices
        def container_storage(info, action)
            disks = info.multiple_elements('DISK')
            vm_id = info.vm_id

            disks.each do |disk|
                disk_info = disk['DISK']
                disk_id = disk_info['DISK_ID']

                mountpoint = device_path(info, "#{vm_id}/mapper", disk_id)
                mountpoint = CONTAINERS + 'one-' + vm_id if disk_id == info.rootfs_id

                mapper = select_driver(disk_info['DRIVER'])
                device = device_path(info, vm_id, disk_id)
                mapper.run(action, mountpoint, device)
            end

            if info.complex_element('CONTEXT')
                context(info.context['context']['source'], action)
            end
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

    end

end
