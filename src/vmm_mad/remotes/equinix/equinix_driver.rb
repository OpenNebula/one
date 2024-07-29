#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                  #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

ONE_LOCATION ||= ENV['ONE_LOCATION'] unless defined? ONE_LOCATION

if !ONE_LOCATION
    GEMS_LOCATION    ||= '/usr/share/one/gems'
    EQUINIX_LOCATION ||= '/usr/lib/one/ruby/vendors/packethost/lib'
    VAR_LOCATION     ||= '/var/lib/one/'
else
    GEMS_LOCATION    ||= ONE_LOCATION + '/share/gems'
    EQUINIX_LOCATION ||= ONE_LOCATION + '/lib/ruby/vendors/packethost/lib'
    VAR_LOCATION     ||= ONE_LOCATION + '/var/'
end

EQUINIX_DATABASE_PATH = "#{VAR_LOCATION}/remotes/im/equinix.d/equinix-cache.db"

# %%RUBYGEMS_SETUP_BEGIN%%
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }

        # Suppress warnings from Rubygems
        # https://github.com/OpenNebula/one/issues/5379
        begin
            verb = $VERBOSE
            $VERBOSE = nil
            require 'rubygems'
            Gem.use_paths(real_gems_path)
        ensure
            $VERBOSE = verb
        end
    end
end
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << EQUINIX_LOCATION

require 'packet'
require 'VirtualMachineDriver'
require 'base64'
require 'PublicCloudDriver'
require 'opennebula'

### Exceptions

class EquinixDriverTimeout < RuntimeError
end

class EquinixDriverDeviceNotFound < RuntimeError
end

class EquinixDriverInvalidDeviceState < RuntimeError
end

