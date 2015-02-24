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
require 'tags'

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
    include Tags

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

    # TODO Kernel, Ramdisk, Arch, BlockDeviceMapping
    def register_image(params)
        # Get the Image ID
        image_id = params['ImageLocation']

        if image_id =~ /ami\-(.+)/
            image_id = $1
        end
        
        image = ImageEC2.new(Image.build_xml(image_id.to_i), @client)
        rc = image.info
        if OpenNebula.is_error?(rc)
            return rc
        end

        if image["EBS_VOLUME"] == "YES"
            return OpenNebula::Error.new("The image you are trying to register"\
                " is already a volume")
        elsif image["EBS_SNAPSHOT"] == "YES"
            return OpenNebula::Error.new("The image you are trying to register"\
                " is already an snapshot")
        end

        image.add_element('TEMPLATE', {"EC2_AMI" => "YES"})
        rc = image.update
        if OpenNebula.is_error?(rc)
            return rc
        end

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/register_image.erb"))
        return response.result(binding), 200
    end

    def describe_images(params)
        impool = []
        params.each { |key, value|
            if key =~ /ImageId\./
                if value =~ /ami\-(.+)/
                    image = ImageEC2.new(Image.build_xml($1), @client)
                    rc = image.info
                    if OpenNebula.is_error?(rc) || !image.ec2_ami?
                        rc ||= OpenNebula::Error.new()
                        rc.ec2_code = "InvalidAMIID.NotFound"
                        return rc
                    else
                        impool << image
                    end
                else
                    rc = OpenNebula::Error.new("InvalidAMIID.Malformed #{value}")
                    rc.ec2_code = "InvalidAMIID.Malformed"
                    return rc
                end
            end
        }

        if impool.empty?
            user_flag = OpenNebula::Pool::INFO_ALL
            impool = ImageEC2Pool.new(@client, user_flag)

            rc = impool.info
            return rc if OpenNebula::is_error?(rc)
        end

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/describe_images.erb"))
        return response.result(binding), 200
    end

    # TODO: NoReboot = false, cleanly shut down the instance before image
    #   creation and then reboots the instance.
    # TODO: If you customized your instance with instance store volumes
    #   or EBS volumes in addition to the root device volume, the
    #   new AMI contains block device mapping information for those volumes
    def create_image(params)
        instance_id = params['InstanceId']
        instance_id = instance_id.split('-')[1]

        vm = VirtualMachine.new(
                VirtualMachine.build_xml(instance_id),
                @client)

        rc = vm.info
        if OpenNebula::is_error?(rc)
            rc.ec2_code = "InvalidInstanceID.NotFound"
            return rc
        end

        image_id = vm.disk_snapshot(1,
                    params["Name"],
                    OpenNebula::Image::IMAGE_TYPES[0],
                    true)

        # TODO Add AMI Tags
        # TODO A new persistent image should be created for each instance

        if OpenNebula::is_error?(image_id)
            return image_id
        end

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/create_image.erb"))
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

