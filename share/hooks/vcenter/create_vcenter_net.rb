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

# Exceptions
class AllocateNetworkError < StandardError; end
class CreateNetworkError < StandardError; end
class UpdateNetworkError < StandardError; end

# FUNCTIONS
def update_net(vnet, content)
    vnet.unlock
    rc = vnet.update(content, true)
    vnet.lock(1)
    return unless OpenNebula.is_error?(rc)

    err_msg = "Could not update the virtual network: #{rc.message}"
    raise UpdateNetworkError, err_msg
end

# waits for a vlan_id attribute to be generated
# only if automatic_vlan activated
def wait_vlanid(vnet)
    retries = 5
    i = 0
    while vnet['VLAN_ID'].nil?
        raise CreateNetworkError, 'cannot get vlan_id' if i >= retries

        sleep 1
        i += 1
        vnet.info
    end
end

# Creates a distributed port group in a datacenter
def create_dpg(one_vnet, dc, cluster, vi_client)
    begin
        # Get parameters needed to create the network
        pnics   = one_vnet['TEMPLATE/PHYDEV']
        pg_name = one_vnet['NAME']
        sw_name = one_vnet['TEMPLATE/VCENTER_SWITCH_NAME']
        mtu     = one_vnet['TEMPLATE/MTU']
        vlan_id = one_vnet['VLAN_ID'] || 0

        if one_vnet['TEMPLATE/VCENTER_SWITCH_NPORTS']
            nports = one_vnet['TEMPLATE/VCENTER_SWITCH_NPORTS']
        else
            nports = 8
        end

        dc.lock
        net_folder = dc.network_folder
        net_folder.fetch!

        # Get distributed port group if it exists
        dpg = dc.dpg_exists(pg_name, net_folder)

        # Disallow changes of switch name for existing pg
        if dpg && dc.pg_changes_sw?(dpg, sw_name)
            err_msg = "The port group's switch name can not be modified"\
                      " for OpenNebula's virtual network."
            raise CreateNetworkError, err_msg
        end

        if !dpg
            # Get distributed virtual switch if it exists
            dvs = dc.dvs_exists(sw_name, net_folder)

            if !dvs
                dvs = dc.create_dvs(sw_name, pnics, mtu)
            end
            # Creates distributed port group
            new_dpg = dc.create_dpg(dvs, pg_name, vlan_id, nports)
            # Attach dpg to esxi hosts
            cluster['host'].each do |host|
                begin
                    esx_host = VCenterDriver::ESXHost
                               .new_from_ref(host._ref, vi_client)
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
        else
            err_msg = "Port group #{pg_name} already exists"
            raise CreateNetworkError, err_msg
        end
        new_dpg
    ensure
        dc.unlock if dc
    end
end

# Creates a standard port group in a host
def create_pg(one_vnet, esx_host)
    begin
        # Get parameters needed to create the network
        pnics   = one_vnet['TEMPLATE/PHYDEV']
        pg_name = one_vnet['NAME']
        sw_name = one_vnet['TEMPLATE/VCENTER_SWITCH_NAME']
        mtu     = one_vnet['TEMPLATE/MTU']
        vlan_id = one_vnet['VLAN_ID'] || 0

        if one_vnet['TEMPLATE/VCENTER_SWITCH_NPORTS']
            nports = one_vnet['TEMPLATE/VCENTER_SWITCH_NPORTS']
        else
            nports = 128
        end
        esx_host.lock # Exclusive lock for ESX host operation

        pnics_available = nil
        pnics_available = esx_host.get_available_pnics if pnics

        # Get port group if it exists
        pg = esx_host.pg_exists(pg_name)

        # Disallow changes of switch name for existing pg
        if pg && esx_host.pg_changes_sw?(pg, sw_name)
            err_msg = 'The port group already exists in this host '\
                      'for a different vCenter standard switch and '\
                      'this kind of hange is not supported.'
            raise CreateNetworkError, err_msg
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

            new_pg = esx_host.create_pg(pg_name, sw_name, vlan_id)
        else
            err_msg = "Port group #{pg_name} already exists"
            raise CreateNetworkError, err_msg
        end
        new_pg
    ensure
        esx_host.unlock if esx_host # Remove lock
    end
