/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */
#include <limits.h>
#include <string.h>
#include <time.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <regex.h>
#include <unistd.h>

#include <iostream>
#include <sstream>
#include <queue>

#include "VirtualMachine.h"
#include "VirtualNetworkPool.h"
#include "ImagePool.h"
#include "NebulaLog.h"
#include "NebulaUtil.h"
#include "Snapshots.h"

#include "Nebula.h"

#include "vm_file_var_syntax.h"
#include "vm_var_syntax.h"

/* ************************************************************************** */
/* Virtual Machine :: Constructor/Destructor                                  */
/* ************************************************************************** */

VirtualMachine::VirtualMachine(int           id,
                               int           _uid,
                               int           _gid,
                               const string& _uname,
                               const string& _gname,
                               int           umask,
                               VirtualMachineTemplate * _vm_template):
        PoolObjectSQL(id,VM,"",_uid,_gid,_uname,_gname,table),
        last_poll(0),
        state(INIT),
        prev_state(INIT),
        lcm_state(LCM_INIT),
        prev_lcm_state(LCM_INIT),
        resched(0),
        stime(time(0)),
        etime(0),
        deploy_id(""),
        history(0),
        previous_history(0),
        disks(false),
        nics(false),
        _log(0)
{
    if (_vm_template != 0)
    {
        // This is a VM Template, with the root TEMPLATE.
        _vm_template->set_xml_root("USER_TEMPLATE");

        user_obj_template = _vm_template;
    }
    else
    {
        user_obj_template = new VirtualMachineTemplate(false,'=',"USER_TEMPLATE");
    }

    obj_template = new VirtualMachineTemplate;

    set_umask(umask);
}

