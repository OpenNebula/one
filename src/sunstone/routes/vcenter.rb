# -------------------------------------------------------------------------- #
# Copyright 2002-2017, OpenNebula Project, OpenNebula Systems                #
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

        if vpass.size > MAX_VCENTER_PASSWORD_LENGTH
            begin
                client = OpenNebula::Client.new
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

        templates = dc_folder.get_unimported_templates(vcenter_client, tpool)

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

post '/vcenter/image_rollback/:image_id' do
    begin
        image_id = params[:image_id]
        one_image = VCenterDriver::VIHelper.one_item(OpenNebula::Image, image_id.to_s, false)

        if OpenNebula.is_error?(one_image)
            raise "Error finding image #{image_id}: #{rc.message}\n"
        end

        rc =  one_image.delete
        if OpenNebula.is_error?(rc)
            raise "Error deleting image #{image_id}: #{rc.message}\n"
        end

        [200, "Image #{image_id} deleted in rollback.".to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

post '/vcenter/network_rollback/:network_id' do
    begin
        network_id = params[:network_id]
        one_vnet = VCenterDriver::VIHelper.one_item(OpenNebula::VirtualNetwork, network_id.to_s, false)

        if OpenNebula.is_error?(one_vnet)
            raise "Error finding network #{network_id}: #{rc.message}\n"
        end

        rc =  one_vnet.delete
        if OpenNebula.is_error?(rc)
            raise "Error deleting network #{network_id}: #{rc.message}\n"
        end

        [200, "Network #{network_id} deleted in rollback.".to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

post '/vcenter/template_rollback/:template_id' do
    begin
        template_id = params[:template_id]
        one_template = VCenterDriver::VIHelper.one_item(OpenNebula::Template, template_id.to_s, false)

        if OpenNebula.is_error?(one_template)
            raise "Error finding template #{template_id}: #{rc.message}\n"
        end

        rc =  one_template.delete
        if OpenNebula.is_error?(rc)
            raise "Error deleting template #{template_id}: #{rc.message}\n"
        end

        [200, "Template #{template_id} deleted in rollback.".to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

post '/vcenter/wild_rollback/:vm_id' do
    begin
        vm_id = params[:vm_id]
        one_vm = VCenterDriver::VIHelper.one_item(OpenNebula::VirtualMachine, vm_id.to_s, false)

        if OpenNebula.is_error?(one_vm)
            raise "Error finding VM #{vm_id}: #{rc.message}\n"
        end

        rc =  one_vm.delete
        if OpenNebula.is_error?(rc)
            raise "Error deleting VM #{vm_id}: #{rc.message}\n"
        end

        [200, "VM #{vm_id} deleted in rollback.".to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end


post '/vcenter/template/:vcenter_ref/:template_id' do
    begin
        t = {}
        t[:one] = ""
        template_copy_ref = nil
        template = nil
        append = true
        lc_error = nil

        ref         = params[:vcenter_ref]
        template_id = params[:template_id]

        if !ref || ref.empty?
            msg = "No template ref specified"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        template = VCenterDriver::Template.new_from_ref(ref, vcenter_client)

        vc_uuid = vcenter_client.vim.serviceContent.about.instanceUuid

        dpool = VCenterDriver::VIHelper.one_pool(OpenNebula::DatastorePool)

        if dpool.respond_to?(:message)
            msg = "Could not get OpenNebula DatastorePool: #{dpool.message}"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        ipool = VCenterDriver::VIHelper.one_pool(OpenNebula::ImagePool)
        if ipool.respond_to?(:message)
            msg = "Could not get OpenNebula ImagePool: #{ipool.message}"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        npool = VCenterDriver::VIHelper.one_pool(OpenNebula::VirtualNetworkPool)
        if npool.respond_to?(:message)
            msg = "Could not get OpenNebula VirtualNetworkPool: #{npool.message}"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool)
        if hpool.respond_to?(:message)
            msg = "Could not get OpenNebula HostPool: #{hpool.message}"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        use_linked_clones = params[:use_linked_clones] || false
        if use_linked_clones == "true"
            use_linked_clones = true
        else 
            use_linked_clones = false
        end
        # POST params
        if @request_body && !@request_body.empty? && use_linked_clones

            create_copy = params[:create_copy] || false
            if create_copy == "true"
                create_copy = true
            else 
                create_copy = false
            end
            template_name = params[:template_name] || ""

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

                    template = VCenterDriver::Template.new_from_ref(template_copy_ref, vcenter_client)
                    
                    one_template = VCenterDriver::Template.get_xml_template(template, vc_uuid, vcenter_client, vcenter_client.vim.host)
                    
                    if one_template
                        lc_error, use_lc = template.create_delta_disks
                        if !lc_error
                            one_template[:one] << "\nVCENTER_LINKED_CLONES=\"YES\"\n"
                            t = one_template
                            append = false
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
        error, template_disks = template.import_vcenter_disks(vc_uuid, dpool, ipool, true, template_id)

        if !error.empty?
            append = false
            template.delete_template if template_copy_ref
            msg = error
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        #t[:one] << template_disks
        t[:disks] = template_disks

        template_moref = template_copy_ref ? template_copy_ref : ref

        wild = false #We're importing templates not wild vms

        # Create images or get nics information for template
        error, template_nics = template.import_vcenter_nics(vc_uuid,
                                                            npool,
                                                            hpool,
                                                            vcenter_client.vim.host,
                                                            template_moref,
                                                            wild,
                                                            true,
                                                            template["name"],
                                                            template_id)

        if !error.empty?
            append = false
            template.delete_template if template_copy_ref
            msg = error
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        #t[:one] << template_nics
        t[:nics] = template_nics

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

        hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool, false)

        if hpool.respond_to?(:message)
            msg = "Could not get OpenNebula HostPool: #{hpool.message}"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        networks = dc_folder.get_unimported_networks(npool,vcenter_client.vim.host,hpool)

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
        one_ds_ref         = one_ds['TEMPLATE/VCENTER_DS_REF']
        one_ds_instance_id = one_ds['TEMPLATE/VCENTER_INSTANCE_ID']
        vc_uuid            = vcenter_client.vim.serviceContent.about.instanceUuid

        if one_ds_instance_id != vc_uuid
            msg = "Datastore is not in the same vCenter instance provided in credentials"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

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
