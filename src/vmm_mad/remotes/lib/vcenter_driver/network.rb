module VCenterDriver
require 'digest'
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

    def initialize(item, vi_client=nil)
        if !item.instance_of?(RbVmomi::VIM::Network)  &&
           !item.instance_of?(RbVmomi::VIM::DistributedVirtualPortgroup )
            raise "Expecting type 'RbVmomi::VIM::Network'. " <<
                  "Got '#{item.class} instead."
        end

        @vi_client = vi_client
        @item = item
    end

    #  Checks if a RbVmomi::VIM::VirtualDevice is a network interface
    def self.is_nic?(device)
        !device.class.ancestors.index(RbVmomi::VIM::VirtualEthernetCard).nil?
    end



    def self.to_one_template(network_name, network_ref, network_type,
                             ccr_ref, ccr_name, vcenter_uuid,
                             vcenter_instance_name, dc_name, cluster_id,
                             cluster_location,
                             unmanaged=nil, template_ref=nil, dc_ref=nil,
                             vm_or_template_name=nil, template_id=nil)

        one_tmp = {}

        if unmanaged
            if unmanaged == "wild"
                network_import_name = "#{network_name} [VM #{vm_or_template_name}]"
            end

            if unmanaged == "template"
                network_import_name = "#{network_name} [#{vm_or_template_name} - Template #{template_id}]"
            end
        else
            full_name = "#{network_name} - #{ccr_name.tr(" ", "_")} [#{vcenter_instance_name} - #{dc_name}]_#{cluster_location}"
            sha256 = Digest::SHA256.new
            network_hash = sha256.hexdigest(full_name)[0..11]
            network_import_name = "#{network_name} - #{ccr_name.tr(" ", "_")} [#{vcenter_instance_name} - #{dc_name}]_#{network_hash}"
        end
        one_tmp[:name] = network_name
        one_tmp[:import_name] = network_import_name
        one_tmp[:bridge] = network_name
        one_tmp[:type] = network_type
        one_tmp[:cluster] = ccr_name
        one_tmp[:cluster_location] = cluster_location
        one_tmp[:vcenter_ccr_ref] = ccr_ref
        one_tmp[:one_cluster_id] = cluster_id
        one_tmp[:one] = to_one(network_import_name, network_name, network_ref, network_type,
                             ccr_ref, vcenter_uuid, unmanaged, template_ref, dc_ref)
        return one_tmp
    end

    def self.to_one(network_import_name, network_name, network_ref, network_type,
                    ccr_ref, vcenter_uuid, unmanaged, template_ref, dc_ref)

        template = "NAME=\"#{network_import_name}\"\n"\
                   "BRIDGE=\"#{network_name}\"\n"\
                   "VN_MAD=\"dummy\"\n"\
                   "VCENTER_PORTGROUP_TYPE=\"#{network_type}\"\n"\
                   "VCENTER_NET_REF=\"#{network_ref}\"\n"\
                   "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"

        template += "VCENTER_CCR_REF=\"#{ccr_ref}\"\n" if !unmanaged

        template += "OPENNEBULA_MANAGED=\"NO\"\n" if unmanaged
        template += "VCENTER_TEMPLATE_REF=\"#{template_ref}\"\n" if template_ref

        return template
    end

    def self.get_network_type(device)
        if device.backing.network.instance_of?(RbVmomi::VIM::DistributedVirtualPortgroup)
            return "Distributed Port Group"
        else
            return "Port Group"
        end
    end

    def self.get_unmanaged_vnet_by_ref(ref, template_ref, vcenter_uuid, pool = nil)
        if pool.nil?
            pool = VCenterDriver::VIHelper.one_pool(OpenNebula::VirtualNetworkPool, false)
            if pool.respond_to?(:message)
                raise "Could not get OpenNebula VirtualNetworkPool: #{pool.message}"
            end
        end
        element = pool.select do |e|
            e["TEMPLATE/VCENTER_NET_REF"]     == ref &&
            e["TEMPLATE/VCENTER_INSTANCE_ID"] == vcenter_uuid &&
            e["TEMPLATE/VCENTER_TEMPLATE_REF"] == template_ref &&
            e["TEMPLATE/OPENNEBULA_MANAGED"] == "NO"
        end.first rescue nil

        return element
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

    def self.get_unmanaged_vnet_by_ref(ref, template_ref, vcenter_uuid, pool = nil)
        if pool.nil?
            pool = VCenterDriver::VIHelper.one_pool(OpenNebula::VirtualNetworkPool, false)
            if pool.respond_to?(:message)
                raise "Could not get OpenNebula VirtualNetworkPool: #{pool.message}"
            end
        end
        element = pool.select do |e|
            e["TEMPLATE/VCENTER_NET_REF"]     == ref &&
            e["TEMPLATE/VCENTER_INSTANCE_ID"] == vcenter_uuid &&
            e["TEMPLATE/VCENTER_TEMPLATE_REF"] == template_ref &&
            e["TEMPLATE/OPENNEBULA_MANAGED"] == "NO"
        end.first rescue nil

        return element
    end

    # This is never cached
    def self.new_from_ref(ref, vi_client)
        self.new(RbVmomi::VIM::Network.new(vi_client.vim, ref), vi_client)
    end

end # class Network

class PortGroup < Network

    def initialize(item, vi_client=nil)
        if !item.instance_of?(RbVmomi::VIM::Network)
            raise "Expecting type 'RbVmomi::VIM::Network'. " <<
                  "Got '#{item.class} instead."
        end

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
        "Port Group"
    end
end # class PortGroup

class DistributedPortGroup < Network

    def initialize(item, vi_client=nil)
        if !item.instance_of?(RbVmomi::VIM::DistributedVirtualPortgroup )
           raise "Expecting type 'RbVmomi::VIM::DistributedVirtualPortgroup'. " <<
                  "Got '#{item.class} instead."
        end

        @vi_client = vi_client
        @item = item
    end

    def clusters
        net_clusters = {}
        host_members = self['config.distributedVirtualSwitch.summary.hostMember']
        host_members.each do |h|
            if !net_clusters.key?(h.parent._ref.to_s)
               net_clusters[h.parent._ref.to_s] = h.parent.name.to_s
            end
        end
        net_clusters
    end

    def network_type
        "Distributed Port Group"
    end
end # class DistributedPortGroup

class DistributedVirtualSwitch < Network

    def initialize(item, vi_client=nil)
        if !item.instance_of?(RbVmomi::VIM::VmwareDistributedVirtualSwitch )
           raise "Expecting type 'RbVmomi::VIM::VmwareDistributedVirtualSwitch'. " <<
                  "Got '#{item.class} instead."
        end

        @vi_client = vi_client
        @item = item
    end
end # class DistributedVirtualSwitch

end # module VCenterDriver

