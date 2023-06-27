# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    SQLITE_PATH = '/var/lib/one/one.db'
else
    SQLITE_PATH = ONE_LOCATION + '/var/one.db'
end

require 'onedb_backend'

require 'fiddle'
require 'zlib'

class RubyVM::InstructionSequence
    load_fn_addr  = Fiddle::Handle::DEFAULT['rb_iseq_load']
    load_fn       = Fiddle::Function.new(load_fn_addr,
                                         [Fiddle::TYPE_VOIDP] * 3,
                                          Fiddle::TYPE_VOIDP)

    define_singleton_method(:load) do |data, parent = nil, opt = nil|
        load_fn.call(Fiddle.dlwrap(data), parent, opt).to_value
    end
end

# If set to true, extra verbose time log will be printed for each migrator
LOG_TIME = false

class OneDB
    attr_accessor :backend

    CONNECTION_PARAMETERS = %i[server port user password db_name]

    def initialize(ops)
        if ops[:backend].nil? && CONNECTION_PARAMETERS.all? {|s| ops[s].nil? }
            ops = read_credentials(ops)
        elsif ops[:backend].nil? && CONNECTION_PARAMETERS.any? {|s| !ops[s].nil? }
            # Set MySQL backend as default if any connection option is provided and --type is not
            ops[:backend] = :mysql
        end

        if ops[:backend] == :sqlite
            ops[:sqlite] = SQLITE_PATH if ops[:sqlite].nil?

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
            passwd = ENV['ONE_DB_PASSWORD'] unless passwd
            passwd = get_password unless passwd

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

            passwd     = ops[:passwd]
            passwd     = ENV['ONE_DB_PASSWORD'] unless passwd
            passwd     = get_password("PostgreSQL Password: ") unless passwd
            ops[:port] = 5432 if ops[:port] == 0

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

    def read_credentials(ops)
        begin
            # Suppress augeas require warning message
            $VERBOSE = nil

            gem 'augeas', '~> 0.6'
            require 'augeas'
        rescue Gem::LoadError
            STDERR.puts(
                'Augeas gem is not installed, run `gem install ' \
                'augeas -v \'0.6\'` to install it'
            )
            exit(-1)
        end

        work_file_dir  = File.dirname(ONED_CONF)
        work_file_name = File.basename(ONED_CONF)

        aug = Augeas.create(:no_modl_autoload => true,
                            :no_load          => true,
                            :root             => work_file_dir,
                            :loadpath         => ONED_CONF)

        aug.clear_transforms
        aug.transform(:lens => 'Oned.lns', :incl => work_file_name)
        aug.context = "/files/#{work_file_name}"
        aug.load

        ops[:backend] = aug.get('DB/BACKEND')
        ops[:server]  = aug.get('DB/SERVER')
        ops[:port]    = aug.get('DB/PORT')
        ops[:user]    = aug.get('DB/USER')
        ops[:passwd]  = aug.get('DB/PASSWD')
        ops[:db_name] = aug.get('DB/DB_NAME')

        ops.each do |k, v|
            next if !v || !(v.is_a? String)

            ops[k] = v.chomp('"').reverse.chomp('"').reverse
        end

        ops.each {|_, v| v.gsub!("\\", '') if v && (v.is_a? String) }

        ops[:backend] = ops[:backend].to_sym unless ops[:backend].nil?
        ops[:port]    = ops[:port].to_i

        ops
    rescue StandardError => e
        STDERR.puts "Unable to parse oned.conf: #{e}"
        exit(-1)
    end

    def backup(bck_file, ops, backend=@backend)
        bck_file = backend.bck_file(ops[:federated]) if bck_file.nil?

        if !ops[:force] && File.exist?(bck_file)
            raise "File #{bck_file} exists, backup aborted. Use -f " <<
                  "to overwrite."
        end

        backend.backup(bck_file, ops[:federated])
        return 0
    end

    def restore(bck_file, ops, backend=@backend)
        if !File.exist?(bck_file)
            raise "File #{bck_file} doesn't exist, backup restoration aborted."
        end

        one_not_running

        backend.restore(bck_file, ops[:force], ops[:federated])
        return 0
    end

    def version(ops)
        ret = @backend.read_db_version

        if ops[:verbose]
            puts "Shared tables version:   #{ret[:version]}"
            puts "Required version:        #{ret[:oned_version]}"

            time = Time.at(ret[:timestamp])
            puts "Timestamp: #{time.strftime('%m/%d %H:%M:%S')}"
            puts "Comment:   #{ret[:comment]}"

            if ret[:local_version]
                puts
                puts "Local tables version:    #{ret[:local_version]}"
                puts "Required version:        #{ret[:oned_local_version]}"
                time = Time.at(ret[:local_timestamp])
                puts "Timestamp: #{time.strftime('%m/%d %H:%M:%S')}"
                puts "Comment:   #{ret[:local_comment]}"

                if ret[:is_slave]
                    puts
                    puts 'This database is a federation slave'
                end
            end

            puts
        else
            puts "Shared: #{ret[:version]}"
            puts "Local:  #{ret[:local_version]}"
            puts "Required shared version: #{ret[:oned_version]}"
            puts "Required local version:  #{ret[:oned_local_version]}"
        end

        need_update = update_available(ret)
        if need_update[0] # Needs some update
            case need_update[1]
            when 2 # DB version < src version
                puts
                puts "Update required. Expected DB version is:\n"\
                     "Local:  #{ret[:oned_local_version]}\n"\
                     "Shared: #{ret[:oned_version]}"

                return need_update[1]
            when 3 # DB version > src version
                puts
                puts 'WARNING: Source version is lower than DB version'

                return need_update[1]
            end
        end

        0
    end

    def history
        @backend.history
        return 0
    end

    # max_version is ignored for now, as this is the first onedb release.
    # May be used in next releases
    def upgrade(max_version, ops)
        one_not_running()

        begin
            db_version = @backend.read_db_version
        rescue Exception => e
            puts
            puts e.message
            puts e.backtrace.join("\n")
            puts
            puts
            puts 'There was a failure retrieving the DB version.'

            return -2
        end

        if !update_available(db_version)[0]
            puts 'Database schema is up to date.'

            return 0
        end

        if ops[:verbose]
            pretty_print_db_version(db_version)

            puts ''
        end

        if !ops.include?(:no_backup)
            ops[:backup] = @backend.bck_file if ops[:backup].nil?

            backup(ops[:backup], ops)
        end

        begin
            timea = Time.now

            # Delete indexes
            @backend.delete_idx db_version[:local_version]

            # Upgrade shared (federation) tables, only for standalone and master
            if !db_version[:is_slave]
                puts
                puts ">>> Running migrators for shared tables"

                dir_prefix = "#{RUBY_LIB_LOCATION}/onedb/shared"

                result, found = apply_migrators(dir_prefix, 'rb', db_version[:version], ops)
                result, _     = apply_migrators(dir_prefix, 'rbm', db_version[:version], ops) unless found

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

            result, found = apply_migrators(dir_prefix, 'rb', db_version[:local_version], ops)
            result,_      = apply_migrators(dir_prefix, 'rbm', db_version[:local_version], ops) unless found

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

            db_version = @backend.read_db_version
            local      = db_version[:local_version]
            shared     = db_version[:version]

            return 0 if local == OneDBBacKEnd::LATEST_LOCAL_DB_VERSION &&
                        shared == OneDBBacKEnd::LATEST_DB_VERSION

            STDERR.puts 'ERROR: Database upgrade to the latest versions ' \
                        "(local #{local}, shared #{shared})\nwasn't successful " \
                        'due to missing migration descriptors. Migrators ' \
                        "are\nprovided as part of Enterprise Edition for " \
                        "customers with active subscription.\nFor community " \
                        'with non-commercial deployments they are provided ' \
                        "via a\ndedicated migration package, which must be " \
                        'obtained separately.'

            puts
            puts 'The database will be restored'
            restore(ops[:backup], :force => true)

            -1
        rescue Exception => e
            puts
            puts e.message
            puts e.backtrace.join("\n")
            puts

            puts
            puts 'The database will be restored'

            ops[:force] = true

            if !ops.include?(:no_backup)
                restore(ops[:backup], ops)
            else
                puts 'WARNING: No backup has been restored as --no-backup'\
                     ' flag was set. Note that DB state migh be inconsistent.'
            end

            -1
        end
    end

    def load_bytecode(file)
        file = File.open(file, 'rb')
        data = file.read

        file.close

        data = Zlib::Inflate.inflate(data)
        data = Marshal.load(data)

        c_ruby_version = Gem::Version.new(data.to_a[1..2].join('.'))
        i_ruby_version = Gem::Version.new(RUBY_VERSION.split('.')[0..1].join('.'))

        if c_ruby_version != i_ruby_version
            raise 'Attemp to run migrators compiled in other version' \
                "Compiled: #{c_ruby_version}, installed: #{i_ruby_version}"
        end

        new_iseq = RubyVM::InstructionSequence.load(data)
        new_iseq.eval
    end

    def apply_migrators(prefix, suffix, db_version, ops)
        result  = nil
        found   = false
        matches = Dir.glob("#{prefix}/#{db_version}_to_*.#{suffix}")

        while ( matches.size > 0 )
            if ( matches.size > 1 )
                raise "There are more than one file that match \
                        \"#{prefix}/#{db_version}_to_*.#{suffix}\""
            end

            found = true
            file  = matches[0]

            puts "  > Running migrator #{file}" if ops[:verbose]

            time0 = Time.now

            if suffix == 'rb'
                load(file)
            else
                load_bytecode(file)
            end

            @backend.extend Migrator

            result = @backend.up
            time1  = Time.now

            if !result
                raise "Error while upgrading from #{db_version} to " <<
                        " #{@backend.db_version}"
            end

            puts "  > Done in #{"%0.02f" % (time1 - time0).to_s}s" if ops[:verbose]
            puts "" if ops[:verbose]

            matches = Dir.glob(
                "#{prefix}/#{@backend.db_version}_to_*.#{suffix}")
        end

        [result, found]
    end

    def fsck(ops)
        ret = @backend.read_db_version

        if ops[:verbose]
            pretty_print_db_version(ret)
            puts ""
        end

        file = "#{RUBY_LIB_LOCATION}/onedb/fsck.rb"

        if File.exist? file

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

        if File.exist? file

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

        if File.exist? file
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
        if File.exist?(LOCK_FILE)
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

    # db_version must be retrieved using corresponding function of @backend
    def update_available(db_version)
        local  = db_version[:local_version]
        shared = db_version[:version]
        source = OneDBBacKEnd::LATEST_DB_VERSION
        source_local = OneDBBacKEnd::LATEST_LOCAL_DB_VERSION

        shared_upgrade = Gem::Version.new(shared) < Gem::Version.new(source)
        local_upgrade  = Gem::Version.new(local)  < Gem::Version.new(source_local)

        # One needs to be lower than current version as sometimes the DB schema
        # have been increased only for local or shared.
        return [true, 2] if shared_upgrade || local_upgrade

        shared_new = Gem::Version.new(shared) > Gem::Version.new(source)
        local_new  = Gem::Version.new(local)  > Gem::Version.new(source_local)

        # Both version should be higher than source.
        return [true, 3] if shared_new || local_new

        [false, 0]
    end

end
