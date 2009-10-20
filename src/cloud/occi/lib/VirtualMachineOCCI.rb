require 'OpenNebula'

include OpenNebula

class VirtualMachineOCCI < VirtualMachine
    OCCI_VM = %q{
        <COMPUTE>
            <ID><%= id.to_s%></ID>
            <NAME><%= self['NAME']%></NAME>
            <STATE><%= state_str %></STATE>
            <% if template['DISK']!=nil 
            %><STORAGE><%
                template['DISK'].each do |disk| 
                     next if !disk 
                     case disk['TYPE']
                         when "disk"%>
                <DISK type="disk" href="<%= base_url%>/storage/<%= disk['IMAGE_ID']%>" dev="<%= disk['DEV']%>"/><%
                         when "swap"%>
                <DISK type="swap" size="<%= disk['SIZE']%>" dev="<%= disk['DEV']%>"/><%    
                         when "fs"%>
                <DISK type="fs" size="<%= disk['SIZE']%>" format="<%= disk['FORMAT']%>" dev="<%= disk['DEV']%>"/><%   
                      end                  
               end %>           
            </STORAGE>  
            <% end 
            if template['NIC'] 
            %><NETWORK><%
                 template['NIC'].each do |nic|
                     next if !nic %>
                <NIC href="<%= base_url%>/network/<%= nic['VNID']%>"<% if nic['IP'] %> ip="<%= nic['IP']%>"<% end %>/><%
               end        
            %>
            </NETWORK><%    
               end
               if template['INSTANCE_TYPE'] %>
            <INSTANCE_TYPE><%=template['INSTANCE_TYPE']%></INSTANCE_TYPE><%
             end %>
        </COMPUTE>     
    }.gsub(/^        /, '')
    
    
    # Creates the VMI representation of a Virtual Machine
    def to_occi(base_url)
        # Let's parse the template
        template=self.to_hash
        template=template['VM']['TEMPLATE']
        template['DISK']=[template['DISK']].flatten if template['DISK']
        template['NIC']=[template['NIC']].flatten if template['NIC']
    
        occi = ERB.new(OCCI_VM)
        return occi.result(binding)

    end
end




