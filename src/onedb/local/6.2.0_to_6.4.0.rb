# -------------------------------------------------------------------------- #
# Copyright 2019-2023, OpenNebula Systems S.L.                               #
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

require 'opennebula'

$LOAD_PATH << File.dirname(__FILE__)

# OpenNebula DB migrator to 6.4
module Migrator

    include OpenNebula

    def db_version
        '6.4.0'
    end

    def one_version
        'OpenNebula 6.4.0'
    end

    def up
        feature_5725
        true
    end

    def feature_5725
        init_log_time

        # Add STATE and PREV state to all Virtual Networks
        @db.run 'ALTER TABLE network_pool RENAME TO old_network_pool;'
        create_table(:network_pool)

        @db.transaction do
            @db.fetch('SELECT * FROM old_network_pool') do |row|
                doc = nokogiri_doc(row[:body], 'old_network_pool')

                state_node = doc.create_element('STATE', '1')
                doc.root.at_xpath('/VNET').add_child(state_node)

                prev_state_node = doc.create_element('PREV_STATE', '1')
                doc.root.at_xpath('/VNET').add_child(prev_state_node)

                row[:body] = doc.root.to_s
                @db[:network_pool].insert(row)
            end
        end

        @db.run 'DROP TABLE old_network_pool;'

        # Remove old hooks
        %w[vcenter_net_create
           vcenter_net_delete
           vcenter_net_instantiate].each do |hook|
            @db.run "DELETE FROM hook_pool WHERE name='#{hook}';"
        end

        log_time

        true
    end

end
