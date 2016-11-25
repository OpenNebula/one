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

include OpenNebula

module Migrator
  ##############################################################################
  # DB schema for OpenNebula tables, each function may return the schema for
  # each opennebula version
  ##############################################################################
  def host_pool_schema
    case db_version()
    when "4.5.80"
    when "4.7.80"
    when "4.9.80"
    when "4.10.3"
    when "4.11.80"
    when "4.13.80"
    when "4.13.85"
    when "4.90.0"
    when "5.3.80"
       'CREATE TABLE host_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), '\
       'body MEDIUMTEXT, state INTEGER, last_mon_time INTEGER, uid INTEGER, '\
       'gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, '\
       'cid INTEGER);'
    end
  end
end
