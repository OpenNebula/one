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

require 'json'
require 'OpenNebula'

#
# This class provides support for launching and stopping a websockify proxy
#
class OpenNebulaVNC
    def initialize(config, logger, opt={:json_errors => true})
        @proxy_path      = config[:vnc_proxy_path]
        @proxy_base_port = config[:vnc_proxy_base_port].to_i

        @wss = config[:vnc_proxy_support_wss]

        if (@wss == "yes") || (@wss == "only") || (@wss == true)
            @enable_wss = true
            @cert       = config[:vnc_proxy_cert]
            @key        = config[:vnc_proxy_key]
        else
            @enable_wss = false
        end

        @options = opt
        @logger = logger
    end

    # Start a VNC proxy
    def start(vm_resource)
        # Check configurations and VM attributes

        if @proxy_path == nil || @proxy_path.empty?
            return error(403,"VNC proxy not configured")
        end

        if vm_resource['LCM_STATE'] != "3"
            return error(403,"VM is not running")
        end

        if vm_resource['TEMPLATE/GRAPHICS/TYPE'] != "vnc"
            return error(403,"VM has no VNC configured")
        end

        # Proxy data
        host     = vm_resource['/VM/HISTORY_RECORDS/HISTORY[last()]/HOSTNAME']
        vnc_port = vm_resource['TEMPLATE/GRAPHICS/PORT']

        proxy_port = @proxy_base_port + vnc_port.to_i

        proxy_options = ""

        if @enable_wss
            proxy_options << " --cert #{@cert}"
            proxy_options << " --key #{@key}" if @key && @key.size > 0
            proxy_options << " --ssl-only" if @wss == "only"
        end

        cmd ="#{@proxy_path} #{proxy_options} #{proxy_port} #{host}:#{vnc_port}"

        begin
            @logger.info { "Starting vnc proxy: #{cmd}" }
            pipe = IO.popen(cmd)
        rescue Exception => e
            return [500, OpenNebula::Error.new(e.message).to_json]
        end

        vnc_pw = vm_resource['TEMPLATE/GRAPHICS/PASSWD']
        info   = {:pipe => pipe, :port => proxy_port, :password => vnc_pw}

        return [200, info]
    end

    # Stop a VNC proxy handle exceptions outside
    def self.stop(pipe)
        Process.kill('KILL',pipe.pid)
        pipe.close
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
