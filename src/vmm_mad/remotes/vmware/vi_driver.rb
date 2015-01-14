# ---------------------------------------------------------------------------- #
# Copyright 2010-2015, C12G Labs S.L                                           #
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

# -------------------------------------------------------------------------#
# Set up the environment for the driver                                    #
# -------------------------------------------------------------------------#
ONE_LOCATION = ENV["ONE_LOCATION"] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
   BIN_LOCATION = "/usr/bin" if !defined?(BIN_LOCATION)
   LIB_LOCATION = "/usr/lib/one" if !defined?(LIB_LOCATION)
   ETC_LOCATION = "/etc/one/" if !defined?(ETC_LOCATION)
   VAR_LOCATION = "/var/lib/one" if !defined?(VAR_LOCATION)
else
   BIN_LOCATION = ONE_LOCATION + "/bin" if !defined?(BIN_LOCATION)
   LIB_LOCATION = ONE_LOCATION + "/lib" if !defined?(LIB_LOCATION)
   ETC_LOCATION = ONE_LOCATION  + "/etc/" if !defined?(ETC_LOCATION)
   VAR_LOCATION = ONE_LOCATION + "/var/" if !defined?(VAR_LOCATION)
end



ENV['LANG'] = 'C'

$: << LIB_LOCATION+'/ruby/vendors/rbvmomi/lib'

require 'rbvmomi'
require 'yaml'


module VIDriver

CONF_FILE   = ETC_LOCATION + "/vmwarerc"
CHECKPOINT  = VAR_LOCATION + "/remotes/vmm/vmware/checkpoint"

############################################################################
# Initialize the module by creating a VI connection and setting up
# configuration attributes
#   @param hostname [String] to access the VI API and interact to
#   @param monitor [false, true] monitor the host on creation. Defaults true
############################################################################
def self.initialize(hostname, monitor = true )
    conf = YAML::load(File.read(CONF_FILE))

    if conf[:password] and !conf[:password].empty?
        pass=conf[:password]
    else
        pass="\"\""
    end

    begin
      @@client = RbVmomi::VIM.connect(:host => hostname,
                                      :user => conf[:username],
                                      :password => pass,
                                      :insecure => true)
      @@root   = @@client.root
      @@host   = VIHost.new(hostname)

      @@host.monitor if monitor

    rescue Exception => e
        raise "Connection error to #{hostname}: " + e.message
    end
end

############################################################################
# Return the OpenNebula monitoring string for the given VM
#   @param deploy_id [String] OpenNebula VM ID, e.g. "one-237"
############################################################################
def self.poll_vm(deploy_id)
    begin
      vm = VIVm.new(deploy_id, nil)

      vm.monitor
      str_info = vm.info

    rescue Exception => e
      str_info = "STATE=d"
      STDERR.puts e.message
    end

    return str_info
end

############################################################################
# Return the OpenNebula monitoring string for the given host and the running
# VMs in that host
############################################################################
def self.poll_host_and_vms
    begin
      str_info =  @@host.info
      vms_info =  @@host.all_vms_info

      str_info << "\nVM_POLL=YES\n"
      str_info << "#{vms_info}" if !vms_info.empty?

    rescue Exception => e
      STDERR.puts e.message
      str_info = ""
    end

    return str_info
end

