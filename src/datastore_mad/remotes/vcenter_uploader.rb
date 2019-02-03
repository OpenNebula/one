#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                  #
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

ONE_LOCATION=ENV["ONE_LOCATION"] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby" if !defined?(RUBY_LIB_LOCATION)
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby" if !defined?(RUBY_LIB_LOCATION)
end

$: << RUBY_LIB_LOCATION
$: << File.dirname(__FILE__)

require 'vcenter_driver'

ds_id           = ARGV[0]
target_ds_ref   = ARGV[1]
target_path     = ARGV[2]
source_path     = ARGV[3]

begin
    vi_client = VCenterDriver::VIClient.new_from_datastore(ds_id)
    ds = VCenterDriver::Datastore.new_from_ref(target_ds_ref, vi_client)

    # Setting "." as the source will read from the stdin
    source_path = "." if source_path.nil?

    ds.create_directory(File.dirname(target_path))

    VCenterDriver::VIClient.in_silence do
        ds.upload_file(source_path, target_path)
    end

    puts target_path

rescue Exception => e
    STDERR.puts "Cannot upload image to datastore #{ds_id} "\
                "Reason: \"#{e.message}\"\n#{e.backtrace}"
    exit -1
ensure
    vi_client.close_connection if vi_client
end

