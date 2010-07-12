
class SimplePermissions
    
    def initialize(database=nil)
        # initialize quota
    end
    
    def auth_message(result, message)
        result ? true : message
    end
    
    def auth(uid, tokens)
        result=true
        
        tokens.each do |token|
            object, id, action, owner=token.split(':')
            result=auth_object(uid.to_s, object, id, action, owner)
            break result if result!=true
        end
        
        result
    end
    
    def auth_object(uid, object, id, action, owner)
        return true if uid==0
        
        case object
        when 'VM'
            return auth_vm(uid, object, id, action, owner)
        when 'HOST'
            return auth_host(uid, object, id, action, owner)
        else
            return auth_generic(uid, object, id, action, owner)
        end
    end
    
    def auth_vm(uid, object, id, action, owner)
        case action
        when 'CREATE'
            # add quota here
            return true
        else
            auth_message(uid==owner, "You cannot manage VM #{id}")
        end
    end
    
    def auth_host(uid, object, id, action, owner)
        auth_message(action=='USE', 'Only oneadmin can manage hosts')
    end
    
    def auth_generic(uid, object, id, action, owner)
        if action=='CREATE'
            true
        else
            auth_message(uid==owner, "You are not allowed to #{action} "<<
                "#{object} #{id}")
        end
    end
end