############################################################################
# The VIVm is a high level abstraction of a VI VirtualMachine class for
# OpenNebula semantics. The VIDriver::initialize MUST be called before
# instantiating this class
############################################################################
class VIVm

    ########################################################################
    #  Creates a new VIVm using its name or a RbVmomi::VirtualMachine object
    #    @param vmname [String] the OpenNebula vm deploy_id (e.g. "one-237")
    #    @param vm_vi [RbVmomi::VirtualMachine] it will be used if not nil
    ########################################################################
    def initialize(vmname, vm_vi)
        if vm_vi.nil?
            @vm = VIDriver::host.vm.find { |v|
                v.name == vmname
            }
        else
            @vm = vm_vi
        end

        raise "Cannot find VM #{vmname}" if @vm.nil?
    end

    ########################################################################
    # Set the guest OS
    ########################################################################
    def set_guestos(guest_os_id)
      return if (guest_os_id.nil? || guest_os_id.empty? )

      spec = {:guestId => guest_os_id}

      @vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    ########################################################################
    # Set or removes a pciBridge from VM
    ########################################################################
    def set_pcibridge(pciBridge)
        num = pciBridge.to_i

        return if (num == 0)

        spec = []

        num.times { |i|
            spec <<  { :key => "pciBridge#{i}.present", :value => "TRUE" }
        }

        vmspec = RbVmomi::VIM.VirtualMachineConfigSpec(:extraConfig => spec)

        @vm.ReconfigVM_Task(:spec => vmspec).wait_for_completion
    end

    ########################################################################
    #
    ########################################################################
    def attach_nic(bridge, mac, model='default')
        return if bridge.empty? || mac.empty?

        card_num = 1 # start in one, we want the next avaiable id

        @vm.config.hardware.device.each{ |dv|
            if dv.class.ancestors[1] == RbVmomi::VIM::VirtualEthernetCard
                card_num = card_num + 1
            end
        }

        backing = RbVmomi::VIM.VirtualEthernetCardNetworkBackingInfo(
            :deviceName => bridge)

        device_spec = {
            :key         => 0,
            :deviceInfo  => {
                :label   => "net" + card_num.to_s,
                :summary => bridge
            },
            :backing     => backing,
            :addressType => 'manual',
            :macAddress  => mac
        }

        device = case model.downcase
            when 'pcnet32'
                RbVmomi::VIM.VirtualPCNet32(device_spec)
            when 'VirtualVmxnet'
                RbVmomi::VIM.VirtualVmxnet(device_spec)
            else # By default, assume E1000 model
                RbVmomi::VIM.VirtualE1000(device_spec)
        end

        spec = {:deviceChange => [:operation => :add, :device => device]}

        @vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    ########################################################################
    #  Initialize the vm monitor information
    ########################################################################
    def detach_nic(mac)

        eth = @vm.config.hardware.device.find { |d|
            (d.class.ancestors[1] == RbVmomi::VIM::VirtualEthernetCard) &&
            (d.macAddress ==  mac)
        }

        return -1 if eth.nil?

        spec = {
            :deviceChange => [
                :operation => :remove,
                :device => eth
            ]
        }

        @vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    ############################################################################
    # Resets a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def reset
        @vm.ResetVM_Task.wait_for_completion
    end    

    ########################################################################
    #  Initialize the vm monitor information
    ########################################################################
    def monitor
        @summary = @vm.summary
        @state   = state_to_c(@summary.runtime.powerState)

        if @state != 'a'
            @used_cpu    = 0
            @used_memory = 0

            @net_rx = 0
            @net_tx = 0

            return
        end

        @used_memory = @summary.quickStats.hostMemoryUsage * 1024

        host        = VIDriver::host
        cpuMhz      = host.cpuMhz.to_f
        @used_cpu   =
                ((@summary.quickStats.overallCpuUsage.to_f / cpuMhz) * 100).to_s
        @used_cpu   = sprintf('%.2f',@used_cpu).to_s

        vm_stats = VIDriver::retrieve_stats([@vm],
                                  ["net.packetsRx","net.packetsTx"])
        @net_rx   = 0
        @net_tx   = 0

        if vm_stats[@vm] && vm_stats[@vm][:metrics]
            if vm_stats[@vm][:metrics]["net.packetsRx"]
                @net_rx = vm_stats[@vm][:metrics]["net.packetsRx"].first
            end

            if vm_stats[@vm][:metrics]["net.packetsTx"]
                @net_tx = vm_stats[@vm][:metrics]["net.packetsTx"].first
            end
        end

        # Check for negative values
        @used_memory = 0 if @used_memory.to_i < 0
        @used_cpu    = 0 if @used_cpu.to_i < 0
        @net_rx      = 0 if @net_rx.to_i < 0
        @net_tx      = 0 if @net_tx.to_i < 0
    end

    ########################################################################
    #  Generates a OpenNebula IM Driver valid string with the monitor info
    ########################################################################
    def info
      return 'STATE=d' if @state == 'd'

      str_info = ""

      str_info << "STATE="     << @state            << " "
      str_info << "USEDCPU="   << @used_cpu.to_s    << " "
      str_info << "USEDMEMORY="<< @used_memory.to_s << " "
      str_info << "NETRX="     << @net_rx.to_s      << " "
      str_info << "NETTX="     << @net_tx.to_s
    end

private

    ########################################################################
    #  Converts the VI string state to OpenNebula state convention
    #  Guest states are:
    #   - poweredOff   The virtual machine is currently powered off.
    #   - poweredOn    The virtual machine is currently powered on.
    #   - suspended    The virtual machine is currently suspended.
    ########################################################################
    def state_to_c(state)
        case state
            when 'poweredOn'
                'a'
            when 'suspended'
                'p'
            when 'poweredOff'
                'd'
            else
                '-'
        end
    end
end

private

