# -------------------------------------------------------------------------- #
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                #
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

require 'nokogiri'

require 'lib/exporters/file'
require 'lib/exporters/rbd'
require 'lib/exporters/lv'

require 'lib/restorers/base'

# OneVMDump module
#
# Module for exporting VM content into a bundle file
module OneVMDump

    def self.get_exporter(vm, config)
        # Get TM_MAD from last history record
        begin
            last_hist_rec = Nokogiri.XML(vm.get_history_record(-1))
            tm_mad = last_hist_rec.xpath('//TM_MAD').text
        rescue StandardError
            raise 'Cannot retrieve TM_MAD. The last history record' \
                  ' might be corrupted or it might not exists.'
        end

        case tm_mad
        when 'ceph'
            self::RBDExporter.new(vm, config)
        when 'ssh', 'shared', 'qcow2'
            self::FileExporter.new(vm, config)
        when 'fs_lvm', 'fs_lvm_ssh'
            self::LVExporter.new(vm, config)
        else
            raise "Unsopported TM_MAD: '#{tm_mad}'"
        end
    end

    def self.get_restorer(bundle_path, options)
        BaseRestorer.new(bundle_path, options)
    end

end
