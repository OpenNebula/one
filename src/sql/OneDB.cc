/* ------------------------------------------------------------------------ */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems              */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* -------------------------------------------------------------------------*/

// -----------------------------------------------------------------------------
// This file includes the SQL schema defintion for OpenNebula objects
// -----------------------------------------------------------------------------
namespace one_db
{
    /* ---------------------------------------------------------------------- */
    /* HOST TABLES                                                            */
    /* ---------------------------------------------------------------------- */
    const char * host_table = "host_pool";

    const char * host_db_names = "oid, name, body, state, uid, gid, owner_u, "
        "group_u, other_u, cid";

    const char * host_db_bootstrap =
        "CREATE TABLE IF NOT EXISTS host_pool ("
        "   oid INTEGER PRIMARY KEY, "
        "   name VARCHAR(128),"
        "   body MEDIUMTEXT,"
        "   state INTEGER,"
        "   uid INTEGER,"
        "   gid INTEGER,"
        "   owner_u INTEGER,"
        "   group_u INTEGER,"
        "   other_u INTEGER,"
        "   cid INTEGER)";

    const char * host_monitor_table = "host_monitoring";

    const char * host_monitor_db_names = "hid, last_mon_time, body";

    const char * host_monitor_db_bootstrap =
        "CREATE TABLE IF NOT EXISTS host_monitoring ("
        "   hid INTEGER,"
        "   last_mon_time INTEGER,"
        "   body MEDIUMTEXT,"
        "   PRIMARY KEY(hid, last_mon_time))";

    /* ---------------------------------------------------------------------- */
    /* VM TABLES                                                              */
    /* ---------------------------------------------------------------------- */
    const char * vm_table = "vm_pool";

    const char * vm_db_names =
        "oid, name, body, uid, gid, state, lcm_state, "
        "owner_u, group_u, other_u, short_body, search_token";

    const char * vm_db_bootstrap = "CREATE TABLE IF NOT EXISTS "
        "vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, "
        "uid INTEGER, gid INTEGER, state INTEGER, "
        "lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
        "short_body MEDIUMTEXT, search_token MEDIUMTEXT";

    const char * vm_monitor_table = "vm_monitoring";

    const char * vm_monitor_db_names = "vmid, last_poll, body";

    const char * vm_monitor_db_bootstrap = "CREATE TABLE IF NOT EXISTS "
        "vm_monitoring (vmid INTEGER, last_poll INTEGER, body MEDIUMTEXT, "
        "PRIMARY KEY(vmid, last_poll))";


    const char * vm_showback_table = "vm_showback";

    const char * vm_showback_db_names = "vmid, year, month, body";

    const char * vm_showback_db_bootstrap =
        "CREATE TABLE IF NOT EXISTS vm_showback "
        "(vmid INTEGER, year INTEGER, month INTEGER, body MEDIUMTEXT, "
        "PRIMARY KEY(vmid, year, month))";

    const char * vm_import_table = "vm_import";

    const char * vm_import_db_names = "deploy_id, vmid";

    const char * vm_import_db_bootstrap =
        "CREATE TABLE IF NOT EXISTS vm_import "
        "(deploy_id VARCHAR(128), vmid INTEGER, PRIMARY KEY(deploy_id))";
}
