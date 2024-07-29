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

#include "VMActions.h"
#include "NebulaUtil.h"
#include "Template.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

AuthRequest::Operation VMActions::get_auth_op(Action action) const
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

int VMActions::set_auth_ops(const Template& tmpl, string& error)
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

int VMActions::set_auth_ops(const string& ops_str,
                            ActionSet<Action>& ops_set, string& error)
{
    std::set<std::string> ops;

    one_util::split_unique(ops_str, ',', ops);

    for (const string& op : ops)
    {
        std::string the_op = one_util::trim(op);

        one_util::tolower(the_op);

        if ( the_op == "migrate" )
        {
            ops_set.set(MIGRATE_ACTION);
            ops_set.set(LIVE_MIGRATE_ACTION);
            ops_set.set(POFF_MIGRATE_ACTION);
            ops_set.set(POFF_HARD_MIGRATE_ACTION);
        }
        else if ( the_op == "delete" )
        {
            ops_set.set(DELETE_ACTION);
            ops_set.set(DELETE_RECREATE_ACTION);
        }
        else if ( the_op == "recover" )
        {
            ops_set.set(RECOVER_ACTION);
        }
        else if ( the_op == "retry" )
        {
            ops_set.set(RETRY_ACTION);
        }
        else if ( the_op == "deploy" )
        {
            ops_set.set(DEPLOY_ACTION);
        }
        else if ( the_op == "resched" )
        {
            ops_set.set(RESCHED_ACTION);
            ops_set.set(UNRESCHED_ACTION);
        }
        else if ( the_op == "undeploy" )
        {
            ops_set.set(UNDEPLOY_ACTION);
            ops_set.set(UNDEPLOY_HARD_ACTION);
        }
        else if ( the_op == "hold" )
        {
            ops_set.set(HOLD_ACTION);
        }
        else if ( the_op == "release" )
        {
            ops_set.set(RELEASE_ACTION);
        }
        else if ( the_op == "stop" )
        {
            ops_set.set(STOP_ACTION);
        }
        else if ( the_op == "suspend" )
        {
            ops_set.set(SUSPEND_ACTION);
        }
        else if ( the_op == "resume" )
        {
            ops_set.set(RESUME_ACTION);
        }
        else if ( the_op == "reboot" )
        {
            ops_set.set(REBOOT_ACTION);
            ops_set.set(REBOOT_HARD_ACTION);
        }
        else if ( the_op == "poweroff" )
        {
            ops_set.set(POWEROFF_ACTION);
            ops_set.set(POWEROFF_HARD_ACTION);
        }
        else if ( the_op == "disk-attach" )
        {
            ops_set.set(DISK_ATTACH_ACTION);
            ops_set.set(DISK_DETACH_ACTION);
        }
        else if ( the_op == "nic-attach" )
        {
            ops_set.set(NIC_ATTACH_ACTION);
            ops_set.set(NIC_DETACH_ACTION);
            ops_set.set(ALIAS_ATTACH_ACTION);
            ops_set.set(ALIAS_DETACH_ACTION);
            ops_set.set(NIC_UPDATE_ACTION);
        }
        else if ( the_op == "disk-snapshot" )
        {
            ops_set.set(DISK_SNAPSHOT_CREATE_ACTION);
            ops_set.set(DISK_SNAPSHOT_DELETE_ACTION);
            ops_set.set(DISK_SNAPSHOT_REVERT_ACTION);
            ops_set.set(DISK_SNAPSHOT_RENAME_ACTION);
        }
        else if ( the_op == "terminate" )
        {
            ops_set.set(TERMINATE_ACTION);
            ops_set.set(TERMINATE_HARD_ACTION);
        }
        else if ( the_op == "disk-resize" )
        {
            ops_set.set(DISK_RESIZE_ACTION);
        }
        else if ( the_op == "snapshot" )
        {
            ops_set.set(SNAPSHOT_CREATE_ACTION);
            ops_set.set(SNAPSHOT_DELETE_ACTION);
            ops_set.set(SNAPSHOT_REVERT_ACTION);
        }
        else if ( the_op == "updateconf" )
        {
            ops_set.set(UPDATECONF_ACTION);
        }
        else if ( the_op == "rename" )
        {
            ops_set.set(RENAME_ACTION);
        }
        else if ( the_op == "resize" )
        {
            ops_set.set(RESIZE_ACTION);
        }
        else if ( the_op == "update" )
        {
            ops_set.set(UPDATE_ACTION);
        }
        else if ( the_op == "disk-saveas" )
        {
            ops_set.set(DISK_SAVEAS_ACTION);
        }
        else if ( the_op == "backup" )
        {
            ops_set.set(BACKUP_ACTION);
            ops_set.set(BACKUP_CANCEL_ACTION);
        }
        else if ( the_op == "sched-action" )
        {
            ops_set.set(SCHED_ADD_ACTION);
            ops_set.set(SCHED_UPDATE_ACTION);
            ops_set.set(SCHED_DELETE_ACTION);
        }
        else if ( the_op == "sg-attach" )
        {
            ops_set.set(SG_ATTACH_ACTION);
            ops_set.set(SG_DETACH_ACTION);
        }
        else if ( the_op == "pci-attach" )
        {
            ops_set.set(PCI_ATTACH_ACTION);
            ops_set.set(PCI_DETACH_ACTION);
        }
        else if ( the_op == "restore" )
        {
            ops_set.set(RESTORE_ACTION);
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

string VMActions::action_to_str(Action action)
{
    string st;

    switch (action)
    {
        case MIGRATE_ACTION:
            st = "migrate";
            break;
        case POFF_MIGRATE_ACTION:
            st = "poweroff-migrate";
            break;
        case POFF_HARD_MIGRATE_ACTION:
            st = "poweroff-hard-migrate";
            break;
        case LIVE_MIGRATE_ACTION:
            st = "live-migrate";
            break;
        case TERMINATE_ACTION:
            st = "terminate";
            break;
        case TERMINATE_HARD_ACTION:
            st = "terminate-hard";
            break;
        case UNDEPLOY_ACTION:
            st = "undeploy";
            break;
        case UNDEPLOY_HARD_ACTION:
            st = "undeploy-hard";
            break;
        case HOLD_ACTION:
            st = "hold";
            break;
        case RELEASE_ACTION:
            st = "release";
            break;
        case STOP_ACTION:
            st = "stop";
            break;
        case SUSPEND_ACTION:
            st = "suspend";
            break;
        case RESUME_ACTION:
            st = "resume";
            break;
        case DELETE_ACTION:
            st = "delete";
            break;
        case DELETE_RECREATE_ACTION:
            st = "delete-recreate";
            break;
        case REBOOT_ACTION:
            st = "reboot";
            break;
        case REBOOT_HARD_ACTION:
            st = "reboot-hard";
            break;
        case RESCHED_ACTION:
            st = "resched";
            break;
        case UNRESCHED_ACTION:
            st = "unresched";
            break;
        case POWEROFF_ACTION:
            st = "poweroff";
            break;
        case POWEROFF_HARD_ACTION:
            st = "poweroff-hard";
            break;
        case DISK_ATTACH_ACTION:
            st = "disk-attach";
            break;
        case DISK_DETACH_ACTION:
            st = "disk-detach";
            break;
        case NIC_ATTACH_ACTION:
            st = "nic-attach";
            break;
        case NIC_DETACH_ACTION:
            st = "nic-detach";
            break;
        case ALIAS_ATTACH_ACTION:
            st = "alias-attach";
            break;
        case ALIAS_DETACH_ACTION:
            st = "alias-detach";
            break;
        case DISK_SNAPSHOT_CREATE_ACTION:
            st = "disk-snapshot-create";
            break;
        case DISK_SNAPSHOT_DELETE_ACTION:
            st = "disk-snapshot-delete";
            break;
        case DISK_SNAPSHOT_RENAME_ACTION:
            st = "disk-snapshot-rename";
            break;
        case DISK_RESIZE_ACTION:
            st = "disk-resize";
            break;
        case DEPLOY_ACTION:
            st = "deploy";
            break;
        case CHOWN_ACTION:
            st = "chown";
            break;
        case CHMOD_ACTION:
            st = "chmod";
            break;
        case UPDATECONF_ACTION:
            st = "updateconf";
            break;
        case RENAME_ACTION:
            st = "rename";
            break;
        case RESIZE_ACTION:
            st = "resize";
            break;
        case UPDATE_ACTION:
            st = "update";
            break;
        case SNAPSHOT_CREATE_ACTION:
            st = "snapshot-create";
            break;
        case SNAPSHOT_DELETE_ACTION:
            st = "snapshot-delete";
            break;
        case SNAPSHOT_REVERT_ACTION:
            st = "snapshot-revert";
            break;
        case DISK_SAVEAS_ACTION:
            st = "disk-saveas";
            break;
        case DISK_SNAPSHOT_REVERT_ACTION:
            st = "disk-snapshot-revert";
            break;
        case RECOVER_ACTION:
            st = "recover";
            break;
        case RETRY_ACTION:
            st = "retry";
            break;
        case MONITOR_ACTION:
            st = "monitor";
            break;
        case BACKUP_ACTION:
            st = "backup";
            break;
        case BACKUP_CANCEL_ACTION:
            st = "backup-cancel";
            break;
        case NIC_UPDATE_ACTION:
            st = "nic-update";
            break;
        case SCHED_ADD_ACTION:
            st = "sched-add";
            break;
        case SCHED_UPDATE_ACTION:
            st = "sched-update";
            break;
        case SCHED_DELETE_ACTION:
            st = "sched-delete";
            break;
        case SG_ATTACH_ACTION:
            st = "sg-attach";
            break;
        case SG_DETACH_ACTION:
            st = "sg-detach";
            break;
        case PCI_ATTACH_ACTION:
            st = "pci-attach";
            break;
        case PCI_DETACH_ACTION:
            st = "pci-detach";
            break;
        case RESTORE_ACTION:
            st = "restore";
            break;
        case NONE_ACTION:
            st = "none";
            break;
    }

    return st;
};

int VMActions::action_from_str(const string& st, Action& action)
{
    if (st == "migrate")
    {
        action = MIGRATE_ACTION;
    }
    else if (st == "live-migrate")
    {
        action = LIVE_MIGRATE_ACTION;
    }
    else if (st == "terminate")
    {
        action = TERMINATE_ACTION;
    }
    else if (st == "terminate-hard")
    {
        action = TERMINATE_HARD_ACTION;
    }
    else if (st == "undeploy")
    {
        action = UNDEPLOY_ACTION;
    }
    else if (st == "undeploy-hard")
    {
        action = UNDEPLOY_HARD_ACTION;
    }
    else if (st == "hold")
    {
        action = HOLD_ACTION;
    }
    else if (st == "release")
    {
        action = RELEASE_ACTION;
    }
    else if (st == "stop")
    {
        action = STOP_ACTION;
    }
    else if (st == "suspend")
    {
        action = SUSPEND_ACTION;
    }
    else if (st == "resume")
    {
        action = RESUME_ACTION;
    }
    else if (st == "delete")
    {
        action = DELETE_ACTION;
    }
    else if (st == "delete-recreate")
    {
        action = DELETE_RECREATE_ACTION;
    }
    else if (st == "reboot")
    {
        action = REBOOT_ACTION;
    }
    else if (st == "reboot-hard")
    {
        action = REBOOT_HARD_ACTION;
    }
    else if (st == "resched")
    {
        action = RESCHED_ACTION;
    }
    else if (st == "unresched")
    {
        action = UNRESCHED_ACTION;
    }
    else if (st == "poweroff")
    {
        action = POWEROFF_ACTION;
    }
    else if (st == "poweroff-hard")
    {
        action = POWEROFF_HARD_ACTION;
    }
    else if (st == "disk-attach")
    {
        action = DISK_ATTACH_ACTION;
    }
    else if (st == "disk-detach")
    {
        action = DISK_DETACH_ACTION;
    }
    else if (st == "nic-attach")
    {
        action = NIC_ATTACH_ACTION;
    }
    else if (st == "nic-detach")
    {
        action = NIC_DETACH_ACTION;
    }
    else if (st == "alias-attach")
    {
        action = ALIAS_ATTACH_ACTION;
    }
    else if (st == "alias-detach")
    {
        action = ALIAS_DETACH_ACTION;
    }
    else if (st == "poweroff-migrate")
    {
        action = POFF_MIGRATE_ACTION;
    }
    else if (st == "poweroff-hard-migrate")
    {
        action = POFF_HARD_MIGRATE_ACTION;
    }
    else if (st == "disk-snapshot-create")
    {
        action = DISK_SNAPSHOT_CREATE_ACTION;
    }
    else if (st == "disk-snapshot-snap-delete")
    {
        action = DISK_SNAPSHOT_DELETE_ACTION;
    }
    else if (st == "disk-snapshot-rename")
    {
        action = DISK_SNAPSHOT_RENAME_ACTION;
    }
    else if (st == "disk-resize")
    {
        action = DISK_RESIZE_ACTION;
    }
    else if ( st == "deploy")
    {
        action = DEPLOY_ACTION;
    }
    else if ( st == "chown")
    {
        action = CHOWN_ACTION;
    }
    else if ( st == "chmod")
    {
        action = CHMOD_ACTION;
    }
    else if ( st == "updateconf")
    {
        action = UPDATECONF_ACTION;
    }
    else if ( st == "rename")
    {
        action = RENAME_ACTION;
    }
    else if ( st == "resize")
    {
        action = RESIZE_ACTION;
    }
    else if ( st == "update")
    {
        action = UPDATE_ACTION;
    }
    else if ( st == "snapshot-create")
    {
        action = SNAPSHOT_CREATE_ACTION;
    }
    else if ( st == "snapshot-delete")
    {
        action = SNAPSHOT_DELETE_ACTION;
    }
    else if ( st == "snapshot-revert")
    {
        action = SNAPSHOT_REVERT_ACTION;
    }
    else if ( st == "disk-saveas")
    {
        action = DISK_SAVEAS_ACTION;
    }
    else if ( st == "disk-snapshot-revert")
    {
        action = DISK_SNAPSHOT_REVERT_ACTION;
    }
    else if ( st == "recover")
    {
        action = RECOVER_ACTION;
    }
    else if ( st == "retry")
    {
        action = RETRY_ACTION;
    }
    else if ( st == "monitor")
    {
        action = MONITOR_ACTION;
    }
    else if ( st == "backup")
    {
        action = BACKUP_ACTION;
    }
    else if ( st == "nic-update")
    {
        action = NIC_UPDATE_ACTION;
    }
    else if ( st == "backup-cancel")
    {
        action = BACKUP_CANCEL_ACTION;
    }
    else if ( st == "sched-add")
    {
        action = SCHED_ADD_ACTION;
    }
    else if ( st == "sched-update")
    {
        action = SCHED_UPDATE_ACTION;
    }
    else if ( st == "sched-delete")
    {
        action = SCHED_DELETE_ACTION;
    }
    else if ( st == "sg-attach")
    {
        action = SG_ATTACH_ACTION;
    }
    else if ( st == "sg-detach")
    {
        action = SG_DETACH_ACTION;
    }
    else if ( st == "pci-attach")
    {
        action = PCI_ATTACH_ACTION;
    }
    else if ( st == "pci-detach")
    {
        action = PCI_DETACH_ACTION;
    }
    else if ( st == "restore")
    {
        action = RESTORE_ACTION;
    }
    else
    {
        action = NONE_ACTION;
        return -1;
    }

    return 0;
};
