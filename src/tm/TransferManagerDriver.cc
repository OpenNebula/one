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

#include "TransferManagerDriver.h"
#include "NebulaLog.h"
#include "LifeCycleManager.h"

#include "Nebula.h"
#include <sstream>

/* ************************************************************************** */
/* Driver ASCII Protocol Implementation                                       */
/* ************************************************************************** */

void TransferManagerDriver::transfer (
        const int oid,
        const string& xfr_file) const
{
    ostringstream os;

    os << "TRANSFER " << oid << " " << xfr_file << endl;

    write(os);
};


/* ************************************************************************** */
/* MAD Interface                                                              */
/* ************************************************************************** */

void TransferManagerDriver::protocol(
    string&     message)
{
    istringstream           is(message);
    ostringstream           os;

    string                  action;
    string                  result;

    int                     id;
    VirtualMachine *        vm;

    os << "Message received: " << message;
    NebulaLog::log("TM", Log::DEBUG, os);

    // Parse the driver message
    if ( is.good() )
        is >> action >> ws;
    else
        return;

    if ( is.good() )
        is >> result >> ws;
    else
        return;

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
                NebulaLog::log("TM",log_type(result[0]), info.c_str());
            }

            return;
        }
    }
    else
        return;

    // Get the VM from the pool
    vm = vmpool->get(id,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::CLEANUP ||
         vm->get_lcm_state() == VirtualMachine::FAILURE ||
         vm->get_lcm_state() == VirtualMachine::LCM_INIT )
    {
        os.str("");
        os << "Ignored: " << message;
        vm->log("TM",Log::WARNING,os);

        vm->unlock();
        return;
    }

    // Driver Actions
    if (action == "TRANSFER")
    {
        Nebula              &ne = Nebula::instance();
        LifeCycleManager *  lcm = ne.get_lcm();

        LifeCycleManager::Actions lcm_action;

        if (result == "SUCCESS")
        {
            switch (vm->get_lcm_state())
            {
                case VirtualMachine::PROLOG:
                case VirtualMachine::PROLOG_MIGRATE:
                case VirtualMachine::PROLOG_RESUME:
                    lcm_action = LifeCycleManager::PROLOG_SUCCESS;
                    break;

                case VirtualMachine::EPILOG:
                case VirtualMachine::EPILOG_STOP:
                    lcm_action = LifeCycleManager::EPILOG_SUCCESS;
                    break;

                default:
                    goto error_state;
            }
        }
        else
        {
            string info;

            getline(is,info);

            os.str("");
            os << "Error executing image transfer script";
            
            if (!info.empty() && info[0] != '-')
            {
                os << ": " << info;

                vm->set_template_error_message(os.str());
                vmpool->update(vm);
            }
            
            vm->log("TM",Log::ERROR,os);

            switch (vm->get_lcm_state())
            {
                case VirtualMachine::PROLOG:
                case VirtualMachine::PROLOG_MIGRATE:
                case VirtualMachine::PROLOG_RESUME:
                    lcm_action = LifeCycleManager::PROLOG_FAILURE;
                    break;

                case VirtualMachine::EPILOG:
                case VirtualMachine::EPILOG_STOP:
                    lcm_action = LifeCycleManager::EPILOG_FAILURE;
                    break;

                default:
                    goto error_state;
            }
        }

        lcm->trigger(lcm_action, id);
    }
    else if (action == "LOG")
    {
        string info;

        getline(is,info);
        vm->log("TM",log_type(result[0]),info.c_str());
    }

    vm->unlock();

    return;

error_state:
    os.str("");
    os << "Wrong state in TM answer for VM " << id;

    vm->log("TM",Log::ERROR,os);

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TransferManagerDriver::recover()
{
    NebulaLog::log("TM",Log::INFO,"Recovering TM drivers");
}
