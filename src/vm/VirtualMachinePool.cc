/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "VirtualMachinePool.h"
#include "VirtualMachineHook.h"

#include "NebulaLog.h"
#include "Nebula.h"

#include <sstream>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

time_t VirtualMachinePool::_monitor_expiration;
bool   VirtualMachinePool::_submit_on_hold;


const char * VirtualMachinePool::import_table = "vm_import";

const char * VirtualMachinePool::import_db_names = "deploy_id, vmid";

const char * VirtualMachinePool::import_db_bootstrap =
    "CREATE TABLE IF NOT EXISTS vm_import "
    "(deploy_id VARCHAR(128), vmid INTEGER, PRIMARY KEY(deploy_id))";


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachinePool::VirtualMachinePool(
        SqlDB *                     db,
        vector<const Attribute *>   hook_mads,
        const string&               hook_location,
        const string&               remotes_location,
        vector<const Attribute *>&  restricted_attrs,
        time_t                      expire_time,
        bool                        on_hold)
    : PoolSQL(db, VirtualMachine::table, true, false)
{
    const VectorAttribute * vattr;

    string name;
    string on;
    string cmd;
    string arg;
    bool   remote;

    bool state_hook = false;

    _monitor_expiration = expire_time;
    _submit_on_hold = on_hold;

    if ( _monitor_expiration == 0 )
    {
        clean_all_monitoring();
    }

    for (unsigned int i = 0 ; i < hook_mads.size() ; i++ )
    {
        vattr = static_cast<const VectorAttribute *>(hook_mads[i]);

        name = vattr->vector_value("NAME");
        on   = vattr->vector_value("ON");
        cmd  = vattr->vector_value("COMMAND");
        arg  = vattr->vector_value("ARGUMENTS");
        vattr->vector_value("REMOTE", remote);

        transform (on.begin(),on.end(),on.begin(),(int(*)(int))toupper);

        if ( on.empty() || cmd.empty() )
        {
            ostringstream oss;

            oss << "Empty ON or COMMAND attribute in VM_HOOK. Hook "
                << "not registered!";
            NebulaLog::log("VM",Log::WARNING,oss);

            continue;
        }

        if ( name.empty() )
        {
            name = cmd;
        }

        if (cmd[0] != '/')
        {
            ostringstream cmd_os;

            if ( remote )
            {
                cmd_os << hook_location << "/" << cmd;
            }
            else
            {
                cmd_os << remotes_location << "/hooks/" << cmd;
            }

            cmd = cmd_os.str();
        }

        if ( on == "CREATE" )
        {
            AllocateHook * hook;

            hook = new AllocateHook(name, cmd, arg, false);

            add_hook(hook);
        }
        else if ( on == "PROLOG" )
        {
            VirtualMachineStateHook * hook;

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                           VirtualMachine::PROLOG, VirtualMachine::ACTIVE);
            add_hook(hook);

            state_hook = true;
        }
        else if ( on == "RUNNING" )
        {
            VirtualMachineStateHook * hook;

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                           VirtualMachine::RUNNING, VirtualMachine::ACTIVE);
            add_hook(hook);

            state_hook = true;
        }
        else if ( on == "SHUTDOWN" )
        {
            VirtualMachineStateHook * hook;

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                            VirtualMachine::EPILOG, VirtualMachine::ACTIVE);
            add_hook(hook);

            state_hook = true;
        }
        else if ( on == "STOP" )
        {
            VirtualMachineStateHook * hook;

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                            VirtualMachine::LCM_INIT, VirtualMachine::STOPPED);
            add_hook(hook);

            state_hook = true;
        }
        else if ( on == "DONE" )
        {
            VirtualMachineStateHook * hook;

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                            VirtualMachine::LCM_INIT, VirtualMachine::DONE);
            add_hook(hook);

            state_hook = true;
        }
        else if ( on == "FAILED" )
        {
            VirtualMachineStateHook * hook;

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                            VirtualMachine::LCM_INIT, VirtualMachine::FAILED);
            add_hook(hook);

            state_hook = true;
        }
        else if ( on == "UNKNOWN" )
        {
            VirtualMachineStateHook * hook;

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                            VirtualMachine::UNKNOWN, VirtualMachine::ACTIVE);
            add_hook(hook);

            state_hook = true;
        }
        else if ( on == "CUSTOM" )
        {
            VirtualMachineStateHook * hook;

            string lcm_str = vattr->vector_value("LCM_STATE");
            string vm_str  = vattr->vector_value("STATE");

            VirtualMachine::LcmState lcm_state;
            VirtualMachine::VmState vm_state;

            if ( VirtualMachine::lcm_state_from_str(lcm_str, lcm_state) != 0 )
            {
                ostringstream oss;
                oss << "Wrong LCM_STATE: "<< lcm_str <<". Hook not registered!";

                NebulaLog::log("VM",Log::WARNING,oss);
                continue;
            }

            if ( VirtualMachine::vm_state_from_str(vm_str, vm_state) != 0 )
            {
                ostringstream oss;
                oss << "Wrong STATE: "<< vm_str <<". Hook not registered!";

                NebulaLog::log("VM",Log::WARNING,oss);
                continue;
            }

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                    lcm_state, vm_state);

            add_hook(hook);

            state_hook = true;
        }
        else
        {
            ostringstream oss;

            oss << "Unknown VM_HOOK " << on << ". Hook not registered!";
            NebulaLog::log("VM",Log::WARNING,oss);
        }
    }

    if ( state_hook )
    {
        VirtualMachineUpdateStateHook * hook;

        hook = new VirtualMachineUpdateStateHook();

        add_hook(hook);
    }

    // Set restricted attributes
    VirtualMachineTemplate::set_restricted_attributes(restricted_attrs);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::insert_index(const string& deploy_id, int vmid, 
    bool replace)
{
    ostringstream oss;
    char *        deploy_name = db->escape_str(deploy_id.c_str());

    if (deploy_name == 0)
    {
        return -1;
    }

    if (replace)
    {
        oss << "REPLACE ";
    }
    else
    {
        oss << "INSERT ";
    }

    oss << "INTO " << import_table << " ("<< import_db_names <<") "
        << " VALUES ('" << deploy_name << "'," << vmid << ")";

    db->free_str(deploy_name);

    return db->exec(oss);
};

