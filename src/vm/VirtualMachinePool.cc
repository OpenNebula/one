/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

VirtualMachinePool::VirtualMachinePool(SqlDB *                   db,
                                       vector<const Attribute *> hook_mads,
                                       const string& hook_location)
    : PoolSQL(db,VirtualMachine::table)
{
    const VectorAttribute * vattr;

    string name;
    string on;
    string cmd;
    string arg;
    string rmt;
    bool   remote;

    bool state_hook = false;

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
            cmd = hook_location + cmd;
        }

        if ( on == "CREATE" )
        {
            VirtualMachineAllocateHook * hook;

            hook = new VirtualMachineAllocateHook(name,cmd,arg);

            add_hook(hook);
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
        else
        {
            ostringstream oss;

            oss << "Unkown VM_HOOK " << on << ". Hook not registered!";
            NebulaLog::log("VM",Log::WARNING,oss);
        }
    }

    if ( state_hook )
    {
        VirtualMachineUpdateStateHook * hook;

        hook = new VirtualMachineUpdateStateHook();

        add_hook(hook);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::allocate (
    int            uid,
    VirtualMachineTemplate * vm_template,
    int *          oid,
    string&        error_str,
    bool           on_hold)
{
    VirtualMachine * vm;

    // ------------------------------------------------------------------------
    // Build a new Virtual Machine object
    // ------------------------------------------------------------------------
    vm = new VirtualMachine(-1,vm_template);

    if (on_hold == true)
    {
        vm->state = VirtualMachine::HOLD;
    }
    else
    {
        vm->state = VirtualMachine::PENDING;
    }

    vm->uid = uid;

    // ------------------------------------------------------------------------
    // Insert the Object in the pool
    // ------------------------------------------------------------------------

    *oid = PoolSQL::allocate(vm,error_str);

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

int  VirtualMachinePool::dump_cb(void * _oss,int num,char **values,char **names)
{
    ostringstream * oss;

    oss = static_cast<ostringstream *>(_oss);

    return VirtualMachine::dump(*oss, num, values, names);
}

int  VirtualMachinePool::dump_extended_cb(
                                void * _oss,int num,char **values,char **names)
{
    ostringstream * oss;

    oss = static_cast<ostringstream *>(_oss);

    return VirtualMachine::dump_extended(*oss, num, values, names);
}

/* -------------------------------------------------------------------------- */

int VirtualMachinePool::dump(   ostringstream&  oss,
                                bool            extended,
                                int             state,
                                const string&   where)
{
    int             rc;
    ostringstream   cmd;

    oss << "<VM_POOL>";

    if(extended)
    {
        set_callback(
            static_cast<Callbackable::Callback>(
                                        &VirtualMachinePool::dump_extended_cb),
            static_cast<void *>(&oss));

        cmd << "SELECT " << VirtualMachine::table << ".*, user_pool.user_name, "
        << History::table << ".* FROM " << VirtualMachine::table
        << " LEFT OUTER JOIN " << History::table << " ON "
        << VirtualMachine::table << ".oid = " << History::table << ".vid AND "
        << History::table << ".seq = " << VirtualMachine::table
        << ".last_seq LEFT OUTER JOIN (SELECT oid,user_name FROM user_pool) "
        << "AS user_pool ON " << VirtualMachine::table << ".uid = user_pool.oid";
    }
    else
    {
        set_callback(
            static_cast<Callbackable::Callback>(&VirtualMachinePool::dump_cb),
            static_cast<void *>(&oss));

        cmd << "SELECT * FROM " << VirtualMachine::table;
    }

    if ( state != -1 )
    {
        cmd << " WHERE " << VirtualMachine::table << ".state = " << state;
    }
    else
    {
        cmd << " WHERE " << VirtualMachine::table << ".state <> 6";
    }

    if ( !where.empty() )
    {
        cmd << " AND " << where;
    }

    rc = db->exec(cmd,this);

    oss << "</VM_POOL>";

    unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
