# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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


require 'set'
require 'base64'
require 'zlib'
require 'pathname'

require 'opennebula'

$: << File.dirname(__FILE__)

include OpenNebula

module Migrator
    def db_version
        "5.3.80"
    end

    def one_version
        "OpenNebula 5.3.80"
    end

    def up
        init_log_time()

        feature_4901()

        feature_5005()

        feature_2347()

        log_time()

        return true
    end

    private

    def xpath(doc, sxpath)
        element = doc.root.at_xpath(sxpath)
        if !element.nil?
            element.text
        else
            ""
        end
    end

    ############################################################################
    # Feature 4921. Adds TOTAL_CPU and TOTAL_MEM to HOST/HOST_SHARE to compute
    # MAX_CPU and MAX_MEM when RESERVED_CPU/MEM is updated
    ############################################################################
    def feature_4901
        @db.run "ALTER TABLE host_pool RENAME TO old_host_pool;"
        create_table(:host_pool)

        @db.transaction do
            @db.fetch("SELECT * FROM old_host_pool") do |row|
                doc = Nokogiri::XML(row[:body], nil, NOKOGIRI_ENCODING) { |c|
                    c.default_xml.noblanks
                }

                rcpu = xpath(doc, "TEMPLATE/RESERVED_CPU").to_i
                rmem = xpath(doc, "TEMPLATE/RESERVED_MEM").to_i

                total_cpu = xpath(doc, "HOST_SHARE/MAX_CPU").to_i + rcpu
                total_mem = xpath(doc, "HOST_SHARE/MAX_MEM").to_i + rmem

                total_cpu_e = doc.create_element "TOTAL_CPU", total_cpu
                total_mem_e = doc.create_element "TOTAL_MEM", total_mem

                host_share = doc.root.at_xpath("HOST_SHARE")
                host_share.add_child(total_cpu_e)
                host_share.add_child(total_mem_e)

                row[:body] = doc.root.to_s

                @db[:host_pool].insert(row)
            end
        end

        @db.run "DROP TABLE old_host_pool;"
    end

    ############################################################################
    # Feature 5005.
    # Adds UID, GID and REQUEST_ID to history records
    ############################################################################
    def feature_5005
        #TODO ADD VALUES TO HISTORY POOL TABLE
        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        create_table(:vm_pool)

        @db.transaction do
            @db.fetch("SELECT * FROM old_vm_pool") do |row|

                doc = Nokogiri::XML(row[:body], nil, NOKOGIRI_ENCODING) { |c|
                  c.default_xml.noblanks
                }

                doc.root.xpath("HISTORY_RECORDS/HISTORY").each do |h|
                    reason = h.xpath("REASON")
                    reason.unlink if !reason.nil?

                    uid = doc.create_element "UID", -1
                    gid = doc.create_element "GID", -1
                    rid = doc.create_element "REQUEST_ID", -1

                    h.add_child(uid)
                    h.add_child(gid)
                    h.add_child(rid)
                end

                row[:body] = doc.root.to_s

                @db[:vm_pool].insert(row)
            end
        end

        @db.run "DROP TABLE old_vm_pool;"
    end

    def feature_2347
        create_table(:vmgroup_pool)
    end
end
