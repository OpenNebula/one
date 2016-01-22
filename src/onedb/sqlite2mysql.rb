module Sqlite2MySQL

    PROGRESS = 1000

    def convert(sqlite_db)
        puts "Starting migration from SQLite to MySQL\n"

        sqlite_db.tables.each do |table|
            @db[table].delete

            records = sqlite_db[table].count
            puts "> #{table} (#{records} records)"

            @db.transaction do
                i=0
                sqlite_db[table].each do |row|
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
