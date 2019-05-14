module VirtualMachineDevice

    ############################################################################
    # Device Classes
    ############################################################################
    # Device base class
    #
    # @param id [Integer] The OpenNebula resource id
    # @param one_res [XMLElement] The OpenNebula representation of the object
    # @param vc_res [vCenter_class_specific] vCenter object representation
    ############################################################################
    class Device

        def initialize(id, one_res, vc_res)
            @id      = id
            @one_res = one_res
            @vc_res  = vc_res
        end

        def id
            raise_if_no_exists_in_one
            @id
        end

        def one_item
            raise_if_no_exists_in_one
            @one_res
        end

        def vc_item
            raise_if_no_exists_in_vcenter
            @vc_res
        end

        def one?
            !@one_res.nil?
        end

        def exists?
            !@vc_res.nil?
        end

        # Fails if the device is not present in OpenNebula
        def raise_if_no_exists_in_one
            raise 'OpenNebula device does not exist at the moment' unless one?
        end

        # Fails if the device is not present in vCenter
        def raise_if_no_exists_in_vcenter
            raise 'vCenter device does not exist at the moment' unless exists?
        end

        def no_exists?
            !exists?
        end

        def synced?
            one? && exists?
        end

        def unsynced?
            !synced?
        end

        def detached?
            !one?
        end

        def managed?
            raise_if_no_exists_in_one
            if @one_res
                !(@one_res['OPENNEBULA_MANAGED'] &&
                  @one_res['OPENNEBULA_MANAGED'].downcase == 'no')
            end
        end

    end

    # Nic class
    class Nic < Device

        def initialize(id, one_res, vc_res)
            super(id, one_res, vc_res)
        end

        # Create the OpenNebula nic representation
        # Allow as to create the class without vCenter representation
        # example: attached nics not synced with vCenter
        def self.one_nic(id, one_res)
            self.new(id, one_res, nil)
        end

        # Create the vCenter nic representation
        # Allow as to create the class without OpenNebula representation
        # example: detached nics that not exists in OpenNebula
        def self.vc_nic(vc_res)
            self.new(nil, nil, vc_res)
        end

        def key
            raise_if_no_exists_in_vcenter
            @vc_res.key
        end

        def boot_dev
            RbVmomi::VIM
                .VirtualMachineBootOptionsBootableEthernetDevice(
                    deviceKey => key
                )
        end

    end

    # Disk class
    class Disk < Device

        def initialize(id, one_res, vc_res)
            super(id, one_res, vc_res)
        end

        # Create the OpenNebula disk representation
        # Allow as to create the class without vCenter representation
        # example: attached disks not synced with vCenter
        def self.one_disk(id, one_res)
            self.new(id, one_res, nil)
        end

        # Create the vCenter disk representation
        # Allow as to create the class without OpenNebula representation
        # example: detached disks that not exists in OpenNebula
        def self.vc_disk(vc_res)
            self.new(nil, nil, vc_res)
        end

        def storpod?
            raise_if_no_exists_in_one
            @one_res['VCENTER_DS_REF'].start_with?('group-')
        end

        def device
            raise_if_no_exists_in_vcenter
            @vc_res[:device]
        end

        def node
            raise_if_no_exists_in_vcenter
            @vc_res[:tag]
        end

        def path
            raise_if_no_exists_in_vcenter
            @vc_res[:path_wo_ds]
        end

        def ds
            raise_if_no_exists_in_vcenter
            @vc_res[:datastore]
        end

        def image_ds_ref
            raise_if_no_exists_in_one
            @one_res['VCENTER_DS_REF']
        end

        def key
            raise_if_no_exists_in_vcenter
            @vc_res[:key]
        end

        def prefix
            raise_if_no_exists_in_vcenter
            @vc_res[:prefix]
        end

        def type
            raise_if_no_exists_in_vcenter
            @vc_res[:type]
        end

        def file
            path.split('/').last
        end

        def is_cd?
            raise_if_no_exists_in_vcenter
            @vc_res[:type] == 'CDROM'
        end

        def config(action)
            raise_if_no_exists_in_vcenter

            config = {}

            if action == :delete
                if managed?
                    key = "opennebula.mdisk.#{@id}"
                else
                    key = "opennebula.disk.#{@id}"
                end

                config[:key] = key
                config[:value] = ''
            elsif action == :resize
                if new_size
                    d = device
                    d.capacityInKB = new_size
                    config[:device] = d
                    config[:operation] = :edit
                end
            elsif action == :attach
                puts 'not supported'
            end

            config
        end

        def persistent?
            raise_if_no_exists_in_one
            @one_res['PERSISTENT'] == 'YES'
        end

        def volatile?
            raise_if_no_exists_in_one
            @one_res['TYPE'] && @one_res['TYPE'].downcase == 'fs'
        end

        def cloned?
            raise_if_no_exists_in_one
            @one_res['SOURCE'] != @vc_res[:path_wo_ds]
        end

        def connected?
            raise_if_no_exists_in_vcenter
            @vc_res[:device].connectable.connected
        end

        def get_size
            @size if @size
        end

        def boot_dev
            if is_cd?
                RbVmomi::VIM.VirtualMachineBootOptionsBootableCdromDevice()
            else
                RbVmomi::VIM.VirtualMachineBootOptionsBootableDiskDevice(
                    deviceKey => device.key
                )
            end
        end

        def set_size(size)
            size = size.to_i

            if @one_res['ORIGINAL_SIZE'] &&
               @one_res['ORIGINAL_SIZE'].to_i >= size
                raise "'disk-resize' cannot decrease the disk's size"
            end

            @size = size
        end

        # Shrink not supported (nil). Size is in KB
        def new_size
            return @size * 1024 if @size

            if @one_res['ORIGINAL_SIZE']
                osize = @one_res['ORIGINAL_SIZE'].to_i
                nsize = @one_res['SIZE'].to_i
                new_size = nsize > osize ? nsize * 1024 : nil
            end
        end

        def destroy
            return if is_cd?

            raise_if_no_exists_in_vcenter

            ds = VCenterDriver::Datastore.new(self.ds)
            img_path = self.path

            begin
                img_dir = File.dirname(img_path)
                search_params = ds.get_search_params(
                    ds['name'],
                    img_dir,
                    File.basename(img_path)
                )
                search_task = ds['browser']
                              .SearchDatastoreSubFolders_Task(search_params)
                search_task.wait_for_completion
                ds.delete_virtual_disk(img_path)
                ds.rm_directory(img_dir) if ds.dir_empty?(img_dir)
            rescue Exception => e
                if !e.message.start_with?('FileNotFound')
                    # Ignore FileNotFound
                    raise e.message
                end
            end
        end

    end

end
