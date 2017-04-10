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

        hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool, false)

        if hpool.respond_to?(:message)
            msg = "Could not get OpenNebula HostPool: #{hpool.message}"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        rs = dc_folder.get_unimported_hosts(hpool,vcenter_client.vim.host)
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

        tpool = VCenterDriver::VIHelper.one_pool(OpenNebula::TemplatePool, false)

        if tpool.respond_to?(:message)
            msg = "Could not get OpenNebula TemplatePool: #{tpool.message}"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        templates = dc_folder.get_unimported_templates(vcenter_client, tpool, vcenter_client.vim.host)

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
        template_copy_ref = nil
        template = nil
        append = true
        lc_error = nil

        ref = params[:vcenter_ref]

        if !ref || ref.empty?
            msg = "No template ref specified"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        template = VCenterDriver::Template.new_from_ref(ref, vcenter_client)
        vc_uuid = vcenter_client.vim.serviceContent.about.instanceUuid
        dpool = VCenterDriver::VIHelper.one_pool(OpenNebula::DatastorePool)
        ipool = VCenterDriver::VIHelper.one_pool(OpenNebula::ImagePool)
        npool = VCenterDriver::VIHelper.one_pool(OpenNebula::VirtualNetworkPool)

        # POST params
        if @request_body && !@request_body.empty?
            body_hash = JSON.parse(@request_body)
            use_linked_clones = body_hash['use_linked_clones'] || false
            create_copy = body_hash['create_copy'] || false
            template_name = body_hash['template_name'] || ""

            if !use_linked_clones && (create_copy || !template_name.empty?)
                msg = "Should not set create template copy or template copy name if not using linked clones"
                logger.error("[vCenter] " + msg)
                error = Error.new(msg)
                error 403, error.to_json
            end

            if use_linked_clones && !create_copy && !template_name.empty?
                msg = "Should not set template copy name if create template copy hasn't been selected"
                logger.error("[vCenter] " + msg)
                error = Error.new(msg)
                error 403, error.to_json
            end

            if create_copy

                lc_error, template_copy_ref = template.create_template_copy(template_name)

                if template_copy_ref

                    template = VCenterDriver::Template.new_from_ref(template_copy_ref, vi_client)

                    one_template = VCenterDriver::Template.get_xml_template(template, vc_uuid, vi_client, vcenter_client.vim.host)

                    if one_template

                        lc_error, use_lc = template.create_delta_disks
                        if !lc_error
                            one_template[:one] << "\nVCENTER_LINKED_CLONES=\"YES\"\n"
                            t = one_template
                            append = false # t[:one] replaces the current template
                        end
                    else
                        lc_error = "Could not obtain the info from the template's copy"
                        template.delete_template if template_copy_ref
                    end
                end

            else
                lc_error, use_lc = template.create_delta_disks
                if !lc_error
                    append = true
                    t[:one] << "\nVCENTER_LINKED_CLONES=\"YES\"\n" if use_lc
                end
            end
        end

        # Create images or get disks information for template
        error, template_disks = template.import_vcenter_disks(vc_uuid, dpool, ipool)

        if !error.empty?
            append = false
            template.delete_template if template_copy_ref
            msg = error
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        t[:one] << template_disks

        # Create images or get nics information for template
        error, template_nics = template.import_vcenter_nics(vc_uuid, npool)

        if !error.empty?
            append = false
            template.delete_template if template_copy_ref
            msg = error
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        t[:one] << template_nics

        t[:lc_error] = lc_error
        t[:append] = append

        [200, t.to_json]
    rescue Exception => e
        template.delete_template if template_copy_ref
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

get '/vcenter/networks' do
    begin
        dc_folder = VCenterDriver::DatacenterFolder.new(vcenter_client)

        npool = VCenterDriver::VIHelper.one_pool(OpenNebula::VirtualNetworkPool, false)

        if npool.respond_to?(:message)
            msg = "Could not get OpenNebula VirtualNetworkPool: #{npool.message}"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        networks = dc_folder.get_unimported_networks(npool,vcenter_client.vim.host)

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

        dpool = VCenterDriver::VIHelper.one_pool(OpenNebula::DatastorePool, false)

        if dpool.respond_to?(:message)
            msg = "Could not get OpenNebula DatastorePool: #{dpool.message}"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end


        hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool, false)

        if hpool.respond_to?(:message)
            msg = "Could not get OpenNebula HostPool: #{hpool.message}"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end


        datastores = dc_folder.get_unimported_datastores(dpool, vcenter_client.vim.host, hpool)
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
