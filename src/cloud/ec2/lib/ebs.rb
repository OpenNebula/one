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
        target    = params['Device']
        image_id  = params['VolumeId']
        vm_id_ec2 = params['InstanceId']

        image_id  = image_id.split('-')[1]

        image = Image.new(Image.build_xml(image_id.to_i), @client)
        rc    = image.info
        return rc if OpenNebula::is_error?(rc)

        if !vm_id_ec2
            vm_id_ec2 = image["TEMPLATE/EBS/INSTANCE_ID"]
        end

        if vm_id_ec2.nil?
            rc = OpenNebula::Error.new("The volume #{params['VolumeId']} is\
                not attached to any instance")
            logger.error {rc.message}
            return rc
        end

        vm_id = vm_id_ec2.split('-')[1]

        # Detach

        vm = VirtualMachine.new(VirtualMachine.build_xml(vm_id.to_i), @client)
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
        image.delete_element("TEMPLATE/EBS")

        rc = image.update

        if OpenNebula::is_error?(rc)
            logger.error {rc.message}
            return rc
        end

        # Response
        erb_version = params['Version']
        response    = ERB.new(File.read(@config[:views]+"/detach_volume.erb"))

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
        image_id = image_id.split('-')[1]

        vm_id = params['InstanceId']
        vm_id = vm_id.split('-')[1]

        target = params['Device']

        if m = target.match(/^\/dev\/(\w+)$/)
            target = m[1]
        end

        # Check if the volume is already attached to another instance
        image = Image.new(Image.build_xml(image_id.to_i), @client)
        rc    = image.info

        return rc if OpenNebula::is_error?(rc)

        if image['TEMPLATE/EBS/INSTANCE_ID']
            return OpenNebula::Error.new("Volume #{params['VolumeId']} " <<
                "already attached to another instance " <<
                "(#{image['TEMPLATE/EBS/INSTANCE_ID']})")
        end

        # Attach
        vm = VirtualMachine.new(VirtualMachine.build_xml(vm_id.to_i), @client)
        rc = vm.info

        return rc if OpenNebula::is_error?(rc)

        template = "DISK = [ IMAGE_ID = #{image_id.to_i}, TARGET = #{target} ]"
        rc       = vm.attachdisk(template)

        return rc if OpenNebula::is_error?(rc)

        # Update IMAGE metadata
        attach_time = Time.now.to_i

        xml_hash = {'EBS' => {
            'INSTANCE_ID' => params['InstanceId'],
            "DEVICE" => params['Device'],
            "ATTACH_TIME" => attach_time
            }
        }

        image.add_element('TEMPLATE', xml_hash)

        rc = image.update

        if OpenNebula::is_error?(rc)
            logger.error rc.message
            return rc
        end

        # Response
        vm.info

        erb_version = params['Version']
        response    = ERB.new(File.read(@config[:views]+"/attach_volume.erb"))

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
    # TODO: Availability zone
    def create_volume(params)
        snapshot_id = params['SnapshotId']
        if snapshot_id
            snapshot_id = snapshot_id.split('-')[1]

            snapshot = ImageEC2.new(Image.build_xml(snapshot_id.to_i), @client)
            rc = snapshot.info
            if OpenNebula::is_error?(rc) || !snapshot.ebs_snapshot?
                rc ||= OpenNebula::Error.new()
                rc.ec2_code = "InvalidSnapshot.NotFound"
                return rc
            end

            # Clone
            volume_id = snapshot.clone(ImageEC2.generate_uuid)
            if OpenNebula::is_error?(volume_id)
                return volume_id
            end

            volume = ImageEC2.new(Image.build_xml(volume_id.to_i), @client)
            rc = volume.info
            if OpenNebula::is_error?(rc)
                return rc
            end

            volume.delete_element("TEMPLATE/EBS_SNAPSHOT")
            volume.add_element('TEMPLATE', {
                "EBS_VOLUME" => "YES",
                "EBS_FROM_SNAPSHOT_ID" => snapshot.ec2_id})
            volume.update
        else
            size = params['Size'].to_i # in GiBs
            size *= 1024

            opts = {
                :type => "DATABLOCK",
                :size => size,
                :fstype => @config[:ebs_fstype]||DEFAULT_FSTYPE,
                :persistent => "YES",
                :ebs_volume => "YES"
            }

            volume    = ImageEC2.new(Image.build_xml, @client, nil, opts)
            template = volume.to_one_template

            if OpenNebula.is_error?(template)
                return template
            end

            rc = volume.allocate(template, @config[:datastore_id]||1)

            if OpenNebula.is_error?(rc)
                return rc
            end

            volume.info
        end

        erb_version = params['Version']
        response    = ERB.new(File.read(@config[:views]+"/create_volume.erb"))

        return response.result(binding), 200
    end

    # Deletes a DATABLOCK
    #
    # @param [Hash] params
    # @option params [String] VolumeId The ID of the DATABLOCK
    def delete_volume(params)
        image_id = params['VolumeId']
        image_id = image_id.split('-')[1]

        image = ImageEC2.new(Image.build_xml(image_id.to_i), @client)
        rc    = image.delete

        return rc if OpenNebula::is_error?(rc)

        erb_version = params['Version']
        response    = ERB.new(File.read(@config[:views]+"/delete_volume.erb"))

        return response.result(binding), 200
    end


    # Describes your Amazon EBS volumes
    def describe_volumes(params)
        user_flag = OpenNebula::Pool::INFO_ALL
        impool    = ImageEC2Pool.new(@client, user_flag)

        rc = impool.info

        return rc if OpenNebula::is_error?(rc)

        erb_version = params['Version']
        response    = ERB.new(File.read(@config[:views]+"/describe_volumes.erb"))

        return response.result(binding), 200
    end

    # Creates a snapshot of an Amazon EBS volume
    #
    # @param [Hash] params
    # @option params [String] VolumeId The ID of the Amazon EBS volume.
    # @option params [String] Description A description for the snapshot.
    def create_snapshot(params)
        image_id = params['VolumeId']
        image_id = image_id.split('-')[1]

        image = ImageEC2.new(Image.build_xml(image_id.to_i), @client)
        rc = image.info
        if OpenNebula::is_error?(rc) || !image.ebs_volume?
            rc ||= OpenNebula::Error.new()
            rc.ec2_code = "InvalidVolume.NotFound"
            return rc
        end

        instance_id = image["TEMPLATE/EBS/INSTANCE_ID"]

        if instance_id
            # Disk snapshot
            instance_id = instance_id.split('-')[1]
                vm = VirtualMachine.new(
                    VirtualMachine.build_xml(instance_id),
                    @client)

                rc = vm.info
                if OpenNebula::is_error?(rc)
                    rc.ec2_code = "InvalidInstanceID.NotFound"
                    return rc
                end

                disk_id = vm["TEMPLATE/DISK[IMAGE_ID=#{image_id}]/DISK_ID"]
                if !disk_id.nil?
                    snapshot_id = vm.disk_saveas(disk_id.to_i,
                        params["Description"]||ImageEC2.generate_uuid,
                        OpenNebula::Image::IMAGE_TYPES[image["TYPE"].to_i])

                    if OpenNebula::is_error?(snapshot_id)
                        return snapshot_id
                    end
                end
        end

        if snapshot_id.nil?
            # Clone
            snapshot_id = image.clone(params["Description"]||ImageEC2.generate_uuid)
            if OpenNebula::is_error?(snapshot_id)
                return snapshot_id
            end
        end

        snapshot = ImageEC2.new(Image.build_xml(snapshot_id.to_i), @client)
        rc = snapshot.info
        if OpenNebula::is_error?(rc)
            return rc
        end

        snapshot.delete_element("TEMPLATE/EBS_VOLUME")
        snapshot.add_element('TEMPLATE', {"EBS_SNAPSHOT" => "YES"})
        snapshot.update

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/create_snapshot.erb"))
        return response.result(binding), 200
    end

    # Deletes the specified snapshot.
    #
    # @param [Hash] params
    # @option params [String] SnapshotId The ID of the Amazon EBS snapshot.
    def delete_snapshot(params)
        snapshot_id = params['SnapshotId']
        snapshot_id = snapshot_id.split('-')[1]

        snapshot = ImageEC2.new(Image.build_xml(snapshot_id.to_i), @client)
        rc = snapshot.info
        if OpenNebula::is_error?(rc) || !snapshot.ebs_snapshot?
            rc ||= OpenNebula::Error.new()
            rc.ec2_code = "InvalidSnapshot.NotFound"
            return rc
        end

        rc = snapshot.delete
        if OpenNebula::is_error?(rc)
            return rc
        end

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/delete_snapshot.erb"))
        return response.result(binding), 200
    end

    def describe_snapshots(params)
        impool = []
        params.each { |key, value|
            if key =~ /SnapshotId\./
                if value =~ /snap\-(.+)/
                    image = ImageEC2.new(Image.build_xml($1), @client)
                    rc = image.info
                    if OpenNebula.is_error?(rc) || !image.ebs_snapshot?
                        rc.ec2_code = "InvalidSnapshot.NotFound"
                        return rc
                    else
                        impool << image
                    end
                else
                    rc = OpenNebula::Error.new("InvalidSnapshot.Malformed #{value}")
                    rc.ec2_code = "InvalidSnapshot.Malformed"
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

        response = ERB.new(File.read(@config[:views]+"/describe_snapshots.erb"))
        return response.result(binding), 200
    end
end
