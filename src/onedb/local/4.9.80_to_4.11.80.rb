# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

module Migrator
    def db_version
        "4.11.80"
    end

    def one_version
        "OpenNebula 4.11.80"
    end

    def up

        init_log_time()

        ########################################################################
        # Showback
        ########################################################################

        @db.run "CREATE TABLE vm_showback (vmid INTEGER, year INTEGER, month INTEGER, body MEDIUMTEXT, PRIMARY KEY(vmid, year, month));"

        log_time()

        return true
    end
end