### Equinix driver
class EquinixDriver

    include PublicCloudDriver

    POLL_ATTRIBUTE = VirtualMachineDriver::POLL_ATTRIBUTE

    DEPLOY_ATTRIBUTES = {
        :project_id              => 'PROJECT',
        :facility                => 'FACILITY',
        :plan                    => 'PLAN',
        :hostname                => 'HOSTNAME',
        :operating_system        => 'OS',
        :userdata                => 'USERDATA',
        :tags                    => 'TAGS',
        :hardware_reservation_id => 'HARDWARE_RESERVATION',
        :billing_cycle           => 'BILLING_CYCLE'
    }

    STATE_MAP = {
        :pending      => 'RUNNING',
        :provisioning => 'RUNNING',
        :powering_on  => 'RUNNING',
        :active       => 'RUNNING',
        :rebooting    => 'RUNNING',
        :powering_off => 'POWEROFF',
        :inactive     => 'POWEROFF',
        :failed       => 'FAILURE'
    }

    DEFAULTS = {
        :cache_expire       => 120
    }

    def initialize(host, id = nil, one = OpenNebula::Client.new)
        @one = one
        @hypervisor = 'equinix'
        @equinix = Packet::Client.new

        host = host['NAME'] unless host.is_a?(String)

        @host = host
        @xmlhost = host_info(host, id)

        @globals = get_globals(@xmlhost)
        @equinix.auth_token = @globals['EQUINIX_TOKEN']

        @db = InstanceCache.new(EQUINIX_DATABASE_PATH)
    end

    def deploy_vm(_id, _host, xml_text, lcm_state, deploy_id)
        # Restore if we need to
        if lcm_state != 'BOOT' && lcm_state != 'BOOT_FAILURE'
            restore(deploy_id)
            return deploy_id
        end

        xvm = OpenNebula::XMLElement.new
        xvm.initialize_xml(xml_text, 'VM')

        device = xobj2device(xvm, 'USER_TEMPLATE/PUBLIC_CLOUD',
                             'TEMPLATE/CONTEXT')
        device.tags += ['OpenNebula', "ONE_ID=#{xvm['ID']}"]
        @equinix.create_device(device)

        begin
            wait_state(:active, device.id)
        rescue EquinixDriverTimeout
            nil
        end

        device.id
    end

    def restore(deploy_id)
        power_on(deploy_id)
        wait_state(:active, deploy_id)
    end

    def reboot(deploy_id)
        reboot_device(deploy_id)
        wait_state(:active, deploy_id)
    end

    def cancel(deploy_id, lcm_state = nil)
        case lcm_state
        when 'SHUTDOWN_POWEROFF', 'SHUTDOWN_UNDEPLOY' # TODO: support undeploy?"
            power_off(deploy_id)
            wait_state(:inactive, deploy_id)
        else
            delete(deploy_id)
            wait_state(:done, deploy_id)
        end
    end

    def shutdown(deploy_id, lcm_state)
        case lcm_state
        when 'SHUTDOWN'
            delete(deploy_id)
            wait_state(:done, deploy_id)
        when 'SHUTDOWN_POWEROFF', 'SHUTDOWN_UNDEPLOY'
            power_off(deploy_id)
            wait_state(:inactive, deploy_id)
        end
    end

    def reset(deploy_id)
        power_off(deploy_id)
        wait_state(:inactive, deploy_id)

        power_on(deploy_id)
        wait_state(:active, deploy_id)
    end

    def device_cpu(device)
        device.plan.specs['cpus'][0]['count'].to_i * 100
    end

    def device_mem(device)
        mem = device.plan.specs['memory']['total']

        if mem.slice('TB')
            mem = mem.chomp('TB').to_i * 1024 ** 3
        elsif mem.slice('GB')
            mem = mem.chomp('GB').to_i * 1024 ** 2
        elsif mem.slice('MB')
            mem = mem.chomp('MB').to_i * 1024
        elsif mem.slice('B')
            mem = mem.chomp('B').to_i
        end

        mem
    end

    def device_ips(device)
        ips = []

        device.ip_addresses.each do |ip_address|
            ips << ip_address['address'].to_s
        end

        ips
    end

    def device_net_rxtx(device)
        rx = 0
        tx = 0

        begin
            # @equinix.get("devices/#{device.id}/bandwidth"
            # {'from'=>0, 'until'=>1523889200}).body
            path = "devices/#{device.id}/bandwidth"
            @equinix.get(path).body['bandwidth'].map do |bw|
                sum = 0

                bw['datapoints'].each do |data, _time|
                    sum += data if data
                end

                sum = (sum*1024/8).ceil # TODO: this is just a guess

                if bw['target'] == 'inbound'
                    rx = sum
                elsif bw['target'] == 'outbound'
                    tx = sum
                end
            end

            [rx, tx]
        rescue StandardError
            [0, 0]
        end
    end

    def host_capacity(_xmlhost)
        # hardcoded total CPU + MEMORY
        [1000, 20971520]
    end

    def instance_type_capacity(type)
        if type =~ %r{(\d+\.?\d*)cpu/(\d+)memory}
            cpu = (Regexp.last_match(1).to_f * 100).ceil
            memory = Regexp.last_match(2).to_i * 1024
            return [cpu, memory]
        end
        [0, 0]
    end

    def used_capacity(db, limit)
        vms = vms_data(db, limit)

        used_memory = used_cpu = 0

        vms.each do |vm|
            cpu, mem = instance_type_capacity(vm[:type])

            used_memory += mem
            used_cpu    += cpu
        end

        [used_cpu, used_memory]
    end

    def fetch_vms_data(deploy_id: nil, with_monitoring: false)
        devices = []
        if deploy_id.nil?
            # all devices
            if @globals['PROJECT'] && !@globals['PROJECT'].empty?
                projects = [@globals['PROJECT']]
            else
                projects = list_projects.map {|p| p.id }
            end

            projects.each do |project|
                list_devices(project).each do |device|
                    devices << device
                end
            end
        else
            # only single device
            devices = [get_device(deploy_id)]
        end

        vms = []
        devices.each do |device|
            vm_state = vm_state(device)
            next if vm_state != 'RUNNING'

            # OpenNebula deployed machines have special tag
            # with the VM ID inside, e.g.: "ONE_ID=123"
            one_id = -1
            device.tags.each do |tag|
                one_id=Regexp.last_match(1) if tag.to_s =~ /^ONE_ID=(\d+)$/i
            end

            cpu = device_cpu(device)
            memory = device_mem(device)

            vm = { :uuid      => device.id,
                   :id        => one_id || -1,
                   :name      => device.hostname,
                   :type      => "#{cpu}cpu/#{memory}memory",
                   :state     => vm_state(device) }

            if with_monitoring
                vm[:monitor] = get_vm_monitor_data(device)
            end

            vms << vm
        end
        vms
    end

    def vm_state(device)
        if device.nil?
            'UNKNOWN'
        else
            STATE_MAP[device.state] || 'UNKNOWN'
        end
    end

    def get_vm_monitor_data(device)
        info = "#{POLL_ATTRIBUTE[:cpu]}=#{device_cpu(device)} "
        info << "#{POLL_ATTRIBUTE[:memory]}=#{device_mem(device)} "

        netrx, nettx = device_net_rxtx(device)
        info << "#{POLL_ATTRIBUTE[:nettx]}=#{nettx} "
        info << "#{POLL_ATTRIBUTE[:netrx]}=#{netrx} "

        ip_addresses = device_ips(device)
        info << "GUEST_IP_ADDRESSES=\"#{ip_addresses.join(',')}\" "
        info << "ROOT_PASSWORD=\"#{device.root_password}\" "

        info << "BILLING_CYCLE = \"#{device.billing_cycle}\" " \
            if device.respond_to? 'billing_cycle'
        info << "OS = \"#{device.operating_system.id}\" "
        info << "PLAN = \"#{device.plan.id}\" "
        info << "FACILITY = \"#{device.facility.id}\" "

        case device.operating_system.name
        when /CentOS/i
            info << "logo = images/logos/centos.png\n"
        when /debian/i
            info << "logo = images/logos/debian.png\n"
        when /red\s*hat/i
            info << "logo = images/logos/redhat.png\n"
        when /ubuntu/i
            info << "logo = images/logos/ubuntu.png\n"
        when /windows xp/i
            info << "logo = images/logos/windowsxp.png\n"
        when /windows/i
            info << "logo = images/logos/windows8.png\n"
        when /linux/i
            info << "logo = images/logos/linux.png\n"
        end

        Base64.encode64(info).gsub("\n", '')
    end

    def poll(_id, deploy_id)
        fetch_vms_data(:deploy_id => deploy_id, :with_monitoring => true)
    end

    # Generate cloud-init configuration based on context variables
    def generate_cc(xobj, xpath_context)
        cc = "#cloud-config\n"

        ssh_key = xobj["#{xpath_context}/SSH_PUBLIC_KEY"]
        if ssh_key
            cc << "ssh_authorized_keys:\n"
            ssh_key.split("\n").each do |key|
                cc << "- #{key}\n"
            end
        end

        cc
    end

    def get_globals(xhost)
        conn_opts = {}

        begin
            conn_opts['EQUINIX_TOKEN'] = xhost['TEMPLATE/EQUINIX_TOKEN']
            conn_opts['PROJECT']       = xhost['TEMPLATE/EQUINIX_PROJECT']
        rescue StandardError
            raise "HOST: #{xhost['NAME']} must have Equinix credentials"
        end

        conn_opts
    end

    def get_xhost_by_name(host)
        pool = OpenNebula::HostPool.new(@one)
        pool.info

        objects = pool.select {|object| object.name == host }
        host    = objects.first

        host.info(true)

        host
    end

    # Create a Packet::Device object with parameters
    # provided on xpath of the XML object xobj.
    #
    # @param xobj [XMLElement] XMLElement object
    # @param xpath [String] Xpath of
    # @return [Packet::Device]
    def xobj2device(xobj, xpath, xpath_context)
        device = Packet::Device.new
        device.client = @equinix

        DEPLOY_ATTRIBUTES.each do |equinix_name, template_name|
            key = "@#{equinix_name}".to_sym
            val = xobj["#{xpath}/#{template_name}"]

            if @globals[template_name]
                # Parameters specified globaly (on host level) can't
                # be overriden on device level. I.e. Packet PROJECT set
                # for (one)host deployer, can't be changed for (one)vm.
                # rubocop:disable Style/GuardClause
                if val.nil? || (val == @globals[template_name])
                    device.instance_variable_set(key, @globals[template_name])
                else
                    raise "Parameter #{template_name} can't be overriden"
                end
                # rubocop:enable Style/GuardClause
            elsif !val.nil?
                # TODO: make special handling part of DEPLOY_ATTRIBUTES?
                if template_name == 'TAGS'
                    val = val.split(',').map {|v| v.strip }
                end

                device.instance_variable_set(key, val)
            end
        end

        # TODO: can user's & ours userdata cooperate?
        unless device.userdata
            device.userdata = generate_cc(xobj, xpath_context)
        end

        device
    end

    #---------------------------------------------------------------------------
    #  Monitor Interface
    #---------------------------------------------------------------------------
    def probe_host_system
        # call probe_host_system from PublicCloudDriver module
        super(@db, DEFAULTS[:cache_expire], @xmlhost)
    end

    def probe_host_monitor
        # call probe_host_monitor from PublicCloudDriver module
        super(@db, DEFAULTS[:cache_expire], @xmlhost)
    end

    def retreive_vms_data
        # call vms_data from PublicCloudDriver module
        vms_data(@db, DEFAULTS[:cache_expire])
    end

    private

    def delete(deploy_id)
        device = Packet::Device.new('id' => deploy_id)
        @equinix.delete_device(device)
    end

    def power_off(deploy_id)
        device = Packet::Device.new('id' => deploy_id)
        @equinix.power_off_device(device)
    end

    def power_on(deploy_id)
        device = Packet::Device.new('id' => deploy_id)
        @equinix.power_on_device(device)
    end

    def reboot_device(deploy_id)
        device = Packet::Device.new('id' => deploy_id)
        @equinix.reboot_device(device)
    end

    def list_devices(project_id)
        @equinix.list_devices(project_id)
    end

    def get_device(deploy_id)
        begin
            @equinix.get_device(deploy_id)
        rescue Packet::NotFound
            nil
        end
    end

    def list_projects
        @equinix.list_projects
    end

    # TODO: configuration state_wait_timeout
    def wait_state(state, deploy_id, state_change_timeout = 1800)
        t_s = Time.now

        loop do
            begin
                device = get_device(deploy_id)
            rescue StandardError
                # retry in case of server side problem
                sleep 5
                next
            end

            if device.nil?
                return if state == :done

                raise EquinixDriverDeviceNotFound,
                      "Device with #{deploy_id} not found"
            end

            if device.state == :failed
                raise EquinixDriverInvalidDeviceState,
                      "Invalid device state #{device.state}"
            end

            return if device.state == state

            sleep 5

            break if (Time.now - t_s) > state_change_timeout
        end

        raise EquinixDriverTimeout, "Wait for host state '#{state}' timed out"
    end

end

############################################################################
#  Module Interface
#  Interface for probe_db - VirtualMachineDB
############################################################################
module DomainList

    def self.state_info(name, id)
        equinix = EquinixDriver.new(name, id)

        vms = equinix.retreive_vms_data

        info = {}
        vms.each do |vm|
            info[vm[:uuid]] = { :id     => vm[:id],
                                :uuid   => vm[:uuid],
                                :name   => vm[:name],
                                :state  => vm[:state],
                                :hyperv => 'equinix' }
        end

        info
    end

end
