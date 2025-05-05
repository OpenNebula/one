#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    LIB_LOCATION      ||= '/usr/lib/one'
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
else
    LIB_LOCATION      ||= ONE_LOCATION + '/lib'
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
end

# %%RUBYGEMS_SETUP_BEGIN%%
require 'load_opennebula_paths'
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION

require 'rexml/document'
require 'fileutils'
require 'open3'

begin
    xml_txt = STDIN.read
    config = REXML::Document.new(xml_txt).root
rescue StandardError => e
    puts e.inspect
    exit(-1)
end

# rubocop:disable Lint/SuppressedException
begin
    ds_location = config.elements['DATASTORE_LOCATION'].text.to_s
rescue StandardError
end
# rubocop:enable Lint/SuppressedException

ds_location ||= '/var/lib/one/datastores'

Dir.chdir ds_location

datastores = Dir.glob('*').select do |f|
    File.directory?(f) && f.match(/^\d+$/)
end

datastores.each do |ds|
    # Skip if datastore is not marked for local monitoring
    mark = "#{ds_location}/#{ds}/.monitor"

    next unless File.exist? mark

    driver = File.read mark
    driver ||= 'ssh'

    driver.chomp!

    # NOTE: tm folder may not be defined relative for custom datastore_location
    tm_script = "/var/tmp/one/tm/#{driver}/monitor_ds"

    next unless File.exist? tm_script

    o, _e, s = Open3.capture3("#{tm_script} #{ds_location}/#{ds}")

    next unless s.exitstatus == 0

    puts o
end
