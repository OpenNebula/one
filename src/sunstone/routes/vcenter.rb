# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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
        hpref        = "HTTP_"
        head_user    = "X_VCENTER_USER"
        head_pwd     = "X_VCENTER_PASSWORD"
        head_vhost   = "X_VCENTER_HOST"
        reqenv       = request.env

        vuser = reqenv[head_user] ? reqenv[head_user] : reqenv[hpref+head_user]
        vpass = reqenv[head_pwd] ? reqenv[head_pwd] : reqenv[hpref+head_pwd]
        vhost = reqenv[head_vhost] ? reqenv[head_vhost] : reqenv[hpref+head_vhost]

        if vuser.nil? || vpass.nil? || vhost.nil?
            msg = "You have to provide the vCenter username, password and hostname"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        return VCenterDriver::VIClient.new_connection({
            :user     => vuser,
            :password => vpass,
            :host     => vhost},
            ::OpenNebula::Client.new(nil,$conf[:one_xmlrpc]))
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

get '/vcenter/templates' do
    begin
        templates = vcenter_client.vm_templates(
            $cloud_auth.client(session[:user], session[:active_zone_endpoint]))
        if templates.nil?
            msg = "No datacenter found"
            logger.error("[vCenter] " + msg)
            error = Error.new(msg)
            error 404, error.to_json
        end

        #ctemplates = templates.select{|t| t[:host] == params[:name]}
        [200, templates.to_json]
    rescue Exception => e
        logger.error("[vCenter] " + e.message)
        error = Error.new(e.message)
        error 403, error.to_json
    end
end

get '/vcenter/networks' do
    begin
        networks = vcenter_client.vcenter_networks(
            $cloud_auth.client(session[:user], session[:active_zone_endpoint]))
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
        images = vcenter_client.vcenter_images(params[:ds_name],
            $cloud_auth.client(session[:user], session[:active_zone_endpoint]))

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
        datastores = vcenter_client.vcenter_datastores(
            $cloud_auth.client(session[:user], session[:active_zone_endpoint]))
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
