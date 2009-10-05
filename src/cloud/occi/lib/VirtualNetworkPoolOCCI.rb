require 'OpenNebula'
require 'crack'

include OpenNebula

class VirtualNetworkPoolOCCI < VirtualNetworkPool
    # Creates the VMI representation of a Virtual Network
    def to_occi(base_url)
       network_pool_hash=Crack::XML.parse(to_xml)
       occi_xml  = "<NETWORK>"
       
       vnlist=[pool_hash['VNET_POOL']['VNET']].flatten
       
       vnlist.each{|network|
           occi_xml+='<NIC ' + 'href="' +
                      base_url + '/network/' + network['ID'].strip + '"/>'  
       }
       
       occi_xml += "</NETWORK>" 
    end
end
