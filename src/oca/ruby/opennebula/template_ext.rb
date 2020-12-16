# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

# Module to decorate Template class with additional helpers not directly
# exposed through the OpenNebula XMLRPC API. The extensions include
#   - mp_import helper that imports a template into a marketplace
#
# rubocop:disable Style/ClassAndModuleChildren
module OpenNebula::TemplateExt

    def self.extend_object(obj)
        if !obj.is_a?(OpenNebula::Template)
            raise StandardError, "Cannot extended #{obj.class} with TemplateExt"
        end

        class << obj

            ####################################################################
            # Public extended interface
            ####################################################################
            # Imports template into marketplace
            #
            # @param market        [Integer] Market to import the Template
            # @param import_all    [String]  yes to import images too,
            #                                no otherwise
            # @param template_name [String]  Virtual Machine Template app name
            #
            # @return [String, Array]
            #   - Error message in case of any or random generated template name
            #   - Objects IDs
            def mp_import(market, import_all, template_name = nil)
                ids           = []
                main_template = ''

                #---------------------------------------------------------------
                # Import all disks as IMAGE
                #---------------------------------------------------------------
                retrieve_xmlelements('TEMPLATE/DISK').each_with_index do
                    |disk, idx|
                    template, main = create_mp_app_template(disk['IMAGE_ID'],
                                                            disk['IMAGE'],
                                                            idx)
                    main_template << main

                    next if import_all == 'no'

                    rc = create_mp_app(template, market)

                    return [rc.message, ids] if OpenNebula.is_error?(rc)

                    ids << rc
                end

                #---------------------------------------------------------------
                # Check if VM template has kernel
                #---------------------------------------------------------------
                kernel = self['TEMPLATE/OS/KERNEL_DS']

                if kernel
                    image_id = kernel.match(/\d+/)
                    image_id = image_id[0] if image_id

                    template, main = create_mp_app_template(image_id, nil)

                    main_template << main

                    if import_all == 'yes'
                        rc = create_mp_app(template, market)

                        return [rc.message, ids] if OpenNebula.is_error?(rc)

                        ids << rc
                    end
                end

                #---------------------------------------------------------------
                # Check if VM template have files
                #---------------------------------------------------------------
                files = self['TEMPLATE/CONTEXT/FILES_DS']

                if files
                    files = files.scan(/IMAGE="([^"]*)"/).flatten +
                            files.scan(/IMAGE_ID="([^"]*)"/).flatten
                end

                if files
                    files.each_with_index do |file, idx|
                        template, main = create_mp_app_template(file, nil, idx)
                        main_template << main

                        next unless import_all == 'yes'

                        rc = create_mp_app(template, market)

                        return [rc.message, ids] if OpenNebula.is_error?(rc)

                        ids << rc
                    end
                end

                #---------------------------------------------------------------
                # Finally import VM template
                #---------------------------------------------------------------
                delete_element('TEMPLATE/DISK')
                delete_element('TEMPLATE/OS/KERNEL_DS')
                delete_element('TEMPLATE/CONTEXT/FILES_DS')

                # Replace all nics by auto nics
                nic_xpath   = '/VMTEMPLATE/TEMPLATE/NIC'
                alias_xpath = '/VMTEMPLATE/TEMPLATE/NIC_ALIAS'

                retrieve_xmlelements(nic_xpath).each do |nic|
                    if nic['NETWORK']
                        net = "[NETWORK=\"#{nic['NETWORK']}\"]"
                    else
                        net = "[NETWORK_ID=\"#{nic['NETWORK_ID']}\"]"
                    end

                    # If there are ALIAS the NIC can't be auto,
                    # because this combination isn't supported by the core
                    nic_alias = retrieve_xmlelements(alias_xpath)

                    if !nic_alias || nic_alias.empty?
                        nic.add_element("#{nic_xpath}#{net}",
                                        'NETWORK_MODE' => 'auto')
                    else
                        # Add attribute to avoid empty elements
                        nic.add_element("#{nic_xpath}#{net}", 'MARKET' => 'YES')
                    end

                    delete_nic_attributes(nic)
                end

                retrieve_xmlelements(alias_xpath).each do |nic|
                    delete_nic_attributes(nic)
                end

                # Rename it to avoid clashing names
                if template_name
                    name = template_name
                else
                    name = "#{self['NAME']}-#{SecureRandom.hex[0..9]}"
                end

                main_template << <<-EOT
                NAME      ="#{name}"
                ORIGIN_ID ="-1\"
                TYPE      ="VMTEMPLATE"
                VERSION   ="#{VERSION}"

                APPTEMPLATE64 ="#{Base64.strict_encode64(template_str)}"
                EOT

                rc = create_mp_app(main_template, market)

                if OpenNebula.is_error?(rc)
                    rollback(ids)
                    return [rc.message, ids]
                end

                ids << rc

                [name, ids]
            end

            ####################################################################
            # Private methods
            ####################################################################
            private

            # NIC and NIC Alias attributes to delete when importing template
            # into marketplace.
            #   @param nic [XMLElement] to delete attributes from
            def delete_nic_attributes(nic)
                %w[NETWORK NETWORK_ID NETWORK_UNAME SECURITY_GROUPS].each do |a|
                    nic.delete_element(a)
                end
            end

            # Create application template
            #
            # @param id   [Integer] Image ID
            # @param name [String]  Image name
            # @param type [String]  Image type (image/file/kernel)
            # @param idx  [Integer] Image ID in VM template
            #
            # @return [String, String]
            #   - app template
            #   - content for VM template
            def create_mp_app_template(id, name, idx = 0)
                # Find image information, from ID or NAME
                if id
                    image = Image.new_with_id(id, @client)
                else
                    image_pool = ImagePool.new(@client)
                    image_pool.info
                    name.gsub!('"', '')

                    image = image_pool.find {|v| v['NAME'] == name }
                end

                image.info

                # Rename to avoid clashing names
                app_name = "#{image['NAME']}-#{SecureRandom.hex[0..9]}"

                dev_prefix = image['TEMPLATE/DEV_PREFIX']
                img_type   = image.type_str

                template64 = "TYPE=#{img_type}\n"
                template64 << "DEV_PREFIX=\"#{dev_prefix}\"\n" if dev_prefix

                template = <<-EOT
                NAME      ="#{app_name}"
                ORIGIN_ID ="#{image['ID']}"
                TYPE      ="IMAGE"
                VERSION   ="#{VERSION}"

                APPTEMPLATE64 = "#{Base64.strict_encode64(template64)}"
                EOT

                main_template = <<-EOT
                DISK = [
                    NAME = "#{img_type}_#{idx}",
                    APP  = "#{app_name}"
                ]
                EOT

                # Template is the image app template
                # Main template is content to be added to VM template app
                [template, main_template]
            end

            # Create application in marketplace
            #
            # @param template  [String]  APP template
            # @param market_id [Integer] Marketplace to import it
            #
            # @return [Integer] APP ID
            def create_mp_app(template, market_id)
                xml = OpenNebula::MarketPlaceApp.build_xml
                app = OpenNebula::MarketPlaceApp.new(xml, @client)
                rc  = app.allocate(template, market_id)

                return rc if OpenNebula.is_error?(rc)

                app.id
            end

            # Delete IDS apps
            #
            # @param ids [Array] Apps IDs to delete
            def rollback(ids)
                puts
                STDERR.puts "ERROR: rolling back apps: #{ids.join(', ')}"
                puts

                ids.each do |id|
                    app = OpenNebula::MarketPlaceApp.new_with_id(id, @client)

                    app.info

                    # Ready state
                    if app.state != 1
                        STDERR.puts "App `#{app['NAME']}` delete operation " \
                                    'might fail, check servers logs'
                    end

                    app.delete
                end

                puts
            end

        end
    end

end
# rubocop:enable Style/ClassAndModuleChildren
