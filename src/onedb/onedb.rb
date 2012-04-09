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

require 'onedb_backend'

class OneDB
    def initialize(ops)
        if ops[:backend] == :sqlite
            @backend = BackEndSQLite.new(ops[:sqlite])
        elsif ops[:backend] == :mysql
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
        else
            raise "You need to specify the SQLite or MySQL connection options."
        end
    end

    def backup(bck_file, ops)
        bck_file = @backend.bck_file if bck_file.nil?

        if !ops[:force] && File.exists?(bck_file)
            raise "File #{bck_file} exists, backup aborted. Use -f " <<
                  "to overwrite."
        end

        @backend.backup(bck_file)
        return 0
    end

    def restore(bck_file, ops)
        bck_file = @backend.bck_file if bck_file.nil?

        if !File.exists?(bck_file)
            raise "File #{bck_file} doesn't exist, backup restoration aborted."
        end
        
        one_not_running
        
        @backend.restore(bck_file, ops[:force])
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

            while ( matches.size > 0 )
                if ( matches.size > 1 )
                    raise "There are more than one file that match \
                            \"#{RUBY_LIB_LOCATION}/onedb/#{version}_to_*.rb\""
                end

                file = matches[0]

                puts "  > Running migrator #{file}" if ops[:verbose]

                load(file)
                @backend.extend Migrator
                result = @backend.up

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

    private

    def one_not_running()
        if File.exists?(LOCK_FILE)
            raise "First stop OpenNebula. Lock file found: #{LOCK_FILE}"
        end
    end
end