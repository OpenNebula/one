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

module Migrator
    def db_version
        "3.8.4"
    end

    def one_version
        "OpenNebula 3.8.4"
    end

    def up

        ########################################################################
        #  Bug #1813: change body column type from TEXT to MEDIUMTEXT
        ########################################################################

        # Sqlite does not support alter table modify column, but the TEXT column
        # is enough in sqlite.

        if !@sqlite_file
            @db.run "ALTER TABLE cluster_pool MODIFY COLUMN body MEDIUMTEXT;"
            @db.run "ALTER TABLE datastore_pool MODIFY COLUMN body MEDIUMTEXT;"
            @db.run "ALTER TABLE document_pool MODIFY COLUMN body MEDIUMTEXT;"
            @db.run "ALTER TABLE group_pool MODIFY COLUMN body MEDIUMTEXT;"
            @db.run "ALTER TABLE history MODIFY COLUMN body MEDIUMTEXT;"
            @db.run "ALTER TABLE host_monitoring MODIFY COLUMN body MEDIUMTEXT;"
            @db.run "ALTER TABLE host_pool MODIFY COLUMN body MEDIUMTEXT;"
            @db.run "ALTER TABLE image_pool MODIFY COLUMN body MEDIUMTEXT;"
            @db.run "ALTER TABLE leases MODIFY COLUMN body MEDIUMTEXT;"
            @db.run "ALTER TABLE network_pool MODIFY COLUMN body MEDIUMTEXT;"
            @db.run "ALTER TABLE template_pool MODIFY COLUMN body MEDIUMTEXT;"
            @db.run "ALTER TABLE user_pool MODIFY COLUMN body MEDIUMTEXT;"
            @db.run "ALTER TABLE vm_monitoring MODIFY COLUMN body MEDIUMTEXT;"
            @db.run "ALTER TABLE vm_pool MODIFY COLUMN body MEDIUMTEXT;"
        end

        return true
    end
end
