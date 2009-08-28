require 'OpenNebula'

include OpenNebula

class VirtualMachineVMI < VirtualMachine
    # Creates the VMI representation of a Virtual Machine
    def to_vmi
        vmi_xml  = "<VM>"
        vmi_xml += "<ID>" + id.to_s + "</ID>"
        vmi_xml += "<NAME>" + self['NAME'] + "</NAME>"
        vmi_xml += "<TYPE>" + self['VMI_SIZE_TYPE'] + "</TYPE>" if self['VMI_SIZE_TYPE']
        vmi_xml += "<STATE>" + state_str + "</STATE>"
        
        # Now let's parse the template
        template=self.to_hash("TEMPLATE")
        
        template['DISK']=[template['DISK']].flatten
        
         if template['DISK']
             
             vmi_xml += "<DISKS>"
        
            template['DISK'].each{|disk|
                case disk['TYPE']
                    when "disk" then
                        vmi_xml += "<DISK image=#{disk['ID']} dev=#{disk['TARGET']}/>"
                    when "swap" then
                        vmi_xml += "<SWAP size=#{disk['SIZE']} dev=#{disk['TARGET']}/>"
                    when "fs" then
                        vmi_xml += "<FS size=#{disk['SIZE']} format=#{disk['FORMAT']} dev=#{disk['TARGET']}/>"
                end
            }
        
            vmi_xml += "</DISKS>"
        end 
        
        template['NIC']=[template['NIC']].flatten
                 
        if template['NIC']
            vmi_xml += "<NICS>" 
        
            template['NIC'].each{|nic|
                
                vmi_xml += "<NIC network=#{nic['VNID']}"
                if nic['IP']
                     vmi_xml += " ip=#{nic['IP']}"
                end
                vmi_xml += "/>"
            }
        
            vmi_xml += "</NICS>" 
        end
        
        vmi_xml  += "</VM>"
        
        return vmi_xml

    end
end

if $0 == __FILE__
    t=VirtualMachineVMI.new(VirtualMachine.build_xml(6),Client.new("tinova:opennebula"))
 #   t=VirtualMachineVMI.new(VirtualMachine.build_xml,nil)
    t.info
    puts t.to_vmi
end



