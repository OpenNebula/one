
module OneDBFsck
    def check_user
        @data_user = { group: {} }
        group = @data_user[:group]

        @db.fetch("SELECT oid FROM group_pool") do |row|
            group[row[:oid]] = []
        end

        @fixes_user = users_fix = {}

        @db.fetch("SELECT oid,body,gid FROM user_pool") do |row|
            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            gid = doc.root.at_xpath('GID').text.to_i
            user_gid = gid
            user_gids = Set.new

            if group[gid].nil?
                log_error("User #{row[:oid]} has primary group #{gid}, but it does not exist", !db_version[:is_slave])

                user_gid = 1

                doc.root.xpath('GID').each do |e|
                    e.content = "1"
                end

                doc.root.xpath('GNAME').each do |e|
                    e.content = "users"
                end

                doc.root.xpath("GROUPS").each { |e|
                    e.xpath("ID[.=#{gid}]").each{|x| x.remove}

                    e.add_child(doc.create_element("ID")).content = user_gid.to_s
                }

                users_fix[row[:oid]] = {:body => doc.root.to_s, :gid => user_gid}
            end

            doc.root.xpath("GROUPS/ID").each { |e|
                user_gids.add e.text.to_i
            }

            if !user_gids.include?(user_gid)
                log_error("User #{row[:oid]} does not have his primary group #{user_gid} in the list of secondary groups", !db_version[:is_slave])

                doc.root.xpath("GROUPS").each { |e|
                    e.add_child(doc.create_element("ID")).content = user_gid.to_s
                }

                user_gids.add user_gid.to_i

                users_fix[row[:oid]] = {:body => doc.root.to_s, :gid => user_gid}
            end

            user_gids.each do |secondary_gid|
                if group[secondary_gid].nil?
                    log_error("User #{row[:oid]} has secondary group #{secondary_gid}, but it does not exist", !db_version[:is_slave])

                    doc.root.xpath("GROUPS").each { |e|
                        e.xpath("ID[.=#{secondary_gid}]").each{|x| x.remove}
                    }

                    users_fix[row[:oid]] = {:body => doc.root.to_s, :gid => user_gid}
                else
                    group[secondary_gid] << row[:oid]
                end
            end

            if gid != row[:gid]
                log_error(
                    "User #{row[:oid]} is in group #{gid}, but the DB "<<
                    "table has GID column #{row[:gid]}", !db_version[:is_slave])

                users_fix[row[:oid]] = {:body => doc.root.to_s, :gid => user_gid}
            end
        end
    end

    def fix_user
        users_fix = @fixes_user

        if !db_version[:is_slave]
            @db.transaction do
                users_fix.each do |id, user|
                    @db[:user_pool].where(:oid => id).update(
                        :body => user[:body],
                        :gid => user[:gid])
                end
            end
        elsif !users_fix.empty?
            log_msg("^ User errors need to be fixed in the master OpenNebula")
        end
    end
end
