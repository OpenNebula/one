# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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
    attr_accessor :backend

    def initialize(ops)
        # Set MySQL backend as default if any connection option is provided and --type is not
        if ops[:backend].nil? and (!ops[:server].nil? || !ops[:port].nil? || !ops[:user].nil? || !ops[:password].nil? || !ops[:db_name].nil? || !ops[:encoding].nil?)
            ops[:backend] = :mysql
        end

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
                require 'mysql2'
            rescue LoadError
                STDERR.puts "Ruby gem mysql2 is needed for this operation:"
                STDERR.puts "  $ sudo gem install mysql2"
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
                :db_name => ops[:db_name],
                :encoding=> ops[:encoding]
            )
        elsif ops[:backend] == :postgresql
            begin
                require 'pg'
            rescue
                STDERR.puts "Ruby gem pg is needed for this operation:"
                STDERR.puts "   $ sudo gem install pg"
                exit -1
            end

            passwd = ops[:passwd]
            if !passwd
                passwd = get_password("PostgreSQL Password: ")
            end

            @backend = BackEndPostgreSQL.new(
                :server  => ops[:server],
                :port    => ops[:port],
                :user    => ops[:user],
                :passwd  => passwd,
                :db_name => ops[:db_name],
                :encoding=> ops[:encoding]
            )
        else
            raise "You need to specify the SQLite, MySQL or PostgreSQL connection options."
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
        bck_file = backend.bck_file(ops[:federated]) if bck_file.nil?

        if !ops[:force] && File.exists?(bck_file)
            raise "File #{bck_file} exists, backup aborted. Use -f " <<
                  "to overwrite."
        end

        backend.backup(bck_file, ops[:federated])
        return 0
    end

    def restore(bck_file, ops, backend=@backend)
        if !File.exists?(bck_file)
            raise "File #{bck_file} doesn't exist, backup restoration aborted."
        end

        one_not_running

        backend.restore(bck_file, ops[:force], ops[:federated])
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

        ops[:backup] = @backend.bck_file if ops[:backup].nil?

        backup(ops[:backup], ops)

        begin
            timea = Time.now

            # Delete indexes
            @backend.delete_idx db_version[:local_version]

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

            # Generate indexes
            @backend.create_idx

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

            ops[:backup] = @backend.bck_file if ops[:backup].nil?

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

    def patch(file, ops)
        ret = @backend.read_db_version

        if ops[:verbose]
            pretty_print_db_version(ret)
            puts ""
        end

        if File.exists? file

            load(file)
            @backend.extend OneDBPatch

            if (!@backend.is_hot_patch(ops))
                one_not_running()
            end

            @backend.check_db_version(ops)

            ops[:backup] = @backend.bck_file if ops[:backup].nil?

            if (!@backend.is_hot_patch(ops))
                backup(ops[:backup], ops)
            end

            begin
                puts "  > Running patch #{file}" if ops[:verbose]

                time0 = Time.now

                result = @backend.patch(ops)

                if !result
                    raise "Error running patch #{file}"
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

                puts "Error running patch #{file}"
                if (!@backend.is_hot_patch(ops))
                    puts "The database will be restored"

                    ops[:force] = true

                    restore(ops[:backup], ops)
                end

                return -1
            end
        else
            raise "File was not found: #{file}"
        end
    end

    def sqlite2mysql(options, sqlite)
        one_not_running()

        sqlite_v = sqlite.backend.read_db_version
        mysql_v  = @backend.read_db_version

        match = true
        match = false if sqlite_v[:version] != mysql_v[:version]
        match = false if sqlite_v[:local_version] != mysql_v[:local_version]

        if !match
            err_msg =  "SQLite version: #{sqlite_v[:version]}\n"
            err_msg << "SQLite local version: #{sqlite_v[:local_version]}\n"
            err_msg << "MySQL version: #{mysql_v[:version]}\n"
            err_msg << "MySQL local version: #{mysql_v[:local_version]}\n"
            err_msg << "The MySQL and SQLite versions do not match. Please run "
            err_msg << "'onedb -i' in order to bootstrap a blank OpenNebula DB."

            raise err_msg
        end

        backup(options[:backup], options)

        file = "#{RUBY_LIB_LOCATION}/onedb/sqlite2mysql.rb"
        load(file)
        @backend.extend Sqlite2MySQL

        @backend.convert(sqlite.backend.db)

        return 0
    end

    def vcenter_one54(ops)
        @backend.read_db_version

        file = "#{RUBY_LIB_LOCATION}/onedb/vcenter_one54.rb"

        if File.exists? file
            load(file)
            @backend.extend One54Vcenter

            one_not_running()

            ops[:backup] = @backend.bck_file if ops[:backup].nil?

            # Migrator will be executed, make DB backup
            backup(ops[:backup], ops)

            begin
                time0 = Time.now

                puts "  > Migrating templates" if ops[:verbose]

                result = @backend.migrate_templates(ops[:verbose])

                if !result
                    raise "The migrator script didn't succeed"
                end

                puts "  > Migrating VMs" if ops[:verbose]

                result = @backend.migrate_vms(ops[:verbose])

                if !result
                    raise "The migrator script didn't succeed"
                end

                puts "  > Migrating hosts" if ops[:verbose]

                result = @backend.migrate_hosts(ops[:verbose])

                if !result
                    raise "The migrator script didn't succeed"
                end

                puts "  > Migrating datastores" if ops[:verbose]

                result = @backend.migrate_datastores(ops[:verbose])

                if !result
                    raise "The migrator script didn't succeed"
                end

                puts "  > Migrating vnets" if ops[:verbose]

                result = @backend.migrate_vnets(ops[:verbose])

                if !result
                    raise "The migrator script didn't succeed"
                end

                puts "  > Migrating images" if ops[:verbose]

                result = @backend.migrate_images(ops[:verbose])

                if !result
                    raise "The migrator script didn't succeed"
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

                puts "Error running migrator to OpenNebula 5.4 for vcenter"
                puts "The database will be restored"

                ops[:force] = true

                restore(ops[:backup], ops)

                return -1
            end
        else
            raise "No vcenter_one54 file found in #{RUBY_LIB_LOCATION}/onedb/vcenter_one54.rb"
        end
    end

    # Create or recreate FTS index on vm_pool search_token column
    #
    # @param recreate [Boolean] True to delete the index and create it again
    def fts_index(recreate = false)
        if backend.is_a? BackEndSQLite
            raise 'This is operation is not supported for sqlite backend'
        end

        backend.fts_index(recreate)
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
