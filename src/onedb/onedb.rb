# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'onedb_backend'

LOG_TIME = false

class OneDB
    def initialize(ops)
        if ops[:backend] == :sqlite
            begin
                require 'sqlite3'
            rescue LoadError
                STDERR.puts "Ruby gem sqlite3 is needed for this operation:"
                STDERR.puts "  $ sudo gem install sqlite3"
                exit -1
            end

            @backend = BackEndSQLite.new(ops[:sqlite])
        elsif ops[:backend] == :mysql
            begin
                require 'mysql'
            rescue LoadError
                STDERR.puts "Ruby gem mysql is needed for this operation:"
                STDERR.puts "  $ sudo gem install mysql"
                exit -1
            end

            passwd = ops[:passwd]
            if !passwd
                passwd = get_password
            end

            @backend = BackEndMySQL.new(
                :server  => ops[:server],
                :port    => ops[:port],
                :user    => ops[:user],
                :passwd  => passwd,
                :db_name => ops[:db_name]
            )
        else
            raise "You need to specify the SQLite or MySQL connection options."
        end
    end

    def get_password(question="MySQL Password: ")
        # Hide input characters
        `stty -echo`
        print question
        passwd = STDIN.gets.strip
        `stty echo`
        puts ""

        return passwd
    end

    def backup(bck_file, ops, backend=@backend)
        bck_file = backend.bck_file if bck_file.nil?

        if !ops[:force] && File.exists?(bck_file)
            raise "File #{bck_file} exists, backup aborted. Use -f " <<
                  "to overwrite."
        end

        backend.backup(bck_file)
        return 0
    end

    def restore(bck_file, ops, backend=@backend)
        bck_file = backend.bck_file if bck_file.nil?

        if !File.exists?(bck_file)
            raise "File #{bck_file} doesn't exist, backup restoration aborted."
        end

        one_not_running

        backend.restore(bck_file, ops[:force])
        return 0
    end

    def version(ops)
        version, timestamp, comment = @backend.read_db_version

        if(ops[:verbose])
            puts "Version:   #{version}"

            time = version == "2.0" ? Time.now : Time.at(timestamp)
            puts "Timestamp: #{time.strftime("%m/%d %H:%M:%S")}"
            puts "Comment:   #{comment}"
        else
            puts version
        end

        return 0
    end

    def history
        @backend.history
        return 0
    end

    # max_version is ignored for now, as this is the first onedb release.
    # May be used in next releases
    def upgrade(max_version, ops)
        version, timestamp, comment = @backend.read_db_version

        if ops[:verbose]
            puts "Version read:"
            puts "#{version} : #{comment}"
            puts ""
        end

        matches = Dir.glob("#{RUBY_LIB_LOCATION}/onedb/#{version}_to_*.rb")

        if ( matches.size > 0 )
            # At least one upgrade will be executed, make DB backup
            backup(ops[:backup], ops)
        end

        begin
            result = nil
            i = 0

            timea = Time.now

            while ( matches.size > 0 )
                if ( matches.size > 1 )
                    raise "There are more than one file that match \
                            \"#{RUBY_LIB_LOCATION}/onedb/#{version}_to_*.rb\""
                end

                file = matches[0]

                puts "  > Running migrator #{file}" if ops[:verbose]

                time0 = Time.now

                load(file)
                @backend.extend Migrator
                result = @backend.up

                time1 = Time.now

                if LOG_TIME
                    puts "  > Time for #{file}: #{time1 - time0}s"
                end

                if !result
                    raise "Error while upgrading from #{version} to " <<
                          " #{@backend.db_version}"
                end

                puts "  > Done" if ops[:verbose]
                puts "" if ops[:verbose]

                matches = Dir.glob(
                    "#{RUBY_LIB_LOCATION}/onedb/#{@backend.db_version}_to_*.rb")
            end

            # Modify db_versioning table
            if result != nil
                @backend.update_db_version(version)
            else
                puts "Database already uses version #{version}"
            end

            timeb = Time.now

            if LOG_TIME
                puts "  > Total time: #{timeb - timea}s" if ops[:verbose]
            end

            return 0

        rescue Exception => e
            puts e.message

            puts
            puts "The database will be restored"

            ops[:force] = true

            restore(ops[:backup], ops)

            return -1
        end
    end

    def fsck(ops)
        version, timestamp, comment = @backend.read_db_version

        if ops[:verbose]
            puts "Version read:"
            puts "#{version} : #{comment}"
            puts ""
        end

        file = "#{RUBY_LIB_LOCATION}/onedb/fsck.rb"

        if File.exists? file

            one_not_running()

            load(file)
            @backend.extend OneDBFsck

            if ( version != @backend.db_version )
                raise "Version mismatch: fsck file is for version "<<
                    "#{@backend.db_version}, current database version is #{version}"
            end

            # FSCK will be executed, make DB backup
            backup(ops[:backup], ops)

            begin
                puts "  > Running fsck" if ops[:verbose]

                time0 = Time.now

                result = @backend.fsck

                if !result
                    raise "Error running fsck version #{version}"
                end

                puts "  > Done" if ops[:verbose]
                puts "" if ops[:verbose]

                time1 = Time.now

                if LOG_TIME
                    puts "  > Total time: #{time1 - time0}s" if ops[:verbose]
                end

                return 0
            rescue Exception => e
                puts e.message

                puts "Error running fsck version #{version}"
                puts "The database will be restored"

                ops[:force] = true

                restore(ops[:backup], ops)

                return -1
            end
        else
            raise "No fsck file found in #{RUBY_LIB_LOCATION}/onedb/fsck.rb"
        end
    end

    def import_slave(ops)
        if ops[:backend] == :sqlite
            raise "Master DB must be MySQL"
        end

        passwd = ops[:slave_passwd]
        if !passwd
            passwd = get_password("Slave MySQL Password: ")
        end

        slave_backend = BackEndMySQL.new(
            :server  => ops[:slave_server],
            :port    => ops[:slave_port],
            :user    => ops[:slave_user],
            :passwd  => passwd,
            :db_name => ops[:slave_db_name]
        )

        version, timestamp, comment = @backend.read_db_version

        slave_version, slave_timestamp, slave_comment =
            slave_backend.read_db_version

        if ops[:verbose]
            puts "Master version read:"
            puts "#{version} : #{comment}"
            puts ""
            puts "Slave version read:"
            puts "#{slave_version} : #{slave_comment}"
            puts ""
        end

        file = "#{RUBY_LIB_LOCATION}/onedb/import_slave.rb"

        if File.exists? file

            one_not_running()

            load(file)
            @backend.extend OneDBImportSlave

            if ( version != @backend.db_version )
                raise "Version mismatch: import slave file is for version "<<
                    "#{@backend.db_version}, current master database version is #{version}"
            end

            if ( slave_version != @backend.db_version )
                raise "Version mismatch: import slave file is for version "<<
                    "#{@backend.db_version}, current slave database version is #{version}"
            end

            # Import will be executed, make DB backup
            backup(ops[:backup], ops)
            backup(ops[:"slave-backup"], ops, slave_backend)

            puts <<-EOT