############################################################################
# The VIHost is a high level abstraction of a HostSystem class for
# OpenNebula semantics. The VIDriver::initialize MUST be called before
# instantiating this class
############################################################################
class VIHost
    attr_reader :host, :cpuMhz, :numCpuCores

    def initialize(hostname)
        @ip = Socket.getaddrinfo(hostname,nil).first[3]

        raise "Cannot get host IP" if @ip.nil? || @ip.empty?

        @host =VIDriver::root.findByIp @ip, RbVmomi::VIM::HostSystem

        raise "Cannot find host #{hostname}" if @host.nil?
    end

    ########################################################################
    #  Initialize the host monitor information
    ########################################################################
    def monitor
        summary  = @host.summary
        hardware = summary.hardware
        stats    = summary.quickStats

        @cpuModel    = hardware.cpuModel
        @cpuMhz      = hardware.cpuMhz

        @total_cpu = hardware.numCpuCores*100
        @used_cpu  = (stats.overallCpuUsage.to_f / @cpuMhz.to_f) * 100
        @used_cpu  = sprintf('%.2f', @used_cpu).to_f # Trim precission

        @total_memory = hardware.memorySize/1024
        @used_memory  = stats.overallMemoryUsage*1024

        net = VIDriver::retrieve_stats([@host],
                                       ["net.packetsRx","net.packetsTx"])
        @net_rx = 0
        @net_tx = 0

        if net[@host] && net[@host][:metrics]
            if net[@host][:metrics]["net.packetsRx"]
                @net_rx = net[@host][:metrics]["net.packetsRx"].first
            end

            if net[@host][:metrics]["net.packetsTx"]
                @net_tx = net[@host][:metrics]["net.packetsTx"].first
            end
        end

        # Check for negative values
        @used_memory = 0 if @used_memory.to_i < 0
        @used_cpu    = 0 if @used_cpu.to_i < 0
        @net_rx      = 0 if @net_rx.to_i < 0
        @net_tx      = 0 if @net_tx.to_i < 0

        # Check free datastore space
        @free_ds_info = VIDriver::retrieve_free_ds(@host)
    end

    ########################################################################
    #  Generates a OpenNebula IM Driver valid string with the monitor info
    ########################################################################
    def info
        str_info = ""

        # CPU
        str_info << "MODELNAME=\"" << @cpuModel.to_s  << "\"\n"
        str_info << "CPUSPEED="    << @cpuMhz.to_s    << "\n"
        str_info << "TOTALCPU="    << @total_cpu.to_s << "\n"
        str_info << "USEDCPU="     << @used_cpu.to_s  << "\n"
        str_info << "FREECPU="     << (@total_cpu - @used_cpu).to_s << "\n"

        # Memory
        str_info << "TOTALMEMORY=" << @total_memory.to_s << "\n"
        str_info << "USEDMEMORY="  << @used_memory.to_s  << "\n"
        str_info << "FREEMEMORY="  << (@total_memory - @used_memory).to_s << "\n"

        # Networking
        str_info << "NETRX=" << @net_rx.to_s << "\n"
        str_info << "NETTX=" << @net_tx.to_s << "\n"

        # Datastores
        @free_ds_info.each{|k,v|
            used_space = v[:capacity].to_i - v[:free_space].to_i
            str_info << "DS=[ID=\"#{k}\",USED_MB=#{used_space},"
            str_info << "TOTAL_MB=#{v[:capacity]},"
            str_info << "FREE_MB=#{v[:free_space]}]\n"
        }

        str_info.strip
    end

    ########################################################################
    #  Generates a OpenNebula IM Driver valid string with the monitor info
    #  of all VMs defined/running in the ESXi host.
    ########################################################################
    def all_vms_info()
        str_info = ""

        @host.vm.each { |v|
            begin
                vivm = VIDriver::VIVm.new("", v)
            rescue
                next
            end

            vivm.monitor

            name   = v.name
            number = -1
            number = name.split('-').last if (name =~ /^one-\d*$/)

            str_info << "VM = ["
            str_info << "ID=#{number},"
            str_info << "DEPLOY_ID=\"#{name}\","
            str_info << "POLL=\"#{vivm.info}\"]\n"
        }

        return str_info
    end

    def vm
        @host.vm
    end
end

############################################################################
# Get performance values for metrics (array) of objects (array)
############################################################################
def self.retrieve_stats(objects,metrics)
    perfManager = @@client.serviceContent.perfManager

    metrics.each do |metric|
      return if !perfManager.perfcounter_hash.member? metric
    end

    interval   = perfManager.provider_summary(objects.first).refreshRate
    start_time = nil

    if interval == -1
      interval   = 300
      start_time = Time.now - 300 * 5
    end

    stat_opts = {
      :interval => interval,
      :startTime => start_time,
    }

    return perfManager.retrieve_stats(objects, metrics, stat_opts)
end

def self.retrieve_free_ds(host)
    pc = @@client.serviceContent.propertyCollector
    hds = host.configManager.datastoreSystem
    datastore_props = pc.collectMultiple(hds.datastore, 'summary', 'name')

    free_ds_info=Hash.new

    hds.datastore.each{|ds|
        free_ds_info[datastore_props[ds]['name']]=Hash.new
        free_ds_info[datastore_props[ds]['name']][:free_space] =
            datastore_props[ds]['summary'].freeSpace.to_i / 1024 / 1024
        free_ds_info[datastore_props[ds]['name']][:capacity] =
            datastore_props[ds]['summary'].capacity.to_i / 1024 / 1024
    }

    free_ds_info
end


def self.root
    @@root
end

def self.host
    @@host
end

end
