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

    #---------------------------------------------------------------------------
    # Methods to access container attributes
    #---------------------------------------------------------------------------
    CONTAINER_ATTRIBUTES = %w[name status status_code devices config profile
                              expanded_config expanded_devices architecture].freeze

    CONTAINER_ATTRIBUTES.each do |attr|
        define_method(attr.to_sym) do
            @lxc[attr]
        end

        define_method("#{attr}=".to_sym) do |value|
            @lxc[attr] = value
        end
    end

    # Return if this is a wild container. Needs the associated OpenNebulaVM
    # description
    def wild?
        @one.wild? if @one
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

        @lxc_command = 'lxc'
        @lxc_command.prepend 'sudo ' if client.snap

        @rootfs_dir = "#{@client.lxd_path}/storage-pools/default/containers/\
        #{name}/rootfs"
        @context_path = "#{@rootfs_dir}/context"
    end

    class << self

        # Returns specific container, by its name
        # Params:
        # +name+:: container name
        def get(name, one_xml, client)
            info = client.get("#{CONTAINERS}/#{name}")['metadata']

            one  = nil
            one  = OpenNebulaVM.new(one_xml) if one_xml

            Container.new(info, one, client)
        end

        # Creates container from a OpenNebula VM xml description
        def new_from_xml(one_xml, client)
            one = OpenNebulaVM.new(one_xml)

            Container.new(one.to_lxc, one, client)
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

        # Returns boolean indicating the container exists(true) or not (false)
        def exist?(name, client)
            client.get("#{CONTAINERS}/#{name}")
            true
        rescue LXDError => e
            raise e if e.code != 404

            false
        end

    end

    #---------------------------------------------------------------------------
    # Container Management & Monitor
    #---------------------------------------------------------------------------
    # Create a container without a base image
    def create(wait: true, timeout: '')
        @lxc['source'] = { 'type' => 'none' }
        wait?(@client.post(CONTAINERS, @lxc), wait, timeout)

        @lxc = @client.get("#{CONTAINERS}/#{name}")['metadata']
    end

    # Delete container
    def delete(wait: true, timeout: '')
        cmd = "#{Mapper::COMMANDS[:lsblk]} -J"
        _rc, o, _e = Command.execute(cmd, false)

        # TODO: Add extra mounts to raise
        raise "Container rootfs still mounted \n#{o}" if o.include?(@rootfs_dir)

        wait?(@client.delete("#{CONTAINERS}/#{name}"), wait, timeout)
    end

    # Updates the container in LXD server with the new configuration
    def update(wait: true, timeout: '')
        wait?(@client.put("#{CONTAINERS}/#{name}", @lxc), wait, timeout)
    end

    # Returns the container current state
    def monitor
        @client.get("#{CONTAINERS}/#{name}/state")
    end

    # Retreive metadata for the container
    def get_metadata
        @lxc = @client.get("#{CONTAINERS}/#{name}")['metadata']
    end

    # Runs command inside container
    # @param command [String] to execute through lxc exec
    def exec(command)
        cmd = "#{@lxc_command} exec #{@one.vm_name} -- #{command}"
        Command.execute(cmd, true)
    end

    def show_log
        cmd = "#{@lxc_command} info --show-log #{@lxc['name']}"
        rc, o, e = Command.execute(cmd, false)

        if rc.zero?
            OpenNebula.log o
        else
            OpenNebula.log_error e
        end
    end

    #---------------------------------------------------------------------------
    # Contianer Status Control
    #---------------------------------------------------------------------------
    def start(options = {})
        change_state(__method__, options)
    end

    def stop(options = { :timeout => 120 })
        change_state(__method__, options)

        # Remove nic from ovs-switch if needed
        @one.get_nics.each do |nic|
            del_bridge_port(nic) # network driver matching implemented here
        end
    end

    def check_stop
        return if status != 'Running'

        if ARGV[-1] == '-f'
            stop(:force => true)
        else
            stop
        end
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

        # Removes nic from ovs-switch if needed
        update if del_bridge_port(@one.get_nic_by_mac(mac))
    end

    #---------------------------------------------------------------------------
    # Container Storage
    #---------------------------------------------------------------------------
    # Sets up the container mounts for type: disk devices.
    def setup_storage(operation)
        return unless @one

        @one.get_disks.each do |disk|
            if @one.volatile?(disk)
                e = "disk #{disk['DISK_ID']} type #{disk['TYPE']} not supported"
                OpenNebula.log_error e
                next
            end

            status = setup_disk(disk, operation)
            return nil unless status
        end

        return true unless @one.has_context?

        csrc = @lxc['devices']['context']['source'].clone

        context = @one.get_context_disk
        mapper  = FSRawMapper.new

        create_context_dir = "#{Mapper::COMMANDS[:su_mkdir]} #{@context_path}"

        rc, _o, e = Command.execute(create_context_dir, false)

        if rc != 0
            OpenNebula.log_error("#{__method__}: #{e}")
            return
        end

        mapper.public_send(operation, @one, context, csrc)
    end

    # Generate the context devices and maps the context the device
    def attach_context
        @one.context(@lxc['devices'])

        csrc = @lxc['devices']['context']['source'].clone

        context = @one.get_context_disk
        mapper  = FSRawMapper.new

        return unless mapper.map(@one, context, csrc)

        update
        true
    end

    # Removes the context section from the LXD configuration and unmap the
    # context device
    def detach_context
        return true unless @one.has_context?

        csrc = @lxc['devices']['context']['source'].clone

        @lxc['devices'].delete('context')['source']

        update

        context = @one.get_context_disk
        mapper  = FSRawMapper.new

        mapper.unmap(@one, context, csrc)
    end

    # Attach disk to container (ATTACH = YES) in VM description
    def attach_disk
        disk_element = hotplug_disk

        raise 'Missing hotplug info' unless disk_element

        status = setup_disk(disk_element, 'map')
        return unless status

        disk_hash = @one.disk(disk_element, nil, nil)

        @lxc['devices'].update(disk_hash)

        update
        true
    end

    # Detects disk being hotplugged
    def hotplug_disk
        return unless @one

        disk_a = @one.get_disks.select do |disk|
            disk['ATTACH'].casecmp('YES').zero?
        end

        disk_a.first
    end

    # Detach disk to container (ATTACH = YES) in VM description
    def detach_disk
        disk_element = hotplug_disk
        return unless disk_element

        disk_name = "disk#{disk_element['DISK_ID']}"

        unless @lxc['devices'].key?(disk_name)
            OpenNebula.log_error "Failed to detect #{disk_name} on \
            container devices\n#{@lxc['devices']}"
        end

        csrc = @lxc['devices'][disk_name]['source'].clone

        @lxc['devices'].delete(disk_name)['source']

        update

        mapper = new_disk_mapper(disk_element)
        mapper.unmap(@one, disk_element, csrc)
    end

    # Setup the disk by mapping/unmapping the disk device
    def setup_disk(disk, operation)
        return unless @one

        disk_id = disk['DISK_ID']

        if disk_id == @one.rootfs_id
            target = @rootfs_dir
        else
            target = @one.disk_mountpoint(disk_id)
        end

        mapper = new_disk_mapper(disk)
        mapper.public_send(operation, @one, disk, target)
    end

    # Start the svncterm server if it is down.
    def vnc(signal)
        command = @one.vnc_command(signal, @lxc_command)
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

    private

    # Deletes the switch port. Unlike libvirt, LXD doesn't handle this.
    def del_bridge_port(nic)
        return true unless /ovswitch/ =~ nic['VN_MAD']

        cmd = 'sudo ovs-vsctl --if-exists del-port '\
        "#{nic['BRIDGE']} #{nic['TARGET']}"

        rc, _o, e = Command.execute(cmd, false)

        return true if rc.zero?

        OpenNebula.log_error "#{__method__}: #{e}"
        false
    end

    # Waits or no for response depending on wait value
    def wait?(response, wait, timeout)
        @client.wait(response, timeout) unless wait == false
    rescue LXDError => e
        show_log
        raise e
    end

    # Performs an action on the container that changes the execution status.
    # Accepts optional args
    def change_state(action, options)
        options.update(:action => action)

        response = @client.put("#{CONTAINERS}/#{name}/state", options)
        status = wait?(response, options[:wait], options[:timeout])

        @lxc = @client.get("#{CONTAINERS}/#{name}")['metadata']

        status
    end

    # Returns a mapper for the disk
    #  @param disk [XMLElement] with the disk data
    #
    #  TODO This maps should be built dynamically or based on a DISK attribute
    #  so new mappers does not need to modified source code
    def new_disk_mapper(disk)
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
                Qcow2Mapper.new
            when /.*filesystem.*/
                OpenNebula.log "Using raw filesystem mapper for #{ds}"
                FSRawMapper.new
            when /.*boot sector.*/
                OpenNebula.log "Using raw disk mapper for #{ds}"
                DiskRawMapper.new
            else
                OpenNebula.log("Unknown #{out} image format, \
                    trying raw filesystem mapper")
                FSRawMapper.new
            end
        when 'RBD'
            OpenNebula.log "Using rbd disk mapper for #{ds}"
            RBDMapper.new(disk)
        end
    end

end