Before running this tool, it is required to create a new Zone in the
Master OpenNebula.
Please enter the Zone ID that you created to represent the new Slave OpenNebula:
EOT

            input = ""
            while ( input.to_i.to_s != input ) do
                print "Zone ID: "
                input = gets.chomp.strip
            end

            zone_id = input.to_i
            puts

            puts <<-EOT
The import process will move the users from the slave OpeNenbula to the master
OpenNebula. In case of conflict, it can merge users with the same name.
For example:
+----------+-------------++------------+---------------+
| Master   | Slave       || With merge | Without merge |
+----------+-------------++------------+---------------+
| 5, alice | 2, alice    || 5, alice   | 5, alice      |
| 6, bob   | 5, bob      || 6, bob     | 6, bob        |
|          |             ||            | 7, alice-1    |
|          |             ||            | 8, bob-1      |
+----------+-------------++------------+---------------+

In any case, the ownership of existing resources and group membership
is preserved.

            EOT

            input = ""
            while !( ["Y", "N"].include?(input) ) do
                print "Do you want to merge USERS (Y/N): "
                input = gets.chomp.upcase
            end

            merge_users = input == "Y"
            puts

            input = ""
            while !( ["Y", "N"].include?(input) ) do
                print "Do you want to merge GROUPS (Y/N): "
                input = gets.chomp.upcase
            end

            merge_groups = input == "Y"

            begin
                puts "  > Running slave import" if ops[:verbose]

                result = @backend.import_slave(slave_backend, merge_users,
                    merge_groups, zone_id)

                if !result
                    raise "Error running slave import version #{version}"
                end

                puts "  > Done" if ops[:verbose]
                puts "" if ops[:verbose]

                return 0
            rescue Exception => e
                puts e.message

                puts "Error running slave import version #{version}"
                puts "The databases will be restored"

                ops[:force] = true

                restore(ops[:backup], ops)
                restore(ops[:"slave-backup"], ops, slave_backend)

                return -1
            end
        else
            raise "No slave import file found in #{RUBY_LIB_LOCATION}/onedb/import_slave.rb"
        end
    end


    private

    def one_not_running()
        if File.exists?(LOCK_FILE)
            raise "First stop OpenNebula. Lock file found: #{LOCK_FILE}"
        end
    end
end
