# Cluster module
module OneDBFsck

    # Gather clusters information
    def init_cluster
        cluster = @data_cluster = {}
        @fix_cluster = {}
        @add_ds_relation = {}
        @add_vnet_relation = {}
        @del_ds_relation = {}
        @del_vnet_relation = {}

        @db.fetch('SELECT oid, name FROM cluster_pool') do |row|
            cluster[row[:oid]] = {}

            cluster[row[:oid]][:name]       = row[:name]
            cluster[row[:oid]][:hosts]      = []
            cluster[row[:oid]][:datastores] = Set.new
            cluster[row[:oid]][:vnets]      = Set.new
        end
    end

    # Check and fix clusters information
    def check_cluster
        cluster = @data_cluster

        @db.fetch('SELECT oid,body from cluster_pool') do |row|
            cluster_id = row[:oid]

            doc        = nokogiri_doc(row[:body], 'cluster_pool')

            @error = false

            # Hosts
            process_hosts(doc, cluster_id, cluster[cluster_id][:hosts])

            # Datastores
            process_ds(doc, cluster_id, cluster[cluster_id][:datastores])

            # VNets
            process_vnets(doc, cluster_id, cluster[cluster_id][:vnets])

            @fix_cluster[cluster_id] = doc.root.to_s if @error
        end
    end

    def fix_cluster
        @db.transaction do
            @fix_cluster.each do |id, body|
                @db[:cluster_pool].where(:oid => id).update(:body => body)
            end
        end
    end

    def fix_cluster_relations
        @db.transaction do
            @add_ds_relation.each do |cid, oid|
                @db[:cluster_datastore_relation].insert(:cid => cid, :oid => oid)
            end

            @add_vnet_relation.each do |cid, oid|
                @db[:cluster_network_relation].insert(:cid => cid, :oid => oid)
            end

            @del_ds_relation.each do |cid, oid|
                @db[:cluster_datastore_relation].where(:cid => cid, :oid => oid).delete
            end

            @del_vnet_relation.each do |cid, oid|
                @db[:cluster_network_relation].where(:cid => cid, :oid => oid).delete
            end
        end
    end

    # Process cluster hosts
    #
    # @param doc   [Document] Document with cluster information
    # @param cid   [Integer]  Cluster ID
    # @param hosts [Array]    Hosts to process
    def process_hosts(doc, cid, hosts)
        hosts_elem     = doc.xpath('//HOSTS').remove

        hosts_new_elem = doc.create_element('HOSTS')
        doc.root.add_child(hosts_new_elem)

        hosts.each do |id|
            id_elem = hosts_elem.xpath("ID[.=#{id}]").remove

            if id_elem.empty?
                log_error("Host #{id} is missing from cluster " \
                          "#{cid} host id list")
                @error = true
            end

            aux = doc.create_element('ID')
            aux.content = id.to_s
            hosts_new_elem.add_child(aux)
        end

        hosts_elem.children.each do |id|
            id = id.text

            log_error("Host #{id} is in cluster #{cid} " \
                      'host id list, but it should not')
            @error = true
        end
    end

    # Process cluster datastores
    #
    # @param doc        [Document] Document with cluster information
    # @param cid        [Integer]  Cluster ID
    # @param datastores [Array]    Datastores to process
    def process_ds(doc, cid, datastores)
        ds_elem     = doc.xpath('//DATASTORES').remove

        ds_new_elem = doc.create_element('DATASTORES')
        doc.root.add_child(ds_new_elem)

        datastores.each do |id|
            id_elem = ds_elem.xpath("ID[.=#{id}]").remove

            if id_elem.empty?
                log_error("Datastore #{id} is missing from cluster " \
                          "#{cid} datastore id list")
                @error = true
            end

            aux = doc.create_element('ID')
            aux.content = id.to_s
            ds_new_elem.add_child(aux)

            next unless @db.fetch('SELECT * FROM cluster_datastore_relation ' \
                                  "WHERE cid=#{cid} AND oid=#{id}").empty?

            log_error('Table cluster_datastore_relation is missing relation ' \
                      "cluster #{cid}, datastore #{id}")

            @add_ds_relation[cid] = id
        end

        ds_elem.children.each do |id|
            id = id.text

            log_error("Datastore #{id} is in cluster #{cid} datastore id " \
                      'list, but it should not')

            @error = true
        end
    end

    # Process cluster virtual networks
    #
    # @param doc   [Document] Document with cluster information
    # @param cid   [Integer]  Cluster ID
    # @param vnets [Array]    VNets to process
    def process_vnets(doc, cid, vnets)
        vnets_elem = doc.xpath('//VNETS').remove

        vnets_new_elem = doc.create_element('VNETS')
        doc.root.add_child(vnets_new_elem)

        vnets.each do |id|
            id_elem = vnets_elem.xpath("ID[.=#{id}]").remove

            if id_elem.empty?
                log_error("VNet #{id} is missing from cluster #{cid} " \
                          'vnet id list')
                @error = true
            end

            aux = doc.create_element('ID')
            aux.content = id.to_s
            vnets_new_elem.add_child(aux)

            next unless @db.fetch('SELECT * FROM cluster_network_relation ' \
                                  "WHERE cid=#{cid} AND oid=#{id}").empty?

            log_error('Table cluster_network_relation is missing relation ' \
                      "cluster #{cid}, vnet #{id}")

            @add_vnet_relation[cid] = id
        end

        vnets_elem.children.each do |id|
            id = id.text

            log_error("VNet #{id} is in cluster #{cid} vnet id list, " \
                      'but it should not')
            @error = true
        end
    end

    # Check and fix cluster relations with datastores and VNets
    def check_cluster_relations
        cluster = @data_cluster

        @db.fetch('SELECT * from cluster_datastore_relation') do |row|
            if !cluster[row[:cid]] || cluster[row[:cid]][:datastores].count(
                row[:oid]
            ) != 1
                log_error('Table cluster_datastore_relation contains ' \
                            "relation cluster #{row[:cid]}, datastore " \
                            "#{row[:oid]}, but it should not")
                @del_ds_relation[row[:cid]] = row[:oid]
            end
        end

        @db.fetch('SELECT * from cluster_network_relation') do |row|
            if !cluster[row[:cid]] || cluster[row[:cid]][:vnets].count(
                row[:oid]
            ) != 1
                log_error('Table cluster_network_relation contains ' \
                            "relation cluster #{row[:cid]}, " \
                            "vnet #{row[:oid]}, but it should not")
                @del_vnet_relation[row[:cid]] = row[:oid]
            end
        end
    end

end
