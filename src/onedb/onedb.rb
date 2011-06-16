ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
    LIB_LOCATION      = "/usr/lib/one"
    RUBY_LIB_LOCATION = LIB_LOCATION + "/ruby"
    VAR_LOCATION      = "/var/lib/one"
    ETC_LOCATION      = "/etc/one"
    LOCK_FILE         = "/var/lock/one/one"
else
    LIB_LOCATION      = ONE_LOCATION + "/lib"
    RUBY_LIB_LOCATION = LIB_LOCATION + "/ruby"
    VAR_LOCATION      = ONE_LOCATION + "/var"
    ETC_LOCATION      = ONE_LOCATION + "/etc"
    LOCK_FILE         = VAR_LOCATION + "/.lock"
end

require 'cloud/Configuration'
require 'onedb_backend'

class OneDB
    def initialize(ops)
        if ops[:backend]==nil
            @backend = from_onedconf
        else
            if ops[:backend] == :sqlite 
                @backend = BackEndSQLite.new(ops[:sqlite])
            else
                passwd = ops[:passwd]
                if !passwd
                    # Hide input characters
                    `stty -echo`
                    print "MySQL Password: "
                    passwd = STDIN.gets.strip
                    `stty echo`
                    puts ""
                end

                @backend = BackEndMySQL.new(
                    :server  => ops[:server],
                    :port    => ops[:port],
                    :user    => ops[:user],
                    :passwd  => passwd,
                    :db_name => ops[:db_name]
                )
            end
        end
    end

    def backup(bck_file, ops)
        bck_file = @backend.bck_file if bck_file.nil?

        if !ops[:force] && File.exists?(bck_file)
            puts "File #{bck_file} exists, backup aborted. Use -f to overwrite."
            exit -1
        end

        @backend.backup(bck_file)
    end

    def restore(bck_file, ops)
        bck_file = @backend.bck_file if bck_file.nil?

        if !File.exists?(bck_file)
            puts "File #{bck_file} doesn't exist, backup restoration aborted."
            exit -1
        end
        
        one_not_running
        
        @backend.restore(bck_file, ops[:force])
    end

    def version(ops)
        version, timestamp, comment = @backend.read_db_version
        
        if(ops[:verbose])
            puts "Version:   #{version}"

            time = version == 0 ? Time.now : Time.at(timestamp)
            # TODO: UTC or Local time?
            puts "Timestamp: #{time.getgm.strftime("%b %d, %Y %H:%M")}"
            puts "Comment:   #{comment}"
        else
            puts version
        end
    end

    def history
        @backend.history
    end

    def upgrade(max_version, ops)
        version, timestamp, comment = @backend.read_db_version
        
        if ops[:verbose]
            puts "Version read:"
            puts "#{version} : #{comment}"
            puts ""
        end
        
        migrator_version = version + 1
        result = nil
        file = "#{LIB_LOCATION}/onedb/#{migrator_version}.rb"

        if File.exists?(file) && 
                (max_version == nil || migrator_version <= max_version)
            # At least one upgrade will be executed, make DB backup
            if ops[:backup]
                bck_file = ops[:backup]
            else
                bck_file = @backend.bck_file(VAR_LOCATION)
            end

            @backend.backup(bck_file)
        end

        while File.exists?(file) &&
                (max_version == nil || migrator_version <= max_version)

            puts "  > Running migrator #{file}" if ops[:verbose]

            load(file)
            @backend.extend Migrator
            result = @backend.up

            if !result
                puts "Error while upgrading from #{migrator_version-1} to " <<
                     " #{@backend.db_version}"
                return -1
            end

            puts "  > Done" if ops[:verbose]
            puts "" if ops[:verbose]

            migrator_version += 1
            file = "#{LIB_LOCATION}/onedb/#{migrator_version}.rb"
        end
        
        # Modify db_versioning table
        if result != nil
            @backend.update_db_version(version)
        else
            puts "Database already uses version #{version}"
        end
    end

    private

    def from_onedconf()
        config = Configuration.new("#{ETC_LOCATION}/oned.conf")

        if config[:db] == nil
            puts "No DB defined."
            exit -1
        end

        if config[:db]["BACKEND"].upcase.include? "SQLITE"
            sqlite_file = "#{VAR_LOCATION}/one.db"
            @backend = BackEndSQLite.new(sqlite_file)
        elsif config[:db]["BACKEND"].upcase.include? "MYSQL"
            @backend = BackEndMySQL.new(
                :server  => config[:db]["SERVER"],
                :port    => config[:db]["PORT"],
                :user    => config[:db]["USER"],
                :passwd  => config[:db]["PASSWD"],
                :db_name => config[:db]["DB_NAME"]
            )
        else
            puts "Could not load DB configuration from " <<
                 "#{ETC_LOCATION}/oned.conf"
            exit -1
        end
    end

    def one_not_running()
        if File.exists?(LOCK_FILE)
            puts "First stop OpenNebula. Lock file found: #{LOCK_FILE}"
            exit -1
        end
    end
end