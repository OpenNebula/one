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
                                       vector<const Attribute *> hook_mads)
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
    const  string& stemplate,
    int *          oid,
    bool           on_hold)
{
    VirtualMachine * vm;
    string  name;

    char *  error_msg;
    int     rc, num_context, num_reqs;

    vector<Attribute *> context;
    vector<Attribute *> reqs;

    // ------------------------------------------------------------------------
    // Build a new Virtual Machine object
    // ------------------------------------------------------------------------
    vm = new VirtualMachine;

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
    // Parse template and keep CONTEXT apart
    // ------------------------------------------------------------------------
    rc = vm->vm_template.parse(stemplate,&error_msg);

    if ( rc != 0 )
    {
        ostringstream oss;

        oss << error_msg;
        NebulaLog::log("ONE", Log::ERROR, oss);
        free(error_msg);

        delete vm;

        return -2;
    }

    num_context = vm->vm_template.remove("CONTEXT",context);
    num_reqs    = vm->vm_template.remove("REQUIREMENTS",reqs);

    // ------------------------------------------------------------------------
    // Insert the Object in the pool
    // ------------------------------------------------------------------------

    *oid = PoolSQL::allocate(vm);

    if ( *oid == -1 )
    {
        return -1;
    }

   // ------------------------------------------------------------------------
    // Insert parsed context in the VM template and clean-up
    // ------------------------------------------------------------------------

    if ( num_context > 0)
    {
        generate_context(*oid,context[0]);

        for (int i = 0; i < num_context ; i++)
        {
            if (context[i] != 0)
            {
                delete context[i];
            }
        }
    }

    // ------------------------------------------------------------------------
    // Parse the Requirements
    // ------------------------------------------------------------------------

    if ( num_reqs > 0 )
    {
        generate_requirements(*oid,reqs[0]);

        for (int i = 0; i < num_reqs ; i++)
        {
            if (reqs[i] != 0)
            {
                delete reqs[i];
            }
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

    os << "last_poll > 0 and last_poll <= " << last_poll << " and"
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

void VirtualMachinePool::generate_context(int vm_id, Attribute * attr)
{
    VirtualMachine *  vm;
    VectorAttribute * context_parsed;
    VectorAttribute * context;

    string *          str;
    string            parsed;

    int               rc;

    char *            error_msg;

    context = dynamic_cast<VectorAttribute *>(attr);

    if (context == 0)
    {
        return;
    }

    str = context->marshall(" @^_^@ ");

    if (str == 0)
    {
        return;
    }

    rc = VirtualMachine::parse_template_attribute(vm_id,*str,parsed,&error_msg);

    if ( rc != 0 )
    {
        if (error_msg != 0)
        {
            ostringstream oss;

            oss << error_msg << ": " << *str;
            free(error_msg);

            NebulaLog::log("ONE", Log::ERROR, oss);
        }

        delete str;

        return;
    }

    delete str;

    context_parsed = new VectorAttribute("CONTEXT");
    context_parsed->unmarshall(parsed," @^_^@ ");

    vm = get(vm_id,true);

    if ( vm == 0 )
    {
        delete context_parsed;
        return;
    }

    if ( vm->insert_template_attribute(db,context_parsed) != 0 )
    {
        delete context_parsed;
    }

    vm->unlock();
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachinePool::generate_requirements(int vm_id, Attribute * attr)
{
    SingleAttribute * reqs;
    string            parsed;
    char *            error_msg;
    int               rc;

    SingleAttribute * reqs_parsed;
    VirtualMachine *  vm;

    reqs = dynamic_cast<SingleAttribute *>(attr);

    if (reqs == 0)
    {
        return;
    }

    rc = VirtualMachine::parse_template_attribute(vm_id,reqs->value(),
            parsed,&error_msg);

    if ( rc != 0 )
    {
        if (error_msg != 0)
        {
            ostringstream oss;

            oss << error_msg << ": " << reqs->value();
            free(error_msg);

            NebulaLog::log("ONE", Log::ERROR, oss);
        }

        return;
    }

    reqs_parsed = new SingleAttribute("REQUIREMENTS",parsed);

    vm = get(vm_id,true);

    if ( vm == 0 )
    {
        delete reqs_parsed;
        return;
    }

    if ( vm->insert_template_attribute(db,reqs_parsed) != 0 )
    {
        delete reqs_parsed;
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int  VirtualMachinePool::dump_cb(void * _oss,int num,char **values,char **names)
{
    ostringstream * oss;

    oss = static_cast<ostringstream *>(_oss);

    return VirtualMachine::dump(*oss, num, values, names);
}

/* -------------------------------------------------------------------------- */

int VirtualMachinePool::dump(ostringstream& oss, const string& where)
{
    int             rc;
    ostringstream   cmd;

    oss << "<VM_POOL>";

    set_callback(
        static_cast<Callbackable::Callback>(&VirtualMachinePool::dump_cb),
        static_cast<void *>(&oss));

    cmd << "SELECT " << VirtualMachine::table << ".*, user_pool.user_name, "
        << History::table << ".* FROM " << VirtualMachine::table
        << " LEFT OUTER JOIN " << History::table << " ON "
        << VirtualMachine::table << ".oid = " << History::table << ".vid AND "
        << History::table << ".seq = " << VirtualMachine::table
        << ".last_seq LEFT OUTER JOIN (SELECT oid,user_name FROM user_pool) "
        << "AS user_pool ON " << VirtualMachine::table << ".uid = user_pool.oid"
        << " WHERE " << VirtualMachine::table << ".state <> 6";

    if ( !where.empty() )
    {
        cmd << " AND " << where;
    }

    rc = db->exec(cmd,this);

    oss << "</VM_POOL>";

    unset_callback();

    return rc;
}
