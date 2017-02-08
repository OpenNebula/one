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
            @items[item_name.to_sym] = Network.new(item)
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

    def initialize(item)
        if !item.instance_of? RbVmomi::VIM::Network
            raise "Expecting type 'RbVmomi::VIM::Network'. " <<
                  "Got '#{item.class} instead."
        end

        @item = item
    end

    # This is never cached
    def self.new_from_ref(vi_client, ref)
        self.new(RbVmomi::VIM::Network.new(vi_client.vim, ref))
    end
end # class Network

end # module VCenterDriver

