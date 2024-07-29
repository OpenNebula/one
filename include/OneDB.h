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

#ifndef ONE_DB_H_
#define ONE_DB_H_

// -----------------------------------------------------------------------------
// This file includes the SQL schema defintion for OpenNebula objects
// -----------------------------------------------------------------------------
namespace one_db
{
    /* ---------------------------------------------------------------------- */
    /* HOST TABLES                                                            */
    /* ---------------------------------------------------------------------- */
    extern const char * host_table;

    extern const char * host_db_names;

    extern const char * host_db_bootstrap;

    extern const char * host_monitor_table;

    extern const char * host_monitor_db_names;

    extern const char * host_monitor_db_bootstrap;

    /* ---------------------------------------------------------------------- */
    /* VM TABLES                                                              */
    /* ---------------------------------------------------------------------- */
    extern const char * vm_table;

    extern const char * vm_db_names;

    extern const char * vm_db_bootstrap;

    extern const char * vm_monitor_table;

    extern const char * vm_monitor_db_names;

    extern const char * vm_monitor_db_bootstrap;

    extern const char * vm_showback_table;

    extern const char * vm_showback_db_names;

    extern const char * vm_showback_db_bootstrap;

    extern const char * vm_group_db_names;

    extern const char * vm_group_db_bootstrap;

    extern const char * vm_group_table;

    extern const char * vm_template_db_names;

    extern const char * vm_template_db_bootstrap;

    extern const char * vm_template_table;

    // -------------------------------------------------------------------------
    // Virtual Machine ID - Deploy ID index for imported VMs
    // The index is managed by the VirtualMachinePool
    // -------------------------------------------------------------------------
    extern const char * vm_import_table;

    extern const char * vm_import_db_names;

    extern const char * vm_import_db_bootstrap;

    /* ---------------------------------------------------------------------- */
    /* Cluster tables                                                         */
    /* ---------------------------------------------------------------------- */
    extern const char * cluster_db_names;
    extern const char * cluster_db_bootstrap;
    extern const char * cluster_table;

    extern const char * cluster_datastore_table;
    extern const char * cluster_datastore_db_names;
    extern const char * cluster_datastore_db_bootstrap;

    extern const char * cluster_network_table;
    extern const char * cluster_network_db_names;
    extern const char * cluster_network_db_bootstrap;

    extern const char * cluster_bitmap_table;

    /* ---------------------------------------------------------------------- */
    /* ACL tables                                                             */
    /* ---------------------------------------------------------------------- */
    extern const char * acl_table;

    extern const char * acl_db_names;

    extern const char * acl_db_bootstrap;

    /* ---------------------------------------------------------------------- */
    /* Datastore tables                                                       */
    /* ---------------------------------------------------------------------- */
    extern const char * ds_db_names;

    extern const char * ds_db_bootstrap;

    extern const char * ds_table;

    /* ---------------------------------------------------------------------- */
    /* Document tables                                                        */
    /* ---------------------------------------------------------------------- */
    extern const char * doc_db_names;

    extern const char * doc_db_bootstrap;

    extern const char * doc_table;

    /* ---------------------------------------------------------------------- */
    /* Group tables                                                           */
    /* ---------------------------------------------------------------------- */
    extern const char * group_db_names;

    extern const char * group_db_bootstrap;

    extern const char * group_table;

    /* ---------------------------------------------------------------------- */
    /* History tables                                                         */
    /* ---------------------------------------------------------------------- */
    extern const char * history_table;

    extern const char * history_db_names;

    extern const char * history_db_bootstrap;

    /* ---------------------------------------------------------------------- */
    /* Hook tables                                                            */
    /* ---------------------------------------------------------------------- */
    extern const char * hook_db_names;

    extern const char * hook_db_bootstrap;

    extern const char * hook_table;

    extern const char * hook_log_table;

    extern const char * hook_log_db_names;

    extern const char * hook_log_db_bootstrap;

    /* ---------------------------------------------------------------------- */
    /* Image tables                                                           */
    /* ---------------------------------------------------------------------- */
    extern const char * image_db_names;

    extern const char * image_db_bootstrap;

    extern const char * image_table;

    /* ---------------------------------------------------------------------- */
    /* Log tables                                                             */
    /* ---------------------------------------------------------------------- */
    extern const char * log_table;

    extern const char * log_db_names;

    extern const char * log_db_bootstrap;

    /* ---------------------------------------------------------------------- */
    /* Marketplace tables                                                     */
    /* ---------------------------------------------------------------------- */
    extern const char * mp_db_names;

    extern const char * mp_db_bootstrap;

    extern const char * mp_table;

    extern const char * mp_app_db_names;

    extern const char * mp_app_db_bootstrap;

    extern const char * mp_app_table;

    /* ---------------------------------------------------------------------- */
    /* Quotas tables                                                          */
    /* ---------------------------------------------------------------------- */
    extern const char * group_quotas_db_names;
    extern const char * group_quotas_db_bootstrap;
    extern const char * group_quotas_db_table;
    extern const char * group_quotas_db_oid_column;

    extern const char * user_quotas_db_names;
    extern const char * user_quotas_db_bootstrap;
    extern const char * user_quotas_db_table;
    extern const char * user_quotas_db_oid_column;

    /* ---------------------------------------------------------------------- */
    /* Security Group tables                                                  */
    /* ---------------------------------------------------------------------- */
    extern const char * sg_db_names;

    extern const char * sg_db_bootstrap;

    extern const char * sg_table;

    /* ---------------------------------------------------------------------- */
    /* User tables                                                            */
    /* ---------------------------------------------------------------------- */
    extern const char * user_db_names;

    extern const char * user_db_bootstrap;

    extern const char * user_table;

    /* ---------------------------------------------------------------------- */
    /* VDC tables                                                             */
    /* ---------------------------------------------------------------------- */
    extern const char * vdc_db_names;

    extern const char * vdc_db_bootstrap;

    extern const char * vdc_table;

    /* ---------------------------------------------------------------------- */
    /* Virtual Network tables                                                 */
    /* ---------------------------------------------------------------------- */
    extern const char * vn_table;

    extern const char * vn_db_names;

    extern const char * vn_db_bootstrap;

    extern const char * vn_template_db_names;

    extern const char * vn_template_db_bootstrap;

    extern const char * vn_template_table;

    /* ---------------------------------------------------------------------- */
    /* Virtual Router tables                                                  */
    /* ---------------------------------------------------------------------- */
    extern const char * vr_db_names;

    extern const char * vr_db_bootstrap;

    extern const char * vr_table;

    /* ---------------------------------------------------------------------- */
    /* Zone tables                                                            */
    /* ---------------------------------------------------------------------- */
    extern const char * zone_db_names;

    extern const char * zone_db_bootstrap;

    extern const char * zone_table;

    /* ---------------------------------------------------------------------- */
    /* Backup Job tables                                                      */
    /* ---------------------------------------------------------------------- */
    extern const char * backup_job_table;

    extern const char * backup_job_db_names;

    extern const char * backup_job_db_bootstrap;

    /* ---------------------------------------------------------------------- */
    /* Scheduled Action tables                                                */
    /* ---------------------------------------------------------------------- */
    extern const char * scheduled_action_table;

    extern const char * scheduled_action_db_names;

    extern const char * scheduled_action_db_bootstrap;
}


#endif /*ONE_DB_H_*/
