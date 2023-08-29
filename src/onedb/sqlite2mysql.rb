# Migrate SQLite Database to MySQL
module Sqlite2MySQL

    PROGRESS = 1000

    def convert(sqlite_db)
        puts "Starting migration from SQLite to MySQL\n"

        dst_encoding = table_to_nk(encoding)

        sqlite_db.tables.each do |table|
            @db[table].delete

            records = sqlite_db[table].count
            puts "> #{table} (#{records} records)"

            @db.transaction do
                i=0
                sqlite_db[table].each do |row|
                    if table.to_s == 'logdb' && row[:fed_index] >= 2**64
                        row[:fed_index] = 2**64-1
                    end

                    if dst_encoding != 'UTF-8'
                        row.each {|k, v| row[k] = v.force_encoding(dst_encoding) if v.is_a? String }
                    end

                    @db[table].insert(row)

                    i+=1
                    if i % PROGRESS == 0
                        if i < PROGRESS+1
                            print "  #{i}"
                        else
                            print "...#{i}"
                        end
                    end
                end
                puts if i > PROGRESS-1
            end
        end

        puts "\nMigration successful."
    end

end
