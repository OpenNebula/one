# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

require 'opennebula/pool_element'

module OpenNebula

    class MarketPlaceApp < PoolElement

        #######################################################################
        # Constants and Class Methods
        #######################################################################

        MARKETPLACEAPP_METHODS = {
            :info       => 'marketapp.info',
            :allocate   => 'marketapp.allocate',
            :delete     => 'marketapp.delete',
            :update     => 'marketapp.update',
            :chown      => 'marketapp.chown',
            :chmod      => 'marketapp.chmod',
            :rename     => 'marketapp.rename',
            :enable     => 'marketapp.enable',
            :lock       => 'marketapp.lock',
            :unlock     => 'marketapp.unlock'
        }

        MARKETPLACEAPP_STATES = %w{INIT READY LOCKED ERROR DISABLED}

        SHORT_MARKETPLACEAPP_STATES={
            'INIT'      => 'ini',
            'READY'     => 'rdy',
            'LOCKED'    => 'lck',
            'ERROR'     => 'err',
            'DISABLED'  => 'dis'
        }

        MARKETPLACEAPP_TYPES = %w{UNKNOWN IMAGE VMTEMPLATE SERVICE_TEMPLATE}

        SHORT_MARKETPLACEAPP_TYPES = {
            'UNKNOWN'          => 'unk',
            'IMAGE'            => 'img',
            'VMTEMPLATE'       => 'tpl',
            'SERVICE_TEMPLATE' => 'srv'
        }

        # Creates a MarketPlace description with just its identifier
        # this method should be used to create plain MarketPlace objects.
        # +id+ the id of the user
        #
        # Example:
        #  app = MarketPlaceApp.new(MarketPlace.build_xml(3),rpc_client)
        #
        def MarketPlaceApp.build_xml(pe_id = nil)
            if pe_id
                app_xml = "<MARKETPLACEAPP><ID>#{pe_id}</ID></MARKETPLACEAPP>"
            else
                app_xml = '<MARKETPLACEAPP></MARKETPLACEAPP>'
            end

            XMLElement.build_xml(app_xml, 'MARKETPLACEAPP')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml, client)
        end

        #######################################################################
        # XML-RPC Methods for the MarketPlace Object
        #######################################################################

        # Retrieves the information of the given marketplace app
        def info
            super(MARKETPLACEAPP_METHODS[:info], 'MARKETPLACEAPP')
        end

        alias_method :info!, :info

        # Allocates a new MarketPlace in OpenNebula
        #
        # @param description [String] The template of the marketplace app
        # @param mp_id [Integer] The id of the marketplace to create the app
        #
        # @return [Integer, OpenNebula::Error] the new ID in case of
        #   success, error otherwise
        def allocate(description, mp_id)
            super(MARKETPLACEAPP_METHODS[:allocate], description, mp_id)
        end

        # Deletes the marketplace app
        def delete
            super(MARKETPLACEAPP_METHODS[:delete])
        end

        # Replaces the template contents
        #
        # @param new_template [String] New template contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_template, append = false)
            super(MARKETPLACEAPP_METHODS[:update], new_template, append ? 1 : 0)
        end

        # Changes the owner/group
        #
        # @param uid [Integer] the new owner id. Set to -1 to leave the current one
        # @param gid [Integer] the new group id. Set to -1 to leave the current one
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chown(uid, gid)
            super(MARKETPLACEAPP_METHODS[:chown], uid, gid)
        end

        # Changes the marketplace app permissions.
        #
        # @param octet [String] Permissions octed , e.g. 640
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet)
            super(MARKETPLACEAPP_METHODS[:chmod], octet)
        end

        # Changes the marketplace app permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                other_m, other_a)
            super(MARKETPLACEAPP_METHODS[:chmod], owner_u, owner_m, owner_a,
                group_u, group_m, group_a, other_u, other_m, other_a)
        end

        # Renames this marketplace app
        #
        # @param name [String] New name for the marketplace app
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            call(MARKETPLACEAPP_METHODS[:rename], @pe_id, name)
        end

        # Exports this app to a suitable OpenNebula object
        # @param appid [Integer] id of the marketplace app
        # @param options [Hash] to control the export behavior
        #   dsid [Integer] datastore to save images
        #   name [String] of the new object
        #   vmtemplate_name [String] name for the VM Template, if the App has one
        #
        # @return [Hash, OpenNebula::Error] with the ID and type of the created
        # objects. Instead of an ID, the array may contain OpenNebula::Error with
        # specific object creation errors
        #   { :vm => [ vm ids/OpenNebula::Error ],
        #     :vmtemplate => [ vmtemplates ids/OpenNebula::Error ],
        #     :image => [ vm ids/OpenNebula::Error ] }
        def export(options = {})
            rc = info
            return rc if OpenNebula.is_error?(rc)
            return Error.new('App is not READY') if state_str != 'READY'

            if options[:dsid].nil? && type_str != 'VMTEMPLATE'
                return Error.new('Missing datastore id')
            end

            return Error.new('Missing name to export app') if options[:name].nil?

            if !self['APPTEMPLATE64'].nil?
                tmpl = Base64.decode64(self['APPTEMPLATE64'])
            else
                tmpl = ''
            end

            name = options[:name] || "marketapp-#{id}"
            options[:vmtemplate_name] = name unless options[:vmtemplate_name]

            tmpl << "\n"
            tmpl << "NAME=\"" << name << "\"\n"
            tmpl << "FROM_APP=\"" << self['ID'] << "\"\n"

            case type_str
            when 'IMAGE'
                image = Image.new(Image.build_xml, @client)
                rc    = image.allocate(tmpl, options[:dsid])

                ds = OpenNebula::Datastore.new_with_id(options[:dsid], @client)

                rc_image = image.info
                rc_ds    = ds.info

                image_error = OpenNebula.is_error?(rc_image)
                ds_error    = OpenNebula.is_error?(rc_ds)

                xpath  = 'TEMPLATE/DRIVER'
                format = self['FORMAT']
                type   = ds[xpath]

                if !image_error && !ds_error
                    if type == 'vcenter' && format == 'qcow2'
                        image.replace('DEV_PREFIX' => 'sd')
                        image.delete_element('TEMPLATE/FORMAT')
                        image.delete_element('TEMPLATE/DRIVER')

                        image.update(image.template_like_str("TEMPLATE"))
                    elsif type == 'vcenter' && format != 'iso' && format != 'vmdk'
                        image.replace('FORMAT' => 'vmdk')
                    elsif type && type != 'vcenter' && format == 'vmdk'
                        image.replace('FORMAT' => type)
                    end
                end

                return { :image => [rc] } if OpenNebula.is_error?(rc)

                vmtpl_id = create_vmtemplate(options, image.id)

                return { :image => [image.id], :vmtemplate => [vmtpl_id] }

            when 'VMTEMPLATE'
                # TODO import all the images associated to a VMTEMPLATE app
                # current version only support no-image based apps (e.g. hybrid)
                vmtpl_id = create_vmtemplate(options)

                return { :image => [], :vmtemplate => [vmtpl_id] }
            else
                return Error.new("App type #{type_str} not supported")
            end
        end

        # Enables this app
        def enable
            call(MARKETPLACEAPP_METHODS[:enable], @pe_id, true)
        end

        # Enables this app
        def disable
            call(MARKETPLACEAPP_METHODS[:enable], @pe_id, false)
        end

        # ---------------------------------------------------------------------
        # Helpers to get information
        # ---------------------------------------------------------------------

        # Returns the marketplace app type
        def type
            self['TYPE'].to_i
        end

        # Returns the marketplace app type (string value)
        def type_str
            MARKETPLACEAPP_TYPES[type]
        end

        # Returns the marketplace app type (string value)
        def short_type_str
            SHORT_MARKETPLACEAPP_TYPES[type_str]
        end

        # Returns the state of the marketplace app (numeric value)
        def state
            self['STATE'].to_i
        end

        # Returns the state of the marketplace app (string value)
        def state_str
            MARKETPLACEAPP_STATES[state]
        end

        # Returns the state of the marketplace app (string value)
        def short_state_str
            SHORT_MARKETPLACEAPP_STATES[state_str]
        end

        # Locked a MarketplaceApp
        def lock(level)
            call(MARKETPLACEAPP_METHODS[:lock], @pe_id, level)
        end

        # Unlocked a MarketplaceApp
        def unlock()
            call(MARKETPLACEAPP_METHODS[:unlock], @pe_id)
        end

        private

        # Creates a VM template based on the VMTEMPLATE64 attribute
        # @return [Integer, OpenNebula::Error] template id or error
        # TODO this method needs to be extended to support [image_ids]
        def create_vmtemplate(options, image_id = nil)
            return -1 if self['TEMPLATE/VMTEMPLATE64'].nil?

            tmpl = Base64.decode64(self['TEMPLATE/VMTEMPLATE64'])

            tmpl << "\nNAME=\"#{options[:vmtemplate_name]}\"\n"
            tmpl << "DISK=[ IMAGE_ID = #{image_id} ]\n" if image_id

            vmtpl = Template.new(Template.build_xml, @client)
            rc    = vmtpl.allocate(tmpl)

            return rc if OpenNebula.is_error?(rc)

            vmtpl.id
        end

    end

end
