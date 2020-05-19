#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

ONE_LOCATION ||= ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION   ||= '/usr/lib/one/ruby'
    VAR_LOCATION        ||= '/var/lib/one/'
    GEMS_LOCATION       ||= '/usr/share/one/gems'
else
    RUBY_LIB_LOCATION   ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION       ||= ONE_LOCATION + '/share/gems'
    VAR_LOCATION        ||= ONE_LOCATION + '/var/'
end

REMOTE_LIB_LOCATION ||= VAR_LOCATION + 'remotes/im/lib'

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
    $LOAD_PATH.reject! {|l| l =~ /(vendor|site)_ruby/ }
end

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << REMOTE_LIB_LOCATION

require 'vcenter.rb'

host_id = ARGV[-2]

begin
    # VCenter Monitoring object
    vcm = VcenterMonitor.new(host_id)
    puts vcm.monitor_clusters
    puts vcm.monitor_host_systems
    # Retrieve customizations
    begin
        puts vcm.monitor_customizations
    rescue StandardError
        # Do not break monitoring on customization error
        puts 'ERROR="Customizations could not be retrieved,' \
                'please check permissions"'
    end

    # Get NSX info detected from vCenter Server
    puts vcm.nsx_info

    # Fetch VMs info ( update cache if neccesary )
    vcm.retrieve_vms_data

    # VM wilds info
    puts vcm.monitor_vms('wilds')

    # Datastore Monitoring
    puts vcm.monitor_datastores
rescue StandardError => e
    STDERR.puts "IM poll for vCenter cluster #{host_id} failed due to "\
                "\"#{e.message}\"\n#{e.backtrace}"
    exit(-1)
ensure
    @vi_client.close_connection if @vi_client
end
