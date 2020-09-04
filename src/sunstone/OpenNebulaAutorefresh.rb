# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

require 'opennebula'

##############################################################################
# Global Variables
##############################################################################

if !ONE_LOCATION
    AUTOREFRESH_LOCK_FILE = "/var/lock/one/.autorefresh.lock"
else
    AUTOREFRESH_LOCK_FILE = ONE_LOCATION + "/var/.autorefresh.lock"
end

KEEPALIVE_TIME = 15

LIB_LOCATION="/usr/lib/one"
SUNSTONE_SERVICES_LOCATION=LIB_LOCATION+"/sunstone/services"

##############################################################################
# Server
##############################################################################

class OpenNebulaAutorefresh
    def initialize(config, logger)
        # Basics
        @logger = logger

        # Autorefresh
        @lock_file = AUTOREFRESH_LOCK_FILE
        @server_ip = config[:autorefresh_ip]
        @server_port = config[:autorefresh_port]      
    end

    def start
        # Launch error if Autorefresh server is running
        if is_autorefresh_running?
            message="Autorefresh server already running"
            STDERR.puts message
            @logger.info message
            return false
        end

        config_dir = SUNSTONE_SERVICES_LOCATION + "/autorefresh"
        config_file = config_dir + "/config.ru"

        # Start Autorefresh server
        cmd = "thin start -R #{config_file} -p #{@server_port} -a #{@server_ip}";

        begin
            @logger.info { "Starting Autorefresh server: #{cmd}" }
            pid=start_daemon(cmd, AUTOREFRESH_LOG)
        rescue Exception => e
            @logger.error e.message
            return false
        end

        begin
            File.open(@lock_file, "w") do |f|
                f.write(pid.to_s)
            end
        rescue Exception => e
            @logger.error e.message
            Process.kill('-KILL', pid)

            return false
        end

        # Verify if Autorefresh server is running
        sleep 1

        if !is_autorefresh_running?
            message="Error starting Autorefresh server"
            STDERR.puts message
            @logger.error message
            File.delete(@lock_file) if File.exist?(@lock_file)

            return false
        end


        STDOUT.puts "Autorefresh server started"

        true

    end

    def stop(force=false)
        pid=get_autorefresh_pid

        if pid
            @logger.info "Killing Autorefresh server"

            signal=(force ? '-KILL' : '-TERM')
            Process.kill(signal ,pid)

            sleep 1

            begin
                Process.getpgid(pid)

                Process.kill('-KILL', pid)
            rescue
            end

            if is_autorefresh_running?
                message="Autorefresh server is still running"
                STDERR.puts message
                logger.error message
                return false
            end

        else
            message="Autorefresh server is not running"
            @logger.info message
            STDERR.puts message
        end
        true
    end

    def status
        if is_autorefresh_running?
            STDOUT.puts "Autorefresh server is running"
            true
        else
            STDOUT.puts "Autorefresh server is NOT running"
            false
        end
    end

    private

    def is_autorefresh_running?
        if File.exist?(@lock_file)
            pid=File.read(@lock_file).strip

            if system("ps #{pid} 1> /dev/null")
                return pid.to_i
            end

            @logger.info "Deleting stale lock file"
            File.delete(@lock_file)
        end

        false
    end
    alias_method :get_autorefresh_pid, :is_autorefresh_running?

    def is_lockfile?
        dn = File.dirname(@lock_file)
        bn = File.basename(@lock_file)

        # Due to restrictions which doesn't allow to stat the lock file
        # when Sunstone is running under Apache with SELinux enabled,
        # as a workaround we read content of the whole lock directory.
        begin
            Dir.entries(dn).include?(bn)
        rescue StandardError
            false
        end
    end

    if RUBY_VERSION<'1.9'
        def spawn(*args)
            fork {
                command=args[0..-2]
    
                # Close stdin and point out and err to log file
                $stdout.reopen(AUTOREFRESH_LOG, "a")
                $stderr.reopen(AUTOREFRESH_LOG, "a")
                $stdin.close
    
                # Detach process from the parent
                Process.setsid
    
                exec(*command)
            }
        end
    end

    def start_daemon(cmd, log)
        options={
            :pgroup => true,
            :in => :close,
            [:out, :err] => [log, "a"],
            :close_others => true }

        params=cmd.split(" ")+[options]
        pid=spawn( *params )

        Process.detach(pid)

        pid
    end
end
