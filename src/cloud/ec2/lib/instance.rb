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
            return rc
        end

        vm.info

        erb_current_state = render_state(vm)
        erb_instance_id   = render_instance_id(vm)

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
        # Get the VM ID
        vmid=params['InstanceId.1']
        vmid=params['InstanceId.01'] if !vmid

        tmp, vmid=vmid.split('-') if vmid[0]==?i

        vm = VirtualMachine.new(VirtualMachine.build_xml(vmid),@client)

        rc = vm.info
        if OpenNebula::is_error?(rc)
            return rc
        end

        erb_previous_state = render_state(vm)

        rc = block.call(vm)

        vm.info

        erb_current_state = render_state(vm)
        erb_instance_id   = render_instance_id(vm)

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