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

require 'OpenNebulaJSON/JSONUtils'
require 'opennebula/marketplaceapp_ext'
require 'opennebula/template_ext'
require 'opennebula/flow/service_template_ext'

module OpenNebulaJSON
    class MarketPlaceAppJSON < OpenNebula::MarketPlaceApp
        include JSONUtils

        def create(template_json)
            mp_hash = parse_json(template_json, 'marketplaceapp')
            if OpenNebula.is_error?(mp_hash)
                return mp_hash
            end

            mp_id = parse_json(template_json, 'mp_id')
            if OpenNebula.is_error?(mp_id)
                return mp_id
            end

            if mp_hash['marketplaceapp_raw']
                template = mp_hash['marketplaceapp_raw']
            else
                template = template_to_str(mp_hash)
            end

            self.allocate(template, mp_id.to_i)
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "update"                  then self.update(action_hash['params'])
                 when "export"                  then self.export(action_hash['params'])
                 when "chown"                   then self.chown(action_hash['params'])
                 when "chmod"                   then self.chmod_octet(action_hash['params'])
                 when "rename"                  then self.rename(action_hash['params'])
                 when "disable"                 then self.disable
                 when "enable"                  then self.enable
                 when "lock"                    then lock(action_hash['params']['level'].to_i)
                 when "unlock"                  then unlock()
                 when "vm.import"               then self.app_vm_import(action_hash['params'])
                 when "vm-template.import"      then self.app_vm_import(action_hash['params'])
                 when "service_template.import" then self.app_service_import(action_hash['params'])
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def app_vm_import(params=Hash.new)
            template = Template.new_with_id(params['ORIGIN_ID'], @client)
            rc = template.info

            return rc if OpenNebula.is_error?(rc)

            template.extend(TemplateExt)

            market_id = params['MARKETPLACE_ID'].to_i
            import_all = params['IMPORT_ALL']
            template_name = params['NAME']

            rc, ids = template.mp_import(market_id, import_all, template_name)

            return [rc.message, ids] if OpenNebula.is_error?(rc)

            [rc, ids]
        end

        def app_service_import(params=Hash.new)
            s_template = ServiceTemplate.new_with_id(
                    params['ORIGIN_ID'],
                    @client
                )
            rc = s_template.info

            return rc if OpenNebula.is_error?(rc)

            s_template.extend(ServiceTemplateExt)

            vm_templates_ids = s_template.vm_template_ids
            templates = {}

            ids_images = []

            if params['IMPORT_ALL']
                vm_templates_ids.each { |id|
                    template = Template.new_with_id(id, @client)
                    template.info

                    aux_template = {
                        :market => params['MARKETPLACE_SERVICE_ID'].to_i,
                        :template => template,
                        :name => rc
                    }
                    templates[id] = aux_template
                }

                templates.each do |_, market|
                    template = market[:template]
                    template.extend(TemplateExt)

                    rc, ids = template.mp_import(market[:market].to_i,
                                                params['IMPORT_ALL'],
                                                nil)

                    return [rc.message, ids] if OpenNebula.is_error?(rc)

                    # Store name to use it after
                    market[:name] = nil
                    market[:name] = rc

                    ids_images.append(ids)
                end
            end

            market_id = params['MARKETPLACE_ID'].to_i
            template_name = params['NAME']

            error_code, rc = s_template.mp_import(templates, market_id, template_name)

            if error_code == -1
                if params['IMPORT_ALL']
                    ids_images.each do |id|
                        app = MarketPlaceApp.new_with_id(id, @client)

                        app.info

                        app.delete
                    end
                end
                return OpenNebula::Error.new(rc.message)
            end

            rc = ids_images.append(rc)
            return [0, rc]
        end

        def update(params=Hash.new)
            if !params['append'].nil?
                super(params['template_raw'], params['append'])
            else
                super(params['template_raw'])
            end
        end

        def export(params=Hash.new)
            self.extend(MarketPlaceAppExt)

            dsid = params['dsid'] ? params['dsid'].to_i : params['dsid']
            name = params['name']
            vmtemplate_name = params['vmtemplate_name']
            notemplate =  [true, 'true'].include?(params['notemplate'])
            template = params['vcenter_template'] != "" ? params['vcenter_template'].to_i : nil

            tag ="tag=#{params['tag']}" if params['tag'] && !params['tag'].empty?
            rc = export({
                :dsid => dsid,
                :name => name,
                :vmtemplate_name => vmtemplate_name,
                :notemplate => notemplate,
                :url_args => tag,
                :template => template
            })

            if OpenNebula.is_error?(rc)
                return rc
            else
                response = {}
                if rc[:image]
                    response['IMAGE'] = []
                    rc[:image].each { |image_id|
                        if OpenNebula.is_error?(image_id)
                            response['IMAGE'] << image_id.to_hash
                        else
                            image = ImageJSON.new_with_id(image_id, @client)
                            response['IMAGE'] << image.to_hash['IMAGE']
                        end
                    }
                end

                if rc[:vmtemplate]
                    response['VMTEMPLATE'] = []
                    rc[:vmtemplate].each { |vmtemplate_id|
                        if OpenNebula.is_error?(vmtemplate_id)
                            response['VMTEMPLATE'] << vmtemplate_id.to_hash
                        else
                            vmtemplate = TemplateJSON.new_with_id(vmtemplate_id, @client)
                            response['VMTEMPLATE'] << vmtemplate.to_hash['VMTEMPLATE']
                        end
                    }
                end

                if rc[:service_template]
                    response['SERVICE_TEMPLATE'] = []
                    rc[:service_template].each { |servicetemplate_id|
                        response['SERVICE_TEMPLATE'] << {:ID => servicetemplate_id}
                    }
                end

                return response
            end
        end

        def chown(params=Hash.new)
            super(params['owner_id'].to_i,params['group_id'].to_i)
        end

        def chmod_octet(params=Hash.new)
            super(params['octet'])
        end

        def rename(params=Hash.new)
            super(params['name'])
        end
    end
end
