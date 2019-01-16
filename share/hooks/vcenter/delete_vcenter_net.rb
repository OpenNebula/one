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

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
    VMDIR="/var/lib/one"
    CONFIG_FILE="/var/lib/one/config"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    VMDIR=ONE_LOCATION+"/var"
    CONFIG_FILE=ONE_LOCATION+"/var/config"
end

$: << RUBY_LIB_LOCATION

require 'opennebula'
require 'vcenter_driver'
require 'base64'

base64_temp = ARGV[1]
template    = OpenNebula::XMLElement.new
template.initialize_xml(Base64.decode64(base64_temp), 'VNET')
managed  = template["TEMPLATE/OPENNEBULA_MANAGED"] != "NO"
imported = template["TEMPLATE/VCENTER_IMPORTED"]
error    = template["TEMPLATE/VCENTER_NET_STATE"] == "ERROR"

begin
    # Step 0. Only execute for vcenter network driver
    if template["VN_MAD"] == "vcenter" && managed && !error && imported.nil?
        # Step 1. Extract vnet settings
        host_id =  template["TEMPLATE/VCENTER_ONE_HOST_ID"]
        raise "We require the ID of the OpenNebula host representing a vCenter cluster" if !host_id

        pg_name   =  template["TEMPLATE/BRIDGE"]
        pg_type   =  template["TEMPLATE/VCENTER_PORTGROUP_TYPE"]
        sw_name   =  template["TEMPLATE/VCENTER_SWITCH_NAME"]

        # Step 2. Contact cluster and extract cluster's info
        vi_client  = VCenterDriver::VIClient.new_from_host(host_id)
        one_client = OpenNebula::Client.new
        one_host   = OpenNebula::Host.new_with_id(host_id, one_client)
        rc         = one_host.info
        raise rc.message if OpenNebula::is_error? rc

        ccr_ref = one_host["TEMPLATE/VCENTER_CCR_REF"]
        cluster = VCenterDriver::ClusterComputeResource.new_from_ref(ccr_ref, vi_client)
        dc = cluster.get_dc

        # With DVS we have to work at datacenter level and then for each host
        if pg_type == "Distributed Port Group"
            begin
                dc.lock

                # Explore network folder in search of dpg and dvs
                net_folder = dc.network_folder
                net_folder.fetch!

                # Get distributed port group and dvs if they exists
                dvs = dc.dvs_exists(sw_name, net_folder)
                dpg = dc.dpg_exists(pg_name, net_folder)
                dc.remove_dpg(dpg) if dpg

                # Only remove switch if the port group being removed is
                # the last and only port group in the switch

                if dvs && dvs.item.summary.portgroupName.size == 1 &&
                   dvs.item.summary.portgroupName[0] == "#{sw_name}-uplink-pg"
                    dc.remove_dvs(dvs)
                end

            rescue Exception => e
                raise e
            ensure
                dc.unlock if dc
            end
        end

        if pg_type == "Port Group"
            cluster["host"].each do |host|
                # Step 3. Loop through hosts in clusters
                esx_host = VCenterDriver::ESXHost.new_from_ref(host._ref, vi_client)

                begin
                    esx_host.lock # Exclusive lock for ESX host operation

                    next if !esx_host.pg_exists(pg_name)

                    swname = esx_host.remove_pg(pg_name)
                    next if !swname || sw_name != swname

                    vswitch = esx_host.vss_exists(sw_name)
                    next if !vswitch

                    # Only remove switch if the port group being removed is
                    # the last and only port group in the switch
                    if vswitch.portgroup.size == 0
                        swname = esx_host.remove_vss(sw_name)
                    end

                rescue Exception => e
                    raise e
                ensure
                    esx_host.unlock if esx_host # Remove host lock
                end
            end
        end
    end

rescue Exception => e
    STDERR.puts("#{e.message}/#{e.backtrace}")
    exit -1
ensure
    vi_client.close_connection if vi_client
end
