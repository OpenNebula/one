# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

require 'VirtualMachineOCCI'

class VirtualMachinePoolOCCI < VirtualMachinePool
    OCCI_VM_POOL = %q{
        <COMPUTE_COLLECTION>
            <% self.each{ |vm|  %>
            <% if verbose %>
            <%= vm.to_occi(base_url) %>
            <% else %>
            <COMPUTE href="<%= base_url %>/compute/<%= vm.id.to_s  %>" name="<%= vm.name  %>"/>
            <% end %>
            <% } %>
        </COMPUTE_COLLECTION>       
    }
    
    
    # Creates the OCCI representation of a Virtual Machine Pool
    def to_occi(base_url, verbose=false)
        begin
            occi = ERB.new(OCCI_VM_POOL)
            occi_text = occi.result(binding) 
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error
        end    

        return occi_text.gsub(/\n\s*/,'')
    end

    def factory(element_xml)
        VirtualMachineOCCI.new(element_xml,@client)
    end
end

