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

require 'onedb_backend'

# If set to true, extra verbose time log will be printed for each migrator
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
        ret = @backend.read_db_version

        if(ops[:verbose])
            puts "Shared tables version:   #{ret[:version]}"

            time = ret[:version] == "2.0" ? Time.now : Time.at(ret[:timestamp])
            puts "Timestamp: #{time.strftime("%m/%d %H:%M:%S")}"
            puts "Comment:   #{ret[:comment]}"

            if ret[:local_version]
                puts
                puts "Local tables version:    #{ret[:local_version]}"

                time = Time.at(ret[:local_timestamp])
                puts "Timestamp: #{time.strftime("%m/%d %H:%M:%S")}"
                puts "Comment:   #{ret[:local_comment]}"

                if ret[:is_slave]
                    puts
                    puts "This database is a federation slave"
                end
            end

        else
            puts "Shared: #{ret[:version]}"
            puts "Local:  #{ret[:local_version]}"
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
        one_not_running()

        db_version = @backend.read_db_version

        if ops[:verbose]
            pretty_print_db_version(db_version)

            puts ""
        end

        backup(ops[:backup], ops)

        begin
            timea = Time.now

            # Upgrade shared (federation) tables, only for standalone and master
            if !db_version[:is_slave]
                puts
                puts ">>> Running migrators for shared tables"

                dir_prefix = "#{RUBY_LIB_LOCATION}/onedb/shared"

                result = apply_migrators(dir_prefix, db_version[:version], ops)

                # Modify db_versioning table
                if result != nil
                    @backend.update_db_version(db_version[:version])
                else
                    puts "Database already uses version #{db_version[:version]}"
                end
            end

            db_version = @backend.read_db_version

            # Upgrade local tables, for standalone, master, and slave

            puts
            puts ">>> Running migrators for local tables"

            dir_prefix = "#{RUBY_LIB_LOCATION}/onedb/local"

            result = apply_migrators(dir_prefix, db_version[:local_version], ops)

            # Modify db_versioning table
            if result != nil
                @backend.update_local_db_version(db_version[:local_version])
            else
                puts "Database already uses version #{db_version[:local_version]}"
            end

            timeb = Time.now

            puts
            puts "Total time: #{"%0.02f" % (timeb - timea).to_s}s" if ops[:verbose]

            return 0

        rescue Exception => e
            puts
            puts e.message
            puts e.backtrace.join("\n")
            puts

            puts
            puts "The database will be restored"

            ops[:force] = true

            restore(ops[:backup], ops)

            return -1
        end
    end

    def apply_migrators(prefix, db_version, ops)
        result = nil
        i = 0

        matches = Dir.glob("#{prefix}/#{db_version}_to_*.rb")

        while ( matches.size > 0 )
            if ( matches.size > 1 )
                raise "There are more than one file that match \
                        \"#{prefix}/#{db_version}_to_*.rb\""
            end

            file = matches[0]

            puts "  > Running migrator #{file}" if ops[:verbose]

            time0 = Time.now

            load(file)
            @backend.extend Migrator
            result = @backend.up

            time1 = Time.now

            if !result
                raise "Error while upgrading from #{db_version} to " <<
                      " #{@backend.db_version}"
            end

            puts "  > Done in #{"%0.02f" % (time1 - time0).to_s}s" if ops[:verbose]
            puts "" if ops[:verbose]

            matches = Dir.glob(
                "#{prefix}/#{@backend.db_version}_to_*.rb")
        end

        return result
    end

    def fsck(ops)
        ret = @backend.read_db_version

        if ops[:verbose]
            pretty_print_db_version(ret)
            puts ""
        end

        file = "#{RUBY_LIB_LOCATION}/onedb/fsck.rb"

        if File.exists? file

            one_not_running()

            load(file)
            @backend.extend OneDBFsck

            @backend.check_db_version()

            # FSCK will be executed, make DB backup
            backup(ops[:backup], ops)

            begin
                puts "  > Running fsck" if ops[:verbose]

                time0 = Time.now

                result = @backend.fsck

                if !result
                    raise "Error running fsck version #{ret[:version]}"
                end

                puts "  > Done" if ops[:verbose]
                puts "" if ops[:verbose]

                time1 = Time.now

                puts "  > Total time: #{"%0.02f" % (time1 - time0).to_s}s" if ops[:verbose]

                return 0
            rescue Exception => e
                puts
                puts e.message
                puts e.backtrace.join("\n")
                puts

                puts "Error running fsck version #{ret[:version]}"
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

        db_version = @backend.read_db_version

        slave_db_version = slave_backend.read_db_version

        if ops[:verbose]
            puts "Master database information:"
            pretty_print_db_version(db_version)
            puts ""
            puts ""
            puts "Slave database information:"
            pretty_print_db_version(slave_db_version)
            puts ""
        end

        file = "#{RUBY_LIB_LOCATION}/onedb/import_slave.rb"

        if File.exists? file

            one_not_running()

            load(file)
            @backend.extend OneDBImportSlave

            @backend.check_db_version(db_version, slave_db_version)

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
            puts

            input = ""
            while !( ["Y", "N"].include?(input) ) do
                print "Do you want to merge VDCS (Y/N): "
                input = gets.chomp.upcase
            end

            merge_vdcs = input == "Y"

            # Import will be executed, make DB backup
            backup(ops[:backup], ops)
            backup(ops[:"slave-backup"], ops, slave_backend)

            begin
                puts "  > Running slave import" if ops[:verbose]

                result = @backend.import_slave(slave_backend, merge_users,
                    merge_groups, merge_vdcs, zone_id)

                if !result
                    raise "Error running slave import"
                end

                puts "  > Done" if ops[:verbose]
                puts "" if ops[:verbose]

                return 0
            rescue Exception => e
                puts
                puts e.message
                puts e.backtrace.join("\n")
                puts

                puts "Error running slave import"
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

        client = OpenNebula::Client.new
        rc = client.get_version
        if !OpenNebula.is_error?(rc)
            raise "OpenNebula found listening on '#{client.one_endpoint}'"
        end
    end

    def pretty_print_db_version(db_version)
        puts "Version read:"
        puts "Shared tables #{db_version[:version]} : #{db_version[:comment]}"

        if db_version[:local_version]
            puts "Local tables  #{db_version[:local_version]} : #{db_version[:local_comment]}"
        end

        if db_version[:is_slave]
            puts
            puts "This database is a federation slave"
        end
    end
end
