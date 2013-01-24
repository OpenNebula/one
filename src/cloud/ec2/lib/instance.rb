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

module Instance
    ###########################################################################
    # Class Constants. Defined the EC2 and OpenNebula State mapping
    ###########################################################################
    EC2_STATES={
        :pending    => {:code => 0, :name => 'pending'},
        :running    => {:code => 16,:name => 'running'},
        :shutdown   => {:code => 32,:name => 'shutting-down'},
        :terminated => {:code => 48,:name => 'terminated'},
        :stopping   => {:code => 64,:name => 'stopping'},
        :stopped    => {:code => 80,:name => 'stopped'}
    }

    ONE_STATES={
        'init' => :pending,
        'pend' => :pending,
        'hold' => :pending,
        'stop' => :stopped,
        'susp' => :stopped,
        'done' => :terminated,
        'fail' => :terminated,
        'prol' => :pending,
        'boot' => :running,
        'runn' => :running,
        'migr' => :running,
        'save' => :stopping,
        'epil' => :shutdown,
        'shut' => :shutdown,
        'clea' => :shutdown,
        'fail' => :terminated,
        'unkn' => :terminated
    }

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
        tmp, img = params['ImageId'].split('-')

        # Build the VM
        erb_vm_info = Hash.new

        erb_vm_info[:img_id]        = img.to_i
        erb_vm_info[:ec2_img_id]    = params['ImageId']
        erb_vm_info[:instance_type] = instance_type_name
        erb_vm_info[:template]      = path
        erb_vm_info[:user_data]     = params['UserData']
        erb_vm_info[:public_key]    = fetch_publickey(params)
        erb_vm_info[:key_name]      = params['KeyName']

        template      = ERB.new(File.read(erb_vm_info[:template]))
        template_text = template.result(binding)

        erb_vms = Array.new

        min_count = params['MinCount'] || 1
        max_count = params['MaxCount'] || min_count

        max_count.to_i.times {
            # Start the VM.
            instance = VirtualMachine.new(VirtualMachine.build_xml, @client)

            rc = instance.allocate(template_text)
            if OpenNebula::is_error?(rc)
                if erb_vms.size < min_count.to_i
                    erb_vms.each { |vm|
                        vm.finalize
                    }

                    return rc
                end
            else
                instance.info

                erb_vms << instance
            end
        }

        erb_user_name = params['AWSAccessKeyId']
        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/run_instances.erb"))
        return response.result(binding), 200
    end

    def describe_instances(params)
        user_flag = OpenNebula::Pool::INFO_ALL
        vmpool = VirtualMachinePool.new(@client, user_flag)

        rc = vmpool.info
        return rc if OpenNebula::is_error?(rc)

        erb_version = params['Version']
        erb_user_name = params['AWSAccessKeyId']

        response = ERB.new(File.read(@config[:views]+"/describe_instances.erb"))
        return response.result(binding), 200
    end

    def terminate_instances(params)
        perform_action(params, "terminate_instances.erb") { |vm|
            if vm.status == 'runn'
                vm.shutdown
            else
                vm.finalize
            end
        }
    end

    def start_instances(params)
        perform_action(params, "start_instances.erb") { |vm|
            vm.resume
        }
    end

    def stop_instances(params)
        perform_action(params, "stop_instances.erb") { |vm|
            vm.stop
        }
    end

    def reboot_instances(params)
        perform_action(params, "reboot_instances.erb") { |vm|
            vm.reboot
        }
    end

    private

    # Perform an action on a given vm
    # @param [Hash] params
    # @option params [String] InstanceId The ID of the VM
    # @param [String] erb_name name of the file, inside the views folder,
    #   to generate the response
    # @yieldparam [OpenNebula::VirtualMachine] vm the VM
    # @yieldreturn [OpenNebula::Error, nil]
    # @return [OpenNebula::Error, nil]
    def perform_action(params, erb_name, &block)
        erb_vms = Array.new

        params.each do |key, value|
            if key =~ /InstanceId\.(.+)/
                if value =~ /\-(.+)/
                    vm = VirtualMachine.new(
                            VirtualMachine.build_xml($1),
                            @client)

                    rc = vm.info
                    if OpenNebula::is_error?(rc)
                        return rc
                    end

                    previous_state = render_state(vm)

                    rc = block.call(vm)
                    if OpenNebula::is_error?(rc)
                        return rc
                    end

                    vm.info

                    erb_vms << {
                        :erb_previous_state => previous_state,
                        :vm => vm
                    }
                end
            end
        end

        erb_version = params['Version']

        response =ERB.new(File.read(@config[:views]+'/'+erb_name))
        return response.result(binding), 200
    end

    def render_state(vm)
        one_state = ONE_STATES[vm.status]
        ec2_state = EC2_STATES[one_state||:pending]

        return "<code>#{ec2_state[:code]}</code><name>#{ec2_state[:name]}</name>"
    end

    def render_instance_id(vm)
        instance_id = "i-" + sprintf('%08i', vm.id)
        return "<instanceId>#{instance_id}</instanceId>"
    end
end
