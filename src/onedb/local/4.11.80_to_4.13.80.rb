# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

module Migrator
    def db_version
        "4.13.80"
    end

    def one_version
        "OpenNebula 4.13.80"
    end

    def up
      #3654
      puts "**************************************************************"
      puts "*  WARNING  WARNING WARNING WARNING WARNING WARNING WARNING  *"
      puts "**************************************************************"
      puts
      puts "#{one_version} improves the management of FAILED VMs  "
      puts "Please remove (onevm delete) any FAILED VM before continuing. "
      puts

      #2742
      puts "**************************************************************"
      puts "*  WARNING  WARNING WARNING WARNING WARNING WARNING WARNING  *"
      puts "**************************************************************"
      puts
      puts
      puts "The scheduler (and oned) has been update to enforce access    "
      puts "rights on system datastores. This new version also checks that"
      puts "the user can access the System DS."
      puts "This *may require* to update system DS rights of your cloud"
      puts
      printf "Do you want to proceed ? [y/N]"

      ans = STDIN.gets.strip.downcase

      return false if ans != "y"

      init_log_time()

      # 3805
      @db.run "ALTER TABLE document_pool RENAME TO old_document_pool;"
      @db.run "CREATE TABLE document_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, type INTEGER, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

      @db.transaction do
          @db.fetch("SELECT * FROM old_document_pool") do |row|
              doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

              lock_elem = doc.create_element("LOCK")
              lock_elem.add_child(doc.create_element("LOCKED")).content = "0"
              lock_elem.add_child(doc.create_element("OWNER")).content = ""
              lock_elem.add_child(doc.create_element("EXPIRES")).content = "0"

              doc.root.add_child(lock_elem)

              @db[:document_pool].insert(
                  :oid        => row[:oid],
                  :name       => row[:name],
                  :body       => doc.root.to_s,
                  :type       => row[:type],
                  :uid        => row[:uid],
                  :gid        => row[:gid],
                  :owner_u    => row[:owner_u],
                  :group_u    => row[:group_u],
                  :other_u    => row[:other_u])
          end
      end

      @db.run "DROP TABLE old_document_pool;"

      log_time()

      # 3718

      # Move monitoring attributes in VM pool table

      @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
      @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

      @db.transaction do
        @db.fetch("SELECT * FROM old_vm_pool") do |row|
          doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

          update_monitoring(doc.root.at_xpath("/VM"))

          @db[:vm_pool].insert(
            :oid        => row[:oid],
            :name       => row[:name],
            :body       => doc.root.to_s,
            :uid        => row[:uid],
            :gid        => row[:gid],
            :last_poll  => row[:last_poll],
            :state      => row[:state],
            :lcm_state  => row[:lcm_state],
            :owner_u    => row[:owner_u],
            :group_u    => row[:group_u],
            :other_u    => row[:other_u])
        end
      end

      @db.run "DROP TABLE old_vm_pool;"

      log_time()

      # Move monitoring attributes in the history table

      @db.run "ALTER TABLE history RENAME TO old_history;"
      @db.run "CREATE TABLE history (vid INTEGER, seq INTEGER, body MEDIUMTEXT, stime INTEGER, etime INTEGER,PRIMARY KEY(vid,seq));"

      @db.transaction do
        @db.fetch("SELECT * FROM old_history") do |row|
          doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

          elem = doc.root.at_xpath("/HISTORY/VM")
          if !elem.nil?
            update_monitoring(elem)
          end

          @db[:history].insert(
            :vid    => row[:vid],
            :seq    => row[:seq],
            :body   => doc.root.to_s,
            :stime  => row[:stime],
            :etime  => row[:etime])
        end
      end

      @db.run "DROP TABLE old_history;"

      log_time()

      # 3782

      @db.run "ALTER TABLE image_pool RENAME TO old_image_pool;"
      @db.run "CREATE TABLE image_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid) );"

      @db.transaction do
        @db.fetch("SELECT * FROM old_image_pool") do |row|
          doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

          doc.root.add_child(doc.create_element("TARGET_SNAPSHOT")).content = "-1"
          doc.root.add_child(doc.create_element("SNAPSHOTS"))

          @db[:image_pool].insert(
            :oid      => row[:oid],
            :name     => row[:name],
            :body     => doc.root.to_s,
            :uid      => row[:uid],
            :gid      => row[:gid],
            :owner_u  => row[:owner_u],
            :group_u  => row[:group_u],
            :other_u  => row[:other_u])
        end
      end

      @db.run "DROP TABLE old_image_pool;"

      log_time()

      return true
    end

    def mv_monitoring(vm_elem, prev_name, new_name)
      elem = vm_elem.at_xpath(prev_name)

      if (!elem.nil?)
        vm_elem.at_xpath("MONITORING").add_child(
          vm_elem.document.create_element(new_name)).content = elem.text

        elem.remove
      end
    end

    def update_monitoring(vm_elem)
      vm_elem.add_child(vm_elem.document.create_element("MONITORING"))

      mv_monitoring(vm_elem, "CPU",    "CPU")
      mv_monitoring(vm_elem, "MEMORY", "MEMORY")
      mv_monitoring(vm_elem, "NET_RX", "NETRX")
      mv_monitoring(vm_elem, "NET_TX", "NETTX")
    end
end