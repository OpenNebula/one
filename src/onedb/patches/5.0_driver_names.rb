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

require 'nokogiri'

module OneDBPatch
    VERSION = "4.90.0"
    LOCAL_VERSION = "4.90.0"

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

        # 4667

        @db.transaction do
          @db.fetch("SELECT oid FROM vm_pool WHERE state<>6") do |row|
            @db.fetch("SELECT * FROM history WHERE vid=#{row[:oid]}") do |hrow|
                doc = Nokogiri::XML(hrow[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                # Rename VMMMAD -> VM_MAD and TMMAD -> TM_MAD
                doc.root.xpath("VMMMAD").each {|e| e.name = "VM_MAD"}
                doc.root.xpath("TMMAD").each  {|e| e.name = "TM_MAD"}

                @db[:history].where(:vid => hrow[:vid], :seq => hrow[:seq]).update(
                    :body => doc.root.to_s)
            end
          end
        end

        log_time()

        return true
    end
end