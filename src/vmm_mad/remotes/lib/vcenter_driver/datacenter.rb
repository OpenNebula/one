module VCenterDriver

class DatacenterFolder
    attr_accessor :items

    def initialize(vcenter_client)
        @vcenter_client = vcenter_client
        @items = {}
    end

    ########################################################################
    # Builds a hash with Datacenter-Ref / Datacenter to be used as a cache
    # @return [Hash] in the form
    #   { dc_ref [Symbol] => Datacenter object }
    ########################################################################
    def fetch!
        VIClient.get_entities(@vcenter_client.vim.root, "Datacenter").each do |item|
            _, item_name, _ = item.to_s.split('"')
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
            rbvmomi_dc = RbVmomi::VIM::Datacenter.new(@vcenter_client.vim, ref)
            @items[ref.to_sym] = Datacenter.new(rbvmomi_dc)
        end

        @items[ref.to_sym]
    end
end

class Datacenter
    attr_accessor :item

    def initialize(item)
        if !item.instance_of? RbVmomi::VIM::Datacenter
            raise "Expecting type 'RbVmomi::VIM::Datacenter'. " <<
                  "Got '#{item.class} instead."
        end

        @item = item
    end

    def datastore_folder
        DatastoreFolder.new(@item.datastoreFolder)
    end

    def host_folder
        HostFolder.new(@item.hostFolder)
    end

    # This is never cached
    def self.new_from_ref(vi_client, ref)
        self.new(RbVmomi::VIM::Datacenter.new(vi_client.vim, ref))
    end
end

end # module VCenterDriver
