# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

if !ONE_LOCATION
    LOG_LOCATION = "/var/log/one"
else
    LOG_LOCATION = ONE_LOCATION + "/var"
end

LOG = LOG_LOCATION + "/onedb-fsck.log"

require 'nokogiri'

module OneDBPatch
    VERSION = "5.6.0"
    LOCAL_VERSION = "5.6.0"

    def is_hot_patch(ops)
        return false
    end

    def check_db_version(ops)
        db_version = read_db_version()

        if ( db_version[:version] != VERSION ||
             db_version[:local_version] != LOCAL_VERSION )

            raise <<-EOT
Version mismatch: patch file is for version
Shared: #{VERSION}, Local: #{LOCAL_VERSION}

Current database is version
Shared: #{db_version[:version]}, Local: #{db_version[:local_version]}
EOT
        end
    end

    def patch(ops)
        init_log_time()

        puts "This patch updates images and VMs with missing NEXT_SNAPSHOT parameter."
        puts

        # BUG #2687: Disk snapshots dissapearing
        # https://github.com/OpenNebula/one/issues/2687

        @db.transaction do
            @db.fetch("SELECT * FROM image_pool") do |row|
                doc = nokogiri_doc(row[:body], 'image_pool')

                next_snapshot = doc.at_xpath("//SNAPSHOTS/NEXT_SNAPSHOT")

                next if next_snapshot

                max = doc.xpath("//SNAPSHOTS/SNAPSHOT/ID").max

                if max
                    next_snapshot = max.text.to_i + 1
                else
                    next_snapshot = 0
                end

                sxml = doc.xpath("//SNAPSHOTS")

                if sxml
                    ns = doc.create_element("NEXT_SNAPSHOT")
                    ns.content = next_snapshot
                    sxml = sxml.first.add_child(ns)

                    puts "Image #{row[:oid]} updated with NEXT_SNAPSHOT #{next_snapshot}"

                    @db[:image_pool].where(:oid => row[:oid]).update(
                        :body => doc.root.to_s)
                end
            end

            log_time()

            @db.fetch("SELECT * FROM vm_pool") do |row|
                doc = nokogiri_doc(row[:body], 'vm_pool')

                # evaluate each disk snapshot individually
                doc.xpath("//SNAPSHOTS").each do |disk|
                    next_snapshot = disk.at_xpath("NEXT_SNAPSHOT")

                    next if next_snapshot

                    max = disk.xpath("SNAPSHOT/ID").max

                    if max
                        next_snapshot = max.text.to_i + 1
                    else
                        next_snapshot = 0
                    end

                    puts "VM #{row[:oid]}, DISK #{disk.at_xpath('DISK_ID').text} updated with NEXT_SNAPSHOT #{next_snapshot}"

                    ns = doc.create_element("NEXT_SNAPSHOT")
                    ns.content = next_snapshot
                    disk.add_child(ns)
                end

                @db[:vm_pool].where(:oid => row[:oid]).update(
                    :body => doc.root.to_s)
            end

            log_time()
        end

        log_time()

        return true
    end
end
