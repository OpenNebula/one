require 'OpenNebula'

include OpenNebula

class VirtualMachinePoolOCCI < VirtualMachinePool
    OCCI_VM_POOL = %q{
        <COMPUTES><% 
             if pool_hash['VM_POOL'] != nil     
                  vmlist=[pool_hash['VM_POOL']['VM']].flatten
                  vmlist.each{|vm|  %>  
            <COMPUTE href="<%= base_url %>/compute/<%= vm['ID'].strip %>"/><%  
                  } 
              end %>
        </COMPUTES>       
    }
    
    
    # Creates the OCCI representation of a Virtual Machine Pool
    def to_occi(base_url)
       pool_hash=to_hash
       
       occi = ERB.new(OCCI_VM_POOL)
       return occi.result(binding).gsub(/\n\s*/,'')
    end
end

