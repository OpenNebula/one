# -------------------------------------------------------------------------- #
# Copyright 2010-2015, C12G Labs S.L.                                        #
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
    	vuser = request.env['HTTP_X_VCENTER_USER']
    	vpass = request.env['HTTP_X_VCENTER_PASSWORD']
    	vhost = request.env['HTTP_X_VCENTER_HOST']

    	if vuser.nil? || vpass.nil? || vhost.nil?
    		msg = "You have to provide the vCenter username, password and hostname"
	        logger.error("[vCenter] " + msg)
	        error = Error.new(msg)
	        error 404, error.to_json
	    end

	    return VCenterDriver::VIClient.new_connection(
	        :user     => vuser,
	        :password => vpass,
	        :host     => vhost)
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
	    rs = vcenter_client.hierarchy
	    [200, rs.to_json]
	rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
	end
end

get '/vcenter/:datacenter/cluster/:name' do
	begin
	    rs = vcenter_client.vm_templates

	    templates = rs[params[:datacenter]]
	    if templates.nil?
    		msg = "Datacenter " + params[:datacenter] + "not found"
	        logger.error("[vCenter] " + msg)
	        error = Error.new(msg)
	        error 404, error.to_json
	    end

	    ctemplates = templates.select{|t| t[:host] == params[:name]}
	    [200, ctemplates.to_json]
	rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
	end
end

get '/vcenter/:datacenter/network/:name' do
    begin
        rs = vcenter_client.vcenter_networks

        networks = rs[params[:datacenter]]
        if networks.nil?
            msg = "Datacenter " + params[:datacenter] + "not found"
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