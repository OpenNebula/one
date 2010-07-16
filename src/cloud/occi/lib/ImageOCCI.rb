# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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

class ImageOCCI < Image
    OCCI_IMAGE = %q{
        <STORAGE href="<%= base_url %>/storage/<%= self.id.to_s  %>">
            <ID><%= self.id.to_s %></ID>
            <NAME><%= self.name %></NAME>
            <% if template['TYPE'] %>
            <TYPE><%= template['TYPE'] %></TYPE>
            <% end %>
            <% if template['DESCRIPTION'] %>
            <DESCRIPTION><%= template['DESCRIPTION'] %></DESCRIPTION>
            <% end %>
            <% if size %>
            <SIZE><%= size %></SIZE>
            <% end %>
        </STORAGE>
    }


    ONE_IMAGE = %q{
        NAME = "<%= image_info['NAME'] %>"
        <% if image_info['DESCRIPTION'] %>
        DESCRIPTION = "<%= image_info['DESCRIPTION'] %>"
        <% end %>
        <% if image_info['TYPE'] %>
        TYPE = <%= image_info['TYPE'] %>
        <% end %>
        <% if image_info['FSTYPE'] %>
        FSTYPE = <%= image_info['FSTYPE'] %>
        <% end %>
        <% if image_info['SIZE'] %>
        SIZE = <%= image_info['SIZE'] %>
        <% end %>
    }.gsub(/^        /, '')

    # Class constructor
    def initialize(image_info, xml, client)
        super(xml, client)

        @image_info = image_info
    end
    
    # Creates the OCCI representation of an Image
    def to_occi(base_url)
        image_hash = self.to_hash
        return image_hash, 500 if OpenNebula.is_error?(image_hash)
        
        template = image_hash['IMAGE']['TEMPLATE']
        begin
            size = File.stat(template['SOURCE']).size if template['SOURCE']
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error
        end
        
        occi = ERB.new(OCCI_IMAGE)
        return occi.result(binding).gsub(/\n\s*/,'')
    end
    
    def to_one_template()
        if @image_info['STORAGE']
            image_info = @image_info['STORAGE']
            if !image_info['NAME']
                error_msg = "Missing Image NAME in the XML DISK section"
                error = OpenNebula::Error.new(error_msg)
                return error
            end
        else            
            error_msg = "Missing STORAGE section in the XML body"
            error = OpenNebula::Error.new(error_msg)
            return error
        end
            
        one = ERB.new(ONE_IMAGE)
        return one.result(binding)
    end
end
