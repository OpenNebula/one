/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#include "VMActionSet.h"
#include "NebulaUtil.h"
#include "Template.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

AuthRequest::Operation VMActionSet::get_auth_op(History::VMAction action) const
{
    if (admin_actions.is_set(action))
    {
        return AuthRequest::ADMIN;
    }
    else if (manage_actions.is_set(action))
    {
        return AuthRequest::MANAGE;
    }
    else if (use_actions.is_set(action))
    {
        return AuthRequest::USE;
    }

    return AuthRequest::NONE;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMActionSet::set_auth_ops(const Template& tmpl, string& error)
{
    std::string admin, manage, use;

    tmpl.get("VM_ADMIN_OPERATIONS", admin);
    if (set_auth_ops(admin, admin_actions, error) != 0)
    {
        return -1;
    }

    tmpl.get("VM_MANAGE_OPERATIONS", manage);
    if (set_auth_ops(manage, manage_actions, error) != 0)
    {
        return -1;
    }

    tmpl.get("VM_USE_OPERATIONS", use);
    if (set_auth_ops(use, use_actions, error) != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMActionSet::set_auth_ops(const string& ops_str,
        ActionSet<History::VMAction>& ops_set, string& error)
{
    std::set<std::string> ops;

    one_util::split_unique(ops_str, ',', ops);

    for (const string& op : ops)
    {
        std::string the_op = one_util::trim(op);

        one_util::tolower(the_op);

        if ( the_op == "migrate" )
        {
            ops_set.set(History::MIGRATE_ACTION);
            ops_set.set(History::LIVE_MIGRATE_ACTION);
        }
        else if ( the_op == "delete" )
        {
            ops_set.set(History::DELETE_ACTION);
            ops_set.set(History::DELETE_RECREATE_ACTION);
        }
        else if ( the_op == "recover" )
        {
            ops_set.set(History::RECOVER_ACTION);
        }
        else if ( the_op == "retry" )
        {
            ops_set.set(History::RETRY_ACTION);
        }
        else if ( the_op == "deploy" )
        {
            ops_set.set(History::DEPLOY_ACTION);
        }
        else if ( the_op == "resched" )
        {
            ops_set.set(History::RESCHED_ACTION);
            ops_set.set(History::UNRESCHED_ACTION);
        }
        else if ( the_op == "undeploy" )
        {
            ops_set.set(History::UNDEPLOY_ACTION);
            ops_set.set(History::UNDEPLOY_HARD_ACTION);
        }
        else if ( the_op == "hold" )
        {
            ops_set.set(History::HOLD_ACTION);
        }
        else if ( the_op == "release" )
        {
            ops_set.set(History::RELEASE_ACTION);
        }
        else if ( the_op == "stop" )
        {
            ops_set.set(History::STOP_ACTION);
        }
        else if ( the_op == "suspend" )
        {
            ops_set.set(History::SUSPEND_ACTION);
        }
        else if ( the_op == "resume" )
        {
            ops_set.set(History::RESUME_ACTION);
        }
        else if ( the_op == "reboot" )
        {
            ops_set.set(History::REBOOT_ACTION);
            ops_set.set(History::REBOOT_HARD_ACTION);
        }
        else if ( the_op == "poweroff" )
        {
            ops_set.set(History::POWEROFF_ACTION);
            ops_set.set(History::POWEROFF_HARD_ACTION);
        }
        else if ( the_op == "disk-attach" )
        {
            ops_set.set(History::DISK_ATTACH_ACTION);
            ops_set.set(History::DISK_DETACH_ACTION);
        }
        else if ( the_op == "nic-attach" )
        {
            ops_set.set(History::NIC_ATTACH_ACTION);
            ops_set.set(History::NIC_DETACH_ACTION);
        }
        else if ( the_op == "disk-snapshot" )
        {
            ops_set.set(History::DISK_SNAPSHOT_CREATE_ACTION);
            ops_set.set(History::DISK_SNAPSHOT_DELETE_ACTION);
            ops_set.set(History::DISK_SNAPSHOT_REVERT_ACTION);
            ops_set.set(History::DISK_SNAPSHOT_RENAME_ACTION);
        }
        else if ( the_op == "terminate" )
        {
            ops_set.set(History::TERMINATE_ACTION);
            ops_set.set(History::TERMINATE_HARD_ACTION);
        }
        else if ( the_op == "disk-resize" )
        {
            ops_set.set(History::DISK_RESIZE_ACTION);
        }
        else if ( the_op == "snapshot" )
        {
            ops_set.set(History::SNAPSHOT_CREATE_ACTION);
            ops_set.set(History::SNAPSHOT_DELETE_ACTION);
            ops_set.set(History::SNAPSHOT_REVERT_ACTION);
        }
        else if ( the_op == "updateconf" )
        {
            ops_set.set(History::UPDATECONF_ACTION);
        }
        else if ( the_op == "rename" )
        {
            ops_set.set(History::RENAME_ACTION);
        }
        else if ( the_op == "resize" )
        {
            ops_set.set(History::RESIZE_ACTION);
        }
        else if ( the_op == "update" )
        {
            ops_set.set(History::UPDATE_ACTION);
        }
        else if ( the_op == "disk-saveas" )
        {
            ops_set.set(History::DISK_SAVEAS_ACTION);
        }
        else
        {
            error = "Unknown vm operation: " + the_op;
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
