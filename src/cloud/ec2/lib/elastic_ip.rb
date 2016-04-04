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

module ElasticIP
    def allocate_address(params)
        # Get public IP
        vnet = retrieve_eip_vnet
        if OpenNebula::is_error?(vnet)
            return vnet
        end

        ips = vnet.retrieve_elements('AR_POOL/AR[USED_LEASES=0 and SIZE=1]/IP')
        if ips.nil?
            rc = OpenNebula::Error.new("There is no lease available to be allocated")
            rc.ec2_code = "AddressLimitExceeded"
            logger.error { rc.message }
            return rc
        end

        eip = ips.first

        # Hold IP
        rc = vnet.hold(eip)
        if OpenNebula::is_error?(rc)
            logger.error rc.message
            return rc
        end

        # Update EC2_ADDRESSES list
        xml_hash = {'EC2_ADDRESSES' => {'IP' => eip, "UID" => retrieve_uid}}
        vnet.add_element('TEMPLATE', xml_hash)
        rc = vnet.update
        if OpenNebula::is_error?(rc)
            logger.error rc.message
            return rc
        end

        response = ERB.new(File.read(@config[:views]+"/allocate_address.erb"))
        return response.result(binding), 200
    end

    def release_address(params)
        # Check public IP
        vnet = retrieve_eip_vnet
        if OpenNebula::is_error?(vnet)
            return vnet
        end

        eip = params["PublicIp"]
        unless vnet["TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\" and UID=\"#{retrieve_uid}\"]/IP"]
            rc = OpenNebula::Error.new("address:#{eip} does not exist")
            logger.error { rc.message }
            return rc
        end

        # Disassociate address if needed
        if vnet["TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\"]/VMID"]
            cmd_output = `#{@config[:disassociate_script]} #{eip}`
            if $?.to_i != 0
                rc = OpenNebula::Error.new(cmd_output)
                logger.error { rc.message }
                return rc
            end

            vnet.delete_element("TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\"]/VMID")
        end

        # Release IP
        rc = vnet.release(eip)
        if OpenNebula::is_error?(rc)
            logger.error {rc.message}
            return rc
        end

        # Update EC2_ADDRESSES list
        vnet.delete_element("TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\"]")
        rc = vnet.update
        if OpenNebula::is_error?(rc)
            logger.error {rc.message}
            return rc
        end

        response = ERB.new(File.read(@config[:views]+"/release_address.erb"))
        return response.result(binding), 200
    end

    def describe_addresses(params)
        vnet = retrieve_eip_vnet
        if OpenNebula::is_error?(vnet)
            return vnet
        end

        erb_version = params['Version']
        user_id     = retrieve_uid

        response = ERB.new(File.read(@config[:views]+"/describe_addresses.erb"))
        return response.result(binding), 200
    end

    def associate_address(params)
        # Check public IP
        vnet = retrieve_eip_vnet
        if OpenNebula::is_error?(vnet)
            return vnet
        end

        user_id = retrieve_uid
        eip     = params["PublicIp"]
        vmid    = params['InstanceId'].sub(/^i\-0*/, '')

        unless vnet["TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\" and UID=\"#{retrieve_uid}\"]/IP"]
            rc = OpenNebula::Error.new("address:#{eip} does not exist")
            logger.error { rc.message }
            return rc
        end

        # Get private IP of the Instance
        vm = VirtualMachine.new(VirtualMachine.build_xml(vmid), @client)
        rc = vm.info
        if OpenNebula::is_error?(rc)
            logger.error {rc.message}
            return rc
        end

        ips = vm.retrieve_elements('TEMPLATE/NIC/IP')
        if ips.nil?
            rc = OpenNebula::Error.new("The instance does not have any NIC")
            logger.error { rc.message }
            return rc
        end

        private_ip = ips.first

        # Disassociate address if needed
        if vnet["TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\"]/VMID"]
            cmd_output = `#{@config[:disassociate_script]} #{eip}`
            if $?.to_i != 0
                rc = OpenNebula::Error.new(cmd_output)
                logger.error { rc.message }
                return rc
            end

            vnet.delete_element("TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\"]/VMID")
        end

        # Run external script
        vnet_base64 = Base64.encode64(vnet.to_xml).delete("\n")
        cmd_output = `#{@config[:associate_script]} #{eip} #{private_ip} \"#{vnet_base64}\"`
        if $?.to_i != 0
            rc = OpenNebula::Error.new(cmd_output)
            logger.error { rc.message }
            return rc
        end

        # Update EC2_ADDRESSES list
        vnet.add_element("TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\"]", "VMID" => vmid)
        rc = vnet.update
        if OpenNebula::is_error?(rc)
            logger.error {rc.message}
            return rc
        end

        response = ERB.new(File.read(@config[:views]+"/associate_address.erb"))
        return response.result(binding), 200
    end

    def disassociate_address(params)
        # Check public IP
        vnet = retrieve_eip_vnet
        if OpenNebula::is_error?(vnet)
            return vnet
        end

        eip = params["PublicIp"]
        unless vnet["TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\" and UID=\"#{retrieve_uid}\"]/VMID"]
            rc = OpenNebula::Error.new("address:#{eip} does not exist or is not associated with any instance")
            logger.error { rc.message }
            return rc
        end

        # Run external script
        cmd_output = `#{@config[:disassociate_script]} #{eip}`
        if $?.to_i != 0
            rc = OpenNebula::Error.new(cmd_output)
            logger.error { rc.message }
            return rc
        end

        # Update EC2_ADDRESSES list
        vnet.delete_element("TEMPLATE/EC2_ADDRESSES[IP=\"#{eip}\"]/VMID")
        rc = vnet.update
        if OpenNebula::is_error?(rc)
            logger.error {rc.message}
            return rc
        end

        response = ERB.new(File.read(@config[:views]+"/disassociate_address.erb"))
        return response.result(binding), 200
    end

    private

    def retrieve_eip_vnet
        vnet = VirtualNetwork.new(VirtualNetwork.build_xml(@config[:elasticips_vnet_id]),@oneadmin_client)
        rc   = vnet.info

        if OpenNebula::is_error?(rc)
            return rc
        end

        vnet
    end

    def retrieve_uid
        user = User.new_with_id(OpenNebula::User::SELF, @client)
        user.info
        user.id
    end
end
