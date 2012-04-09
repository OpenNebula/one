# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'rubygems'
require 'sequel'

class OneDBBacKEnd
    def read_db_version
        connect_db

        version   = "2.0"
        timestamp = 0
        comment   = ""

        @db.fetch("SELECT version, timestamp, comment FROM db_versioning " +
                  "WHERE oid=(SELECT MAX(oid) FROM db_versioning)") do |row|
            version   = row[:version]
            timestamp = row[:timestamp]
            comment   = row[:comment]
        end

        return [version, timestamp, comment]

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

        return [version, timestamp, comment]
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
        "#{VAR_LOCATION}/mysql_#{@server}_#{@db_name}.sql"
    end

    def backup(bck_file)
        cmd = "mysqldump -u #{@user} -p#{@passwd} -h #{@server} " +
              "-P #{@port} #{@db_name} > #{bck_file}"

        rc = system(cmd)
        if !rc
            raise "Unknown error running '#{cmd}'"
        end

        puts "MySQL dump stored in #{bck_file}"
        puts "Use 'onedb restore' or restore the DB using the mysql command:"
        puts "mysql -u user -h server -P port db_name < backup_file"
    end

    def restore(bck_file, force=nil)
        connect_db

        if !force && db_exists?
            raise "MySQL database #{@db_name} at #{@server} exists," <<
                  " use -f to overwrite."
        end

        mysql_cmd = "mysql -u #{@user} -p#{@passwd} -h #{@server} -P #{@port} "

        drop_cmd = mysql_cmd + "-e 'DROP DATABASE IF EXISTS #{@db_name};'"
        rc = system(drop_cmd)
        if !rc
            raise "Error dropping MySQL DB #{@db_name} at #{@server}."
        end

        create_cmd = mysql_cmd+"-e 'CREATE DATABASE IF NOT EXISTS #{@db_name};'"
        rc = system(create_cmd)
        if !rc
            raise "Error creating MySQL DB #{@db_name} at #{@server}."
        end

        restore_cmd = mysql_cmd + "#{@db_name} < #{bck_file}"
        rc = system(restore_cmd)
        if !rc
            raise "Error while restoring MySQL DB #{@db_name} at #{@server}."
        end

        puts "MySQL DB #{@db_name} at #{@server} restored."
    end

    private

    def connect_db
        endpoint = "mysql://#{@user}:#{@passwd}@#{@server}:#{@port}/#{@db_name}"

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

        if !File.exists?(@sqlite_file)
            raise "File #{@sqlite_file} doesn't exist"
        end
    end

    def bck_file
        "#{VAR_LOCATION}/one.db.bck"
    end

    def backup(bck_file)
        FileUtils.cp(@sqlite_file, "#{bck_file}")
        puts "Sqlite database backup stored in #{bck_file}"
        puts "Use 'onedb restore' or copy the file back to restore the DB."
    end

    def restore(bck_file, force=nil)
        if !force
            raise "File #{@sqlite_file} exists, use -f to overwrite."
        end

        FileUtils.cp(bck_file, @sqlite_file)
        puts "Sqlite database backup restored in #{@sqlite_file}"
    end

    private

    def connect_db
        begin
            @db = Sequel.sqlite(@sqlite_file)
        rescue Exception => e
            raise "Error connecting to DB: " + e.message
        end
    end
end