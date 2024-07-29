/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
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
            "owner_u, group_u, other_u, short_body, body_json";

    const char * vm_db_bootstrap = "CREATE TABLE IF NOT EXISTS "
                                   "vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, "
                                   "uid INTEGER, gid INTEGER, state INTEGER, "
                                   "lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
                                   "short_body MEDIUMTEXT, body_json JSON)";

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


    const char * vm_group_table = "vmgroup_pool";

    const char * vm_group_db_names = "oid, name, body, uid, gid, owner_u, group_u, "
                                     "other_u";

    const char * vm_group_db_bootstrap = "CREATE TABLE IF NOT EXISTS vmgroup_pool "
                                         "(oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, "
                                         "uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, "
                                         "other_u INTEGER, UNIQUE(name,uid))";

    const char * vm_template_table = "template_pool";

    const char * vm_template_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u";

    const char * vm_template_db_bootstrap =
            "CREATE TABLE IF NOT EXISTS template_pool (oid INTEGER PRIMARY KEY, "
            "name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, "
            "owner_u INTEGER, group_u INTEGER, other_u INTEGER)";

    /* ---------------------------------------------------------------------- */
    /* Cluster tables                                                         */
    /* ---------------------------------------------------------------------- */
    const char * cluster_table = "cluster_pool";

    const char * cluster_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u";

    const char * cluster_db_bootstrap = "CREATE TABLE IF NOT EXISTS cluster_pool ("
                                        "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
                                        "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
                                        "UNIQUE(name))";

    const char * cluster_datastore_table = "cluster_datastore_relation";
    const char * cluster_datastore_db_names = "cid, oid";
    const char * cluster_datastore_db_bootstrap =
            "CREATE TABLE IF NOT EXISTS cluster_datastore_relation ("
            "cid INTEGER, oid INTEGER, PRIMARY KEY(cid, oid))";

    const char * cluster_network_table = "cluster_network_relation";
    const char * cluster_network_db_names = "cid, oid";
    const char * cluster_network_db_bootstrap =
            "CREATE TABLE IF NOT EXISTS cluster_network_relation ("
            "cid INTEGER, oid INTEGER, PRIMARY KEY(cid, oid))";

    const char * cluster_bitmap_table = "cluster_vnc_bitmap";

    /* ---------------------------------------------------------------------- */
    /* ACL tables                                                             */
    /* ---------------------------------------------------------------------- */
    const char * acl_table = "acl";

    const char * acl_db_names = "oid, userset, resource, rights, zone";

    const char * acl_db_bootstrap = "CREATE TABLE IF NOT EXISTS "
                                    "acl (oid INT PRIMARY KEY, userset BIGINT, resource BIGINT, "
                                    "rights BIGINT, zone BIGINT, UNIQUE(userset, resource, rights, zone))";

    /* ---------------------------------------------------------------------- */
    /* Datastore tables                                                       */
    /* ---------------------------------------------------------------------- */
    const char * ds_table = "datastore_pool";

    const char * ds_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u";

    const char * ds_db_bootstrap =
            "CREATE TABLE IF NOT EXISTS datastore_pool ("
            "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
            "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER)";

    /* ---------------------------------------------------------------------- */
    /* Document tables                                                        */
    /* ---------------------------------------------------------------------- */
    const char * doc_table = "document_pool";

    const char * doc_db_names =
            "oid, name, body, type, uid, gid, owner_u, group_u, other_u";

    const char * doc_db_bootstrap =
            "CREATE TABLE IF NOT EXISTS document_pool (oid INTEGER PRIMARY KEY, "
            "name VARCHAR(128), body MEDIUMTEXT, type INTEGER, uid INTEGER, gid INTEGER, "
            "owner_u INTEGER, group_u INTEGER, other_u INTEGER)";

    /* ---------------------------------------------------------------------- */
    /* Group tables                                                           */
    /* ---------------------------------------------------------------------- */
    const char * group_table = "group_pool";

    const char * group_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u";

    const char * group_db_bootstrap = "CREATE TABLE IF NOT EXISTS group_pool ("
                                      "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
                                      "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
                                      "UNIQUE(name))";

    /* ---------------------------------------------------------------------- */
    /* History tables                                                         */
    /* ---------------------------------------------------------------------- */
    const char * history_table = "history";

    const char * history_db_names = "vid, seq, body, stime, etime";

    const char * history_db_bootstrap = "CREATE TABLE IF NOT EXISTS "
                                        "history (vid INTEGER, seq INTEGER, body MEDIUMTEXT, "
                                        "stime INTEGER, etime INTEGER,PRIMARY KEY(vid,seq))";

    /* ---------------------------------------------------------------------- */
    /* Hook tables                                                            */
    /* ---------------------------------------------------------------------- */
    const char * hook_table = "hook_pool";

    const char * hook_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u, type";

    const char * hook_db_bootstrap = "CREATE TABLE IF NOT EXISTS hook_pool ("
                                     "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER,"
                                     "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, type INTEGER)";

    const char * hook_log_table = "hook_log";

    const char * hook_log_db_names = "hkid, exeid, timestamp, rc, body";

    const char * hook_log_db_bootstrap = "CREATE TABLE IF NOT EXISTS hook_log"
                                         " (hkid INTEGER, exeid INTEGER, timestamp INTEGER, rc INTEGER,"
                                         " body MEDIUMTEXT,PRIMARY KEY(hkid, exeid))";

    /* ---------------------------------------------------------------------- */
    /* Image tables                                                           */
    /* ---------------------------------------------------------------------- */
    const char * image_table = "image_pool";

    const char * image_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u";

    const char * image_db_bootstrap = "CREATE TABLE IF NOT EXISTS image_pool ("
                                      "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
                                      "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
                                      "UNIQUE(name,uid) )";

    /* ---------------------------------------------------------------------- */
    /* Log tables                                                             */
    /* ---------------------------------------------------------------------- */
    const char * log_table = "logdb";

    const char * log_db_names = "log_index, term, sqlcmd, timestamp, fed_index, applied";

    const char * log_db_bootstrap = "CREATE TABLE IF NOT EXISTS "
                                    "logdb (log_index BIGINT UNSIGNED PRIMARY KEY, term INTEGER, sqlcmd MEDIUMTEXT, "
                                    "timestamp INTEGER, fed_index BIGINT UNSIGNED, applied BOOLEAN)";

    /* ---------------------------------------------------------------------- */
    /* Marketplace tables                                                     */
    /* ---------------------------------------------------------------------- */
    const char * mp_table = "marketplace_pool";

    const char * mp_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u";

    const char * mp_db_bootstrap =
            "CREATE TABLE IF NOT EXISTS marketplace_pool (oid INTEGER PRIMARY KEY, "
            "name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, "
            "owner_u INTEGER, group_u INTEGER, other_u INTEGER)";

    const char * mp_app_table = "marketplaceapp_pool";

    const char * mp_app_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u";

    const char * mp_app_db_bootstrap =
            "CREATE TABLE IF NOT EXISTS marketplaceapp_pool (oid INTEGER PRIMARY KEY, "
            "name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, "
            "owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid))";

    /* ---------------------------------------------------------------------- */
    /* Quotas tables                                                          */
    /* ---------------------------------------------------------------------- */
    const char * group_quotas_db_table = "group_quotas";
    const char * group_quotas_db_names = "group_oid, body";
    const char * group_quotas_db_oid_column = "group_oid";
    const char * group_quotas_db_bootstrap =
            "CREATE TABLE IF NOT EXISTS group_quotas ("
            "group_oid INTEGER PRIMARY KEY, body MEDIUMTEXT)";

    const char * user_quotas_db_table = "user_quotas";
    const char * user_quotas_db_names = "user_oid, body";
    const char * user_quotas_db_oid_column = "user_oid";
    const char * user_quotas_db_bootstrap =
            "CREATE TABLE IF NOT EXISTS user_quotas ("
            "user_oid INTEGER PRIMARY KEY, body MEDIUMTEXT)";

    /* ---------------------------------------------------------------------- */
    /* Security Group tables                                                  */
    /* ---------------------------------------------------------------------- */
    const char * sg_table = "secgroup_pool";

    const char * sg_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u";

    const char * sg_db_bootstrap = "CREATE TABLE IF NOT EXISTS secgroup_pool ("
                                   "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
                                   "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
                                   "UNIQUE(name,uid))";

    /* ---------------------------------------------------------------------- */
    /* User tables                                                            */
    /* ---------------------------------------------------------------------- */
    const char * user_table = "user_pool";

    const char * user_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u";

    const char * user_db_bootstrap = "CREATE TABLE IF NOT EXISTS user_pool ("
                                     "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
                                     "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
                                     "UNIQUE(name))";

    /* ---------------------------------------------------------------------- */
    /* VDC tables                                                             */
    /* ---------------------------------------------------------------------- */
    const char * vdc_table = "vdc_pool";

    const char * vdc_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u";

    const char * vdc_db_bootstrap = "CREATE TABLE IF NOT EXISTS vdc_pool ("
                                    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
                                    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
                                    "UNIQUE(name))";

    /* ---------------------------------------------------------------------- */
    /* Virtual Network tables                                                 */
    /* ---------------------------------------------------------------------- */
    const char * vn_table    = "network_pool";

    const char * vn_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u, pid";

    const char * vn_db_bootstrap = "CREATE TABLE IF NOT EXISTS"
                                   " network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128),"
                                   " body MEDIUMTEXT, uid INTEGER, gid INTEGER,"
                                   " owner_u INTEGER, group_u INTEGER, other_u INTEGER,"
                                   " pid INTEGER, UNIQUE(name,uid))";

    const char * vn_template_table = "vn_template_pool";

    const char * vn_template_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u";

    const char * vn_template_db_bootstrap =
            "CREATE TABLE IF NOT EXISTS vn_template_pool (oid INTEGER PRIMARY KEY, "
            "name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, "
            "owner_u INTEGER, group_u INTEGER, other_u INTEGER)";

    /* ---------------------------------------------------------------------- */
    /* Virtual Router tables                                                  */
    /* ---------------------------------------------------------------------- */
    const char * vr_table = "vrouter_pool";

    const char * vr_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u";

    const char * vr_db_bootstrap =
            "CREATE TABLE IF NOT EXISTS vrouter_pool (oid INTEGER PRIMARY KEY, "
            "name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, "
            "owner_u INTEGER, group_u INTEGER, other_u INTEGER)";

    /* ---------------------------------------------------------------------- */
    /* Zone tables                                                            */
    /* ---------------------------------------------------------------------- */
    const char * zone_table = "zone_pool";

    const char * zone_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u";

    const char * zone_db_bootstrap = "CREATE TABLE IF NOT EXISTS zone_pool ("
                                     "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
                                     "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
                                     "UNIQUE(name))";

    /* ---------------------------------------------------------------------- */
    /* Backup Job tables                                                      */
    /* ---------------------------------------------------------------------- */
    const char * backup_job_table = "backupjob_pool";

    const char * backup_job_db_names =
            "oid, name, body, uid, gid, owner_u, group_u, other_u, priority, outdated_vms";

    const char * backup_job_db_bootstrap =
            "CREATE TABLE IF NOT EXISTS backupjob_pool ("
            "   oid INTEGER PRIMARY KEY,"
            "   name VARCHAR(128),"
            "   body MEDIUMTEXT,"
            "   uid INTEGER,"
            "   gid INTEGER,"
            "   owner_u INTEGER,"
            "   group_u INTEGER,"
            "   other_u INTEGER,"
            "   priority INTEGER,"
            "   outdated_vms INTEGER)";

    /* ---------------------------------------------------------------------- */
    /* Scheduled Action tables                                                */
    /* ---------------------------------------------------------------------- */
    const char * scheduled_action_table = "schedaction_pool";

    const char * scheduled_action_db_names =
            "oid, parent_id, type, body, time, done";

    const char * scheduled_action_db_bootstrap =
            "CREATE TABLE IF NOT EXISTS schedaction_pool ("
            "   oid INTEGER PRIMARY KEY,"
            "   parent_id INTEGER,"
            "   type VARCHAR(128),"
            "   body MEDIUMTEXT,"
            "   time INTEGER,"
            "   done INTEGER)";
}
