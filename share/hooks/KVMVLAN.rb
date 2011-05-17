class OpenNebulaVLAN
    def get_info
        vminfo = Hash.new
        dumpxml = `#{COMMANDS[:virsh]} dumpxml #{@deploy_id} 2>/dev/null`
        vminfo[:dumpxml] = dumpxml.strip.empty? ? nil : dumpxml
        vminfo
    end
end

class NicKVM < Hash
    def initialize(hash=nil)
        super(nil)
    end
    def get_tap(vm)
        dumpxml = vm.vm_info[:dumpxml]
        if dumpxml
            dumpxml_root = REXML::Document.new(dumpxml).root

            xpath = "devices/interface[@type='bridge']/"
            xpath << "mac[@address='#{self[:mac]}']/../target"
            tap = dumpxml_root.elements[xpath]

            if tap
                self[:tap] = tap.attributes['dev']
            end
        end
        self
    end
end

