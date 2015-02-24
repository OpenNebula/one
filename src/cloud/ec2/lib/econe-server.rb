# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

##############################################################################
# Environment Configuration for the Cloud Server
##############################################################################
ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    LOG_LOCATION = "/var/log/one"
    VAR_LOCATION = "/var/lib/one"
    ETC_LOCATION = "/etc/one"
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
else
    VAR_LOCATION = ONE_LOCATION + "/var"
    LOG_LOCATION = ONE_LOCATION + "/var"
    ETC_LOCATION = ONE_LOCATION + "/etc"
    RUBY_LIB_LOCATION = ONE_LOCATION+"/lib/ruby"
end

EC2_AUTH           = VAR_LOCATION + "/.one/ec2_auth"
EC2_LOG            = LOG_LOCATION + "/econe-server.log"
CONFIGURATION_FILE = ETC_LOCATION + "/econe.conf"

TEMPLATE_LOCATION  = ETC_LOCATION + "/ec2query_templates"
VIEWS_LOCATION     = RUBY_LIB_LOCATION + "/cloud/econe/views"

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+"/cloud"
$: << RUBY_LIB_LOCATION+"/cloud/econe"

###############################################################################
# Libraries
###############################################################################
require 'rubygems'
require 'sinatra'
require 'yaml'
require 'uri'

require 'EC2QueryServer'
require 'econe_application'
require 'CloudAuth'

include OpenNebula

begin
    $ec2_app = EC2Application.new
rescue Exception => e
    STDERR.puts e.message
    exit -1
end

##############################################################################
# Sinatra Configuration
##############################################################################

disable :logging

use Rack::CommonLogger, $ec2_app.logger

set :bind, $ec2_app.conf[:host]
set :port, $ec2_app.conf[:port]

set :run, false

##############################################################################
# Actions
##############################################################################

before do
    begin
        params['econe_host'] = $ec2_app.econe_host
        params['econe_port'] = $ec2_app.econe_port
        params['econe_path'] = $ec2_app.econe_path

        username = $ec2_app.authenticate(request.env, params)
    rescue Exception => e
        $ec2_app.logger.error {e.message}

        rc = OpenNebula::Error.new(e.message)
        rc.ec2_code = "AuthFailure"

        error 401, rc.to_ec2
    end

    if username.nil?
        rc = OpenNebula::Error.new("The username or password is not correct")
        rc.ec2_code = "AuthFailure"

        error 401, rc.to_ec2
    else
        params['econe_username'] = username
    end
end

# Response treatment
helpers do
    def logger
        $ec2_app.logger
    end

    def treat_response(result, rc)
        if OpenNebula::is_error?(result)
            logger.error(result.message)
            error CloudServer::HTTP_ERROR_CODE[result.errno],
                  result.to_ec2.gsub(/\n\s*/,'')
        end

        headers['Content-Type'] = 'application/xml'

        status rc if rc

        logger.error { params['Action'] }

        result.gsub(/\n\s*/,'')
    end
end

post '/' do
    result, rc = $ec2_app.do_http_request(params)
    treat_response(result, rc)
end

get '/' do
    result, rc = $ec2_app.do_http_request(params)
    treat_response(result, rc)
end

Sinatra::Application.run!
