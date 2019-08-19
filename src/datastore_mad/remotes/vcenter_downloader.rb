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

ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby' unless defined?(RUBY_LIB_LOCATION)
    GEMS_LOCATION     = '/usr/share/one/gems' unless defined?(GEMS_LOCATION)
    VAR_LOCATION      = '/var/lib/one' unless defined?(VAR_LOCATION)
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby' unless defined?(RUBY_LIB_LOCATION)
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems' unless defined?(GEMS_LOCATION)
    VAR_LOCATION      = ONE_LOCATION + '/var' unless defined?(VAR_LOCATION)
end

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << File.dirname(__FILE__)

require 'vcenter_driver'
require 'uri'
require 'cgi'
require 'fileutils'
require 'addressable'

vcenter_url     = Addressable::URI.parse(ARGV[0])

params          = CGI.parse(vcenter_url.query)
ds_id           = params["param_dsid"][0]

begin
    vi_client = VCenterDriver::VIClient.new_from_datastore(ds_id)

    source_ds = VCenterDriver::VIHelper.one_item(OpenNebula::Datastore, ds_id)
    source_ds_ref = source_ds['TEMPLATE/VCENTER_DS_REF']

    ds = VCenterDriver::Datastore.new_from_ref(source_ds_ref, vi_client)

    VCenterDriver::FileHelper.dump_vmdk_tar_gz(vcenter_url, ds)
rescue Exception => e
    STDERR.puts "Cannot download image #{vcenter_url.path} from datastore #{ds_id} "\
                "Reason: \"#{e.message}\"\n#{e.backtrace}"
    exit(-1)
ensure
    vi_client.close_connection if vi_client
end
