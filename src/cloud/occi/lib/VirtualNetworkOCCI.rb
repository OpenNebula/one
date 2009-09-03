require 'OpenNebula'
require 'Crack'

include OpenNebula

class VirtualNetworkOCCI < VirtualNetwork
    # Creates the OCCI representation of a Virtual Network
    def to_occi()
       vn_hash=Crack::XML.parse(to_xml)
       occi_xml  = "<NIC>"
       
       occi_xml += "<ID>" + vn_hash['VNET']['ID'].strip + "</ID>"
       occi_xml += "<NAME>" + vn_hash['VNET']['NAME'].strip + "</NAME>"
       occi_xml += "<ADDRESS>" + vn_hash['VNET']['TEMPLATE']['NETWORK_ADDRESS'].strip + "</ADDRESS>"
       occi_xml += "<SIZE>" + vn_hash['VNET']['TEMPLATE']['NETWORK_SIZE'].strip + "</SIZE>"
       
       occi_xml += "</NIC>" 
    end
    
    def to_one_template(network_hash, bridge)
        one_template  = "NAME=" + network_hash['NAME'] + "\n"
        one_template += "TYPE=RANGED\n"
        one_template += "BRIDGE=" + bridge + "\n"
        one_template += "NETWORK_ADDRESS=" + network_hash['ADDRESS'] + "\n"
        one_template += "NETWORK_SIZE=" + network_hash['SIZE'] + "\n"
    end
end

