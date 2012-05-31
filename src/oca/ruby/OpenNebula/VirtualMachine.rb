# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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


require 'OpenNebula/Pool'

module OpenNebula
    class VirtualMachine < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################


        VM_METHODS = {
            :info       => "vm.info",
            :allocate   => "vm.allocate",
            :action     => "vm.action",
            :migrate    => "vm.migrate",
            :deploy     => "vm.deploy",
            :savedisk   => "vm.savedisk",
            :chown      => "vm.chown",
            :chmod      => "vm.chmod",
            :monitoring => "vm.monitoring"
        }

        VM_STATE=%w{INIT PENDING HOLD ACTIVE STOPPED SUSPENDED DONE FAILED}

        LCM_STATE=%w{LCM_INIT PROLOG BOOT RUNNING MIGRATE SAVE_STOP SAVE_SUSPEND
            SAVE_MIGRATE PROLOG_MIGRATE PROLOG_RESUME EPILOG_STOP EPILOG
            SHUTDOWN CANCEL FAILURE CLEANUP UNKNOWN}

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
            "CLEANUP"       => "clea",
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

        # Class constructor
        def initialize(xml, client)
            super(xml,client)
        end

        #######################################################################
        # XML-RPC Methods for the Virtual Machine Object
        #######################################################################

        # Retrieves the information of the given VirtualMachine.
        def info()
            super(VM_METHODS[:info], 'VM')
        end

        # Allocates a new VirtualMachine in OpenNebula
        #
        # +description+ A string containing the template of the VirtualMachine.
        def allocate(description)
            super(VM_METHODS[:allocate],description)
        end

        # Initiates the instance of the VM on the target host.
        #
        # +host_id+ The host id (hid) of the target host where
        # the VM will be instantiated.
        def deploy(host_id)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VM_METHODS[:deploy], @pe_id, host_id.to_i)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Shutdowns an already deployed VM
        def shutdown
            action('shutdown')
        end

        # Reboots an already deployed VM
        def reboot
            action('reboot')
        end

        # Resets an already deployed VM
        def reset
            action('reset')
        end
        
        # Cancels a running VM
        def cancel
            action('cancel')
        end

        # Sets a VM to hold state, scheduler will not deploy it
        def hold
            action('hold')
        end

        # Releases a VM from hold state
        def release
            action('release')
        end

        # Stops a running VM
        def stop
            action('stop')
        end

        # Saves a running VM
        def suspend
            action('suspend')
        end

        # Resumes the execution of a saved VM
        def resume
            action('resume')
        end

        # Deletes a VM from the pool
        def finalize
            action('finalize')
        end

        # Forces a re-deployment of a VM in UNKNOWN or BOOT state
        def restart
            action('restart')
        end

        # Resubmits a VM to PENDING state
        def resubmit
            action('resubmit')
        end

        # Sets the re-scheduling flag for the VM
        def resched
            action('resched')
        end

        # Unsets the re-scheduling flag for the VM
        def unresched
            action('unresched')
        end

        # Saves a running VM and starts it again in the specified host
        def migrate(host_id)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VM_METHODS[:migrate], @pe_id, host_id.to_i, false)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Migrates a running VM to another host without downtime
        def live_migrate(host_id)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VM_METHODS[:migrate], @pe_id, host_id.to_i, true)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Set the specified vm's disk to be saved in a new image
        # when the VirtualMachine shutdowns
        #
        # @param disk_id [Integer] ID of the disk to be saved
        # @param image_name [String] Name for the new image where the
        #   disk will be saved
        # @param image_type [String] Type of the new image. Set to empty string
        #   to use the default type
        #
        # @return [Integer, OpenNebula::Error] the new Image ID in case of
        #   success, error otherwise
        def save_as(disk_id, image_name, image_type="")
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VM_METHODS[:savedisk],
                              @pe_id,
                              disk_id,
                              image_name,
                              image_type)

            return rc
        end

        # Changes the owner/group
        # uid:: _Integer_ the new owner id. Set to -1 to leave the current one
        # gid:: _Integer_ the new group id. Set to -1 to leave the current one
        # [return] nil in case of success or an Error object
        def chown(uid, gid)
            super(VM_METHODS[:chown], uid, gid)
        end

        # Changes the permissions.
        #
        # @param octet [String] Permissions octed , e.g. 640
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet)
            super(VM_METHODS[:chmod], octet)
        end

        # Changes the permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                other_m, other_a)
            super(VM_METHODS[:chmod], owner_u, owner_m, owner_a, group_u,
                group_m, group_a, other_u, other_m, other_a)
        end

        # Retrieves this VM's monitoring data from OpenNebula
        #
        # @param [Array<String>] xpath_expressions Elements to retrieve.
        #
        # @return [Hash<String, Array<Array<int>>>, OpenNebula::Error] Hash with
        #   the requested xpath expressions, and an Array of 'timestamp, value'.
        #
        # @example
        #   vm.monitoring( ['CPU', 'NET_TX', 'TEMPLATE/CUSTOM_PROBE'] )
        #
        #   { "NET_TX" => 
        #       [["1337264510", "210"],
        #        ["1337264553", "220"],
        #        ["1337264584", "230"]],
        #     "TEMPLATE/CUSTOM_PROBE" =>
        #       [],
        #     "CPU" =>
        #       [["1337264510", "0"],
        #        ["1337264553", "0"],
        #        ["1337264584", "0"]]
        #   }
        def monitoring(xpath_expressions)
            return super(VM_METHODS[:monitoring], 'VM',
                'LAST_POLL', xpath_expressions)
        end

        # Retrieves this VM's monitoring data from OpenNebula, in XML
        #
        # @return [String] VM monitoring data, in XML
        def monitoring_xml()
            return Error.new('ID not defined') if !@pe_id

            return @client.call(VM_METHODS[:monitoring], @pe_id)
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

        # Returns the group identifier
        # [return] _Integer_ the element's group ID
        def gid
            self['GID'].to_i
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
