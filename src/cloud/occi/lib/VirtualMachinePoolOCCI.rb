require 'OpenNebula'
require 'crack'

include OpenNebula

class VirtualMachinePoolOCCI < VirtualMachinePool
    # Creates the OCCI representation of a Virtual Machine Pool
    def to_occi(base_url)
       pool_hash=Crack::XML.parse(to_xml)
       occi_xml =  "<COMPUTES>"
       
       pool_hash['VM_POOL']['VM'].each{|vm|
           occi_xml+='<COMPUTE id="' + vm['ID'].strip + '"' +
                      ' href="' + base_url + '/compute/' + vm['ID'].strip + '"/>'  
       }
       occi_xml += "</COMPUTES>" 
    end
end

