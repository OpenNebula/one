require 'OpenNebula'
require 'Crack'

include OpenNebula

class VirtualNetworkPoolVMI < VirtualNetworkPool
    # Creates the VMI representation of a Virtual Network
    def to_vmi(base_url)
       network_pool_hash=Crack::XML.parse(to_xml)
       vmi_xml  = "<NETWORKS>"
       
       network_pool_hash['VNET_POOL']['VNET'].each{|network|
           vmi_xml+='<NETWORK id="' + network['ID'].strip + '"' +
                      ' href="' + base_url + '/networks/' + network['ID'].strip + '"/>'  
       }
       
       vmi_xml += "</NETWORKS>" 
    end
end