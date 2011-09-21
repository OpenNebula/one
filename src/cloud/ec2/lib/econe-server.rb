# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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
    RUBY_LIB_LOCATION  = "/usr/lib/one/ruby"
    CONFIGURATION_FILE = "/etc/one/econe.conf"
    TEMPLATE_LOCATION  = "/etc/one/ec2query_templates"
else
    RUBY_LIB_LOCATION  = ONE_LOCATION+"/lib/ruby"
    CONFIGURATION_FILE = ONE_LOCATION+"/etc/econe.conf"
    TEMPLATE_LOCATION  = ONE_LOCATION+"/etc/ec2query_templates"
end

VIEWS_LOCATION = RUBY_LIB_LOCATION + "/cloud/econe/views"

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+"/cloud"
$: << RUBY_LIB_LOCATION+"/cloud/econe"

###############################################################################
# Libraries
###############################################################################
require 'rubygems'
require 'sinatra'

require 'EC2QueryServer'
require 'Configuration'

include OpenNebula

##############################################################################
# Parse Configuration file
##############################################################################
begin
    conf = YAML.load_file(CONFIGURATION_FILE)
rescue Exception => e
    puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
    exit 1
end

conf[:template_location] = TEMPLATE_LOCATION
conf[:views] = VIEWS_LOCATION

CloudServer.print_configuration(conf)

##############################################################################
# Sinatra Configuration
##############################################################################
set :config, conf
set :host, settings.config[:server]
set :port, settings.config[:port]

if CloudServer.is_port_open?(settings.config[:server],
                             settings.config[:port])
    puts "Port busy, please shutdown the service or move econe server port."
    exit 1
end

##############################################################################
# Actions
##############################################################################

before do
    @econe_server = EC2QueryServer.new(settings.config)
    result = @econe_server.authenticate(request.env, params)
    if result
        # Add a log message
        error 400, error_xml("AuthFailure", 0)
    end
end

helpers do
    def error_xml(code,id)
        message = ''

        case code
        when 'AuthFailure'
            message = 'User not authorized'
        when 'InvalidAMIID.NotFound'
            message = 'Specified AMI ID does not exist'
        when 'Unsupported'
            message = 'The instance type or feature is not supported in your requested Availability Zone.'
        else
            message = code
        end

        xml = "<Response><Errors><Error><Code>"+
                    code +
                    "</Code><Message>" +
                    message +
                    "</Message></Error></Errors><RequestID>" +
                    id.to_s +
                    "</RequestID></Response>"

        return xml
    end
end

post '/' do
    do_http_request(params)
end

get '/' do
    do_http_request(params)
end

def do_http_request(params)
    case params['Action']
        when 'UploadImage'
            result,rc = @econe_server.upload_image(params)
        when 'RegisterImage'
            result,rc = @econe_server.register_image(params)
        when 'DescribeImages'
            result,rc = @econe_server.describe_images(params)
        when 'RunInstances'
            result,rc = @econe_server.run_instances(params)
        when 'DescribeInstances'
            result,rc = @econe_server.describe_instances(params)
        when 'TerminateInstances'
            result,rc = @econe_server.terminate_instances(params)
    end

    if OpenNebula::is_error?(result)
        error rc, error_xml(result.message, 0)
    end

    headers['Content-Type'] = 'application/xml'

    result
end
