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

require_relative '../../../lib/vcenter.rb'

host_id = ARGV[1]

begin
    # Vcenter connection
    vi_client = VCenterDriver::VIClient.new_from_host(host_id)
    # Cluster Monitoring
    cm = ClusterMonitor.new(vi_client, host_id)
    puts cm.monitor_cluster
    puts cm.monitor_host_systems
    # Retrieve customizations
    begin
        puts cm.monitor_customizations
    rescue StandardError
        # Do not break monitoring on customization error
        puts 'ERROR="Customizations could not be retrieved,' \
                'please check permissions"'
    end

    # Get NSX info detected from vCenter Server
    puts cm.nsx_info

    # Print VM monitor info
    vm_monitor_info, last_perf_poll = cm.monitor_vms(host_id)
    if !vm_monitor_info.empty?
        puts "VM_POLL=YES"
        puts vm_monitor_info
    end

    # # Print last VM poll for perfmanager tracking
    puts "VCENTER_LAST_PERF_POLL=" << last_perf_poll << "\n" if last_perf_poll

    # Datastore Monitoring
    dm = DatastoreMonitor.new(vi_client, host_id)

rescue StandardError => e
    STDERR.puts "IM poll for vcenter cluster #{host_id} failed due to "\
                "\"#{e.message}\"\n#{e.backtrace}"
    exit(-1)
ensure
    @vi_client.close_connection if @vi_client
end
