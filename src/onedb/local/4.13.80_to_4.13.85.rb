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
        "4.13.85"
    end

    def one_version
        "OpenNebula 4.13.85"
    end

    def up
      init_log_time()

      # 1727

      @db.run "ALTER TABLE user_quotas RENAME TO old_user_quotas;"
      @db.run "CREATE TABLE user_quotas (user_oid INTEGER PRIMARY KEY, body MEDIUMTEXT);"

      @db.transaction do
        # oneadmin does not have quotas
        @db.fetch("SELECT * FROM old_user_quotas WHERE user_oid=0") do |row|
          @db[:user_quotas].insert(row)
        end

        @db.fetch("SELECT * FROM old_user_quotas WHERE user_oid>0") do |row|
          doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

          calculate_quotas(doc, "uid=#{row[:user_oid]}", "User")

          @db[:user_quotas].insert(
            :user_oid   => row[:user_oid],
            :body       => doc.root.to_s)
        end
      end

      @db.run "DROP TABLE old_user_quotas;"

      log_time()

      @db.run "ALTER TABLE group_quotas RENAME TO old_group_quotas;"
      @db.run "CREATE TABLE group_quotas (group_oid INTEGER PRIMARY KEY, body MEDIUMTEXT);"

      @db.transaction do
        # oneadmin does not have quotas
        @db.fetch("SELECT * FROM old_group_quotas WHERE group_oid=0") do |row|
          @db[:group_quotas].insert(row)
        end

        @db.fetch("SELECT * FROM old_group_quotas WHERE group_oid>0") do |row|
          doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

          calculate_quotas(doc, "gid=#{row[:group_oid]}", "Group")

          @db[:group_quotas].insert(
            :group_oid  => row[:group_oid],
            :body       => doc.root.to_s)
        end
      end

      @db.run "DROP TABLE old_group_quotas;"

      log_time()

      default_user_quotas = nil
      default_group_quotas = nil

      @db.fetch("SELECT * FROM system_attributes WHERE name = 'DEFAULT_USER_QUOTAS'") do |row|
        default_user_quotas = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        vm_elem = default_user_quotas.root.at_xpath("VM_QUOTA/VM")

        if !vm_elem.nil?
          vm_elem.at_xpath("VOLATILE_SIZE").name      = "SYSTEM_DISK_SIZE"
          vm_elem.at_xpath("VOLATILE_SIZE_USED").name = "SYSTEM_DISK_SIZE_USED"
        end
      end

      @db.fetch("SELECT * FROM system_attributes WHERE name = 'DEFAULT_GROUP_QUOTAS'") do |row|
        default_group_quotas = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        vm_elem = default_group_quotas.root.at_xpath("VM_QUOTA/VM")

        if !vm_elem.nil?
          vm_elem.at_xpath("VOLATILE_SIZE").name      = "SYSTEM_DISK_SIZE"
          vm_elem.at_xpath("VOLATILE_SIZE_USED").name = "SYSTEM_DISK_SIZE_USED"
        end
      end

      if !default_user_quotas.nil?
        @db[:system_attributes].where(:name => "DEFAULT_USER_QUOTAS").update(
          :body => default_user_quotas.root.to_s)
      end

      if !default_group_quotas.nil?
        @db[:system_attributes].where(:name => "DEFAULT_GROUP_QUOTAS").update(
          :body => default_group_quotas.root.to_s)
      end

      log_time()

      return true
    end

    # Copied from fsck file, this method only recalculates the SYSTEM_DISK quotas
    def calculate_quotas(doc, where_filter, resource)

        oid = doc.root.at_xpath("ID").text.to_i

        sys_used = 0

        @db.fetch("SELECT body FROM vm_pool WHERE #{where_filter} AND state<>6") do |vm_row|
            vmdoc = Nokogiri::XML(vm_row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            vmdoc.root.xpath("TEMPLATE/DISK").each { |e|
                type = ""

                e.xpath("TYPE").each { |t_elem|
                    type = t_elem.text.upcase
                }

                size = 0

                if !e.at_xpath("SIZE").nil?
                    size = e.at_xpath("SIZE").text.to_i
                end

                if ( type == "SWAP" || type == "FS")
                    sys_used += size
                else
                    if !e.at_xpath("CLONE").nil?
                        clone = (e.at_xpath("CLONE").text.upcase == "YES")

                        target = nil

                        if clone
                            target = e.at_xpath("CLONE_TARGET").text if !e.at_xpath("CLONE_TARGET").nil?
                        else
                            target = e.at_xpath("LN_TARGET").text if !e.at_xpath("LN_TARGET").nil?
                        end

                        if !target.nil? && target != "NONE" # self or system
                            sys_used += size

                            if !e.at_xpath("DISK_SNAPSHOT_TOTAL_SIZE").nil?
                                sys_used += e.at_xpath("DISK_SNAPSHOT_TOTAL_SIZE").text.to_i
                            end
                        end
                    end
                end
            }
        end

        vm_elem = doc.root.at_xpath("VM_QUOTA/VM")

        if !vm_elem.nil?
            vm_elem.at_xpath("VOLATILE_SIZE").name      = "SYSTEM_DISK_SIZE"
            vm_elem.at_xpath("VOLATILE_SIZE_USED").name = "SYSTEM_DISK_SIZE_USED"
        else
            doc.root.xpath("VM_QUOTA").each { |e| e.remove }

            vm_quota  = doc.root.add_child(doc.create_element("VM_QUOTA"))
            vm_elem   = vm_quota.add_child(doc.create_element("VM"))

            vm_elem.add_child(doc.create_element("CPU")).content         = "-1"
            vm_elem.add_child(doc.create_element("CPU_USED")).content    = "0"

            vm_elem.add_child(doc.create_element("MEMORY")).content      = "-1"
            vm_elem.add_child(doc.create_element("MEMORY_USED")).content = "0"

            vm_elem.add_child(doc.create_element("VMS")).content         = "-1"
            vm_elem.add_child(doc.create_element("VMS_USED")).content    = "0"

            vm_elem.add_child(doc.create_element("SYSTEM_DISK_SIZE")).content       = "-1"
            vm_elem.add_child(doc.create_element("SYSTEM_DISK_SIZE_USED")).content  = "0"
        end

        vm_elem.xpath("SYSTEM_DISK_SIZE_USED").each { |e|
            if e.text != sys_used.to_s
                #puts("#{resource} #{oid} quotas: SYSTEM_DISK_SIZE_USED has #{e.text} \tis\t#{sys_used}")
                e.content = sys_used.to_s
            end
        }
    end
end