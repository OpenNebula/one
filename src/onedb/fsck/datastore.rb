# Datastore module
module OneDBFsck

    # Gather datastores information
    def init_datastore_counters
        @data_datastore = {}

        @db.fetch('SELECT oid, name FROM datastore_pool') do |row|
            @data_datastore[row[:oid]] = { :name => row[:name], :images => [] }
        end
    end

    # Check datastores images and fix it
    def check_datastore
        datastore = @data_datastore
        @fixes_ds = {}

        @db.fetch('SELECT oid, body FROM datastore_pool') do |row|
            ds_id           = row[:oid]
            doc             = nokogiri_doc(row[:body], 'datastore_pool')

            update          = fix_permissions('DATASTORE', row[:oid], doc)

            images_elem     = doc.root.xpath('IMAGES').remove
            images_new_elem = doc.create_element('IMAGES')

            check_ugid(doc)

            doc.root.add_child(images_new_elem)

            datastore[ds_id][:images].each do |id|
                id_elem = images_elem.xpath("ID[.=#{id}]").remove

                if id_elem.nil?
                    log_error(
                        "Image #{id} is missing from Datastore #{ds_id} " \
                        'image id list'
                    )
                    update = true
                end

                i_e = doc.create_element('ID')
                images_new_elem.add_child(i_e).content = id.to_s
            end

            images_elem.children.each do |id_elem|
                log_error(
                    "Image #{id_elem.text} is in Datastore #{ds_id} " \
                    'image id list, but it should not'
                )
                update = true
            end

            @fixes_ds[ds_id] = doc.root.to_s if update
        end
    end

    # Check datastores clusters
    def check_datastore_cluster
        cluster                  = @data_cluster
        @fixes_datastore_cluster = {}

        @db.fetch('SELECT oid,body FROM datastore_pool') do |row|
            doc = nokogiri_doc(row[:body], 'datastore_pool')
            oid = row[:oid]

            doc.root.xpath('CLUSTERS/ID').each do |e|
                cid           = e.text.to_i
                cluster_entry = cluster[cid]

                if cluster_entry.nil?
                    log_error("Datastore #{oid} is in cluster #{cid}, " \
                              'but it does not exist')

                    e.remove

                    @fixes_datastore_cluster[oid] = doc.root.to_s
                else
                    cluster_entry[:datastores] << oid
                end
            end
        end
    end

    # Check datastores images
    def check_datastore_image
        datastore              = @data_datastore
        @fixes_datastore_image = {}

        @db.fetch('SELECT oid,body FROM image_pool') do |row|
            doc     = nokogiri_doc(row[:body], 'datastore_pool')
            ds_id   = doc.root.xpath('DATASTORE_ID').text.to_i
            ds_name = doc.root.xpath('DATASTORE').text

            if ds_id != -1
                ds_entry = datastore[ds_id]

                if ds_entry.nil?
                    log_error("Image #{row[:oid]} has datastore #{ds_id}, " \
                              'but it does not exist. The image is probably ' \
                              "unusable, and needs to be deleted manually:\n" \
                              '  * The image contents should be deleted ' \
                              "manually:\n #{doc.root.xpath('SOURCE').text}\n" \
                              '  * The DB entry can be then deleted with ' \
                              "the command:\n" \
                              '    DELETE FROM image_pool WHERE ' \
                              "oid=#{row[:oid]};\n  * Run fsck again.\n", false)
                else
                    if ds_name != ds_entry[:name]
                        log_error("Image #{row[:oid]} has a wrong name " \
                                  "for datastore #{ds_id}, #{ds_name}. " \
                                  "It will be changed to #{ds_entry[:name]}")

                        doc.root.xpath('DATASTORE').each do |e|
                            e.content = ds_entry[:name]
                        end

                        @fixes_datastore_image[row[:oid]] = doc.root.to_s
                    end

                    ds_entry[:images] << row[:oid]
                end
            end
        end
    end

    # Fix datastores clusters
    def fix_datastore
        @db.transaction do
            @fixes_ds.each do |id, body|
                @db[:datastore_pool].where(:oid => id).update(:body => body)
            end
        end
    end

    # Fix datastores clusters
    def fix_datastore_cluster
        @db.transaction do
            @fixes_datastore_cluster.each do |id, body|
                @db[:datastore_pool].where(:oid => id).update(:body => body)
            end
        end
    end

    # Fix datastores images
    def fix_datastore_image
        @db.transaction do
            @fixes_datastore_image.each do |id, body|
                @db[:image_pool].where(:oid => id).update(:body => body)
            end
        end
    end

end
