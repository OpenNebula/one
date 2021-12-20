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
    /* VM TABLES                                                            */
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

    // -------------------------------------------------------------------------
    // Virtual Machine ID - Deploy ID index for imported VMs
    // The index is managed by the VirtualMachinePool
    // -------------------------------------------------------------------------
    extern const char * vm_import_table;

    extern const char * vm_import_db_names;

    extern const char * vm_import_db_bootstrap;
}

#endif /*ONE_DB_H_*/
