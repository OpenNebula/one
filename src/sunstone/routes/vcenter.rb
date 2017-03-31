# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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

require 'vcenter_driver'

helpers do
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

        return VCenterDriver::VIClient.new({
            :user     => vuser,
            :password => vpass,
            :host     => vhost})

    end

#    def af_format_response(resp)
#        if CloudClient::is_error?(resp)
#            logger.error("[OneFlow] " + resp.to_s)
#
#            error = Error.new(resp.to_s)
#            error resp.code.to_i, error.to_json
#        else
#            body resp.body.to_s
#        end
#    end
end

get '/vcenter' do
    begin
        dc_folder = VCenterDriver::DatacenterFolder.new(vcenter_client)
        rs = dc_folder.get_unimported_hosts
        [200, rs.to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

get '/vcenter/templates' do
    begin
        dc_folder = VCenterDriver::DatacenterFolder.new(vcenter_client)
        templates = dc_folder.get_unimported_templates(vcenter_client)

        if templates.nil?
            msg = "No datacenter found"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        [200, templates.to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

get '/vcenter/template/:vcenter_ref' do
    begin
        t = {}
        t[:one] = ""

        template = VCenterDriver::VirtualMachine.new_from_ref(params[:vcenter_ref], vcenter_client)

        vc_uuid = vcenter_client.vim.serviceContent.about.instanceUuid
        dpool = VCenterDriver::VIHelper.one_pool(OpenNebula::DatastorePool)
        ipool = VCenterDriver::VIHelper.one_pool(OpenNebula::ImagePool)
        npool = VCenterDriver::VIHelper.one_pool(OpenNebula::VirtualNetworkPool)

        # Create images or get disks information for template
        error, template_disks = template.import_vcenter_disks(vc_uuid, dpool, ipool)

        if !error.empty?
            msg = error
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        t[:one] << template_disks

        # Create images or get nics information for template
        error, template_nics = template.import_vcenter_nics(vc_uuid, npool)

        if !error.empty?
            msg = error
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        t[:one] << template_nics

        [200, t.to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

get '/vcenter/networks' do
    begin
        dc_folder = VCenterDriver::DatacenterFolder.new(vcenter_client)
        networks = dc_folder.get_unimported_networks

        if networks.nil?
            msg = "No datacenter found"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        [200, networks.to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

get '/vcenter/images/:ds_name' do
    begin
        one_ds = VCenterDriver::VIHelper.find_by_name(OpenNebula::DatastorePool,
                                                      params[:ds_name])
        one_ds_ref = one_ds['TEMPLATE/VCENTER_DS_REF']

        ds = VCenterDriver::Datastore.new_from_ref(one_ds_ref, vcenter_client)
        ds.one_item = one_ds

        images = ds.get_images

        if images.nil?
            msg = "No datastore found"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        [200, images.to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

get '/vcenter/datastores' do
    begin
        dc_folder = VCenterDriver::DatacenterFolder.new(vcenter_client)
        datastores = dc_folder.get_unimported_datastores
        if datastores.nil?
            msg = "No datacenter found"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        [200, datastores.to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end
