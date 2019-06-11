# User module
module OneDBFsck

    # Check users groups
    def check_user
        @data_user  = { :group => {} }
        @fixes_user = users_fix = {}
        group       = @data_user[:group]
        name_seen   = {}

        @db.fetch('SELECT oid FROM group_pool') do |row|
            group[row[:oid]] = []
        end

        @db.fetch('SELECT oid,body,gid,name FROM user_pool') do |row|
            doc = Nokogiri::XML(row[:body], nil, NOKOGIRI_ENCODING) do |c|
                c.default_xml.noblanks
            end

            gid         = doc.root.at_xpath('GID').text.to_i
            auth_driver = doc.root.at_xpath('AUTH_DRIVER').text
            user_gid    = gid
            user_gids   = Set.new
            exists      = check_group_exists(doc, group, row[:oid], gid)

            if !exists.nil?
                gid                  = exists[0]
                user_gid             = gid
                users_fix[row[:oid]] = exists[1]
            end

            doc.root.xpath('GROUPS/ID').each do |e|
                user_gids.add e.text.to_i
            end

            primary = check_primary_group(doc, row[:oid], user_gids, user_gid)

            if !primary.nil?
                user_gids            = primary[0]
                users_fix[row[:oid]] = primary[1]
            end

            secondary = check_secondary_group(doc,
                                              group,
                                              row[:oid],
                                              user_gids,
                                              user_gid,
                                              users_fix)

            if !secondary.nil?
                users_fix = secondary[0]
                group     = secondary[1]
            end

            if gid != row[:gid]
                log_error("User #{row[:oid]} is in group #{gid}, but the DB " \
                          "table has GID column #{row[:gid]}",
                          !db_version[:is_slave])

                users_fix[row[:oid]] = { :body => doc.root.to_s,
                                         :gid => user_gid }
            end

            ldap = check_ldap(row[:oid], row[:name], auth_driver, name_seen)

            name_seen = ldap unless ldap.nil?
        end
    end

    # Check that group exists
    #
    # @param doc   [Document] Document with user information
    # @param group [Array]    Array with groups information
    # @param uid   [Integer]  User ID
    # @param gid   [Integer]  Group ID
    #
    # @return      [Object]   Object with new body and gid
    def check_group_exists(doc, group, uid, gid)
        return unless group[gid].nil?

        log_error("User #{uid} has primary group #{gid}, but it does not exist",
                  !db_version[:is_slave])

        user_gid = 1

        doc.root.xpath('GID').each do |e|
            e.content = '1'
        end

        doc.root.xpath('GNAME').each do |e|
            e.content = 'users'
        end

        doc.root.xpath('GROUPS').each do |e|
            e.xpath("ID[.=#{gid}]").each {|x| x.remove }

            e.add_child(doc.create_element('ID')).content = user_gid.to_s
        end

        [user_gid, { :body => doc.root.to_s, :gid => user_gid }]
    end

    # Check user primary group
    #
    # @param doc  [Document] Document with user information
    # @param uid  [Integer]  User ID
    # @param gids [Array]    User group IDs
    # @param gid  [Integer]  User group ID
    #
    # @param      [Array]    User group IDs, object with new body and gid
    def check_primary_group(doc, uid, gids, gid)
        return if gids.include?(gid)

        log_error("User #{uid} does not have his primary group #{gid} in the " \
                  'list of secondary groups', !db_version[:is_slave])

        doc.root.xpath('GROUPS').each do |e|
            e.add_child(doc.create_element('ID')).content = gid.to_s
        end

        gids.add gid.to_i

        [gids, { :body => doc.root.to_s, :gid => gid }]
    end

    # Check user secondary group
    #
    # @param doc         [Document] Document with user information
    # @param group       [Array]    Array with groups information
    # @param uid         [Integer]  User ID
    # @param gids        [Array]    User group IDs
    # @param gid         [Integer]  User group ID
    # @param users_fix   [Integer]  Array with fixes for users
    #
    # @param             [Array]    Users fixes and groups
    # rubocop:disable Metrics/ParameterLists
    def check_secondary_group(doc, group, uid, gids, gid, users_fix)
        # rubocop:enable Metrics/ParameterLists
        gids.each do |secondary_gid|
            if group[secondary_gid].nil?
                log_error("User #{uid} has secondary group " \
                          "#{secondary_gid}, but it does not exist",
                          !db_version[:is_slave])

                doc.root.xpath('GROUPS').each do |e|
                    e.xpath("ID[.=#{secondary_gid}]").each {|x| x.remove }
                end

                users_fix[uid] = { :body => doc.root.to_s, :gid => gid }
            else
                group[secondary_gid] << uid
            end
        end

        [users_fix, group]
    end

    # Check ldap user
    #
    # @param uid         [Integer] User ID
    # @param name        [String]  User name
    # @param auth_driver [String]  Authentication driver
    # @param name_seen   [Array]   Array with user names
    #
    # @return            [Array]   Array with user names
    def check_ldap(uid, name, auth_driver, name_seen)
        return if auth_driver != 'ldap'

        if !name_seen[name.downcase]
            name_seen[name.downcase] = [uid, name]
        else
            log_error("User id:#{uid} has conficting name #{name}, " \
                      "another user id:#{name_seen[name.downcase][0]} " \
                      "with name #{name_seen[name.downcase][1]} is present",
                      false)
        end

        name_seen
    end

    # Fix users
    def fix_user
        users_fix = @fixes_user

        if !db_version[:is_slave]
            @db.transaction do
                users_fix.each do |id, user|
                    @db[:user_pool].where(:oid => id).update(
                        :body => user[:body],
                        :gid => user[:gid]
                    )
                end
            end
        elsif !users_fix.empty?
            log_msg('^ User errors need to be fixed in the master OpenNebula')
        end
    end

end
