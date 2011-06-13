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

require 'rubygems'
require 'sinatra'
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
        'fail' => :terminated,
        'dele' => :terminated,
        'unkn' => :terminated
    }

    ###########################################################################

    def initialize(config_file,template,views)
        super(config_file)
        @config.add_configuration_value("TEMPLATE_LOCATION",template)
        @config.add_configuration_value("VIEWS",views)

        if @config[:ssl_server]
            @server_host=@config[:ssl_server]
        else
            @server_host=@config[:server]
        end

        @server_port=@config[:port]

        print_configuration
    end

    ###########################################################################
    # Authentication functions
    ###########################################################################

    # EC2 protocol authentication function
    # params:: of the request
    # [return] true if authenticated
    def authenticate(params,env)
        password = get_user_password(params['AWSAccessKeyId'])
        return nil if !password

        signature = case params['SignatureVersion']
            when "1" then signature_version_1(params.clone, password)
            when "2" then signature_version_2(params,
                              password,
                              env,
                              true,
                              false)
        end

        if params['Signature']==signature
            return one_client_user(params['AWSAccessKeyId'], password)
        else
            if params['SignatureVersion']=="2"
                signature = signature_version_2(params,
                                  password,
                                  env,
                                  false,
                                  false)
                if params['Signature']==signature
                    return one_client_user(params['AWSAccessKeyId'], password)
                end
            end
        end

        return nil
    end


    ###########################################################################
    # Repository Interface
    ###########################################################################

    def upload_image(params, one_client)
        image = ImageEC2.new(Image.build_xml, one_client, params['file'])

        template = image.to_one_template
        if OpenNebula.is_error?(template)
            return OpenNebula::Error.new('Unsupported'), 400
        end

        rc = image.allocate(template)
        if OpenNebula.is_error?(rc)
            return OpenNebula::Error.new('Unsupported'), 400
        end

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/register_image.erb"))
        return response.result(binding), 200
    end

    def register_image(params, one_client)
        # Get the Image ID
        tmp, img=params['ImageLocation'].split('-')

        image = Image.new(Image.build_xml(img.to_i), one_client)

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

    def describe_images(params, one_client)
        user_flag=-1
        impool = ImagePool.new(one_client, user_flag)
        impool.info

        erb_user_name = params['AWSAccessKeyId']
        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/describe_images.erb"))
        return response.result(binding), 200
    end

    ###########################################################################
    # Instance Interface
    ###########################################################################

    def run_instances(params, one_client)
        # Get the instance type and path
        if params['InstanceType'] != nil
            instance_type_name = params['InstanceType']
            instance_type      = @instance_types[instance_type_name]

            if instance_type != nil
                path = @config[:template_location] + "/#{instance_type['TEMPLATE']}"
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
        vm = VirtualMachine.new(VirtualMachine.build_xml, one_client)

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

    def describe_instances(params, one_client)
        user_flag=-1
        vmpool = VirtualMachinePool.new(one_client, user_flag)
        vmpool.info

        erb_version = params['Version']
        erb_user_name = params['AWSAccessKeyId']
        
        response = ERB.new(File.read(@config[:views]+"/describe_instances.erb"))
        return response.result(binding), 200
    end

    def terminate_instances(params, one_client)
        # Get the VM ID
        vmid=params['InstanceId.1']
        vmid=params['InstanceId.01'] if !vmid

        tmp, vmid=vmid.split('-') if vmid[0]==?i

        vm = VirtualMachine.new(VirtualMachine.build_xml(vmid),one_client)
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

private

    # Calculates signature version 1
    def signature_version_1(params, secret_key, digest='sha1')
        params.delete('Signature')
        req_desc = params.sort {|x,y| x[0].downcase <=> y[0].downcase}.to_s

        digest_generator = OpenSSL::Digest::Digest.new(digest)
        digest = OpenSSL::HMAC.digest(digest_generator,
                                      secret_key,
                                      req_desc)
        b64sig = Base64.b64encode(digest)
        return b64sig.strip
    end

    # Calculates signature version 2
    def signature_version_2(params, secret_key, env, includeport=true, urlencode=true)
        signature_params = params.reject { |key,value|
            key=='Signature' or key=='file' }

        if includeport
            server_str = @server_host + ':' + @server_port
        else
            server_str = @server_host
        end

        canonical_str = AWS.canonical_string(signature_params,
                         server_str,
                         env['REQUEST_METHOD'])

        # Use the correct signature strength
        sha_strength = case params['SignatureMethod']
            when "HmacSHA1" then 'sha1'
            when "HmacSHA256" then 'sha256'
            else 'sha1'
        end

        digest = OpenSSL::Digest::Digest.new(sha_strength)
        b64hmac =
            Base64.encode64(
                OpenSSL::HMAC.digest(digest, secret_key, canonical_str)).gsub("\n","")

        if urlencode
            return CGI::escape(b64hmac)
        else
            return b64hmac
        end
    end
    
    ###########################################################################
    # Helper functions
    ###########################################################################
    def render_state(vm)
        ec2_state = EC2_STATES[ONE_STATES[vm.status]]

        return "<code>#{ec2_state[:code]}</code>
        <name>#{ec2_state[:name]}</name>"
    end

    def render_launch_time(vm)
        return "<launchTime>#{Time.at(vm["STIME"].to_i).xmlschema}</launchTime>"
    end
end

