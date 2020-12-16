#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                  #
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

if File.directory?(GEMS_LOCATION)
  $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }
  require 'rubygems'
  Gem.use_paths(File.realpath(GEMS_LOCATION))
end

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << File.dirname(__FILE__)

require 'vcenter_driver'

CONFIG = VCenterConf.new

host_id = ARGV[0]
vm_type = ARGV[1]

begin
  vi_client = VCenterDriver::VIClient.new_from_host(host_id)

  cluster = Cluster.new(host_id, vi_client)

  str_info , _ltime = cluster.monitor_vms(@host.id, vm_type)

  puts str_info
rescue StandardError => e
  message =  "Monitoring of VM #{vm_id} on vCenter cluster #{cluster_name} " \
               " failed due to \"#{e.message}\"."
  OpenNebula.log_error(message)
  if VCenterDriver::CONFIG[:debug_information]
    STDERR.puts "#{message} #{e.backtrace}"
  end

  exit(-1)
ensure
  vi_client.close_connection if vi_client
end
