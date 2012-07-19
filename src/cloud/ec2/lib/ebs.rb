module EBS
    # Default FSTYPE when creating new volumes
    DEFAULT_FSTYPE = "ext3"

    # Detaches a DATABLOCK from a VM
    #
    # @param [Hash] params
    # @option params [String] VolumeId The ID of the DATABLOCK
    # @option params [String] InstanceId The ID of the VM
    # @option params [String] Device The TARGET (unsupported)
    # @option params [String] Force The TARGET (unsupported)
    def detach_volume(params)
        image_id = params['VolumeId']
        image_id = image_id.split('-')[1] if image_id[0]==?v

        vm_id = params['InstanceId']
        vm_id = vm_id.split('-')[1] if vm_id[0]==?i

        target = params['Device']


        # Detach

        vm = VirtualMachine.new(VirtualMachine.build_xml(vm_id), @client)
        rc = vm.info

        return rc if OpenNebula::is_error?(rc)

        disk_id = vm["TEMPLATE/DISK[IMAGE_ID=#{image_id.to_i}]/DISK_ID"]

        logger.debug { "Detaching DISK: #{disk_id} VM: #{vm_id} IMAGE: #{image_id}"  }

        if disk_id.nil?
            rc = OpenNebula::Error.new("There is no disk to be detached")
            logger.error {rc.message}
            return rc
        end

        rc = vm.detachdisk(disk_id.to_i)

        return rc if OpenNebula::is_error?(rc)


        # Update IMAGE metadata

        image = Image.new(Image.build_xml(image_id), @client)
        rc = image.info

        return rc if OpenNebula::is_error?(rc)

        image.delete_element("TEMPLATE/EBS[INSTANCE_ID=\"#{params['InstanceId']}\"]")
        rc = image.update
        if OpenNebula::is_error?(rc)
            logger.error {rc.message}
            return rc
        end


        # Response

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/detach_volume.erb"))
        return response.result(binding), 200
    end

    # Attaches a DATABLOCK to a running VM and exposes it as the specified
    #   device.
    #
    # @param [Hash] params
    # @option params [String] VolumeId The ID of the DATABLOCK
    # @option params [String] InstanceId The ID of the VM to which the
    #   volume attaches
    # @option params [String] Device How the device is exposed to the
    #   instance (e.g., /dev/sdh, or xvdh)
    def attach_volume(params)
        image_id = params['VolumeId']
        image_id = image_id.split('-')[1] if image_id[0]==?v

        vm_id = params['InstanceId']
        vm_id = vm_id.split('-')[1] if vm_id[0]==?i

        target = params['Device']
        if m = target.match(/^\/dev\/(\w+)$/)
            target = m[1]
        end


        # Attach

        vm = VirtualMachine.new(VirtualMachine.build_xml(vm_id), @client)
        rc = vm.info

        return rc if OpenNebula::is_error?(rc)

        template = "DISK = [ IMAGE_ID = #{image_id}, TARGET = #{target} ]"
        vm.attachdisk(template)

        return rc if OpenNebula::is_error?(rc)


        # Update IMAGE metadata

        image = Image.new(Image.build_xml(image_id), @client)
        rc = image.info

        return rc if OpenNebula::is_error?(rc)

        xml_hash = {'EBS' => {
            'INSTANCE_ID' => params['InstanceId'],
            "DEVICE" => params['Device']}
        }

        image.add_element('TEMPLATE', xml_hash)
        rc = image.update
        if OpenNebula::is_error?(rc)
            logger.error rc.message
            return rc
        end


        # Response

        erb_version = params['Version']

        vm.info

        response = ERB.new(File.read(@config[:views]+"/attach_volume.erb"))
        return response.result(binding), 200
    end

    # Creates a new DATABLOCK that any VM can attach to
    #
    # @param [Hash] params
    # @option params [String] Size The size of the volume, in GiBs.
    # @option params [String] SnapshotId The snapshot from which to create
    #   the new volume (unsupported).
    # @option params [String] AvailabilityZone The Availability Zone in which
    #   to create the new volume (unsupported)
    def create_volume(params)
        size = params['Size'].to_i # in GiBs
        size *= 1024

        opts = {
            :type => "DATABLOCK",
            :size => size,
            :fstype => @config[:ebs_fstype]||DEFAULT_FSTYPE,
            :persistent => "YES"
        }

        image = ImageEC2.new(Image.build_xml, @client, nil, opts)

        template = image.to_one_template
        if OpenNebula.is_error?(template)
            return template
        end

        rc = image.allocate(template, @config[:datastore_id]||1)
        if OpenNebula.is_error?(rc)
            return rc
        end

        erb_version = params['Version']

        image.info

        response = ERB.new(File.read(@config[:views]+"/create_volume.erb"))
        return response.result(binding), 200
    end

    # Deletes a DATABLOCK
    #
    # @param [Hash] params
    # @option params [String] VolumeId The ID of the DATABLOCK
    def delete_volume(params)
        image_id = params['VolumeId']
        image_id = image_id.split('-')[1] if image_id[0]==?v

        image = ImageEC2.new(Image.build_xml(image_id), @client)
        rc = image.delete

        return rc if OpenNebula::is_error?(rc)

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/delete_volume.erb"))
        return response.result(binding), 200
    end


    # Describes your Amazon EBS volumes
    def describe_volumes(params)
        user_flag = OpenNebula::Pool::INFO_ALL
        impool = ImageEC2Pool.new(@client, user_flag)
        impool.info

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/describe_volumes.erb"))
        return response.result(binding), 200
    end

end