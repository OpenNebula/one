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

    def get_vcenter_instance_uuid
        @vi_client.vim.serviceContent.about.instanceUuid
    end

    def get_vcenter_api_version
        @vi_client.vim.serviceContent.about.apiVersion
    end

    def get_clusters

        clusters = {}

        vcenter_uuid = get_vcenter_instance_uuid

        pool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool, false)
        if pool.respond_to?(:message)
            raise "Could not get OpenNebula Pool: #{pool.message}"
        end

        fetch! if @items.empty? #Get datacenters

        # Add datacenter to hash and store in an array all clusters
        @items.values.each do |dc|
            dc_name = dc.item.name
            clusters[dc_name] = []

            host_folder = dc.host_folder
            host_folder.fetch_clusters!

            host_folder.items.values.each do |ccr|
                cluster = {}
                cluster[:ref]  = ccr['_ref']
                cluster[:name] = ccr['name']
                attribute = "TEMPLATE/VCENTER_CCR_REF"
                one_host = VCenterDriver::VIHelper.find_by_ref(OpenNebula::HostPool,
                                                               attribute,
                                                               ccr['_ref'],
                                                               vcenter_uuid,
                                                               pool)

                next if one_host.nil? #Cluster hasn't been imported'

                cluster[:host_id] = one_host['ID']
                clusters[dc_name] << cluster
            end
        end

        clusters
    end

    def get_unimported_hosts
        host_objects = {}

        vcenter_uuid = get_vcenter_instance_uuid

        vcenter_version = get_vcenter_api_version

        hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool, false)

        if hpool.respond_to?(:message)
            raise "Could not get OpenNebula HostPool: #{hpool.message}"
        end

        fetch! if @items.empty? #Get datacenters

        @items.values.each do |dc|
            dc_name = dc.item.name
            host_objects[dc_name] = []

            host_folder = dc.host_folder
            host_folder.fetch_clusters!
            host_folder.items.values.each do |host|

                one_host = VCenterDriver::VIHelper.find_by_ref(OpenNebula::HostPool,
                                                               "TEMPLATE/VCENTER_CCR_REF",
                                                               host['_ref'],
                                                               vcenter_uuid,
                                                               hpool)
                next if one_host #If the host has been already imported

                host_info = {}
                host_info[:cluster_name]     = host['name']
                host_info[:cluster_ref]      = host['_ref']
                host_info[:vcenter_uuid]     = vcenter_uuid
                host_info[:vcenter_version]  = vcenter_version

                host_objects[dc_name] << host_info
            end
        end

        return host_objects
    end

    def get_unimported_datastores
        ds_objects = {}

        vcenter_uuid = get_vcenter_instance_uuid

        pool = VCenterDriver::VIHelper.one_pool(OpenNebula::DatastorePool, false)

        if pool.respond_to?(:message)
            raise "Could not get OpenNebula DatastorePool: #{pool.message}"
        end

        fetch! if @items.empty? #Get datacenters

        one_clusters = get_clusters

        @items.values.each do |dc|
            dc_name = dc.item.name
            ds_objects[dc_name] = []

            datastore_folder = dc.datastore_folder
            datastore_folder.fetch!
            datastore_folder.items.values.each do |ds|

                if ds.instance_of? VCenterDriver::Datastore
                    hosts_in_ds = ds['host']
                    clusters_in_ds = {}

                    hosts_in_ds.each do |host|
                        if !clusters_in_ds[host.key.parent._ref.to_s]
                            clusters_in_ds[host.key.parent._ref.to_s] = host.key.parent.name
                        end
                    end

                    clusters_in_ds.each do |ccr_ref, ccr_name|
                        already_image_ds = VCenterDriver::Storage.exists_one_by_ref_ccr_and_type?(ds["_ref"], ccr_ref, vcenter_uuid, "IMAGE_DS", pool)

                        if !already_image_ds
                            object = ds.to_one_template(one_clusters[dc_name], ccr_ref, ccr_name, "IMAGE_DS", vcenter_uuid)
                            ds_objects[dc_name] << object if !object.nil?
                        end

                        already_system_ds = VCenterDriver::Storage.exists_one_by_ref_ccr_and_type?(ds["_ref"], ccr_ref, vcenter_uuid, "SYSTEM_DS", pool)

                        if !already_system_ds
                            object = ds.to_one_template(one_clusters[dc_name], ccr_ref, ccr_name, "SYSTEM_DS", vcenter_uuid)
                            ds_objects[dc_name] << object if !object.nil?
                        end
                    end
                end

                if ds.instance_of? VCenterDriver::StoragePod
                    clusters_in_spod = {}
                    ds_in_spod = ds['children']

                    ds_in_spod.each do |sp_ds|
                        hosts_in_ds = sp_ds.host
                        hosts_in_ds.each do |host|
                            if !clusters_in_spod[host.key.parent._ref.to_s]
                                clusters_in_spod[host.key.parent._ref.to_s] = host.key.parent.name
                            end
                        end
                    end

                    clusters_in_spod.each do |ccr_ref, ccr_name|
                        already_system_ds = VCenterDriver::Storage.exists_one_by_ref_ccr_and_type?(ds["_ref"], ccr_ref, vcenter_uuid, "SYSTEM_DS", pool)

                        if !already_system_ds
                            object = ds.to_one_template(one_clusters[dc_name], ccr_ref, ccr_name, "SYSTEM_DS", vcenter_uuid)
                            ds_objects[dc_name] << object if !object.nil?
                        end
                    end
                end
            end
        end

        ds_objects
    end

    def get_unimported_templates(vi_client)
        template_objects = {}
        vcenter_uuid = get_vcenter_instance_uuid
        tpool = VCenterDriver::VIHelper.one_pool(OpenNebula::TemplatePool, false)

        if tpool.respond_to?(:message)
            raise "Could not get OpenNebula TemplatePool: #{tpool.message}"
        end

        fetch! if @items.empty? #Get datacenters

        @items.values.each do |dc|

            dc_name = dc.item.name
            template_objects[dc_name] = []

            #Get datastores available in a datacenter
            ds_list = []
            datastore_folder = dc.datastore_folder
            datastore_folder.fetch!
            datastore_folder.items.values.each do |ds|
                ds_hash = {}
                ds_hash[:name] = ds["name"]
                ds_hash[:ref] = ds["_ref"]
                ds_list << ds_hash
            end

            #Get templates defined in a datacenter
            vm_folder = dc.vm_folder
            vm_folder.fetch_templates!
            vm_folder.items.values.each do |template|
                one_template = VCenterDriver::VIHelper.find_by_ref(OpenNebula::TemplatePool,
                                                                   "TEMPLATE/VCENTER_TEMPLATE_REF",
                                                                   template['_ref'],
                                                                   vcenter_uuid,
                                                                   tpool)
                next if one_template #If the template has been already imported

                template_name = template['name']
                template_ref  = template['_ref']
                template_ccr  = template['runtime.host.parent']
                cluster_name  = template['runtime.host.parent.name']

                #Get DS list
                ds = ""
                default_ds = nil
                if !ds_list.empty?
                    ds_name_list = []
                    ds_list.each do |ds_hash|
                        ds_name_list << ds_hash[:name]
                    end
                    ds =  "M|list|Which datastore you want this VM to run in? "
                    ds << "|#{ds_name_list.join(",")}" #List of DS
                    ds << "|#{ds_name_list.first}" #Default DS
                    default_ds = ds_name_list.first
                end

                #Get resource pools
                rp_cache = {}
                if !rp_cache[template_ccr.name.to_s]
                    tmp_cluster = VCenterDriver::ClusterComputeResource.new_from_ref(template_ccr._ref, vi_client)
                    rp_list = tmp_cluster.get_resource_pool_list
                    rp = ""
                    if !rp_list.empty?
                        rp_name_list = []
                        rp_list.each do |rp_hash|
                            rp_name_list << rp_hash[:name]
                        end
                        rp =  "M|list|Which resource pool you want this VM to run in? "
                        rp << "|#{rp_name_list.join(",")}" #List of RP
                        rp << "|#{rp_name_list.first}" #Default RP
                    end
                    rp_cache[template_ccr.name.to_s] = rp
                end
                rp = rp_cache[template_ccr.name.to_s]

                object = template.to_one_template(template_name,
                                                  template_ref,
                                                  template_ccr._ref,
                                                  cluster_name,
                                                  ds,
                                                  ds_list,
                                                  default_ds,
                                                  rp,
                                                  rp_list,
                                                  vcenter_uuid)

                template_objects[dc_name] << object if !object.nil?
            end #template loop
        end #datacenter loop
        return template_objects
    end

    def get_unimported_networks

        network_objects = {}
        vcenter_uuid = get_vcenter_instance_uuid
        npool = VCenterDriver::VIHelper.one_pool(OpenNebula::VirtualNetworkPool, false)

        if npool.respond_to?(:message)
            raise "Could not get OpenNebula VirtualNetworkPool: #{npool.message}"
        end

        fetch! if @items.empty? #Get datacenters

        @items.values.each do |dc|

            dc_name = dc.item.name
            network_objects[dc_name] = []

            #Get networks defined in a datacenter
            network_folder = dc.network_folder
            network_folder.fetch!
            network_folder.items.values.each do |network|

                one_network = VCenterDriver::VIHelper.find_by_ref(OpenNebula::VirtualNetworkPool,
                                                                  "TEMPLATE/VCENTER_NET_REF",
                                                                  network['_ref'],
                                                                  vcenter_uuid,
                                                                  npool)
                next if one_network #If the network has been already imported

                network_name = network['name']
                network_ref  = network['_ref']

                # TODO slow VLAN_ID retrieve for portgroups! set to nil
                vlan_id = ""
                if network.class == VCenterDriver::DistributedPortGroup
                    vlan_id = network.vlan_id
                end

                network.clusters.each do |ccr_ref, ccr_name|
                    one_vnet = VCenterDriver::Network.to_one_template(network_name,
                                                                      network_ref,
                                                                      network.network_type,
                                                                      vlan_id,
                                                                      ccr_ref,
                                                                      ccr_name,
                                                                      vcenter_uuid)
                    network_objects[dc_name] << one_vnet
                end #network clusters loop
            end # network loop
        end #datacenters loop

        return network_objects

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
