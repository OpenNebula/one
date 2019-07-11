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

def update_net(vnet, content)
    vnet.unlock
    rc = vnet.update(content, true)
    vnet.lock(1)

    if OpenNebula.is_error?(rc)
        raise "Could not update the virtual network"
    end
end

def checkResponse(response, code)
  if response.code.to_i == code
      puts "Expected response #{code}"
  else
      puts "Unexpected response #{response.code.to_i}.. correct was #{code}"
      puts response.body
  end
end

def logicalSwitchData(nsxmgr, pgType, logicalSwitchId)
    if pgType == "NSX-V"
        header = {'Content-Type': 'application/xml'}
        uri = URI.parse("https://#{nsxmgr}/api/2.0/vdn/virtualwires/#{logicalSwitchId}")
        request = Net::HTTP::Get.new(uri.request_uri, header)
        request.basic_auth(@usernsx, @passnsx)
        response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
          :verify_mode => OpenSSL::SSL::VERIFY_NONE) {|https| https.request(request) }
        checkResponse(response, 200)
        bodyXML = Nokogiri::XML response.body
        lsName = bodyXML.xpath("//virtualWire/name").text
        vni = bodyXML.xpath('//virtualWire/vdnId').text
        vcenter_net_ref = bodyXML.xpath('//virtualWire/vdsContextWithBacking/backingValue').text
        vcenter_dvs_ref = bodyXML.xpath('//virtualWire/vdsContextWithBacking/switch/objectId').text
        # To generate manually logical switch name on vds.    
        # "vxw-#{vcenter_dvs_ref}-#{virtualWireID}-sid-#{vni}-#{lsName}"
        # return vcenter_net_ref, "vxw-#{vcenter_dvs_ref}-#{virtualWireID}-sid-#{vni}-#{lsName}"
        return vcenter_net_ref, vni
    elsif pgType == "Opaque Network"
        header = {'Content-Type': 'application/json'}
        uri = URI.parse("https://#{nsxmgr}/api/v1/logical-switches/#{logicalSwitchId}")
        request = Net::HTTP::Get.new(uri.request_uri, header)
        request.basic_auth(@usernsx, @passnsx)
        response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
          :verify_mode => OpenSSL::SSL::VERIFY_NONE) {|https| https.request(request) }
        checkResponse(response, 200)
        r = JSON.parse(response.body)
        vcenter_net_ref = nil
        return r["vni"]
    else
        raise "Unknown Port Group type #{pg_type}"
    end
end

def createLogicalSwitch(nsxmgr, pgType, vdnscopeID, virtualWire)
    # NSX-V = "Distributed Port Group"
    # NSX-T = "Opaque Network"
    if pgType == "NSX-V"
        header = {'Content-Type': 'application/xml'}
        uri = URI.parse("https://#{nsxmgr}/api/2.0/vdn/scopes/#{vdnscopeID}/virtualwires")
        request = Net::HTTP::Post.new(uri.request_uri, header)
        # virtualWire -> XML for NSX-V
        # virtualWire -> JSON for NSX-T
        request.body = virtualWire
        request.basic_auth(@usernsx, @passnsx)
        response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
          :verify_mode => OpenSSL::SSL::VERIFY_NONE) {|https| https.request(request) }
        checkResponse(response, 201)
        # response.body => 'virtualwire-xx' for NSX-V
        return response.body
    elsif pgType == "Opaque Network"
        header = {'Content-Type': 'application/json'}
        uri = URI.parse("https://#{nsxmgr}/api/v1/logical-switches")
        request = Net::HTTP::Post.new(uri.request_uri, header)
        # virtualWire -> XML for NSX-V
        # virtualWire -> JSON for NSX-T
        request.body = virtualWire
        request.basic_auth(@usernsx, @passnsx)
        response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
          :verify_mode => OpenSSL::SSL::VERIFY_NONE) {|https| https.request(request) }
        checkResponse(response, 201)
        r = JSON.parse(response.body)
        # r.id => logical switch id "d7bba9f7-d65e-488e-95d7-20b25e2b957e"
        return r["id"]
    else
        raise "Unknow pgType #{pgType}"
    end
end

one_vnet = OpenNebula::VirtualNetwork.new_with_id(network_id, OpenNebula::Client.new)
rc = one_vnet.info
if OpenNebula.is_error?(rc)
    STDERR.puts rc.message
    exit 1
end
one_vnet.lock(1)
esx_rollback = [] #Track hosts that require a rollback
managed = one_vnet["TEMPLATE/OPENNEBULA_MANAGED"] != "NO"
imported = one_vnet["TEMPLATE/VCENTER_IMPORTED"]

