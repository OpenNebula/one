/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#include "VirtualMachineManagerDriver.h"
#include "NebulaLog.h"
#include "LifeCycleManager.h"

#include "Nebula.h"
#include "NebulaUtil.h"
#include <sstream>

using namespace std;


const string VirtualMachineManagerDriver::imported_actions_default =
        "shutdown, shutdown-hard, hold, release, suspend, resume, delete, reboot, "
        "reboot-hard, resched, unresched, disk-attach, disk-detach, nic-attach, "
        "nic-detach, snap-create, snap-delete";

const string VirtualMachineManagerDriver::imported_actions_default_public =
        "shutdown, shutdown-hard, hold, release, suspend, resume, delete, reboot, "
        "reboot-hard, resched, unresched, disk-attach, disk-detach, nic-attach, "
        "nic-detach, snap-create, snap-delete, poweroff, poweroff-hard";

VirtualMachineManagerDriver::VirtualMachineManagerDriver(
        const string             &mad_location,
        const map<string, string> &attrs):
    Driver(),
    driver_conf(true),
    keep_snapshots(false),
    ds_live_migration(false),
    cold_nic_attach(false),
    live_resize(false),
    support_shareable_(false)
{
    char *          error_msg = nullptr;
    const char *    cfile;
    string          file;
    int             rc;
    string          action_defaults;

    auto it = attrs.find("DEFAULT");

    if ( it != attrs.end() )
    {
        if (it->second[0] != '/') //Look in ONE_LOCATION/etc or in "/etc/one"
        {
            Nebula& nd = Nebula::instance();

            file  = nd.get_defaults_location() + it->second;
            cfile = file.c_str();
        }
        else //Absolute Path
        {
            cfile = it->second.c_str();
        }

        rc = driver_conf.parse(cfile, &error_msg);

        if ( rc != 0 )
        {
            ostringstream   oss;

            if ( error_msg != nullptr )
            {
                oss << "Error loading driver configuration file " << cfile <<
                    " : " << error_msg;

                free(error_msg);
            }
            else
            {
                oss << "Error loading driver configuration file " << cfile;
            }

            NebulaLog::log("VMM", Log::ERROR, oss);
        }
    }

    // -------------------------------------------------------------------------
    // Copy the configuration attributes to driver conf
    // -------------------------------------------------------------------------
    for (it=attrs.begin(); it != attrs.end(); ++it)
    {
        driver_conf.replace(it->first, it->second);
    }

    // -------------------------------------------------------------------------
    // Parse KEEP_SNAPSHOTS
    // -------------------------------------------------------------------------
    driver_conf.get("KEEP_SNAPSHOTS", keep_snapshots);

    // -------------------------------------------------------------------------
    // Parse DS_LIVE_MIGRATION
    // -------------------------------------------------------------------------
    driver_conf.get("DS_LIVE_MIGRATION", ds_live_migration);

    // -------------------------------------------------------------------------
    // Parse COLD_NIC_ATTACH
    // -------------------------------------------------------------------------
    driver_conf.get("COLD_NIC_ATTACH", cold_nic_attach);

    driver_conf.get("LIVE_RESIZE", live_resize);

    driver_conf.get("SUPPORT_SHAREABLE", support_shareable_);

    // -------------------------------------------------------------------------
    // Parse IMPORTED_VMS_ACTIONS string and init the action set
    // -------------------------------------------------------------------------
    it = attrs.find("IMPORTED_VMS_ACTIONS");

    if (it != attrs.end())
    {
        action_defaults = it->second;
    }
    else
    {
        NebulaLog::log("VMM", Log::INFO, "Using default imported VMs actions");

        it = attrs.find("NAME");

        if (it != attrs.end())
        {
            if ( it->second == "kvm" || it->second == "xen" )
            {
                action_defaults = imported_actions_default;
            }
            else if ( it->second == "sl" || it->second == "ec2" ||
                      it->second == "az" || it->second == "vcenter" )
            {
                action_defaults = imported_actions_default_public;
            }
        }
    }

    vector<string> actions;

    VMActions::Action id;

    actions = one_util::split(action_defaults, ',');

    for (auto action : actions)
    {
        action = one_util::trim(action);

        if ( VMActions::action_from_str(action, id) != 0 )
        {
            NebulaLog::log("VMM", Log::ERROR, "Wrong action: " + action);
            continue;
        }

        imported_actions.set(id);
    }

    string name, exec, args;
    driver_conf.get("NAME", name);
    driver_conf.get("EXECUTABLE", exec);
    driver_conf.get("ARGUMENTS", args);
    int  threads;

    driver_conf.get("THREADS", threads);

    //NebulaLog::info("DrM", "Loading driver: " + name);

    if (exec.empty())
    {
        NebulaLog::error("VMM", "\tEmpty executable for driver: " + name);
        return;
    }

    if (exec[0] != '/') //Look in ONE_LOCATION/lib/mads or in "/usr/lib/one/mads"
    {
        exec = mad_location + exec;
    }

    if (access(exec.c_str(), F_OK) != 0)
    {
        NebulaLog::error("VMM", "File not exists: " + exec);
    }

    cmd_(exec);
    arg_(args);
    concurency_(threads);
}
