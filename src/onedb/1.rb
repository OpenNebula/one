# -------------------------------------------------------------------------- */
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    */
# not use this file except in compliance with the License. You may obtain    */
# a copy of the License at                                                   */
#                                                                            */
# http://www.apache.org/licenses/LICENSE-2.0                                 */
#                                                                            */
# Unless required by applicable law or agreed to in writing, software        */
# distributed under the License is distributed on an "AS IS" BASIS,          */
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
# See the License for the specific language governing permissions and        */
# limitations under the License.                                             */
# -------------------------------------------------------------------------- */

class Migrator < MigratorBase

    def initialize(db, verbose)
        super(db, verbose)
        @db_version  = 1
        @one_version = "OpenNebula 2.3.0"
    end

    def up
        # Deletes all tables, and recreates an empty v. 1 DB

        @db.run "DROP TABLE vm_pool"
        @db.run "DROP TABLE history"
        @db.run "DROP TABLE host_pool"
        @db.run "DROP TABLE network_pool"
        @db.run "DROP TABLE leases"
        @db.run "DROP TABLE user_pool"
        @db.run "DROP TABLE image_pool"
        @db.run "DROP TABLE cluster_pool"

        @db.run "CREATE TABLE db_versioning (oid INTEGER PRIMARY KEY, version INTEGER, timestamp INTEGER, comment VARCHAR(256));"
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name TEXT, body TEXT, uid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER);"
        @db.run "CREATE TABLE history (vid INTEGER, seq INTEGER, body TEXT, PRIMARY KEY(vid,seq));"
        @db.run "CREATE TABLE host_pool (oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, state INTEGER, last_mon_time INTEGER, cluster VARCHAR(128), UNIQUE(name));"
        @db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, public INTEGER, UNIQUE(name,uid));"
        @db.run "CREATE TABLE leases (oid INTEGER, ip BIGINT, body TEXT, PRIMARY KEY(oid,ip));"
        @db.run "CREATE TABLE user_pool (oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, UNIQUE(name));"
        @db.run "INSERT INTO 'user_pool' VALUES(0,'oneadmin','<USER><ID>0</ID><NAME>oneadmin</NAME><PASSWORD>invalid</PASSWORD><ENABLED>1</ENABLED></USER>');"
        @db.run "CREATE TABLE image_pool (oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, uid INTEGER, public INTEGER, UNIQUE(name,uid) );"
        @db.run "CREATE TABLE cluster_pool (oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, UNIQUE(name));"
        @db.run "INSERT INTO 'cluster_pool' VALUES(0,'default','<CLUSTER><ID>0</ID><NAME>default</NAME></CLUSTER>');"
        @db.run "CREATE TABLE template_pool (oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, uid INTEGER, public INTEGER);"

        return true
    end
end