begin
    # Step 0. Only execute for vcenter network driver && managed by one
    if one_vnet["VN_MAD"] == "vcenter" && managed && imported.nil?
        wait_vlanid(one_vnet) if one_vnet["VLAN_ID_AUTOMATIC"] == '1'
        # Step 1. Extract vnet settings
        host_id =  one_vnet["TEMPLATE/VCENTER_ONE_HOST_ID"]
        raise "We require the ID of the OpenNebula host representing a vCenter cluster" if !host_id

        pnics     =  one_vnet["TEMPLATE/PHYDEV"]
        pg_name   =  one_vnet["TEMPLATE/BRIDGE"]
        pg_type   =  one_vnet["TEMPLATE/VCENTER_PORTGROUP_TYPE"]
        sw_name   =  one_vnet["TEMPLATE/VCENTER_SWITCH_NAME"]
        mtu       =  one_vnet["TEMPLATE/MTU"]
        vlan_id   =  one_vnet["VLAN_ID"] || 0

        # NSX-V parameters
        ls_name = one_vnet["NAME"]
        ls_description = one_vnet["TEMPLATE/DESCRIPTION"]
        vdnscope_id = one_vnet["TEMPLATE/NSX_TZ_ID"]
        vc = one_vnet["TEMPLATE/NSX_VC"]
        @uservc = one_vnet["TEMPLATE/NSX_VCUSER"]
        @passvc = one_vnet["TEMPLATE/NSX_VCPASS"]
        nsxmgr = one_vnet["TEMPLATE/NSX_MANAGER"]
        @usernsx = one_vnet["TEMPLATE/NSX_USER"]
        @passnsx = one_vnet["TEMPLATE/NSX_PASS"]

        if one_vnet["TEMPLATE/VCENTER_SWITCH_NPORTS"]
            nports  =  one_vnet["TEMPLATE/VCENTER_SWITCH_NPORTS"]
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
        blocked  = false
        ccr_ref = one_host["TEMPLATE/VCENTER_CCR_REF"]
        cluster = VCenterDriver::ClusterComputeResource.new_from_ref(ccr_ref, vi_client)
        dc = cluster.get_dc

        ls_vni = nil

        if pg_type == "NSX-V"
            require 'net/http'
            require 'nokogiri'
          
            virtualWireSpec = "<virtualWireCreateSpec>\
                                  <name>#{ls_name}</name>\
                                  <description>#{ls_description}</description>\
                                  <tenantId>virtual wire tenant</tenantId>\
                                  <controlPlaneMode>UNICAST_MODE</controlPlaneMode>\
                                  <guestVlanAllowed>false</guestVlanAllowed>\
                              </virtualWireCreateSpec>"
            pg_name = createLogicalSwitch(nsxmgr, pg_type, vdnscope_id, virtualWireSpec)
            vnet_ref,ls_vni = logicalSwitchData(nsxmgr, pg_type, pg_name)
        end

        if pg_type == "Opaque Network"

            require 'net/http'
            require 'json'

            virtualWireSpec = %{
              {
                "transport_zone_id": "#{vdnscope_id}",
                "replication_mode": "MTEP",
                "admin_state": "UP",
                "display_name": "#{ls_name}",
                "description": "#{ls_description}"
              }
            }
            
            pg_name = createLogicalSwitch(nsxmgr, pg_type, vdnscope_id, virtualWireSpec.to_s)
            # Get NSX_VNI
            ls_vni = logicalSwitchData(nsxmgr, pg_type, pg_name)
            # dc.lock
            sleep 60
            net_folder = dc.network_folder
            net_folder.fetch!
            # Get reference of the created network in vcenter.
            vnet_ref = dc.nsxt_network_created?(pg_name, net_folder)
        end

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
                else
                    blocked = true
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
                    if pg && esx_host.pg_changes_sw?(pg, sw_name)
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
                    else
                        blocked = true
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
                    if dvs
                        pnics_available = nil
                        pnics_available = esx_host.get_available_pnics if pnics && !pnics.empty?
                        esx_host.assign_proxy_switch(dvs, sw_name, pnics, pnics_available)
                    end
                rescue Exception => e
                    raise e
                ensure
                    esx_host.unlock if esx_host
                end
            end
        end


        # We must update XML so the VCENTER_NET_REF and VCENTER_INSTANCE_ID are added

        if blocked
            update_net(one_vnet,"BRIDGE=\"#{pg_name}\"\nNSX_VNI=\"#{ls_vni}\"\nVCENTER_NET_REF=\"#{vnet_ref}\"\nVCENTER_INSTANCE_ID=\"#{vc_uuid}\"\nVCENTER_NET_STATE=\"ERROR\"\nVCENTER_NET_ERROR=\"vnet already exist in vcenter\"\n")
        else
            update_net(one_vnet,"BRIDGE=\"#{pg_name}\"\nNSX_VNI=\"#{ls_vni}\"\nVCENTER_NET_REF=\"#{vnet_ref}\"\nVCENTER_INSTANCE_ID=\"#{vc_uuid}\"\nVCENTER_NET_STATE=\"READY\"\nVCENTER_NET_ERROR=\"\"\n")
        end

        # Assign vnet to OpenNebula cluster
        cluster_id = one_host["CLUSTER_ID"]
        if cluster_id
            one_cluster = VCenterDriver::VIHelper.one_item(OpenNebula::Cluster, cluster_id, false)
            if OpenNebula.is_error?(one_cluster)
                STDOUT.puts "Error retrieving cluster #{cluster_id}: #{rc.message}. You may have to place this vnet in the right cluster by hand"
            end

            one_vnet.unlock

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

            one_vnet.lock(1)
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

    update_net(one_vnet, "VCENTER_NET_STATE=\"ERROR\"\nVCENTER_NET_ERROR=\"#{e.message}\"\n")

    exit -1
ensure
    one_vnet.unlock
    vi_client.close_connection if vi_client
end