end

def create_opaque_network(one_vnet, host_id)
    #   NSX parameters
    ls_name        = one_vnet['NAME']
    ls_description = one_vnet['TEMPLATE/DESCRIPTION']
    tz_id          = one_vnet['TEMPLATE/NSX_TZ_ID']
    replication_mode = one_vnet['TEMPLATE/NSX_REP_MODE']
    admin_state = one_vnet['TEMPLATE/NSX_ADMIN_STATUS']

    nsx_client = NSXDriver::NSXClient.new_from_id(host_id)

    opaque_network_spec = %(
        {
            "transport_zone_id": "#{tz_id}",
            "replication_mode": "#{replication_mode}",
            "admin_state": "#{admin_state}",
            "display_name": "#{ls_name}",
            "description": "#{ls_description}"
        }
    )

    NSXDriver::OpaqueNetwork.new(nsx_client, nil, tz_id, opaque_network_spec)
end

def create_virtual_wire(one_vnet, host_id)
    #   NSX parameters
    ls_name        = one_vnet['NAME']
    ls_description = one_vnet['TEMPLATE/DESCRIPTION']
    tz_id          = one_vnet['TEMPLATE/NSX_TZ_ID']
    replication_mode = one_vnet['TEMPLATE/NSX_REP_MODE']

    nsx_client = NSXDriver::NSXClient.new_from_id(host_id)

    virtual_wire_spec =
        "<virtualWireCreateSpec>\
            <name>#{ls_name}</name>\
            <description>#{ls_description}</description>\
            <tenantId>virtual wire tenant</tenantId>\
            <controlPlaneMode>#{replication_mode}</controlPlaneMode>\
            <guestVlanAllowed>false</guestVlanAllowed>\
        </virtualWireCreateSpec>"

    NSXDriver::VirtualWire.new(nsx_client, nil, tz_id, virtual_wire_spec)
end

def add_vnet_to_cluster(one_vnet, cluster_id)
    if cluster_id
        one_cluster = VCenterDriver::VIHelper
                      .one_item(OpenNebula::Cluster, cluster_id, false)
        if OpenNebula.is_error?(one_cluster)
            err_msg = "Error retrieving cluster #{cluster_id}: "\
                      "#{rc.message}. You may have to place this vnet "\
                      'in the right cluster by hand'
            raise CreateNetworkError, err_msg
        end

        one_vnet.unlock
        network_id = one_vnet['ID'].to_i
        rc = one_cluster.addvnet(network_id)
        if OpenNebula.is_error?(rc)
            err_msg = "Error adding vnet #{network_id} to OpenNebula "\
                      "cluster #{cluster_id}: #{rc.message}. "\
                      'You may have to place this vnet in the '\
                      'right cluster by hand'
            raise CreateNetworkError, err_msg
        end

        default_cluster = VCenterDriver::VIHelper
                          .one_item(OpenNebula::Cluster, '0', false)
        if OpenNebula.is_error?(default_cluster)
            err_msg = "Error retrieving default cluster: #{rc.message}."
            raise CreateNetworkError, err_msg
        end

        rc = default_cluster.delvnet(network_id)
        if OpenNebula.is_error?(rc)
            err_msg = "Error removing vnet #{network_id} from default "\
                      "OpenNebula cluster: #{rc.message}."
            raise CreateNetworkError, err_msg
        end
    else
        err_msg = 'Missing cluster ID'
        raise CreateNetworkError, err_msg
    end
end

# Constants
SUCCESS_XPATH = '//PARAMETER[TYPE="OUT" and POSITION="1"]/VALUE'
NETWORK_ID_XPATH = '//PARAMETER[TYPE="OUT" and POSITION="2"]/VALUE'
ERROR_XPATH = '//PARAMETER[TYPE="OUT" and POSITION="3"]/VALUE'

