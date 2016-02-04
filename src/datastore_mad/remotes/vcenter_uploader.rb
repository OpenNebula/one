#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                  #
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

hostname    = ARGV[0]
ds_name     = ARGV[1]
target_path = ARGV[2]

def in_silence
    begin
      orig_stderr = $stderr.clone
      orig_stdout = $stdout.clone
      $stderr.reopen File.new('/dev/null', 'w')
      $stdout.reopen File.new('/dev/null', 'w')
      retval = yield
    rescue Exception => e
      $stdout.reopen orig_stdout
      $stderr.reopen orig_stderr
      raise e
    ensure
      $stdout.reopen orig_stdout
      $stderr.reopen orig_stderr
    end
   retval
end

begin
    host_id      = VCenterDriver::VIClient.translate_hostname(hostname)
    vi_client    = VCenterDriver::VIClient.new host_id

    ds = vi_client.get_datastore(ds_name)

    # Setting "." as the source will read from the stdin
    in_silence do
        ds.upload(target_path, ".")
    end

    puts target_path
rescue Exception => e
    STDERR.puts "Cannot upload image to datastore #{ds_name} on #{hostname}."\
                "Reason: #{e.message}"
    exit -1
end
