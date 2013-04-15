# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'rubygems'
require 'erb'
require 'time'
require 'base64'
require 'uuidtools'
require 'AWS'

require 'CloudServer'
require 'ImageEC2'

require 'ebs'
require 'elastic_ip'
require 'instance'
require 'keypair'

################################################################################
#  Extends the OpenNebula::Error class to include an EC2 render of error
#  messages
################################################################################

module OpenNebula
    EC2_ERROR = %q{
        <Response>
            <RequestId/>
            <Errors>
                <Error>
                    <Code><%= (@ec2_code||'UnsupportedOperation') %></Code>
                    <Message><%= @message %></Message>
                </Error>
            </Errors>
        </Response>
    }

    class Error
        attr_accessor :ec2_code

        def to_ec2
            ERB.new(EC2_ERROR).result(binding)
        end
    end
end

###############################################################################
# The EC2Query Server implements a EC2 compatible server based on the
# OpenNebula Engine
###############################################################################
class EC2QueryServer < CloudServer

    include ElasticIP
    include Keypair
    include EBS
    include Instance

    ############################################################################
    #
    #
    ############################################################################
    def initialize(client, oneadmin_client, config, logger)
        super(config, logger)

        @client          = client
        @oneadmin_client = oneadmin_client

        if config[:ssl_server]
            @base_url=config[:ssl_server]
        else
            @base_url="http://#{config[:host]}:#{config[:port]}"
        end

        @request_id = UUIDTools::UUID.random_create.to_s
    end

    ###########################################################################
    # Regions and Availability Zones
    ###########################################################################

    def describe_availability_zones(params)
        response = ERB.new(File.read(@config[:views]+"/describe_availability_zones.erb"))
        return response.result(binding), 200
    end

    def describe_regions(params)
        response = ERB.new(File.read(@config[:views]+"/describe_regions.erb"))
        return response.result(binding), 200
    end

    ###########################################################################
    # Repository Interface
    ###########################################################################

    def upload_image(params)
        image = ImageEC2.new(Image.build_xml,
                    @client,
                    params['file'],
                    {:type => "OS"})

        template = image.to_one_template
        if OpenNebula.is_error?(template)
            return template
        end

        rc = image.allocate(template, @config[:datastore_id]||1)
        if OpenNebula.is_error?(rc)
            return rc
        end

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/register_image.erb"))
        return response.result(binding), 200
    end

    def register_image(params)
        # Get the Image ID
        tmp, img=params['ImageLocation'].split('-')

        image = Image.new(Image.build_xml(img.to_i), @client)

        # Enable the new Image
        rc = image.info
        if OpenNebula.is_error?(rc)
            rc.ec2_code = "InvalidAMIID.NotFound"
            return rc
        end

        image.enable

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/register_image.erb"))
        return response.result(binding), 200
    end

    def describe_images(params)
        user_flag = OpenNebula::Pool::INFO_ALL
        impool = ImageEC2Pool.new(@client, user_flag)

        rc = impool.info
        return rc if OpenNebula::is_error?(rc)

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/describe_images.erb"))
        return response.result(binding), 200
    end

    ###########################################################################
    # Helper functions
    ###########################################################################
    private

    def render_launch_time(vm)
        return "<launchTime>#{Time.at(vm["STIME"].to_i).xmlschema}</launchTime>"
    end
end

