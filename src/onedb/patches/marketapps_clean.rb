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
    VERSION_MIN = "4.90.0"
    VERSION_MAX = "5.5.0"

    def is_hot_patch(ops)
        return false
    end

    def check_db_version(ops)
        db_version = read_db_version()

        version = Gem::Version.new(db_version[:version])

        if (version  < Gem::Version.new(VERSION_MIN)) ||
           (version >= Gem::Version.new(VERSION_MAX))
        then
            raise <<-EOT
Version mismatch: patch file is for version
Shared: #{VERSION_MIN} to #{VERSION_MAX} (excluding)

Current database is version
Shared: #{db_version[:version]}
EOT
        end
    end

    def patch(ops)

        init_log_time()

        puts "This patch will clean the MarketPlace Appliances with MARKET_MAD=one"

        @db.transaction do
            @db.fetch("SELECT * FROM marketplace_pool") do |row|
                doc = nokogiri_doc(row[:body], 'marketplace_pool')

                # only marketplaces with the MAD "one"
                mad = doc.xpath("/MARKETPLACE/MARKET_MAD")
                next if mad.nil? or (mad.text != 'one')

                # clean all referenced appliances
                doc.xpath("/MARKETPLACE/MARKETPLACEAPPS/ID").each do |app|
                    oid = app.text.to_i
                    puts "Deleting appliance OID=#{oid}"
                    @db[:marketplaceapp_pool].where(:oid => oid).delete

                    # remove app. reference from XML
                    app.remove
                end

                @db[:marketplace_pool].where(:oid => row[:oid]).update(
                   :body => doc.root.to_s)
            end
        end

        log_time()

        return true
    end
end
