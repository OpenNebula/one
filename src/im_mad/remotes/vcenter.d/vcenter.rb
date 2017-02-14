#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                  #
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
    RUBY_LIB_LOCATION="/usr/lib/one/ruby" if !defined?(RUBY_LIB_LOCATION)
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby" if !defined?(RUBY_LIB_LOCATION)
end

$: << RUBY_LIB_LOCATION

require 'vcenter_driver2'

host_id = ARGV[4]

if !host_id
    exit -1
end

vi_client = VCenterDriver::VIClient.new_from_host(host_id)

# Get CCR reference
client = OpenNebula::Client.new
host = OpenNebula::Host.new_with_id(host_id, client)
rc = host.info
if OpenNebula::is_error? rc
    STDERR.puts rc.message
    exit 1
end

ccr_ref = host["TEMPLATE/VCENTER_CCR_REF"]

# Get vCenter Cluster
cluster = VCenterDriver::ClusterComputeResource.new_from_ref(vi_client, ccr_ref)

# Print monitoring info
puts cluster.monitor
puts cluster.monitor_host_systems

vm_monitor_info = cluster.monitor_vms
if !vm_monitor_info.empty?
    puts "VM_POLL=YES"
    puts vm_monitor_info
end

puts cluster.monitor_customizations

dc = cluster.get_dc
ds_folder = dc.datastore_folder
ds_folder.fetch!
puts ds_folder.monitor
