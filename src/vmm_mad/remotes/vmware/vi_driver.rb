# ---------------------------------------------------------------------------- #
# Copyright 2010-2013, C12G Labs S.L                                           #
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

CONF_FILE   = ETC_LOCATION + "/vmwarerc"
CHECKPOINT  = VAR_LOCATION + "/remotes/vmm/vmware/checkpoint"

ENV['LANG'] = 'C'

$: << LIB_LOCATION+'/ruby/vendors/rbvmomi/lib'

require 'rbvmomi'
require 'yaml'

class VIDriver
    ############################################################################
    # Public Methods - Class Interface                                         #
    ############################################################################

    # -------------------------------------------------------------------------#
    # Initialize the client for hypervisor connection                          #
    # -------------------------------------------------------------------------#
    def initialize(hostname)
      conf      = YAML::load(File.read(CONF_FILE))

      if conf[:password] and !conf[:password].empty?
        pass=conf[:password]
      else
        pass="\"\""
      end

      @datacenter = conf[:datacenter]
      @vcenter    = conf[:vcenter]

      begin
        @client = RbVmomi::VIM.connect(:host => hostname, 
                                       :user => conf[:username], 
                                       :password => pass, 
                                       :insecure => true)
        @rootFolder  = @client.serviceInstance.content.rootFolder 
        @host        = get_host(hostname)
        # Get values to be used in all of this class instantiations
        @cpuMhz      = @host.summary.hardware.cpuMhz.to_f
        @numCpuCores = @host.summary.hardware.numCpuCores.to_f
      rescue Exception => e
        raise "Connection error to #{hostname}: " + e.message
      end
    end

    # -------------------------------------------------------------------------#
    # Poll the monitoring information for a VM                                 #
    # -------------------------------------------------------------------------# 
    def poll_vm(deploy_id)
      begin
        vm       = get_vm(deploy_id)[:vm]
        str_info = get_vm_info(vm)
      rescue Exception => e
        str_info = "STATE=d"
        STDERR.puts e.message
      end
        return str_info
    end

    # -------------------------------------------------------------------------#
    # Poll the monitoring information for a VM                                 #
    # -------------------------------------------------------------------------# 
    def poll_host_and_vms
      begin
        str_info =  get_host_info
        vms_info =  get_all_vms_info
        str_info += " " + vms_info if vms_info
      rescue Exception => e
        STDERR.puts e.message
        return -1
      end
        return str_info
    end    

    ############################################################################
    # Private Methods                                                          #
    ############################################################################

    # -------------------------------------------------------------------------#
    # Poll the monitoring information for a VM                                 #
    # -------------------------------------------------------------------------#
    def get_all_vms_info
      begin
        vms       = get_all_vms
        str_info = "VM_POLL=YES " if vms.length > 0

        vms.each do |vm|
          number = -1
          number = vm.name.split('-').last if (vm.name =~ /^one-\d*$/)
              
          str_info += "VM=["
          str_info += "ID=#{number},"
          str_info += "DEPLOY_ID=#{vm.name},"
          str_info += "POLL=\"#{get_vm_info(vm)}\"]"
        end

        return str_info   
      rescue Exception => e
        str_info = "STATE=d"
        STDERR.puts e.message
      end
      return str_info
    end

    # -------------------------------------------------------------------------#
    # Get hold of a VM by name                                                 #
    # -------------------------------------------------------------------------#
    def get_vm(name)
      vm = {}
      # Traverse all datacenters
      @rootFolder.childEntity.grep(RbVmomi::VIM::Datacenter).each do |dc|
        # Traverse all datastores  
        dc.datastoreFolder.childEntity.collect do |ds|
          # Find the VM called "name"
          vm[:vm] = ds.vm.find { |v| v.name == name }
          if vm[:vm]
            vm[:ds] = ds.name
            break
          end
        end
      end
      return vm
    end

    # -------------------------------------------------------------------------#
    # Get hold of a host by name                                               #
    # -------------------------------------------------------------------------#
    def get_host(name)
      host = {}
      @rootFolder.childEntity.grep(RbVmomi::VIM::Datacenter).each do |dc|
        dc.hostFolder.children.first.host.each { |h| 
          if h.name == name
            host = h
            break
          end
        }
        break if host != {}
      end
      return host
    end

    # -------------------------------------------------------------------------#
    # Get information of a particular VM                                       #
    # -------------------------------------------------------------------------#
    def get_vm_info(vm)
      # Get network information
      net_info = get_perf_value([vm], ["net.packetsRx","net.packetsTx"])

      str_info = ""
      str_info += "STATE="      + get_state(vm)          + " "
      str_info += "USEDCPU="    + get_used_cpu(vm)       + " "
      str_info += "USEDMEMORY=" + get_used_memory(vm)    

      if net_info[vm] && net_info[vm][:metrics] && net_info[vm][:metrics]["net.packetsRx"]
        str_info += " NETRX=" +
                    net_info[vm][:metrics]["net.packetsRx"].first.to_s + " "
        str_info += "NETTX=" +
                    net_info[vm][:metrics]["net.packetsTx"].first.to_s
      end

      return str_info
    end

    # -------------------------------------------------------------------------#
    # Get information of the initialized host                                  #
    # -------------------------------------------------------------------------#
    def get_host_info
      str_info = ""
      # CPU
      total_cpu = @host.summary.hardware.numCpuCores*100
      used_cpu  = get_host_used_cpu

      str_info += "MODELNAME=\""+ @host.summary.hardware.cpuModel.to_s   + "\" "
      str_info += "CPUSPEED="   + @host.summary.hardware.cpuMhz.to_s     + " "
      str_info += "TOTALCPU="   + total_cpu.to_s                         + " "
      str_info += "USEDCPU="    + used_cpu.to_s                          + " "
      str_info += "FREECPU="    + (total_cpu - used_cpu).to_s            + " "

      # Memory
      total_memory = get_host_total_memory
      used_memory  = get_host_used_memory
      str_info += "TOTALMEMORY=" + total_memory.to_s                      + " "
      str_info += "USEDMEMORY="  + used_memory.to_s                       + " "
      str_info += "FREEMEMORY="  + (total_memory - used_memory).to_s      + " "

      # Networking
      net_info = get_perf_value([@host], ["net.packetsRx","net.packetsTx"])
      str_info += "NETRX=" +
                  net_info[@host][:metrics]["net.packetsRx"].first.to_s + " "
      str_info += "NETTX=" +
                  net_info[@host][:metrics]["net.packetsTx"].first.to_s
    end

    # -------------------------------------------------------------------------#
    # Get used CPO of the initialized host                                     #
    # -------------------------------------------------------------------------#
    def get_host_used_cpu
      overallCpuUsage = @host.summary.quickStats.overallCpuUsage.to_f
      (overallCpuUsage / (@cpuMhz * @numCpuCores)).round()
    end

    # -------------------------------------------------------------------------#
    # Get total memory of the initialized host                                 #
    # -------------------------------------------------------------------------#
    def get_host_total_memory
      @host.summary.hardware.memorySize/1024
    end

    # -------------------------------------------------------------------------#
    # Get used memory of the initialized host                                 #
    # -------------------------------------------------------------------------#
    def get_host_used_memory
      @host.summary.quickStats.overallMemoryUsage*1024
    end

    # -------------------------------------------------------------------------#
    # Get all VMs available in current @hostname                               #
    # -------------------------------------------------------------------------#
    def get_all_vms
      @host.vm.collect { |vm| vm if get_state(vm)=="a" }.compact
    end

    # -------------------------------------------------------------------------#
    # Get used memory of a VM                                                  #
    # -------------------------------------------------------------------------#
    def get_used_memory(vm)
      (vm.summary.quickStats.hostMemoryUsage*1024).to_s
    end

    # Get percentage of the CPU used by a VM in a host
    def get_used_cpu(vm)
      overallCpuUsage = vm.summary.quickStats.overallCpuUsage.to_f
      ((overallCpuUsage / (@cpuMhz * @numCpuCores)).round()).to_s
    end

    # -------------------------------------------------------------------------#
    # Get OpenNebula state of a VM                                             #
    # -------------------------------------------------------------------------#
    def get_state(vm)
      case vm.summary.runtime.powerState
        when "poweredOn"
          "a"
        when "suspended"
          "p"
        else
          "d"
      end
    end

    # -------------------------------------------------------------------------#
    # Get performance values for metrics (array) of objects (array)            #
    # -------------------------------------------------------------------------# 
    def get_perf_value(objects,metrics)
      perfManager = @client.serviceContent.perfManager

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

    # -------------------------------------------------------------------------#
    # Attach a NIC to deploy_id, linked to bridge, with mac and of type = model#
    # -------------------------------------------------------------------------# 
    def attach_nic(deploy_id, bridge, model, mac)
      vm       = get_vm(deploy_id)[:vm]
      card_num = 1 # start in one, we want the next avaiable id
      vm.config.hardware.device.each{ |dv|
        if dv.class.ancestors[1] == VIM::VirtualEthernetCard
          card_num = card_num + 1
        end
      }
      backing = VIM.VirtualEthernetCardNetworkBackingInfo(:deviceName => bridge)
      device_spec = {:key         => 0, 
                     :deviceInfo  => {
                       :label   => "net" + card_num.to_s, 
                       :summary => bridge
                     }, 
                     :backing     => backing,
                     :addressType => 'manual',
                     :macAddress  => mac }

      device = case model.downcase
                 when 'e1000'
                  VIM.VirtualE1000(device_spec)
                 when 'pcnet32'
                  VIM.VirtualPCNet32(device_spec)
                 when 'VirtualVmxnet'
                  VIM.VirtualVmxnet(device_spec)
               end
      spec = {:deviceChange => [:operation => :add, :device => device]}

      vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end
end
