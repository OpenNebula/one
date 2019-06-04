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
                doc        = Document.new(row[:body])

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
        hosts_elem     = doc.root.elements.delete('HOSTS')
        hosts_new_elem = doc.root.add_element('HOSTS')

        hosts.each do |id|
            id_elem = hosts_elem.elements.delete("ID[.=#{id}]")

            if id_elem.nil?
                log_error("Host #{id} is missing from cluster " \
                          "#{cid} host id list")
            end

            hosts_new_elem.add_element('ID').text = id.to_s
        end

        hosts_elem.each_element('ID') do |id|
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
        ds_elem     = doc.root.elements.delete('DATASTORES')
        ds_new_elem = doc.root.add_element('DATASTORES')

        datastores.each do |id|
            id_elem = ds_elem.elements.delete("ID[.=#{id}]")

            if id_elem.nil?
                log_error("Datastore #{id} is missing from cluster " \
                          "#{cid} datastore id list")
            end

            ds_new_elem.add_element('ID').text = id.to_s

            next unless @db.fetch('SELECT * FROM cluster_datastore_relation ' \
                                  "WHERE cid=#{cid} AND oid=#{id}").empty?

            log_error('Table cluster_datastore_relation is missing relation ' \
                      "cluster #{cid}, datastore #{id}")

            @db[:cluster_datastore_relation].insert(:cid => cid, :oid => id)
        end

        ds_elem.each_element('ID') do |id|
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
        vnets_elem     = doc.root.elements.delete('VNETS')
        vnets_new_elem = doc.root.add_element('VNETS')

        vnets.each do |id|
            id_elem = vnets_elem.elements.delete("ID[.=#{id}]")

            if id_elem.nil?
                log_error("VNet #{id} is missing from cluster #{cid} " \
                          'vnet id list')
            end

            vnets_new_elem.add_element('ID').text = id.to_s

            next unless @db.fetch('SELECT * FROM cluster_network_relation ' \
                                  "WHERE cid=#{cid} AND oid=#{id}").empty?

            log_error('Table cluster_network_relation is missing relation ' \
                      "cluster #{cid}, vnet #{id}")

            @db[:cluster_network_relation].insert(:cid => cid, :oid => id)
        end

        vnets_elem.each_element('ID') do |id|
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
