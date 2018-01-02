#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                  #
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
    VAR_LOCATION="/var/lib/one" if !defined?(VAR_LOCATION)
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby" if !defined?(RUBY_LIB_LOCATION)
    VAR_LOCATION=ONE_LOCATION+"/var" if !defined?(VAR_LOCATION)
end

$: << RUBY_LIB_LOCATION
$: << File.dirname(__FILE__)

require 'vcenter_driver'
require 'uri'
require 'cgi'
require 'fileutils'

vcenter_url     = ARGV[0]

u               = URI.parse(vcenter_url)
params          = CGI.parse(u.query)

ds_id           = params["param_dsid"][0]
img_src         = u.host + u.path

begin
    vi_client = VCenterDriver::VIClient.new_from_datastore(ds_id)

    source_ds = VCenterDriver::VIHelper.one_item(OpenNebula::Datastore, ds_id)
    source_ds_ref = source_ds['TEMPLATE/VCENTER_DS_REF']

    ds = VCenterDriver::Datastore.new_from_ref(source_ds_ref, vi_client)

    if ds.is_descriptor?(img_src)
        descriptor_name = File.basename u.path
        temp_folder = VAR_LOCATION + "/vcenter/" + descriptor_name + "/"
        FileUtils.mkdir_p(temp_folder) if !File.directory?(temp_folder)

        # Build array of files to download
        files_to_download = [descriptor_name]
        descriptor = ds.get_text_file img_src
        flat_files = descriptor.select{|l| l.start_with?("RW")}
        flat_files.each do |file|
            files_to_download << file.split(" ")[3].chomp.chomp('"').reverse.chomp('"').reverse
        end

        # Download files
        url_prefix = u.host + "/"

        VCenterDriver::VIClient.in_silence do
            files_to_download.each{|file|
                ds.download_file(url_prefix + file, temp_folder + file)
            }
        end

        # Create tar.gz
        rs = system("cd #{temp_folder} && tar czf #{descriptor_name}.tar.gz #{files_to_download.join(' ')} >& /dev/null")
        (FileUtils.rm_rf(temp_folder) ; raise "Error creating tar file for #{descriptor_name}") unless rs

        # Cat file to stdout
        rs = system("cat #{temp_folder + descriptor_name}.tar.gz")
        (FileUtils.rm_rf(temp_folder) ; raise "Error reading tar for #{descriptor_name}") unless rs

        # Delete tar.gz
        rs = system("cd #{temp_folder} && rm #{descriptor_name}.tar.gz #{files_to_download.join(' ')}")
        (FileUtils.rm_rf(temp_folder) ; raise "Error removing tar for #{descriptor_name}") unless rs
    else
        # Setting "." as the source will read from the stdin
        VCenterDriver::VIClient.in_stderr_silence do
            ds.download_to_stdout(img_src)
        end
    end

rescue Exception => e
    STDERR.puts "Cannot download image #{u.path} from datastore #{ds_id} "\
                "Reason: \"#{e.message}\"\n#{e.backtrace}"
    exit -1
ensure
    vi_client.close_connection if vi_client
end
