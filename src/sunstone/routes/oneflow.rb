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

$: << RUBY_LIB_LOCATION+"/oneflow"

require 'opennebula/oneflow_client'


helpers do
    def af_build_client
        flow_client = $cloud_auth.client(session[:user])
        split_array = flow_client.one_auth.split(':')

        Service::Client.new(
                :url        => session[:zone_flow_url],
                :user_agent => "Sunstone",
                :username   => split_array.shift,
                :password   => split_array.join(':'))
    end

    def af_format_response(resp)
        if CloudClient::is_error?(resp)
            logger.error("[OneFlow] " + resp.to_s)

            error = Error.new(resp.to_s)
            error resp.code.to_i, error.to_json
        else
            body resp.body.to_s
            status resp.code.to_i
        end
    end
end

##############################################################################
# Service
##############################################################################

get '/service' do
    client = af_build_client

    resp = client.get('/service')

    af_format_response(resp)
end

get '/service/:id' do
    client = af_build_client

    resp = client.get('/service/' + params[:id])

    af_format_response(resp)
end

put '/service/:id' do
    client = af_build_client

    resp = client.put('/service/' + params[:id], @request_body)

    af_format_response(resp)
end

delete '/service/:id' do
    client = af_build_client

    resp = client.delete('/service/' + params[:id])

    af_format_response(resp)
end

post '/service/:id/action' do
    client = af_build_client

    resp = client.post('/service/' + params[:id] + '/action', @request_body)

    af_format_response(resp)
end

post '/service/:id/scale' do
    client = af_build_client

    resp = client.post('/service/' + params[:id] + '/scale', @request_body)

    af_format_response(resp)
end

post '/service/:id/role/:role_name/action' do
    client = af_build_client

    resp = client.post('/service/' + params[:id] + '/role/' + params[:role_name]  + '/action', @request_body)

    af_format_response(resp)
end


put '/service/:id/role/:role_name' do
    client = af_build_client

    resp = client.put('/service/' + params[:id] + '/role/' + params[:role_name], @request_body)

    af_format_response(resp)
end

post '/service/purge' do
    client = af_build_client

    resp = client.post('/service_pool/purge_done', @request_body)

    af_format_response(resp)
end

post '/service/:id/role_action' do
    client = af_build_client
    
    resp = client.post('/service/' +  params[:id] + '/role_action' , @request_body)
    
    af_format_response(resp)
end

##############################################################################
# Service Template
##############################################################################

get '/service_template' do
    client = af_build_client

    resp = client.get('/service_template')

    af_format_response(resp)
end

get '/service_template/:id' do
    client = af_build_client

    resp = client.get('/service_template/' + params[:id])

    af_format_response(resp)
end

delete '/service_template/:id' do
    client = af_build_client

    resp = client.delete('/service_template/' + params[:id], @request_body)

    af_format_response(resp)
end

post '/service_template/:id/action' do
    client = af_build_client
    client.set_content_type(content_type)
    resp = client.post('/service_template/' + params[:id] + '/action', @request_body)

    af_format_response(resp)
end

post '/service_template' do
    client = af_build_client
    client.set_content_type(content_type)
    resp = client.post('/service_template', @request_body)

    af_format_response(resp)
end
