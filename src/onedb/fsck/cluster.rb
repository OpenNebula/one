# Cluster module
module OneDBFsck

    # Gather clusters information
    def init_cluster
        cluster = @data_cluster = {}

        @db.fetch('SELECT oid, name FROM cluster_pool') do |row|
            cluster[row[:oid]] = {}

            cluster[row[:oid]][:name]       = row[:name]
            cluster[row[:oid]][:hosts]      = []
            cluster[row[:oid]][:datastores] = Set.new
            cluster[row[:oid]][:vnets]      = Set.new
        end
    end

    # Check and fix clusters information
    def check_fix_cluster
        cluster = @data_cluster

        create_table(:cluster_pool, :cluster_pool_new)

        @db.transaction do
            @db.fetch('SELECT * from cluster_pool') do |row|
                cluster_id = row[:oid]

                doc        = nokogiri_doc(row[:body], 'cluster_pool')

                # Hosts
                process_hosts(doc, cluster_id, cluster[cluster_id][:hosts])

                # Datastores
                process_ds(doc, cluster_id, cluster[cluster_id][:datastores])

                # VNets
                process_vnets(doc, cluster_id, cluster[cluster_id][:vnets])

                row[:body] = doc.root.to_s

                # commit
                @db[:cluster_pool_new].insert(row)
            end
        end

        # Rename table
        @db.run('DROP TABLE cluster_pool')
        @db.run('ALTER TABLE cluster_pool_new RENAME TO cluster_pool')
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
            end

            aux = doc.create_element('ID')
            aux.content = id.to_s
            hosts_new_elem.add_child(aux)
        end

        hosts_elem.children.each do |id|
            id = id.text

            log_error("Host #{id} is in cluster #{cid} " \
                      'host id list, but it should not')
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
            end

            aux = doc.create_element('ID')
            aux.content = id.to_s
            ds_new_elem.add_child(aux)

            next unless @db.fetch('SELECT * FROM cluster_datastore_relation ' \
                                  "WHERE cid=#{cid} AND oid=#{id}").empty?

            log_error('Table cluster_datastore_relation is missing relation ' \
                      "cluster #{cid}, datastore #{id}")

            @db[:cluster_datastore_relation].insert(:cid => cid, :oid => id)
        end

        ds_elem.children.each do |id|
            id = id.text

            log_error("Datastore #{id} is in cluster #{cid} datastore id " \
                      'list, but it should not')
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
            end

            aux = doc.create_element('ID')
            aux.content = id.to_s
            vnets_new_elem.add_child(aux)

            next unless @db.fetch('SELECT * FROM cluster_network_relation ' \
                                  "WHERE cid=#{cid} AND oid=#{id}").empty?

            log_error('Table cluster_network_relation is missing relation ' \
                      "cluster #{cid}, vnet #{id}")

            @db[:cluster_network_relation].insert(:cid => cid, :oid => id)
        end

        vnets_elem.children.each do |id|
            id = id.text

            log_error("VNet #{id} is in cluster #{cid} vnet id list, " \
                      'but it should not')
        end
    end

    # Check and fix cluster relations with datastores and VNets
    def check_fix_cluster_relations
        cluster = @data_cluster

        @db.transaction do
            create_table(:cluster_datastore_relation,
                         :cluster_datastore_relation_new)

            @db.fetch('SELECT * from cluster_datastore_relation') do |row|
                if cluster[row[:cid]][:datastores].count(row[:oid]) != 1
                    log_error('Table cluster_datastore_relation contains ' \
                              "relation cluster #{row[:cid]}, datastore " \
                              "#{row[:oid]}, but it should not")
                else
                    @db[:cluster_datastore_relation_new].insert(row)
                end
            end

            @db.run('DROP TABLE cluster_datastore_relation')
            @db.run('ALTER TABLE cluster_datastore_relation_new ' \
                    'RENAME TO cluster_datastore_relation')
        end

        log_time

        @db.transaction do
            create_table(:cluster_network_relation,
                         :cluster_network_relation_new)

            @db.fetch('SELECT * from cluster_network_relation') do |row|
                if cluster[row[:cid]][:vnets].count(row[:oid]) != 1
                    log_error('Table cluster_network_relation contains ' \
                              "relation cluster #{row[:cid]}, " \
                              "vnet #{row[:oid]}, but it should not")
                else
                    @db[:cluster_network_relation_new].insert(row)
                end
            end

            @db.run('DROP TABLE cluster_network_relation')
            @db.run('ALTER TABLE cluster_network_relation_new ' \
                    'RENAME TO cluster_network_relation')
        end
    end

end
