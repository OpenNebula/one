module VirtualMachineDevice

    require_relative 'vm_device'

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

end
