module ElasticIP
    def allocate_address(params)
        # Get public IP
        vnet = retrieve_eip_vnet
        return vnet, 400 if OpenNebula::is_error?(vnet)

        ips = vnet.retrieve_elements('LEASES/LEASE[USED=0]/IP')
        if ips.nil?
            logger.error { "There is no lease available to be allocated" }
            return OpenNebula::Error.new('AddressLimitExceeded'), 400
        end

        eip = ips.first

        # Hold IP
        rc = vnet.hold(eip)
        if OpenNebula::is_error?(rc)
            logger.error rc.message
            return OpenNebula::Error.new('Unsupported'),400
        end

        # Update EC2_ADDRESSES list
        xml_hash = {'EC2_ADDRESSES' => {'IP' => eip, "UID" => retrieve_uid}}
        vnet.add_element('TEMPLATE', xml_hash)
        rc = vnet.update
        if OpenNebula::is_error?(rc)
            logger.error rc.message
            return OpenNebula::Error.new('Unsupported'),400
        end

        response = ERB.new(File.read(@config[:views]+"/allocate_address.erb"))
        return response.result(binding), 200
    end

    def release_address(params)
        # Check public IP
        vnet = retrieve_eip_vnet
        return vnet, 400 if OpenNebula::is_error?(vnet)

        eip = params["PublicIp"]
        unless vnet["TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\" and UID=\"#{retrieve_uid}\"]/IP"]
            logger.error { "address:#{eip} does not exist" }
            return OpenNebula::Error.new('Unsupported'),400
        end

        # Disassociate address if needed
        if vnet["TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\"]/VMID"]
            cmd_output = `#{@config[:disassociate_script]} #{eip}`
            if $?.to_i != 0
                logger.error { cmd_output }
                return OpenNebula::Error.new('Unsupported'),400
            end

            vnet.delete_element("TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\"]/VMID")
        end

        # Release IP
        rc = vnet.release(eip)
        if OpenNebula::is_error?(rc)
            logger.error {rc.message}
            return OpenNebula::Error.new('Unsupported'),400
        end

        # Update EC2_ADDRESSES list
        vnet.delete_element("TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\"]")
        rc = vnet.update
        if OpenNebula::is_error?(rc)
            logger.error {rc.message}
            return OpenNebula::Error.new('Unsupported'),400
        end

        response = ERB.new(File.read(@config[:views]+"/release_address.erb"))
        return response.result(binding), 200
    end

    def describe_addresses(params)
        vnet = retrieve_eip_vnet
        return vnet, 400 if OpenNebula::is_error?(vnet)

        erb_version = params['Version']
        user_id     = retrieve_uid

        response = ERB.new(File.read(@config[:views]+"/describe_addresses.erb"))
        return response.result(binding), 200
    end

    def associate_address(params)
        # Check public IP
        vnet = retrieve_eip_vnet
        return vnet, 400 if OpenNebula::is_error?(vnet)

        user_id = retrieve_uid
        eip     = params["PublicIp"]
        vmid    = params['InstanceId']
        vmid    = vmid.split('-')[1] if vmid[0]==?i

        unless vnet["TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\" and UID=\"#{retrieve_uid}\"]/IP"]
            logger.error { "address:#{eip} does not exist" }
            return OpenNebula::Error.new('Unsupported'),400
        end

        # Get private IP of the Instance
        vm = VirtualMachine.new(VirtualMachine.build_xml(vmid), @client)
        rc = vm.info
        if OpenNebula::is_error?(rc)
            logger.error {rc.message}
            return OpenNebula::Error.new('Unsupported'),400
        end

        ips = vm.retrieve_elements('TEMPLATE/NIC/IP')
        if ips.nil?
            logger.error { "The instance does not have any NIC" }
            return OpenNebula::Error.new('Unsupported'),400
        end

        private_ip = ips.first

        # Disassociate address if needed
        if vnet["TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\"]/VMID"]
            cmd_output = `#{@config[:disassociate_script]} #{eip}`
            if $?.to_i != 0
                logger.error { cmd_output }
                return OpenNebula::Error.new('Unsupported'),400
            end

            vnet.delete_element("TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\"]/VMID")
        end

        # Run external script
        vnet_base64 = Base64.encode64(vnet.to_xml).delete("\n")
        cmd_output = `#{@config[:associate_script]} #{eip} #{private_ip} \"#{vnet_base64}\"`
        if $?.to_i != 0
            logger.error { "associate_script" << cmd_output }
            return OpenNebula::Error.new('Unsupported'),400
        end

        # Update EC2_ADDRESSES list
        vnet.add_element("TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\"]", "VMID" => vmid)
        rc = vnet.update
        if OpenNebula::is_error?(rc)
            logger.error {rc.message}
            return OpenNebula::Error.new('Unsupported'),400
        end

        response = ERB.new(File.read(@config[:views]+"/associate_address.erb"))
        return response.result(binding), 200
    end

    def disassociate_address(params)
        # Check public IP
        vnet = retrieve_eip_vnet
        return vnet, 400 if OpenNebula::is_error?(vnet)

        eip = params["PublicIp"]
        unless vnet["TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\" and UID=\"#{retrieve_uid}\"]/VMID"]
            logger.error { "address:#{eip} does not exist or is not associated with any instance" }
            return OpenNebula::Error.new('Unsupported'),400
        end

        # Run external script
        cmd_output = `#{@config[:disassociate_script]} #{eip}`
        if $?.to_i != 0
            logger.error { cmd_output }
            return OpenNebula::Error.new('Unsupported'),400
        end

        # Update EC2_ADDRESSES list
        vnet.delete_element("TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\"]/VMID")
        rc = vnet.update
        if OpenNebula::is_error?(rc)
            logger.error {rc.message}
            return OpenNebula::Error.new('Unsupported'),400
        end

        response = ERB.new(File.read(@config[:views]+"/disassociate_address.erb"))
        return response.result(binding), 200
    end

    private

    def retrieve_eip_vnet
        vnet = VirtualNetwork.new(VirtualNetwork.build_xml(@config[:elasticips_vnet_id]),@oneadmin_client)
        rc   = vnet.info

        if OpenNebula::is_error?(rc)
            logger.error {rc.message}
            return OpenNebula::Error.new('Unsupported')
        end

        vnet
    end

    def retrieve_uid
        user = User.new_with_id(OpenNebula::User::SELF, @client)
        user.info
        user.id
    end
end