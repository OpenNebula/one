#!/usr/bin/env ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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
# -------------------------------------------------------------------------- #

# frozen_string_literal: true

require 'fileutils'
require 'json'

SELF = File.dirname File.realpath(__FILE__)

def patch_dashboard(document)
    templating_list = document.dig 'templating', 'list'
    return document if templating_list.nil?

    datasource = {
        'hide'    => 0,
        'label'   => 'datasource',
        'name'    => 'DS_PROMETHEUS',
        'options' => [],
        'query'   => 'prometheus',
        'refresh' => 1,
        'regex'   => '',
        'type'    => 'datasource'
    }

    # Make sure patching is idempotent.
    return document if templating_list.find do
        |item| item == datasource
    end

    templating_list.prepend datasource

    return document
end

if caller.empty?
    dirs = ARGV.empty? ? ["#{SELF}/dashboards/"] : ARGV
    dirs.each do |dir|
        Dir["#{dir}/*.json"].each do |path|
            document = JSON.load File.read(path)
            document = patch_dashboard document

            FileUtils.cp path, "#{path}.#{Time.now.utc.to_i}.bak"

            File.write path, JSON.pretty_generate(document)
        end
    end
end
