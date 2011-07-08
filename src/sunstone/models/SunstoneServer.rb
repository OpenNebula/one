# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'OpenNebulaJSON'
include OpenNebulaJSON

require 'acct/watch_client'

class SunstoneServer
    def initialize(username, password)
        # TBD one_client_user(name) from CloudServer
        @client = Client.new("dummy:dummy")
        @client.one_auth = "#{username}:#{password}"
    end

    ############################################################################
    #
    ############################################################################
    def self.authorize(user="", sha1_pass="")
        if user.empty? || sha1_pass.empty?
            return [401, false]
        end

        # TBD get_user_password(name) from CloudServer
        user_pool = UserPool.new(Client.new)
        rc = user_pool.info
        if OpenNebula.is_error?(rc)
            return [500, false]
        end

        user_pass = user_pool["USER[NAME=\"#{user}\"]/PASSWORD"]
        if user_pass == sha1_pass
            return [204, user_pool["USER[NAME=\"#{user}\"]/ID"]]
        else
            return [401, nil]
        end
    end

    ############################################################################
    #
    ############################################################################
    def get_pool(kind)
        user_flag = -2
        pool = case kind
            when "group"    then GroupPoolJSON.new(@client)
            when "host"     then HostPoolJSON.new(@client)
            when "image"    then ImagePoolJSON.new(@client, user_flag)
            when "template" then TemplatePoolJSON.new(@client, user_flag)
            when "vm"       then VirtualMachinePoolJSON.new(@client, user_flag)
            when "vnet"     then VirtualNetworkPoolJSON.new(@client, user_flag)
            when "user"     then UserPoolJSON.new(@client)
            else
                error = Error.new("Error: #{kind} resource not supported")
                return [404, error.to_json]
        end

        rc = pool.info
        if OpenNebula.is_error?(rc)
            return [500, rc.to_json]
        else
            return [200, pool.to_json]
        end
    end

    ############################################################################
    #
    ############################################################################
    def get_resource(kind, id)
        resource = retrieve_resource(kind, id)
        if OpenNebula.is_error?(resource)
            return [404, resource.to_json]
        else
            return [200, resource.to_json]
        end
    end

    ############################################################################
    #
    ############################################################################
    def get_template(kind,id)
        resource = retrieve_resource(kind,id)
        if OpenNebula.is_error?(resource)
            return [404, resource.to_json]
        else
            template_str = resource.template_str(true)
            return [200, {:template => template_str}.to_json]
        end
    end

    ############################################################################
    #
    ############################################################################
    def create_resource(kind, template)
        resource = case kind
            when "group"    then GroupJSON.new(Group.build_xml, @client)
            when "host"     then HostJSON.new(Host.build_xml, @client)
            when "image"    then ImageJSON.new(Image.build_xml, @client)
            when "template" then TemplateJSON.new(Template.build_xml, @client)
            when "vm"       then VirtualMachineJSON.new(VirtualMachine.build_xml,@client)
            when "vnet"     then VirtualNetworkJSON.new(VirtualNetwork.build_xml, @client)
            when "user"     then UserJSON.new(User.build_xml, @client)
            else
                error = Error.new("Error: #{kind} resource not supported")
                return [404, error.to_json]
        end

        rc = resource.create(template)
        if OpenNebula.is_error?(rc)
            return [500, rc.to_json]
        else
            resource.info
            return [201, resource.to_json]
        end
    end

    ############################################################################
    #
    ############################################################################
    def delete_resource(kind, id)
        resource = retrieve_resource(kind, id)
        if OpenNebula.is_error?(resource)
            return [404, resource.to_json]
        end

        rc = resource.delete
        if OpenNebula.is_error?(rc)
            return [500, rc.to_json]
        else
            return [204, resource.to_json]
        end
    end

    ############################################################################
    #
    ############################################################################
    def perform_action(kind, id, action_json)
        resource = retrieve_resource(kind, id)
        if OpenNebula.is_error?(resource)
            return [404, resource.to_json]
        end

        rc = resource.perform_action(action_json)
        if OpenNebula.is_error?(rc)
            return [500, rc.to_json]
        else
            return [204, resource.to_json]
        end
    end

    ############################################################################
    #
    ############################################################################
    def get_configuration(user_id)
        if user_id != "0"
            return [401, ""]
        end

        one_config = VAR_LOCATION + "/config"
        config = Hash.new

        begin
            cfg = File.read(one_config)
        rescue Exception => e
            error = Error.new("Error reading config: #{e.inspect}")
            return [500, error.to_json]
        end

        cfg.lines do |line|
            m=line.match(/^([^=]+)=(.*)$/)

            if m
                name=m[1].strip.upcase
                value=m[2].strip
                config[name]=value
            end
        end

        return [200, config.to_json]
    end

    ############################################################################
    #
    ############################################################################
    def get_vm_log(id)
        resource = retrieve_resource("vm", id)
        if OpenNebula.is_error?(resource)
            return [404, nil]
        else
            if !ONE_LOCATION
                vm_log_file = LOG_LOCATION + "/#{id}.log"
            else
                vm_log_file = LOG_LOCATION + "/#{id}/vm.log"
            end

            begin
                log = File.read(vm_log_file)
            rescue Exception => e
                return [200, "Log for VM #{id} not available"]
            end

            return [200, log]
        end
    end


    ########################################################################
    # VNC
    ########################################################################
    def startvnc(id, config)
        resource = retrieve_resource("vm", id)
        if OpenNebula.is_error?(resource)
            return [404, resource.to_json]
        end

        if resource['LCM_STATE'] != "3"
            error = OpenNebula::Error.new("VM is not running")
            return [403, error.to_json]
        end

        if resource['TEMPLATE/GRAPHICS/TYPE'] != "vnc"
            error = OpenNebula::Error.new("VM has no VNC configured")
            return [403, error.to_json]
        end

        # The VM host and its VNC port
        host = resource['HISTORY/HOSTNAME']
        vnc_port = resource['TEMPLATE/GRAPHICS/PORT']
        # The noVNC proxy_port
        proxy_port = config[:vnc_proxy_base_port].to_i + vnc_port.to_i

        begin
            novnc_cmd = "#{config[:novnc_path]}/utils/launch.sh"
            pipe = IO.popen("#{novnc_cmd} --listen #{proxy_port} \
                                          --vnc #{host}:#{vnc_port}")
        rescue Exception => e
            error = Error.new(e.message)
            return [500, error.to_json]
        end

        vnc_pw = resource['TEMPLATE/GRAPHICS/PASSWD']

        info = {:pipe => pipe, :port => proxy_port, :password => vnc_pw}
        return [200, info]
    end

    ############################################################################
    #
    ############################################################################
    def stopvnc(id,pipe)
        resource = retrieve_resource("vm", id)
        if OpenNebula.is_error?(resource)
            return [404, resource.to_json]
        end

        begin
            Process.kill('KILL',pipe.pid)
            pipe.close
        rescue Exception => e
            error = Error.new(e.message)
            return [500, error.to_json]
        end

        return [200, nil]
    end

    ############################################################################
    #
    ############################################################################

    def get_monitoring(id, resource, monitor_resources)
        watch_client = OneWatchClient::WatchClient.new
        columns = monitor_resources.split(',')

        rc = case resource
            when "vm","VM"
                if id
                    watch_client.vm_monitoring(id, columns)
                else
                    watch_client.vm_total(columns)
                end
            when "host","HOST"
                if id
                    watch_client.host_monitoring(id, columns)
                else
                    watch_client.host_total(columns)
                end
            else
                return [200, nil]
            end

        if rc.nil?
            error = Error.new("There is no monitoring information for #{resource} #{id}")
            return [500, error.to_json]
        end

        return [200, rc.to_json]
    end

    ############################################################################
    #
    ############################################################################

    ############################################################################
    #
    ############################################################################



    private

    def retrieve_resource(kind, id)
        resource = case kind
            when "group"    then GroupJSON.new_with_id(id, @client)
            when "host"     then HostJSON.new_with_id(id, @client)
            when "image"    then ImageJSON.new_with_id(id, @client)
            when "template" then TemplateJSON.new_with_id(id, @client)
            when "vm"       then VirtualMachineJSON.new_with_id(id, @client)
            when "vnet"     then VirtualNetworkJSON.new_with_id(id, @client)
            when "user"     then UserJSON.new_with_id(id, @client)
            else
                error = Error.new("Error: #{kind} resource not supported")
                return error
        end

        rc = resource.info
        if OpenNebula.is_error?(rc)
            return rc
        else
            return resource
        end
    end
end
