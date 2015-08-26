# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

begin
    require 'sequel'
rescue LoadError
    STDERR.puts "Ruby gem sequel is needed for this operation:"
    STDERR.puts "  $ sudo gem install sequel"
    exit -1
end

class OneDBBacKEnd
    def read_db_version
        connect_db

        ret = {}

        begin
            ret[:version]   = "2.0"
            ret[:timestamp] = 0
            ret[:comment]   = ""

            @db.fetch("SELECT version, timestamp, comment FROM db_versioning " +
                      "WHERE oid=(SELECT MAX(oid) FROM db_versioning)") do |row|
                ret[:version]   = row[:version]
                ret[:timestamp] = row[:timestamp]
                ret[:comment]   = row[:comment]
            end

            ret[:local_version]   = ret[:version]
            ret[:local_timestamp] = ret[:timestamp]
            ret[:local_comment]   = ret[:comment]
            ret[:is_slave]        = false

            begin
               @db.fetch("SELECT version, timestamp, comment, is_slave FROM "+
                        "local_db_versioning WHERE oid=(SELECT MAX(oid) "+
                        "FROM local_db_versioning)") do |row|
                    ret[:local_version]   = row[:version]
                    ret[:local_timestamp] = row[:timestamp]
                    ret[:local_comment]   = row[:comment]
                    ret[:is_slave]        = row[:is_slave]
               end
            rescue Exception => e
                if e.class == Sequel::DatabaseConnectionError
                    raise e
                end
            end

            return ret

        rescue Exception => e
            if e.class == Sequel::DatabaseConnectionError
                raise e
            elsif !db_exists?
                # If the DB doesn't have db_version table, it means it is empty or a 2.x
                raise "Database schema does not look to be created by " <<
                      "OpenNebula: table user_pool is missing or empty."
            end

            begin
                # Table image_pool is present only in 2.X DBs
                @db.fetch("SELECT * FROM image_pool") { |row| }
            rescue
                raise "Database schema looks to be created by OpenNebula 1.X." <<
                      "This tool only works with databases created by 2.X versions."
            end

            comment = "Could not read any previous db_versioning data, " <<
                      "assuming it is an OpenNebula 2.0 or 2.2 DB."

            return ret
        end
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

        max_oid = nil
        @db.fetch("SELECT MAX(oid) FROM db_versioning") do |row|
            max_oid = row[:"MAX(oid)"].to_i
        end

        max_oid = 0 if max_oid.nil?

        query =
        @db.run(
            "INSERT INTO db_versioning (oid, version, timestamp, comment) "<<
            "VALUES ("                                                     <<
                "#{max_oid+1}, "                                           <<
                "'#{db_version}', "                                        <<
                "#{Time.new.to_i}, "                                       <<
                "'#{comment}')"
        )

        puts comment
    end

    def update_local_db_version(version)
        comment = "Database migrated from #{version} to #{db_version}"+
                  " (#{one_version}) by onedb command."

        max_oid = nil
        @db.fetch("SELECT MAX(oid) FROM local_db_versioning") do |row|
            max_oid = row[:"MAX(oid)"].to_i
        end

        max_oid = 0 if max_oid.nil?

        is_slave = 0

        @db.fetch("SELECT is_slave FROM local_db_versioning "<<
                  "WHERE oid=#{max_oid}") do |row|
            is_slave = row[:is_slave] ? 1 : 0
        end

        @db.run(
            "INSERT INTO local_db_versioning (oid, version, timestamp, comment, is_slave) "<<
            "VALUES ("                                                     <<
                "#{max_oid+1}, "                                           <<
                "'#{db_version}', "                                        <<
                "#{Time.new.to_i}, "                                       <<
                "'#{comment}',"                                            <<
                "#{is_slave})"
        )

        puts comment
    end

    def db()
        return @db
    end

    private

    def db_exists?
        begin
            found = false

            # User with ID 0 (oneadmin) always exists
            @db.fetch("SELECT * FROM user_pool WHERE oid=0") { |row|
                found = true
            }
        rescue
        end

        return found
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

        # Check for errors:
        error   = false

        (error = true; missing = "USER"  )  if @user    == nil
        (error = true; missing = "DBNAME")  if @db_name == nil

        if error
            raise "MySQL option #{missing} is needed"
        end

        # Check for defaults:
        @server = "localhost"   if @server.nil?
        @port   = 0             if @port.nil?

        # Clean leading and trailing quotes, if any
        @server  = @server [1..-2] if @server [0] == ?"
        @port    = @port   [1..-2] if @port   [0] == ?"
        @user    = @user   [1..-2] if @user   [0] == ?"
        @passwd  = @passwd [1..-2] if @passwd [0] == ?"
        @db_name = @db_name[1..-2] if @db_name[0] == ?"
    end

    def bck_file
        t = Time.now
        "#{VAR_LOCATION}/mysql_#{@server}_#{@db_name}_"<<
        "#{t.year}-#{t.month}-#{t.day}_#{t.hour}:#{t.min}:#{t.sec}.sql"
    end

    def backup(bck_file)
        cmd = "mysqldump -u #{@user} -p'#{@passwd}' -h #{@server} " +
              "-P #{@port} --add-drop-table #{@db_name} > #{bck_file}"

        rc = system(cmd)
        if !rc
            raise "Unknown error running '#{cmd}'"
        end

        puts "MySQL dump stored in #{bck_file}"
        puts "Use 'onedb restore' or restore the DB using the mysql command:"
        puts "mysql -u user -h server -P port db_name < backup_file"
        puts
    end

    def restore(bck_file, force=nil)
        connect_db

        if !force && db_exists?
            raise "MySQL database #{@db_name} at #{@server} exists," <<
                  " use -f to overwrite."
        end

        rc = system("mysql -u #{@user} -p'#{@passwd}' -h #{@server} -P #{@port} #{@db_name} < #{bck_file}")
        if !rc
            raise "Error while restoring MySQL DB #{@db_name} at #{@server}."
        end

        puts "MySQL DB #{@db_name} at #{@server} restored."
    end

    private

    def connect_db
        passwd = CGI.escape(@passwd)

        endpoint = "mysql://#{@user}:#{passwd}@#{@server}:#{@port}/#{@db_name}"

        begin
            @db = Sequel.connect(endpoint)
        rescue Exception => e
            raise "Error connecting to DB: " + e.message
        end
    end
end

class BackEndSQLite < OneDBBacKEnd
    require 'fileutils'

    def initialize(file)
        @sqlite_file = file
    end

    def bck_file
        t = Time.now
        "#{VAR_LOCATION}/one.db_"<<
        "#{t.year}-#{t.month}-#{t.day}_#{t.hour}:#{t.min}:#{t.sec}.bck"
    end

    def backup(bck_file)
        FileUtils.cp(@sqlite_file, "#{bck_file}")
        puts "Sqlite database backup stored in #{bck_file}"
        puts "Use 'onedb restore' or copy the file back to restore the DB."
        puts
    end

    def restore(bck_file, force=nil)
        if File.exists?(@sqlite_file) && !force
            raise "File #{@sqlite_file} exists, use -f to overwrite."
        end

        FileUtils.cp(bck_file, @sqlite_file)
        puts "Sqlite database backup restored in #{@sqlite_file}"
    end

    private

    def connect_db
        if !File.exists?(@sqlite_file)
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
