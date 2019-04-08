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

require "rubygems"

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

        group_quotas: "group_oid INTEGER PRIMARY KEY, body MEDIUMTEXT",

        document_pool: "oid INTEGER PRIMARY KEY, name VARCHAR(128), " << 
            "body MEDIUMTEXT, type INTEGER, uid INTEGER, gid INTEGER, " << 
            "owner_u INTEGER, group_u INTEGER, other_u INTEGER"
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
                "sqlcmd MEDIUMTEXT, timestamp INTEGER, fed_index INTEGER",

            history: "vid INTEGER, seq INTEGER, body MEDIUMTEXT, " <<
                     "stime INTEGER, etime INTEGER, PRIMARY KEY(vid,seq)",

            zone_pool: "oid INTEGER PRIMARY KEY, name VARCHAR(128), " <<
                       "body MEDIUMTEXT, uid INTEGER, gid INTEGER, " <<
                       "owner_u INTEGER, group_u INTEGER, other_u INTEGER, " <<
                       "UNIQUE(name)"
        },
        "5.4.0" => {},
        "5.6.0" => {},
        "5.7.80" => {
            vm_pool: "oid INTEGER PRIMARY KEY, name VARCHAR(128), " <<
                "body MEDIUMTEXT, uid INTEGER, gid INTEGER, " <<
                "last_poll INTEGER, state INTEGER, lcm_state INTEGER, " <<
                "owner_u INTEGER, group_u INTEGER, other_u INTEGER, short_body MEDIUMTEXT, " <<
                "search_token MEDIUMTEXT",

            vn_template_pool: "oid INTEGER PRIMARY KEY, name VARCHAR(128), " <<
                "body MEDIUMTEXT, uid INTEGER, gid INTEGER," <<
                "owner_u INTEGER, group_u INTEGER, other_u INTEGER",

            index_sql: ["CREATE INDEX state_oid_idx ON vm_pool (state, oid);",
                        "CREATE FULLTEXT INDEX ftidx ON vm_pool(search_token);",
                        "CREATE INDEX applied_idx ON logdb (applied);"],

            index_sqlite: ["CREATE INDEX state_oid_idx ON vm_pool (state, oid);",
                           "CREATE INDEX applied_idx ON logdb (applied);"]
        },
        "5.9.80" => {
            logdb: "log_index BIGINT UNSIGNED PRIMARY KEY, term INTEGER, sqlcmd MEDIUMTEXT, " <<
                "timestamp INTEGER, fed_index BIGINT UNSIGNED, applied BOOLEAN"
        }
    }

    LATEST_DB_VERSION = "5.9.80"

    def get_schema(type, version = nil)
        if !version
            if self.respond_to?(:db_version)
                version = db_version
                version = version[:local_version] if Hash === version
            else
                version = LATEST_DB_VERSION
            end
        end

        gver = Gem::Version.new(version.dup)

        # Discard versions greater than the one we are searching for
        versions = VERSION_SCHEMA.keys.reject do |v|
            Gem::Version.new(v.dup) > gver
        end

        # Order versions in decreasing order
        versions.sort! do |a, b|
            Gem::Version.new(b.dup) <=> Gem::Version.new(a.dup)
        end

        schema = nil

        # Find latest type definition
        versions.each do |v|
            schema = VERSION_SCHEMA[v][type]
            break if schema
        end

        schema = SCHEMA[type] if !schema

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

        @db.run "DROP TABLE IF EXISTS #{n};"

        sql = "CREATE TABLE #{n} (#{schema});"

        @db.run sql
    end

    def create_idx(type, version = nil)

        schema = get_schema(type, version)

        schema.each do |idx|
            @db.run idx
        end

    end

end

