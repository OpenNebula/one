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
        networks = vm.vm_info[:networks].split("\n")[1..-1]
        networks.each do |net|
            n = net.split

            iface_id  = n[0]
            iface_mac = n[2]

            if iface_mac == self[:mac]
                self[:tap] = "vif#{vm_id}.#{iface_id}"
            end
        end
        self
    end
end
