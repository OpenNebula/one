
module OneDBFsck
    def check_cluster_vnc_bitmap
        fixes = @fixes_cluster_vnc_bitmap = {}
        cluster_vnc = @data_vm[:vnc]

        vnc_pool_size = 65536

        @db.fetch("SELECT * FROM cluster_pool") do |row|
            cluster_id = row[:oid]

            if cluster_vnc[cluster_id]
                map = ""
                vnc_pool_size.times.each do |i|
                    map << (cluster_vnc[cluster_id].include?(vnc_pool_size - 1 - i) ? "1" : "0")
                end

                map_encoded = Base64::strict_encode64(Zlib::Deflate.deflate(map))
            else
                map_encoded = "eJztwYEAAAAAgCCl/ekWqQoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABqFo8C0Q=="
            end

            old_map_encoded = @db[:cluster_vnc_bitmap].first(:id => cluster_id)[:map] rescue nil

            if old_map_encoded != map_encoded
                log_error("Cluster #{cluster_id} has not the proper reserved VNC ports")
                fixes[cluster_id] = map_encoded
            end
        end
    end

    def fix_cluster_vnc_bitmap
        @db.transaction do
            @fixes_cluster_vnc_bitmap.each do |id, map|
                @db[:cluster_vnc_bitmap].where(id: id).update(map: map)
            end
        end
    end
end

