
module OneDBFsck
    def check_group
        @fixes_group = groups_fix = {}

        group = @data_user[:group]

        @db.fetch("SELECT oid,body from group_pool") do |row|
            gid = row[:oid]
            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            users_elem = doc.root.at_xpath("USERS")
            users_elem.remove if !users_elem.nil?

            users_new_elem = doc.create_element("USERS")
            doc.root.add_child(users_new_elem)

            error_found = false

            group[gid].each do |id|
                id_elem = users_elem.at_xpath("ID[.=#{id}]")

                if id_elem.nil?
                    log_error("User #{id} is missing from Group #{gid} users id list", !db_version[:is_slave])
                    error_found = true
                else
                    id_elem.remove
                end

                users_new_elem.add_child(doc.create_element("ID")).content = id.to_s
            end

            users_elem.xpath("ID").each do |id_elem|
                log_error("User #{id_elem.text} is in Group #{gid} users id list, but it should not", !db_version[:is_slave])
                error_found = true
            end


            if error_found
                groups_fix[row[:oid]] = doc.root.to_s
            end
        end
    end

    def fix_group
        groups_fix = @fixes_group

        if !db_version[:is_slave]
            @db.transaction do
                groups_fix.each do |id, body|
                    @db[:group_pool].where(:oid => id).update(:body => body)
                end
            end
        elsif !groups_fix.empty?
            log_msg("^ Group errors need to be fixed in the master OpenNebula")
        end
    end
end
