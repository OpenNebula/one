# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project Leads (OpenNebula.org)             #
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
require 'CloudAuth'

include OpenNebula

##############################################################################
# Parse Configuration file
##############################################################################
begin
    conf = YAML.load_file(CONFIGURATION_FILE)
rescue Exception => e
    STDERR.puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
    exit 1
end

conf[:template_location] = TEMPLATE_LOCATION
conf[:views] = VIEWS_LOCATION
conf[:debug_level] ||= 3

CloudServer.print_configuration(conf)

##############################################################################
# Sinatra Configuration
##############################################################################
set :config, conf

include CloudLogger
enable_logging EC2_LOG, settings.config[:debug_level].to_i

if settings.config[:server]
    settings.config[:host] ||= settings.config[:server]
    warning = "Warning: :server: configuration parameter has been deprecated."
    warning << " Use :host: instead."
    settings.logger.warn warning
end

if CloudServer.is_port_open?(settings.config[:host],
                             settings.config[:port])
    settings.logger.error {
        "Port #{settings.config[:port]} busy, please shutdown " <<
        "the service or move occi server port."
    }
    exit -1
end

set :bind, settings.config[:host]
set :port, settings.config[:port]

begin
    ENV["ONE_CIPHER_AUTH"] = EC2_AUTH
    cloud_auth = CloudAuth.new(settings.config, settings.logger)
rescue => e
    settings.logger.error {"Error initializing authentication system"}
    settings.logger.error {e.message}
    exit -1
end

set :cloud_auth, cloud_auth

if conf[:ssl_server]
    uri = URI.parse(conf[:ssl_server])
    econe_host = uri.host
    econe_port = uri.port
    econe_path = uri.path
else
    econe_host = settings.config[:host]
    econe_port = settings.config[:port]
    econe_path = '/'
end

set :econe_host, econe_host
set :econe_port, econe_port
set :econe_path, econe_path

##############################################################################
# Actions
##############################################################################

before do
    begin
        params['econe_host'] = settings.econe_host
        params['econe_port'] = settings.econe_port
        params['econe_path'] = settings.econe_path
        username = settings.cloud_auth.auth(request.env, params)
    rescue Exception => e
        logger.error {e.message}
        rc = OpenNebula::Error.new(e.message)
        rc.ec2_code = "AuthFailure"
        error 401, rc.to_ec2
    end

    if username.nil?
        rc = OpenNebula::Error.new("The username or password is not correct")
        rc.ec2_code = "AuthFailure"
        error 401, rc.to_ec2
    else
        client          = settings.cloud_auth.client(username)
        oneadmin_client = settings.cloud_auth.client
        @econe_server   = EC2QueryServer.new(
                            client,
                            oneadmin_client,
                            settings.config,
                            settings.logger)
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
        when 'StartInstances'
            result,rc = @econe_server.start_instances(params)
        when 'StopInstances'
            result,rc = @econe_server.stop_instances(params)
        when 'RebootInstances'
            result,rc = @econe_server.reboot_instances(params)
        when 'AllocateAddress'
            result,rc = @econe_server.allocate_address(params)
        when 'AssociateAddress'
            result,rc = @econe_server.associate_address(params)
        when 'DisassociateAddress'
            result,rc = @econe_server.disassociate_address(params)
        when 'ReleaseAddress'
            result,rc = @econe_server.release_address(params)
        when 'DescribeAddresses'
            result,rc = @econe_server.describe_addresses(params)
        when 'DescribeRegions'
            result,rc = @econe_server.describe_regions(params)
        when 'DescribeAvailabilityZones'
            result,rc = @econe_server.describe_availability_zones(params)
        when 'CreateVolume'
            result,rc = @econe_server.create_volume(params)
        when 'DescribeVolumes'
            result,rc = @econe_server.describe_volumes(params)
        when 'AttachVolume'
            result,rc = @econe_server.attach_volume(params)
        when 'DetachVolume'
            result,rc = @econe_server.detach_volume(params)
        when 'DeleteVolume'
            result,rc = @econe_server.delete_volume(params)
        when 'DescribeKeyPairs'
            result,rc = @econe_server.describe_keypairs(params)
        when 'CreateKeyPair'
            result,rc = @econe_server.create_keypair(params)
        when 'DeleteKeyPair'
            result,rc = @econe_server.delete_keypair(params)
        else
            result = OpenNebula::Error.new(
                "#{params['Action']} feature is not supported",
                OpenNebula::Error::ENO_EXISTS)
    end

    if OpenNebula::is_error?(result)
        logger.error(result.message)
        error CloudServer::HTTP_ERROR_CODE[result.errno], result.to_ec2.gsub(/\n\s*/,'')
    end

    headers['Content-Type'] = 'application/xml'

    if rc
        status rc
    end

    logger.error { params['Action'] }

    result.gsub(/\n\s*/,'')
end
