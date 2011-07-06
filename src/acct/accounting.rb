module OneWatch
    require 'watch_helper'

    class Accounting
        def initialize(client)
            @client = client
            @active_vms = Array.new
        end

        def insert(hash)
            @ptimestamp = @timestamp
            @timestamp  = generate_timestamp

            new_active_vms = Array.new
            last_active_vm = @active_vms.empty? ?  -1 : @active_vms.last

            if (vmpool_hash = hash['VM_POOL']) && !vmpool_hash.empty?
                [vmpool_hash['VM']].flatten.each { |vm|
                    vm_id  = vm['ID'].to_i

                    if vm['STATE'] == 3
                        new_active_vms << vm_id
                    end

                    # ACTIVE VMs (including those that are stopped in this step)
                    # in the last step and NEW VMs
                    if @active_vms.include?(vm_id) || vm['STATE'].to_i == 3
                        insert_vm(vm)
                        @active_vms.delete(vm_id)
                    else
                        # DONE/STOP VMs and non ACTIVE in the last step
                        next
                    end
                }
            end

            # DONE VMs that were ACTIVE in the last step
            @active_vms.each { |id|
                vm = OpenNebula::VirtualMachine.new_with_id(id, @client)
                vm.info

                vm_hash = vm.to_hash
                insert_vm(vm_hash)
            }

            # DONE VMs that did not exist in the last step
            vmpool = OpenNebula::VirtualMachinePool.new(@client)
            vmpool.info(-2, last_active_vm, -1, 6)
            done_hash = vmpool.to_hash
            if (done_vm_hash = done_hash['VM_POOL']) && !done_vm_hash.empty?
                [done_vm_hash['VM']].flatten.each { |vm|
                    insert_vm(vm)
                }
            end

            # Upate the active VMs
            @active_vms = new_active_vms.sort
        end

        private

        def generate_timestamp
            Time.now.to_i
        end

        def insert_register(vm, register, history)
            if register && register.seq == history['SEQ'].to_i
                register.update_from_history(history)
            else
                reg = WatchHelper::Register.create_from_history(history)
                vm.add_register(reg)
            end
        end

        def update_history(vm, vm_sql)
            last_register = vm_sql.registers.last
            seq = last_register ? last_register.seq : 0

            if hr = vm['HISTORY_RECORDS']
                unless hr['HISTORY'].instance_of?(Array)
                    if hr['HISTORY']['SEQ'] == seq
                        # The VM has not moved from the Host
                        insert_register(vm_sql, last_register, hr['HISTORY'])
                        return
                    else
                        # Get the full HISTORY
                        vm = OpenNebula::VirtualMachine.new_with_id(vm['ID'], @client)
                        vm.info

                        vm_hash = vm.to_hash['VM']
                        hr = vm_hash['HISTORY_RECORDS']

                        # Insert a new entry for each new history record
                        [hr['HISTORY']].flatten.each { |history|
                            if history['SEQ'].to_i < seq
                                next
                            else
                                insert_register(vm_sql, last_register, history)
                            end
                        }
                    end
                end
            end
        end

        def insert_vm(vm)
            vm_sql = WatchHelper::Vm.info(vm)
            update_history(vm, vm_sql)
        end
    end
end