# Changes due to new hook subsystem
#   https://github.com/OpenNebula/one/issues/3380
arguments_raw = Base64.decode64(STDIN.read)
arguments_xml = Nokogiri::XML(arguments_raw)
network_id    = arguments_xml.xpath(NETWORK_ID_XPATH).text.to_i
success       = arguments_xml.xpath(SUCCESS_XPATH).text != 'false'

net_info = ''
esx_rollback = [] # Track hosts that require a rollback

begin
    # Check if the API call (one.vn.allocate) has been successful
    # and exit otherwise
    unless success
        err_msg = arguments_xml.xpath(ERROR_XPATH).text
        raise AllocateNetworkError, err_msg
    end

    # Create client to communicate with OpenNebula
    one_client = OpenNebula::Client.new

    # Get the network XML from OpenNebula
    # This is potentially different from the Netowrk Template
    # provided as the API call argument
    one_vnet = OpenNebula::VirtualNetwork.new_with_id(network_id, one_client)
    rc = one_vnet.info
    if OpenNebula.is_error?(rc)
        err_msg = rc.message
        raise CreateNetworkError, err_msg
    end

    managed  = one_vnet['TEMPLATE/OPENNEBULA_MANAGED'] != 'NO'
    imported = one_vnet['TEMPLATE/VCENTER_IMPORTED']

    unless one_vnet['VN_MAD'] == 'vcenter' && managed && imported.nil?
        msg = 'Network is being imported in OpenNebula, as it is already \
               present in vCenter. No actions needed in the hook, exiting.'
        STDOUT.puts msg
        one_vnet.unlock
        exit(0)
    end

    # Step 0. Only execute for vcenter network driver && managed by one
    one_vnet.lock(1)

    if one_vnet['VLAN_ID_AUTOMATIC'] == '1'
        wait_vlanid(one_vnet)
    end

    # Step 1. Extract vnet settings
    pg_type = one_vnet['TEMPLATE/VCENTER_PORTGROUP_TYPE']
    unless pg_type
        err_msg = ' Missing port group type'
        raise CreateNetworkError, err_msg
    end

    host_id = one_vnet['TEMPLATE/VCENTER_ONE_HOST_ID']
    unless host_id
        err_msg = 'Missing VCENTER_ONE_HOST_ID'
        raise CreateNetworkError, err_msg
    end

    # Step 2. Contact vCenter cluster and extract cluster's info
    vi_client = VCenterDriver::VIClient.new_from_host(host_id)
    vc_uuid   = vi_client.vim.serviceContent.about.instanceUuid
    one_host  = OpenNebula::Host.new_with_id(host_id, one_client)

    rc = one_host.info
    if OpenNebula.is_error?(rc)
        err_msg = rc.message
        raise CreateNetworkError, err_msg
    end

    cluster_id = one_host['CLUSTER_ID']

    vnet_ref = nil
    ccr_ref  = one_host['TEMPLATE/VCENTER_CCR_REF']
    cluster  = VCenterDriver::ClusterComputeResource.new_from_ref(ccr_ref,
                                                                  vi_client)
    dc       = cluster.get_dc

    # Step 3. Create the port groups based on each type
    if pg_type == VCenterDriver::Network::NETWORK_TYPE_NSXV
        begin
            logical_switch = create_virtual_wire(one_vnet, host_id)
            vnet_ref = logical_switch.ls_vcenter_ref
            ls_vni   = logical_switch.ls_vni
            ls_name = logical_switch.ls_name
            net_info << "VCENTER_NET_REF=\"#{vnet_ref}\"\n"
            net_info << "VCENTER_INSTANCE_ID=\"#{vc_uuid}\"\n"
            net_info << "NSX_ID=\"#{logical_switch.ls_id}\"\n"
            net_info << "NSX_VNI=\"#{ls_vni}\"\n"
            net_info << "BRIDGE=\"#{ls_name}\"\n"
            add_vnet_to_cluster(one_vnet, cluster_id)
            net_info << "VCENTER_NET_STATE=\"READY\"\n"
            update_net(one_vnet, net_info)
        rescue StandardError => e
            err_msg = e.message
            raise CreateNetworkError, err_msg
        end
    end

    if pg_type == VCenterDriver::Network::NETWORK_TYPE_NSXT
        begin
            logical_switch = create_opaque_network(one_vnet, host_id)
            vnet_ref = dc.nsx_network(logical_switch.ls_id, pg_type)
            ls_vni = logical_switch.ls_vni
            ls_name = logical_switch.ls_name
            net_info << "VCENTER_NET_REF=\"#{vnet_ref}\"\n"
            net_info << "VCENTER_INSTANCE_ID=\"#{vc_uuid}\"\n"
            net_info << "NSX_ID=\"#{logical_switch.ls_id}\"\n"
            net_info << "NSX_VNI=\"#{ls_vni}\"\n"
            net_info << "BRIDGE=\"#{ls_name}\"\n"
            add_vnet_to_cluster(one_vnet, cluster_id)
            net_info << "VCENTER_NET_STATE=\"READY\"\n"
            update_net(one_vnet, net_info)
        rescue StandardError => e
            err_msg = e.message
            raise CreateNetworkError, err_msg
        end
    end

    if pg_type == VCenterDriver::Network::NETWORK_TYPE_DPG
        # With DVS we have to work at datacenter level and then for each host
        vnet_ref = create_dpg(one_vnet, dc, cluster, vi_client)
        net_info << "VCENTER_NET_REF=\"#{vnet_ref}\"\n"
        net_info << "VCENTER_INSTANCE_ID=\"#{vc_uuid}\"\n"
        add_vnet_to_cluster(one_vnet, cluster_id)
        net_info << "VCENTER_NET_STATE=\"READY\"\n"
        update_net(one_vnet, net_info)
    end

    if pg_type == VCenterDriver::Network::NETWORK_TYPE_PG
        # With DVS we have to work at esxi host level
        cluster['host'].each do |host|
            esx_host = VCenterDriver::ESXHost.new_from_ref(host._ref, vi_client)
            esx_rollback << esx_host
            vnet_ref = create_pg(one_vnet, esx_host)
        end
        net_info << "VCENTER_NET_REF=\"#{vnet_ref}\"\n"
        net_info << "VCENTER_INSTANCE_ID=\"#{vc_uuid}\"\n"
        add_vnet_to_cluster(one_vnet, cluster_id)
        net_info << "VCENTER_NET_STATE=\"READY\"\n"
        update_net(one_vnet, net_info)
    end
    one_vnet.unlock
    exit(0)
