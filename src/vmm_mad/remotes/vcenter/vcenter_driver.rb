# ---------------------------------------------------------------------------- #
# Copyright 2010-2014, C12G Labs S.L                                           #
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
   RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
else
   BIN_LOCATION = ONE_LOCATION + "/bin" if !defined?(BIN_LOCATION)
   LIB_LOCATION = ONE_LOCATION + "/lib" if !defined?(LIB_LOCATION)
   ETC_LOCATION = ONE_LOCATION  + "/etc/" if !defined?(ETC_LOCATION)
   VAR_LOCATION = ONE_LOCATION + "/var/" if !defined?(VAR_LOCATION)
end

ENV['LANG'] = 'C'

$: << LIB_LOCATION+'/ruby/vendors/rbvmomi/lib'
$: << LIB_LOCATION+'/ruby'

require 'rbvmomi'
require 'yaml'
require 'opennebula'

module VCenterDriver

################################################################################
# This class is an OpenNebula hosts that abstracts a vCenter cluster. It
# includes the functionality needed to monitor the cluster and report the ESX
# hosts and VM status of the cluster.
################################################################################
class VCenterHost < ::OpenNebula::Host
    attr_reader :vc_client, :vc_root, :cluster, :host, :client

    def initialize(hid)
        begin
            @client = ::OpenNebula::Client.new()
        rescue Exception => e
            raise "Error initializing OpenNebula client: #{e.message    }"
        end

        @host = ::OpenNebula::Host.new_with_id(hid,@client)
        rc    = @host.info

        if ::OpenNebula.is_error?(rc)
            raise "Error getting host information: #{rc.message}"
        end

        @vc_user = @host["TEMPLATE/VCENTER_USER"]
        @vc_pass = @host["TEMPLATE/VCENTER_PASSWORD"]
        @vc_host = @host["TEMPLATE/VCENTER_HOST"]

        begin
            @vc_client = RbVmomi::VIM.connect(:host => @vc_host, :user => @vc_user,
                :password => @vc_pass, :insecure => true)
            @vc_root   = @vc_client.root
        rescue Exception => e
            raise "Error connecting to #{@vc_host}: #{e.message}"
        end

        # Look for the corresponding ClusterComputeResource
        @vc_root.childEntity.each {|dc|
            clusters = dc.hostFolder.childEntity.grep(RbVmomi::VIM::ClusterComputeResource)
            clusters.each{|cl|
                if @host.name == cl.name
                    @cluster = cl
                    break
                end
            }
        }
    end

    ############################################################################
    # Generate an OpenNebula monitor string for this host. Reference:
    # https://www.vmware.com/support/developer/vc-sdk/visdk25pubs/ReferenceGuide/vim.ComputeResource.Summary.html
    #   - effectiveCpu: Effective CPU resources (in MHz) available to run
    #     VMs. This is the aggregated from all running hosts excluding hosts in
    #     maintenance mode or unresponsive are not counted.
    #   - effectiveMemory: Effective memory resources (in MB) available to run
    #     VMs. Equivalente to effectiveCpu.
    #   - numCpuCores: Number of physical CPU cores.
    #   - numEffectiveHosts: Total number of effective hosts.
    #   - numHosts:Total number of hosts.
    #   - totalCpu: Aggregated CPU resources of all hosts, in MHz.
    #   - totalMemory: Aggregated memory resources of all hosts, in bytes.
    ############################################################################
    def monitor_cluster
        #Load the host systems
        summary = @cluster.summary

        mhz_core = summary.totalCpu.to_f / summary.numCpuCores.to_f
        eff_core = summary.effectiveCpu.to_f / mhz_core

        free_cpu  = sprintf('%.2f', eff_core * 100).to_f
        total_cpu = summary.numCpuCores.to_f * 100
        used_cpu  = sprintf('%.2f', total_cpu - free_cpu).to_f

        total_mem = summary.totalMemory.to_i / 1024
        free_mem  = summary.effectiveMemory.to_i * 1024

        str_info = ""

        # System
        str_info << "TOTALHOST=" << summary.numHosts.to_s << "\n"
        str_info << "AVAILHOST=" << summary.numEffectiveHosts.to_s << "\n"

        # CPU
        str_info << "CPUSPEED=" << mhz_core.to_s   << "\n"
        str_info << "TOTALCPU=" << total_cpu.to_s << "\n"
        str_info << "USEDCPU="  << used_cpu.to_s  << "\n"
        str_info << "FREECPU="  << free_cpu.to_s << "\n"

        # Memory
        str_info << "TOTALMEMORY=" << total_mem.to_s << "\n"
        str_info << "FREEMEMORY="  << free_mem.to_s << "\n"
        str_info << "USEDMEMORY="  << (total_mem - free_mem).to_s  << "\n"
    end

    def monitor_host_systems
        vc.cluster.host.each{|h|
            if h.runtime.connectionState == "connected"

            else

            end
        }
    end

end
end
