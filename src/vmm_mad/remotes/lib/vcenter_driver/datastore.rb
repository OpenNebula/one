module VCenterDriver

class DatastoreFolder
    attr_accessor :item, :items

    def initialize(item)
        @item = item
        @items = {}
    end

    ########################################################################
    # Builds a hash with Datastore-Ref / Datastore to be used as a cache
    # @return [Hash] in the form
    #   { ds_ref [Symbol] => Datastore object }
    ########################################################################
    def fetch!
        VIClient.get_entities(@item, "Datastore").each do |item|
            item_name = item._ref
            @items[item_name.to_sym] = Datastore.new(item)
        end
    end

    ########################################################################
    # Returns a Datastore. Uses the cache if available.
    # @param ref [Symbol] the vcenter ref
    # @return Datastore
    ########################################################################
    def get(ref)
        if !@items[ref.to_sym]
            rbvmomi_dc = RbVmomi::VIM::Datastore.new(@item._connection, ref)
            @items[ref.to_sym] = Datastore.new(rbvmomi_dc)
        end

        @items[ref.to_sym]
    end
end # class DatastoreFolder

class Datastore
    attr_accessor :item

    def initialize(item)
        if !item.instance_of? RbVmomi::VIM::Datastore
            raise "Expecting type 'RbVmomi::VIM::Datastore'. " <<
                  "Got '#{item.class} instead."
        end

        @item = item
    end

    def monitor
        summary = @item.summary

        total_mb = (summary.capacity.to_i / 1024) / 1024
        free_mb  = (summary.freeSpace.to_i / 1024) / 1024
        used_mb  = total_mb - free_mb

        "USED_MB=#{used_mb}\nFREE_MB=#{free_mb} \nTOTAL_MB=#{total_mb}"
    end

    def create_virtual_disk(dc, img_name, size, adapter_type, disk_type)
        vdm = @item._connection.serviceContent.virtualDiskManager
        ds_name = @item.name

        vmdk_spec = RbVmomi::VIM::FileBackedVirtualDiskSpec(
            :adapterType => adapter_type,
            :capacityKb  => size.to_i*1024,
            :diskType    => disk_type
        )

        vdm.CreateVirtualDisk_Task(
          :datacenter => dc.item,
          :name       => "[#{ds_name}] #{img_name}.vmdk",
          :spec       => vmdk_spec
        ).wait_for_completion

        "#{img_name}.vmdk"
    end

    def delete_virtual_disk(dc, img_name)
        vdm = @item._connection.serviceContent.virtualDiskManager
        ds_name = @item.name

        vdm.DeleteVirtualDisk_Task(
          name: "[#{ds_name}] #{img_name}",
          datacenter: dc.item
        ).wait_for_completion
    end

    # This is never cached
    def self.new_from_ref(vi_client, ref)
        self.new(RbVmomi::VIM::Datastore.new(vi_client.vim, ref))
    end
end # class Datastore

end # module VCenterDriver

