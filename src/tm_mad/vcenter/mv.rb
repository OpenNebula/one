# ---------------------------------------------------------------------------- #
# Copyright 2002-2017, OpenNebula Project, OpenNebula Systems                  #
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

ONE_LOCATION = ENV["ONE_LOCATION"] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby" if !defined?(RUBY_LIB_LOCATION)
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby" if !defined?(RUBY_LIB_LOCATION)
end

$: << RUBY_LIB_LOCATION
$: << File.dirname(__FILE__)

require 'vcenter_driver'

SRC  = ARGV[0]
DST  = ARGV[1]
WMID = ARGV[2]
DSID = ARGV[3]

begin
    one_client = OpenNebula::Client.new

    pool = OpenNebula::HostPool.new(one_client)
    pool.info

    src_id = pool["/HOST_POOL/HOST[NAME='#{SRC}']/ID"].to_i
    dst_id = pool["/HOST_POOL/HOST[NAME='#{DST}']/ID"].to_i

    vi_client  = VCenterDriver::VIClient.new_from_host(src_id)

    # required one objects
    vm = OpenNebula::VirtualMachine.new_with_id(WMID, one_client)
    dst_host = OpenNebula::Host.new_with_id(dst_id, one_client)

    # get info
    vm.info
    dst_host.info

    # required vcenter objects
    vc_vm = VCenterDriver::VirtualMachine.new_from_ref(vm["/VM/DEPLOY_ID"], vi_client)
    dst_host = VCenterDriver::ClusterComputeResource.new_from_ref(dst_host["/HOST/TEMPLATE/VCENTER_CCR_REF"],vi_client).item

    config = {:cluster => dst_host }
    vc_vm.migrate(config)

rescue Exception => e
    message = "Cannot migrate for VM #{WMID}"\
              "failed due to "\
              "\"#{e.message}\"\n#{e.backtrace}"
    STDERR.puts error_message(message)
    exit -1
ensure
    vi_client.close_connection if vi_client
end
