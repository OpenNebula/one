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

require 'digest'

module VCenterDriver

class NetworkFolder
    attr_accessor :item, :items

    def initialize(item)
        @item = item
        @items = {}
    end

    ########################################################################
    # Builds a hash with Network-Ref / Network to be used as a cache
    # @return [Hash] in the form
    #   { ds_ref [Symbol] => Network object }
    ########################################################################
    def fetch!
        VIClient.get_entities(@item, "Network").each do |item|
            item_name = item._ref
            @items[item_name.to_sym] = PortGroup.new(item)
        end

        VIClient.get_entities(@item, "DistributedVirtualPortgroup").each do |item|
            item_name = item._ref
            @items[item_name.to_sym] = DistributedPortGroup.new(item)
        end

        VIClient.get_entities(@item, "VmwareDistributedVirtualSwitch").each do |item|
            item_name = item._ref
            @items[item_name.to_sym] = DistributedVirtualSwitch.new(item)
        end

        VIClient.get_entities(@item, "OpaqueNetwork").each do |item|
            item_name = item._ref
            @items[item_name.to_sym] = OpaqueNetwork.new(item)
        end
    end

    

    ########################################################################
    # Returns a Network. Uses the cache if available.
    # @param ref [Symbol] the vcenter ref
    # @return Network
    ########################################################################
    def get(ref)
        if !@items[ref.to_sym]
            rbvmomi_net = RbVmomi::VIM::Network.new(@item._connection, ref)
            @items[ref.to_sym] = Network.new(rbvmomi_net)
        end

        @items[ref.to_sym]
    end
end # class NetworkFolder

class Network
    attr_accessor :item

    include Memoize

    NETWORK_TYPE_PG = "Port Group"
    NETWORK_TYPE_DPG = "Distributed Port Group"
    NETWORK_TYPE_NSXV = "NSX-V" #"Virtual Wire"
    NETWORK_TYPE_NSXT = "Opaque Network"
    NETWORK_TYPE_UNKNOWN = "Unknown Network"

    def initialize(item, vi_client=nil)
        begin
            check_item(item, RbVmomi::VIM::Network)
        rescue
            check_item(item, RbVmomi::VIM::DistributedVirtualPortgroup)
        end

        @vi_client = vi_client
        @item = item
    end

    #  Checks if a RbVmomi::VIM::VirtualDevice is a network interface
    def self.is_nic?(device)
        !device.class.ancestors.index(RbVmomi::VIM::VirtualEthernetCard).nil?
    end

    def self.vlanid(vid)
        case vid
        when -1
            "error"
        when 0
            "disabled"
        when 4095
            "VGT"
        else
            "#{vid}"
        end
    end

    def self.retrieve_vlanid(network)
        begin
            name = network.name
            id = network.host.first.configManager.networkSystem.networkConfig.portgroup.select{|p|
                p.spec.name == name
            }.first.spec.vlanId
        rescue
            id = -1
        end
        return id
    end


    def self.generate_name(name, opts = {})
        vcenter_instance_name = opts[:vcenter_name] || nil
        dc_name               = opts[:dc_name] || nil

        hash_name = "#{name} - [#{vcenter_instance_name} - #{dc_name}]"
        sha256 = Digest::SHA256.new
        network_hash = sha256.hexdigest(hash_name)[0..11]
        network_import_name = "#{name} - [#{vcenter_instance_name} - #{dc_name}]_#{network_hash}"
    end

    def self.to_one_template(opts = {})

        one_tmp = {}
        network_name          = opts[:network_name]
        network_ref           = opts[:network_ref]
        network_type          = opts[:network_type]

        vcenter_uuid          = opts[:vcenter_uuid]
        vcenter_instance_name = opts[:vcenter_instance_name]
        dc_name               = opts[:dc_name]
        cluster_id            = opts[:cluster_id]

        unmanaged             = opts[:unmanaged] || nil
        template_ref          = opts[:template_ref] || nil
        dc_ref                = opts[:dc_ref] || nil
        template_id           = opts[:template_id] || nil

        bridge_name = network_name
        network_name = network_name.gsub("/","_")


        network_import_name = VCenterDriver::VIHelper.one_name(OpenNebula::VirtualNetworkPool, network_name, network_ref+vcenter_uuid)

        one_tmp[:name]             = bridge_name
        one_tmp[:import_name]      = network_import_name
        one_tmp[:bridge]           = bridge_name
        one_tmp[:type]             = network_type
        one_tmp[:one_cluster_id]   = cluster_id
        one_tmp[:ref]  = network_ref

        one_tmp[:one] = to_one(network_import_name, bridge_name, network_ref, network_type,
                               vcenter_uuid, unmanaged, template_ref, dc_ref, template_id)
        return one_tmp
    end

    def self.to_one(network_import_name, network_name, network_ref, network_type,
                    vcenter_uuid, unmanaged, template_ref, dc_ref, template_id)

        template = "NAME=\"#{network_import_name}\"\n"\
                   "BRIDGE=\"#{network_name}\"\n"\
                   "VN_MAD=\"vcenter\"\n"\
                   "VCENTER_PORTGROUP_TYPE=\"#{network_type}\"\n"\
                   "VCENTER_NET_REF=\"#{network_ref}\"\n"\
                   "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"\
                   "VCENTER_IMPORTED=\"YES\"\n"

        if unmanaged == "wild"
            template += "VCENTER_FROM_WILD=\"#{template_id}\"\n"
        end

        template += "VCENTER_TEMPLATE_REF=\"#{template_ref}\"\n" if template_ref

        return template
    end

    REQUIRED_ATTRS = [:refs, :one_ids, :one_object]
    def self.create_one_network(net_config)

        # mandatory parameters:
        REQUIRED_ATTRS.each do |attr|
            raise "#{attr} required for importing nics operation!" if net_config[attr].nil?
        end

        one_vn = VCenterDriver::VIHelper.new_one_item(OpenNebula::VirtualNetwork)

        done = []
        for i in 0..net_config[:refs].size-1
            cl_id = net_config[:one_ids][i]
            next if cl_id == -1 || done.include?(cl_id)

            if done.empty?
                rc = one_vn.allocate(net_config[:one_object],cl_id.to_i)
                VCenterDriver::VIHelper.check_error(rc, "create network")
                one_vn.info
            else
                one_cluster = VCenterDriver::VIHelper.one_item(OpenNebula::Cluster, cl_id, false)
                rc = one_cluster.addvnet(one_vn['ID'].to_i)
                VCenterDriver::VIHelper.check_error(rc,"addvnet to cluster")
            end
            done << cl_id
        end

        one_vn
    end

    def self.get_network_type(network)
        netString = network.class.to_s
        case netString
        when "DistributedVirtualPortgroup"
            return VCenterDriver::Network::NETWORK_TYPE_DPG
        when "OpaqueNetwork"
            return VCenterDriver::Network::NETWORK_TYPE_NSXT
        when "Network"
            return VCenterDriver::Network::NETWORK_TYPE_PG

        else 
            return "Network not defined"
        end
    end

    def self.remove_net_ref(network_id)
        one_vnet = VCenterDriver::VIHelper.one_item(OpenNebula::VirtualNetwork, network_id)
        one_vnet.info
        one_vnet.delete_element("TEMPLATE/VCENTER_NET_REF")
        one_vnet.delete_element("TEMPLATE/VCENTER_INSTANCE_ID")
        tmp_str = one_vnet.template_str
        one_vnet.update(tmp_str)
        one_vnet.info
    end

    # This is never cached
    def self.new_from_ref(ref, vi_client)
        self.new(RbVmomi::VIM::Network.new(vi_client.vim, ref), vi_client)
    end

