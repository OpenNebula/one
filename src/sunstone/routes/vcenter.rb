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

if !ONE_LOCATION
    REMOTES_LOCATION="/var/lib/one/remotes"
else
    REMOTES_LOCATION=ONE_LOCATION+"/var/remotes"
end

# TODO vcenter_driver should be stored in RUBY_LIB_LOCATION
$: << REMOTES_LOCATION+"/vmm/vcenter/"

MAX_VCENTER_PASSWORD_LENGTH = 22 #This is the maximum length for a vCenter password

require 'vcenter_driver'

$importer = nil
$host_id = nil

helpers do
    def one_client(client=nil, conf={})
        options = { :subscriber_endpoint => conf[:subscriber_endpoint] }

        client = OpenNebula::Client.new(nil, conf[:one_xmlrpc], options) if client.nil?

        client
    end

    def vcenter_client
        hpref        = "HTTP-"
        head_user    = "X-VCENTER-USER"
        head_pwd     = "X-VCENTER-PASSWORD"
        head_vhost   = "X-VCENTER-HOST"
        reqenv       = request.env

        vuser = reqenv[head_user] ? reqenv[head_user] : reqenv[hpref+head_user]
        vpass = reqenv[head_pwd] ? reqenv[head_pwd] : reqenv[hpref+head_pwd]
        vhost = reqenv[head_vhost] ? reqenv[head_vhost] : reqenv[hpref+head_vhost]

        # Try with underscores
        if vuser.nil? || vpass.nil? || vhost.nil?
            hpref        = "HTTP_"
            head_user    = "X_VCENTER_USER"
            head_pwd     = "X_VCENTER_PASSWORD"
            head_vhost   = "X_VCENTER_HOST"

            vuser = reqenv[head_user] ? reqenv[head_user] : reqenv[hpref+head_user]
            vpass = reqenv[head_pwd] ? reqenv[head_pwd] : reqenv[hpref+head_pwd]
            vhost = reqenv[head_vhost] ? reqenv[head_vhost] : reqenv[hpref+head_vhost]
        end

        if vuser.nil? || vpass.nil? || vhost.nil?
            msg = "You have to provide the vCenter username, password and hostname"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        if vpass.size > MAX_VCENTER_PASSWORD_LENGTH
            begin
                client = one_client
                system = OpenNebula::System.new(client)
                config = system.get_configuration
                token = config["ONE_KEY"]
                vpass = VCenterDriver::VIClient::decrypt(vpass, token)

            rescue Exception => e
                msg = "I was unable to decrypt the vCenter password credentials"
                logger.error("[vCenter] #{e.message}/#{e.backtrace}. " + msg)
                error = Error.new(msg)
                error 404, error.to_json
            end
        end

        connection = {
            :user     => vuser,
            :password => vpass,
            :host     => vhost
        }

        if !vhost.nil? && vhost.split(":").length == 2
            connection[:host] = vhost.split(":")[0]
            connection[:port] = vhost.split(":")[1]
        end

        return VCenterDriver::VIClient.new(connection)
    end

    def return_error(code, msg)
        logger.error("[vCenter] " + msg.to_s)
        error = Error.new(msg.to_s)
        error code, error.to_json
    end

    def viclient_from_host(client)
        host_id = params["host"]

        VCenterDriver::VIClient.new_from_host(host_id, client) if host_id
    end

    def new_vcenter_importer(type, client=nil)
        host_id = params["host"]
        one_client = one_client(client)
        vi_client = VCenterDriver::VIClient.new_from_host(host_id, one_client) if host_id
        $importer = VCenterDriver::VcImporter.new_child(one_client, vi_client, type)
    end

end

get '/vcenter/hosts' do
    begin
        dc_folder = VCenterDriver::DatacenterFolder.new(vcenter_client)

        client = one_client

        VCenterDriver::VIHelper.set_client(nil, client)
        hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool, false)

        if hpool.respond_to?(:message)
            msg = "Could not get OpenNebula HostPool: #{hpool.message}"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        VCenterDriver::VIHelper.clean_ref_hash

        rs = dc_folder.get_unimported_hosts(hpool,vcenter_client.vim.host)
        [200, rs.to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

get '/vcenter/datastores' do
    begin
        client = one_client
        new_vcenter_importer("datastores", client)
        opts = {
          :host => params["host"]
        }
        resources_list = $importer.retrieve_resources(opts).to_json
        [200, resources_list]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

post '/vcenter/datastores' do
    begin
        $importer.process_import(params["datastores"])

        [200, $importer.output.to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

get '/vcenter/templates' do
    begin
        client = one_client
        new_vcenter_importer("templates", client)

        [200, $importer.retrieve_resources.to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

post '/vcenter/templates' do
    begin
        $importer.process_import(params["templates"], params["opts"])

        [200, $importer.output.to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

get '/vcenter/networks' do
    begin
        client = one_client
        $host_id = params["host"]
        new_vcenter_importer("networks", client)
        opts = {
            :host => params["host"],
            :filter => true,
            :short => true
        }
        resources_list = $importer.retrieve_resources(opts).to_json
        [200, resources_list]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

post '/vcenter/networks' do
    begin
        opts = params["opts"]
        opts[:host] = $host_id

        $importer.process_import(
            params["networks"],
            opts
        )

        [200, $importer.output.to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

get '/vcenter/images' do
    begin
        client = one_client
        new_vcenter_importer("images", client)

        VCenterDriver::VIHelper.set_client(nil, client)
        ds = VCenterDriver::VIHelper.one_item(OpenNebula::Datastore, params["ds"])

        opts = {
            ds_ref: ds['TEMPLATE/VCENTER_DS_REF'],
            one_item: ds
        }

        [200, $importer.retrieve_resources({datastore: opts}).to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

post '/vcenter/images' do
    begin
        $importer.process_import(params["images"])

        [200, $importer.output.to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

post '/vcenter/wild' do
    begin
        client = one_client
        vi_client = viclient_from_host(client)
        importer  = VCenterDriver::VmmImporter.new(client, vi_client).tap do |im|
            im.list(params["host"], params["opts"])
        end

        importer.process_import(params["wilds"])

        [200, importer.output.to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

post '/vcenter/register_hooks' do
  VCenterDriver::VcImporter.register_hooks
end
