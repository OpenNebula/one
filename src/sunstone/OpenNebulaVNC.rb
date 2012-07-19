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

#
# This class provides support for launching and stopping a websockify proxy
#

require 'json'
require 'OpenNebula'

TOKEN_EXPIRE_SECONDS = 4

class OpenNebulaVNC

    attr_reader :proxy_port

    def initialize(config, logger,  opts={
                       :json_errors => true,
                       :token_folder_name => 'sunstone_vnc_tokens'})
        @pipe = nil
        @token_folder = File.join(VAR_LOCATION, opts[:token_folder_name])
        @proxy_path = config[:vnc_proxy_path]
        @proxy_port = config[:vnc_proxy_port] ||
                      config[:vnc_proxy_base_port] #deprecated

        @wss = config[:vnc_proxy_support_wss]

        if (@wss == "yes") || (@wss == "only") || (@wss == true)
            @enable_wss = true
            @cert       = config[:vnc_proxy_cert]
            @key        = config[:vnc_proxy_key]
        else
            @enable_wss = false
        end
        @options = opts
        @logger = logger

        begin
            Dir.mkdir(@token_folder)
        rescue Exception => e
            @logger.error "Cannot create token folder"
            @logger.error e.message
        end

    end

    def start
        if @proxy_path == nil || @proxy_path.empty?
            @logger.info "VNC proxy not configured"
            return
        end

        proxy_options = "--target-config=#{@token_folder} "

        if @enable_wss
            proxy_options << " --cert #{@cert}"
            proxy_options << " --key #{@key}" if @key && @key.size > 0
            proxy_options << " --ssl-only" if @wss == "only"
        end

        cmd ="python #{@proxy_path} #{proxy_options} #{@proxy_port}"

        begin
            @logger.info { "Starting VNC proxy: #{cmd}" }
            @pipe = IO.popen(cmd,'r')
        rescue Exception => e
            @logger.error e.message
            return
        end
    end

    def proxy(vm_resource)
        # Check configurations and VM attributes
        if !@pipe
            return error(400, "VNC Proxy is not running")
        end

        if vm_resource['LCM_STATE'] != "3"
            return error(400,"VM is not running")
        end

        if vm_resource['TEMPLATE/GRAPHICS/TYPE'] != "vnc"
            return error(400,"VM has no VNC configured")
        end

        # Proxy data
        host     = vm_resource['/VM/HISTORY_RECORDS/HISTORY[last()]/HOSTNAME']
        vnc_port = vm_resource['TEMPLATE/GRAPHICS/PORT']
        vnc_pw = vm_resource['TEMPLATE/GRAPHICS/PASSWD']

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
        }

        # Delete token soon after
        Thread.new do
            sleep TOKEN_EXPIRE_SECONDS
            delete_token(token_file)
        end

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

    def stop
        if !@pipe then return end
        @logger.info "Killing VNC proxy"
        Process.kill('TERM',@pipe.pid)
        @pipe.close
        begin
            Dir.rmdir(@token_folder)
        rescue => e
            @logger.error "Error deleting token folder"
            @logger.error e.message
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

end
