# -------------------------------------------------------------------------- #
# Copyright 2019-2026, OpenNebula Systems S.L.                               #
#                                                                            #
# Licensed under the OpenNebula Software License                             #
# (the "License"); you may not use this file except in compliance with       #
# the License. You may obtain a copy of the License as part of the software  #
# distribution.                                                              #
#                                                                            #
# See https://github.com/OpenNebula/one/blob/master/LICENSE.onsla            #
# (or copy bundled with OpenNebula in /usr/share/doc/one/).                  #
#                                                                            #
# Unless agreed to in writing, software distributed under the License is     #
# distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY   #
# KIND, either express or implied. See the License for the specific language #
# governing permissions and  limitations under the License.                  #
# -------------------------------------------------------------------------- #

require 'json'
require 'nokogiri'
require 'yaml'

$: << File.dirname(__FILE__)

include OpenNebula

module Migrator
    def db_version
        "7.4.0"
    end

    def one_version
        "OpenNebula 7.4.0"
    end

    def up
        init_log_time

        bug7244

        log_time

        true
    end

    # Backfill UUID for existing OneKS groups
    def bug7244
        @db.transaction do
            @db[:document_pool].where(:type => 121).each do |row|
                doc = nokogiri_doc(row[:body], 'document_pool')

                group_body = doc.at_xpath('/DOCUMENT/TEMPLATE/GROUP_BODY')
                json       = JSON.parse(group_body.text)

                next if json.key?('uuid')

                json['uuid'] = json['name']
                group_body.children[0].content = json.to_json

                @db[:document_pool].where(:oid => row[:oid]).update(:body => doc.root.to_s)
            end
        end
    end

end