VirtualMachine::~VirtualMachine()
{
    for (unsigned int i=0 ; i < history_records.size() ; i++)
    {
        delete history_records[i];
    }

    delete _log;
    delete user_obj_template;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::vm_state_from_str(string& st, VmState& state)
{
    one_util::toupper(st);

    if ( st == "INIT" ) {
        state = INIT;
    } else if ( st == "PENDING" ) {
		state = PENDING;
    } else if ( st == "HOLD" ) {
		state = HOLD;
    } else if ( st == "ACTIVE" ) {
		state = ACTIVE;
    } else if ( st == "STOPPED" ) {
		state = STOPPED;
    } else if ( st == "SUSPENDED" ) {
		state = SUSPENDED;
    } else if ( st == "DONE" ) {
		state = DONE;
    } else if ( st == "POWEROFF" ) {
		state = POWEROFF;
    } else if ( st == "UNDEPLOYED" ) {
		state = UNDEPLOYED;
    } else if ( st == "CLONING" ) {
		state = CLONING;
    } else if ( st == "CLONING_FAILURE" ) {
		state = CLONING_FAILURE;
    } else {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

string& VirtualMachine::vm_state_to_str(string& st, VmState state)
{
    switch (state)
    {
        case INIT:
			st = "INIT"; break;
        case PENDING:
			st = "PENDING"; break;
        case HOLD:
			st = "HOLD"; break;
        case ACTIVE:
			st = "ACTIVE"; break;
        case STOPPED:
			st = "STOPPED"; break;
        case SUSPENDED:
			st = "SUSPENDED"; break;
        case DONE:
			st = "DONE"; break;
        case POWEROFF:
			st = "POWEROFF"; break;
        case UNDEPLOYED:
			st = "UNDEPLOYED"; break;
        case CLONING:
			st = "CLONING"; break;
        case CLONING_FAILURE:
			st = "CLONING_FAILURE"; break;
    }

    return st;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::lcm_state_from_str(string& st, LcmState& state)
{
    one_util::toupper(st);

    if ( st == "LCM_INIT" ){
        state = LCM_INIT;
    } else if ( st == "PROLOG") {
        state = PROLOG;
    } else if ( st == "BOOT") {
        state = BOOT;
    } else if ( st == "RUNNING") {
        state = RUNNING;
    } else if ( st == "MIGRATE") {
        state = MIGRATE;
    } else if ( st == "SAVE_STOP") {
		state = SAVE_STOP;
    } else if ( st == "SAVE_SUSPEND") {
		state = SAVE_SUSPEND;
    } else if ( st == "SAVE_MIGRATE") {
		state = SAVE_MIGRATE;
    } else if ( st == "PROLOG_MIGRATE") {
		state = PROLOG_MIGRATE;
    } else if ( st == "PROLOG_RESUME") {
		state = PROLOG_RESUME;
    } else if ( st == "EPILOG_STOP") {
		state = EPILOG_STOP;
    } else if ( st == "EPILOG") {
		state = EPILOG;
    } else if ( st == "SHUTDOWN") {
		state = SHUTDOWN;
    } else if ( st == "CLEANUP_RESUBMIT") {
		state = CLEANUP_RESUBMIT;
    } else if ( st == "UNKNOWN") {
		state = UNKNOWN;
    } else if ( st == "HOTPLUG") {
		state = HOTPLUG;
    } else if ( st == "SHUTDOWN_POWEROFF") {
		state = SHUTDOWN_POWEROFF;
    } else if ( st == "BOOT_UNKNOWN") {
		state = BOOT_UNKNOWN;
    } else if ( st == "BOOT_POWEROFF") {
		state = BOOT_POWEROFF;
    } else if ( st == "BOOT_SUSPENDED") {
		state = BOOT_SUSPENDED;
    } else if ( st == "BOOT_STOPPED") {
		state = BOOT_STOPPED;
    } else if ( st == "CLEANUP_DELETE") {
		state = CLEANUP_DELETE;
    } else if ( st == "HOTPLUG_SNAPSHOT") {
		state = HOTPLUG_SNAPSHOT;
    } else if ( st == "HOTPLUG_NIC") {
		state = HOTPLUG_NIC;
    } else if ( st == "HOTPLUG_SAVEAS") {
		state = HOTPLUG_SAVEAS;
    } else if ( st == "HOTPLUG_SAVEAS_POWEROFF") {
		state = HOTPLUG_SAVEAS_POWEROFF;
    } else if ( st == "HOTPLUG_SAVEAS_SUSPENDED") {
		state = HOTPLUG_SAVEAS_SUSPENDED;
    } else if ( st == "SHUTDOWN_UNDEPLOY") {
		state = SHUTDOWN_UNDEPLOY;
    } else if ( st == "EPILOG_UNDEPLOY") {
		state = EPILOG_UNDEPLOY;
    } else if ( st == "PROLOG_UNDEPLOY") {
		state = PROLOG_UNDEPLOY;
    } else if ( st == "BOOT_UNDEPLOY") {
		state = BOOT_UNDEPLOY;
    } else if ( st == "HOTPLUG_PROLOG_POWEROFF") {
		state = HOTPLUG_PROLOG_POWEROFF;
    } else if ( st == "HOTPLUG_EPILOG_POWEROFF") {
		state = HOTPLUG_EPILOG_POWEROFF;
    } else if ( st == "BOOT_MIGRATE") {
		state = BOOT_MIGRATE;
    } else if ( st == "BOOT_FAILURE") {
		state = BOOT_FAILURE;
    } else if ( st == "BOOT_MIGRATE_FAILURE") {
		state = BOOT_MIGRATE_FAILURE;
    } else if ( st == "PROLOG_MIGRATE_FAILURE") {
		state = PROLOG_MIGRATE_FAILURE;
    } else if ( st == "PROLOG_FAILURE") {
		state = PROLOG_FAILURE;
    } else if ( st == "EPILOG_FAILURE") {
		state = EPILOG_FAILURE;
    } else if ( st == "EPILOG_STOP_FAILURE") {
		state = EPILOG_STOP_FAILURE;
    } else if ( st == "EPILOG_UNDEPLOY_FAILURE") {
		state = EPILOG_UNDEPLOY_FAILURE;
    } else if ( st == "PROLOG_MIGRATE_POWEROFF") {
		state = PROLOG_MIGRATE_POWEROFF;
    } else if ( st == "PROLOG_MIGRATE_POWEROFF_FAILURE") {
		state = PROLOG_MIGRATE_POWEROFF_FAILURE;
    } else if ( st == "PROLOG_MIGRATE_SUSPEND") {
		state = PROLOG_MIGRATE_SUSPEND;
    } else if ( st == "PROLOG_MIGRATE_SUSPEND_FAILURE") {
		state = PROLOG_MIGRATE_SUSPEND_FAILURE;
    } else if ( st == "BOOT_STOPPED_FAILURE") {
		state = BOOT_STOPPED_FAILURE;
    } else if ( st == "BOOT_UNDEPLOY_FAILURE") {
		state = BOOT_UNDEPLOY_FAILURE;
    } else if ( st == "PROLOG_RESUME_FAILURE") {
		state = PROLOG_RESUME_FAILURE;
    } else if ( st == "PROLOG_UNDEPLOY_FAILURE") {
		state = PROLOG_UNDEPLOY_FAILURE;
    } else if ( st == "DISK_SNAPSHOT_POWEROFF") {
		state = DISK_SNAPSHOT_POWEROFF;
    } else if ( st == "DISK_SNAPSHOT_REVERT_POWEROFF") {
		state = DISK_SNAPSHOT_REVERT_POWEROFF;
    } else if ( st == "DISK_SNAPSHOT_DELETE_POWEROFF") {
		state = DISK_SNAPSHOT_DELETE_POWEROFF;
    } else if ( st == "DISK_SNAPSHOT_SUSPENDED") {
		state = DISK_SNAPSHOT_SUSPENDED;
    } else if ( st == "DISK_SNAPSHOT_REVERT_SUSPENDED") {
		state = DISK_SNAPSHOT_REVERT_SUSPENDED;
    } else if ( st == "DISK_SNAPSHOT_DELETE_SUSPENDED") {
		state = DISK_SNAPSHOT_DELETE_SUSPENDED;
    } else if ( st == "DISK_SNAPSHOT") {
		state = DISK_SNAPSHOT;
    } else if ( st == "DISK_SNAPSHOT_DELETE") {
		state = DISK_SNAPSHOT_DELETE;
    } else if ( st == "PROLOG_MIGRATE_UNKNOWN") {
		state = PROLOG_MIGRATE_UNKNOWN;
    } else if ( st == "PROLOG_MIGRATE_UNKNOWN_FAILURE") {
		state = PROLOG_MIGRATE_UNKNOWN_FAILURE;
    } else if ( st == "DISK_RESIZE") {
		state = DISK_RESIZE;
    } else if ( st == "DISK_RESIZE_POWEROFF") {
		state = DISK_RESIZE_POWEROFF;
    } else if ( st == "DISK_RESIZE_UNDEPLOYED") {
		state = DISK_RESIZE_UNDEPLOYED;
    } else {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

string& VirtualMachine::lcm_state_to_str(string& st, LcmState state)
{
    switch (state)
    {
        case LCM_INIT:
            st = "LCM_INIT"; break;
        case PROLOG:
            st = "PROLOG"; break;
        case BOOT:
            st = "BOOT"; break;
        case RUNNING:
            st = "RUNNING"; break;
        case MIGRATE:
			st = "MIGRATE"; break;
        case SAVE_STOP:
			st = "SAVE_STOP"; break;
        case SAVE_SUSPEND:
			st = "SAVE_SUSPEND"; break;
        case SAVE_MIGRATE:
			st = "SAVE_MIGRATE"; break;
        case PROLOG_MIGRATE:
			st = "PROLOG_MIGRATE"; break;
        case PROLOG_RESUME:
			st = "PROLOG_RESUME"; break;
        case EPILOG_STOP:
			st = "EPILOG_STOP"; break;
        case EPILOG:
			st = "EPILOG"; break;
        case SHUTDOWN:
			st = "SHUTDOWN"; break;
        case CLEANUP_RESUBMIT:
			st = "CLEANUP_RESUBMIT"; break;
        case UNKNOWN:
			st = "UNKNOWN"; break;
        case HOTPLUG:
			st = "HOTPLUG"; break;
        case SHUTDOWN_POWEROFF:
			st = "SHUTDOWN_POWEROFF"; break;
        case BOOT_UNKNOWN:
			st = "BOOT_UNKNOWN"; break;
        case BOOT_POWEROFF:
			st = "BOOT_POWEROFF"; break;
        case BOOT_SUSPENDED:
			st = "BOOT_SUSPENDED"; break;
        case BOOT_STOPPED:
			st = "BOOT_STOPPED"; break;
        case CLEANUP_DELETE:
			st = "CLEANUP_DELETE"; break;
        case HOTPLUG_SNAPSHOT:
			st = "HOTPLUG_SNAPSHOT"; break;
        case HOTPLUG_NIC:
			st = "HOTPLUG_NIC"; break;
        case HOTPLUG_SAVEAS:
			st = "HOTPLUG_SAVEAS"; break;
        case HOTPLUG_SAVEAS_POWEROFF:
			st = "HOTPLUG_SAVEAS_POWEROFF"; break;
        case HOTPLUG_SAVEAS_SUSPENDED:
			st = "HOTPLUG_SAVEAS_SUSPENDED"; break;
        case SHUTDOWN_UNDEPLOY:
			st = "SHUTDOWN_UNDEPLOY"; break;
        case EPILOG_UNDEPLOY:
			st = "EPILOG_UNDEPLOY"; break;
        case PROLOG_UNDEPLOY:
			st = "PROLOG_UNDEPLOY"; break;
        case BOOT_UNDEPLOY:
			st = "BOOT_UNDEPLOY"; break;
        case HOTPLUG_PROLOG_POWEROFF:
			st = "HOTPLUG_PROLOG_POWEROFF"; break;
        case HOTPLUG_EPILOG_POWEROFF:
			st = "HOTPLUG_EPILOG_POWEROFF"; break;
        case BOOT_MIGRATE:
			st = "BOOT_MIGRATE"; break;
        case BOOT_FAILURE:
			st = "BOOT_FAILURE"; break;
        case BOOT_MIGRATE_FAILURE:
			st = "BOOT_MIGRATE_FAILURE"; break;
        case PROLOG_MIGRATE_FAILURE:
			st = "PROLOG_MIGRATE_FAILURE"; break;
        case PROLOG_FAILURE:
			st = "PROLOG_FAILURE"; break;
        case EPILOG_FAILURE:
			st = "EPILOG_FAILURE"; break;
        case EPILOG_STOP_FAILURE:
			st = "EPILOG_STOP_FAILURE"; break;
        case EPILOG_UNDEPLOY_FAILURE:
			st = "EPILOG_UNDEPLOY_FAILURE"; break;
        case PROLOG_MIGRATE_POWEROFF:
			st = "PROLOG_MIGRATE_POWEROFF"; break;
        case PROLOG_MIGRATE_POWEROFF_FAILURE:
			st = "PROLOG_MIGRATE_POWEROFF_FAILURE"; break;
        case PROLOG_MIGRATE_SUSPEND:
			st = "PROLOG_MIGRATE_SUSPEND"; break;
        case PROLOG_MIGRATE_SUSPEND_FAILURE:
			st = "PROLOG_MIGRATE_SUSPEND_FAILURE"; break;
        case BOOT_STOPPED_FAILURE:
			st = "BOOT_STOPPED_FAILURE"; break;
        case BOOT_UNDEPLOY_FAILURE:
			st = "BOOT_UNDEPLOY_FAILURE"; break;
        case PROLOG_RESUME_FAILURE:
			st = "PROLOG_RESUME_FAILURE"; break;
        case PROLOG_UNDEPLOY_FAILURE:
			st = "PROLOG_UNDEPLOY_FAILURE"; break;
        case DISK_SNAPSHOT_POWEROFF:
			st = "DISK_SNAPSHOT_POWEROFF"; break;
        case DISK_SNAPSHOT_REVERT_POWEROFF:
			st = "DISK_SNAPSHOT_REVERT_POWEROFF"; break;
        case DISK_SNAPSHOT_DELETE_POWEROFF:
			st = "DISK_SNAPSHOT_DELETE_POWEROFF"; break;
        case DISK_SNAPSHOT_SUSPENDED:
			st = "DISK_SNAPSHOT_SUSPENDED"; break;
        case DISK_SNAPSHOT_REVERT_SUSPENDED:
			st = "DISK_SNAPSHOT_REVERT_SUSPENDED"; break;
        case DISK_SNAPSHOT_DELETE_SUSPENDED:
			st = "DISK_SNAPSHOT_DELETE_SUSPENDED"; break;
        case DISK_SNAPSHOT:
			st = "DISK_SNAPSHOT"; break;
        case DISK_SNAPSHOT_DELETE:
			st = "DISK_SNAPSHOT_DELETE"; break;
        case PROLOG_MIGRATE_UNKNOWN:
			st = "PROLOG_MIGRATE_UNKNOWN"; break;
        case PROLOG_MIGRATE_UNKNOWN_FAILURE:
			st = "PROLOG_MIGRATE_UNKNOWN_FAILURE"; break;
        case DISK_RESIZE:
			st = "DISK_RESIZE"; break;
        case DISK_RESIZE_POWEROFF:
			st = "DISK_RESIZE_POWEROFF"; break;
        case DISK_RESIZE_UNDEPLOYED:
			st = "DISK_RESIZE_UNDEPLOYED"; break;
    }

    return st;
}

/* -------------------------------------------------------------------------- */

string VirtualMachine::state_str()
{
    string st;

    if (state == ACTIVE)
    {
        return lcm_state_to_str(st, lcm_state);
    }

    return vm_state_to_str(st, state);
}

/* ************************************************************************** */
/* Virtual Machine :: Database Access Functions                               */
/* ************************************************************************** */

const char * VirtualMachine::table = "vm_pool";

const char * VirtualMachine::db_names =
    "oid, name, body, uid, gid, last_poll, state, lcm_state, "
    "owner_u, group_u, other_u";

const char * VirtualMachine::db_bootstrap = "CREATE TABLE IF NOT EXISTS "
    "vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
    "gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, "
    "owner_u INTEGER, group_u INTEGER, other_u INTEGER)";


const char * VirtualMachine::monit_table = "vm_monitoring";

const char * VirtualMachine::monit_db_names = "vmid, last_poll, body";

const char * VirtualMachine::monit_db_bootstrap = "CREATE TABLE IF NOT EXISTS "
    "vm_monitoring (vmid INTEGER, last_poll INTEGER, body MEDIUMTEXT, "
    "PRIMARY KEY(vmid, last_poll))";


const char * VirtualMachine::showback_table = "vm_showback";

const char * VirtualMachine::showback_db_names = "vmid, year, month, body";

const char * VirtualMachine::showback_db_bootstrap =
    "CREATE TABLE IF NOT EXISTS vm_showback "
    "(vmid INTEGER, year INTEGER, month INTEGER, body MEDIUMTEXT, "
    "PRIMARY KEY(vmid, year, month))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::select(SqlDB * db)
{
    ostringstream   oss;
    ostringstream   ose;

    string system_dir;
    int    rc;
    int    last_seq;

    Nebula& nd = Nebula::instance();

    // Rebuild the VirtualMachine object
    rc = PoolObjectSQL::select(db);

    if( rc != 0 )
    {
        return rc;
    }

    //Get History Records.
    if( hasHistory() )
    {
        last_seq = history->seq;

        delete history_records[last_seq];

        for (int i = last_seq; i >= 0; i--)
        {
            History * hp;

            hp = new History(oid, i);
            history_records[i] = hp;

            rc = hp->select(db);

            if ( rc != 0)
            {
                goto error_previous_history;
            }

            if ( i == last_seq )
            {
                history = hp;
            }
            else if ( i == last_seq - 1 )
            {
                previous_history = hp;
            }
        }
    }

    if ( state == DONE ) //Do not recreate dirs. They may be deleted
    {
        _log = 0;

        return 0;
    }

    //--------------------------------------------------------------------------
    //Create support directories for this VM
    //--------------------------------------------------------------------------
    oss.str("");
    oss << nd.get_vms_location() << oid;

    mkdir(oss.str().c_str(), 0700);
    chmod(oss.str().c_str(), 0700);

    //--------------------------------------------------------------------------
    //Create Log support for this VM
    //--------------------------------------------------------------------------
    try
    {
        Log::MessageType   clevel;
        NebulaLog::LogType log_system;

        log_system  = nd.get_log_system();
        clevel      = nd.get_debug_level();

        switch(log_system)
        {
            case NebulaLog::FILE_TS:
            case NebulaLog::FILE:
                _log = new FileLog(nd.get_vm_log_filename(oid), clevel);
                break;

            case NebulaLog::SYSLOG:
                _log = new SysLog(clevel, oid, obj_type);
                break;

            case NebulaLog::STD:
                _log = new StdLog(clevel, oid, obj_type);
                break;

            default:
                throw runtime_error("Unknown log system.");
                break;
        }
    }
    catch(exception &e)
    {
        ose << "Error creating log: " << e.what();
        NebulaLog::log("ONE",Log::ERROR, ose);

        _log = 0;
    }

    return 0;

error_previous_history:
    ose << "Cannot get previous history record (seq:" << history->seq
        << ") for VM id: " << oid;

    log("ONE", Log::ERROR, ose);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int set_boot_order(Template * tmpl, string& error_str)
{
    vector<VectorAttribute *> disk;
    vector<VectorAttribute *> nic;

    ostringstream oss;

    int ndisk = tmpl->get("DISK", disk);
    int nnic  = tmpl->get("NIC", nic);

    for (int i=0; i<ndisk; ++i)
    {
        disk[i]->remove("ORDER");
    }

    for (int i=0; i<nnic; ++i)
    {
        nic[i]->remove("ORDER");
    }

    VectorAttribute * os = tmpl->get("OS");

    if ( os == 0 )
    {
        return 0;
    }

    string order = os->vector_value("BOOT");

    if ( order.empty() )
    {
        return 0;
    }

    vector<string> bdevs = one_util::split(order, ',');

    int index = 1;

    for (vector<string>::iterator i = bdevs.begin(); i != bdevs.end(); ++i)
    {
        vector<VectorAttribute *> * dev;
        int    max;
        int    disk_id;
        size_t pos;

        const char * id_name;

        one_util::toupper(*i);

        int rc = one_util::regex_match("^(DISK|NIC)[[:digit:]]+$", (*i).c_str());

        if (rc != 0)
        {
            goto error_parsing;
        }

        if ((*i).compare(0,4,"DISK") == 0)
        {
            pos = 4;

            max = ndisk;
            dev = &disk;

            id_name = "DISK_ID";
        }
        else if ((*i).compare(0,3,"NIC") == 0)
        {
            pos = 3;

            max = nnic;
            dev = &nic;

            id_name = "NIC_ID";
        }
        else
        {
            goto error_parsing;
        }

        istringstream iss((*i).substr(pos, string::npos));

        iss >> disk_id;

        if (iss.fail())
        {
            goto error_parsing;
        }

        bool found = false;

        for (int j=0; j<max; ++j)
        {
            int j_disk_id;

            if ( (*dev)[j]->vector_value(id_name, j_disk_id) == 0 &&
                   j_disk_id == disk_id )
            {
                (*dev)[j]->replace("ORDER", index++);
                found = true;
            }
        }

        if (!found)
        {
            oss << "Wrong OS/BOOT value. Device with "
                << id_name << " " << disk_id << " not found";

            goto error_common;
        }
    }

    return 0;

error_parsing:
    oss << "Wrong OS/BOOT value: \"" << order
        << "\" should be a comma-separated list of disk# or nic#";

error_common:
    error_str = oss.str();
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::insert(SqlDB * db, string& error_str)
{
    int    rc;
    string name;
    string prefix;

    string value;
    long int ivalue;
    float fvalue;
    set<int> cluster_ids;
    vector<Template *> quotas;

    ostringstream oss;

    // ------------------------------------------------------------------------
    // Set a name if the VM has not got one and VM_ID
    // ------------------------------------------------------------------------
    user_obj_template->erase("VMID");
    obj_template->add("VMID", oid);

    user_obj_template->get("TEMPLATE_ID", value);
    user_obj_template->erase("TEMPLATE_ID");

    if (!value.empty())
    {
        obj_template->add("TEMPLATE_ID", value);
    }

    user_obj_template->get("NAME",name);
    user_obj_template->erase("NAME");

    user_obj_template->get("TEMPLATE_NAME", prefix);
    user_obj_template->erase("TEMPLATE_NAME");

    if (prefix.empty())
    {
        prefix = "one";
    }

    if (name.empty() == true)
    {
        oss.str("");
        oss << prefix << "-" << oid;
        name = oss.str();
    }

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    this->name = name;

    // ------------------------------------------------------------------------
    // Parse the Public Cloud specs for this VM
    // ------------------------------------------------------------------------

    if (parse_public_clouds(error_str) != 0)
    {
        goto error_public;
    }

    // ------------------------------------------------------------------------
    // Check for EMULATOR attribute
    // ------------------------------------------------------------------------

    user_obj_template->get("EMULATOR", value);

    if (!value.empty())
    {
        user_obj_template->erase("EMULATOR");
        obj_template->add("EMULATOR", value);
    }

    // ------------------------------------------------------------------------
    // Check for CPU, VCPU and MEMORY attributes
    // ------------------------------------------------------------------------

    if ( user_obj_template->get("MEMORY", ivalue) == false || (ivalue * 1024) <= 0 )
    {
        goto error_memory;
    }

    user_obj_template->erase("MEMORY");
    obj_template->add("MEMORY", ivalue);

    if ( user_obj_template->get("CPU", fvalue) == false || fvalue <= 0 )
    {
        goto error_cpu;
    }

    user_obj_template->erase("CPU");
    obj_template->add("CPU", fvalue);

    // VCPU is optional, first check if the attribute exists, then check it is
    // an integer
    user_obj_template->get("VCPU", value);

    if ( value.empty() == false )
    {
        if ( user_obj_template->get("VCPU", ivalue) == false || ivalue <= 0 )
        {
            goto error_vcpu;
        }

        user_obj_template->erase("VCPU");
        obj_template->add("VCPU", ivalue);
    }

    // ------------------------------------------------------------------------
    // Check the cost attributes
    // ------------------------------------------------------------------------

    if ( user_obj_template->get("CPU_COST", fvalue) == true )
    {
        if ( fvalue < 0 )
        {
            goto error_cpu_cost;
        }

        user_obj_template->erase("CPU_COST");
        obj_template->add("CPU_COST", fvalue);
    }

    if ( user_obj_template->get("MEMORY_COST", fvalue) == true )
    {
        if ( fvalue < 0 )
        {
            goto error_memory_cost;
        }

        user_obj_template->erase("MEMORY_COST");
        obj_template->add("MEMORY_COST", fvalue);
    }

    if ( user_obj_template->get("DISK_COST", fvalue) == true )
    {
        if ( fvalue < 0 )
        {
            goto error_disk_cost;
        }

        user_obj_template->erase("DISK_COST");
        obj_template->add("DISK_COST", fvalue);
    }

    // ------------------------------------------------------------------------
    // Check the OS attribute
    // ------------------------------------------------------------------------

    rc = parse_os(error_str);

    if ( rc != 0 )
    {
        goto error_os;
    }

    // ------------------------------------------------------------------------
    // Check the CPU Model attribute
    // ------------------------------------------------------------------------
    parse_cpu_model();

    // ------------------------------------------------------------------------
    // PCI Devices (Needs to be parsed before network)
    // ------------------------------------------------------------------------

    rc = parse_pci(error_str);

    if ( rc != 0 )
    {
        goto error_pci;
    }

    // ------------------------------------------------------------------------
    // Parse the defaults to merge
    // ------------------------------------------------------------------------

    rc = parse_defaults(error_str);

    if ( rc != 0 )
    {
        goto error_defaults;
    }

    // ------------------------------------------------------------------------
    // Parse the virtual router attributes
    // ------------------------------------------------------------------------

    rc = parse_vrouter(error_str);

    if ( rc != 0 )
    {
        goto error_vrouter;
    }

    // ------------------------------------------------------------------------
    // Get network leases
    // ------------------------------------------------------------------------

    rc = get_network_leases(error_str);

    if ( rc != 0 )
    {
        goto error_leases_rollback;
    }

    // ------------------------------------------------------------------------
    // Get disk images
    // ------------------------------------------------------------------------

    rc = get_disk_images(error_str);

    if ( rc != 0 )
    {
        // The get_disk_images method has an internal rollback for
        // the acquired images, release_disk_images() would release all disks
        goto error_leases_rollback;
    }

    bool on_hold;

    if (user_obj_template->get("SUBMIT_ON_HOLD", on_hold) == true)
    {
        user_obj_template->erase("SUBMIT_ON_HOLD");

        obj_template->replace("SUBMIT_ON_HOLD", on_hold);
    }

    if ( has_cloning_disks())
    {
        state = VirtualMachine::CLONING;
    }

    // -------------------------------------------------------------------------
    // Set boot order
    // -------------------------------------------------------------------------

    rc = set_boot_order(obj_template, error_str);

    if ( rc != 0 )
    {
        goto error_boot_order;
    }

    // -------------------------------------------------------------------------
    // Parse the context & requirements
    // -------------------------------------------------------------------------

    rc = parse_context(error_str);

    if ( rc != 0 )
    {
        goto error_context;
    }

    rc = parse_requirements(error_str);

    if ( rc != 0 )
    {
        goto error_requirements;
    }

    rc = automatic_requirements(cluster_ids, error_str);

    if ( rc != 0 )
    {
        goto error_requirements;
    }

    if ( parse_graphics(error_str) != 0 )
    {
        goto error_graphics;
    }

    // -------------------------------------------------------------------------
    // Get and set DEPLOY_ID for imported VMs
    // -------------------------------------------------------------------------

    user_obj_template->get("IMPORT_VM_ID", value);
    user_obj_template->erase("IMPORT_VM_ID");

    if (!value.empty())
    {
        const char * one_vms = "^one-[[:digit:]]+$";

        if (one_util::regex_match(one_vms, value.c_str()) == 0)
        {
            goto error_one_vms;
        }
        else
        {
            deploy_id = value;
            obj_template->add("IMPORTED", "YES");
        }
    }

    // ------------------------------------------------------------------------
    // Associate to VM Group
    // ------------------------------------------------------------------------
    if ( get_vmgroup(error_str) == -1 )
    {
        goto error_rollback;
    }

    // ------------------------------------------------------------------------

    parse_well_known_attributes();

    // ------------------------------------------------------------------------
    // Insert the VM
    // ------------------------------------------------------------------------

    rc = insert_replace(db, false, error_str);

    if ( rc != 0 )
    {
        goto error_update;
    }

    return 0;

error_update:
    goto error_rollback;

error_boot_order:
    goto error_rollback;

error_context:
    goto error_rollback;

error_requirements:
    goto error_rollback;

error_graphics:
    goto error_rollback;

error_rollback:
    release_disk_images(quotas);

error_leases_rollback:
    release_network_leases();
    goto error_common;

error_cpu:
    error_str = "CPU attribute must be a positive float or integer value.";
    goto error_common;

error_vcpu:
    error_str = "VCPU attribute must be a positive integer value.";
    goto error_common;

error_memory:
    error_str = "MEMORY attribute must be a positive integer value.";
    goto error_common;

error_cpu_cost:
    error_str = "CPU_COST attribute must be a positive float or integer value.";
    goto error_common;

error_memory_cost:
    error_str = "MEMORY_COST attribute must be a positive float or integer value.";
    goto error_common;

error_disk_cost:
    error_str = "DISK_COST attribute must be a positive float or integer value.";
    goto error_common;

error_one_vms:
    error_str = "Trying to import an OpenNebula VM: 'one-*'.";
    goto error_common;

error_os:
error_pci:
error_defaults:
error_vrouter:
error_public:
error_name:
error_common:
    NebulaLog::log("ONE",Log::ERROR, error_str);

    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

/**
 * @return -1 for incompatible cluster IDs, -2 for missing cluster IDs
 */
static int check_and_set_cluster_id(
        const char *           id_name,
        const VectorAttribute* vatt,
        set<int>               &cluster_ids)
{
    set<int> vatt_cluster_ids;
    string   val;

    // If the attr does not exist, the vatt is using a manual path/resource.
    // This is different to a resource with 0 clusters
    if (vatt->vector_value(id_name, val) != 0)
    {
        return 0;
    }

    one_util::split_unique(val, ',', vatt_cluster_ids);

    if ( vatt_cluster_ids.empty() )
    {
        return -2;
    }

    if ( cluster_ids.empty() )
    {
        cluster_ids = vatt_cluster_ids;

        return 0;
    }

    set<int> intersection = one_util::set_intersection(cluster_ids, vatt_cluster_ids);

    if (intersection.empty())
    {
        return -1;
    }

    cluster_ids = intersection;

    return 0;
}

/* ------------------------------------------------------------------------ */

void update_os_file(VectorAttribute *  os,
                    const string&      base_name)
{
    ClusterPool *   clpool = Nebula::instance().get_clpool();
    int             ds_id;
    set<int>        cluster_ids;

    string base_name_ds_id   = base_name + "_DS_DSID";
    string base_name_cluster = base_name + "_DS_CLUSTER_ID";

    if (os->vector_value(base_name_ds_id, ds_id) != 0)
    {
        return;
    }

    clpool->query_datastore_clusters(ds_id, cluster_ids);

    os->replace(base_name_cluster, one_util::join(cluster_ids, ','));
}

/* ------------------------------------------------------------------------ */

static void update_disk_cluster_id(VectorAttribute* disk)
{
    ClusterPool *   clpool = Nebula::instance().get_clpool();
    int             ds_id;
    set<int>        cluster_ids;

    if (disk->vector_value("DATASTORE_ID", ds_id) != 0)
    {
        return;
    }

    clpool->query_datastore_clusters(ds_id, cluster_ids);

    disk->replace("CLUSTER_ID", one_util::join(cluster_ids, ','));
}

/* ------------------------------------------------------------------------ */

static void update_nic_cluster_id(VectorAttribute* nic)
{
    ClusterPool *   clpool = Nebula::instance().get_clpool();
    int             vn_id;
    set<int>        cluster_ids;

    if (nic->vector_value("NETWORK_ID", vn_id) != 0)
    {
        return;
    }

    clpool->query_vnet_clusters(vn_id, cluster_ids);

    nic->replace("CLUSTER_ID", one_util::join(cluster_ids, ','));
}

/* ------------------------------------------------------------------------ */

/**
 * Returns the list of Cluster IDs where the VM can be deployed, based
 * on the Datastores and VirtualNetworks requested
 *
 * @param tmpl of the VirtualMachine
 * @param cluster_ids set of Cluster IDs
 * @param error_str Returns the error reason, if any
 * @return 0 on success
 */
static int get_cluster_requirements(Template *tmpl, set<int>& cluster_ids,
        string& error_str)
{
    ostringstream   oss;
    int             num_vatts;
    vector<VectorAttribute*> vatts;

    int incomp_id;
    int rc;

    // Get cluster id from the KERNEL and INITRD (FILE Datastores)
    VectorAttribute * osatt = tmpl->get("OS");

    if ( osatt != 0 )
    {
        update_os_file(osatt, "KERNEL");

        rc = check_and_set_cluster_id("KERNEL_DS_CLUSTER_ID", osatt, cluster_ids);

        if ( rc != 0 )
        {
            goto error_kernel;
        }

        update_os_file(osatt, "INITRD");

        rc = check_and_set_cluster_id("INITRD_DS_CLUSTER_ID", osatt, cluster_ids);

        if ( rc != 0 )
        {
            goto error_initrd;
        }
    }

    // Get cluster id from all DISK vector attributes (IMAGE Datastore)
    num_vatts = tmpl->get("DISK",vatts);

    for(int i=0; i<num_vatts; i++)
    {
        update_disk_cluster_id(vatts[i]);

        rc = check_and_set_cluster_id("CLUSTER_ID", vatts[i], cluster_ids);

        if ( rc != 0 )
        {
            incomp_id = i;
            goto error_disk;
        }
    }

    vatts.clear();

    // Get cluster id from all NIC vector attributes
    num_vatts = tmpl->get("NIC", vatts);

    for(int i=0; i<num_vatts; i++)
    {
        update_nic_cluster_id(vatts[i]);

        rc = check_and_set_cluster_id("CLUSTER_ID", vatts[i], cluster_ids);

        if ( rc != 0 )
        {
            incomp_id = i;
            goto error_nic;
        }
    }

    vatts.clear();

    // Get cluster id from all PCI attibutes, TYPE = NIC
    num_vatts = tmpl->get("PCI", vatts);

    for(int i=0; i<num_vatts; i++)
    {
        if ( vatts[i]->vector_value("TYPE") != "NIC" )
        {
            continue;
        }

        update_nic_cluster_id(vatts[i]);

        rc = check_and_set_cluster_id("CLUSTER_ID", vatts[i], cluster_ids);

        if ( rc != 0 )
        {
            incomp_id = i;
            goto error_pci;
        }
    }

    return 0;

error_disk:
    if (rc == -1)
    {
        oss << "Incompatible clusters in DISK. Datastore for DISK "<< incomp_id
            << " is not in the same cluster as the one used by other VM elements "
            << "(cluster " << one_util::join(cluster_ids, ',') << ")";
    }
    else
    {
        oss << "Missing clusters. Datastore for DISK "<< incomp_id
            << " is not in any cluster";
    }

    goto error_common;

error_kernel:
    if (rc == -1)
    {
        oss<<"Incompatible cluster in KERNEL datastore, it should be in cluster "
           << one_util::join(cluster_ids, ',') << ".";
    }
    else
    {
        oss << "Missing clusters. KERNEL datastore is not in any cluster.";
    }

    goto error_common;

error_initrd:
    if (rc == -1)
    {
        oss<<"Incompatible cluster in INITRD datastore, it should be in cluster "
           << one_util::join(cluster_ids, ',') << ".";
    }
    else
    {
        oss << "Missing clusters. INITRD datastore is not in any cluster.";
    }

    goto error_common;

error_nic:
    if (rc == -1)
    {
        oss << "Incompatible clusters in NIC. Network for NIC "<< incomp_id
            << " is not in the same cluster as the one used by other VM elements "
            << "(cluster " << one_util::join(cluster_ids, ',') << ")";
    }
    else
    {
        oss << "Missing clusters. Network for NIC "<< incomp_id
            << " is not in any cluster";
    }

    goto error_common;

error_pci:
    if (rc == -1)
    {
        oss << "Incompatible clusters in PCI (TYPE=NIC). Network for PCI "
            << incomp_id
            << " is not in the same cluster as the one used by other VM elements "
            << "(cluster " << one_util::join(cluster_ids, ',') << ")";
    }
    else
    {
        oss << "Missing clusters. Network for PCI "<< incomp_id
            << " is not in any cluster";
    }

    goto error_common;

error_common:
    error_str = oss.str();

    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualMachine::automatic_requirements(set<int>& cluster_ids,
    string& error_str)
{
    string tm_mad_system;
    ostringstream   oss;
    set<string>     clouds;

    obj_template->erase("AUTOMATIC_REQUIREMENTS");
    obj_template->erase("AUTOMATIC_DS_REQUIREMENTS");

    int rc = get_cluster_requirements(obj_template, cluster_ids, error_str);

    if (rc != 0)
    {
        return -1;
    }

    if ( !cluster_ids.empty() )
    {
        set<int>::iterator i = cluster_ids.begin();

        oss << "(CLUSTER_ID = " << *i;

        for (++i; i != cluster_ids.end(); i++)
        {
            oss << " | CLUSTER_ID = " << *i;
        }

        oss << ") & !(PUBLIC_CLOUD = YES)";
    }
    else
    {
        oss << "!(PUBLIC_CLOUD = YES)";
    }

    int num_public = get_public_clouds(clouds);

    if (num_public != 0)
    {
        set<string>::iterator it = clouds.begin();

        oss << " | (PUBLIC_CLOUD = YES & (";

        oss << "HYPERVISOR = " << *it ;

        for (++it; it != clouds.end() ; ++it)
        {
            oss << " | HYPERVISOR = " << *it;
        }

        oss << "))";
    }

    obj_template->add("AUTOMATIC_REQUIREMENTS", oss.str());

    oss.str("");

    if ( obj_template->get("TM_MAD_SYSTEM", tm_mad_system) )
    {
        oss << "(TM_MAD = " << one_util::trim(tm_mad_system) << ") & ";
    }

    // Set automatic System DS requirements

    if ( !cluster_ids.empty() )
    {
        set<int>::iterator i = cluster_ids.begin();

        oss << "(\"CLUSTERS/ID\" @> " << *i;

        for (++i; i != cluster_ids.end(); i++)
        {
            oss << " | \"CLUSTERS/ID\" @> " << *i;
        }

        oss << ")";

        obj_template->add("AUTOMATIC_DS_REQUIREMENTS", oss.str());
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualMachine::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;
    int             rc;

    string xml_body;
    char * sql_name;
    char * sql_xml;

    sql_name =  db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        goto error_generic;
    }

    sql_xml = db->escape_str(to_xml(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    oss << " INTO " << table << " ("<< db_names <<") VALUES ("
        <<          oid             << ","
        << "'" <<   sql_name        << "',"
        << "'" <<   sql_xml         << "',"
        <<          uid             << ","
        <<          gid             << ","
        <<          last_poll       << ","
        <<          state           << ","
        <<          lcm_state       << ","
        <<          owner_u         << ","
        <<          group_u         << ","
        <<          other_u         << ")";

    db->free_str(sql_name);
    db->free_str(sql_xml);

    rc = db->exec_wr(oss);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the VM to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_generic:
    error_str = "Error inserting VM in DB.";
error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::update_monitoring(SqlDB * db)
{
    ostringstream oss;
    int           rc;

    string xml_body;
    string error_str;
    char * sql_xml;

    float       cpu = 0;
    long long   memory = 0;

    obj_template->get("CPU", cpu);
    obj_template->get("MEMORY", memory);

    oss << "<VM>"
        << "<ID>" << oid << "</ID>"
        << "<LAST_POLL>" << last_poll << "</LAST_POLL>"
        << monitoring.to_xml(xml_body)
        << "<TEMPLATE>"
        <<   "<CPU>"    << cpu << "</CPU>"
        <<   "<MEMORY>" << memory << "</MEMORY>"
        << "</TEMPLATE>"
        << "</VM>";

    sql_xml = db->escape_str(oss.str().c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    oss.str("");

    oss << "REPLACE INTO " << monit_table << " ("<< monit_db_names <<") VALUES ("
        <<          oid             << ","
        <<          last_poll       << ","
        << "'" <<   sql_xml         << "')";

    db->free_str(sql_xml);

    rc = db->exec_local_wr(oss);

    return rc;

error_xml:
    db->free_str(sql_xml);

    error_str = "could not transform the VM to XML.";

    goto error_common;

error_body:
    error_str = "could not insert the VM in the DB.";

error_common:
    oss.str("");
    oss << "Error updating VM monitoring information, " << error_str;

    NebulaLog::log("ONE",Log::ERROR, oss);

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::add_history(
    int   hid,
    int   cid,
    const string& hostname,
    const string& vmm_mad,
    const string& tm_mad,
    int           ds_id)
{
    ostringstream os;
    int           seq;
    string        vm_xml;

    if (history == 0)
    {
        seq = 0;
    }
    else
    {
        seq = history->seq + 1;

        previous_history = history;
    }

    to_xml_extended(vm_xml, 0);

    history = new History(oid, seq, hid, hostname, cid, vmm_mad, tm_mad, ds_id,
            vm_xml);

    history_records.push_back(history);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::cp_history()
{
    History * htmp;
    string    vm_xml;

    if (history == 0)
    {
        return;
    }

    to_xml_extended(vm_xml, 0);

    htmp = new History(oid,
                       history->seq + 1,
                       history->hid,
                       history->hostname,
                       history->cid,
                       history->vmm_mad_name,
                       history->tm_mad_name,
                       history->ds_id,
                       vm_xml);

    previous_history = history;
    history          = htmp;

    history_records.push_back(history);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::cp_previous_history()
{
    History * htmp;
    string    vm_xml;

    if ( previous_history == 0 || history == 0)
    {
        return;
    }

    to_xml_extended(vm_xml, 0);

    htmp = new History(oid,
                       history->seq + 1,
                       previous_history->hid,
                       previous_history->hostname,
                       previous_history->cid,
                       previous_history->vmm_mad_name,
                       previous_history->tm_mad_name,
                       previous_history->ds_id,
                       vm_xml);

    previous_history = history;
    history          = htmp;

    history_records.push_back(history);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::get_requirements (int& cpu, int& memory, int& disk,
        vector<VectorAttribute *>& pci_devs)
{
    istringstream   iss;
    float           fcpu;

    pci_devs.clear();

    if ((get_template_attribute("MEMORY",memory) == false) ||
        (get_template_attribute("CPU",fcpu) == false))
    {
        cpu    = 0;
        memory = 0;
        disk   = 0;

        return;
    }

    cpu    = (int) (fcpu * 100);//now in 100%
    memory = memory * 1024;     //now in Kilobytes
    disk   = 0;

    obj_template->get("PCI", pci_devs);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::check_resize (
        float cpu, long int memory, int vcpu, string& error_str)
{
    if (cpu < 0)
    {
        error_str = "CPU must be a positive float or integer value.";
        return -1;
    }

    if (memory < 0)
    {
        error_str = "MEMORY must be a positive integer value.";
        return -1;
    }

    if (vcpu < 0)
    {
        error_str = "VCPU must be a positive integer value.";
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::resize(float cpu, long int memory, int vcpu, string& error_str)
{
    ostringstream oss;

    int rc = check_resize(cpu, memory, vcpu, error_str);

    if (rc != 0)
    {
        return rc;
    }

    if (cpu > 0)
    {
        oss << cpu;
        replace_template_attribute("CPU", oss.str());
        oss.str("");
    }

    if (memory > 0)
    {
        oss << memory;
        replace_template_attribute("MEMORY", oss.str());
        oss.str("");
    }

    if (vcpu > 0)
    {
        oss << vcpu;
        replace_template_attribute("VCPU", oss.str());
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachine::is_imported() const
{
    bool imported = false;

    get_template_attribute("IMPORTED", imported);

    return imported;
}

string VirtualMachine::get_import_state()
{
    string import_state;

    user_obj_template->get("IMPORT_STATE", import_state);
    user_obj_template->erase("IMPORT_STATE");

    return import_state;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachine::is_imported_action_supported(History::VMAction action) const
{
    if (!hasHistory())
    {
        return false;
    }

    VirtualMachineManager * vmm = Nebula::instance().get_vmm();

    return vmm->is_imported_action_supported(get_vmm_mad(), action);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::remove_security_group(int sgid)
{
    int num_sgs;
    int ssgid;

    vector<VectorAttribute  *> sgs;

    num_sgs = obj_template->get("SECURITY_GROUP_RULE", sgs);

    for(int i=0; i<num_sgs; i++)
    {
        sgs[i]->vector_value("SECURITY_GROUP_ID", ssgid);

        if ( ssgid == sgid )
        {
            obj_template->remove(sgs[i]);
            delete sgs[i];
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::get_vrouter_id()
{
    int vrid;

    if (!obj_template->get("VROUTER_ID", vrid))
    {
        vrid = -1;
    }

    return vrid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachine::is_vrouter()
{
    return get_vrouter_id() != -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::set_auth_request(int uid,
                                      AuthRequest& ar,
                                      VirtualMachineTemplate *tmpl)
{
    VirtualMachineDisks::disk_iterator disk;
    VirtualMachineDisks tdisks(tmpl, false);

    for( disk = tdisks.begin(); disk != tdisks.end(); ++disk)
    {
        (*disk)->authorize(uid, &ar);
    }

    VirtualMachineNics::nic_iterator nic;
    VirtualMachineNics tnics(tmpl);

    for( nic = tnics.begin(); nic != tnics.end(); ++nic)
    {
        (*nic)->authorize(uid, &ar);
    }

    const VectorAttribute * vmgroup = tmpl->get("VMGROUP");

    if ( vmgroup != 0 )
    {
        VMGroupPool * vmgrouppool = Nebula::instance().get_vmgrouppool();

        vmgrouppool->authorize(vmgroup, uid, &ar);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VirtualMachine::to_xml_extended(string& xml, int n_history) const
{
    string template_xml;
    string user_template_xml;
    string monitoring_xml;
    string history_xml;
    string perm_xml;
    string snap_xml;
    string lock_str;

    ostringstream   oss;

    oss << "<VM>"
        << "<ID>"        << oid       << "</ID>"
        << "<UID>"       << uid       << "</UID>"
        << "<GID>"       << gid       << "</GID>"
        << "<UNAME>"     << uname     << "</UNAME>"
        << "<GNAME>"     << gname     << "</GNAME>"
        << "<NAME>"      << name      << "</NAME>"
        << perms_to_xml(perm_xml)
        << "<LAST_POLL>" << last_poll << "</LAST_POLL>"
        << "<STATE>"     << state     << "</STATE>"
        << "<LCM_STATE>" << lcm_state << "</LCM_STATE>"
        << "<PREV_STATE>"     << prev_state     << "</PREV_STATE>"
        << "<PREV_LCM_STATE>" << prev_lcm_state << "</PREV_LCM_STATE>"
        << "<RESCHED>"   << resched   << "</RESCHED>"
        << "<STIME>"     << stime     << "</STIME>"
        << "<ETIME>"     << etime     << "</ETIME>"
        << "<DEPLOY_ID>" << deploy_id << "</DEPLOY_ID>"
        << lock_db_to_xml(lock_str)
        << monitoring.to_xml(monitoring_xml)
        << obj_template->to_xml(template_xml)
        << user_obj_template->to_xml(user_template_xml);

    if ( hasHistory() && n_history > 0 )
    {
        oss << "<HISTORY_RECORDS>";

        if ( n_history == 2 )
        {
            for (unsigned int i=0; i < history_records.size(); i++)
            {
                oss << history_records[i]->to_xml(history_xml);
            }
        }
        else
        {
            oss << history->to_xml(history_xml);
        }

        oss << "</HISTORY_RECORDS>";
    }
    else
    {
        oss << "<HISTORY_RECORDS/>";
    }

    VirtualMachineDisks::disk_iterator disk;

    for ( disk = const_cast<VirtualMachineDisks *>(&disks)->begin() ;
            disk != const_cast<VirtualMachineDisks *>(&disks)->end() ; ++disk)
    {
        const Snapshots * snapshots = (*disk)->get_snapshots();

        if ( snapshots != 0 )
        {
            oss << snapshots->to_xml(snap_xml);
        }
    }

    oss << "</VM>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::from_xml(const string &xml_str)
{
    vector<xmlNodePtr> content;

    int istate;
    int ilcmstate;
    int rc = 0;

    // Initialize the internal XML object
    rc = update_from_str(xml_str);

    if ( rc != 0 )
    {
        return -1;
    }

    // Get class base attributes
    rc += xpath(oid,       "/VM/ID",    -1);

    rc += xpath(uid,       "/VM/UID",   -1);
    rc += xpath(gid,       "/VM/GID",   -1);

    rc += xpath(uname,     "/VM/UNAME", "not_found");
    rc += xpath(gname,     "/VM/GNAME", "not_found");
    rc += xpath(name,      "/VM/NAME",  "not_found");

    rc += xpath<time_t>(last_poll, "/VM/LAST_POLL", 0);
    rc += xpath(resched, "/VM/RESCHED", 0);

    rc += xpath<time_t>(stime, "/VM/STIME", 0);
    rc += xpath<time_t>(etime, "/VM/ETIME", 0);
    rc += xpath(deploy_id, "/VM/DEPLOY_ID","");

    // Permissions
    rc += perms_from_xml();

    //VM states
    rc += xpath(istate,    "/VM/STATE",     0);
    rc += xpath(ilcmstate, "/VM/LCM_STATE", 0);

    state     = static_cast<VmState>(istate);
    lcm_state = static_cast<LcmState>(ilcmstate);

    xpath(istate,    "/VM/PREV_STATE",     istate);
    xpath(ilcmstate, "/VM/PREV_LCM_STATE", ilcmstate);

    prev_state     = static_cast<VmState>(istate);
    prev_lcm_state = static_cast<LcmState>(ilcmstate);

    rc += lock_db_from_xml();

    // -------------------------------------------------------------------------
    // Virtual Machine template and attributes
    // -------------------------------------------------------------------------
    ObjectXML::get_nodes("/VM/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }
    rc += obj_template->from_xml_node(content[0]);

    vector<VectorAttribute *> vdisks, vnics, pcis;
    vector<VectorAttribute *>::iterator it;

    obj_template->get("DISK", vdisks);

    disks.init(vdisks, true);

    obj_template->get("NIC", vnics);

    obj_template->get("PCI", pcis);

    for (it =pcis.begin(); it != pcis.end(); ++it)
    {
        if ( (*it)->vector_value("TYPE") == "NIC" )
        {
            vnics.push_back(*it);
        }
    }

    nics.init(vnics, true);

    ObjectXML::free_nodes(content);
    content.clear();

    // -------------------------------------------------------------------------
    // Virtual Machine Monitoring
    // -------------------------------------------------------------------------
    ObjectXML::get_nodes("/VM/MONITORING", content);

    if (content.empty())
    {
        return -1;
    }

    rc += monitoring.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    // -------------------------------------------------------------------------
    // Virtual Machine user template
    // -------------------------------------------------------------------------
    ObjectXML::get_nodes("/VM/USER_TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += user_obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    // -------------------------------------------------------------------------
    // Last history entry
    // -------------------------------------------------------------------------
    int last_seq;

    if ( xpath(last_seq,"/VM/HISTORY_RECORDS/HISTORY/SEQ", -1) == 0 &&
            last_seq != -1 )
    {
        history_records.resize(last_seq + 1);

        for (int i=0; i <= last_seq; ++i)
        {
            history_records[i] = 0;
        }

        history = new History(oid, last_seq);

        history_records[last_seq] = history;
    }

    // -------------------------------------------------------------------------
    // Virtual Machine Snapshots
    // -------------------------------------------------------------------------
    ObjectXML::get_nodes("/VM/SNAPSHOTS", content);

    for (vector<xmlNodePtr>::iterator it=content.begin();it!=content.end();it++)
    {
        Snapshots * snap = new Snapshots(-1, false);

        rc += snap->from_xml_node(*it);

        if ( rc != 0)
        {
            delete snap;
            break;
        }

        disks.set_snapshots(snap->get_disk_id(), snap);
    }

    if (!content.empty())
    {
        ObjectXML::free_nodes(content);
        content.clear();
    }

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::update_info(const string& monitor_data)
{
    int    rc;
    string error;

    ostringstream oss;

    last_poll = time(0);

    rc = monitoring.update(monitor_data, error);

    if ( rc != 0)
    {
        oss << "Ignoring monitoring information, error:" << error
            << ". Monitor information was: " << monitor_data;

        NebulaLog::log("VMM", Log::ERROR, oss);

        set_template_error_message(oss.str());

        log("VMM", Log::ERROR, oss);

        return -1;
    }

    set_vm_info();

    clear_template_monitor_error();

    oss << "VM " << oid << " successfully monitored: " << monitor_data;

    NebulaLog::log("VMM", Log::DEBUG, oss);

    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::replace_template(
        const string&   tmpl_str,
        bool            keep_restricted,
        string&         error)
{
    string ra;

    VirtualMachineTemplate * new_tmpl =
            new VirtualMachineTemplate(false,'=',"USER_TEMPLATE");

    if ( new_tmpl == 0 )
    {
        error = "Cannot allocate a new template";
        return -1;
    }

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        delete new_tmpl;
        return -1;
    }

    if (user_obj_template != 0)
    {
        if (keep_restricted && new_tmpl->check_restricted(ra, user_obj_template))
        {
            error = "Tried to change restricted attribute: " + ra;

            delete new_tmpl;
            return -1;
        }
    }
    else if (keep_restricted && new_tmpl->check_restricted(ra))
    {
        error = "Tried to set restricted attribute: " + ra;

        delete new_tmpl;
        return -1;
    }

    delete user_obj_template;

    user_obj_template = new_tmpl;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::append_template(
        const string&   tmpl_str,
        bool            keep_restricted,
        string&         error)
{
    VirtualMachineTemplate * new_tmpl =
            new VirtualMachineTemplate(false,'=',"USER_TEMPLATE");
    string rname;

    if ( new_tmpl == 0 )
    {
        error = "Cannot allocate a new template";
        return -1;
    }

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        delete new_tmpl;
        return -1;
    }

    if (user_obj_template != 0)
    {
        if (keep_restricted && new_tmpl->check_restricted(rname, user_obj_template))
        {
            error ="User Template includes a restricted attribute " + rname;
            delete new_tmpl;
            return -1;
        }
        user_obj_template->merge(new_tmpl);

        delete new_tmpl;
    }
    else
    {
        if (keep_restricted && new_tmpl->check_restricted(rname))
        {
            error ="User Template includes a restricted attribute " + rname;
            delete new_tmpl;
            return -1;
        }
        user_obj_template = new_tmpl;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::set_template_error_message(const string& message)
{
    set_template_error_message("ERROR", message);
}

/* -------------------------------------------------------------------------- */

void VirtualMachine::set_template_error_message(const string& name,
                                               const string& message)
{
    SingleAttribute * attr;
    ostringstream     error_value;

    error_value << one_util::log_time() << " : " << message;

    attr = new SingleAttribute(name, error_value.str());

    user_obj_template->erase(name);
    user_obj_template->set(attr);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::clear_template_error_message()
{
    user_obj_template->erase("ERROR");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::set_template_monitor_error(const string& message)
{
    set_template_error_message("ERROR_MONITOR", message);
}

/* -------------------------------------------------------------------------- */

void VirtualMachine::clear_template_monitor_error()
{
    user_obj_template->erase("ERROR_MONITOR");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::get_public_clouds(const string& pname, set<string> &clouds) const
{
    vector<VectorAttribute *>                 attrs;
    vector<VectorAttribute *>::const_iterator it;

    user_obj_template->get(pname, attrs);

    if ( !attrs.empty() && pname == "EC2" )
    {
	    clouds.insert("ec2");
    }

    for (it = attrs.begin(); it != attrs.end(); it++)
    {
        string type = (*it)->vector_value("TYPE");

        if (!type.empty())
        {
            clouds.insert(type);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Replaces the values of a vector value, preserving the existing ones
 */
static void replace_vector_values(Template *old_tmpl, Template *new_tmpl,
        const char * name, const string * vnames, int num)
{
    string value;

    VectorAttribute * new_attr = new_tmpl->get(name);
    VectorAttribute * old_attr = old_tmpl->get(name);

    if ( new_attr == 0 )
    {
        old_tmpl->erase(name);
    }
    else if ( old_attr == 0 )
    {
        old_tmpl->set(new_attr->clone());
    }
    else
    {
        for (int i=0; i < num; i++)
        {
            if ( new_attr->vector_value(vnames[i], value) == -1 )
            {
                old_attr->remove(vnames[i]);
            }
            else
            {
                old_attr->replace(vnames[i], value);
            }
        }
    }
};

/* -------------------------------------------------------------------------- */

int VirtualMachine::updateconf(VirtualMachineTemplate& tmpl, string &err)
{
    switch (state)
    {
        case PENDING:
        case HOLD:
        case POWEROFF:
        case UNDEPLOYED:
        case CLONING:
        case CLONING_FAILURE:
            break;

        case ACTIVE:
            switch (lcm_state)
            {
                case LCM_INIT:
                case PROLOG:
                case EPILOG:
                case SHUTDOWN:
                case CLEANUP_RESUBMIT:
                case SHUTDOWN_POWEROFF:
                case CLEANUP_DELETE:
                case HOTPLUG_SAVEAS_POWEROFF:
                case SHUTDOWN_UNDEPLOY:
                case EPILOG_UNDEPLOY:
                case PROLOG_UNDEPLOY:
                case HOTPLUG_PROLOG_POWEROFF:
                case HOTPLUG_EPILOG_POWEROFF:
                case BOOT_FAILURE:
                case PROLOG_FAILURE:
                case EPILOG_FAILURE:
                case EPILOG_UNDEPLOY_FAILURE:
                case PROLOG_MIGRATE_POWEROFF:
                case PROLOG_MIGRATE_POWEROFF_FAILURE:
                case BOOT_UNDEPLOY_FAILURE:
                case PROLOG_UNDEPLOY_FAILURE:
                case DISK_SNAPSHOT_POWEROFF:
                case DISK_SNAPSHOT_REVERT_POWEROFF:
                case DISK_SNAPSHOT_DELETE_POWEROFF:
                    break;

                default:
                    err = "configuration cannot be updated in state " + state_str();
                    return -1;
            };

        case INIT:
        case DONE:
        case SUSPENDED:
        case STOPPED:

            err = "configuration cannot be updated in state " + state_str();
            return -1;
    }

    // -------------------------------------------------------------------------
    // Update OS
    // -------------------------------------------------------------------------
    string os_names[] = {"ARCH", "MACHINE", "KERNEL", "INITRD", "BOOTLOADER",
        "BOOT"};

    replace_vector_values(obj_template, &tmpl, "OS", os_names, 6);

    if ( set_boot_order(obj_template, err) != 0 )
    {
        return -1;
    }

    // -------------------------------------------------------------------------
    // Update FEATURES:
    // -------------------------------------------------------------------------
    string features_names[] = {"PAE", "ACPI", "APIC", "LOCALTIME", "HYPERV",
        "GUEST_AGENT"};

    replace_vector_values(obj_template, &tmpl, "FEATURES", features_names, 6);

    // -------------------------------------------------------------------------
    // Update INPUT:
    // -------------------------------------------------------------------------
    string input_names[] = {"TYPE", "BUS"};

    replace_vector_values(obj_template, &tmpl, "INPUT", input_names, 2);

    // -------------------------------------------------------------------------
    // Update GRAPHICS:
    // -------------------------------------------------------------------------
    string graphics_names[] = {"TYPE", "LISTEN", "PASSWD", "KEYMAP"};

    replace_vector_values(obj_template, &tmpl, "GRAPHICS", graphics_names, 4);

    // -------------------------------------------------------------------------
    // Update RAW:
    // -------------------------------------------------------------------------
    string raw_names[] = {"TYPE", "DATA", "DATA_VMX"};

    replace_vector_values(obj_template, &tmpl, "RAW", raw_names, 3);

    // -------------------------------------------------------------------------
    // Update CONTEXT: any value
    // -------------------------------------------------------------------------
    VectorAttribute * context_bck = obj_template->get("CONTEXT");
    VectorAttribute * context_new = tmpl.get("CONTEXT");

    if ( context_bck == 0 && context_new != 0 )
    {
        err = "Virtual machine does not have context, cannot add a new one.";

        return -1;
    }
    else if ( context_bck != 0 && context_new != 0 )
    {
        context_new = context_new->clone();

        context_new->replace("TARGET",  context_bck->vector_value("TARGET"));
        context_new->replace("DISK_ID", context_bck->vector_value("DISK_ID"));

        obj_template->remove(context_bck);
        obj_template->set(context_new);

        if ( generate_token_context(context_new, err) != 0 ||
               generate_network_context(context_new, err) != 0  )
        {
            obj_template->erase("CONTEXT");
            obj_template->set(context_bck);

            return -1;
        }

        delete context_bck;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* VirtualMachine Disks Interface                                             */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::get_disk_images(string& error_str)
{
    vector<Attribute *> adisks;
    vector<Attribute *> acontext_disks;

    vector<Attribute*>::iterator it;

    int num_context = user_obj_template->remove("CONTEXT", acontext_disks);
    int num_disks   = user_obj_template->remove("DISK", adisks);

    for (it = acontext_disks.begin(); it != acontext_disks.end(); )
    {
        if ( (*it)->type() != Attribute::VECTOR )
        {
            delete *it;
            num_context--;
            it = acontext_disks.erase(it);
        }
        else
        {
            obj_template->set(*it);
            ++it;
        }
    }

    for (it = adisks.begin(); it != adisks.end(); )
    {
        if ( (*it)->type() != Attribute::VECTOR )
        {
            delete *it;
            num_disks--;
            it = adisks.erase(it);
        }
        else
        {
            obj_template->set(*it);
            ++it;
        }
    }

    if ( num_disks > 20 )
    {
        error_str = "Exceeded the maximum number of disks (20)";
        return -1;
    }

    VectorAttribute * context = 0;

    if ( num_context > 0 )
    {
        context = static_cast<VectorAttribute * >(acontext_disks[0]);
    }

    // -------------------------------------------------------------------------
    // Deployment mode for the VM disks
    // -------------------------------------------------------------------------
    std::string tm_mad_sys;

    if ( user_obj_template->get("TM_MAD_SYSTEM", tm_mad_sys) == true )
    {
        user_obj_template->erase("TM_MAD_SYSTEM");

        obj_template->add("TM_MAD_SYSTEM", tm_mad_sys);
    }

    return disks.get_images(oid, uid, tm_mad_sys, adisks, context, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::release_disk_images(vector<Template *>& quotas)
{
    bool image_error = (state == ACTIVE && lcm_state != EPILOG) &&
                        state != PENDING && state != HOLD &&
                        state != CLONING && state != CLONING_FAILURE;

    disks.release_images(oid, image_error, quotas);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::set_up_attach_disk(VirtualMachineTemplate * tmpl, string& err)
{
    VectorAttribute * new_vdisk = tmpl->get("DISK");

    if ( new_vdisk == 0 )
    {
        err = "Internal error parsing DISK attribute";
        return -1;
    }

    new_vdisk = new_vdisk->clone();

    VectorAttribute * context = get_template_attribute("CONTEXT");

    VirtualMachineDisk * new_disk;

    // -------------------------------------------------------------------------
    // Deployment mode for the VM disks
    // -------------------------------------------------------------------------
    std::string tm_mad_sys;

    obj_template->get("TM_MAD_SYSTEM", tm_mad_sys);

    new_disk = disks.set_up_attach(oid, uid, get_cid(), new_vdisk, tm_mad_sys, context, err);

    if ( new_disk == 0 )
    {
        delete new_vdisk;
        return -1;
    }

    // -------------------------------------------------------------------------
    // Add new disk to template and set info in history before attaching
    // -------------------------------------------------------------------------
    set_vm_info();

    obj_template->set(new_disk->vector_attribute());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* Disk save as interface                                                     */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::set_saveas_state()
{
    switch (state)
    {
        case ACTIVE:
            if (lcm_state != RUNNING)
            {
                return -1;
            }

            set_state(HOTPLUG_SAVEAS);
            break;

        case POWEROFF:
            set_state(ACTIVE);
            set_state(HOTPLUG_SAVEAS_POWEROFF);
            break;

        case SUSPENDED:
            set_state(ACTIVE);
            set_state(HOTPLUG_SAVEAS_SUSPENDED);
            break;

        default:
            return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::clear_saveas_state()
{
    switch (lcm_state)
    {
        case HOTPLUG_SAVEAS:
            set_state(RUNNING);
            break;

        case HOTPLUG_SAVEAS_POWEROFF:
            set_state(POWEROFF);
            set_state(LCM_INIT);
            break;

        case HOTPLUG_SAVEAS_SUSPENDED:
            set_state(SUSPENDED);
            set_state(LCM_INIT);
            break;

        default:
            return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* VirtualMachine Nic interface                                                */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::get_network_leases(string& estr)
{
    /* ---------------------------------------------------------------------- */
    /* Get the NIC attributes:                                                */
    /*   * NIC                                                                */
    /*   * PCI + TYPE = NIC                                                   */
    /* ---------------------------------------------------------------------- */
    vector<Attribute  * > anics;

    user_obj_template->remove("NIC", anics);

    for (vector<Attribute*>::iterator it = anics.begin(); it != anics.end(); )
    {
        if ( (*it)->type() != Attribute::VECTOR )
        {
            delete *it;
            it = anics.erase(it);
        }
        else
        {
            obj_template->set(*it);
            ++it;
        }
    }

    vector<VectorAttribute *> pcis;
    vector<VectorAttribute *>::iterator it;

    get_template_attribute("PCI", pcis);

    for (it =pcis.begin(); it != pcis.end(); ++it)
    {
        if ( (*it)->vector_value("TYPE") == "NIC" )
        {
            anics.push_back(*it);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Get the network leases & security groups for the NICs and PCIs         */
    /* ---------------------------------------------------------------------- */
    vector<VectorAttribute*> sgs;

    VectorAttribute * nic_default = obj_template->get("NIC_DEFAULT");

    if (nics.get_network_leases(oid, uid, anics, nic_default, sgs, estr) == -1)
    {
        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /* Get the associated secutiry groups for NICs and PCI TYPE=NIC           */
    /* ---------------------------------------------------------------------- */

    obj_template->set(sgs);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::set_up_attach_nic(VirtualMachineTemplate * tmpl, string& err)
{
    // -------------------------------------------------------------------------
    // Get the new NIC attribute from the template
    // -------------------------------------------------------------------------
    VectorAttribute * new_nic = tmpl->get("NIC");

    if ( new_nic == 0 )
    {
        err = "Wrong format or missing NIC attribute";
        return -1;
    }

    new_nic = new_nic->clone();

    // -------------------------------------------------------------------------
    // Setup nic for attachment
    // -------------------------------------------------------------------------
    vector<VectorAttribute *> sgs;

    VectorAttribute * nic_default = obj_template->get("NIC_DEFAULT");

    int rc = nics.set_up_attach_nic(oid, uid, get_cid(), new_nic, nic_default,
                sgs, err);

    if ( rc != 0 )
    {
        delete new_nic;
        return -1;
    }

    // -------------------------------------------------------------------------
    // Add new nic to template and set info in history before attaching
    // -------------------------------------------------------------------------
    set_vm_info();

    obj_template->set(new_nic);

    for(vector<VectorAttribute*>::iterator it=sgs.begin(); it!=sgs.end(); ++it)
    {
        obj_template->set(*it);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::set_detach_nic(int nic_id)
{
    VirtualMachineNic * nic = nics.get_nic(nic_id);

    if ( nic == 0 )
    {
        return -1;
    }

    nic->set_attach();

    clear_nic_context(nic_id);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* VirtualMachine VMGroup interface                                           */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::get_vmgroup(string& error)
{
    vector<Attribute  *> vmgroups;
    vector<Attribute*>::iterator it;

    bool found;
    VectorAttribute * thegroup = 0;

    user_obj_template->remove("VMGROUP", vmgroups);

    for (it = vmgroups.begin(), found = false; it != vmgroups.end(); )
    {
        if ( (*it)->type() != Attribute::VECTOR || found )
        {
            delete *it;
            it = vmgroups.erase(it);
        }
        else
        {
            thegroup = dynamic_cast<VectorAttribute *>(*it);
            found    = true;

            ++it;
        }
    }

    if ( thegroup == 0 )
    {
        return 0;
    }

    VMGroupPool * vmgrouppool = Nebula::instance().get_vmgrouppool();
    int rc;

    rc = vmgrouppool->vmgroup_attribute(thegroup, get_uid(), get_oid(), error);

    if ( rc != 0 )
    {
        delete thegroup;

        return -1;
    }

    obj_template->set(thegroup);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::release_vmgroup()
{
    VectorAttribute * thegroup = obj_template->get("VMGROUP");

    if ( thegroup == 0 )
    {
        return;
    }

    VMGroupPool * vmgrouppool = Nebula::instance().get_vmgrouppool();

    vmgrouppool->del_vm(thegroup, get_oid());
}

