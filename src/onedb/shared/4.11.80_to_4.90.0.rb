# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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

require 'opennebula'

include OpenNebula

module Migrator
  def db_version
    "4.90.0"
  end

  def one_version
    "OpenNebula 4.90.0"
  end

  USER_TRANSFORM_ATTRS = {
    'SUNSTONE_DISPLAY_NAME' => 'DISPLAY_NAME',
    'LANG' => 'LANG',
    'TABLE_DEFAULT_PAGE_LENGTH' => 'TABLE_DEFAULT_PAGE_LENGTH',
    'TABLE_ORDER' => 'TABLE_ORDER',
    'DEFAULT_VIEW' => 'DEFAULT_VIEW',
    'GROUP_ADMIN_DEFAULT_VIEW' => 'GROUP_ADMIN_DEFAULT_VIEW'
  }

  GROUP_TRANSFORM_ATTRS = {
    "SUNSTONE_VIEWS" => "VIEWS",
    "DEFAULT_VIEW" => "DEFAULT_VIEW",
    "GROUP_ADMIN_VIEWS" => "GROUP_ADMIN_VIEWS",
    "GROUP_ADMIN_DEFAULT_VIEW" => "GROUP_ADMIN_DEFAULT_VIEW"
  }

  def up
    init_log_time()

    # Feature #3671

    @db.run "ALTER TABLE user_pool RENAME TO old_user_pool;"
    @db.run "CREATE TABLE user_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

    @db.transaction do
      @db.fetch("SELECT * FROM old_user_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        USER_TRANSFORM_ATTRS.each do |old_name, new_name|
          elem = doc.at_xpath("/USER/TEMPLATE/#{old_name}")

          if (!elem.nil?)
            elem.remove

            elem.name = new_name

            if (doc.at_xpath("/USER/TEMPLATE/SUNSTONE").nil?)
              doc.at_xpath("/USER/TEMPLATE").add_child(
                doc.create_element("SUNSTONE"))
            end

            doc.at_xpath("/USER/TEMPLATE/SUNSTONE").add_child(elem)
          end
        end

        @db[:user_pool].insert(
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

    @db.run "DROP TABLE old_user_pool;"

    log_time()

    @db.run "ALTER TABLE group_pool RENAME TO old_group_pool;"
    @db.run "CREATE TABLE group_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

    @db.transaction do
      @db.fetch("SELECT * FROM old_group_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        GROUP_TRANSFORM_ATTRS.each do |old_name, new_name|
          elem = doc.at_xpath("/GROUP/TEMPLATE/#{old_name}")

          if (!elem.nil?)
            elem.remove

            elem.name = new_name

            if (doc.at_xpath("/GROUP/TEMPLATE/SUNSTONE").nil?)
              doc.at_xpath("/GROUP/TEMPLATE").add_child(
                doc.create_element("SUNSTONE"))
            end

            doc.at_xpath("/GROUP/TEMPLATE/SUNSTONE").add_child(elem)
          end
        end

        @db[:group_pool].insert(
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

    @db.run "DROP TABLE old_group_pool;"

    log_time()

    return true
  end

end
