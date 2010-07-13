
require 'quota'

class SimplePermissions
    
    def initialize(database, client, conf={})
        @quota=Quota.new(database, client, conf[:quota] || {})
    end
    
    def auth_message(result, message)
        result ? true : message
    end
    
    def auth(uid, tokens)
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
            # add quota here
            return true
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