class OpenNebulaVLAN
    def get_info
        vminfo = Hash.new
        vminfo[:dumpxml] = `#{COMMANDS[:virsh]} dumpxml #{@deploy_id}`
        vminfo
    end
end

class NicKVM < Hash
    def get_tap(vm)
        dumpxml = vm.vm_info[:dumpxml]
        dumpxml_root = REXML::Document.new(dumpxml).root

        xpath = "devices/interface[@type='bridge']/"
        xpath << "mac[@address='#{self[:mac]}']/../target"
        tap = dumpxml_root.elements[xpath]

        if tap
            self[:tap] = tap.attributes['dev']
        end
        self
    end
end