end # class Network

class PortGroup < Network

    def initialize(item, vi_client=nil)

        check_item(item, RbVmomi::VIM::Network)

        @vi_client = vi_client
        @item = item
    end

    def clusters
        net_clusters = {}
        host_members =@item['host']
        host_members.each do |h|
            if !net_clusters.key?(h.parent._ref.to_s)
               net_clusters[h.parent._ref.to_s] = h.parent.name.to_s
            end
        end
        net_clusters
    end

    def network_type
        VCenterDriver::Network::NETWORK_TYPE_PG
    end
end # class PortGroup

class DistributedPortGroup < Network

    def initialize(item, vi_client=nil)

        check_item(item, RbVmomi::VIM::DistributedVirtualPortgroup)

        @vi_client = vi_client
        @item = item
    end

    def clusters
        net_clusters = {}
        # should have to work
        # host_members =@item['host']
        host_members = self['config.distributedVirtualSwitch.summary.hostMember']
        host_members.each do |h|
            if !net_clusters.key?(h.parent._ref.to_s)
               net_clusters[h.parent._ref.to_s] = h.parent.name.to_s
            end
        end
        net_clusters
    end

    def network_type
        VCenterDriver::Network::NETWORK_TYPE_DPG
    end
end # class DistributedPortGroup

class OpaqueNetwork < Network

    def initialize(item, vi_client=nil)

        check_item(item, RbVmomi::VIM::OpaqueNetwork)

        @vi_client = vi_client
        @item = item
    end

    def clusters
        net_clusters = {}
        host_members =@item['host']
        host_members.each do |h|
            if !net_clusters.key?(h.parent._ref.to_s)
              net_clusters[h.parent._ref.to_s] = h.parent.name.to_s
            end
        end
        net_clusters
    end

    def network_type
        VCenterDriver::Network::NETWORK_TYPE_NSXT
    end
end # class OpaqueNetwork

