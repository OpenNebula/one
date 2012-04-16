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

class ImageOCCI < Image
    OCCI_IMAGE = %q{
        <STORAGE href="<%= base_url %>/storage/<%= self.id.to_s  %>">
            <ID><%= self.id.to_s %></ID>
            <NAME><%= self.name %></NAME>
            <USER href="<%= base_url %>/user/<%= self['UID'] %>" name="<%= self['UNAME'] %>"/>
            <GROUP><%= self['GNAME'] %></GROUP>
            <STATE><%= self.state_str %></STATE>
            <% if self['TYPE'] != nil %>
            <TYPE><%= self.type_str %></TYPE>
            <% end %>
            <% if self['TEMPLATE/DESCRIPTION'] != nil %>
            <DESCRIPTION><%= self['TEMPLATE/DESCRIPTION'] %></DESCRIPTION>
            <% end %>
            <SIZE><%= self['SIZE'] %></SIZE>
            <% if self['FSTYPE'] != nil and  !self['FSTYPE'].empty? %>
            <FSTYPE><%= self['FSTYPE'] %></FSTYPE>
            <% end %>
            <PUBLIC><%= self.public? ? "YES" : "NO" %></PUBLIC>
            <PERSISTENT><%= self['PERSISTENT'] == "0" ? "NO" : "YES"%></PERSISTENT>
        </STORAGE>
    }


    ONE_IMAGE = %q{
        NAME = "<%= @image_info['NAME'] %>"
        <% if @image_info['DESCRIPTION'] != nil %>
        DESCRIPTION = "<%= @image_info['DESCRIPTION'] %>"
        <% end %>
        <% if @image_file != nil %>
        PATH = "<%= @image_file %>"
        <% end %>
        <% if @image_info['PUBLIC'] != nil %>
        PUBLIC = "<%= @image_info['PUBLIC'] %>"
        <% end %>
        <% if @image_info['PERSISTENT'] != nil %>
        PERSISTENT = "<%= @image_info['PERSISTENT'] %>"
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
    def initialize(xml, client, xml_info=nil, file=nil)
        super(xml, client)
        @image_info = nil
        @image_file = file

        if file && file[:tempfile]
            @image_file = file[:tempfile].path
        end

        if xml_info != nil
            xmldoc      = XMLElement.build_xml(xml_info, 'STORAGE')
            @image_info = XMLElement.new(xmldoc) if xmldoc != nil
        end
    end

    # Creates the OCCI representation of an Image
    def to_occi(base_url, verbose=false)
        begin
            occi_im = ERB.new(OCCI_IMAGE)
            occi_im_text = occi_im.result(binding)
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error
        end

        return occi_im_text.gsub(/\n\s*/,'')
    end

    def to_one_template
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
