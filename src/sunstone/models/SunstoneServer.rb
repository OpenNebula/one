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

require 'CloudServer'

require 'OpenNebulaJSON'
include OpenNebulaJSON

require 'OpenNebulaVNC'
require 'OpenNebulaJSON/JSONUtils'
include JSONUtils

class SunstoneServer < CloudServer
    # FLAG that will filter the elements retrieved from the Pools
    POOL_FILTER = Pool::INFO_ALL

    # Secs to sleep between checks to see if image upload to repo is finished
    IMAGE_POLL_SLEEP_TIME = 5

    def initialize(client, config, logger)
        super(config, logger)
        @client = client
    end

    ############################################################################
    #
    ############################################################################
    def get_pool(kind,gid)
        if gid == "0"
            user_flag = Pool::INFO_ALL
        else
            user_flag = POOL_FILTER
        end

        pool = case kind
            when "group"      then GroupPoolJSON.new(@client)
            when "cluster"    then ClusterPoolJSON.new(@client)
            when "host"       then HostPoolJSON.new(@client)
            when "image"      then ImagePoolJSON.new(@client, user_flag)
            when "vmtemplate" then TemplatePoolJSON.new(@client, user_flag)
            when "vm"         then VirtualMachinePoolJSON.new(@client, user_flag)
            when "vnet"       then VirtualNetworkPoolJSON.new(@client, user_flag)
            when "user"       then UserPoolJSON.new(@client)
            when "acl"        then AclPoolJSON.new(@client)
            when "datastore"  then DatastorePoolJSON.new(@client)
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
            when "group"      then GroupJSON.new(Group.build_xml, @client)
            when "cluster"    then ClusterJSON.new(Group.build_xml, @client)
            when "host"       then HostJSON.new(Host.build_xml, @client)
            when "image"      then ImageJSON.new(Image.build_xml, @client)
            when "vmtemplate" then TemplateJSON.new(Template.build_xml, @client)
            when "vm"         then VirtualMachineJSON.new(VirtualMachine.build_xml,@client)
            when "vnet"       then VirtualNetworkJSON.new(VirtualNetwork.build_xml, @client)
            when "user"       then UserJSON.new(User.build_xml, @client)
            when "acl"        then AclJSON.new(Acl.build_xml, @client)
            when "datastore"  then DatastoreJSON.new(Acl.build_xml, @client)
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
    def upload(template, file_path)
        image_hash = parse_json(template, 'image')
        if OpenNebula.is_error?(image_hash)
            return [500, image_hash.to_json]
        end

        image_hash['PATH'] = file_path

        ds_id = parse_json(template, 'ds_id')
        if OpenNebula.is_error?(ds_id)
            return [500, ds_id.to_json]
        end
        
        new_template = {
            :image => image_hash,
            :ds_id => ds_id,
        }.to_json

        image = ImageJSON.new(Image.build_xml, @client)

        rc = image.create(new_template)

        if OpenNebula.is_error?(rc)
            return [500, rc.to_json]
        end

        image.info
        #wait until image is ready to return
        while (image.state_str == 'LOCKED') && (image['RUNNING_VMS'] == '0') do
            sleep IMAGE_POLL_SLEEP_TIME
            image.info
        end
        return [201, image.to_json]
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
    # Unused
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
                msg = "Log for VM #{id} not available"
                return [200, {:vm_log => msg}.to_json]
            end

            return [200, {:vm_log => log}.to_json]
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

        vnc_proxy = OpenNebulaVNC.new(config, logger)
        return vnc_proxy.start(resource)
    end

    ############################################################################
    #
    ############################################################################
    def stopvnc(pipe)
        begin
            OpenNebulaVNC.stop(pipe)
        rescue Exception => e
            logger.error {e.message}
            error = Error.new("Error stopping VNC. Please check server logs.")
            return [500, error.to_json]
        end

        return [200, nil]
    end

    ############################################################################
    #
    ############################################################################
    def get_pool_monitoring(resource, meters)
        #pool_element
        pool = case resource
            when "vm", "VM"
                VirtualMachinePool.new(@client)
            when "host", "HOST"
                HostPool.new(@client)
            else
                error = Error.new("Monitoring not supported for #{resource}")
                return [200, error.to_json]
            end

        meters_a = meters.split(',')

        rc = pool.monitoring(meters_a)

        if OpenNebula.is_error?(rc)
            error = Error.new(rc.message)
            return [500, error.to_json]
        end

        rc[:resource] = resource

        return [200, rc.to_json]
    end

    def get_resource_monitoring(id, resource, meters)
        pool_element = case resource
            when "vm", "VM"
                VirtualMachine.new_with_id(id, @client)
            when "host", "HOST"
                Host.new_with_id(id, @client)
            else
                error = Error.new("Monitoring not supported for #{resource}")
                return [200, error.to_json]
            end

        meters_a = meters.split(',')

        rc = pool_element.monitoring(meters_a)

        if OpenNebula.is_error?(rc)
            error = Error.new(rc.message)
            return [500, error.to_json]
        end

        meters_h = Hash.new
        meters_h[:resource]   = resource
        meters_h[:id]         = id
        meters_h[:monitoring] = rc

        return [200, meters_h.to_json]
    end

    private

    ############################################################################
    #
    ############################################################################
    def retrieve_resource(kind, id)
        resource = case kind
            when "group"      then GroupJSON.new_with_id(id, @client)
            when "cluster"    then ClusterJSON.new_with_id(id, @client)
            when "host"       then HostJSON.new_with_id(id, @client)
            when "image"      then ImageJSON.new_with_id(id, @client)
            when "vmtemplate" then TemplateJSON.new_with_id(id, @client)
            when "vm"         then VirtualMachineJSON.new_with_id(id, @client)
            when "vnet"       then VirtualNetworkJSON.new_with_id(id, @client)
            when "user"       then UserJSON.new_with_id(id, @client)
            when "acl"        then AclJSON.new_with_id(id, @client)
            when "datastore"  then DatastoreJSON.new_with_id(id, @client)
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
