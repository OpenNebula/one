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
require 'rexml/document'
require 'open3'
require 'fileutils'

# This class abstract the monitor of host datastores
class DSMonitor

    def initialize(config)
        # rubocop:disable Lint/SuppressedException
        begin
            @ds_location = config.elements['DATASTORE_LOCATION'].text.to_s
        rescue StandardError
        end
        # rubocop:enable Lint/SuppressedException

        @ds_location ||= '/var/lib/one/datastores'

        FileUtils.mkdir_p @ds_location
    end

    def dss_metrics
        puts ds_location_usage

        Dir.chdir @ds_location

        datastores = Dir.glob('*').select do |f|
            File.directory?(f) && f.match(/^\d+$/)
        end

        datastores.each do |ds_id|
            # Skip if datastore is not marked for local monitoring
            next unless File.exist? "#{@ds_location}/#{ds_id}/.monitor"

            puts ds_usage(ds_id)
        end
    end

    private

    def ds_location_usage
        sizes = path_usage(@ds_location)

        unindent(<<-EOS)
            DS_LOCATION_USED_MB  = #{sizes[0]}
            DS_LOCATION_TOTAL_MB = #{sizes[1]}
            DS_LOCATION_FREE_MB  = #{sizes[2]}
        EOS
    end

    def ds_usage(ds_id)
        sizes = path_usage("#{@ds_location}/#{ds_id}")

        unindent(<<-EOS)
            DS = [ ID = #{ds_id},
                   USED_MB  = #{sizes[0]},
                   TOTAL_MB = #{sizes[1]},
                   FREE_MB  = #{sizes[2]}
          ]
        EOS
    end

    def path_usage(path)
        o, _e, s = Open3.capture3("df -B1M -P #{path} 2>/dev/null")

        return [0, 0, 0] if s.exitstatus != 0 || o.empty?

        metrics = o.lines[-1].split(' ')

        # [used, total, free]
        [metrics[2], metrics[1], metrics[3]]
    end

    def unindent(str)
        mrc    = str.match(/^(\s*)/)
        spaces = mrc[1].size

        str.gsub!(/^ {#{spaces}}/, '')
    end

end

#-------------------------------------------------------------------------------
# Probe main program
#-------------------------------------------------------------------------------

begin
    xml_txt = STDIN.read
    config = REXML::Document.new(xml_txt).root
rescue StandardError => e
    puts e.inspect
    exit(-1)
end

monitor = DSMonitor.new config
monitor.dss_metrics
