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

                # Optimization: Trim leading zeros
                map.sub!(/^0+/, '')
                map = '0' if map.empty?
            else
                map = '0'
            end

            map_encoded = Base64.strict_encode64(Zlib::Deflate.deflate(map))

            cluster         = @db[:cluster_vnc_bitmap].first(:id => cluster_id)
            old_map_encoded = cluster[:map] rescue nil

            if old_map_encoded.nil?
                log_error("Cluster #{cluster_id} is missing its VNC bitmap")
                fixes[cluster_id] = map_encoded
                next
            end

            begin
                old_map = Zlib::Inflate.inflate(Base64.decode64(old_map_encoded))
                old_map.sub!(/^0+/, '')
                old_map = '0' if old_map.empty?
            rescue
                log_error("Cluster #{cluster_id} has a corrupted VNC bitmap")
                fixes[cluster_id] = map_encoded
                next
            end

            if old_map != map
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
