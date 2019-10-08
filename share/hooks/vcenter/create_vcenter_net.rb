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

# Define libraries location
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

# Hook dependencies
require 'opennebula'
require 'vcenter_driver'
require 'base64'
require 'nsx_driver'

# FUNCTIONS
def update_net(vnet, content)
    vnet.unlock
    rc = vnet.update(content, true)
    vnet.lock(1)

    raise 'Could not update the virtual network' if OpenNebula.is_error?(rc)
end

# waits for a vlan_id attribute to be generated
# only if automatic_vlan activated
def wait_vlanid(vnet)
    retries = 5
    i = 0
    while vnet['VLAN_ID'].nil?
        raise 'cannot get vlan_id' if i >= retries

        sleep 1
        i += 1
        vnet.info
    end
end

def err_and_exit(error_message)
    STDERR.puts error_message
    exit(-1)
end

# Constants
SUCCESS_XPATH = '//PARAMETER[TYPE="OUT" and POSITION="1"]/VALUE'
ERROR_XPATH = '//PARAMETER[TYPE="OUT" and POSITION="2"]/VALUE'
NETWORK_ID_XPATH = '//PARAMETER[TYPE="OUT" and POSITION="2"]/VALUE'

# Changes due to new hook subsystem
#   https://github.com/OpenNebula/one/issues/3380
arguments_raw = Base64.decode64(STDIN.read)
arguments_xml = Nokogiri::XML(arguments_raw)
network_id    = arguments_xml.xpath(NETWORK_ID_XPATH).text.to_i
success       = arguments_xml.xpath(SUCCESS_XPATH).text != 'false'

# Check if the API call (one.vn.allocate) has been successful
# and exit otherwise
err_and_exit(arguments_xml.xpath(ERROR_XPATH).text) unless success

# Create client to communicate with OpenNebula
one_client = OpenNebula::Client.new

# Get the network XML from OpenNebula
# This is potentially different from the Netowrk Template
# provided as the API call argument
one_vnet = OpenNebula::VirtualNetwork.new_with_id(network_id, one_client)
err_and_exit(rc.message) if OpenNebula.is_error?(one_vnet.info)

managed  = one_vnet['TEMPLATE/OPENNEBULA_MANAGED'] != 'NO'
imported = one_vnet['TEMPLATE/VCENTER_IMPORTED']

unless one_vnet['VN_MAD'] == 'vcenter' && managed && imported.nil?
    STDOUT.puts 'Network present in vCenter, no actions taken. Exiting'
    exit(0)
end



