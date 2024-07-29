#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

class VirtualNetworkXML
    # Public attributes
    attr_reader :imported, :pgtype

    #-----------------------------------------------------------------------
    # Class attributes
    #   - @vnet_xml [REXML] of the vnet
    #   - @oneclient [OpenNebula::Client] to use oned API
    #   - @clusters [Array] of vCenter clusters with following hash
    #     :cli  VIClient object for the vCenter
    #     :ccr  Cluster resource
    #     :dc   Datacenter for the cluster
    #     :uuid vCenter instance uuid
    #-----------------------------------------------------------------------
    def initialize(xml64)
        @oneclient = OpenNebula::Client.new

        vnet_raw  = Base64.decode64(xml64)
        @vnet_xml = REXML::Document.new(vnet_raw).root

        raise "Error parsing XML document: #{vnet_raw}" unless @vnet_xml

        @debug    = VCenterDriver::CONFIG[:debug_information]
        @pgtype   = self['TEMPLATE/VCENTER_PORTGROUP_TYPE']
        @imported = self['TEMPLATE/VCENTER_IMPORTED'].casecmp('yes') == 0

        return if @imported

        #-----------------------------------------------------------------------
        # Initialize Clusters
        #-----------------------------------------------------------------------
        @clusters = []
        vc_ids    = []

        # TODO NSX?
        self.each('CLUSTERS/ID') do |cid|
            cxml    = OpenNebula::Cluster.build_xml(cid)
            cluster = OpenNebula::Cluster.new(cxml, @oneclient)

            rc = cluster.info
            next if OpenNebula.is_error?(rc)

            hid  = cluster.host_ids[0]
            next unless hid
            hxml = OpenNebula::Host.build_xml(hid)

            host = OpenNebula::Host.new(hxml, @oneclient)

            rc = host.info
            next if OpenNebula.is_error?(rc)

            ref = host['TEMPLATE/VCENTER_CCR_REF']
            cli = VCenterDriver::VIClient.new_from_host(hid)
            ccr = VCenterDriver::ClusterComputeResource.new_from_ref(ref, cli)

            @clusters << {
                :hid  => hid,
                :cli  => cli,
                :ccr  => ccr,
                :dc   => ccr.datacenter,
                :uuid => cli.vim.serviceContent.about.instanceUuid
            }

            vc_ids << host['TEMPLATE/VCENTER_INSTANCE_ID']
        end

        raise "Clusters for VNET don't include any Host" if @clusters.empty?

        raise "Multiple vCenter on VNET Clusters" unless vc_ids.uniq.length == 1
    end

    #---------------------------------------------------------------------------
    # XML helpers
    #---------------------------------------------------------------------------
    def [](xpath)
        e = @vnet_xml.elements["#{xpath}"]
        e.text.strip
    rescue StandardError
        ""
    end

    def each(xpath, &block)
        @vnet_xml.elements.each("#{xpath}") { |elem|
            txt = elem.text
            block.call(txt.strip) if txt && !txt.empty?
        }
    end

    #---------------------------------------------------------------------------
    # Methods to create port groups
    #---------------------------------------------------------------------------

    # Creates a port group in each ESX  raises exceptions with
    # error description
    # @return String with the parameters to add to the OpenNebula VNET
    def create_pg
        #-----------------------------------------------------------------------
        # Get parameters needed to create the network
        #-----------------------------------------------------------------------
        vlan_id = self['VLAN_ID'] || "0"
        pg_name = self['BRIDGE']
        pnics   = self['TEMPLATE/PHYDEV']
        sw_name = self['TEMPLATE/VCENTER_SWITCH_NAME']
        mtu     = self['TEMPLATE/MTU']
        nports  = self['TEMPLATE/VCENTER_SWITCH_NPORTS']

        nports  = 128 if nports.empty?
        mtu     = nil if mtu.empty?
        pnics   = nil if pnics.empty?

        esxs   = []
        newpgs = []
        errors = []

        #-----------------------------------------------------------------------
        # Initialize a ESX references for all ESX in all Clusters
        #-----------------------------------------------------------------------
        @clusters.each do |cluster|
            cli = cluster[:cli]

            cluster[:ccr]['host'].each do |host|
                esxs << VCenterDriver::ESXHost.new_from_ref(host._ref, cli)
            end
        end

        #-----------------------------------------------------------------------
        # Check PG does not exists and create it on all ESX hosts
        #-----------------------------------------------------------------------
        esxs.each do |esx|
            pg =  esx.pg_exists(pg_name)
            raise "Port Group #{pg_name} already exists" if pg
        end

        esxs.each do |esx|
            begin
                apnic = nil
                apnic = esx.available_pnics if pnics

                vs = esx.vss_exists(sw_name)

                esx.create_vss(sw_name, nports, pnics, mtu, apnic) unless vs

                newpgs << esx.create_pg(pg_name, sw_name, vlan_id)
            rescue StandardError => e
                msg = "\tHost #{esx['name']}. Reason: \"#{e.message}\".\n"
                msg << "#{e.backtrace}\n" if @debug

                errors << msg
            end
        end

        #-----------------------------------------------------------------------
        # Sanity Check all new_pg references should be the same
        # Rollback PG creation in case of any error
        #-----------------------------------------------------------------------
        unless errors.empty?
            message = "Error adding port group to hosts:\n"
            message << errors.join

            esxs.each do |esx|
                begin
                    esx.network_rollback
                rescue StandardError => e
                    message << "Error in rollback for #{esx['name']}: #{e.message}\n"
                end
            end

            raise message
        end

        raise "Different PG refs!:\n#{newpgs}" if newpgs.uniq.length != 1

        "VCENTER_NET_REF     = \"#{newpgs[0]}\"\n"\
        "VCENTER_INSTANCE_ID = \"#{@clusters[0][:uuid]}\"\n"
    end

    # Deletes a port group in each ESX
    def delete_pg
        pg_name = self['BRIDGE']
        sw_name = self['TEMPLATE/VCENTER_SWITCH_NAME']

        raise "Missing BRIDGE from VNET template" if pg_name.empty?
        raise "Missing VCENTER_SWTICH_NAME from VNET template" if sw_name.empty?

        errors = []

        #-----------------------------------------------------------------------
        # Iterate over all clusters and hosts to remove PG
        #-----------------------------------------------------------------------
        @clusters.each do |cluster|
            cli = cluster[:cli]

            cluster[:ccr]['host'].each do |host|
                begin
                    esx = VCenterDriver::ESXHost.new_from_ref(host._ref, cli)

                    next unless esx.pg_exists(pg_name)

                    sw = esx.remove_pg(pg_name)

                    next if !sw || sw_name != sw

                    vswitch = esx.vss_exists(sw_name)
                    next unless vswitch

                    # Remove switch if the port group being removed is the last one
                    esx.remove_vss(sw_name) if vswitch.portgroup.empty?

                rescue StandardError => e
                    msg = "\tHost #{esx._ref}. Reason: \"#{e.message}\".\n"
                    msg << "#{e.backtrace}\n" if @debug

                    errors << msg
                end
            end
        end

        #-----------------------------------------------------------------------
        # Notify error on PG removal error
        #-----------------------------------------------------------------------
        unless errors.empty?
            message = "Error deleting port group from hosts:\n"
            message << errors.join

            raise message
        end
    end

    # Creates a distributed port group in a datacenter raises exceptions with
    # error description
    # @return String with the parameters to add to the OpenNebula VNET
    def create_dpg
        #-----------------------------------------------------------------------
        # Get parameters needed to create the network
        #-----------------------------------------------------------------------
        vlan_id = self['VLAN_ID'] || "0"
        pg_name = self['BRIDGE']
        pnics   = self['TEMPLATE/PHYDEV']
        sw_name = self['TEMPLATE/VCENTER_SWITCH_NAME']
        mtu     = self['TEMPLATE/MTU']
        nports  = self['TEMPLATE/VCENTER_SWITCH_NPORTS']

        nports  = 128 if nports.empty?
        mtu     = nil if mtu.empty?
        pnics   = nil if pnics.empty?

        #-----------------------------------------------------------------------
        # Use first cluster/dc to check the distributed portgroup
        #-----------------------------------------------------------------------
        dc = @clusters[0][:dc]

        raise "vCenter Dataceter not initialized" unless dc

        net_folder = dc.network_folder
        net_folder.fetch!

        dpg = dc.dpg_exists(pg_name, net_folder)

        # Disallow changes of switch name for existing pg
        raise "Port group #{pg_name} already exists" if dpg

        # Get distributed virtual switch if it exists
        dvs = dc.dvs_exists(sw_name, net_folder)
        dvs = dc.create_dvs(sw_name, pnics, mtu) unless dvs

        raise "Cannot create Distributed Virtual Switch" unless dvs

        # Creates distributed port group
        # TODO raise?
        new_dpg = dc.create_dpg(dvs, pg_name, vlan_id, nports)

        #-----------------------------------------------------------------------
        # Attach dpg to esxi hosts for each cluster
        #-----------------------------------------------------------------------
        errors  = []

        @clusters.each do |cluster|
            cli = cluster[:cli]

            cluster[:ccr]['host'].each do |host|
                begin
                    esx  = VCenterDriver::ESXHost.new_from_ref(host._ref, cli)

                    avail_pnics = nil
                    avail_pnics = esx.available_pnics if pnics

                    esx.assign_proxy_switch(dvs, sw_name, pnics, avail_pnics)
                rescue StandardError => e
                    msg = "\tHost #{host._ref}. Reason: \"#{e.message}\".\n"
                    msg << "#{e.backtrace}\n" if @debug

                    errors << msg
                end
            end
        end

        #-----------------------------------------------------------------------
        # Rollback DPG creation in case of any error
        #-----------------------------------------------------------------------
        unless errors.empty?
            message = "Error adding distributed port group to hosts:\n"
            message << errors.join

            dc.network_rollback

            raise message
        end

        "VCENTER_NET_REF     = \"#{new_dpg}\"\n"\
        "VCENTER_INSTANCE_ID = \"#{@clusters[0][:uuid]}\"\n"
    end

    def delete_dpg
        pg_name = self['BRIDGE']
        sw_name = self['TEMPLATE/VCENTER_SWITCH_NAME']

        raise "Missing BRIDGE from VNET template" if pg_name.empty?
        raise "Missing VCENTER_SWTICH_NAME from VNET template" if sw_name.empty?

        @clusters.each do |cluster|
            dc  = cluster[:dc]

            # Explore network folder in search of dpg and dvs
            net_folder = dc.network_folder
            net_folder.fetch!

            # Get distributed port group and dvs if they exists
            dvs = dc.dvs_exists(sw_name, net_folder)
            dpg = dc.dpg_exists(pg_name, net_folder)
            dc.remove_dpg(dpg) if dpg

            if dvs && dvs.item.summary.portgroupName.size == 1 &&
                dvs.item.summary.portgroupName[0] == "#{sw_name}-uplink-pg"
                dc.remove_dvs(dvs)
            end
        end
    end

    # Creates a distributed port group in a datacenter raises exceptions with
    # error description
    # @return String with the parameters to add to the OpenNebula VNET
    def create_nsxv
        #-----------------------------------------------------------------------
        # Get NSX parameters needed to create the network
        #-----------------------------------------------------------------------
        ls_name        = self['NAME']
        ls_description = self['TEMPLATE/DESCRIPTION']
        tz_id          = self['TEMPLATE/NSX_TZ_ID']
        rep_mode       = self['TEMPLATE/NSX_REP_MODE']

        #-----------------------------------------------------------------------
        # Use first cluster/dc to create the virtual wire
        #-----------------------------------------------------------------------
        host_id = @cluster[0][:hid]
        uuid    = @cluster[0][:uuid]

        nsx_client = NSXDriver::NSXClient.new_from_id(host_id)

        vwire_spec =
            "<virtualWireCreateSpec>\
                <name>#{ls_name}</name>\
                <description>#{ls_description}</description>\
                <tenantId>virtual wire tenant</tenantId>\
                <controlPlaneMode>#{rep_mode}</controlPlaneMode>\
                <guestVlanAllowed>false</guestVlanAllowed>\
            </virtualWireCreateSpec>"

        lsw = NSXDriver::VirtualWire.new(nsx_client, nil, tz_id, vwire_spec)

        "VCENTER_NET_REF      = '#{lsw.ls_vcenter_ref}'\n"\
        "VCENTER_INSTANCE_ID  = '#{uuid}'\n"\
        "NSX_ID               = '#{lsw.ls_id}'\n"\
        "NSX_VNI              = '#{lsw.ls_vni}'\n"\
        "BRIDGE               = '#{lsw.ls_name}'\n"
    end

    def delete_nsxv
        host_id = @cluster[0][:hid]
        ls_id   = self['TEMPLATE/NSX_ID']

        raise "Missing NSX_ID attribute in the virtual network" unless ls_id

        nsx_client = NSXDriver::NSXClient.new_from_id(host_id)

        lswitch = NSXDriver::VirtualWire.new(nsx_client, ls_id, nil, nil)
        lswitch.delete_logical_switch
    end

    # Creates a distributed port group in a datacenter raises exceptions with
    # error description
    # @return String with the parameters to add to the OpenNebula VNET
    def create_nsxt
        #-----------------------------------------------------------------------
        # Get NSX parameters needed to create the network
        #-----------------------------------------------------------------------
        ls_name        = self['NAME']
        ls_description = self['TEMPLATE/DESCRIPTION']
        tz_id          = self['TEMPLATE/NSX_TZ_ID']
        rep_mode       = self['TEMPLATE/NSX_REP_MODE']
        admin_status   = self['TEMPLATE/NSX_ADMIN_STATUS']

        #-----------------------------------------------------------------------
        # Use first cluster/dc to create the virtual wire
        #-----------------------------------------------------------------------
        host_id = @cluster[0][:hid]
        uuid    = @cluster[0][:uuid]
        dc      = @cluster[0][:dc]

        nsx_client = NSXDriver::NSXClient.new_from_id(host_id)

        opaque_spec = %(
            {
                "transport_zone_id": "#{tz_id}",
                "replication_mode": "#{rep_mode}",
                "admin_state": "#{admin_status}",
                "display_name": "#{ls_name}",
                "description": "#{ls_description}"
            }
        )

        lsw = NSXDriver::OpaqueNetwork.new(nsx_client, nil, tz_id, opaque_spec)

        vnet_ref = dc.nsx_network(lsw.ls_id,
                                  VCenterDriver::Network::NETWORK_TYPE_NSXT)

        "VCENTER_NET_REF     = '#{vnet_ref}'\n"\
        "VCENTER_INSTANCE_ID = '#{uuid}'\n"\
        "NSX_ID              = '#{lsw.ls_id}'\n"\
        "NSX_VNI             = '#{lsw.ls_vni}'\n"\
        "BRIDGE              = '#{lsw.ls_name}'\n"
    end

    def delete_nsxt
        host_id = @cluster[0][:hid]
        ls_id   = self['TEMPLATE/NSX_ID']

        raise "Missing NSX_ID attribute in the virtual network" unless ls_id

        nsx_client = NSXDriver::NSXClient.new_from_id(host_id)

        lswitch = NSXDriver::OpaqueNetwork.new( nsx_client, ls_id, nil, nil)
        lswitch.delete_logical_switch
    end
end
