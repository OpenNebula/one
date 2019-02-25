#!/usr/bin/ruby

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

$LOAD_PATH.unshift File.dirname(__FILE__)

require 'client'

require 'opennebula_vm'
require 'command'

require 'mapper'
require 'raw'
require 'qcow2'
require 'rbd'

# This class interacts with the LXD container on REST level
class Container

    #---------------------------------------------------------------------------
    # Class Constants API and Containers Paths
    #---------------------------------------------------------------------------
    CONTAINERS = 'containers'.freeze
    LXC_COMMAND = 'lxc'

    #---------------------------------------------------------------------------
    # Methods to access container attributes
    #---------------------------------------------------------------------------
    CONTAINER_ATTRIBUTES = %w[name devices architecture config profile
                              expanded_config expanded_devices ].freeze

    CONTAINER_ATTRIBUTES.each do |attr|
        define_method(attr.to_sym) do
            @lxc[attr]
        end

        define_method("#{attr}=".to_sym) do |value|
            @lxc[attr] = value
        end
    end

    #---------------------------------------------------------------------------
    # Class constructors & static methods
    #---------------------------------------------------------------------------
    # Creates the container object in memory.
    # Can be later created in LXD using create method
    def initialize(lxc, one, client)
        @client = client

        @lxc = lxc
        @one = one

        @rootfs_dir = "#{@client.lxd_path}/storage-pools/default/containers/#{name}/rootfs"
    end

    class << self

        # Returns specific container, by its name
        # Params:
        # +name+:: container name
        def get(name, one_xml, client)
            info = info(name, client)

            one  = nil
            one  = OpenNebulaVM.new(one_xml) if one_xml

            Container.new(info, one, client)
        rescue LXDError => exception
            raise exception
        end

        # Creates container from a OpenNebula VM xml description
        def new_from_xml(one_xml, client)
            one = OpenNebulaVM.new(one_xml)

            Container.new(one.to_lxd, one, client)
        end

        # Returns an array of container objects
        def get_all(client)
            containers = []

            container_names = client.get(CONTAINERS)['metadata']
            container_names.each do |name|
                name = name.split('/').last
                containers.push(get(name, nil, client))
            end

            containers
        end

        # Returns boolean indicating if the container exists(true) or not (false)
        def exist?(name, client)
            client.get("#{CONTAINERS}/#{name}")
            true
        rescue LXDError => exception
            raise exception if exception.body['error_code'] != 404

            false
        end

        # Retreive container configuration information
        def info(name, client)
            client.get("#{CONTAINERS}/#{name}")['metadata']
        end

    end

    #---------------------------------------------------------------------------
    # Container Management
    #---------------------------------------------------------------------------
    # Create a container without a base image
    def create(wait: true, timeout: '')
        @lxc['source'] = { 'type' => 'none' }
        wait?(@client.post(CONTAINERS, @lxc), wait, timeout)

        update_info
    end

    # Delete container
    def delete(wait: true, timeout: '')
        # TODO: Add extra mounts to raise
        raise 'Container rootfs still mounted' if Mapper.mount_on?(@rootfs_dir)

        wait?(@client.delete("#{CONTAINERS}/#{name}"), wait, timeout)
    end

    # Updates the container in LXD server with the new configuration
    def update(wait: true, timeout: '')
        wait?(@client.put("#{CONTAINERS}/#{name}", @lxc), wait, timeout)
    end

    # Runs command inside container
    # @param command [String] to execute through lxc exec
    # TODO: Use REST
    def exec(command)
        cmd = "#{LXC_COMMAND} exec #{@one.vm_name} -- #{command}"
        rc, o, e = Command.execute(cmd, true)

        # TODO: this should be removed when Snap bug is fixed
        err = 'cannot create user data directory:'
        rc, o, e = Command.execute("sudo #{cmd}", true) if e.include?(err)

        log = "Failed to run command #{cmd}: #{e}"
        OpenNebula.log_error("#{__method__}: #{log}") unless rc.zero?

        [rc, o, e]
    end

    # Sets up the container vnc connection
    def vnc(signal)
        command = @one.vnc_command(signal)
        return if command.nil?

        w = @one.lxdrc[:vnc][:width]
        h = @one.lxdrc[:vnc][:height]
        t = @one.lxdrc[:vnc][:timeout]

        vnc_args = "-w #{w} -h #{h} -t #{t}"

        pipe = '/tmp/svncterm_server_pipe'
        bin  = 'svncterm_server'
        server = "#{bin} #{vnc_args}"

        rc, _o, e = Command.execute_once(server, true)

        unless [nil, 0].include?(rc)
            OpenNebula.log_error("#{__method__}: #{e}\nFailed to start vnc")
            return
        end

        lfd = Command.lock

        File.open(pipe, 'a') do |f|
            f.write command
        end
    ensure
        Command.unlock(lfd) if lfd
    end

    # Return if this is a wild container. Needs the associated OpenNebulaVM
    # description
    def wild?
        @one.wild? if @one
    end

    #---------------------------------------------------------------------------
    # Container Monitoring
    #---------------------------------------------------------------------------

    def running?
        status_ask('Running')
    end

    def stopped?
        status_ask('Stopped')
    end

    def status
        statuses('status')
    end

    def status_code
        statuses('status_code')
    end

    # Returns the container live state
    def monitor
        @client.get("#{CONTAINERS}/#{name}/state")
    end

    #---------------------------------------------------------------------------
    # Container Status Control
    #---------------------------------------------------------------------------
    def start(options = {})
        change_state(__method__, options)
    end

    def stop(options = { :timeout => 120 })
        change_state(__method__, options)
    end

    def restart(options = {})
        change_state(__method__, options)
    end

    def freeze(options = {})
        change_state(__method__, options)
    end

    def unfreeze(options = {})
        change_state(__method__, options)
    end

    #---------------------------------------------------------------------------
    # Container Networking
    #---------------------------------------------------------------------------
    def attach_nic(mac)
        return unless @one

        nic_xml = @one.get_nic_by_mac(mac)

        raise 'Missing NIC xml' unless nic_xml

        nic_config = @one.nic(nic_xml)

        @lxc['devices'].update(nic_config)

        update
    end

    def detach_nic(mac)
        @lxc['devices'].delete_if do |device, config|
            device.include?('eth') && config['hwaddr'] == mac
        end

        update
    end

    #---------------------------------------------------------------------------
    # Container Storage
    #---------------------------------------------------------------------------
    # Sets up the container mounts for type: disk devices.
    def setup_storage(operation)
        return unless @one

        @one.disks.each do |disk|
            next if setup_disk(disk, operation)

            return nil
        end

        return true unless @one.context?

        if operation == 'map'
            return unless contextualize
        end

        context_mapper_do(operation)
    end

    # Attach disk to container (ATTACH = YES) in VM description
    def attach_disk
        disk = hotplug_disk

        return if @one.volatile?(disk)

        mapper = new_disk_mapper(disk, @one.disk_mountpoint(disk['DISK_ID']))
        mapper.public_send(operation)

        @lxc['devices'].update(@one.disk(disk, nil, nil))
        update

        true
    end

    # Detach disk to container (ATTACH = YES) in VM description
    def detach_disk
        disk = hotplug_disk

        disk_name = "disk#{disk['DISK_ID']}"

        if !@lxc['devices'].key?(disk_name)
            OpenNebula.log_error "Failed to detect #{disk_name} on \
            container devices\n#{@lxc['devices']}"

            return
        end

        mountpoint = @lxc['devices'][disk_name]['source'].clone

        @lxc['devices'].delete(disk_name)['source']
        update

        mapper = new_disk_mapper(disk, mountpoint)
        mapper.unmap
    end

    # Generate the context devices and maps the context the device
    def attach_context
        @one.context(@lxc['devices'])

        return unless context_mapper_do('map')

        update

        true
    end

    # Removes the context section from the LXD configuration and unmap the
    # context device
    def detach_context
        return true unless @one.context?

        @lxc['devices'].delete('context')['source']
        update

        context_mapper_do('unmap')
    end

    private

    # Waits or no for response depending on wait value
    def wait?(response, wait, timeout)
        @client.wait(response, timeout) unless wait == false
    end

    # Performs an action on the container that changes the execution status.
    # Accepts optional args
    def change_state(action, options)
        options.update(:action => action)

        response = @client.put("#{CONTAINERS}/#{name}/state", options)
        status = wait?(response, options[:wait], options[:timeout])

        update_info

        status
    end

    def statuses(key)
        monitor['metadata'][key] if Container.exist?(name, @client)
    end

    def status_ask(state)
        return true if status == state

        false
    end

    # Sets the LXD container query output to container object attributes
    def update_info
        @lxc = self.class.info(name, @client)
    end

    # Returns a mapper for the disk
    #  @param disk [XMLElement] with the disk data
    #
    #  TODO This maps should be built dynamically or based on a DISK attribute
    #  so new mappers does not need to modified source code
    def new_disk_mapper(disk, directory)
        case disk['TYPE']
        when 'FILE', 'BLOCK'

            ds = @one.disk_source(disk)

            rc, out, err = Command.execute("#{Mapper::COMMANDS[:file]} #{ds}", false)

            unless rc.zero?
                OpenNebula.log_error("#{__method__} #{err}")
                return
            end

            case out
            when /.*QEMU QCOW.*/
                OpenNebula.log "Using qcow2 mapper for #{ds}"
                Qcow2Mapper.new(@one, disk, directory)
            when /.*filesystem.*/
                OpenNebula.log "Using raw filesystem mapper for #{ds}"
                FSRawMapper.new(@one, disk, directory)
            when /.*boot sector.*/
                OpenNebula.log "Using raw disk mapper for #{ds}"
                DiskRawMapper.new(@one, disk, directory)
            else
                OpenNebula.log("Unknown #{out} image format, \
                    trying raw filesystem mapper")
                FSRawMapper.new(@one, disk, directory)
            end
        when 'RBD'
            OpenNebula.log "Using rbd disk mapper for #{ds}"
            RBDMapper.new(@one, disk, directory)
        end
    end

    # Returns disk element being hotplugged
    def hotplug_disk
        return unless @one

        disk_a = @one.disks.select do |disk|
            disk['ATTACH'].casecmp('YES').zero?
        end

        disk = disk_a.first
        raise 'Missing hotplug info' unless disk

        disk
    end

    # Setup the disk by mapping/unmapping the disk device
    def setup_disk(disk, operation)
        return unless @one

        if disk['DISK_ID'] == @one.rootfs_id
            mountpoint = @rootfs_dir
        else
            return if @one.volatile?(disk)

            mountpoint = @one.disk_mountpoint(disk['DISK_ID'])
        end

        mapper = new_disk_mapper(disk, mountpoint)
        mapper.public_send(operation)
    end

    def context_mapper_do(operation)
        mapper = FSRawMapper.new(@one, @one.context_disk, @one.context_mountpoint)
        mapper.public_send(operation)
    end

    # Sets up the contextualization directory inside the container
    def contextualize
        context_path = "#{@rootfs_dir}/context"
        create_context_dir = "#{Mapper::COMMANDS[:su_mkdir]} #{context_path}"

        rc, _o, e = Command.execute(create_context_dir, false)

        return true if rc.zero?

        OpenNebula.log_error("#{__method__}: #{e}")
    end

end
