# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

require 'time'
require 'rubygems'
require 'cgi'
require 'database_schema'
require 'open3'

begin
    require 'sequel'
rescue LoadError
    STDERR.puts "Ruby gem sequel is needed for this operation:"
    STDERR.puts "  $ sudo gem install sequel"
    exit -1
end

# #########################################################################
# The Error Class represents a generic error in for OneDBBacKEnd.
# #########################################################################
class OneDBError < StandardError

    attr_reader :code

    ERR_CODES = {
        :db_bootstrap_err => 1,
        :other_err        => -1
    }

    def initialize(message, code)
        @code=code
        super(message)
    end

end

class OneDBBacKEnd

    FEDERATED_TABLES = %w[group_pool user_pool acl zone_pool vdc_pool
                          marketplace_pool marketplaceapp_pool db_versioning]

    def read_db_version
        ret = {}

        begin
            connect_db

            ret[:version]   = '2.0'
            ret[:timestamp] = 0
            ret[:comment]   = ''

            @db.fetch('SELECT version, timestamp, comment FROM db_versioning '\
                      'WHERE oid=(SELECT MAX(oid) FROM db_versioning)') do |row|
                ret[:version]   = row[:version]
                ret[:timestamp] = row[:timestamp]
                ret[:comment]   = row[:comment]
            end

            ret[:local_version]   = ret[:version]
            ret[:local_timestamp] = ret[:timestamp]
            ret[:local_comment]   = ret[:comment]
            ret[:is_slave]        = false

            @db.fetch('SELECT version, timestamp, comment, is_slave FROM '\
                        'local_db_versioning WHERE oid=(SELECT MAX(oid) '\
                        'FROM local_db_versioning)') do |row|
                ret[:local_version]   = row[:version]
                ret[:local_timestamp] = row[:timestamp]
                ret[:local_comment]   = row[:comment]
                ret[:is_slave]        = row[:is_slave]
            end

            ret[:oned_version]       = OneDBBacKEnd::LATEST_DB_VERSION
            ret[:oned_local_version] = OneDBBacKEnd::LATEST_LOCAL_DB_VERSION

            ret
        # rubocop:disable Lint/RescueException
        rescue Exception => e
            if e.class == Sequel::DatabaseConnectionError
                raise OneDBError.new(e.message,
                                     OneDBError::ERR_CODES[:connection_err])
            end

            if !db_exists?
                # If the DB doesn't have db_version table, it means it is empty
                msg = 'Database is not correctly bootstraped.'

                raise OneDBError.new(msg,
                                     OneDBError::ERR_CODES[:db_bootstrap_err])
            end

            ret
        end
        # rubocop:enable Lint/RescueException
    end

    def history
        connect_db

        begin
            query = "SELECT version, timestamp, comment FROM db_versioning"
            @db.fetch(query) do |row|
                puts "Version:   #{row[:version]}"

                time = Time.at(row[:timestamp])
                puts "Timestamp: #{time.strftime("%m/%d %H:%M:%S")}"

                puts "Comment:   #{row[:comment]}"

                puts ""
            end
        rescue Exception => e
            raise "No version records found. Error message: " + e.message
        end
    end

    def update_db_version(version)
        comment = "Database migrated from #{version} to #{db_version}"+
                  " (#{one_version}) by onedb command."

        max_oid = @db[:db_versioning].max(:oid)

        @db[:db_versioning].insert(
            oid: max_oid + 1,
            version: db_version,
            timestamp: Time.new.to_i,
            comment: comment)

        puts comment
    end

    def update_local_db_version(version)
        comment = "Database migrated from #{version} to #{db_version}"+
                  " (#{one_version}) by onedb command."

        max_oid = @db[:local_db_versioning].max(:oid)

        is_slave = @db[:local_db_versioning].select(:is_slave).where_single_value(oid: max_oid)

        @db[:local_db_versioning].insert(
            oid: max_oid + 1,
            version: db_version,
            timestamp: Time.new.to_i,
            comment: comment,
            is_slave: is_slave)

        puts comment
    end

    def db()
        return @db
    end

    def nokogiri_doc(body, table)
        nk_enconding = NOKOGIRI_ENCODING

        unless table.nil?
            nk_enconding = get_table_enconding(table)
        end

        Nokogiri::XML(body, nil, nk_enconding) do |c|
            c.default_xml.noblanks
        end
    end

    private

    def db_exists?
        begin
            found = false

            # User with ID 0 (oneadmin) always exists
            @db.fetch("SELECT * FROM user_pool WHERE oid=0") { |row|
                found = true
            }
        rescue StandardError
            found = false
        end

        found
    end

    def init_log_time()
        @block_n = 0
        @time0 = Time.now
    end

    def log_time()
        if LOG_TIME
            @time1 = Time.now
            puts "    > #{db_version} Time for block #{@block_n}: #{"%0.02f" % (@time1 - @time0).to_s}s"
            @time0 = Time.now
            @block_n += 1
        end
    end
