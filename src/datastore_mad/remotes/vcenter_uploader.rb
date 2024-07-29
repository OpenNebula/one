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

ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION =
        '/usr/lib/one/ruby' unless defined?(RUBY_LIB_LOCATION)
    GEMS_LOCATION =
        '/usr/share/one/gems' unless defined?(GEMS_LOCATION)
else
    RUBY_LIB_LOCATION =
        ONE_LOCATION + '/lib/ruby' unless defined?(RUBY_LIB_LOCATION)
    GEMS_LOCATION =
        ONE_LOCATION + '/share/gems' unless defined?(GEMS_LOCATION)
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

ds_id           = ARGV[0]
target_ds_ref   = ARGV[1]
target_path     = ARGV[2]
source_path     = ARGV[3]

begin
    vi_client = VCenterDriver::VIClient.new_from_datastore(ds_id)
    ds = VCenterDriver::Datastore.new_from_ref(target_ds_ref, vi_client)

    # Setting "." as the source will read from the stdin
    source_path = '.' if source_path.nil?

    ds.create_directory(File.dirname(target_path))

    VCenterDriver::VIClient.in_silence do
        ds.upload_file(source_path, target_path)
    end

    puts target_path
rescue StandardError => e
    STDERR.puts "Cannot upload image to datastore #{ds_id} "\
                "Reason: \"#{e.message}\""
    if VCenterDriver::CONFIG[:debug_information]
        STDERR.puts e.backtrace.to_s
    end
    exit(-1)
ensure
    vi_client.close_connection if vi_client
end
