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

  def up
    init_log_time()

    # 4215

    @db.run "CREATE TABLE vrouter_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

    @db.transaction do
      @db.fetch("SELECT oid,body FROM group_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        doc.root.xpath("ADMINS/ID").each do |uid|
          user     = Acl::USERS["UID"] | uid.text.to_i
          resource = 354936097341440 | Acl::USERS["GID"] | row[:oid]

          @db[:acl].where({
              :user=>user,          # #<uid>
              :resource=>resource,  # VM+NET+IMAGE+TEMPLATE+DOCUMENT+SECGROUP/@<gid>
              :rights=>3,           # USE+MANAGE
              :zone=>17179869184    # *
            }).update(
              # VM+NET+IMAGE+TEMPLATE+DOCUMENT+SECGROUP+VROUTER/@101
              :resource => (1480836004184064 | Acl::USERS["GID"] | row[:oid]))
        end
      end
    end

    log_time()

    @db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"
    @db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, pid INTEGER, UNIQUE(name,uid));"

    @db.transaction do
      @db.fetch("SELECT * FROM old_network_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        doc.root.add_child(doc.create_element("VROUTERS"))

        @db[:network_pool].insert(
          :oid      => row[:oid],
          :name     => row[:name],
          :body     => doc.root.to_s,
          :uid      => row[:uid],
          :gid      => row[:gid],
          :owner_u  => row[:owner_u],
          :group_u  => row[:group_u],
          :other_u  => row[:other_u],
          :cid      => row[:cid],
          :pid      => row[:pid])
      end
    end

    @db.run "DROP TABLE old_network_pool;"

    log_time()

    ########################################################################
    # OpenNebula Systems MarketPlace
    ########################################################################

    oneadmin_uname = nil

    @db.fetch("SELECT name FROM user_pool WHERE oid=0") do |row|
        oneadmin_uname = row[:name]
    end

    if oneadmin_uname == nil
        puts "Error trying to read oneadmin's user name ('SELECT name FROM user_pool WHERE oid=0')"
        return false
    end

    oneadmin_gname = nil

    @db.fetch("SELECT name FROM group_pool WHERE oid=0") do |row|
        oneadmin_gname = row[:name]
    end

    if oneadmin_gname == nil
        puts "Error trying to read oneadmin's group name ('SELECT name FROM group_pool WHERE oid=0')"
        return false
    end

    @db.run  "CREATE TABLE marketplace_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

    @db.run "INSERT INTO marketplace_pool VALUES(0,'OpenNebula Public','<MARKETPLACE><ID>0</ID><UID>0</UID><GID>0</GID><UNAME>#{oneadmin_uname}</UNAME><GNAME>#{oneadmin_gname}</GNAME><NAME>OpenNebula Public</NAME><MARKET_MAD><![CDATA[one]]></MARKET_MAD><TOTAL_MB>0</TOTAL_MB><FREE_MB>0</FREE_MB><USED_MB>0</USED_MB><MARKETPLACEAPPS></MARKETPLACEAPPS><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>1</OWNER_A><GROUP_U>1</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>1</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TEMPLATE><DESCRIPTION><![CDATA[OpenNebula Systems MarketPlace]]></DESCRIPTION></TEMPLATE></MARKETPLACE>',0,0,1,1,1);"

    @db.run "INSERT INTO pool_control VALUES('marketplace_pool',99);"

    @db.run "CREATE TABLE marketplaceapp_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid));"

    return true
  end

end
