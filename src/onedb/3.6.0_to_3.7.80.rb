# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

require "rexml/document"
include REXML

module Migrator
    def db_version
        "3.7.80"
    end

    def one_version
        "OpenNebula 3.7.80"
    end

    def up
        @db.fetch("SELECT * FROM vm_pool WHERE state = 5") do |row|

            vm_doc = Document.new(row[:body])

            memory = 0
            vm_doc.root.each_element("TEMPLATE/MEMORY") { |e|
                memory = e.text.to_i
            }

            cpu = 0
            vm_doc.root.each_element("TEMPLATE/CPU") { |e|
                cpu = e.text.to_i
            }

            hid = -1
            vm_doc.root.each_element("HISTORY_RECORDS/HISTORY[last()]/HID") { |e|
                hid = e.text.to_i
            }


            host_row = nil
            @db.fetch("SELECT * FROM host_pool WHERE oid = #{hid}") do |hrow|
                host_row = hrow
            end

            host_doc = Document.new(host_row[:body])

            host_doc.root.each_element("HOST_SHARE/MEM_USAGE") { |e|
                mem_usage = e.text.to_i
                e.text = (mem_usage + (memory * 1024)).to_s
            }

            host_doc.root.each_element("HOST_SHARE/CPU_USAGE") { |e|
                cpu_usage = e.text.to_i
                e.text = (cpu_usage + (cpu * 100)).to_s
            }

            host_doc.root.each_element("HOST_SHARE/RUNNING_VMS") { |e|
                e.text = (e.text.to_i + 1).to_s
            }

            @db.run("DELETE FROM host_pool WHERE oid = #{host_row[:oid]}")

            @db[:host_pool].insert(
                :oid            => host_row[:oid],
                :name           => host_row[:name],
                :body           => host_doc.root.to_s,
                :state          => host_row[:state],
                :last_mon_time  => host_row[:last_mon_time],
                :uid            => host_row[:uid],
                :gid            => host_row[:gid],
                :owner_u        => host_row[:owner_u],
                :group_u        => host_row[:group_u],
                :other_u        => host_row[:other_u])
        end

        return true
    end
end
