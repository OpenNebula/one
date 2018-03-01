
module OneDBFsck
    # Init image counters
    def init_image_counters
        @db.fetch("SELECT oid,body FROM image_pool") do |row|
            if counters[:image][row[:oid]].nil?
                counters[:image][row[:oid]] = {
                    :vms        => Set.new,
                    :clones     => Set.new,
                    :app_clones => Set.new
                }
            end

            doc = Document.new(row[:body])

            doc.root.each_element("CLONING_ID") do |e|
                img_id = e.text.to_i

                if counters[:image][img_id].nil?
                    counters[:image][img_id] = {
                        :vms        => Set.new,
                        :clones     => Set.new,
                        :app_clones => Set.new
                    }
                end

                counters[:image][img_id][:clones].add(row[:oid])
            end
        end
    end

    def check_image
        @fixes_image = {}

        @db.transaction do
            @db[:image_pool].each do |row|
                doc = Document.new(row[:body])

                oid = row[:oid]

                persistent = ( doc.root.get_text('PERSISTENT').to_s == "1" )
                current_state = doc.root.get_text('STATE').to_s.to_i

                counters_img = counters[:image][oid]

                rvms          = counters_img[:vms].size
                n_cloning_ops = counters_img[:clones].size + counters_img[:app_clones].size

                # DATA: CHECK: running vm counter with this image
                # rewrite running_vms
                doc.root.each_element("RUNNING_VMS") {|e|
                    if e.text != rvms.to_s
                        log_error("Image #{oid} RUNNING_VMS has #{e.text} \tis\t#{rvms}")
                        e.text = rvms
                    end
                }

                # re-do list of VM IDs
                vms_elem = doc.root.elements.delete("VMS")

                vms_new_elem = doc.root.add_element("VMS")

                # DATA: CHECK: running vm list with this image
                counters_img[:vms].each do |id|
                    id_elem = vms_elem.elements.delete("ID[.=#{id}]")

                    if id_elem.nil?
                        log_error("VM #{id} is missing from Image #{oid} VM id list")
                    end

                    vms_new_elem.add_element("ID").text = id.to_s
                end

                vms_elem.each_element("ID") do |id_elem|
                    log_error("VM #{id_elem.text} is in Image #{oid} VM id list, but it should not")
                end


                if ( persistent && rvms > 0 )
                    n_cloning_ops = 0
                    counters_img[:clones]     = Set.new
                    counters_img[:app_clones] = Set.new
                end

                # DATA: CHECK: Check number of clones
                doc.root.each_element("CLONING_OPS") { |e|
                    if e.text != n_cloning_ops.to_s
                        log_error("Image #{oid} CLONING_OPS has #{e.text} \tis\t#{n_cloning_ops}")
                        e.text = n_cloning_ops
                    end
                }

                # re-do list of Images cloning this one
                clones_elem = doc.root.elements.delete("CLONES")

                clones_new_elem = doc.root.add_element("CLONES")

                # DATA: CHECK: image clones (is it used?)
                counters_img[:clones].each do |id|
                    id_elem = clones_elem.elements.delete("ID[.=#{id}]")

                    if id_elem.nil?
                        log_error("Image #{id} is missing from Image #{oid} CLONES id list")
                    end

                    clones_new_elem.add_element("ID").text = id.to_s
                end

                clones_elem.each_element("ID") do |id_elem|
                    log_error("Image #{id_elem.text} is in Image #{oid} CLONES id list, but it should not")
                end

                # re-do list of Apps cloning this one
                clones_elem = doc.root.elements.delete("APP_CLONES")

                clones_new_elem = doc.root.add_element("APP_CLONES")

                # DATA: CHECK: check app clones
                # DATA: TODO: understand app clones and image clones
                counters_img[:app_clones].each do |id|
                    id_elem = clones_elem.elements.delete("ID[.=#{id}]")

                    if id_elem.nil?
                        log_error("Marketplace App #{id} is missing from Image #{oid} APP_CLONES id list")
                    end

                    clones_new_elem.add_element("ID").text = id.to_s
                end

                clones_elem.each_element("ID") do |id_elem|
                    log_error("Marketplace App #{id_elem.text} is in Image #{oid} APP_CLONES id list, but it should not")
                end


                # DATA: Check state
                # DATA: TODO: Error state is taken into account?

                state = current_state

                if persistent
                    if ( rvms > 0 )
                        state = 8   # USED_PERS
                    elsif ( n_cloning_ops > 0 )
                        state = 6   # CLONE
                    elsif ( current_state == 8 || current_state == 6 )
                        # rvms == 0 && n_cloning_ops == 0, but image is in state
                        # USED_PERS or CLONE

                        state = 1   # READY
                    end
                else
                    if ( rvms > 0 || n_cloning_ops > 0 )
                        state = 2   # USED
                    elsif ( current_state == 2 )
                        # rvms == 0 && n_cloning_ops == 0, but image is in state
                        # USED

                        state = 1   # READY
                    end
                end

                doc.root.each_element("STATE") { |e|
                    if e.text != state.to_s
                        log_error("Image #{oid} has STATE " <<
                            OpenNebula::Image::IMAGE_STATES[e.text.to_i] <<
                            " \tis\t#{OpenNebula::Image::IMAGE_STATES[state]}")
                        e.text = state
                    end
                }

                # row[:body] = doc.root.to_s

                # # commit
                # @db[:image_pool_new].insert(row)

                @fixes_image[oid] = doc.root.to_s
            end
        end
    end

    def fix_image
        # # Rename table
        # @db.run("DROP TABLE image_pool")
        # @db.run("ALTER TABLE image_pool_new RENAME TO image_pool")

        @fixes_image.each do |oid, body|
            @db[:image_pool].where(oid: oid).update(body: body)
        end
    end

end