end

class BackEndMySQL < OneDBBacKEnd
    def initialize(opts={})
        @server  = opts[:server]
        @port    = opts[:port]
        @user    = opts[:user]
        @passwd  = opts[:passwd]
        @db_name = opts[:db_name]
        @encoding= opts[:encoding]

        # Check for errors:
        error   = false

        (error = true; missing = "USER"  )  if @user    == nil
        (error = true; missing = "DBNAME")  if @db_name == nil

        if error
            raise "MySQL option #{missing} is needed"
        end

        # Check for defaults:
        @server = "localhost" if @server.nil?
        @port   = 0           if @port.nil?

        encoding if @encoding.nil?

        # Clean leading and trailing quotes, if any
        @server  = @server [1..-2] if @server [0] == ?"
        @port    = @port   [1..-2] if @port   [0] == ?"
        @user    = @user   [1..-2] if @user   [0] == ?"
        @passwd  = @passwd [1..-2] if @passwd [0] == ?"
        @db_name = @db_name[1..-2] if @db_name[0] == ?"
    end

    def bck_file(federated = false)
        t = Time.now

        bck_name = "#{VAR_LOCATION}/mysql_#{@server}_#{@db_name}_"

        bck_name << "federated_" if federated

        bck_name << "#{t.year}-#{t.month}-#{t.day}_"
        bck_name << "#{t.hour}:#{t.min}:#{t.sec}.sql"

        bck_name
    end

    def backup(bck_file, federated = false)
        cmd = "mysqldump -u #{@user} -p'#{@passwd}' -h #{@server} " <<
              "-P #{@port} "

        if federated
            cmd << " --add-drop-table #{@db_name} "
            cmd << FEDERATED_TABLES.join(' ')
        else
            cmd << "--add-drop-database --databases --add-drop-table #{@db_name} "
        end

        cmd << " > #{bck_file}"

        rc = system(cmd)

        if !rc
            raise "Unknown error running '#{cmd}'"
        end

        if federated
            cmd = "mysqldump -u #{@user} -p'#{@passwd}' -h #{@server} " <<
                  "-P #{@port} #{@db_name} logdb --where=\"fed_index!=-1\" "<<
                  " >> #{bck_file}"

            rc = system(cmd)

            if !rc
                raise "Unknown error running '#{cmd}'"
            end
        end

        puts "MySQL dump stored in #{bck_file}"
        puts "Use 'onedb restore' or restore the DB using the mysql command:"
        puts "mysql -u user -h server -P port db_name < backup_file"
        puts
    end

    def encoding
        @encoding = ''

        db_enc    = ''
        table_enc = ''

        connect_db

        @db.fetch('select default_character_set_name FROM information_schema.SCHEMATA'\
          " WHERE schema_name = \"#{@db_name}\"") do |row|
            db_enc = row[:default_character_set_name]
            db_enc ||= row[:DEFAULT_CHARACTER_SET_NAME]
        end

        @db.fetch('select CCSA.character_set_name FROM information_schema.`TABLES`'\
        ' T, information_schema.`COLLATION_CHARACTER_SET_APPLICABILITY` CCSA '\
        'WHERE CCSA.collation_name = T.table_collation AND T.table_schema = '\
        "\"#{@db_name}\" AND T.table_name = \"system_attributes\"") do |row|
            table_enc = row[:character_set_name]
            table_enc ||= row[:CHARACTER_SET_NAME]
        end

        if db_enc != table_enc && !table_enc.empty?
            raise "Table and database charset (#{db_enc}, #{table_enc}) differs"
        end

        @encoding = table_enc
    end

    def get_table_enconding(table)
        enconding = nil

        @db.fetch(
            'select CCSA.character_set_name FROM information_schema.' \
            '`TABLES` T, information_schema.' \
            '`COLLATION_CHARACTER_SET_APPLICABILITY` CCSA WHERE ' \
            'CCSA.collation_name = T.table_collation AND ' \
            "T.table_schema = '#{@db_name}' AND "\
            "T.table_name = '#{table}';"
        ) do |row|
            enconding = row[:character_set_name]
            enconding ||= row[:CHARACTER_SET_NAME]
        end

        table_to_nk(enconding)
    end

    def table_to_nk(enconding)
        case(enconding)
        when 'utf8mb4'
            'UTF-8'
        when 'utf16le'
            'UTF16LE'
        when 'utf16'
            'UTF16BE'
        when 'ucs2'
            'UCS2'
        when 'latin1'
            'ISO-8859-1'
        when 'latin2'
            'ISO-8859-2'
        when 'greek'
            'ISO-8859-7'
        when 'hebrew'
            'ISO-8859-8'
        when 'latin5'
            'ISO-8859-9'
        when 'sjis'
            'SHIFT-JIS'
        when 'ujis'
            'EUC-JP'
        when 'ascii'
            'ASCII'
        else
            # if no encoding found, use the default one
            NOKOGIRI_ENCODING
        end
    end

    def restore(bck_file, force=nil, federated=false)
        connect_db

        if !federated && !force && db_exists?
            raise "MySQL database #{@db_name} at #{@server} exists," <<
                  " use -f to overwrite."
        end

        rc = system("mysql -u #{@user} -p'#{@passwd}' -h #{@server} -P #{@port} #{@db_name} < #{bck_file}")
        if !rc
            raise "Error while restoring MySQL DB #{@db_name} at #{@server}."
        end

        puts "MySQL DB #{@db_name} at #{@server} restored."
    end

    def idx?(idx)
        query = "SHOW INDEX FROM #{idx[:table]} WHERE KEY_NAME = '#{idx[:name]}'"
        !@db.fetch(query).first.nil?
    end

    def create_idx(version = nil)
        type = :index_sql

        type = :index_sqlite unless @db.server_version >= 50600

        schema = get_schema(type, version)

        schema.each do |idx|
            next if idx? idx

            query = 'CREATE '
            query << idx[:type] if idx[:type]
            query << ' INDEX '
            query << " #{idx[:name]} ON #{idx[:table]} #{idx[:columns]};"

            @db.run query
        end
    end

    def delete_idx(version = nil)
        type = :index_sql

        type = :index_sqlite unless @db.server_version >= 50600

        schema = get_schema(type, version)

        return unless schema

        schema.each do |idx|
            next unless idx? idx

            query = 'DROP INDEX '
            query << "#{idx[:name]} ON #{idx[:table]} ;"

            @db.run query
        end
    end

    private

    def connect_db
        passwd = CGI.escape(@passwd)

        endpoint = "mysql2://#{@user}:#{passwd}@#{@server}:#{@port}/#{@db_name}"

        begin
            options = {}
            options[:encoding] = @encoding unless @encoding.empty?

            @db = Sequel.connect(endpoint, options)
        rescue Exception => e
            raise "Error connecting to DB: " + e.message
        end
    end
