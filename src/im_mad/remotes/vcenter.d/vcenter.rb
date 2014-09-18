#!/usr/bin/env ruby

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

ONE_LOCATION=ENV["ONE_LOCATION"] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby" if !defined?(RUBY_LIB_LOCATION)
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby" if !defined?(RUBY_LIB_LOCATION)
end

$: << "../../vmm/vcenter/"

require 'vcenter_driver'

host_id = ARGV[0]

if !host_id
    exit -1
end

vcenter_host = VCenterDriver::VCenterHost.new(host_id)

cluster_info = vcenter_host.monitor_cluster

cluster_info << vcenter_host.monitor_host_systems

vm_monitor_info = vcenter_host.monitor_vms
cluster_info << "\nVM_POLL=YES"
cluster_info << "#{vm_monitor_info}" if !vm_monitor_info.empty?

puts cluster_info
