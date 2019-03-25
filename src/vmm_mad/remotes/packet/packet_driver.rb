#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                  #
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


ONE_LOCATION=ENV["ONE_LOCATION"] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
    PACKET_LOCATION="/usr/lib/one/ruby/vendors/packethost/lib"
else
    PACKET_LOCATION=ONE_LOCATION+"/lib/ruby/vendors/packethost/lib"
end

$: << PACKET_LOCATION

# gem 'packethost', '> 0.0.8'

require 'packet'
require 'pp'
require 'VirtualMachineDriver'
require 'base64'

### Exceptions

class PacketDriverTimeout < Exception
end

class PacketDriverDeviceNotFound < Exception
end

class PacketDriverInvalidDeviceState < Exception
end


### Packet driver

class PacketDriver
    HYPERVISOR = 'packet'

    #ACTION          = VirtualMachineDriver::ACTION
    POLL_ATTRIBUTE  = VirtualMachineDriver::POLL_ATTRIBUTE
    VM_STATE        = VirtualMachineDriver::VM_STATE

    DEPLOY_ATTRIBUTES = {
        project_id:         'PROJECT',
        facility:           'FACILITY',
        plan:               'PLAN',
        hostname:           'HOSTNAME',
        operating_system:   'OS',
        userdata:           'USERDATA',
        tags:               'TAGS',
        billing_cycle:      'BILLING_CYCLE',
    }

    def initialize(host, one=OpenNebula::Client.new)
        #@one = OpenNebula::Client.new
        @one = one
        @packet = Packet::Client.new

        if host.is_a?(String)
            @host = get_xhost_by_name(host)

            unless @host
                raise "Host not found #{host}"
            end
        else
            @host = host
        end

        @globals = get_globals(@host)
        @packet.auth_token = @globals['PACKET_TOKEN']
    end

    def deploy_vm(id, host, xml_text, lcm_state, deploy_id)
        # Restore if we need to
        if lcm_state != "BOOT" && lcm_state != "BOOT_FAILURE"
            restore(deploy_id)
            return deploy_id
        end

        xvm = OpenNebula::XMLElement.new
        xvm.initialize_xml(xml_text, 'VM')

        device = xobj2device(xvm, 'USER_TEMPLATE/PUBLIC_CLOUD', 'TEMPLATE/CONTEXT')
        device.tags += [ 'OpenNebula', "ONE_ID=#{xvm['ID']}" ]
        @packet.create_device(device)

        begin
            wait_state(:active, device.id)
        rescue PacketDriverTimeout
        end

        device.id
    end

    def deploy_host(xhost)
        deploy_id = xhost['//HOST/TEMPLATE/PROVISION/DEPLOY_ID']

        # Restore if we need to
        if deploy_id
            restore(deploy_id)
            return deploy_id
        end

        device = xobj2device(xhost, 'TEMPLATE/PROVISION', 'TEMPLATE/CONTEXT')
        device.tags += [ 'OpenNebula', "ONE_HOST_ID=#{xhost['ID']}" ]
        @packet.create_device(device)

        wait_state(:active, device.id)

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

    def cancel(deploy_id, lcm_state=nil)
        case lcm_state
        when 'SHUTDOWN_POWEROFF', 'SHUTDOWN_UNDEPLOY' #TODO: support undeploy?"
            power_off(deploy_id)
            wait_state(:inactive, deploy_id)
        else
            delete(deploy_id)
            wait_state(:done, deploy_id)
        end
    end

    def shutdown(deploy_id, lcm_state)
        case lcm_state
        when "SHUTDOWN"
            delete(deploy_id)
            wait_state(:done, deploy_id)
        when "SHUTDOWN_POWEROFF", "SHUTDOWN_UNDEPLOY"
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
            #@packet.get("devices/#{device.id}/bandwidth", {'from'=>0, 'until'=>1523889200}).body
            @packet.get("devices/#{device.id}/bandwidth").body['bandwidth'].map do |bw|
                sum = 0

                bw['datapoints'].each do |data, time|
                    sum += data if data
                end

                sum = (sum*1024/8).ceil   #TODO: this is just a guess

                if bw['target'] == 'inbound'
                    rx = sum
                elsif bw['target'] == 'outbound'
                    tx = sum
                end
            end

            [rx, tx]
        rescue
            [0, 0]
        end
    end

    def vm_to_one(device)
        cpu = device_cpu(device)
        vcpu = (cpu / 100).ceil #TODO
        mem = (device_mem(device) / 1024).round

        str = <<-EOT
