# Group module
module OneDBFsck

    # Check groups users
    def check_group
        @fixes_group = groups_fix = {}
        group        = @data_user[:group]

        @db.fetch('SELECT oid,body from group_pool') do |row|
            gid = row[:oid]
            doc = Nokogiri::XML(row[:body], nil, NOKOGIRI_ENCODING) do |c|
                c.default_xml.noblanks
            end

            users_elem     = doc.root.at_xpath('USERS')
            users_new_elem = doc.create_element('USERS')
            error          = false

            users_elem.remove unless users_elem.nil?
            doc.root.add_child(users_new_elem)

            group[gid].each do |id|
                id_elem = users_elem.at_xpath("ID[.=#{id}]")
                id_e    = doc.create_element('ID')

                if id_elem.nil?
                    log_error("User #{id} is missing from Group #{gid}" \
                              'users id list',
                              !db_version[:is_slave])
                    error = true
                else
                    id_elem.remove
                end

                users_new_elem.add_child(id_e).content = id.to_s
            end

            users_elem.xpath('ID').each do |id|
                id    = id.text
                error = true

                log_error("User #{id} is in Group #{gid} users id list, " \
                          'but it should not',
                          !db_version[:is_slave])
            end

            groups_fix[gid] = doc.root.to_s if error
        end
    end

    # Fix groups information
    def fix_group
        groups_fix = @fixes_group

        if !db_version[:is_slave]
            @db.transaction do
                groups_fix.each do |id, body|
                    @db[:group_pool].where(:oid => id).update(:body => body)
                end
            end
        elsif !groups_fix.empty?
            log_msg('^ Group errors need to be fixed in the master OpenNebula')
        end
    end

end
