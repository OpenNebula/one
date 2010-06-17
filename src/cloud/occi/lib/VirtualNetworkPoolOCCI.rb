require 'OpenNebula'

include OpenNebula

class VirtualNetworkPoolOCCI < VirtualNetworkPool
    OCCI_NETWORK_POOL = %q{
        <NETWORKS><% 
             if network_pool_hash['VNET_POOL'] != nil       
                  vnlist=[network_pool_hash['VNET_POOL']['VNET']].flatten
                  vnlist.each{|network|%>
            <NETWORK href="<%= base_url %>/network/<%= network['ID'].strip
%>"/><%
                  } 
              end %>
        </NETWORKS>       
    }
    
    # Creates the OCCI representation of a Virtual Network
    def to_occi(base_url)   
      network_pool_hash=to_hash
      
      occi = ERB.new(OCCI_NETWORK_POOL)
      return occi.result(binding).gsub(/\n\s*/,'')
    end
end
