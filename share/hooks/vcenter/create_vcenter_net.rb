#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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

network_id   = ARGV[0]
#base64_temp  = ARGV[1]

#template     = OpenNebula::XMLElement.new
#template.initialize_xml(Base64.decode64(base64_temp), 'VNET')

# waits for a vlan_id attribute to be generated
# only if automatic_vlan activated
def wait_vlanid(vnet)
    retries = 5
    i = 0
    while vnet["VLAN_ID"].nil?
        raise "cannot get vlan_id" if i >= retries
        sleep 1
        i +=1
        vnet.info
    end
end

template = OpenNebula::VirtualNetwork.new_with_id(network_id, OpenNebula::Client.new)
rc = template.info
if OpenNebula.is_error?(rc)
    STDERR.puts rc.message
    exit 1
end
esx_rollback = [] #Track hosts that require a rollback
managed = template["TEMPLATE/OPENNEBULA_MANAGED"] != "NO"

begin
    # Step 0. Only execute for vcenter network driver && managed by one
    if template["VN_MAD"] == "vcenter" && managed
        wait_vlanid(template) if template["VLAN_ID_AUTOMATIC"] == '1'
        # Step 1. Extract vnet settings
        host_id =  template["TEMPLATE/VCENTER_ONE_HOST_ID"]
        raise "We require the ID of the OpenNebula host representing a vCenter cluster" if !host_id

        pnics     =  template["TEMPLATE/PHYDEV"]
        pg_name   =  template["TEMPLATE/BRIDGE"]
        pg_type   =  template["TEMPLATE/VCENTER_PORTGROUP_TYPE"]
        sw_name   =  template["TEMPLATE/VCENTER_SWITCH_NAME"]
        mtu       =  template["TEMPLATE/MTU"]
        vlan_id   =  template["VLAN_ID"] || 0

        if template["TEMPLATE/VCENTER_SWITCH_NPORTS"]
            nports  =  template["TEMPLATE/VCENTER_SWITCH_NPORTS"]
        else
            nports  = pg_type == "Port Group" ? 128 : 8
        end

        # Step 2. Contact cluster and extract cluster's info
        vi_client  = VCenterDriver::VIClient.new_from_host(host_id)
        vc_uuid    = vi_client.vim.serviceContent.about.instanceUuid
        one_client = OpenNebula::Client.new
        one_host   = OpenNebula::Host.new_with_id(host_id, one_client)
        rc         = one_host.info
        raise rc.message if OpenNebula::is_error? rc

        vnet_ref = nil
        ccr_ref = one_host["TEMPLATE/VCENTER_CCR_REF"]
        cluster = VCenterDriver::ClusterComputeResource.new_from_ref(ccr_ref, vi_client)
        dc = cluster.get_dc

        # With DVS we have to work at datacenter level and then for each host
        if pg_type == "Distributed Port Group"
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
                end
            rescue Exception => e
                raise e
            ensure
                dc.unlock if dc
            end
        end

        cluster["host"].each do |host|

            # Step 3. Loop through hosts in clusters
            esx_host = VCenterDriver::ESXHost.new_from_ref(host._ref, vi_client)

            if pg_type == "Port Group"
                begin
                    esx_host.lock # Exclusive lock for ESX host operation

                    pnics_available = nil
                    pnics_available = esx_host.get_available_pnics if pnics

                    # Get port group if it exists
                    pg = esx_host.pg_exists(pg_name)

                    # Disallow changes of switch name for existing pg
                    if pg && esx_host.pg_changes_sw?(pg, switch_name)
                        raise "The port group already exists in this host "\
                              " for a different vCenter standard switch and this kind of "
                              " change is not supported."
                    end

                    # Pg does not exits
                    if !pg
                        # Get standard switch if it exists
                        vs = esx_host.vss_exists(sw_name)

                        if !vs
                            sw_name = esx_host.create_vss(sw_name, pnics, nports, mtu, pnics_available)
                        end

                        vnet_ref = esx_host.create_pg(pg_name, sw_name, vlan_id)
                    end

                rescue Exception => e
                    raise e
                ensure
                    esx_rollback << esx_host
                    esx_host.unlock if esx_host # Remove lock
                end
            end

            if pg_type == "Distributed Port Group"
                begin
                    esx_host.lock
                    pnics_available = nil
                    pnics_available = esx_host.get_available_pnics if pnics && !pnics.empty?
                    esx_host.assign_proxy_switch(dvs, sw_name, pnics, pnics_available)
                rescue Exception => e
                    raise e
                ensure
                    esx_host.unlock if esx_host
                end
            end
        end


        # We must update XML so the VCENTER_NET_REF and VCENTER_INSTANCE_ID are added
        one_vnet = VCenterDriver::VIHelper.one_item(OpenNebula::VirtualNetwork, network_id, false)

        rc = one_vnet.update("VCENTER_NET_REF=\"#{vnet_ref}\"\nVCENTER_INSTANCE_ID=\"#{vc_uuid}\"\nVCENTER_NET_STATE=\"READY\"\nVCENTER_NET_ERROR=\"\"\n", true)

        if OpenNebula.is_error?(rc)
            raise "Could not update VCENTER_NET_REF and VCENTER_INSTANCE_ID for virtual network"
        end


        # Assign vnet to OpenNebula cluster
        cluster_id = one_host["CLUSTER_ID"]
        if cluster_id
            one_cluster = VCenterDriver::VIHelper.one_item(OpenNebula::Cluster, cluster_id, false)
            if OpenNebula.is_error?(one_cluster)
                STDOUT.puts "Error retrieving cluster #{cluster_id}: #{rc.message}. You may have to place this vnet in the right cluster by hand"
            end

            rc = one_cluster.addvnet(network_id.to_i)
            if OpenNebula.is_error?(rc)
                STDOUT.puts "Error adding vnet #{network_id} to OpenNebula cluster #{cluster_id}: #{rc.message}. You may have to place this vnet in the right cluster by hand"
            end

            default_cluster = VCenterDriver::VIHelper.one_item(OpenNebula::Cluster, "0", false)
            if OpenNebula.is_error?(default_cluster)
                STDOUT.puts "Error retrieving default cluster: #{rc.message}."
            end

            rc = default_cluster.delvnet(network_id.to_i)
            if OpenNebula.is_error?(rc)
                STDOUT.puts "Error removing vnet #{network_id} from default OpenNebula cluster: #{rc.message}."
            end
        end
    end

rescue Exception => e
    STDERR.puts("#{e.message}/#{e.backtrace}")

    esx_rollback.each do |esx_host|
        begin
            esx_host.lock
            esx_host.network_rollback
        rescue Exception => e
            STDERR.puts("There was an issue performing the rollback in host #{esx_host["name"]} you may have to perform some actions by hand")
        ensure
            esx_host.unlock
        end
    end

    if dc && pg_type == "Distributed Port Group"
        begin
            dc.lock
            dc.network_rollback
        rescue Exception => e
            STDERR.puts("There was an issue performing the rollback in datacenter #{dc["name"]} you may have to perform some actions by hand")
        ensure
            dc.unlock
        end
    end

    one_vnet = VCenterDriver::VIHelper.one_item(OpenNebula::VirtualNetwork, network_id, false)

    rc = one_vnet.update("VCENTER_NET_STATE=\"ERROR\"\nVCENTER_NET_ERROR=\"#{e.message}\"\n", true)

    if OpenNebula.is_error?(rc)
        raise "Could not update VCENTER_NET_REF and VCENTER_INSTANCE_ID for virtual network"
    end

    exit -1
ensure
    vi_client.close_connection if vi_client
end
