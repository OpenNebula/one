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

void TransferManagerDriver::protocol(const string& message) const
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

    if ( vm->get_lcm_state() == VirtualMachine::LCM_INIT )
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

        LCMAction::Actions lcm_action;

        if (result == "SUCCESS")
        {
            switch (vm->get_lcm_state())
            {
                case VirtualMachine::PROLOG:
                case VirtualMachine::PROLOG_MIGRATE:
                case VirtualMachine::PROLOG_RESUME:
                case VirtualMachine::PROLOG_UNDEPLOY:
                case VirtualMachine::PROLOG_MIGRATE_POWEROFF:
                case VirtualMachine::PROLOG_MIGRATE_SUSPEND:
                case VirtualMachine::PROLOG_MIGRATE_UNKNOWN:
                    lcm_action = LCMAction::PROLOG_SUCCESS;
                    break;

                case VirtualMachine::EPILOG:
                case VirtualMachine::EPILOG_STOP:
                case VirtualMachine::EPILOG_UNDEPLOY:
                case VirtualMachine::CLEANUP_RESUBMIT:
                    lcm_action = LCMAction::EPILOG_SUCCESS;
                    break;

                case VirtualMachine::HOTPLUG_SAVEAS:
                case VirtualMachine::HOTPLUG_SAVEAS_POWEROFF:
                case VirtualMachine::HOTPLUG_SAVEAS_SUSPENDED:
                    lcm_action = LCMAction::SAVEAS_SUCCESS;
                    break;

                case VirtualMachine::HOTPLUG_PROLOG_POWEROFF:
                    lcm_action = LCMAction::ATTACH_SUCCESS;
                    break;

                case VirtualMachine::HOTPLUG_EPILOG_POWEROFF:
                    lcm_action = LCMAction::DETACH_SUCCESS;
                    break;

                case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
                case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
                case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
                case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
                case VirtualMachine::DISK_SNAPSHOT_REVERT_SUSPENDED:
                case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
                case VirtualMachine::DISK_SNAPSHOT_DELETE:
                    lcm_action = LCMAction::DISK_SNAPSHOT_SUCCESS;
                    break;

                case VirtualMachine::DISK_RESIZE_POWEROFF:
                case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
                    lcm_action = LCMAction::DISK_RESIZE_SUCCESS;
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
                case VirtualMachine::PROLOG_UNDEPLOY:
                case VirtualMachine::PROLOG_MIGRATE_POWEROFF:
                case VirtualMachine::PROLOG_MIGRATE_SUSPEND:
                case VirtualMachine::PROLOG_MIGRATE_UNKNOWN:
                    lcm_action = LCMAction::PROLOG_FAILURE;
                    break;

                case VirtualMachine::EPILOG:
                case VirtualMachine::EPILOG_STOP:
                case VirtualMachine::EPILOG_UNDEPLOY:
                case VirtualMachine::CLEANUP_RESUBMIT:
                    lcm_action = LCMAction::EPILOG_FAILURE;
                    break;

                case VirtualMachine::HOTPLUG_SAVEAS:
                case VirtualMachine::HOTPLUG_SAVEAS_POWEROFF:
                case VirtualMachine::HOTPLUG_SAVEAS_SUSPENDED:
                    lcm_action = LCMAction::SAVEAS_FAILURE;
                    break;

                case VirtualMachine::HOTPLUG_PROLOG_POWEROFF:
                    lcm_action = LCMAction::ATTACH_FAILURE;
                    break;

                case VirtualMachine::HOTPLUG_EPILOG_POWEROFF:
                    lcm_action = LCMAction::DETACH_FAILURE;
                    break;

                case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
                case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
                case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
                case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
                case VirtualMachine::DISK_SNAPSHOT_REVERT_SUSPENDED:
                case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
                case VirtualMachine::DISK_SNAPSHOT_DELETE:
                    lcm_action = LCMAction::DISK_SNAPSHOT_FAILURE;
                    break;

                case VirtualMachine::DISK_RESIZE_POWEROFF:
                case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
                    lcm_action = LCMAction::DISK_RESIZE_FAILURE;
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
