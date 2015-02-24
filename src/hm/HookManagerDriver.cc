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

#include "HookManagerDriver.h"
#include "NebulaLog.h"
#include <sstream>

/* ************************************************************************** */
/* Driver ASCII Protocol Implementation                                       */
/* ************************************************************************** */

void HookManagerDriver::execute(
        int             oid,
        const string&   hook_name,
        const string&   command,
        const string&   arguments ) const
{
    ostringstream oss;

    oss << "EXECUTE " << oid << " " << hook_name << " LOCAL " << command << " ";

    if ( arguments.empty() )
    {
        oss << "-" << endl;
    }
    else
    {
        oss << arguments << endl;
    }

    write(oss);
}

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

void HookManagerDriver::execute(
        int             oid,
        const string&   hook_name,
        const string&   host_name,
        const string&   command,
        const string&   arguments ) const
{
    ostringstream oss;

    oss << "EXECUTE " << oid << " " << hook_name << " " << host_name << " "
        << command << " ";

    if ( arguments.empty() )
    {
        oss << "-" << endl;
    }
    else
    {
        oss << arguments << endl;
    }

    write(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookManagerDriver::protocol(const string& message) const
{
    istringstream   is(message);
    //stores the action name
    string          action;
    //stores the action result
    string          result;
    //stores the action id of the asociated VM
    int             id;

    ostringstream    os;
    string           hinfo;
    VirtualMachine * vm;

    // Parse the driver message

    os << "Message received: " << message;
    NebulaLog::log("HKM", Log::DEBUG, os);

    // Parse the driver message
    if ( is.good() )
    {
        is >> action >> ws;
    }
    else
    {
        return;
    }

    if ( is.good() )
    {
        is >> result >> ws;
    }
    else
    {
        return;
    }

    if ( is.good() )
    {
        is >> id >> ws;

        if ( is.fail() )
        {
            if ( action == "LOG" )
            {
                string info;

                is.clear();
                getline(is,info);
                NebulaLog::log("HKM", log_type(result[0]), info.c_str());
            }

            return;
        }
    }
    else
    {
        return;
    }

    vm = vmpool->get(id,true);

    if ( vm == 0 )
    {
        return;
    }

    // -------------------------------------------------------------------------
    // Protocol implementation
    // -------------------------------------------------------------------------

    if ( action == "EXECUTE" )
    {
        ostringstream oss;

        string hook_name;
        string info;

        if ( is.good() )
        {
            getline(is,hook_name);
        }

        getline (is,info);

        if (result == "SUCCESS")
        {
            oss << "Success executing Hook: " << hook_name << ". " << info;
            vm->log("HKM",Log::INFO,oss);
        }
        else
        {
            oss << "Error executing Hook: " << hook_name << ". " << info;

            if ( !info.empty() && info[0] != '-' )
            {
                vm->set_template_error_message(oss.str());
                vmpool->update(vm);
            }

            vm->log("HKM",Log::ERROR,oss);
        }
    }
    else if (action == "LOG")
    {
        string info;

        getline(is,info);
        vm->log("HKM",log_type(result[0]),info.c_str());
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookManagerDriver::recover()
{
    NebulaLog::log("HKM", Log::ERROR, "Hook driver crashed, recovering...");

}
