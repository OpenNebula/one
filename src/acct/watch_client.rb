module OneWatchClient
    require 'watch_helper'
    require 'json'
    
    class WatchClient
        def vm_monitoring(id, opts=[])
            hash = Hash.new
            hash[:resource] = "VM"
            hash[:id] = id
            
            mon = Hash.new
            opts.each { |opt|
                next unless WatchHelper::VM_SHARE.has_key?(opt.to_sym)
                mon[opt] = Array.new
            }

            # TBD Check if VM exists
            WatchHelper::Vm[id].vm_shares_dataset.map { |vm|
                opts.each { |opt|
                    next unless WatchHelper::VM_SHARE.has_key?(opt.to_sym)
                    mon[opt] << [vm.last_poll, vm.send(opt.to_sym)]
                }
            }
            
            hash[:monitoring] = mon
            
            puts JSON.pretty_generate hash
        end
    end
end