class DistributedVirtualSwitch < Network

    def initialize(item, vi_client=nil)

        check_item(item, RbVmomi::VIM::VmwareDistributedVirtualSwitch)

        @vi_client = vi_client
        @item = item
    end
end # class DistributedVirtualSwitch

class NetImporter < VCenterDriver::VcImporter

    def initialize(one_client, vi_client)
        super(one_client, vi_client)
        @one_class = OpenNebula::VirtualNetwork
        @defaults = { size: "255", type: "ether" }
    end

    def get_list(args = {})
	    dc_folder = VCenterDriver::DatacenterFolder.new(@vi_client)

        # OpenNebula's VirtualNetworkPool
        npool = VCenterDriver::VIHelper.one_pool(OpenNebula::VirtualNetworkPool, false)
        if npool.respond_to?(:message)
            raise "Could not get OpenNebula VirtualNetworkPool: #{npool.message}"
        end

        # Get OpenNebula's host pool
        hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool, false)
        if hpool.respond_to?(:message)
            raise "Could not get OpenNebula HostPool: #{hpool.message}"
        end

        rs = dc_folder.get_unimported_networks(npool, @vi_client.vc_name,hpool)
		@list = rs
    end

    def add_cluster(cid, eid)
        one_cluster = @info[:clusters][cid]
        raise "no cluster defined" unless one_cluster

        rc = one_cluster.addvnet(eid)
    end

    def remove_default(id)
        cid = 0
        @info[:clusters][cid] ||= VCenterDriver::VIHelper.one_item(OpenNebula::Cluster, cid.to_s, false)
        @info[:clusters][cid].delvnet(id.to_i)
    end

    def build_ar(opts)
        str =  "\nAR=[TYPE=\""
        type = opts[:type].downcase

        case type
        when "4", "ip4", "ip"
        	str << "IP4\""
            opts[:ip] = "192.168.1.1" if opts[:ip].empty?
            str << ",IP=\"#{opts[:ip]}\""
        when 'ip6'
            str << "IP6\""
            str << ",GLOBAL_PREFIX=\"#{opts[:global_prefix]}\"" if opts[:global_prefix]
            str << ",ULA_PREFIX=\"#{opts[:ula_prefix]}\""       if opts[:ula_prefix]
        when 'ether', 'e'
            str << "ETHER\""
        when 'ip6_static'
            str << "IP6_STATIC\""
            str << ",IP6=\"#{opts[:ip6]}\"" if opts[:ip6]
            str << ",PREFIX_LENGTH=\"#{opts[:prefix_length]}\"" if opts[:prefix_length]
        end

        str << ",MAC=\"#{opts[:mac]}\"" if opts[:mac]
        str << ",SIZE = \"#{opts[:size]}\"]"

        return str
    end

    def import(selected)
        opts = @info[selected[:ref]][:opts]

        net = VCenterDriver::Network.new_from_ref(selected[:ref], @vi_client)
        vid = VCenterDriver::Network.retrieve_vlanid(net.item) if net

        # If type is NSX we need to update values
        if selected[:type] == VCenterDriver::Network::NETWORK_TYPE_NSXV
            host_id = @vi_client.instance_variable_get '@host_id'
            nsx_client = NSXDriver::NSXClient.new_from_id(host_id)
            nsx_net = NSXDriver::VirtualWire
                      .new_from_name(nsx_client, selected[:name])
            selected[:one] << "NSX_ID=\"#{nsx_net.ls_id}\"\n"
            selected[:one] << "NSX_VNI=\"#{nsx_net.ls_vni}\"\n"
            selected[:one] << "NSX_TZ_ID=\"#{nsx_net.tz_id}\"\n"
        end

        if selected[:type] == VCenterDriver::Network::NETWORK_TYPE_NSXT
            host_id = @vi_client.instance_variable_get '@host_id'
            nsx_client = NSXDriver::NSXClient.new_from_id(host_id)
            nsx_net = NSXDriver::OpaqueNetwork
                      .new_from_name(nsx_client, selected[:name])
            selected[:one] << "NSX_ID=\"#{nsx_net.ls_id}\"\n"
            selected[:one] << "NSX_VNI=\"#{nsx_net.ls_vni}\"\n"
            selected[:one] << "NSX_TZ_ID=\"#{nsx_net.tz_id}\"\n"
        end

        if vid
            vlanid = VCenterDriver::Network.vlanid(vid)

            # we have vlan id
            if /\A\d+\z/.match(vlanid)
                selected[:one] << "VCENTER_VLAN_ID=\"#{vlanid}\"\n"
            end
        end

        selected[:one] << build_ar(opts)
        selected[:clusters][:one_ids] = opts["selected_clusters"].each.map(&:to_i) if opts["selected_clusters"]

        res = {id: [], name: selected[:name]}
        create(selected[:one]) do |one_object, id|
            res[:id] << id
            add_clusters(id, selected[:clusters][:one_ids])
        end

        return res
    end
end
end # module VCenterDriver
