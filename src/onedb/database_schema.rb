# -------------------------------------------------------------------------- #
# Copyright 2002-2017, OpenNebula Project, OpenNebula Systems                #
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

class OneDBBacKEnd
    SCHEMA = {
        cluster_pool: "oid INTEGER PRIMARY KEY, name VARCHAR(128), " <<
            "body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, " <<
            "group_u INTEGER, other_u INTEGER, UNIQUE(name)",
        cluster_datastore_relation: "cid INTEGER, oid INTEGER, " <<
            "PRIMARY KEY(cid, oid)",
        cluster_network_relation: "cid INTEGER, oid INTEGER, " <<
            "PRIMARY KEY(cid, oid)",
        datastore_pool: "oid INTEGER PRIMARY KEY, name VARCHAR(128), " <<
            "body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, " <<
            "group_u INTEGER, other_u INTEGER",
        cluster_vnc_bitmap: "id INTEGER, map LONGTEXT, PRIMARY KEY(id)",
        host_pool: "oid INTEGER PRIMARY KEY, " <<
            "name VARCHAR(128), body MEDIUMTEXT, state INTEGER, " <<
            "last_mon_time INTEGER, uid INTEGER, gid INTEGER, " <<
            "owner_u INTEGER, group_u INTEGER, other_u INTEGER, " <<
            "cid INTEGER",
        image_pool: "oid INTEGER PRIMARY KEY, name VARCHAR(128), " <<
            "body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, " <<
            "group_u INTEGER, other_u INTEGER, UNIQUE(name,uid)",
        network_pool: "oid INTEGER PRIMARY KEY, name VARCHAR(128), " <<
            "body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, " <<
            "group_u INTEGER, other_u INTEGER, pid INTEGER, UNIQUE(name,uid)",
        user_quotas: "user_oid INTEGER PRIMARY KEY, body MEDIUMTEXT",
        group_quotas: "group_oid INTEGER PRIMARY KEY, body MEDIUMTEXT"
    }

    VERSION_SCHEMA = {
        "5.3.80" => {
            vmgroup_pool: "oid INTEGER PRIMARY KEY, name VARCHAR(128), " <<
                "body MEDIUMTEXT, uid INTEGER, gid INTEGER, " <<
                "owner_u INTEGER, group_u INTEGER, other_u INTEGER, " <<
                "UNIQUE(name,uid)",
            host_pool: "oid INTEGER PRIMARY KEY, name VARCHAR(128), " <<
                "body MEDIUMTEXT, state INTEGER, last_mon_time INTEGER, " <<
                "uid INTEGER, gid INTEGER, owner_u INTEGER, " <<
                "group_u INTEGER, other_u INTEGER, cid INTEGER",
            vm_pool: "oid INTEGER PRIMARY KEY, name VARCHAR(128), " <<
                "body MEDIUMTEXT, uid INTEGER, gid INTEGER, " <<
                "last_poll INTEGER, state INTEGER, lcm_state INTEGER, " <<
                "owner_u INTEGER, group_u INTEGER, other_u INTEGER",
            logdb: "log_index INTEGER PRIMARY KEY, term INTEGER, " <<
                "sqlcmd MEDIUMTEXT, timestamp INTEGER",
            history: "vid INTEGER, seq INTEGER, body MEDIUMTEXT, " <<
                     "stime INTEGER, etime INTEGER, PRIMARY KEY(vid,seq)",
            zone_pool: "oid INTEGER PRIMARY KEY, name VARCHAR(128), " <<
                       "body MEDIUMTEXT, uid INTEGER, gid INTEGER, " <<
                       "owner_u INTEGER, group_u INTEGER, other_u INTEGER, " <<
                       "UNIQUE(name)"
        }
    }

    LATEST_DB_VERSION = "5.3.80"

    def get_schema(type, version = nil)
        if !version
            if self.respond_to?(:db_version)
                version = db_version
            else
                version = LATEST_DB_VERSION
            end
        end

        version_schema = VERSION_SCHEMA[version] || {}
        schema = SCHEMA.merge(version_schema)[type]

        if !schema
            STDERR.puts "Schema not found (#{type}) for version #{version}"
            exit(-1)
        end

        schema
    end

    def create_table(type, name = nil, version = nil)
        if name
            n = name.to_s
        else
            n = type.to_s
        end

        schema = get_schema(type, version)

        sql = "CREATE TABLE #{n} (#{schema});"

        @db.run sql
    end
end

