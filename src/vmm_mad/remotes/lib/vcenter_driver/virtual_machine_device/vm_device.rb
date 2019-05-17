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

end
