# -------------------------------------------------------------------------- #
# Copyright 2010-2012, C12G Labs S.L.                                        #
#                                                                            #
# Licensed under the C12G Commercial Open-source License (the                #
# "License"); you may not use this file except in compliance                 #
# with the License. You may obtain a copy of the License as part             #
# of the software distribution.                                              #
#                                                                            #
# Unless agreed to in writing, software distributed under the                #
# License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES             #
# OR CONDITIONS OF ANY KIND, either express or implied. See the              #
# License for the specific language governing permissions and                #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

require 'apptools/env/onechef.rb'

# Name for the resource.
#Used to generate correct <RESOURCE_POOL><RESOURCE>... tags
RESOURCE = 'APPENV'

helpers do
    def client
        settings.cloud_auth.client(session[:user])
    end

    def appenv_to_json(resource)
        { "#{RESOURCE}" => resource.to_hash['DOCUMENT']}.to_json
    end

    def appenv_pool
        pool = OpenNebula::ChefDocPool.new(client())
        rc = pool.info
        return [500, rc.to_json] if OpenNebula.is_error?(rc)

        # Pool comes in <DOCUMENT_POOL><DOCUMENT>...
        # Need to set the resource type correctly to $RESOURCE
        appenv_pool = { "#{RESOURCE}_POOL" => {}}
        pool.each do | elem |
            hash = elem.to_hash['DOCUMENT']
            appenv_pool["#{RESOURCE}_POOL"]["#{RESOURCE}"] ||= []
            appenv_pool["#{RESOURCE}_POOL"]["#{RESOURCE}"] << hash
        end
        [200, appenv_pool.to_json]
    end

    def appenv_create(template)
        node = OpenNebula::ChefConf.new
        node.name = template['name']
        node.description = template['description'] if template['description']
        node.cookbooks = template['cookbooks'] if template['cookbacks']
        node.templates = template['templates'] if template['templates']
        #variables currently unused
        node.variables = template['variables'] if template['variables']
        node.node = template['node'] if template['node']

        client = settings.cloud_auth.client(session[:user])
        doc = node.save(client)[0]

        if OpenNebula.is_error?(doc)
            return [500, doc.to_json]
        end

        doc.info
        [201, appenv_to_json(doc)]
    end

    def appenv_retrieve(id)
        resource = OpenNebula::ChefDoc.new_with_id(id, client())
        rc = resource.info

        return [404, rc.to_json] if OpenNebula.is_error?(rc)
        [200, appenv_to_json(resource)]
    end

    def appenv_update(resource, template)
        node = resource.node
        node.node = template['node'] if template['node']
        node.templates = template['templates']
        node.cookbooks = template['cookbooks']
        resource.update(node.to_json)
    end

    def appenv_action(id, action_hash)
        resource = OpenNebula::ChefDoc.new_with_id(id,client())
        rc = resource.info
        if OpenNebula.is_error?(rc)
            return [404, rc.to_json]
        end

        params = action_hash['params']
        rc = case action_hash['perform']
             when "chown" then resource.chown(params['owner_id'].to_i,
                                              params['group_id'].to_i)

             when "chmod" then resource.chmod_octet(params['octet'])

             when "update" then appenv_update(resource, params[RESOURCE])

             when "instantiate" then resource.instantiate(params['template_id'],
                                                          params['vars'])
             else
                 error_msg = "#{action_hash['perform']} action not " <<
                     " available for this resource"
                 return [500, OpenNebula::Error.new(error_msg).to_json]
             end


        return [500, rc.to_json] if OpenNebula.is_error?(rc)
        [204, appenv_to_json(resource)]
    end

    def appenv_delete(id)
        resource = OpenNebula::ChefDoc.new_with_id(id, client())
        rc = resource.delete

        return [500, rc.to_json] if OpenNebula.is_error?(rc)
        204
    end
end

################################################################
# PLUGIN ROUTES
################################################################
get '/appenv' do
    appenv_pool()
end

post '/appenv' do
    template = parse_json(request.body.read, RESOURCE)
    appenv_create(template)
end

get '/appenv/:id' do
    appenv_retrieve(params[:id].to_i)
end

post '/appenv/:id/action' do
    action_hash = parse_json(request.body.read, 'action')
    if OpenNebula.is_error?(action_hash)
        return [500, action_hash.to_json]
    end

    appenv_action(params[:id].to_i, action_hash)
end

delete '/appenv/:id' do
    appenv_delete(params[:id].to_i)
end
