module OpenNebulaVLANXen
    def new_nic(hypervisor)
        NicXen.new(hypervisor)
    end
        
    def get_info
        vminfo = Hash.new
        vm_info[:domid]    =`#{CONF[:xm]} domid #{VM_NAME}`.strip
        vm_info[:networks] =`#{CONF[:xm]} network-list #{vm_id}`
        vminfo.each_key{|k| vminfo[k] = nil if vminfo[k].to_s.strip.empty?}
        vminfo
    end
end

class NicXen < Nic
    def initialize
        super(nil)
    end
    def get_tap(vm)
        #TODO
        self
    end
end
