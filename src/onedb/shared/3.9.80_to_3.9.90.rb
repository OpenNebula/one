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

require "nokogiri"

class String
    def red
        colorize(31)
    end

private

    def colorize(color_code)
        "\e[#{color_code}m#{self}\e[0m"
    end
end

module Migrator
    def db_version
        "3.9.90"
    end

    def one_version
        "OpenNebula 3.9.90"
    end

    def up
        init_log_time()

        ########################################################################
        # Feature #1631: Add ACTION to history entries
        ########################################################################

        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.transaction do
            @db.fetch("SELECT * FROM old_vm_pool") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                doc.root.xpath("HISTORY_RECORDS/HISTORY").each do |e|
                    update_history(e)
                end

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

        @db.run "ALTER TABLE history RENAME TO old_history;"
        @db.run "CREATE TABLE history (vid INTEGER, seq INTEGER, body MEDIUMTEXT, stime INTEGER, etime INTEGER,PRIMARY KEY(vid,seq));"

        @db.transaction do
            @db.fetch("SELECT * FROM old_history") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                doc.root.xpath("/HISTORY").each do |e|
                    update_history(e)
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

        ########################################################################
        # Banner for drivers renamed
        ########################################################################

        puts
        puts "ATTENTION: manual intervention required".red
        puts <<-END.gsub(/^ {8}/, '')
        IM and VM MADS have been renamed in oned.conf. To keep your
        existing hosts working, you need to duplicate the drivers with the
        old names.

        For example, for kvm you will have IM_MAD "kvm" and VM_MAD "kvm", so you
        need to add IM_MAD "im_kvm" and VM_MAD "vmm_kvm"

        IM_MAD = [
              name       = "kvm",
              executable = "one_im_ssh",
              arguments  = "-r 0 -t 15 kvm" ]


        IM_MAD = [
              name       = "im_kvm",
              executable = "one_im_ssh",
              arguments  = "-r 0 -t 15 kvm" ]

        VM_MAD = [
            name       = "kvm",
            executable = "one_vmm_exec",
            arguments  = "-t 15 -r 0 kvm",
            default    = "vmm_exec/vmm_exec_kvm.conf",
            type       = "kvm" ]

        VM_MAD = [
            name       = "vmm_kvm",
            executable = "one_vmm_exec",
            arguments  = "-t 15 -r 0 kvm",
            default    = "vmm_exec/vmm_exec_kvm.conf",
            type       = "kvm" ]

        END

        return true
    end

    def update_history(history_elem)
        # NONE_ACTION
        history_elem.add_child(
            history_elem.document.create_element("ACTION")).content = "0"

        # History reason enum has changed from
        # NONE, ERROR, STOP_RESUME, USER, CANCEL   to
        # NONE, ERROR, USER
        history_elem.xpath("REASON").each do |reason_e|
            reason = reason_e.text.to_i

            if reason > 1               # STOP_RESUME, USER, CANCEL
                reason_e.content = "2"  # USER
            end
        end
    end
end
