# -------------------------------------------------------------------------- #
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                #
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

# Module to decorate MarketApp class with additional helpers not directly
# exposed through the OpenNebula XMLRPC API. The extensions include
#   - export helper that creates OpenNebula related objects from a given app.
#
# rubocop:disable Style/ClassAndModuleChildren
module OpenNebula::MarketPlaceAppExt

    include OpenNebula

    def self.extend_object(obj)
        if !obj.is_a?(OpenNebula::MarketPlaceApp)
            raise StandardError, "Cannot extended #{obj.class} " \
                                 'with MarketPlaceAppExt'
        end

        class << obj

            ####################################################################
            # Public extended interface
            ####################################################################
            # Exports this app to a suitable OpenNebula object
            # @param appid [Integer] id of the marketplace app
            # @param options [Hash] to control the export behavior
            #   dsid [Integer] datastore to save images
            #   f_dsid [Integer] file datastore to save kernels
            #   name [String] of the new object
            #   vmtemplate_name [String] name for the VM Template, if the App
            #   has one complex [Boolean] true to only create image
            #
            # @return [Hash, OpenNebula::Error] with the ID and type of
            # the created objects. Instead of an ID, the array may
            # contain OpenNebula::Error with specific object creation errors
            #   {
            #     :vm => [ vm ids/OpenNebula::Error ],
            #     :vmtemplate => [ vmtemplates ids/OpenNebula::Error ],
            #     :image => [ vm ids/OpenNebula::Error ]
            #   }
            #    rc_info = {
            #      :image            => [],
            #      :image_type       => nil,
            #      :vmtemplate       => [],
            #      :service_template => []
            #    }
            def export(options = {})
                # Get App information and check for errors
                rc = info
                return rc if OpenNebula.is_error?(rc)
                return Error.new('App is not READY') if state_str != 'READY'

                if options[:dsid].nil?
                    return Error.new('Missing datastore id')
                end

                if options[:name].nil?
                    return Error.new('Missing name to export app')
                end

                case type_str
                when 'IMAGE'
                    export_image(options)
                when 'VMTEMPLATE'
                    options[:notemplate] = true

                    export_vm_template(options)
                when 'SERVICE_TEMPLATE'
                    export_service_template(options)
                else
                    Error.new("App type #{type_str} not supported")
                end
            end

            ####################################################################
            # Private methods
            ####################################################################
            private

            # Exports an OpenNebula Image from this marketplace app
            #   @param options to export the image
            #     :vmtemplate_name [String] name of new image and template
            #     :url_args [String] optional URL arguments
            #     :dsid [String] Datastore id to create the image
            #     :f_dsid [String] Files Datastore id
            #     :notemplate [Bool] if true do not create vm_template (if any)
            #     :template [Integer] Template id to use with image
            #     :default_template [String] Default template id for vCenter
            #   @return [Hash]
            #     :image [Array] of the new image
            #     :image_type [String] of the new image (CONTEXT, KERNEL, CDROM)
            #     :vmtemplate [Array] of the associated vm_template (if any)
            #     :service_template [Array] empty []
            def export_image(options)
                rc_info = {
                    :image            => [],
                    :image_type       => nil,
                    :vmtemplate       => [],
                    :service_template => []
                }

                #---------------------------------------------------------------
                # Create the image template
                #---------------------------------------------------------------
                tmpl = ''

                if self['APPTEMPLATE64']
                    tmpl = Base64.decode64(self['APPTEMPLATE64'])
                end

                tmpl << <<-EOT
                NAME     = "#{options[:name]}"
                FROM_APP = "#{self['ID']}"
                EOT

                if options[:url_args]
                    tmpl << "URL_ARGS=\"#{options[:url_args]}\"\n"
                end

                #---------------------------------------------------------------
                # Kernel or context images stored in a files datastore
                #---------------------------------------------------------------
                dsid = options[:dsid]

                if tmpl.match(/^\s*TYPE\s*=\s*KERNEL|CONTEXT\s/i)
                    if options[:f_dsid]
                        dsid = options[:f_dsid]
                    else
                        dspool = DatastorePool.new(@client)

                        rc = dspool.info
                        return { :image => [rc] } if OpenNebula.is_error?(rc)

                        file_ds = dspool.select {|d| d['TYPE'].to_i == 2 }
                        dsid = file_ds.first['ID'].to_i
                    end
                end

                ds = OpenNebula::Datastore.new_with_id(dsid, @client)
                rc = ds.info

                is_vcenter = !OpenNebula.is_error?(rc) &&
                             (ds['TEMPLATE/DRIVER'] == 'vcenter')

                if is_vcenter && options[:template].nil?
                    options = update_options_with_template(options)
                end

                #---------------------------------------------------------------
                # Allocate the image in OpenNebula
                #---------------------------------------------------------------
                image = Image.new(Image.build_xml, @client)
                rc    = image.allocate(tmpl, dsid)

                if OpenNebula.is_error?(rc)
                    rc_info[:image] = [rc]

                    return rc_info
                end

                image.info

                image.delete_element('TEMPLATE/FORMAT')
                image.delete_element('TEMPLATE/DRIVER')
                image.delete_element('TEMPLATE/DEV_PREFIX') if is_vcenter

                image.update(image.template_xml)

                rc_info[:image] = [image.id]
                rc_info[:image_type] = image.type_str

                #---------------------------------------------------------------
                # Created an associated VMTemplate if needed
                #---------------------------------------------------------------
                if (self['TEMPLATE/VMTEMPLATE64'].nil? && !is_vcenter) ||
                    options[:notemplate] ||
                    options[:template] == -1
                    return rc_info
                end

                if !options[:template].nil?
                    template_id = options[:template]

                    if template_id < 0
                        raise 'Invalid option, template_id must be a valid ID'
                    end

                    template = Template.new_with_id(template_id, @client)

                    vmtpl_id = template.clone(
                        options[:vmtemplate_name] || options[:name]
                    )

                    tmpl << <<-EOT

                    NAME = "#{options[:vmtemplate_name] || options[:name]}"
                    DISK = [ IMAGE_ID = "#{image.id}" ]
                    EOT

                    template = Template.new_with_id(vmtpl_id, @client)

                    template.update(tmpl, true)

                    rc_info[:vmtemplate] = [vmtpl_id]
                else
                    tmpl = Base64.decode64(self['TEMPLATE/VMTEMPLATE64'])
                    tmpl << <<-EOT

                    NAME = "#{options[:vmtemplate_name] || options[:name]}"
                    DISK = [ IMAGE_ID = "#{image.id}" ]
                    EOT

                    vmtpl = Template.new(Template.build_xml, @client)

                    rc = vmtpl.allocate(tmpl)
                    rc = vmtpl.id unless OpenNebula.is_error?(rc)

                    rc_info[:vmtemplate] = [rc]
                end

                rc_info
            end

            # Export complex template from marketplace
            #
            # @param name  [Hash]    Export options
            # @param ds_id [Integer] Datastore ID to export child apps
            def export_vm_template(options)
                rc = {
                    :image            => [],
                    :image_type       => nil,
                    :vmtemplate       => [],
                    :service_template => []
                }

                vmtmpl = export_recursive('//DISK', options) do |disks|
                    create_vm_template(options, disks)
                end

                rc[:vmtemplate] = [vmtmpl[0]]

                unless OpenNebula.is_error?(vmtmpl[0])
                    rc[:image] += vmtmpl[1]
                    rc[:vmtemplate] += vmtmpl[2] unless options[:notemplate]
                end

                rc
            end

            # Export service template from marketplace
            #
            # @param name    [Hash]    Export options
            # @param ds_id   [Integer] Datastore ID to export child apps
            def export_service_template(options)
                rc = {
                    :image            => [],
                    :image_type       => nil,
                    :vmtemplate       => [],
                    :service_template => []
                }

                stmpl = export_recursive('//ROLE', options) do |roles|
                    create_service_template(options, roles)
                end

                rc[:service_template] = [stmpl[0]]

                unless OpenNebula.is_error?(stmpl[0])
                    rc[:image] += stmpl[1]
                    rc[:vmtemplate] += stmpl[2]
                end

                rc
            end

            def update_options_with_template(options, _validate = false)
                vcenterrc_path =
                    "#{VAR_LOCATION}/remotes/etc/vmm/vcenter/vcenterrc"

                if File.file?(vcenterrc_path)
                    config_vcenter = YAML.load_file(vcenterrc_path)

                    if config_vcenter.key?(:default_template)
                        options[:template] =
                            config_vcenter[:default_template]

                        options
                    else
                        raise "Couldn't find default_template " \
                              'configuration in vcenterrc conf ' \
                              'file. Please use the --template ' \
                              'file to define a VM Template ID if ' \
                              'needed or add default_template to' \
                              ' vcenterrc conf file'
                    end
                else
                    raise "Couldn't find vcenterrc conf file. " \
                          ' Please use the --template file to define' \
                          ' a VM Template ID if needed.'
                end
            end

            # Creates a VM template based on the APPTEMPLATE64 attribute
            #    @param [Hash] options
            #       :export_name [String] name of the vm template
            #    @param [Hash] disks exported disks from related apps.
            #    As returned by the export_image method
            #
            #    @return [Integer, OpenNebula::Error] template id or error
            def create_vm_template(options, disks)
                dsid = options[:dsid]
                ds = OpenNebula::Datastore.new_with_id(dsid, @client)
                rc = ds.info

                is_vcenter =
                    !OpenNebula.is_error?(rc) &&
                        (ds['TEMPLATE/DRIVER'] == 'vcenter')

                if is_vcenter
                    if options[:template].nil?
                        options = update_options_with_template(options)
                    end

                    template_id = options[:template]

                    if template_id < 0
                        return
                    end

                    template = Template.new_with_id(template_id, @client)

                    vmtpl_id = template.clone(
                        options[:vmtemplate_name] || options[:name]
                    )

                    vmtpl = Template.new_with_id(vmtpl_id, @client)
                    rc = vmtpl.info
                else
                    # ----------------------------------------------------------
                    # Allocate Template
                    # ----------------------------------------------------------
                    if self['TEMPLATE/APPTEMPLATE64'].nil?
                        return Error.new(
                            "Missing APPTEMPLATE64 for App #{id}"
                        )
                    end

                    tmpl = Base64.decode64(self['TEMPLATE/APPTEMPLATE64'])

                    tmpl << "\nNAME=\"#{options[:name]}\"\n"

                    vmtpl = Template.new(Template.build_xml, @client)
                    rc    = vmtpl.allocate(tmpl)
                end

                return rc if OpenNebula.is_error?(rc)

                # --------------------------------------------------------------
                # Update disk information in template
                # --------------------------------------------------------------
                vmtpl.info

                context = []

                disks.each do |_app, disk|
                    id = disk[:image]

                    case disk[:image_type]
                    when 'IMAGE', 'OS', 'DATABLOCK', 'CDROM'
                        vmtpl.add_element('TEMPLATE',
                                          'DISK' => { 'IMAGE_ID' => id.first })
                    when 'CONTEXT'
                        context << "$FILE[IMAGE_ID=\"#{id}\"]"
                    when 'KERNEL'
                        if !vmtpl.has_elements?('TEMPLATE/OS')
                            vmtpl.add_element('TEMPLATE', 'OS'=>{})
                        end

                        vmtpl.add_element(
                            'TEMPLATE/OS',
                            'KERNEL_DS' => "$FILE[IMAGE_ID=#{id}]"
                        )
                    end
                end

                if !context.empty?
                    if !vmtpl.has_elements?('TEMPLATE/CONTEXT')
                        vmtpl.add_element('TEMPLATE', 'CONTEXT' => {})
                    end

                    vmtpl.add_element('TEMPLATE/CONTEXT',
                                      'FILES_DS' => context.join(' '))
                end

                # --------------------------------------------------------------
                # Update template information in OpenNebula
                # --------------------------------------------------------------
                vmtpl.update(vmtpl.template_xml)

                vmtpl.id
            end

            # Creates a Service template based on the VMTEMPLATE64 attribute
            # @return [Integer, OpenNebula::Error] template id or error
            def create_service_template(options, roles)
                # --------------------------------------------------------------
                # Allocate Template
                # --------------------------------------------------------------
                if self['TEMPLATE/APPTEMPLATE64'].nil?
                    return Error.new("Missing APPTEMPLATE64 for App #{id}")
                end

                tmpl = Base64.decode64(self['TEMPLATE/APPTEMPLATE64'])
                tmpl = JSON.parse(tmpl)

                tmpl['name'] = options[:name]

                # --------------------------------------------------------------
                # Append template IDs to each role information
                # --------------------------------------------------------------
                tmpl['roles'].each do |role|
                    t_id = roles.find {|_, v| v[:names].include?(role['name']) }

                    if t_id.nil? || t_id[1].nil? || t_id[1][:vmtemplate].nil?
                        next
                    end

                    role['vm_template'] = nil
                    role['vm_template'] = t_id[1][:vmtemplate][0]
                end

                # --------------------------------------------------------------
                # Allocate Service template in OpenNebula
                # --------------------------------------------------------------
                stmpl = ServiceTemplate.new(ServiceTemplate.build_xml, @client)

                rc = stmpl.allocate(tmpl.to_json)
                rc = stmpl.id unless OpenNebula.is_error?(rc)

                rc
            end

            # Export complex template from marketplace
            #
            # @param xpath   [String]  Xpath to search childs
            # @param options [Hash]    Export options
            # @param ds_id   [Integer] Datastore ID to export child apps
            def export_recursive(xpath, options)
                # Get marketplace apps pool to find roles apps
                pool = OpenNebula::MarketPlaceAppPool.new(@client)
                rc   = pool.info_all

                return rc if OpenNebula.is_error?(rc)

                # Apps that have been already exported
                #
                # app_name =>
                #   :vmtempalte = exported template ID
                #   :image      = exported image ID
                #   :image_type = type (KERNEL, CONTEXT...) of image
                #   :names      = [name_a, name_b, ...]
                exported = {}
                idx      = 0

                # Store IDs of created resources
                images    = []
                templates = []

                # Iterate over all childs
                rc = retrieve_xmlelements(xpath).each do |obj|
                    # Get name and app information
                    obj_name = obj['NAME']
                    app      = obj['APP']

                    # If the app was already exported, do not export it again
                    if exported[app]
                        exported[app][:names] << obj_name
                        next
                    end

                    # Find app in pool
                    obj = pool.find {|p| p['NAME'] == app }

                    break Error.new("App `#{app}` not found") unless obj

                    obj.extend(MarketPlaceAppExt)

                    rc = obj.export(
                        :dsid       => options[:dsid],
                        :name       => "#{options[:name]}-#{idx}",
                        :notemplate => options[:notemplate]
                    )

                    image      = rc[:image].first if rc[:image]
                    vmtemplate = rc[:vmtemplate].first if rc[:vmtemplate]

                    break image if OpenNebula.is_error?(image)
                    break vmtemplate if OpenNebula.is_error?(vmtemplate)

                    idx += 1

                    # Update exported hash with information
                    exported[app] = rc
                    exported[app][:names] = [obj_name]

                    # Add IDs to return object
                    images << image
                    templates << vmtemplate
                end

                if block_given? && !OpenNebula.is_error?(rc)
                    rc = yield(exported)
                end

                if OpenNebula.is_error?(rc)
                    rc_rbck = rollback_export(exported, xpath != '//DISK')

                    return rc_rbck if OpenNebula.is_error?(rc_rbck)
                end

                [rc, images, templates]
            end

            # Delete templates/images in case something went wrong
            #
            # @param exported [Hash]    Exported apps information
            # @param template [Boolean] True to delete VM Template
            #                           False to delete images
            #
            # @return [nil | OpenNebula::Error]
            def rollback_export(exported, is_template)
                ret = ''

                if is_template
                    obj_factory = lambda {|v|
                        id = v[:vmtemplate].first
                        [Template.new_with_id(id, @client),
                         "Error deleting template #{id}"]
                    }

                    delete_method = 'delete(true)'
                else
                    obj_factory = lambda {|v|
                        id = v[:image].first
                        [Image.new_with_id(id, @client),
                         "Error deleting image #{id}"]
                    }

                    delete_method = 'delete'
                end

                exported.each do |_, v|
                    obj, err_msg = obj_factory.call(v)

                    next unless OpenNebula.is_error?(obj.send(delete_method))

                    ret << err_msg
                end

                if ret.empty?
                    nil
                else
                    Error.new(ret) unless ret.empty?
                end
            end

        end

        super
    end

end
# rubocop:enable Style/ClassAndModuleChildren
