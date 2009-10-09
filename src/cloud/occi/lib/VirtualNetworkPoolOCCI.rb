require 'OpenNebula'

include OpenNebula

class VirtualNetworkPoolOCCI < VirtualNetworkPool
    # Creates the VMI representation of a Virtual Network
    def to_occi(base_url)

      network_pool_hash=to_hash
      occi_xml  = "<NETWORK>"
       
      if network_pool_hash['VNET_POOL'] != nil        
           vnlist=[network_pool_hash['VNET_POOL']['VNET']].flatten
       
           vnlist.each{|network|
               occi_xml+='<NIC ' + 'href="' +
                          base_url + '/network/' + network['ID'].strip + '"/>'  
           }
       end
       
       occi_xml += "</NETWORK>" 
    end
end
