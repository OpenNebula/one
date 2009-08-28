require 'OpenNebula'
require 'Crack'

include OpenNebula

class VirtualMachinePoolVMI < VirtualMachinePool
    # Creates the VMI representation of a Virtual Machine Pool
    def to_vmi(base_url)
       pool_hash=Crack::XML.parse(to_xml)
       vmi_xml =  "<VMS>"
       
       pool_hash['VM_POOL']['VM'].each{|vm|
           vmi_xml+='<VM id="' + vm['ID'].strip + '"' +
                      ' href="' + base_url + '/vms/' + vm['ID'].strip + '"/>'  
       }
       vmi_xml += "</VMS>" 
    end
end

