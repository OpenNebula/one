module VCenterDriver

class DatacenterFolder
    attr_accessor :items

    def initialize(vi_client)
        @vi_client = vi_client
        @items = {}
    end

    ########################################################################
    # Builds a hash with Datacenter-Ref / Datacenter to be used as a cache
    # @return [Hash] in the form
    #   { dc_ref [Symbol] => Datacenter object }
    ########################################################################
    def fetch!
        VIClient.get_entities(@vi_client.vim.root, "Datacenter").each do |item|
            item_name = item._ref
            @items[item_name.to_sym] = Datacenter.new(item)
        end
    end

    ########################################################################
    # Returns a Datacenter. Uses the cache if available.
    # @param ref [Symbol] the vcenter ref
    # @return Datacenter
    ########################################################################
    def get(ref)
        if !@items[ref.to_sym]
            rbvmomi_dc = RbVmomi::VIM::Datacenter.new(@vi_client.vim, ref)
            @items[ref.to_sym] = Datacenter.new(rbvmomi_dc)
        end

        @items[ref.to_sym]
    end
end # class DatatacenterFolder

class Datacenter
    attr_accessor :item

    def initialize(item, vi_client=nil)
        if !item.instance_of? RbVmomi::VIM::Datacenter
            raise "Expecting type 'RbVmomi::VIM::Datacenter'. " <<
                  "Got '#{item.class} instead."
        end

        @vi_client = vi_client
        @item = item
    end

    def datastore_folder
        DatastoreFolder.new(@item.datastoreFolder)
    end

    def host_folder
        HostFolder.new(@item.hostFolder)
    end

    def vm_folder
        VirtualMachineFolder.new(@item.vmFolder)
    end

    def network_folder
        NetworkFolder.new(@item.networkFolder)
    end

    def self.new_from_ref(ref, vi_client)
        self.new(RbVmomi::VIM::Datacenter.new(vi_client.vim, ref), vi_client)
    end
end

end # module VCenterDriver