/* -------------------------------------------------------------------------- */

void VirtualMachinePool::drop_index(const string& deploy_id)
{
    ostringstream oss;
    char *        deploy_name = db->escape_str(deploy_id.c_str());

    if (deploy_name == 0)
    {
        return;
    }

    oss << "DELETE FROM " << import_table << " WHERE deploy_id='" 
        << deploy_name << "'";

    db->exec(oss);
}

/* -------------------------------------------------------------------------- */

int VirtualMachinePool::allocate (
    int            uid,
    int            gid,
    const string&  uname,
    const string&  gname,
    int            umask,
    VirtualMachineTemplate * vm_template,
    int *          oid,
    string&        error_str,
    bool           on_hold)
{
    VirtualMachine * vm;
    
    string deploy_id;

    // ------------------------------------------------------------------------
    // Build a new Virtual Machine object
    // ------------------------------------------------------------------------
    vm = new VirtualMachine(-1, uid, gid, uname, gname, umask, vm_template);
    
    if ( _submit_on_hold == true || on_hold )
    {
        vm->state = VirtualMachine::HOLD;
    }
    else
    {
        vm->state = VirtualMachine::PENDING;
    }

    vm->user_obj_template->get("IMPORT_VM_ID", deploy_id);
    
    if (!deploy_id.empty())
    {
        vm->state = VirtualMachine::HOLD;

        if (insert_index(deploy_id, -1, false) == -1) //Set import in progress
        {
            delete vm;

            error_str = "Virtual Machine " + deploy_id + " already imported.";
            return -1;
        }
    }

    // ------------------------------------------------------------------------
    // Insert the Object in the pool
    // ------------------------------------------------------------------------

    *oid = PoolSQL::allocate(vm, error_str);

    // ------------------------------------------------------------------------
    // Insert the deploy_id - vmid index for imported VMs
    // ------------------------------------------------------------------------

    if (!deploy_id.empty())
    {
        if (*oid >= 0)
        {
            insert_index(deploy_id, *oid, true);
        }
        else
        {
            drop_index(deploy_id);
        }
    }

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::get_running(
    vector<int>&    oids,
    int             vm_limit,
    time_t          last_poll)
{
    ostringstream   os;
    string          where;

    os << "last_poll <= " << last_poll << " and"
       << " state = " << VirtualMachine::ACTIVE
       << " and ( lcm_state = " << VirtualMachine::RUNNING
       << " or lcm_state = " << VirtualMachine::UNKNOWN << " )"
       << " ORDER BY last_poll ASC LIMIT " << vm_limit;

    where = os.str();

    return PoolSQL::search(oids,VirtualMachine::table,where);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::get_pending(
    vector<int>&    oids)
{
    ostringstream   os;
    string          where;

    os << "state = " << VirtualMachine::PENDING;

    where = os.str();

    return PoolSQL::search(oids,VirtualMachine::table,where);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::dump_acct(ostringstream& oss,
                                  const string&  where,
                                  int            time_start,
                                  int            time_end)
{
    ostringstream cmd;

    cmd << "SELECT " << History::table << ".body FROM " << History::table
        << " INNER JOIN " << VirtualMachine::table
        << " WHERE vid=oid";

    if ( !where.empty() )
    {
        cmd << " AND " << where;
    }

    if ( time_start != -1 || time_end != -1 )
    {
        if ( time_start != -1 )
        {
            cmd << " AND (etime > " << time_start << " OR  etime = 0)";
        }

        if ( time_end != -1 )
        {
            cmd << " AND stime < " << time_end;
        }
    }

    cmd << " ORDER BY vid,seq";

    return PoolSQL::dump(oss, "HISTORY_RECORDS", cmd);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::clean_expired_monitoring()
{
    if ( _monitor_expiration == 0 )
    {
        return 0;
    }

    time_t          max_last_poll;
    int             rc;
    ostringstream   oss;

    max_last_poll = time(0) - _monitor_expiration;

    oss << "DELETE FROM " << VirtualMachine::monit_table
        << " WHERE last_poll < " << max_last_poll;

    rc = db->exec(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::clean_all_monitoring()
{
    ostringstream   oss;
    int             rc;

    oss << "DELETE FROM " << VirtualMachine::monit_table;

    rc = db->exec(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::dump_monitoring(
        ostringstream& oss,
        const string&  where)
{
    ostringstream cmd;

    cmd << "SELECT " << VirtualMachine::monit_table << ".body FROM "
        << VirtualMachine::monit_table
        << " INNER JOIN " << VirtualMachine::table
        << " WHERE vmid = oid";

    if ( !where.empty() )
    {
        cmd << " AND " << where;
    }

    cmd << " ORDER BY vmid, " << VirtualMachine::monit_table << ".last_poll;";

    return PoolSQL::dump(oss, "MONITORING_DATA", cmd);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::db_int_cb(void * _min_stime, int num, char **values, char **names)
{
    if ( num == 0 || values == 0 || values[0] == 0 )
    {
        return -1;
    }

    *static_cast<int*>(_min_stime) = atoi(values[0]);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::get_vmid (const string& deploy_id)
{
    int rc;
    int vmid = -1; 
    ostringstream oss;

    set_callback(static_cast<Callbackable::Callback>(&VirtualMachinePool::db_int_cb),
                 static_cast<void *>(&vmid));

    oss << "SELECT vmid FROM " << import_table 
        << " WHERE deploy_id = '" << db->escape_str(deploy_id.c_str()) << "'";

    rc = db->exec(oss, this);

    unset_callback();

    if (rc != 0 )
    {
        return -1;
    }

    return vmid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
