# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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
        NAME = "<%= ImageEC2.generate_uuid %>"
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
        <% if @image_info[:ebs_volume] != nil %>
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

    def self.generate_uuid
        "ec2-" + UUIDTools::UUID.random_create.to_s
    end

    def ebs_volume?
        self["TEMPLATE/EBS_VOLUME"] == "YES"
    end

    def ec2_ami?
        self["TEMPLATE/EC2_AMI"] == "YES"
    end

    def ebs_snapshot?
        self["TEMPLATE/EBS_SNAPSHOT"] == "YES"
    end

    def ec2_id
        if self.ebs_snapshot?
            "snap-" + sprintf('%08i', self.id)
        elsif self.ec2_ami?
            "ami-" + sprintf('%08i', self.id)
        elsif self.ebs_volume?
            "vol-" + sprintf('%08i', self.id)
        end
    end

    def resource_type
        if self.ebs_snapshot?
            "snapshot"
        elsif self.ec2_ami?
            "image"
        elsif self.ebs_volume?
            "volume"
        end
    end
end
