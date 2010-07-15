
require 'quota'
require 'base64'

class SimplePermissions
    
    def initialize(database, client, conf={})
        @quota=Quota.new(database, client, conf[:quota] || {})
    end
    
    def auth_message(result, message)
        result ? true : message
    end
    
    def get_vm_usage(data)
        vm_xml=Base64::decode64(data)
        vm=OpenNebula::VirtualMachine.new(
            OpenNebula::XMLUtilsElement.initialize_xml(vm_xml, 'VM'),
            OpenNebula::Client.new)
        vm_hash=vm.to_hash
        
        # Should set more sensible defaults or get driver configuration
        cpu=vm_hash['TEMPLATE']['CPU']
        cpu||=1.0
        cpu=cpu.to_f
        
        memory=vm_hash['TEMPLATE']['MEMORY']
        memory||=64
        memory=memory.to_f
        
        VmUsage.new(cpu, memory)
    end
    
    def auth(uid, tokens)
        STDERR.puts [uid, tokens].inspect
        
        result=true
        
        tokens.each do |token|
            object, id, action, owner, pub=token.split(':')
            result=auth_object(uid.to_s, object, id, action, owner, pub)
            break result if result!=true
        end
        
        result
    end
    
    def auth_object(uid, object, id, action, owner, pub)
        return true if uid=='0'
        
        case object
        when 'VM'
            return auth_vm(uid, object, id, action, owner, pub)
        when 'HOST'
            return auth_host(uid, object, id, action, owner, pub)
        else
            return auth_generic(uid, object, id, action, owner, pub)
        end
    end
    
    def auth_vm(uid, object, id, action, owner, pub)
        case action
        when 'CREATE'
            STDERR.puts "create vm"
            @quota.update(uid.to_i)
            if @quota.check(uid.to_i, get_vm_usage(id))
                return true
            else
                return "Quota exceeded"
            end
        else
            auth_message(uid==owner, "You cannot manage VM #{id}")
        end
    end
    
    def auth_host(uid, object, id, action, owner, pub)
        auth_message(action=='USE', 'Only oneadmin can manage hosts')
    end
    
    def auth_generic(uid, object, id, action, owner, pub)
        case action
        when 'CREATE'
            true
        when 'USE'
            auth_message(uid==owner || pub=='1', "You are not allowed to "<<
                "#{action} #{object} #{id}")
        else
            auth_message(uid==owner, "You are not allowed to "<<
                "#{action} #{object} #{id}")
        end
    end
end