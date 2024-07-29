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

require 'securerandom'
require 'opennebula/wait_ext'

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

            # ------------------------------------------------------------------
            # Imports template into marketplace
            #
            # @param market [Integer] Market to import the Template
            # @param import_all [Bool] true to import images too,
            # @param template_name [String] Virtual Machine Template app name
            #
            # @return [String, Array]
            #   - Error message in case of any or random generated template name
            #   - Objects IDs
            # ------------------------------------------------------------------
            def mp_import(market, import_all, template_name = nil, opts = {})
                opts = {
                    :wait => false,
                    :logger => nil
                }.merge(opts)

                ids    = []
                images = []
                logger = opts[:logger]

                main_template = ''

                #---------------------------------------------------------------
                # Import all disks as IMAGE
                #---------------------------------------------------------------
                logger.info 'Processing VM disks' if logger

                retrieve_xmlelements('TEMPLATE/DISK').each_with_index do |disk, idx|
                    image = image_lookup(disk)

                    next unless image

                    if OpenNebula.is_error?(image)
                        logger.fatal image.message if logger

                        rollback(ids)
                        return [image, ids]
                    end

                    i_state = OpenNebula::Image::IMAGE_STATES[
                        image['STATE'].to_i
                    ]

                    unless ['LOCKED', 'READY', 'USED'].include?(i_state)
                        logger.fatal "Wrong image state #{i_state}" if logger

                        rollback(ids)
                        return [image, ids]
                    end

                    logger.info "Adding disk with image #{image.id}" if logger

                    tmpl, main = create_app_template(image, idx)

                    if OpenNebula.is_error?(tmpl)
                        logger.fatal tmpl.message if logger

                        rollback(ids)
                        return [tmpl, ids]
                    end

                    main_template << main

                    next unless import_all

                    logger.info 'Importing image to market place' if logger

                    rc = create_app(tmpl, market)

                    if OpenNebula.is_error?(rc)
                        logger.fatal rc.message if logger

                        rollback(ids)
                        return [rc, ids]
                    end

                    images << image

                    ids << rc
                end

                delete_element('TEMPLATE/DISK')

                #---------------------------------------------------------------
                # Import VM template
                #---------------------------------------------------------------
                logger.info 'Processing VM NICs' if logger

                # Replace all nics by auto nics
                nic_xpath   = '/VMTEMPLATE/TEMPLATE/NIC'
                alias_xpath = '/VMTEMPLATE/TEMPLATE/NIC_ALIAS'

                retrieve_xmlelements(nic_xpath).each do |nic|
                    if nic['NETWORK']
                        net = "[NETWORK=\"#{nic['NETWORK']}\"]"
                    elsif nic['NETWORK_ID']
                        net = "[NETWORK_ID=\"#{nic['NETWORK_ID']}\"]"
                    end

                    # NIC can be already in auto mode
                    next unless net

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
                VERSION   ="#{OpenNebula::VERSION}"

                APPTEMPLATE64 ="#{Base64.strict_encode64(template_str)}"
                EOT

                logger.info 'Creating VM app' if logger

                rc = create_app(main_template, market)

                if OpenNebula.is_error?(rc)
                    logger.fatal rc.message if logger

                    rollback(ids)
                    return [rc, ids]
                end

                logger.info 'Waiting for image upload' if logger && opts[:wait]

                images.each {|i| i.wait('READY') } if opts[:wait]

                ids << rc

                [name, ids]
            end

            ####################################################################
            # Private methods
            ####################################################################
            private

            #-------------------------------------------------------------------
            # NIC and NIC Alias attributes to delete when importing template
            # into marketplace.
            #   @param nic [XMLElement] to delete attributes from
            #-------------------------------------------------------------------
            def delete_nic_attributes(nic)
                ['NETWORK', 'NETWORK_ID', 'NETWORK_UNAME', 'SECURITY_GROUPS'].each do |a|
                    nic.delete_element(a)
                end
            end

            #-------------------------------------------------------------------
            # Create application template
            #
            # @param id   [Image] OpenNebula Image
            # @param idx  [Integer] Image ID in VM template
            #
            # @return [String, String]
            #   - app template
            #   - content for VM template
            #-------------------------------------------------------------------
            def create_app_template(image, idx = 0)
                i_state = OpenNebula::Image::IMAGE_STATES[image['STATE'].to_i]

                # If the image is used, there is no need to wait until it is
                # ready because the image is already ready to be copied
                if i_state != 'USED' && Integer(image['STATE']) != 1
                    # Wait until the image is READY to safe copy it to the MP
                    image.wait('READY')
                end

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
                VERSION   ="#{OpenNebula::VERSION}"

                APPTEMPLATE64 = "#{Base64.strict_encode64(template64)}"
                EOT

                main_template = <<-EOT
                DISK = [
                    NAME = "#{img_type}_#{idx}",
                    APP  = "#{app_name}"
                ]
                EOT

                [template, main_template]
            end

            #-------------------------------------------------------------------
            # Create application in marketplace
            #
            # @param template  [String]  APP template
            # @param market_id [Integer] Marketplace to import it
            #
            # @return [Integer] APP ID
            #-------------------------------------------------------------------
            def create_app(template, market_id)
                xml = OpenNebula::MarketPlaceApp.build_xml
                app = OpenNebula::MarketPlaceApp.new(xml, @client)

                rc  = app.allocate(template, market_id)

                return rc if OpenNebula.is_error?(rc)

                app.id
            end

            #-------------------------------------------------------------------
            # Delete IDS apps
            #
            # @param ids [Array] Apps IDs to delete
            #-------------------------------------------------------------------
            def rollback(ids)
                ids.each do |id|
                    app = OpenNebula::MarketPlaceApp.new_with_id(id, @client)

                    app.delete
                end
            end

            #-------------------------------------------------------------------
            # Lookup OpenNebula Images by name or id. Lookup is made on a cached
            # image pool.
            #
            # @param id [Integer, nil] Image id
            # @param name [String] Image name
            #
            # @return [Image]
            #-------------------------------------------------------------------
            def image_lookup(disk)
                # Image pool cache for image id lookup
                if @image_lookup_cache.nil?
                    @image_lookup_cache = OpenNebula::ImagePool.new(@client)
                    @image_lookup_cache.info
                end

                # Find image information, from ID or NAME. NAME uses the
                # specified user or template owner namespaces
                image = nil

                image_id = disk['IMAGE_ID']

                if image_id
                    image = OpenNebula::Image.new_with_id(image_id, @client)
                else
                    name  = disk['IMAGE']
                    uname = disk['IMAGE_UNAME']
                    uname ||= self['UNAME']

                    # Volatile disk
                    return unless name

                    name.gsub!('"', '')
                    image = @image_lookup_cache.find do |v|
                        v['NAME'] == name && v['UNAME'] == uname
                    end

                    return Error.new("Image #{image} not found") if image.nil?
                end

                rc = image.info

                return rc if OpenNebula.is_error? rc

                image.extend(OpenNebula::WaitExt)

                image
            end

        end
    end

end
# rubocop:enable Style/ClassAndModuleChildren
