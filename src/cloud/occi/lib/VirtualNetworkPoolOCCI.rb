require 'OpenNebula'
require 'Crack'

include OpenNebula

class VirtualNetworkPoolOCCI < VirtualNetworkPool
    # Creates the VMI representation of a Virtual Network
    def to_occi(base_url)
       network_pool_hash=Crack::XML.parse(to_xml)
       occi_xml  = "<NETWORK>"
       
       network_pool_hash['VNET_POOL']['VNET'].each{|network|
           occi_xml+='<NIC id="' + network['ID'].strip + '"' +
                      ' href="' + base_url + '/network/' + network['ID'].strip + '"/>'  
       }
       
       occi_xml += "</NETWORK>" 
    end
end