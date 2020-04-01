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
    VMDIR             = '/var/lib/one'
    CONFIG_FILE       = '/var/lib/one/config'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    VMDIR             = ONE_LOCATION + '/var'
    CONFIG_FILE       = ONE_LOCATION + '/var/config'
end

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION

require 'opennebula'
require 'vcenter_driver'
require 'base64'
require 'nsx_driver'

# Exceptions
class DeleteNetworkError < StandardError; end
class DeletePortgroupError < StandardError; end

# FUNCTIONS
def update_net(vnet, content)
    vnet.unlock
    rc = vnet.update(content, true)
    vnet.lock(1)
    return unless OpenNebula.is_error?(rc)

    err_msg = "Could not update the virtual network: #{rc.message}"
    raise UpdateNetworkError, err_msg
end

SUCCESS_XPATH = '//PARAMETER[TYPE="OUT" and POSITION="1"]/VALUE'
ERROR_XPATH = '//PARAMETER[TYPE="OUT" and POSITION="2"]/VALUE'
VNET_XPATH = '//EXTRA/VNET'

# Changes due to new hooks
arguments_raw = Base64.decode64(STDIN.read)
arguments_xml = Nokogiri::XML(arguments_raw)
success = arguments_xml.xpath(SUCCESS_XPATH).text

unless success
    err_msg = arguments_xml.xpath(ERROR_XPATH).text
    raise DeleteNetworkError, err_msg
end

vnet_xml = arguments_xml.xpath(VNET_XPATH).to_s

template    = OpenNebula::XMLElement.new
template.initialize_xml(vnet_xml, 'VNET')
managed  = template['TEMPLATE/OPENNEBULA_MANAGED'] != 'NO'
imported = template['TEMPLATE/VCENTER_IMPORTED']
error    = template['TEMPLATE/VCENTER_NET_STATE'] == 'ERROR'

begin
    # Step 0. Only execute for vcenter network driver
    unless template['VN_MAD'] == 'vcenter' && managed && !error && imported.nil?
        msg = 'Nothing to do. Network is not a vcenter network or is not ' \
              'managed or is an imported network'
        STDOUT.puts msg
        exit(0)
    end

    # Step 1. Extract vnet settings
    host_id = template['TEMPLATE/VCENTER_ONE_HOST_ID']
    raise 'Missing VCENTER_ONE_HOST_ID' unless host_id

    network_id = template['ID']
    pg_name = template['NAME']
    pg_type = template['TEMPLATE/VCENTER_PORTGROUP_TYPE']
    sw_name = template['TEMPLATE/VCENTER_SWITCH_NAME']

    # Step 2. Get vnet, contact cluster and extract cluster's info
    vi_client = VCenterDriver::VIClient.new_from_host(host_id)
    one_client = OpenNebula::Client.new
    one_vnet = OpenNebula::VirtualNetwork.new_with_id(network_id, one_client)
    one_host = OpenNebula::Host.new_with_id(host_id, one_client)
    rc = one_host.info
    raise rc.message if OpenNebula.is_error? rc

    ccr_ref = one_host['TEMPLATE/VCENTER_CCR_REF']
    cluster = VCenterDriver::ClusterComputeResource
              .new_from_ref(ccr_ref, vi_client)
    dc = cluster.get_dc

    # NSX
    ls_id = template['TEMPLATE/NSX_ID']
    # NSX

    # With DVS we have to work at datacenter level and then for each host
    if pg_type == VCenterDriver::Network::NETWORK_TYPE_DPG
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
        rescue StandardError => e
            err_msg = e.message
            raise DeletePortgroupError, err_msg
        ensure
            dc.unlock if dc
        end
    end

    if pg_type == VCenterDriver::Network::NETWORK_TYPE_PG
        cluster['host'].each do |host|
            # Step 3. Loop through hosts in clusters
            esx_host = VCenterDriver::ESXHost
                        .new_from_ref(host._ref, vi_client)

            begin
                esx_host.lock # Exclusive lock for ESX host operation

                next unless esx_host.pg_exists(pg_name)

                swname = esx_host.remove_pg(pg_name)
                next if !swname || sw_name != swname

                vswitch = esx_host.vss_exists(sw_name)
                next unless vswitch

                # Only remove switch if the port group being removed is
                # the last and only port group in the switch
                if vswitch.portgroup.empty?
                    esx_host.remove_vss(sw_name)
                end
            rescue StandardError => e
                err_msg = e.message
                raise DeletePortgroupError, err_msg
            ensure
                esx_host.unlock if esx_host # Remove host lock
            end
        end
    end

    if pg_type == VCenterDriver::Network::NETWORK_TYPE_NSXV
        begin
            nsx_client = NSXDriver::NSXClient.new_from_id(host_id)
            logical_switch = NSXDriver::VirtualWire
                              .new(nsx_client, ls_id, nil, nil)
            logical_switch.delete_logical_switch
        rescue StandardError => e
            err_msg = e.message
            raise DeletePortgroupError, err_msg
        end
    end

    if pg_type == VCenterDriver::Network::NETWORK_TYPE_NSXT
        begin
            nsx_client = NSXDriver::NSXClient.new_from_id(host_id)
            logical_switch = NSXDriver::OpaqueNetwork
                              .new(nsx_client, ls_id, nil, nil)
            logical_switch.delete_logical_switch
        rescue StandardError => e
            err_msg = e.message
            raise DeletePortgroupError, err_msg
        end
    end

rescue DeleteNetworkError => e
    STDERR.puts e.message
    STDERR.puts e.backtrace if VCenterDriver::CONFIG[:debug_information]
    net_info << "VCENTER_NET_STATE=\"ERROR\"\n"
    net_info << "VCENTER_NET_ERROR=\"#{e.message}\"\n"
    update_net(one_vnet, net_info)
    one_vnet.lock(1)
    exit(-1)
rescue DeletePortgroupError => e
    STDERR.puts e.message
    STDERR.puts e.backtrace if VCenterDriver::CONFIG[:debug_information]
    exit(-1)
rescue StandardError => e
    STDERR.puts e.message
    STDERR.puts e.backtrace if VCenterDriver::CONFIG[:debug_information]
    exit(-1)
ensure
    vi_client.close_connection if vi_client
end
