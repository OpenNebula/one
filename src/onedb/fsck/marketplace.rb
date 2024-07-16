
module OneDBFsck
    # Needs:
    #
    #   @data_marketplaceapp: set by do_check_marketplaceapp
    #
    # Sets:
    #
    #   @fixes_marketplace: used by do_check_marketplace

    def check_marketplace
        marketplace = @data_marketplaceapp[:marketplace]

        @fixes_marketplace = {}
        markets_fix = {}

        # DATA: check marketplace pool
        @db.fetch("SELECT oid,body FROM marketplace_pool") do |row|
            market_id = row[:oid]
            doc = nokogiri_doc(row[:body], 'marketplace_pool')

            check_ugid(doc)

            error = fix_permissions('MARKETPLACE', row[:oid], doc)

            apps_elem = doc.root.at_xpath("MARKETPLACEAPPS")
            apps_elem.remove if !apps_elem.nil?

            apps_new_elem = doc.create_element("MARKETPLACEAPPS")
            doc.root.add_child(apps_new_elem)

            # DATA: CHECK: are all apps in the marketplace?
            marketplace[market_id][:apps].each do |id|
                id_elem = apps_elem.at_xpath("ID[.=#{id}]")

                if id_elem.nil?
                    error = true

                    log_error(
                        "Marketplace App #{id} is missing from Marketplace #{market_id} "<<
                        "app id list")
                else
                    id_elem.remove
                end

                apps_new_elem.add_child(doc.create_element("ID")).content = id.to_s
            end

            # DATA: CHECK: listed apps that don't belong to the marketplace
            apps_elem.xpath("ID").each do |id_elem|
                error = true

                log_error(
                    "Marketplace App #{id_elem.text} is in Marketplace #{market_id} "<<
                    "app id list, but it should not")
            end

            zone_elem = doc.root.at_xpath("ZONE_ID")

            # DATA: CHECK: zone id
            if (zone_elem.nil? || zone_elem.text == "-1")
                error = true

                log_error("Marketplace #{market_id} has an invalid ZONE_ID. Will be set to 0")

                if (zone_elem.nil?)
                    zone_elem = doc.root.add_child(doc.create_element("ZONE_ID"))
                end

                zone_elem.content = "0"
            end

            @fixes_marketplace[row[:oid]] = doc.root.to_s if error
        end
    end

    def fix_marketplace
        # DATA: FIX: update each marketplace that needs fixing
        if !db_version[:is_slave]
            @db.transaction do
                @fixes_marketplace.each do |id, body|
                    @db[:marketplace_pool].where(:oid => id).update(:body => body)
                end
            end
        elsif !@fixes_marketplace.empty?
            log_msg("^ Marketplace errors need to be fixed in the master OpenNebula")
        end
    end
end

