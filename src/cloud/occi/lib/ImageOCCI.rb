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
            <% if self['TEMPLATE/TYPE'] != nil %>
            <TYPE><%= self['TEMPLATE/TYPE'] %></TYPE>
            <% end %>
            <% if self['TEMPLATE/DESCRIPTION'] != nil %>
            <DESCRIPTION><%= self['TEMPLATE/DESCRIPTION'] %></DESCRIPTION>
            <% end %>
            <% if size != nil %>
            <SIZE><%= size %></SIZE>
            <% end %>
        </STORAGE>
    }


    ONE_IMAGE = %q{
        NAME = "<%= @image_info.elements['NAME'].text %>"
        <% if @image_info.elements['DESCRIPTION'] != nil %>
        DESCRIPTION = "<%= @image_info.elements['DESCRIPTION'].text %>"
        <% end %>
        <% if @image_info.elements['TYPE'] != nil %>
        TYPE = <%= @image_info.elements['TYPE'].text %>
        <% end %>
        <% if @image_info.elements['FSTYPE'] != nil %>
        FSTYPE = <%= @image_info.elements['FSTYPE'].text %>
        <% end %>
        <% if @image_info.elements['SIZE'] != nil %>
        SIZE = <%= @image_info.elements['SIZE'].text %>
        <% end %>
    }.gsub(/^        /, '')

    # Class constructor
    def initialize(xml, client, xml_info=nil)
        super(xml, client)

        if xml_info != nil
            @image_info = REXML::Document.new(xml_info).root
        else
            @image_info = nil
        end
    end

    # Creates the OCCI representation of an Image
    def to_occi(base_url)
        size = nil

        begin
            if self['TEMPLATE/SOURCE'] != nil
                size = File.stat(self['TEMPLATE/SOURCE']).size
            end
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error
        end

        occi = ERB.new(OCCI_IMAGE)
        return occi.result(binding).gsub(/\n\s*/,'')
    end

    def to_one_template()
        if @image_info.name != 'STORAGE'
            error_msg = "Missing STORAGE section in the XML body"
            error = OpenNebula::Error.new(error_msg)
            return error
        end

        if @image_info.elements['NAME'] == nil
            error_msg = "Missing Image NAME in the XML DISK section"
            error = OpenNebula::Error.new(error_msg)
            return error
        end

        one = ERB.new(ONE_IMAGE)
        return one.result(binding)
    end
end