begin
    esx_rollback = [] # Track hosts that require a rollback

    # Step 0. Only execute for vcenter network driver && managed by one
    one_vnet.lock(1)
    wait_vlanid(one_vnet) if one_vnet['VLAN_ID_AUTOMATIC'] == '1'

    # Step 1. Extract vnet settings
    host_id = one_vnet['TEMPLATE/VCENTER_ONE_HOST_ID']
    raise 'Missing VCENTER_ONE_HOST_ID' unless host_id

    pnics   = one_vnet['TEMPLATE/PHYDEV']
    pg_name = one_vnet['TEMPLATE/BRIDGE']
    pg_type = one_vnet['TEMPLATE/VCENTER_PORTGROUP_TYPE']
    sw_name = one_vnet['TEMPLATE/VCENTER_SWITCH_NAME']
    mtu     = one_vnet['TEMPLATE/MTU']
    vlan_id = one_vnet['VLAN_ID'] || 0

    #   NSX parameters
    ls_name        = one_vnet['NAME']
    ls_description = one_vnet['TEMPLATE/DESCRIPTION']
    tz_id          = one_vnet['TEMPLATE/NSX_TZ_ID']

    if one_vnet['TEMPLATE/VCENTER_SWITCH_NPORTS']
        nports = one_vnet['TEMPLATE/VCENTER_SWITCH_NPORTS']
    else
        pg_type == 'Port Group' ? nports = 128 : nports = 8
    end

    # Step 2. Contact vCenter cluster and extract cluster's info
    vi_client = VCenterDriver::VIClient.new_from_host(host_id)
    vc_uuid   = vi_client.vim.serviceContent.about.instanceUuid
    one_host  = OpenNebula::Host.new_with_id(host_id, one_client)
    raise rc.message if OpenNebula.is_error?(one_host.info)

    vnet_ref = nil
    blocked  = false
    ccr_ref  = one_host['TEMPLATE/VCENTER_CCR_REF']
    cluster  = VCenterDriver::ClusterComputeResource.new_from_ref(ccr_ref,
                                                                  vi_client)
    dc       = cluster.get_dc

    if pg_type == VCenterDriver::Network::NETWORK_TYPE_NSXV
        nsx_client = NSXDriver::NSXClient.new_from_id(host_id)
        virtual_wire_spec =
            "<virtualWireCreateSpec>\
                <name>#{ls_name}</name>\
                <description>#{ls_description}</description>\
                <tenantId>virtual wire tenant</tenantId>\
                <controlPlaneMode>UNICAST_MODE</controlPlaneMode>\
                <guestVlanAllowed>false</guestVlanAllowed>\
            </virtualWireCreateSpec>"
        begin
            logical_switch = NSXDriver::VirtualWire
                             .new(nsx_client, nil, tz_id, virtual_wire_spec)
        rescue StandardError => e
            STDERR.puts "ERROR: #{e.message} #{e.backtrace}"
            exit(-1)
        end
        # Get reference will have in vcenter and vni
        vnet_ref = logical_switch.ls_vcenter_ref
        ls_vni   = logical_switch.ls_vni
        ls_name = logical_switch.ls_name
        net_info = "NSX_ID=\"#{logical_switch.ls_id}\"\n"
        net_info << "NSX_VNI=\"#{ls_vni}\"\n"
        net_info << "BRIDGE=\"#{ls_name}\"\n"
    end

    if pg_type == VCenterDriver::Network::NETWORK_TYPE_NSXT
        nsx_client = NSXDriver::NSXClient.new_from_id(host_id)
        opaque_network_spec = %(
            {
                "transport_zone_id": "#{tz_id}",
                "replication_mode": "MTEP",
                "admin_state": "UP",
                "display_name": "#{ls_name}",
                "description": "#{ls_description}"
            }
        )
        begin
            logical_switch = NSXDriver::OpaqueNetwork
                             .new(nsx_client, nil, tz_id, opaque_network_spec)
        rescue StandardError => e
            STDERR.puts "ERROR: #{e.message} #{e.backtrace}"
            exit(-1)
        end
        # Get reference will have in vcenter and vni
        vnet_ref = dc.nsx_network(logical_switch.ls_id, pg_type)
        ls_vni = logical_switch.ls_vni
        ls_name = logical_switch.ls_name
        net_info = "NSX_ID=\"#{logical_switch.ls_id}\"\n"
        net_info << "NSX_VNI=\"#{ls_vni}\"\n"
        net_info << "BRIDGE=\"#{ls_name}\"\n"
    end

    # With DVS we have to work at datacenter level and then for each host
    if pg_type == VCenterDriver::Network::NETWORK_TYPE_DPG
        begin
            dc.lock
            net_folder = dc.network_folder
            net_folder.fetch!

            # Get distributed port group if it exists
            dpg = dc.dpg_exists(pg_name, net_folder)

            # Disallow changes of switch name for existing pg
            if dpg && dc.pg_changes_sw?(dpg, sw_name)
                raise "The port group's switch name can not be modified"\
                      " for OpenNebula's virtual network."
            end

            if !dpg
                # Get distributed virtual switch if it exists
                dvs = dc.dvs_exists(sw_name, net_folder)

                if !dvs
                    dvs = dc.create_dvs(sw_name, pnics, mtu)
                end

                vnet_ref = dc.create_dpg(dvs, pg_name, vlan_id, nports)
            else
                blocked = true
            end
        rescue StandardError => e
            raise e
        ensure
            dc.unlock if dc
        end
    end

    # Step 3. Loop through hosts in clusters
    cluster['host'].each do |host|
        esx_host = VCenterDriver::ESXHost.new_from_ref(host._ref, vi_client)

        if pg_type == VCenterDriver::Network::NETWORK_TYPE_PG
            begin
                esx_host.lock # Exclusive lock for ESX host operation

                pnics_available = nil
                pnics_available = esx_host.get_available_pnics if pnics

                # Get port group if it exists
                pg = esx_host.pg_exists(pg_name)

                # Disallow changes of switch name for existing pg
                if pg && esx_host.pg_changes_sw?(pg, sw_name)
                    raise 'The port group already exists in this host '\
                          'for a different vCenter standard switch and '\
                          'this kind of hange is not supported.'
                end

                # Pg does not exist
                if !pg
                    # Get standard switch if it exists
                    vs = esx_host.vss_exists(sw_name)

                    if !vs
                        sw_name = esx_host.create_vss(sw_name,
                                                      pnics,
                                                      nports,
                                                      mtu,
                                                      pnics_available)
                    end

                    vnet_ref = esx_host.create_pg(pg_name, sw_name, vlan_id)
                else
                    blocked = true
                end
            rescue StandardError => e
                raise e
            ensure
                esx_rollback << esx_host
                esx_host.unlock if esx_host # Remove lock
            end
        end

        next unless pg_type == VCenterDriver::Network::NETWORK_TYPE_DPG

        begin
            esx_host.lock
            if dvs
                pnics_available = nil
                if pnics && !pnics.empty?
                    pnics_available = esx_host.get_available_pnics
                end
                esx_host.assign_proxy_switch(dvs,
                                              sw_name,
                                              pnics,
                                              pnics_available)
            end
        rescue StandardError => e
            raise e
        ensure
            esx_host.unlock if esx_host
        end
    end

    # Update network XML
    net_info << "VCENTER_NET_REF=\"#{vnet_ref}\"\n"
    net_info << "VCENTER_INSTANCE_ID=\"#{vc_uuid}\"\n"

    if blocked
        net_info << "VCENTER_NET_STATE=\"ERROR\"\n"
        net_info << "VCENTER_NET_ERROR=\"vnet already exist in vcenter\"\n"
    else
        net_info << "VCENTER_NET_STATE=\"READY\"\n"
        net_info << "VCENTER_NET_ERROR=\"\"\n"
    end
    update_net(one_vnet, net_info)

    # Assign vnet to OpenNebula cluster
    cluster_id = one_host['CLUSTER_ID']
    if cluster_id
        one_cluster = VCenterDriver::VIHelper
                      .one_item(OpenNebula::Cluster, cluster_id, false)
        if OpenNebula.is_error?(one_cluster)
            err_msg = "Error retrieving cluster #{cluster_id}: "\
                      "#{rc.message}. You may have to place this vnet "\
                      'in the right cluster by hand'
            STDOUT.puts(err_msg)
        end

        one_vnet.unlock

        rc = one_cluster.addvnet(network_id.to_i)
        if OpenNebula.is_error?(rc)
            err_msg = "Error adding vnet #{network_id} to OpenNebula "\
                      "cluster #{cluster_id}: #{rc.message}. "\
                      'You may have to place this vnet in the '\
                      'right cluster by hand'
            STDOUT.puts(err_msg)
        end

        default_cluster = VCenterDriver::VIHelper
                          .one_item(OpenNebula::Cluster, '0', false)
        if OpenNebula.is_error?(default_cluster)
            STDOUT.puts "Error retrieving default cluster: #{rc.message}."
        end

        rc = default_cluster.delvnet(network_id.to_i)
        if OpenNebula.is_error?(rc)
            err_msg = "Error removing vnet #{network_id} from default "\
                      "OpenNebula cluster: #{rc.message}."
            STDOUT.puts(err_msg)
        end

        one_vnet.lock(1)
    end

rescue StandardError => e
    STDERR.puts("#{e.message}/#{e.backtrace}")

    esx_rollback.each do |esx_host|
        begin
            esx_host.lock
            esx_host.network_rollback
        rescue StandardError => e
            err_msg = 'here was an issue performing the rollback in '\
                      "host #{esx_host['name']} you may have to perform "\
                      'some actions by hand'
            STDERR.puts(err_msg)
        ensure
            esx_host.unlock
        end
    end

    if dc && pg_type == VCenterDriver::Network::NETWORK_TYPE_DPG
        begin
            dc.lock
            dc.network_rollback
        rescue StandardError => e
            err_msg = 'There was an issue performing the rollback in '\
                      "datacenter #{dc['name']} you may have to perform "\
                      'some actions by hand'
            STDERR.puts(err_msg)
        ensure
            dc.unlock
        end
    end

    net_info = "VCENTER_NET_STATE=\"ERROR\"\n"
    net_info << "VCENTER_NET_ERROR=\"#{e.message}\"\n"
    update_net(one_vnet, net_info)

    exit(-1)
ensure
    one_vnet.unlock
    vi_client.close_connection if vi_client
end
