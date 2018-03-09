module VCenterDriver
    class VcImporter
        attr_accessor :list

        ##################
        # Constructors
        ##################
        def initialize(one_client, vi_client)
            @vi_client  = vi_client
            @one_client = one_client
            @list       = {}
            @clusters   = {}
        end

        def self.new_(one_client, vi_client, type)
            case type
            when "datastores"
                VCenterDriver::DsImporter.new(one_client, vi_client)
            else
                raise "unknown object type"
            end
        end

        def process_import(indexes)
            raise "the list is empty" if list_empty?
            indexes = indexes.gsub(/\s+/, "").split(",")

            indexes.each do |index|
                # select object from importer mem
                selected = get_element(index)

                import(selected)
            end
        end

        protected
        ####################
        # ABSTRACT INTERFACE
        ####################

        MESS = "missing method from parent"

        def get_list;    raise MESS end
        def add_cluster(cid, eid) raise MESS end
        def remove_default(id) raise MESS end
        def import(selected) raise MESS end

        ###############

        def create(info, &block)
            resource = VCenterDriver::VIHelper.new_one_item(@one_class)
            rc = resource.allocate(info)
            VCenterDriver::VIHelper.check_error(rc, "Error creating resource")
            rc = block.call(resource)
        end

        def list_empty?
            @list == {}
        end

        def get_element(ref)
            raise "the list is empty" if list_empty?
            @list[ref] if @list[ref]
        end

        def add_clusters(one_id, clusters, &block)
            clusters.each do |cid|
                @clusters[cid] ||= VCenterDriver::VIHelper.one_item(OpenNebula::Cluster, cid.to_s, false)
                rc =  add_cluster(cid.to_i, one_id.to_i)
                VCenterDriver::VIHelper.check_error(rc, "add element to cluster")
            end
            remove_default(one_id)
        end
    end
end
