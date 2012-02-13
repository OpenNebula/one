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


#This file provides support for launching and stopping a websockify proxy

require 'json'

class OpenNebulaVNC
    def initialize(config,opt={:json_errors => true})
        @proxy_path = config[:vnc_proxy_path]
        @proxy_base_port = config[:vnc_proxy_base_port].to_i
        @wss = config[:vnc_proxy_support_wss]
        @enable_wss = (@wss == "yes") || (@wss == "only") || (@wss == true)
        @cert = @enable_wss? config[:vnc_proxy_cert] : nil
        @key = @enable_wss? config[:vnc_proxy_key] : nil
        @options=opt
    end

    def error(code, msg)
        if @options[:json_errors]
            return [code,OpenNebula::Error.new(msg).to_json]
        else
            return [code,msg]
        end
    end

    def start(vm_resource)
        if vm_resource['LCM_STATE'] != "3"
            return error(403,"VM is not running")
        end

        if vm_resource['TEMPLATE/GRAPHICS/TYPE'] != "vnc"
            return error(403,"VM has no VNC configured")
        end

        # The VM host and its VNC port
        host = vm_resource['/VM/HISTORY_RECORDS/HISTORY[last()]/HOSTNAME']
        vnc_port = vm_resource['TEMPLATE/GRAPHICS/PORT']
        # The port on which the proxy will listen
        proxy_port = @proxy_base_port + vnc_port.to_i

        if !@proxy_path || @proxy_path.size == 0
            return error(403,"VNC proxy not configured")
        end

        proxy_options = ""

        if @enable_wss
            proxy_options += " --cert #{@cert}"
            proxy_options += " --key #{@key}" if @key && @key.size > 0
            proxy_options += " --ssl-only" if @wss == "only"
        end

        proxy_cmd = "#{@proxy_path} #{proxy_options} #{proxy_port} #{host}:#{vnc_port}"

        begin
            $stderr.puts("Starting vnc proxy: #{proxy_cmd}")
            pipe = IO.popen(proxy_cmd)
        rescue Exception => e
            error = Error.new(e.message)
            return [500, error.to_json]
        end

        vnc_pw = vm_resource['TEMPLATE/GRAPHICS/PASSWD']

        info = {:pipe => pipe, :port => proxy_port, :password => vnc_pw}
        return [200, info]
    end

    #handle exceptions outside
    def self.stop(pipe)
        Process.kill('KILL',pipe.pid)
        pipe.close
    end
end
