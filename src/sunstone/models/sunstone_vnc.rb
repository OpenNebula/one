# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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
require 'json'
require 'opennebula'
require 'sunstone_remotes'

if !ONE_LOCATION
    NOVNC_LOCK_FILE = '/var/lock/one/.novnc.lock'
else
    NOVNC_LOCK_FILE= ONE_LOCATION + '/var/.novnc.lock'
end

TOKEN_EXPIRE_SECONDS = 4

#
# This class provides support for launching and stopping a websockify proxy
#
class SunstoneVNC < SunstoneRemoteConnections

    attr_reader :proxy_port

    def initialize(config, logger, options = {})
        super(logger, options)

        # Add token folder to options
        opts = {
            :token_folder_name => 'sunstone_vnc_tokens'
        }.merge(@options)

        @options = opts

        # Create configuration variables
        @pipe = nil
        @token_folder = File.join(VAR_LOCATION, opts[:token_folder_name])
        @proxy_path   = File.join(SHARE_LOCATION, 'websockify/run')
        @proxy_port   = config[:vnc_proxy_port]

        @proxy_ipv6   = config[:vnc_proxy_ipv6]

        @wss = config[:vnc_proxy_support_wss]

        @lock_file = NOVNC_LOCK_FILE

        if (@wss == 'yes') || (@wss == 'only') || (@wss == true)
            @enable_wss = true
            @cert       = config[:vnc_proxy_cert]
            @key        = config[:vnc_proxy_key]
        else
            @enable_wss = false
        end
    end

    def start
        if running?
            message='VNC server already running'
            STDERR.puts message
            @logger.info message
            return false
        end

        create_token_dir

        proxy_options = "--target-config=#{@token_folder} "

        if @enable_wss
            proxy_options << " --cert #{@cert}"
            proxy_options << " --key #{@key}" if @key && !@key.empty?
            proxy_options << ' --ssl-only' if @wss == 'only'
        end

        if @proxy_ipv6
            proxy_options << ' -6'
        end

        python = 'python3' if system('python3 -c True')
        python = 'python' if system('python -c True')

        cmd ="#{python} #{@proxy_path} #{proxy_options} #{@proxy_port}"

        begin
            @logger.info { "Starting VNC proxy: #{cmd}" }
            pid=start_daemon(cmd, VNC_LOG)
        rescue StandardError => e
            @logger.error e.message
            return false
        end

        begin
            File.open(@lock_file, 'w') do |f|
                f.write(pid.to_s)
            end
        rescue StandardError => e
            @logger.error e.message
            Process.kill('-KILL', pid)

            return false
        end

        sleep 1

        if !running?
            message='Error starting VNC proxy'
            STDERR.puts message
            @logger.error message
            File.delete(@lock_file) if File.exist?(@lock_file)

            return false
        end

        STDOUT.puts 'VNC proxy started'

        true
    end

    def proxy(vm_resource)
        # Check configurations and VM attributes
        unless lockfile?
            return error(400, 'VNC Proxy is not running')
        end

        if !allowed_console_states.include?(vm_resource['LCM_STATE'])
            return error(
                400,
                "Wrong state (#{vm_resource['LCM_STATE']}) " \
                'to open a VNC session'
            )
        end

        if vm_resource['TEMPLATE/GRAPHICS/TYPE'].nil?
            return error(400, 'VM has no VNC configured')
        end

        include_vnc_or_spice = %w[vnc spice].include?(
            vm_resource['TEMPLATE/GRAPHICS/TYPE'].downcase
        )

        if !include_vnc_or_spice
            return error(400, 'VM has no VNC configured')
        end

        # Proxy data
        host       = vm_resource['/VM/HISTORY_RECORDS/HISTORY[last()]/HOSTNAME']
        vnc_port   = vm_resource['TEMPLATE/GRAPHICS/PORT']
        vnc_pw     = vm_resource['TEMPLATE/GRAPHICS/PASSWD']

        # If it is a vCenter VM
        if vm_resource['USER_TEMPLATE/HYPERVISOR'] == 'vcenter'
            unless vm_resource['MONITORING/VCENTER_ESX_HOST']
                return error(
                    400,
                    'Could not determine the vCenter ESX host where ' \
                    'the VM is running. Wait till the VCENTER_ESX_HOST ' \
                    'attribute is retrieved once the host has been monitored'
                )
            end

            host = vm_resource['MONITORING/VCENTER_ESX_HOST']
        end

        # Generate token random_str: host:port
        random_str = rand(36**20).to_s(36) # Random string a-z0-9 length 20
        token = "#{random_str}: #{host}:#{vnc_port}"
        token_file = 'one-'+vm_resource['ID']

        # Create token file
        begin
            f = File.open(File.join(@token_folder, token_file), 'w')
            f.write(token)
            f.close
        rescue StandardError => e
            @logger.error e.message
            return error(500, 'Cannot create VNC proxy token')
        end

        info = SunstoneVMHelper.get_remote_info(vm_resource)
        encode_info = Base64.encode64(info.to_json)

        info = {
            :password => vnc_pw,
            :token => random_str,
            :info => encode_info
        }

        [200, info.to_json]
    end

    # Delete proxy token file
    def delete_token(filename)
        begin
            File.delete(File.join(@token_folder, filename))
        rescue StandardError => e
            @logger.error "Error deleting token file for VM #{vm_id}"
            @logger.error e.message
        end
    end

    def stop
        pid=get_pid

        if pid
            @logger.info 'Killing VNC proxy'

            Process.kill('-KILL', pid)

            sleep 1

            if running?
                message = 'VNC server is still running'
                STDERR.puts message
                @logger.error message
                return false
            end

            delete_token_dir

            STDOUT.puts 'VNC proxy stopped'
        else
            message = 'VNC server is not running'
            @logger.info message
            STDERR.puts message
        end
        true
    end

    def status
        if running?
            STDOUT.puts 'VNC is running'
            true
        else
            STDOUT.puts 'VNC is NOT running'
            false
        end
    end

    private

    def create_token_dir
        delete_token_dir
        begin
            Dir.mkdir(@token_folder) unless File.exist?(@token_folder)
        rescue StandardError => e
            @logger.error 'Cannot create token folder'
            @logger.error e.message
        end
    end

    def delete_token_dir
        return unless File.exist?(@token_folder)

        begin
            Dir.glob("#{@token_folder}/*").each do |file|
                File.delete(file)
            end
        rescue StandardError => e
            @logger.error 'Error deleting token folder'
            @logger.error e.message
        end
    end

    def running?
        if File.exist?(@lock_file)
            pid=File.read(@lock_file).strip

            if system("ps #{pid} 1> /dev/null")
                return pid.to_i
            end

            @logger.info 'Deleting stale lock file'
            File.delete(@lock_file)
        end

        false
    end
    alias get_pid running?

    def lockfile?
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

    def start_daemon(cmd, log)
        options={
            :pgroup => true,
            :in => :close,
            [:out, :err] => [log, 'a'],
            :close_others => true
        }

        params=cmd.split(' ')+[options]
        pid=spawn(*params)

        Process.detach(pid)

        pid
    end

end
