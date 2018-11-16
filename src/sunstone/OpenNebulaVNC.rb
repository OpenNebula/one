# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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

#
# This class provides support for launching and stopping a websockify proxy
#

require 'rubygems'
require 'json'
require 'opennebula'


if !ONE_LOCATION
    NOVNC_LOCK_FILE = "/var/lock/one/.novnc.lock"
else
    NOVNC_LOCK_FILE= ONE_LOCATION + "/var/.novnc.lock"
end

TOKEN_EXPIRE_SECONDS = 4

VNC_STATES = [
        #0,  #LCM_INIT
        #1,  #PROLOG
        #2,  #BOOT
        "3",  #RUNNING
        "4",  #MIGRATE
        #5,  #SAVE_STOP
        #6,  #SAVE_SUSPEND
        #7,  #SAVE_MIGRATE
        #8,  #PROLOG_MIGRATE
        #9,  #PROLOG_RESUME
        #10, #EPILOG_STOP
        #11, #EPILOG
        "12", #SHUTDOWN
        "13", #CANCEL
        #14, #FAILURE
        #15, #CLEANUP_RESUBMIT
        "16", #UNKNOWN
        "17", #HOTPLUG
        "18", #SHUTDOWN_POWEROFF
        #19, #BOOT_UNKNOWN
        #20, #BOOT_POWEROFF
        #21, #BOOT_SUSPENDED
        #22, #BOOT_STOPPED
        #23, #CLEANUP_DELETE
        "24", #HOTPLUG_SNAPSHOT
        "25", #HOTPLUG_NIC
        "26", #HOTPLUG_SAVEAS
        "27", #HOTPLUG_SAVEAS_POWEROFF
        "28", #HOTPLUG_SAVEAS_SUSPENDED
        "29", #SHUTDOWN_UNDEPLOY
        #30, #EPILOG_UNDEPLOY
        #31, #PROLOG_UNDEPLOY
        #32, #BOOT_UNDEPLOY
        #33, #HOTPLUG_PROLOG_POWEROFF
        #34, #HOTPLUG_EPILOG_POWEROFF
        #35, #BOOT_MIGRATE
        #36, #BOOT_FAILURE
        #37, #BOOT_MIGRATE_FAILURE
        #38, #PROLOG_MIGRATE_FAILURE
        #39, #PROLOG_FAILURE
        #40, #EPILOG_FAILURE
        #41, #EPILOG_STOP_FAILURE
        #42, #EPILOG_UNDEPLOY_FAILURE
        #43, #PROLOG_MIGRATE_POWEROFF
        #44, #PROLOG_MIGRATE_POWEROFF_FAILURE
        #45, #PROLOG_MIGRATE_SUSPEND
        #46, #PROLOG_MIGRATE_SUSPEND_FAILURE
        #47, #BOOT_UNDEPLOY_FAILURE
        #48, #BOOT_STOPPED_FAILURE
        #49, #PROLOG_RESUME_FAILURE
        #50, #PROLOG_UNDEPLOY_FAILURE
        #51, #DISK_SNAPSHOT_POWEROFF
        #52, #DISK_SNAPSHOT_REVERT_POWEROFF
        #53, #DISK_SNAPSHOT_DELETE_POWEROFF
        #54, #DISK_SNAPSHOT_SUSPENDED
        #55, #DISK_SNAPSHOT_REVERT_SUSPENDED
        #56, #DISK_SNAPSHOT_DELETE_SUSPENDED
        "57", #DISK_SNAPSHOT
        "58", #DISK_SNAPSHOT_REVERT
        #59, #DISK_SNAPSHOT_DELETE
        #60, #PROLOG_MIGRATE_UNKNOWN
        #61, #PROLOG_MIGRATE_UNKNOWN_FAILURE
        "62" #DISK_RESIZE
        #63, #DISK_RESIZE_POWEROFF
        #64  #DISK_RESIZE_UNDEPLOYED
]

