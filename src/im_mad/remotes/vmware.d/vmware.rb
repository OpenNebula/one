#!/usr/bin/env ruby

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
require 'pp'

def init_client(hostname, user, password)
  @client = RbVmomi::VIM.connect(:host => hostname, 
                                 :user => user, 
                                 :password => password, 
                                 :insecure => true)
  @rootFolder = @client.serviceInstance.content.rootFolder
end

# Get hold of a VM by name
def get_vm(name)
  vm = {}
  # Traverse all datacenters
  @rootFolder.childEntity.grep(RbVmomi::VIM::Datacenter).each do |dc|
    # Traverse all datastores  
    dc.datastoreFolder.childEntity.collect do |ds|
      # Find the VM with "name"
      vm[:vm] = ds.vm.find { |v| v.name == name }
      if vm[:vm]
        vm[:ds] = ds.name
        break
      end
    end
  end
  return vm
end

# Get hold of a host by name
def get_host(name)
  host = {}
  @rootFolder.childEntity.grep(RbVmomi::VIM::Datacenter).first.hostFolder.children.first.host.each { |h| 
      if h.name == name
        host = h
        break
      end
  }
  return host
end

def get_used_memory(vm)
  vm.summary.quickStats.hostMemoryUsage.to_s
end

def get_used_cpu(vm, host)
  overallCpuUsage = vm.summary.quickStats.overallCpuUsage.to_f
  cpuMhz          = host.summary.hardware.cpuMhz.to_f
  numCpuCores     = host.summary.hardware.numCpuCores.to_f
  (overallCpuUsage / (cpuMhz * numCpuCores)).round(3).to_s
end

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

def get_info(vm, host)
  str_info = ""
  str_info += "USEDCPU="+get_used_cpu(vm, host)+" "
  str_info += "USEDMEMORY="+get_used_memory(vm)+" "
  str_info += "STATE="+get_state(vm)+" "
end


begin
  init_client("dyn11","root","DridiatLy")

  vm   = get_vm("neno2")
  host = get_host("dyn11")
  str_info = get_info(vm[:vm], host)

  pp vm[:vm].network.each {|n|
    pp n
  }

rescue Exception => e
  str_info = "STATE=d"
end

pp str_info

