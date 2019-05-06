
module OneDBFsck
    def check_pool_control
        @fixes_pool_control = {}

        tables.each do |table|
            max_oid = -1

            @db.fetch("SELECT MAX(oid) FROM #{table}") do |row|
                max_oid = row[:"MAX(oid)"].to_i
            end

            # max(oid) will return 0 if there is none,
            # or if the max is actually 0. Check this:
            if ( max_oid == 0 )
                max_oid = -1

                @db.fetch("SELECT oid FROM #{table} WHERE oid=0") do |row|
                    max_oid = 0
                end
            end

            control_oid = -1

            @db.fetch("SELECT last_oid FROM pool_control WHERE tablename='#{table}'") do |row|
                control_oid = row[:last_oid].to_i
            end

            if ( max_oid > control_oid )
                msg = "pool_control for table #{table} has last_oid #{control_oid}, but it is #{max_oid}"

                if control_oid != -1
                    if db_version[:is_slave] && federated_tables.include?(table)
                        log_error(msg, false)
                        log_msg("^ Needs to be fixed in the master OpenNebula")
                    else
                        log_error(msg)
                        # @db.run("UPDATE pool_control SET last_oid=#{max_oid} WHERE tablename='#{table}'")
                        @fixes_pool_control[table] = max_oid
                    end
                else
                    # @db[:pool_control].insert(
                    #     :tablename  => table,
                    #     :last_oid   => max_oid)
                    @fixes_pool_control[table] = max_oid
                end
            end
        end
    end

    def fix_pool_control
        db = @db[:pool_control]

        @db.transaction do
            @fixes_pool_control.each do |name, last_oid|
                # If it can not update use insert
                if 1 != db.where(tablename: name).update(last_oid: last_oid)
                    db.insert(tablename: name, last_oid: last_oid)
                end
            end
        end
    end
end
