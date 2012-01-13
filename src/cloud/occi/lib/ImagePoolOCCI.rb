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

require 'OpenNebula'

include OpenNebula

class ImagePoolOCCI < ImagePool
    OCCI_IMAGE_POOL = %q{
        <STORAGE_COLLECTION>
            <% self.each{ |im|  %>  
            <STORAGE href="<%= base_url %>/storage/<%= im.id.to_s  %>" name="<%= im.name  %>"/>
            <% } %>
        </STORAGE_COLLECTION>       
    }
    
    
    # Creates the OCCI representation of a Virtual Machine Pool
    def to_occi(base_url)
        begin
            occi = ERB.new(OCCI_IMAGE_POOL)
            occi_text = occi.result(binding) 
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error
        end

        return occi_text.gsub(/\n\s*/,'')
    end
end

