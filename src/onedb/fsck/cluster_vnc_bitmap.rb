# Cluster vnc module
module OneDBFsck

    # Check cluster vnc bitmap
    def check_cluster_vnc_bitmap
        fixes         = @fixes_cluster_vnc_bitmap = {}
        cluster_vnc   = @data_vm[:vnc]
        vnc_pool_size = 65536

        @db.fetch('SELECT * FROM cluster_pool') do |row|
            cluster_id = row[:oid]

            if cluster_vnc[cluster_id]
                map = ''

                vnc_pool_size.times.each do |i|
                    cluster = cluster_vnc[cluster_id]

                    if cluster.include?(vnc_pool_size - 1 - i)
                        map << '1'
                    else
                        map << '0'
                    end
                end

                map_encoded = Base64.strict_encode64(Zlib::Deflate.deflate(map))
            else
                map_encoded = 'eJztwYEAAAAAgCCl/ekWqQoAAAAAAAAAAAAAAAAAAAAAA' \
                              'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' \
                              'AAAAAAAAAAAAAAAABqFo8C0Q=='
            end

            cluster         = @db[:cluster_vnc_bitmap].first(:id => cluster_id)
            old_map_encoded = cluster[:map] rescue nil

            if old_map_encoded != map_encoded
                log_error("Cluster #{cluster_id} has not the proper " \
                          'reserved VNC ports')

                fixes[cluster_id] = map_encoded
            end
        end
    end

    # Fix cluster vnc bitmap
    def fix_cluster_vnc_bitmap
        @db.transaction do
            @fixes_cluster_vnc_bitmap.each do |id, map|
                @db[:cluster_vnc_bitmap].where(:id => id).update(:map => map)
            end
        end
    end

end