NAME = "Imported Packet instance #{device.hostname} from #{device.id}"
DESCRIPTION = "Imported Packet instance #{device.hostname} from #{device.id}"
CPU = "#{vcpu}"
VCPU = "#{vcpu}"
MEMORY = "#{mem}"
HYPERVISOR = "#{HYPERVISOR}"
PUBLIC_CLOUD = [
  TYPE = "#{HYPERVISOR}",
  BILLING_CYCLE = "#{device.billing_cycle if device.respond_to? 'billing_cycle'}",
  OS = "#{device.operating_system.id}",
  PLAN = "#{device.plan.id}",
  FACILITY = "#{device.facility.id}"
]
IMPORT_VM_ID = "#{device.id}"
SCHED_REQUIREMENTS = "NAME=\\"#{@host.name}\\""
        EOT

        case device.operating_system.name
        when /CentOS/i
            str << "LOGO = images/logos/centos.png\n"
        when /Debian/i
            nstr << "LOGO = images/logos/debian.png\n"
        when /Red\s*Hat/i
            str << "LOGO = images/logos/redhat.png\n"
        when /Ubuntu/i
            str << "LOGO = images/logos/ubuntu.png\n"
        when /Windows XP/i
            str << "LOGO = images/logos/windowsxp.png\n"
        when /Windows/i
            str << "LOGO = images/logos/windows8.png\n"
        when /Linux/i
            str << "LOGO = images/logos/linux.png\n"
        end

        str
    end

    def monitor_all_vms(host) #TODO: host_id
        xhost = get_xhost_by_name(host)

        totalmemory = 20971520 #TODO
        totalcpu = 1000        #TODO
        usedmemory = 0
        usedcpu = 0

        host_info =  "HYPERVISOR=#{HYPERVISOR}\n"
        host_info << "PUBLIC_CLOUD=YES\n"
        host_info << "PRIORITY=-1\n"
        host_info << "TOTALMEMORY=#{totalmemory.round}\n"
        host_info << "TOTALCPU=#{totalcpu.round}\n"
        #host_info << "CPUSPEED=1000\n"
        host_info << "HOSTNAME=\"#{xhost['NAME']}\"\n"

        vms_info = "VM_POLL=YES\n"

        if @globals['PROJECT'] && !@globals['PROJECT'].empty?
            projects = [@globals['PROJECT']]
        else
            projects = list_projects.map { |p| p.id }
        end

        projects.each do |project|
            list_devices(project).each do |device|
                begin
                    # OpenNebula deployed machines have special tag
                    # with the VM ID inside, e.g.: "ONE_ID=123"
                    one_id = -1
                    device.tags.each do |tag|
                        one_id=$1 if tag.to_s =~ /^ONE_ID=(\d+)$/i
                    end

                    poll_data = parse_poll(device)

                    import_template = Base64.strict_encode64(vm_to_one(device))

                    vms_info << "VM=[\n"
                    vms_info << "  ID=#{one_id},\n"
                    vms_info << "  DEPLOY_ID=#{device.id},\n"
                    vms_info << "  VM_NAME=\"#{device.hostname}\",\n"
                    vms_info << "  IMPORT_TEMPLATE=\"#{import_template}\",\n"
                    vms_info << "  POLL=\"#{poll_data.gsub('"','\"')}\" ]\n"

                    usedmemory += device_mem(device)
                    usedcpu += device_cpu(device)
                rescue
                end
            end
        end

        host_info << "USEDMEMORY=#{usedmemory.round}\n"
        host_info << "USEDCPU=#{usedcpu.round}\n"
