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

require 'opennebula'

include OpenNebula

module Migrator
  def db_version
    "6.2.0"
  end

  def one_version
    "OpenNebula 6.2.0"
  end

  def up
    feature_5353
    true
  end

  def feature_5353
    init_log_time()

    @db.run "ALTER TABLE zone_pool RENAME TO old_zone_pool;"
    @db.run "CREATE TABLE zone_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

    @db.transaction do
      @db.fetch("SELECT * FROM old_zone_pool") do |row|
        doc = nokogiri_doc(row[:body], 'old_zone_pool')

        elem = doc.at_xpath("/ZONE")

        elem.add_child(doc.create_element("STATE")).content = "0"

        @db[:zone_pool].insert(
          :oid        => row[:oid],
          :name       => row[:name],
          :body       => doc.root.to_s,
          :uid        => row[:uid],
          :gid        => row[:gid],
          :owner_u    => row[:owner_u],
          :group_u    => row[:group_u],
          :other_u    => row[:other_u])
      end
    end

    @db.run "DROP TABLE old_zone_pool;"

    log_time()

    true
  end
end