class OpenNebulaVNC

    attr_reader :proxy_port

    def initialize(config, logger, options = {})
        opts={ :json_errors => true,
               :token_folder_name => 'sunstone_vnc_tokens'}.merge(options)

        @pipe = nil
        @token_folder = File.join(VAR_LOCATION, opts[:token_folder_name])
        @proxy_path   = File.join(SHARE_LOCATION, "websockify/websocketproxy.py")
        @proxy_port   = config[:vnc_proxy_port]

        @proxy_ipv6   = config[:vnc_proxy_ipv6]

        @wss = config[:vnc_proxy_support_wss]

        @lock_file = NOVNC_LOCK_FILE

        if (@wss == "yes") || (@wss == "only") || (@wss == true)
            @enable_wss = true
            @cert       = config[:vnc_proxy_cert]
            @key        = config[:vnc_proxy_key]
        else
            @enable_wss = false
        end
        @options = opts
        @logger = logger
    end

    def start
        if is_running?
            message="VNC server already running"
            STDERR.puts message
            @logger.info message
            return false
        end

        create_token_dir

        proxy_options = "--target-config=#{@token_folder} "

        if @enable_wss
            proxy_options << " --cert #{@cert}"
            proxy_options << " --key #{@key}" if @key && @key.size > 0
            proxy_options << " --ssl-only" if @wss == "only"
        end

        if @proxy_ipv6
            proxy_options << " -6"
        end

        system("which python2 >/dev/null 2>&1")
        python = $?.success? ? "python2" : "python"

        cmd ="#{python} #{@proxy_path} #{proxy_options} #{@proxy_port}"

        begin
            @logger.info { "Starting VNC proxy: #{cmd}" }
            pid=start_daemon(cmd, VNC_LOG)
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

        sleep 1

        if !is_running?
            message="Error starting VNC proxy"
            STDERR.puts message
            @logger.error message
            File.delete(@lock_file) if File.exist?(@lock_file)

            return false
        end

        STDOUT.puts "VNC proxy started"

        true
    end

    def proxy(vm_resource)
        # Check configurations and VM attributes
        if !is_running?
            return error(400, "VNC Proxy is not running")
        end

        if !VNC_STATES.include?(vm_resource['LCM_STATE'])
            return error(400,"Wrong state (#{vm_resource['LCM_STATE']}) to open a VNC session")
        end

        if vm_resource['TEMPLATE/GRAPHICS/TYPE'].nil? ||
           !(["vnc", "spice"].include?(vm_resource['TEMPLATE/GRAPHICS/TYPE'].downcase))
            return error(400,"VM has no VNC configured")
        end

        # Proxy data
        host       = vm_resource['/VM/HISTORY_RECORDS/HISTORY[last()]/HOSTNAME']
        vnc_port   = vm_resource['TEMPLATE/GRAPHICS/PORT']
        vnc_pw     = vm_resource['TEMPLATE/GRAPHICS/PASSWD']

        # If it is a vCenter VM
        if vm_resource['USER_TEMPLATE/HYPERVISOR'] == "vcenter"
            if vm_resource['MONITORING/VCENTER_ESX_HOST']
                host = vm_resource['MONITORING/VCENTER_ESX_HOST']
            else
                return error(400,"Could not determine the vCenter ESX host where the VM is running. Wait till the VCENTER_ESX_HOST attribute is retrieved once the host has been monitored")
            end
        end

        # Generate token random_str: host:port
        random_str = rand(36**20).to_s(36) #random string a-z0-9 length 20
        token = "#{random_str}: #{host}:#{vnc_port}"
        token_file = 'one-'+vm_resource['ID']

        # Create token file
        begin
            f = File.open(File.join(@token_folder, token_file), 'w')
            f.write(token)
            f.close
        rescue Exception => e
            @logger.error e.message
            return error(500, "Cannot create VNC proxy token")
        end

        info   = {
            :password => vnc_pw,
            :token => random_str,
            :vm_name => vm_resource['NAME']
        }

        return [200, info.to_json]
    end

    # Delete proxy token file
    def delete_token(filename)
        begin
            File.delete(File.join(@token_folder, filename))
        rescue => e
            @logger.error "Error deleting token file for VM #{vm_id}"
            @logger.error e.message
        end
    end

    def stop(force=false)
        pid=get_pid

        if pid
            @logger.info "Killing VNC proxy"

            signal=(force ? '-KILL' : '-TERM')
            Process.kill(signal ,pid)

            sleep 1

            begin
                Process.getpgid(pid)

                Process.kill('-KILL', pid)
            rescue
            end

            if is_running?
                message="VNC server is still running"
                STDERR.puts message
                logger.error message
                return false
            end

            delete_token_dir
        else
            message="VNC server is not running"
            @logger.info message
            STDERR.puts message
        end
        true
    end

    def status
        if is_running?
            STDOUT.puts "VNC is running"
            true
        else
            STDOUT.puts "VNC is NOT running"
            false
        end
    end

    private

    def error(code, msg)
        if @options[:json_errors]
            return [code,OpenNebula::Error.new(msg).to_json]
        else
            return [code,msg]
        end
    end

    def create_token_dir
        delete_token_dir
        begin
            Dir.mkdir(@token_folder) if !File.exist?(@token_folder)
        rescue Exception => e
            @logger.error "Cannot create token folder"
            @logger.error e.message
        end
    end

    def delete_token_dir
        if File.exist?(@token_folder)
            begin
                Dir.glob("#{@token_folder}/*").each do |file|
                    File.delete(file)
                end
            rescue => e
                @logger.error "Error deleting token folder"
                @logger.error e.message
            end
        end
    end

    def is_running?
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
    alias_method :get_pid, :is_running?

if RUBY_VERSION<'1.9'
    def spawn(*args)
        fork {
            command=args[0..-2]

            # Close stdin and point out and err to log file
            $stdout.reopen(VNC_LOG, "a")
            $stderr.reopen(VNC_LOG, "a")
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

