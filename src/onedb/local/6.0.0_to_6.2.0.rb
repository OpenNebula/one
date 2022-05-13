# -------------------------------------------------------------------------- #
# Copyright 2019-2021, OpenNebula Systems S.L.                               #
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

require 'set'
require 'base64'
require 'zlib'
require 'pathname'
require 'yaml'
require 'opennebula'

$LOAD_PATH << File.dirname(__FILE__)

# OpenNebula DB migrator to 6.2
module Migrator

    include OpenNebula

    def db_version
        '6.2.0'
    end

    def one_version
        'OpenNebula 6.2.0'
    end

    def up
        feature_5289
        true
    end

    def feature_5289
        init_log_time()

        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, short_body MEDIUMTEXT, search_token MEDIUMTEXT);"

        @db.transaction do
          @db.fetch("SELECT * FROM old_vm_pool") do |row|
            doc = nokogiri_doc(row[:body], 'old_vm_pool')

            max_id = doc.root.xpath("USER_TEMPLATE/SCHED_ACTION/ID").map{ |e| e.text.to_i}.max
            max_id ||= -1

            template = doc.root.xpath("TEMPLATE")

            doc.root.xpath("USER_TEMPLATE/SCHED_ACTION").each { |e|
                if (e.xpath("ID").empty?) then
                    max_id += 1
                    e.add_child(doc.create_element("ID")).content = max_id
                end

                template[0].add_child(e)
            }

            sched_actions = doc.root.xpath("USER_TEMPLATE/SCHED_ACTION")
            sched_actions.remove unless sched_actions.nil?

            @db[:vm_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :state      => row[:state],
                :lcm_state  => row[:lcm_state],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u],
                :short_body => row[:short_body],
                :search_token => row[:search_token])
          end
        end

        @db.run "DROP TABLE old_vm_pool;"

        log_time()

        true
      end
end
