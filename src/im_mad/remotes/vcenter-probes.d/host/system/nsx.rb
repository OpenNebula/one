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

ONE_LOCATION = ENV['ONE_LOCATION'] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby' if !defined?(RUBY_LIB_LOCATION)
    GEMS_LOCATION     = '/usr/share/one/gems' if !defined?(GEMS_LOCATION)
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby' if !defined?(RUBY_LIB_LOCATION)
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems' if !defined?(GEMS_LOCATION)
end

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION

require 'nsx_driver'
require_relative '../../../lib/nsx.rb'

host_id = ARGV[1]

# Vcenter and NSX connection
begin
    nm = NsxMonitor.new(host_id)
    puts nm.nsx_status
    # Get Transport Zone info and NSX_STATUS from NSX Manager
    if nm.nsx_ready?
        puts nm.tz_info
    end
rescue StandardError => e
    STDERR.puts "IM poll for NSX cluster #{host_id} failed due to "\
                "\"#{e.message}\"\n#{e.backtrace}"
end