#        host_info << "FREEMEMORY=#{(totalmemory - usedmemory).round}\n"
#        host_info << "FREECPU=#{(totalcpu - usedcpu).round}\n"

        puts host_info
        puts vms_info
    end

    def poll(deploy_id)
        device = get_device(deploy_id)
        puts parse_poll(device)
    end

    def parse_poll(device)
        begin
            if device.nil?
                "#{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:deleted]} "
            else
                info = ''

                # States based on
                # https://github.com/ansible/ansible/blob/2ad7d79985fef9abc2ee1c5166762b5773cf5c4d/lib/ansible/modules/cloud/packet/packet_device.py#L272
                state = case device.state
                when :pending, :provisioning, :powering_on
                    VM_STATE[:paused] #TODO: ????
                when :active, :rebooting
                    VM_STATE[:active]
                when :powering_off, :inactive
                    VM_STATE[:paused]
                when :failed
                    VM_STATE[:error]
                else
                    VM_STATE[:unknown]
                end

                info << "#{POLL_ATTRIBUTE[:state]}=#{state} "
                info << "#{POLL_ATTRIBUTE[:cpu]}=#{device_cpu(device)} "
                info << "#{POLL_ATTRIBUTE[:memory]}=#{device_mem(device)} "

                # Network
                ip_addresses = device_ips(device)
                netrx, nettx = device_net_rxtx(device)

                info << "NETTX=#{nettx} "
                info << "NETRX=#{netrx} "
                info << "GUEST_IP_ADDRESSES=\"#{ip_addresses.join(',')}\" "
                info << "ROOT_PASSWORD=\"#{device.root_password}\" "

                info
            end
        rescue
            "#{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:unknown]} "
        end
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
        # get token
        system = OpenNebula::System.new(@one)
        config = system.get_configuration
        raise "Error getting oned configuration : #{config.message}" if OpenNebula.is_error?(config)
        token = config["ONE_KEY"]

        if xhost["TEMPLATE/PROVISION"]
            tmplBase = 'TEMPLATE/PROVISION'
        else
            tmplBase = 'TEMPLATE'
        end

        conn_opts = {
            'PACKET_TOKEN' => xhost["#{tmplBase}/PACKET_TOKEN"],
        }

        conn_opts = OpenNebula.decrypt(conn_opts, token)

        begin
            #conn_opts = OpenNebula.decrypt(conn_opts, token)
            conn_opts['PROJECT'] = xhost["#{tmplBase}/PACKET_PROJECT"]
        rescue
            raise "HOST: #{xhost['NAME']} must have Packet credentials"
        end

        return conn_opts
    end

    def get_xhost_by_name(host)
        pool = OpenNebula::HostPool.new(@one)
        pool.info

        objects = pool.select {|object| object.name == host }
        objects.first
    end

    # Create a Packet::Device object with parameters
    # provided on xpath of the XML object xobj.
    #
    # @param xobj [XMLElement] XMLElement object
    # @param xpath [String] Xpath of
    # @return [Packet::Device]
    def xobj2device(xobj, xpath, xpath_context)
        device = Packet::Device.new
        device.client = @packet

        DEPLOY_ATTRIBUTES.each do |packet_name, template_name|
            key = "@#{packet_name}".to_sym
            val = xobj["#{xpath}/#{template_name}"]

            if @globals[template_name]
                # Parameters specified globaly (on host level) can't
                # be overriden on device level. I.e. Packet PROJECT set
                # for (one)host deployer, can't be changed for (one)vm.
                if val.nil? or (val == @globals[template_name])
                    device.instance_variable_set(key, @globals[template_name])
                else
                    raise "Parameter #{template_name} can't be overriden"
                end
            elsif ! val.nil?
                # TODO: make special handling part of DEPLOY_ATTRIBUTES?
                if template_name == 'TAGS'
                    val = val.split(',').map { |v| v.strip }
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

private

    def deploy(project, facility, plan, os, hostname)
        device = Packet::Device.new

        device.client = @packet
        device.project_id = project
        device.facility = facility
        device.plan = plan
        device.hostname = hostname
        device.operating_system = os

        @packet.create_device(device)

        device
    end

    def delete(deploy_id)
        device = Packet::Device.new('id' => deploy_id)
        @packet.delete_device(device)
    end

    def power_off(deploy_id)
        device = Packet::Device.new('id' => deploy_id)
        @packet.power_off_device(device)
    end

    def power_on(deploy_id)
        device = Packet::Device.new('id' => deploy_id)
        @packet.power_on_device(device)
    end

    def reboot_device(deploy_id)
        device = Packet::Device.new('id' => deploy_id)
        @packet.reboot_device(device)
    end

    def list_devices(project_id)
        @packet.list_devices(project_id)
    end

    def get_device(deploy_id)
        begin
            @packet.get_device(deploy_id)
        rescue Packet::NotFound
            nil
        end
    end

    def list_projects
        @packet.list_projects
    end

    #TODO: configuration state_wait_timeout
    def wait_state(state, deploy_id, state_change_timeout=1800)
        t_s = Time.now

        begin
            begin
                device = get_device(deploy_id)
            rescue
                # retry in case of server side problem
                sleep 5
                next
            end

            if device.nil?
                if state == :done
                    return
                else
                    raise PacketDriverDeviceNotFound,
                        "Device with #{deploy_id} not found"
                end
            end

            if device.state == :failed
                raise PacketDriverInvalidDeviceState,
                    "Invalid device state #{device.state}"
            end

            return if device.state == state

            sleep 5
        end while (Time.now - t_s) <= state_change_timeout

        raise PacketDriverTimeout, "Wait for host state '#{state}' timed out"
		end
end

###

def error_message(message)
    error_str = "ERROR MESSAGE --8<------\n"
    error_str << message
    error_str << "\nERROR MESSAGE ------>8--"

    return error_str
end
