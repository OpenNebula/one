#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                  #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

ONE_LOCATION ||= ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
else
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
end

# %%RUBYGEMS_SETUP_BEGIN%%
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }

        # Suppress warnings from Rubygems
        # https://github.com/OpenNebula/one/issues/5379
        begin
            verb = $VERBOSE
            $VERBOSE = nil
            require 'rubygems'
            Gem.use_paths(real_gems_path)
        ensure
            $VERBOSE = verb
        end
    end
end
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << File.dirname(__FILE__)

require 'vcenter_driver'

CONFIG = VCenterConf.new

host_id = ARGV[0]
vm_type = ARGV[1]
ccr     = ARGV[2]

begin
    vi_client = VCenterDriver::VIClient.new_from_host(host_id)

    cluster = VCenterDriver::ClusterComputeResource.new_from_ref(ccr, vi_client)

    str_info, _ltime = cluster.monitor_vms(host_id, vm_type)

    puts str_info
rescue StandardError => e
    message = "Monitoring of VMs on vCenter cluster #{host_id} " \
                 " failed due to \"#{e.message}\"."
    OpenNebula.log_error(message)
    if VCenterDriver::CONFIG[:debug_information]
        STDERR.puts "#{message} #{e.backtrace}"
    end

    exit(-1)
ensure
    vi_client.close_connection if vi_client
end
