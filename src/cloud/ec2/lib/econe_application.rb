# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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

require 'CloudServer'

class EC2Application
    ############################################################################
    # Configuration constants
    ############################################################################
    EC2_AUTH           = VAR_LOCATION + "/.one/ec2_auth"
    EC2_LOG            = LOG_LOCATION + "/econe-server.log"
    CONFIGURATION_FILE = ETC_LOCATION + "/econe.conf"

    TEMPLATE_LOCATION  = ETC_LOCATION + "/ec2query_templates"
    VIEWS_LOCATION     = RUBY_LIB_LOCATION + "/cloud/econe/views"

    ############################################################################
    # Attribute accesors
    ############################################################################
    attr_reader :conf
    attr_reader :logger
    attr_reader :econe_host, :econe_port, :econe_path

    ############################################################################
    # Initialization of the EC2 application server
    ############################################################################
    def initialize
        # ----------- Parse configuration -----------
        begin
            @conf = YAML.load_file(CONFIGURATION_FILE)
        rescue Exception => e
            raise "Error parsing file #{CONFIGURATION_FILE}: #{e.message}"
        end

        @conf[:template_location] = TEMPLATE_LOCATION
        @conf[:views] = VIEWS_LOCATION
        @conf[:debug_level] ||= 3

        CloudServer.print_configuration(@conf)

        # ----------- Init logging system -----------
        @logger = CloudLogger::CloudLogger.new(EC2_LOG)

        @logger.level     = CloudLogger::DEBUG_LEVEL[@conf[:debug_level].to_i]
        @logger.formatter = proc do |severity, datetime, progname, msg|
             CloudLogger::MSG_FORMAT % [
                datetime.strftime( CloudLogger::DATE_FORMAT),
                severity[0..0],
                msg ]
        end

        # ----------- Init Authentication System -----------
        begin
            ENV["ONE_CIPHER_AUTH"] = EC2_AUTH
            @cloud_auth = CloudAuth.new(@conf, @logger)
        rescue => e
            raise "Error initializing authentication system: #{e.message}"
        end

        # ----------- Check port -----------
        if CloudServer.is_port_open?(@conf[:host], @conf[:port])
            raise "Port #{@conf[:port]} busy."
        end

        # ----------- Init EC2 attributes -----------
        if @conf[:ssl_server]
            uri = URI.parse(@conf[:ssl_server])
            @econe_host = uri.host
            @econe_port = uri.port
            @econe_path = uri.path
        else
            @econe_host = @conf[:host]
            @econe_port = @conf[:port]
            @econe_path = '/'
        end
    end

    ############################################################################
    # Authentication & route methods
    ############################################################################
    def authenticate(renv, rparams)
        @cloud_auth.auth(renv, rparams)
    end

    def do_http_request(params)

        econe_server = EC2QueryServer.new(
            @cloud_auth.client(params['econe_username']), @cloud_auth.client,
            @conf, @logger)

        case params['Action']
        when 'UploadImage'
            result,rc = econe_server.upload_image(params)
        when 'RegisterImage'
            result,rc = econe_server.register_image(params)
        when 'DescribeImages'
            result,rc = econe_server.describe_images(params)
        when 'RunInstances'
            result,rc = econe_server.run_instances(params)
        when 'DescribeInstances'
            result,rc = econe_server.describe_instances(params)
        when 'TerminateInstances'
            result,rc = econe_server.terminate_instances(params)
        when 'StartInstances'
            result,rc = econe_server.start_instances(params)
        when 'StopInstances'
            result,rc = econe_server.stop_instances(params)
        when 'RebootInstances'
            result,rc = econe_server.reboot_instances(params)
        when 'AllocateAddress'
            result,rc = econe_server.allocate_address(params)
        when 'AssociateAddress'
            result,rc = econe_server.associate_address(params)
        when 'DisassociateAddress'
            result,rc = econe_server.disassociate_address(params)
        when 'ReleaseAddress'
            result,rc = econe_server.release_address(params)
        when 'DescribeAddresses'
            result,rc = econe_server.describe_addresses(params)
        when 'DescribeRegions'
            result,rc = econe_server.describe_regions(params)
        when 'DescribeAvailabilityZones'
            result,rc = econe_server.describe_availability_zones(params)
        when 'CreateSnapshot'
            result,rc = econe_server.create_snapshot(params)
        when 'DeleteSnapshot'
            result,rc = econe_server.delete_snapshot(params)
        when 'DescribeSnapshots'
            result,rc = econe_server.describe_snapshots(params)
        when 'CreateTags'
            result,rc = econe_server.create_tags(params)
        when 'DeleteTags'
            result,rc = econe_server.delete_tags(params)
        when 'DescribeTags'
            result,rc = econe_server.describe_tags(params)
        #when 'CreateImage'
        #    result,rc = econe_server.create_image(params)
        when 'CreateVolume'
            result,rc = econe_server.create_volume(params)
        when 'DescribeVolumes'
            result,rc = econe_server.describe_volumes(params)
        when 'AttachVolume'
            result,rc = econe_server.attach_volume(params)
        when 'DetachVolume'
            result,rc = econe_server.detach_volume(params)
        when 'DeleteVolume'
            result,rc = econe_server.delete_volume(params)
        when 'DescribeKeyPairs'
            result,rc = econe_server.describe_keypairs(params)
        when 'CreateKeyPair'
            result,rc = econe_server.create_keypair(params)
        when 'DeleteKeyPair'
            result,rc = econe_server.delete_keypair(params)
        else
            result = OpenNebula::Error.new(
                "#{params['Action']} feature is not supported",
                OpenNebula::Error::ENO_EXISTS)
        end

        return result, rc
    end
end
