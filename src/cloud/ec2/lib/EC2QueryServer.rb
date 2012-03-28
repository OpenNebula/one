# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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
require 'AWS'
require 'base64'
require 'CloudServer'

require 'ImageEC2'

###############################################################################
# The EC2Query Server implements a EC2 compatible server based on the
# OpenNebula Engine
###############################################################################
class EC2QueryServer < CloudServer

    ###########################################################################
    # Class Constants. Defined the EC2 and OpenNebula State mapping
    ###########################################################################
    EC2_STATES={
        :pending    => {:code => 0, :name => 'pending'},
        :running    => {:code => 16,:name => 'running'},
        :shutdown   => {:code => 32,:name => 'shutting-down'},
        :terminated => {:code => 48,:name => 'terminated'}
    }

    ONE_STATES={
        'init' => :pending,
        'pend' => :pending,
        'hold' => :pending,
        'stop' => :pending,
        'susp' => :pending,
        'done' => :terminated,
        'fail' => :terminated,
        'prol' => :pending,
        'boot' => :running,
        'runn' => :running,
        'migr' => :running,
        'save' => :pending,
        'epil' => :shutdown,
        'shut' => :shutdown,
        'clea' => :shutdown,
        'fail' => :terminated,
        'unkn' => :terminated
    }

    ###########################################################################

    def initialize(client, oneadmin_client, config, logger)
        super(config, logger)

        @client = client
        @oneadmin_client = oneadmin_client

        if @config[:elasticips_vnet_id].nil?
            logger.error { 'ElasticIP module not loaded' }
        else
            require 'elastic_ip'
            extend ElasticIP
        end
    end

    ###########################################################################
    # Repository Interface
    ###########################################################################

    def upload_image(params)
        image = ImageEC2.new(Image.build_xml, @client, params['file'])

        template = image.to_one_template
        if OpenNebula.is_error?(template)
            return OpenNebula::Error.new('Unsupported'), 400
        end

        rc = image.allocate(template, @config[:datastore_id]||1)
        if OpenNebula.is_error?(rc)
            return OpenNebula::Error.new('Unsupported'), 400
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
            return OpenNebula::Error.new('InvalidAMIID.NotFound'), 400
        end

        image.enable

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/register_image.erb"))
        return response.result(binding), 200
    end

    def describe_images(params)
        user_flag = OpenNebula::Pool::INFO_ALL
        impool = ImagePool.new(@client, user_flag)
        impool.info

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/describe_images.erb"))
        return response.result(binding), 200
    end

    ###########################################################################
    # Instance Interface
    ###########################################################################

    def run_instances(params)
        # Get the instance type and path
        if params['InstanceType'] != nil
            instance_type_name = params['InstanceType']
            instance_type      = @config[:instance_types][instance_type_name.to_sym]

            if instance_type != nil
                path = @config[:template_location] + "/#{instance_type[:template]}"
            end
        end

        # Get the image
        tmp, img=params['ImageId'].split('-')

        # Build the VM
        erb_vm_info=Hash.new
        erb_vm_info[:img_id]        = img.to_i
        erb_vm_info[:ec2_img_id]    = params['ImageId']
        erb_vm_info[:instance_type] = instance_type_name
        erb_vm_info[:template]      = path
        erb_vm_info[:user_data]     = params['UserData']

        template      = ERB.new(File.read(erb_vm_info[:template]))
        template_text = template.result(binding)

        # Start the VM.
        vm = VirtualMachine.new(VirtualMachine.build_xml, @client)

        rc = vm.allocate(template_text)
        if OpenNebula::is_error?(rc)
            return OpenNebula::Error.new('Unsupported'),400
        end

        vm.info

        erb_vm_info[:vm_id]=vm.id
        erb_vm_info[:vm]=vm
        erb_user_name = params['AWSAccessKeyId']
        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/run_instances.erb"))
        return response.result(binding), 200
    end

    def describe_instances(params)
        user_flag = OpenNebula::Pool::INFO_ALL
        vmpool = VirtualMachinePool.new(@client, user_flag)
        vmpool.info

        erb_version = params['Version']
        erb_user_name = params['AWSAccessKeyId']

        response = ERB.new(File.read(@config[:views]+"/describe_instances.erb"))
        return response.result(binding), 200
    end

    def terminate_instances(params)
        # Get the VM ID
        vmid=params['InstanceId.1']
        vmid=params['InstanceId.01'] if !vmid

        tmp, vmid=vmid.split('-') if vmid[0]==?i

        vm = VirtualMachine.new(VirtualMachine.build_xml(vmid),@client)
        rc = vm.info

        return OpenNebula::Error.new('Unsupported'),400 if OpenNebula::is_error?(rc)

        if vm.status == 'runn'
            rc = vm.shutdown
        else
            rc = vm.finalize
        end

        return OpenNebula::Error.new('Unsupported'),400 if OpenNebula::is_error?(rc)

        erb_version = params['Version']

        response =ERB.new(File.read(@config[:views]+"/terminate_instances.erb"))
        return response.result(binding), 200
    end

    ###########################################################################
    # Elastic IP
    ###########################################################################
    def allocate_address(params)
        return OpenNebula::Error.new('Unsupported'),400
    end

    def release_address(params)
        return OpenNebula::Error.new('Unsupported'),400
    end

    def describe_addresses(params)
        return OpenNebula::Error.new('Unsupported'),400
    end

    def associate_address(params)
        return OpenNebula::Error.new('Unsupported'),400
    end

    def disassociate_address(params)
        return OpenNebula::Error.new('Unsupported'),400
    end

    ###########################################################################
    # Helper functions
    ###########################################################################
    private

    def render_state(vm)
        one_state = ONE_STATES[vm.status]
        ec2_state = EC2_STATES[one_state||:pending]

        return "<code>#{ec2_state[:code]}</code>
        <name>#{ec2_state[:name]}</name>"
    end

    def render_launch_time(vm)
        return "<launchTime>#{Time.at(vm["STIME"].to_i).xmlschema}</launchTime>"
    end
end

