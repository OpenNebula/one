# -------------------------------------------------------------------------- #
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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
require 'sinatra'
require 'erb'
require 'time'
require 'AWS'
require 'CloudServer'
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
        'prol' => :pend,
        'boot' => :running,
        'runn' => :running,
        'migr' => :running,
        'save' => :pend,
        'epil' => :shutdown,
        'shut' => :shutdown,
        'fail' => :terminated,
        'dele' => :terminated,
        'unkn' => :terminated
    }

    ###########################################################################

    def initialize(config_file,template,views)
        super(config_file)
        @config.add_configuration_value("TEMPLATE_LOCATION",template)
        @config.add_configuration_value("VIEWS",views)

        print_configuration
    end

    ###########################################################################
    # Authentication functions
    ###########################################################################

    # EC2 protocol authentication function
    # params:: of the request
    # [return] true if authenticated
    def authenticate?(params)
        user = get_user(params['AWSAccessKeyId'])
        return false if !user
        
        signature_params = params.reject { |key,value| 
            key=='Signature' or key=='file' }

        signature = AWS.encode(
                       user[:password], 
                       AWS.canonical_string(signature_params, @config[:server]),
                       false)
        
        return params['Signature']==signature
    end

    ###########################################################################
    # Repository Interface
    ###########################################################################

    def upload_image(params)
        user  = get_user(params['AWSAccessKeyId'])

        image   = add_image(user[:id],params["file"][:tempfile])
        @erb_img_id = image.uuid

        pp image
        response = ERB.new(File.read(@config[:views]+"/register_image.erb"))
        return response.result(binding), 200
    end
    
    def register_image(params)
        user  = get_user(params['AWSAccessKeyId'])
        image = get_image(params['ImageLocation'])

        if !image
            return OpenNebula::Error.new('Image not found'), 404
        elsif user[:id] != image[:owner]
            return OpenNebula::Error.new('Not permited to use image'), 401
        end

        @erb_img_id=image.uuid

        response = ERB.new(File.read(@config[:views]+"/register_image.erb"))
        return response.result(binding), 200
    end

    def describe_images(params)
        @erb_user   = get_user(params['AWSAccessKeyId'])
        @erb_images = Image.filter(:owner => @erb_user[:id])
       
        response = ERB.new(File.read(@config[:views]+"/describe_images.erb"))
        return response.result(binding), 200
    end

    ###########################################################################
    # Instance Interface
    ###########################################################################

    def run_instances(params)
        # Get the instance type
        instance_type_name = params['InstanceType']
        instance_type      = @instance_types[instance_type_name]
        
        return OpenNebula::Error.new('Bad instance type'),400 if !instance_type

        # Get the image
        image = get_image(params['ImageId'])
        
        return OpenNebula::Error.new('Bad image id'),400 if !image

        # Get the user
        user       = get_user(params['AWSAccessKeyId'])
        one_client = one_client_user(user) 
        @erb_user_name = user[:name]
       
        # Build the VM 
        @erb_vm_info=Hash.new

        @erb_vm_info[:img_path]      = image.path
        @erb_vm_info[:img_id]        = params['ImageId']
        @erb_vm_info[:instance_type] = instance_type_name
        @erb_vm_info[:template]      = @config[:template_location] + 
                                       "/#{instance_type['TEMPLATE']}"

        template      = ERB.new(File.read(@erb_vm_info[:template]))
        template_text = template.result(binding)

        #Start the VM.
        vm = VirtualMachine.new(VirtualMachine.build_xml, one_client)
        rc = vm.allocate(template_text)
        
        return rc, 401 if OpenNebula::is_error?(rc)

        vm.info
        
        @erb_vm_info[:vm_id]=vm.id
        @erb_vm_info[:vm]=vm
        
        response = ERB.new(File.read(@config[:views]+"/run_instances.erb"))
        return response.result(binding), 200
    end


    def describe_instances(params)
        # Get the user
        user       = get_user(params['AWSAccessKeyId'])
        one_client = one_client_user(user) 

        @erb_user_name = user[:name]

        if user[:id]==0
            user_flag=-2
        else
            user_flag=-1
        end

        @erb_vmpool = VirtualMachinePool.new(one_client, user_flag)
        @erb_vmpool.info
        
        response = ERB.new(File.read(@config[:views]+"/describe_instances.erb"))
        return response.result(binding), 200
    end

    def terminate_instances(params)
        # Get the user
        user       = get_user(params['AWSAccessKeyId'])
        one_client = one_client_user(user) 
        
        vmid=params['InstanceId.1']
        
        @erb_vm = VirtualMachine.new(VirtualMachine.build_xml(vmid),one_client)
        rc      = @erb_vm.info
        
        return rc, 401 if OpenNebula::is_error?(rc)
        
        if @erb_vm.status == 'runn'
            rc = @erb_vm.shutdown
        else
            rc = @erb_vm.finalize
        end
        
        return rc, 401 if OpenNebula::is_error?(rc)
        
        response =ERB.new(File.read(@config[:views]+"/terminate_instances.erb"))
        return response.result(binding), 200
    end

private
    ###########################################################################
    # Helper functions
    ###########################################################################
    def render_state(vm)
        ec2_state = EC2_STATES[ONE_STATES[vm.status]]
        
        return "<code>#{ec2_state[:code]}</code> 
        <name>#{ec2_state[:name]}</name>"
    end

    def render_launch_time(vm)
        return "<launchTime>#{Time.at(vm[:stime].to_i).xmlschema}</launchTime>"
    end
end