end

class BackEndSQLite < OneDBBacKEnd
    require 'fileutils'

    def initialize(file)
        if !file.nil?
            @sqlite_file = file
        else
            raise "SQLite database path not supplied."
        end
    end

    def bck_file(federated = false)
        t = Time.now
        bck_name = "#{VAR_LOCATION}/one.db_"

        bck_name << "federated_" if federated

        bck_name << "#{t.year}-#{t.month}-#{t.day}"
        bck_name << "_#{t.hour}:#{t.min}:#{t.sec}.bck"

        bck_name
    end

    def backup(bck_file, federated = false)
        if federated
            puts "Sqlite database backup of federated tables stored in #{bck_file}"

            File.open(bck_file, "w") do |f|
                f.puts "-- FEDERATED"
                FEDERATED_TABLES.each do |table|
                    f.puts "DROP TABLE IF EXISTS \"#{table}\";"
                end
                f.puts "DROP TABLE IF EXISTS \"logdb\";"
            end

            FEDERATED_TABLES.each do |table|
                Open3.popen3("sqlite3 #{@sqlite_file} '.dump #{table}' >> #{bck_file}") do |i,o,e,t|
                    stdout = o.read
                    if !stdout.empty?
                        puts stdout
                    end

                    stderr = e.read
                    if !stderr.empty?
                        stderr.lines.each do |line|
                            STDERR.puts line unless line.match(/^-- Loading/)
                        end
                    end
                end

            end

            rc = system("sqlite3 #{@sqlite_file} 'CREATE TABLE logdb_tmp AS SELECT * FROM logdb WHERE fed_index!=-1;'")

            if !rc
                raise "Error creating logdb_tmp."
            end

            Open3.popen3("sqlite3 #{@sqlite_file} '.dump logdb_tmp' >> #{bck_file}") do |i,o,e,t|
                stdout = o.read
                if !stdout.empty?
                    puts stdout
                end

                stderr = e.read
                if !stderr.empty?
                    stderr.lines.each do |line|
                        STDERR.puts line unless line.match(/^-- Loading/)
                    end
                end
            end

            rc = system("sqlite3 #{@sqlite_file} 'DROP TABLE logdb_tmp;'")

            if !rc
                raise "Error trying to drop the logdb tmp table."
            end

            File.write("#{bck_file}",File.open("#{bck_file}",&:read).gsub("logdb_tmp","logdb"))
        else
            connect_db

            File.open(bck_file, "w") do |file|
                @db.tables.each do |table|
                    file.puts "DROP TABLE IF EXISTS \"#{table}\";"
                end
            end

            puts "Sqlite database backup stored in #{bck_file}"
            system("sqlite3 #{@sqlite_file} .dump >> #{bck_file}")
        end

        puts "Use 'onedb restore' to restore the DB."
    end

    def get_table_enconding(table = nil)
        'UTF-8'
    end

    def restore(bck_file, force=nil, federated=false)
        if !federated
            if File.exist?(@sqlite_file) && !force
                raise "File #{@sqlite_file} exists, use -f to overwrite."
            end
        end

        system("sqlite3 #{@sqlite_file} < #{bck_file}")
        puts "Sqlite database backup restored in #{@sqlite_file}"
    end

    def idx?(idx)
        query = "SELECT * FROM sqlite_master WHERE type='index' AND name = '#{idx[:name]}'"

        !@db.fetch(query).first.nil?
    end

    def create_idx(version = nil)
        type = :index_sqlite

        schema = get_schema(type, version)

        schema.each do |idx|
            next if idx? idx

            query = 'CREATE INDEX '
            query << idx[:type] if idx[:type]
            query << " #{idx[:name]} ON #{idx[:table]} #{idx[:columns]};"

            @db.run query
        end
    end

    def delete_idx(version = nil)
        type = :index_sqlite

        schema = get_schema(type, version)

        return unless schema

        schema.each do |idx|
            next unless idx? idx

            query = 'DROP INDEX '
            query << " #{idx[:name]};"

            @db.run query
        end
    end

    private

    def connect_db
        if !File.exist?(@sqlite_file)
            raise "File #{@sqlite_file} doesn't exist"
        end

        begin
            @db = Sequel.sqlite(@sqlite_file)
            @db.integer_booleans = true
        rescue Exception => e
            raise "Error connecting to DB: " + e.message
        end
    end
end
