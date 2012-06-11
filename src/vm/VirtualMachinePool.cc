/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#include <sstream>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

time_t VirtualMachinePool::_monitor_expiration;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachinePool::VirtualMachinePool(
        SqlDB *                     db,
        vector<const Attribute *>   hook_mads,
        const string&               hook_location,
        const string&               remotes_location,
        vector<const Attribute *>&  restricted_attrs,
        time_t                      expire_time)
    : PoolSQL(db, VirtualMachine::table, false)
{
    const VectorAttribute * vattr;

    string name;
    string on;
    string cmd;
    string arg;
    string rmt;
    bool   remote;

    bool state_hook = false;

    _monitor_expiration = expire_time;

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
        rmt  = vattr->vector_value("REMOTE");

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

        remote = false;

        if ( !rmt.empty() )
        {
            transform(rmt.begin(),rmt.end(),rmt.begin(),(int(*)(int))toupper);

            if ( rmt == "YES" )
            {
                remote = true;
            }
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
            VirtualMachineAllocateHook * hook;

            hook = new VirtualMachineAllocateHook(name,cmd,arg);

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

int VirtualMachinePool::allocate (
    int            uid,
    int            gid,
    const string&  uname,
    const string&  gname,
    VirtualMachineTemplate * vm_template,
    int *          oid,
    string&        error_str,
    bool           on_hold)
{
    VirtualMachine * vm;

    // ------------------------------------------------------------------------
    // Build a new Virtual Machine object
    // ------------------------------------------------------------------------
    vm = new VirtualMachine(-1, uid, gid, uname, gname, vm_template);

    if (on_hold == true)
    {
        vm->state = VirtualMachine::HOLD;
    }
    else
    {
        vm->state = VirtualMachine::PENDING;
    }
    
    // ------------------------------------------------------------------------
    // Insert the Object in the pool
    // ------------------------------------------------------------------------

    *oid = PoolSQL::allocate(vm, error_str);

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

    cmd << " GROUP BY vid,seq";

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
