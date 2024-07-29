#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    LIB_LOCATION = '/usr/lib/one'
else
    LIB_LOCATION = ONE_LOCATION + '/lib'
end

require 'erb'
require_relative 'sudoers'

sudoers = Sudoers.new LIB_LOCATION
aliases = sudoers.aliases
aliases.reject! {|_k, v| v.empty? }

puts ERB.new(DATA.read, nil, '<>').result(binding)

__END__
Defaults:oneadmin !requiretty
Defaults:oneadmin secure_path = /sbin:/bin:/usr/sbin:/usr/bin

<% cmd_sets = sudoers.cmds.keys.sort %>
<% cmd_sets.each do |k|; l = "ONE_#{k}"; v = aliases[l]  %>
<%   if !v.nil? %>
Cmnd_Alias <%= l %> = <%= v.join(", ") %>
<%   end %>
<% end %>

## Command aliases are enabled individually in dedicated
## sudoers files by each OpenNebula component (server, node).
# oneadmin ALL=(ALL) NOPASSWD: <%= cmd_sets.each.sort.collect{|k| "ONE_#{k}"}.join(", ") %>
