module OpenNebulaVLANXen
    def new_nic(hypervisor)
        NicXen.new(hypervisor)
    end

    def get_info
        vminfo = Hash.new
        deploy_id = @vm['DEPLOY_ID']
        vminfo[:domid]    =`#{COMMANDS[:xm]} domid #{deploy_id}`.strip
        vminfo[:networks] =`#{COMMANDS[:xm]} network-list #{deploy_id}`
        vminfo.each_key{|k| vminfo[k] = nil if vminfo[k].to_s.strip.empty?}
        vminfo
    end
end

class NicXen < Hash
    def initialize(hash=nil)
        super(nil)
    end
    def get_tap(vm)
        domid = vm.vm_info[:domid]
        networks = vm.vm_info[:networks].split("\n")[1..-1]
        networks.each do |net|
            n = net.split

            iface_id  = n[0]
            iface_mac = n[2]

            if iface_mac == self[:mac]
                self[:tap] = "vif#{domid}.#{iface_id}"
                break
            end
        end
        self
    end
end
