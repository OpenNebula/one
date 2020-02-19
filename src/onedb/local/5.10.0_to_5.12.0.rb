# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

require 'json'
require 'nokogiri'

$LOAD_PATH << File.dirname(__FILE__)

module Migrator

    def db_version
        '5.11.80'
    end

    def one_version
        'OpenNebula 5.11.80'
    end

    def up
        feature_4132
        true
    end

    private

    def feature_4132
        @db.run 'DROP TABLE IF EXISTS old_document_pool;'
        @db.run 'ALTER TABLE document_pool RENAME TO old_document_pool;'

        create_table(:document_pool)

        # VM information to get
        info = %w[ID UID GID UNAME GNAME NAME]

        STDERR.puts 'All custom_attrs will be used as networks'

        @db.transaction do
            @db.fetch('SELECT * FROM old_document_pool') do |row|
                doc = Nokogiri::XML(row[:body], nil, NOKOGIRI_ENCODING) do |c|
                    c.default_xml.noblanks
                end

                json = JSON.parse(doc.xpath('//BODY').text)

                json['networks']     = json['custom_attrs']
                json['custom_attrs'] = {}

                # services
                if row[:type] == 100
                    json['networks_values']     = json['custom_attrs_values']
                    json['custom_attrs_values'] = {}

                    # remove unneeded VM information
                    json['roles'].each do |role|
                        role['nodes'].each do |node|
                            node['vm_info']['VM'] = node['vm_info']['VM'].select do |v|
                                info.include?(v)
                            end
                        end
                    end
                end

                doc.xpath('DOCUMENT/TEMPLATE/BODY')[0].children[0].content = json.to_json

                row[:body] = doc.root.to_s

                @db[:document_pool].insert(row)
            end
        end

        @db.run 'DROP TABLE IF EXISTS old_documentpool;'
    end

end
