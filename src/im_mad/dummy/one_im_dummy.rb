#!/usr/bin/env ruby

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

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    ETC_LOCATION      = '/etc/one/'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    ETC_LOCATION      = ONE_LOCATION + '/etc/'
end

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION

require 'OpenNebulaDriver'
require 'CommandManager'
require 'base64'


# The SSH Information Manager Driver
class DummyInformationManager < OpenNebulaDriver

    # Init the driver
    def initialize(num)
        super('',
            :concurrency => num,
            :threaded => true
        )

        # register actions
        register_action(:MONITOR, method("action_monitor"))
        register_action(:STOPMONITOR, method("stop_monitor"))
    end

    # Execute the sensor array in the remote host
    def action_monitor(number, host, not_used1, not_used2)
        results =  "HYPERVISOR=dummy\n"
        results << "HOSTNAME=#{host}\n"

        results << "CPUSPEED=2.2GHz\n"

        used_memory = rand(16777216)
        results << "TOTALMEMORY=16777216\n"
        results << "USEDMEMORY=#{used_memory}\n"
        results << "FREEMEMORY=#{16777216-used_memory}\n"

        used_cpu = rand(800)
        results << "TOTALCPU=800\n"
        results << "USEDCPU=#{used_cpu}\n"
        results << "FREECPU=#{800-used_cpu}\n"

        results << "DS_LOCATION_USED_MB=9720\n"
        results << "DS_LOCATION_TOTAL_MB=20480\n"
        results << "DS_LOCATION_FREE_MB=20480\n"

        results << "PCI = [
                ADDRESS = \"0000:02:00:0\",\n
                BUS = \"02\",\n
                CLASS = \"0300\",\n
                CLASS_NAME = \"VGA compatible controller\",\n
                DEVICE = \"0863\",\n
                DEVICE_NAME = \"C79 [GeForce 9400M]\",\n
                DOMAIN = \"0000\",\n
                FUNCTION = \"0\",\n
                SHORT_ADDRESS = \"02:00.0\",\n
                SLOT = \"00\",\n
                TYPE = \"10de:0863:0300\",\n
                VENDOR = \"10de\",\n
                VENDOR_NAME = \"NVIDIA Corporation\",\n
                NUMA_NODE=\"1\"
            ]\n
            PCI = [
                ADDRESS = \"0000:00:06:0\",\n
                BUS = \"00\",\n
                CLASS = \"0c03\",\n
                CLASS_NAME = \"USB controller\",\n
                DEVICE = \"0aa7\",\n
                DEVICE_NAME = \"MCP79 OHCI USB 1.1 Controller\",\n
                DOMAIN = \"0000\",\n
                FUNCTION = \"0\",\n
                SHORT_ADDRESS = \"00:06.0\",\n
                SLOT = \"06\",\n
                TYPE = \"10de:0aa7:0c03\",\n
                VENDOR = \"10de\",\n
                VENDOR_NAME = \"NVIDIA Corporation\",\n
                NUMA_NODE=\"1\"
            ]\n
            PCI = [
                ADDRESS = \"0000:00:06:1\",\n
                BUS = \"00\",\n
                CLASS = \"0c03\",\n
                CLASS_NAME = \"USB controller\",\n
                DEVICE = \"0aa9\",\n
                DEVICE_NAME = \"MCP79 EHCI USB 2.0 Controller\",\n
                DOMAIN = \"0000\",\n
                FUNCTION = \"1\",\n
                SHORT_ADDRESS = \"00:06.1\",\n
                SLOT = \"06\",\n
                TYPE = \"10de:0aa9:0c03\",\n
                VENDOR = \"10de\",\n
                VENDOR_NAME = \"NVIDIA Corporation\"\n,
                NUMA_NODE=\"0\"
            ]\n"

        make_topology(results, 2, 8, [2048, 1048576], 4, 16777216)

        results = Base64::encode64(results).strip.delete("\n")

        send_message("MONITOR", RESULT[:success], number, results)
    end

    def stop_monitor(number, host)
        send_message("STOPMONITOR", RESULT[:success], number, nil)
    end

    def make_topology(result, nodes, cores, pages, threads, mem)
        nodes.times do |i|
            cores.times do |j|
                core_id  = j + ( i * cores)

                core_str = "CORE = [ NODE_ID=\"#{i}\", ID=\"#{core_id}\", "\
                    "CPUS=\""

                threads.times do |k|
                    cpu_id = core_id + k * ( cores * nodes )

                    core_str << "," if k != 0
                    core_str << "#{cpu_id}"
                end

                core_str << "\"]\n"

                result << core_str
            end

            pages.each do |p|
                result << "HUGEPAGE = [ SIZE = \"#{p}\", FREE = \"1024\", "\
                    "PAGES = \"1024\", NODE_ID = \"#{i}\" ] "
            end

            memn = mem.to_i/nodes

            result << "MEMORY_NODE = [ NODE_ID = \"#{i}\", TOTAL = \"#{memn}\"" \
                ", FREE = \"#{rand(memn)}\", USED = \"#{rand(memn)}\", " \
                "DISTANCE = \"#{i} "

            nodes.times do |l|
                result << "#{l} " if l != i
            end

            result << "\" ]\n"
        end
    end
end


# Information Manager main program


im = DummyInformationManager.new(15)
im.start_driver
