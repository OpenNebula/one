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
            <% if fstype != nil %>
            <FSTYPE><%= fstype %></FSTYPE>
            <% end %>
        </STORAGE>
    }


    ONE_IMAGE = %q{
        NAME = "<%= @image_info['NAME'] %>"
        <% if @image_info['DESCRIPTION'] != nil %>
        DESCRIPTION = "<%= @image_info['DESCRIPTION'] %>"
        <% end %>
        <% if @image_info['TYPE'] != nil %>
        TYPE = <%= @image_info['TYPE'] %>
        <% end %>
        <% if @image_info['FSTYPE'] != nil %>
        FSTYPE = <%= @image_info['FSTYPE'] %>
        <% end %>
        <% if @image_info['SIZE'] != nil %>
        SIZE = <%= @image_info['SIZE'] %>
        <% end %>
    }.gsub(/^        /, '')

    # Class constructor
    def initialize(xml, client, xml_info=nil)
        super(xml, client)
        @image_info = nil

        if xml_info != nil
            xmldoc      = XMLElement.build_xml(xml_info, 'STORAGE')
            @image_info = XMLElement.new(xmldoc) if xmldoc != nil
        end
    end

    # Creates the OCCI representation of an Image
    def to_occi(base_url)
        size = nil

        begin
            if self['SOURCE'] != nil and File.exists?(self['SOURCE'])
                size = File.stat(self['SOURCE']).size 
		size = size / 1024 
		size = size / 1024 
            end

            fstype = self['TEMPLATE/FSTYPE'] if self['TEMPLATE/FSTYPE']
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error
        end

        occi = ERB.new(OCCI_IMAGE)
        return occi.result(binding).gsub(/\n\s*/,'')
    end

    def to_one_template()
        if @image_info == nil
            error_msg = "Missing STORAGE section in the XML body"
            error = OpenNebula::Error.new(error_msg)
            return error
        end

        if @image_info['NAME'] == nil
            error_msg = "Missing Image NAME in the XML DISK section"
            error = OpenNebula::Error.new(error_msg)
            return error
        end

        one = ERB.new(ONE_IMAGE)
        return one.result(binding)
    end
end
