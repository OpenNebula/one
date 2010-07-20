require 'OpenNebula/Pool'

module OpenNebula
    class VirtualMachine < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################
        VM_METHODS = {
            :info     => "vm.info",
            :allocate => "vm.allocate",
            :action   => "vm.action",
            :migrate  => "vm.migrate",
            :deploy   => "vm.deploy"
        }

        VM_STATE=%w{INIT PENDING HOLD ACTIVE STOPPED SUSPENDED DONE FAILED}

        LCM_STATE=%w{LCM_INIT PROLOG BOOT RUNNING MIGRATE SAVE_STOP SAVE_SUSPEND
            SAVE_MIGRATE PROLOG_MIGRATE PROLOG_RESUME EPILOG_STOP EPILOG
            SHUTDOWN CANCEL FAILURE DELETE UNKNOWN}

        SHORT_VM_STATES={
            "INIT"      => "init",
            "PENDING"   => "pend",
            "HOLD"      => "hold",
            "ACTIVE"    => "actv",
            "STOPPED"   => "stop",
            "SUSPENDED" => "susp",
            "DONE"      => "done",
            "FAILED"    => "fail"
        }

        SHORT_LCM_STATES={
            "PROLOG"        => "prol",
            "BOOT"          => "boot",
            "RUNNING"       => "runn",
            "MIGRATE"       => "migr",
            "SAVE_STOP"     => "save",
            "SAVE_SUSPEND"  => "save",
            "SAVE_MIGRATE"  => "save",
            "PROLOG_MIGRATE"=> "migr",
            "PROLOG_RESUME" => "prol",
            "EPILOG_STOP"   => "epil",
            "EPILOG"        => "epil",
            "SHUTDOWN"      => "shut",
            "CANCEL"        => "shut",
            "FAILURE"       => "fail",
            "DELETE"        => "dele",
            "UNKNOWN"       => "unkn"
        }

        MIGRATE_REASON=%w{NONE ERROR STOP_RESUME USER CANCEL}

        SHORT_MIGRATE_REASON={
            "NONE"          => "none",
            "ERROR"         => "erro",
            "STOP_RESUME"   => "stop",
            "USER"          => "user",
            "CANCEL"        => "canc"
        }

        # Creates a VirtualMachine description with just its identifier
        # this method should be used to create plain VirtualMachine objects.
        # +id+ the id of the vm
        #
        # Example:
        #   vnet = VirtualMachine.new(VirtualMachine.build_xml(3),rpc_client)
        #
        def VirtualMachine.build_xml(pe_id=nil)
            if pe_id
                vm_xml = "<VM><ID>#{pe_id}</ID></VM>"
            else
                vm_xml = "<VM></VM>"
            end

            XMLElement.build_xml(vm_xml, 'VM')
        end

        def VirtualMachine.get_reason(reason)
            reason=MIGRATE_REASON[reason.to_i]
            reason_str=SHORT_MIGRATE_REASON[reason]

            reason_str
        end

        #######################################################################
        # Class constructor
        #######################################################################
        def initialize(xml, client)
            super(xml,client)

            @element_name = "VM"
            @client       = client
        end

        #######################################################################
        # XML-RPC Methods for the Virtual Machine Object
        #######################################################################

        def info()
            super(VM_METHODS[:info], 'VM')
        end

        def allocate(description)
            super(VM_METHODS[:allocate],description)
        end

        def deploy(host_id)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VM_METHODS[:deploy], @pe_id, host_id.to_i)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        def shutdown
            action('shutdown')
        end

        def cancel
            action('cancel')
        end

        def hold
            action('hold')
        end

        def release
            action('release')
        end

        def stop
            action('stop')
        end

        def suspend
            action('suspend')
        end

        def resume
            action('resume')
        end

        def finalize
            action('finalize')
        end

        def restart
            action('restart')
        end

        def migrate(host_id)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VM_METHODS[:migrate], @pe_id, host_id.to_i, false)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        def live_migrate(host_id)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VM_METHODS[:migrate], @pe_id, host_id.to_i, true)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        #######################################################################
        # Helpers to get VirtualMachine information
        #######################################################################

        # Returns the VM state of the VirtualMachine (numeric value)
        def state
            self['STATE'].to_i
        end

        # Returns the VM state of the VirtualMachine (string value)
        def state_str
            VM_STATE[state]
        end

        # Returns the LCM state of the VirtualMachine (numeric value)
        def lcm_state
            self['LCM_STATE'].to_i
        end

        # Returns the LCM state of the VirtualMachine (string value)
        def lcm_state_str
            LCM_STATE[lcm_state]
        end

        # Returns the short status string for the VirtualMachine
        def status
            short_state_str=SHORT_VM_STATES[state_str]

            if short_state_str=="actv"
                short_state_str=SHORT_LCM_STATES[lcm_state_str]
            end

            short_state_str
        end

    private
        def action(name)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VM_METHODS[:action], name, @pe_id)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end
    end
end
