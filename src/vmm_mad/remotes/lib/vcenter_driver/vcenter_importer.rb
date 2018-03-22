module VCenterDriver
    class VcImporter
        attr_accessor :list

        protected

        class Raction
            def initialize(object, method)
                @object = object
                @action = method
            end

            def apply
                @object.method(@action).call
            end
        end

        ########################################
        # ABSTRACT INTERFACE
        ########################################
        MESS = "missing method from parent"

        def get_list;             raise MESS end
        def add_cluster(cid, eid) raise MESS end
        def remove_default(id)    raise MESS end
        def import(selected)      raise MESS end
        def rollback;             raise MESS end
        ########################################

        public
        ########################################
        # Constructors
        ########################################
        def initialize(one_client, vi_client)
            @vi_client  = vi_client
            @one_client = one_client

            @list = {}
            @info = {}
            @rollback = []
            @info[:clusters] = {}
        end

        def self.new_child(one_client, vi_client, type)
            case type
            when "datastores"
                VCenterDriver::DsImporter.new(one_client, vi_client)
            when "templates"
                VCenterDriver::VmImporter.new(one_client, vi_client)
            else
                raise "unknown object type"
            end
        end
        ########################################

        def one_str
            return @one_class.to_s.split('::').last if @one_class

            "OpenNebula object"
        end

        def stdout
            @info[:success].each do |o|
                puts "Datastore #{o[:name]} with ids: #{o[:id].join(' ')} created!"
                puts
            end

            @info[:error].each do |index|
                e = @info[index][:e]
                puts "Error: Couldn't import #{index} due to #{e.message}!"
                puts
            end
        end

        def output
            { success: @info[:success], error: @info[:error] }
        end

        def process_import(indexes, opts = {}, &block)
            raise "the list is empty" if list_empty?
            indexes = indexes.gsub(/\s+/, "").split(",")

            @info[:success] = []
            @info[:error]   = []

            indexes.each do |index|
                begin
                    @info[index] = {}
                    selected = get_element(index)

                    @info[index][:opts] = block_given? ? block.call(selected) : opts[index]

                    # import the object
                    @info[:success] << import(selected)
                rescue Exception => e
                    @info[:error] << index
                    @info[index][:e] =  e

                    apply_rollback
                end
            end
        end


        protected

        def create(info, &block)
            resource = VCenterDriver::VIHelper.new_one_item(@one_class)
            message = "Error creating the OpenNebula resource"

            rc = resource.allocate(info)
            VCenterDriver::VIHelper.check_error(rc, message)

            rc = block.call(resource)
        end

        def list_empty?
            @list == {}
        end

        def get_element(ref)
            raise "the list is empty" if list_empty?

            return @list[ref] if @list[ref]

            raise "#{ref} not found!"
        end

        def add_clusters(one_id, clusters, &block)
            clusters.each do |cid|
                @info[:clusters][cid] ||= VCenterDriver::VIHelper.one_item(OpenNebula::Cluster, cid.to_s, false)
                rc =  add_cluster(cid.to_i, one_id.to_i)
                VCenterDriver::VIHelper.check_error(rc, "add element to cluster")
            end
            remove_default(one_id)
        end

        def apply_rollback
            if !@rollback.empty?
                @rollback.each do |action|
                    action.apply
                end
            end
        end
    end

end
