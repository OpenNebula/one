
module OneDBFsck
    # Sets:
    #
    #   @data_marketplaceapp: used also by marketplace check
    #   @fixes_marketplaceapp: used by do_check_marketplaceapp

    def check_marketplaceapp
        @data_marketplaceapp = {
            marketplace: {}
        }

        marketplace = @data_marketplaceapp[:marketplace]

        # DATA: create marketplace hash with its name and empty apps array
        @db.fetch("SELECT oid, name FROM marketplace_pool") do |row|
            marketplace[row[:oid]] = {:name => row[:name], :apps => []}
        end

        @fixes_marketplaceapp = {}
        apps_fix = @fixes_marketplaceapp

        # DATA: go through all apps
        @db.fetch("SELECT oid,body FROM marketplaceapp_pool") do |row|
            doc = nokogiri_doc(row[:body], 'marketplaceapp_pool')

            check_ugid(doc)

            market_id   = doc.root.xpath('MARKETPLACE_ID').text.to_i
            market_name = doc.root.xpath('MARKETPLACE').text

            ####################################################################
            # DATA: TODO, BUG: this code will only work for a standalone oned.
            # In a federation, the image ID will refer to a different image
            # in each zone
            ####################################################################

            # DATA: get image origin id. Does it work?
            origin_id = doc.root.xpath('ORIGIN_ID').text.to_i
            if origin_id >= 0 && doc.root.xpath('STATE').text.to_i == 2 # LOCKED
                counters[:image][origin_id][:app_clones].add(row[:oid])
            end

            error = fix_permissions('MARKETPLACEAPP', row[:oid], doc)

            ####################################################################
            #####################################################################

            if market_id != -1
                market_entry = marketplace[market_id]

                # DATA: CHECK: does marketplace for this app exist?
                if market_entry.nil?
                    log_error("Marketplace App #{row[:oid]} has marketplace #{market_id}, but it does not exist. The app is probably unusable, and needs to be deleted manually:\n"<<
                        "  * The DB entry can be deleted with the command:\n"<<
                        "    DELETE FROM marketplaceapp_pool WHERE oid=#{row[:oid]};\n"<<
                        "  * Run fsck again.\n", false)
                else
                    # DATA: CHECK: marketplace name is correct
                    if market_name != market_entry[:name]
                        log_error("Marketplace App #{row[:oid]} has a wrong name for marketplace #{market_id}, #{market_name}. It will be changed to #{market_entry[:name]}")

                        doc.root.xpath('MARKETPLACE').each do |e|
                            e.content = market_entry[:name]
                        end

                        error = true
                    end

                    apps_fix[row[:oid]] = doc.root.to_s if error

                    # DATA: Add app to marketplace list. Used in marketplace check
                    market_entry[:apps] << row[:oid]
                end
            end
        end
    end

    def fix_marketplaceapp
        # DATA: FIX: fix marketplace app data
        if !db_version[:is_slave]
            @db.transaction do
                @fixes_marketplaceapp.each do |id, body|
                    @db[:marketplaceapp_pool].where(:oid => id).update(:body => body)
                end
            end
        elsif !@fixes_marketplaceapp.empty?
            log_msg("^ Marketplace App errors need to be fixed in the master OpenNebula")
        end
    end
end

