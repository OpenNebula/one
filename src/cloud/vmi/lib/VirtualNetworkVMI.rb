require 'OpenNebula'
require 'Crack'

include OpenNebula

class VirtualNetworkVMI < VirtualNetwork
    # Creates the VMI representation of a Virtual Network
    def to_vmi()
       vn_hash=Crack::XML.parse(to_xml)
       vmi_xml  = "<NETWORK>"
       
       vmi_xml += "<ID>" + vn_hash['VNET']['ID'].strip + "</ID>"
       vmi_xml += "<NAME>" + vn_hash['VNET']['NAME'].strip + "</NAME>"
       vmi_xml += "<ADDRESS>" + vn_hash['VNET']['TEMPLATE']['NETWORK_ADDRESS'].strip + "</ADDRESS>"
       vmi_xml += "<SIZE>" + vn_hash['VNET']['TEMPLATE']['NETWORK_SIZE'].strip + "</SIZE>"
       
       vmi_xml += "</NETWORK>" 
    end
    
    def to_one_template(network_hash, bridge)
        one_template  = "NAME=" + network_hash['NAME'] + "\n"
        one_template += "TYPE=RANGED\n"
        one_template += "BRIDGE=" + bridge + "\n"
        one_template += "NETWORK_ADDRESS=" + network_hash['ADDRESS'] + "\n"
        one_template += "NETWORK_SIZE=" + network_hash['SIZE'] + "\n"
    end
end

