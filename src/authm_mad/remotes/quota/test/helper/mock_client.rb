require 'erb'

FPATH = "./fixtures/"

class MockClient
    def initialize
        @vms = Hash.new
        @done_vms = Hash.new
        
        @images = Hash.new
    end


    def call(action, *args)
        xmlrpc_action = "one."+action

        case xmlrpc_action
            when "one.vm.info"
                id = args[0]
                vm = @vms[id]
                return ERB.new(File.read(FPATH+'vm.xml')).result(binding)
            when "one.vmpool.info"
                case args[3]
                when -1
                    vms = @vms
                    return ERB.new(File.read(FPATH+'vmpool.xml')).result(binding)
                when 6 then
                    vms = @done_vms
                    return ERB.new(File.read(FPATH+'vmpool.xml')).result(binding)
                end
            when "one.imagepool.info"
                images = @images
                return ERB.new(File.read(FPATH+'imagepool.xml')).result(binding)
        end
    end

    def add_vm(id, values)
        if values[:state] == 6
            @done_vms[id] = values.clone
        else
            @vms[id] = values.clone
        end
    end

    def delete_vm(id)
        @vms.delete(id)
        @vms_done.delete(id)
    end
    
    def add_image(id, values)
        @images[id] = values
    end
end