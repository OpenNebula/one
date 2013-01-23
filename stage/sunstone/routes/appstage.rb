# -------------------------------------------------------------------------- #
# Copyright 2010-2013, C12G Labs S.L.                                        #
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

$: << RUBY_LIB_LOCATION+"/oneapps/stage"

require 'onechef'

helpers do
    def client
        settings.cloud_auth.client(session[:user])
    end

    def appstage_pool
        pool = OpenNebula::ChefDocPool.new(client(),
            OpenNebula::ChefDocPool::INFO_ALL)
        rc = pool.info
        return [500, rc.to_json] if OpenNebula.is_error?(rc)
        [200, pool.to_hash.to_json]
    end

    def appstage_create(template)
        node = OpenNebula::ChefConf.new
        node.description = template['description'] if template['description']
        node.cookbooks = template['cookbooks'] if template['cookbacks']
        node.templates = template['templates'] if template['templates']
        #variables currently unused
        node.variables = template['variables'] if template['variables']
        node.node = template['node'] if template['node']
        node.name = template['name'] if template['name'] &&
            !template['name'].empty?

        client = settings.cloud_auth.client(session[:user])
        doc = node.save(client)[0]

        if OpenNebula.is_error?(doc)
            return [500, doc.to_json]
        end

        doc.info
        [201, doc.to_hash.to_json]
    end

    def appstage_retrieve(id)
        resource = OpenNebula::ChefDoc.new_with_id(id, client())
        rc = resource.info

        return [404, rc.to_json] if OpenNebula.is_error?(rc)
        [200, resource.to_hash.to_json]
    end

    def appstage_update(resource, template)
        node = resource.node
        node.node = template['node'] if template['node']
        node.templates = template['templates']
        node.cookbooks = template['cookbooks']
        resource.update(node.to_json)
    end

    def appstage_action(id, action_hash)
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

             when "update" then appstage_update(resource, params['DOCUMENT'])

             when "instantiate" then resource.instantiate(params['template_id'],
                                                          params['vars'])
             else
                 error_msg = "#{action_hash['perform']} action not " <<
                     " available for this resource"
                 return [500, OpenNebula::Error.new(error_msg).to_json]
             end


        return [500, rc.to_json] if OpenNebula.is_error?(rc)
        [204, resource.to_hash.to_json]
    end

    def appstage_delete(id)
        resource = OpenNebula::ChefDoc.new_with_id(id, client())
        rc = resource.delete

        return [500, rc.to_json] if OpenNebula.is_error?(rc)
        204
    end
end

################################################################
# PLUGIN ROUTES
################################################################
get '/appstage' do
    appstage_pool()
end

post '/appstage' do
    template = parse_json(request.body.read, 'DOCUMENT')
    appstage_create(template)
end

get '/appstage/:id' do
    appstage_retrieve(params[:id].to_i)
end

post '/appstage/:id/action' do
    action_hash = parse_json(request.body.read, 'action')
    if OpenNebula.is_error?(action_hash)
        return [500, action_hash.to_json]
    end

    appstage_action(params[:id].to_i, action_hash)
end

delete '/appstage/:id' do
    appstage_delete(params[:id].to_i)
end
