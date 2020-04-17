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
# -------------------------------------------------------------------------- #
require_relative '../../../lib/vcenter.rb'

host_id = ARGV[1]

begin
    # Vcenter connection
    vi_client = VCenterDriver::VIClient.new_from_host(host_id)
    client = OpenNebula::Client.new
    vmpool = OpenNebula::VirtualMachinePool.new(client,
                OpenNebula::VirtualMachinePool::INFO_ALL_VM)

    rc = vmpool.info

    return if OpenNebula.is_error?(rc)

    result = ''
    vmpool.each do |vm|
        puts "************VIRTUALMACHINE #{vm['NAME']}**********************"
        VirtualMachineMonitor.new(vi_client, vm)
        puts "**************************************************************"
    end
rescue StandardError => e
    STDERR.puts "IM poll for vcenter cluster #{host_id} failed due to "\
                "\"#{e.message}\"\n#{e.backtrace}"
    exit(-1)
ensure
    @vi_client.close_connection if @vi_client
end