rescue AllocateNetworkError => e
    # Here there is no one_vnet allocated
    STDERR.puts e.message
    STDERR.puts e.backtrace if VCenterDriver::CONFIG[:debug_information]
    exit(-1)
rescue CreateNetworkError => e
    STDERR.puts e.message
    STDERR.puts e.backtrace if VCenterDriver::CONFIG[:debug_information]
    net_info << "VCENTER_NET_STATE=\"ERROR\"\n"
    net_info << "VCENTER_NET_ERROR=\"#{e.message}\"\n"
    update_net(one_vnet, net_info)
    one_vnet.lock(1)
    exit(-1)
rescue UpdateNetworkError => e
    STDERR.puts e.message
    STDERR.puts e.backtrace if VCenterDriver::CONFIG[:debug_information]
    net_info << "VCENTER_NET_STATE=\"ERROR\"\n"
    net_info << "VCENTER_NET_ERROR=\"#{e.message}\"\n"
    update_net(one_vnet, net_info)
    one_vnet.lock(1)
    exit(-1)
rescue StandardError => e
    STDERR.puts e.message
    STDERR.puts e.backtrace if VCenterDriver::CONFIG[:debug_information]
    net_info << "VCENTER_NET_STATE=\"ERROR\"\n"
    net_info << "VCENTER_NET_ERROR=\"#{e.message}\"\n"
    update_net(one_vnet, net_info)

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

    one_vnet.lock(1)
    exit(-1)
ensure
    vi_client.close_connection if vi_client
end
