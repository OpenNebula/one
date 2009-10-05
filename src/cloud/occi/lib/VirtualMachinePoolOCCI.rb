require 'OpenNebula'
require 'crack'

include OpenNebula

class VirtualMachinePoolOCCI < VirtualMachinePool
    # Creates the OCCI representation of a Virtual Machine Pool
    def to_occi(base_url)
       pool_hash=Crack::XML.parse(to_xml)
       occi_xml =  "<COMPUTES>"
       
       if pool_hash['VM_POOL'] != nil     
           vmlist=[pool_hash['VM_POOL']['VM']].flatten
       
           vmlist.each{|vm|
               occi_xml+='<COMPUTE ' + 'href="' + 
                          base_url + '/compute/' + vm['ID'].strip + '"/>'  
           }
       end
       
       occi_xml += "</COMPUTES>" 
    end
end

