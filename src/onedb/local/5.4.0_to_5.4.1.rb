# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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
require 'yaml'
require 'opennebula'

$: << File.dirname(__FILE__)

include OpenNebula

module Migrator
    def db_version
        "5.4.1"
    end

    def one_version
        "OpenNebula 5.4.1"
    end

    def up
        add_ha_indexes

        return true
    end

    def add_ha_indexes
        indexes = @db.indexes(:logdb)

        @db.alter_table(:logdb) do
            add_index :fed_index, name: :fed_index_idx if !indexes[:fed_index_idx]
            add_index :timestamp, name: :timestamp_idx if !indexes[:timestamp_idx]
        end
    end
end
