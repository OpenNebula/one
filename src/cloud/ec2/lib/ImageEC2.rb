# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'uuidtools'
require 'opennebula'

include OpenNebula

class ImageEC2Pool < ImagePool
    def initialize(client, user_id=-1)
        super(client, user_id)
    end

    def factory(element_xml)
        ImageEC2.new(element_xml,@client)
    end
end

class ImageEC2 < Image

    EC2_IMAGE_STATES={
        "INIT"      => "pending",
        "READY"     => "available",
        "USED"      => "available",
        "DISABLED"  => nil,
        "LOCKED"    => "pending",
        "ERROR"     => "failed",
        "CLONE"     => "available",
        "DELETE"    => nil,
        "USED_PERS" => "in-use"
    }

    ONE_IMAGE = %q{
        NAME = "ec2-<%= uuid %>"
        TYPE = <%= @image_info[:type] %>
        <% if @image_info[:size] != nil %>
        SIZE = "<%= @image_info[:size] %>"
        <% end %>
        <% if @image_info[:fstype] != nil %>
        FSTYPE = "<%= @image_info[:fstype] %>"
        <% end %>
        <% if @image_info[:persistent] != nil %>
        PERSISTENT = "YES"
        <% end %>
        <% if @image_info[:ebs] != nil %>
        EBS_VOLUME = "YES"
        <% end %>
        <% if @image_file != nil %>
        PATH = "<%= @image_file %>"
        <% end %>
    }.gsub(/^        /, '')

    def initialize(xml, client, file=nil, opts={})
        super(xml, client)
        @image_info = opts
        @image_file = file

        if file && file[:tempfile]
            @image_file = file[:tempfile].path
        end
    end

    def to_one_template()
        uuid = UUIDTools::UUID.random_create.to_s

        one = ERB.new(ONE_IMAGE)
        return one.result(binding)
    end

    def render_state
        EC2_IMAGE_STATES[self.state_str]
    end

    def render_size
        self['SIZE'].to_i/1024
    end

    def render_create_time
        Time.at(self["REGTIME"].to_i).xmlschema
    end
end
