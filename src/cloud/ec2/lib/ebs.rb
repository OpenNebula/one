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
    def create_volume(params)
        size = params['Size'].to_i # in GiBs
        size *= 1024

        opts = {
            :type => "DATABLOCK",
            :size => size,
            :fstype => @config[:ebs_fstype]||DEFAULT_FSTYPE,
            :persistent => "YES",
            :ebs => "YES"
        }

        image    = ImageEC2.new(Image.build_xml, @client, nil, opts)
        template = image.to_one_template

        if OpenNebula.is_error?(template)
            return template
        end

        rc = image.allocate(template, @config[:datastore_id]||1)

        if OpenNebula.is_error?(rc)
            return rc
        end

        # Response
        image.info

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

end
