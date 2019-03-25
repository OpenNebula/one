#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    LIB_LOCATION="/usr/lib/one"
else
    LIB_LOCATION=ONE_LOCATION+"/lib"
end

require "erb"

CMDS = {
    :MISC   => %w(mkfs sync mkswap),
    :NET    => %w(brctl ebtables iptables ip6tables ip ipset arping),
    :LVM    => %w(lvcreate lvremove lvs vgdisplay lvchange lvscan lvextend),
    :ISCSI  => %w(iscsiadm tgt-admin tgtadm),
    :OVS    => %w(ovs-ofctl ovs-vsctl),
    :XEN    => %w(xentop xl xm),
    :CEPH   => %w(rbd),
    :MARKET => %W{#{LIB_LOCATION}/sh/create_container_image.sh},
    :HA     => [
        'systemctl start opennebula-flow',
        'systemctl stop opennebula-flow',
        'systemctl start opennebula-gate',
        'systemctl stop opennebula-gate',
        'service opennebula-flow start',
        'service opennebula-flow stop',
        'service opennebula-gate start',
        'service opennebula-gate stop'
    ],
}

KEYS = CMDS.keys

abs_cmds = {}
not_found_cmds = []

KEYS.each do |label|
    cmds = CMDS[label]

    _abs_cmds = []
    cmds.each do |cmd|
        cmd_parts = cmd.split
        abs_cmd = `which #{cmd_parts[0]} 2>/dev/null`

        if !abs_cmd.empty?
            cmd_parts[0] = abs_cmd.strip
            _abs_cmds << cmd_parts.join(' ')
        else
            not_found_cmds << cmd
        end
    end

    abs_cmds["ONE_#{label}"] = _abs_cmds
end

abs_cmds.reject!{|k,v| v.empty?}

puts ERB.new(DATA.read,nil, "<>").result(binding)

if !not_found_cmds.empty?
    STDERR.puts "\n---\n\nNot found:"
    not_found_cmds.each{|cmd| STDERR.puts("- #{cmd}")}
end

__END__
Defaults !requiretty
Defaults secure_path = /sbin:/bin:/usr/sbin:/usr/bin

<% KEYS.each do |k|; l = "ONE_#{k}"; v = abs_cmds[l]  %>
<% if !v.nil? %>
Cmnd_Alias <%= l %> = <%= v.join(", ") %>
<% end %>
<% end %>

oneadmin ALL=(ALL) NOPASSWD: <%= KEYS.select{|k| !abs_cmds["ONE_#{k}"].nil?}.collect{|k| "ONE_#{k}"}.join(", ") %>
