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

require 'rubygems'
require 'rbvmomi'
require 'yaml'

class VIDriver
    # -------------------------------------------------------------------------#
    # Set up the environment for the driver                                    #
    # -------------------------------------------------------------------------#
    ONE_LOCATION = ENV["ONE_LOCATION"]

    if !ONE_LOCATION
       BIN_LOCATION = "/usr/bin"
       LIB_LOCATION = "/usr/lib/one"
       ETC_LOCATION = "/etc/one/"
       VAR_LOCATION = "/var/lib/one"
    else
       LIB_LOCATION = ONE_LOCATION + "/lib"
       BIN_LOCATION = ONE_LOCATION + "/bin"
       ETC_LOCATION = ONE_LOCATION  + "/etc/"
       VAR_LOCATION = ONE_LOCATION + "/var/"
    end

    CONF_FILE   = ETC_LOCATION + "/vmwarerc"
    CHECKPOINT  = VAR_LOCATION + "/remotes/vmm/vmware/checkpoint"

    ENV['LANG'] = 'C'

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
        @rootFolder = @client.serviceInstance.content.rootFolder 
        @host       = get_host(hostname)
      rescue Exception => e
        raise "Connection error to #{hostname}: " + e.message
      end
    end

    # -------------------------------------------------------------------------#
    # Poll the monitoring information for a VM                                 #
    # -------------------------------------------------------------------------# 
    def poll(deploy_id)
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
    def poll_all_vms
      begin
        vms       = get_all_vms
        str_info = "VM_POLL=YES "

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

    ############################################################################
    # Private Methods                                                          #
    ############################################################################

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
      str_info += "USEDMEMORY=" + get_used_memory(vm)    + " "
      str_info += "NETRX=" +
                  net_info[vm][:metrics]["net.packetsRx"].first.to_s + " "
      str_info += "NETTX=" +
                  net_info[vm][:metrics]["net.packetsTx"].first.to_s
    end

    # -------------------------------------------------------------------------#
    # Get all VMs available in current @hostname                               #
    # -------------------------------------------------------------------------#
    def get_all_vms
      @host.vm.collect { |vm| vm if get_state(vm)=="a"}.compact
    end

    # -------------------------------------------------------------------------#
    # Get used memory of a VM                                                  #
    # -------------------------------------------------------------------------#
    def get_used_memory(vm)
      vm.summary.quickStats.hostMemoryUsage.to_s
    end

    # Get percentage of the CPU used by a VM in a host
    def get_used_cpu(vm)
      overallCpuUsage = vm.summary.quickStats.overallCpuUsage.to_f
      cpuMhz          = @host.summary.hardware.cpuMhz.to_f
      numCpuCores     = @host.summary.hardware.numCpuCores.to_f
      (overallCpuUsage / (cpuMhz * numCpuCores)).round(3).to_s
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
end
