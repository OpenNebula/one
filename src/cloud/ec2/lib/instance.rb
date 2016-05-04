# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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

    EC2_ACTIONS = {
        :start      => :resume,
        :stop       => :poweroff,
        :terminate  => :shutdown,
        :reboot     => :reboot
    }

    # Include terminated instances in the describe_instances xml
    DESCRIBE_WITH_TERMINATED_INSTANCES = true
    # Terminated VMs will be included in the list
    #  till the termination date + TERMINATED_INSTANCES_EXPIRATION_TIME is reached
    TERMINATED_INSTANCES_EXPIRATION_TIME = 900

    def run_instances(params)
        erb_user_name = params['AWSAccessKeyId']
        erb_version = params['Version']
        erb_vms = Array.new

        if params['ClientToken']
            user_flag = OpenNebula::Pool::INFO_ALL
            vm_pool = VirtualMachinePool.new(@client, user_flag)
            rc = vm_pool.info
            if OpenNebula::is_error?(rc)
                return rc
            end

            vm_id = vm_pool["VM/USER_TEMPLATE[EC2_CLIENT_TOKEN=\'#{params['ClientToken']}\']/../ID"]
            if vm_id
                instance = VirtualMachine.new(VirtualMachine.build_xml(vm_id), @client)
                rc = instance.info
                if OpenNebula::is_error?(rc)
                    return rc
                end

                erb_vms << instance

                response = ERB.new(File.read(@config[:views]+"/run_instances.erb"))
                return response.result(binding), 200
            end
        end

        # Get the image
        img = nil
        if params['ImageId'] =~ /ami\-(.+)/
            img = $1
            image = ImageEC2.new(Image.build_xml(img), @client)
            rc = image.info
            if OpenNebula.is_error?(rc) || !image.ec2_ami?
                rc ||= OpenNebula::Error.new()
                rc.ec2_code = "InvalidAMIID.NotFound"
                return rc
            end
        else
            rc = OpenNebula::Error.new("InvalidAMIID.Malformed #{params['ImageId']}")
            rc.ec2_code = "InvalidAMIID.Malformed"
            return rc
        end

        if @config[:use_file_templates]
            # Get the instance type and path
            if params['InstanceType'] != nil
                instance_type_name = params['InstanceType']
            else
                instance_type_name = "m1.small"
            end

            instance_type = @config[:instance_types][instance_type_name.to_sym]
            if instance_type != nil
                path = @config[:template_location] + "/#{instance_type[:template]}"
            end

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
            if params["ClientToken"]
                template_text += "\nEC2_CLIENT_TOKEN=\"#{params['ClientToken']}\""
            end

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
        else
            user_flag = OpenNebula::Pool::INFO_ALL
            template_pool = TemplatePool.new(@client, user_flag)
            rc = template_pool.info
            if OpenNebula::is_error?(rc)
                return rc
            end

            template_id = template_pool["VMTEMPLATE/TEMPLATE[EC2_INSTANCE_TYPE=\'#{params['InstanceType']}\']/../ID"]
            if template_id.nil?
                rc = OpenNebula::Error.new("InvalidInstanceAttributeValue.NotFound #{params['InstanceType']}")
                rc.ec2_code = "InvalidInstanceAttributeValue.NotFound"
                return rc
            end

            template = Template.new(Template.build_xml(template_id), @client)
            rc = template.info
            if OpenNebula.is_error?(rc)
                rc.ec2_code = "InvalidInstanceAttributeValue.NotFound"
                return rc
            end

            merge_info = {}
            merge_info["DISK"] = []
            merge_info["DISK"] << {"IMAGE_ID" => img.to_i}
            merge_info["IMAGE_ID"] = params['ImageId']

            template.each("TEMPLATE/DISK") { |e|
                merge_info["DISK"] << e.to_hash["DISK"]
            }

            merge_info["CONTEXT"] = {}
            template.each("TEMPLATE/CONTEXT") { |e|
                merge_info["CONTEXT"] = e.to_hash["CONTEXT"]
            }

            context = merge_info["CONTEXT"]

            public_key = fetch_publickey(params)
            context["EC2_PUBLIC_KEY"] = public_key if public_key
            context["EC2_KEYNAME"] = params['KeyName'] if params['KeyName']
            context["EC2_USER_DATA"] = params['UserData'] if params['UserData']

            if merge_info["CONTEXT"].empty?
                merge_info.delete("CONTEXT")
            end

            if params['ClientToken']
                merge_info['EC2_CLIENT_TOKEN'] = params['ClientToken']
            end

            template_str = template_to_str(merge_info)

            min_count = params['MinCount'] || 1
            max_count = params['MaxCount'] || min_count

            max_count.to_i.times {
                # Start the VM.
                rc = template.instantiate("", false, template_str)
                if OpenNebula::is_error?(rc)
                    if erb_vms.size < min_count.to_i
                        erb_vms.each { |vm|
                            vm.finalize
                        }

                        return rc
                    end
                else
                    instance = VirtualMachine.new(VirtualMachine.build_xml(rc), @client)
                    instance.info

                    erb_vms << instance
                end
            }
        end

        response = ERB.new(File.read(@config[:views]+"/run_instances.erb"))
        return response.result(binding), 200
    end

    def describe_instances(params)
        vmpool = []
        params.each { |key, value|
            if key =~ /InstanceId\./
                if value =~ /i\-(.+)/
                    vm = VirtualMachine.new(VirtualMachine.build_xml($1), @client)
                    rc = vm.info
                    if OpenNebula.is_error?(rc)
                        rc.ec2_code = "InvalidInstanceID.NotFound"
                        return rc
                    else
                        vmpool << vm
                    end
                else
                    rc = OpenNebula::Error.new("InvalidInstanceID.Malformed #{value}")
                    rc.ec2_code = "InvalidInstanceID.Malformed"
                    return rc
                end
            end
        }

        if vmpool.empty?
            user_flag = OpenNebula::Pool::INFO_ALL
            vmpool = VirtualMachinePool.new(@client, user_flag)

            if include_terminated_instances?
                rc = vmpool.info(user_flag, -1, -1,
                        OpenNebula::VirtualMachinePool::INFO_ALL_VM)
            else
                rc = vmpool.info
            end

            return rc if OpenNebula::is_error?(rc)
        end

        erb_version = params['Version']
        erb_user_name = params['AWSAccessKeyId']

        response = ERB.new(File.read(@config[:views]+"/describe_instances.erb"))
        return response.result(binding), 200
    end

    def terminate_instances(params)
        perform_action(params, "terminate_instances.erb") { |vm|
            if vm.status == 'runn'
                vm.send(EC2_ACTIONS[:terminate])
            else
                vm.finalize
            end
        }
    end

    def start_instances(params)
        perform_action(params, "start_instances.erb") { |vm|
            vm.send(EC2_ACTIONS[:start])
        }
    end

    def stop_instances(params)
        perform_action(params, "stop_instances.erb") { |vm|
            vm.send(EC2_ACTIONS[:stop])
        }
    end

    def reboot_instances(params)
        perform_action(params, "reboot_instances.erb") { |vm|
            vm.send(EC2_ACTIONS[:reboot])
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
                        rc.ec2_code = "InvalidInstanceID.NotFound"
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

    def include_terminated_instances?
        if @config[:describe_with_terminated_instances].nil?
            DESCRIBE_WITH_TERMINATED_INSTANCES
        else
            @config[:describe_with_terminated_instances]
        end
    end

    def include_terminated_instance?(vm)
        if include_terminated_instances?
            if EC2_STATES[ONE_STATES[vm.status]||:pending][:name] == "terminated"
                if (Time.now.getutc.to_i - vm["ETIME"].to_i) <= TERMINATED_INSTANCES_EXPIRATION_TIME
                    return true
                else
                    return false
                end
            end
        end

        return true
    end

    def template_to_str(attributes, indent=true)
         if indent
             ind_enter="\n"
             ind_tab='  '
         else
             ind_enter=''
             ind_tab=' '
         end

         str=attributes.collect do |key, value|
             if value
                 str_line=""
                 if value.class==Array && !value.empty?
                     value.each do |value2|
                         str_line << key.to_s.upcase << "=[" << ind_enter
                         if value2 && value2.class==Hash
                             str_line << value2.collect do |key3, value3|
                                 str = ind_tab + key3.to_s.upcase + "="
                                 str += "\"#{value3.to_s}\"" if value3
                                 str
                             end.compact.join(",\n")
                         end
                         str_line << "\n]\n"
                     end

                 elsif value.class==Hash && !value.empty?
                     str_line << key.to_s.upcase << "=[" << ind_enter

                     str_line << value.collect do |key3, value3|
                         str = ind_tab + key3.to_s.upcase + "="
                         str += "\"#{value3.to_s}\"" if value3
                         str
                     end.compact.join(",\n")

                     str_line << "\n]\n"

                 else
                     str_line<<key.to_s.upcase << "=" << "\"#{value.to_s}\""
                 end
                 str_line
             end
         end.compact.join("\n")

         str
     end
end
