/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#ifndef VMACTIONS_H
#define VMACTIONS_H

#include "ActionSet.h"
#include "AuthRequest.h"

class Template;

class VMActions
{
public:

    enum Action
    {                                       //Associated XML-RPC API call
        NONE_ACTION            = 0,         // "one.vm.migrate"
        MIGRATE_ACTION         = 1,         // "one.vm.migrate"
        LIVE_MIGRATE_ACTION    = 2,
        //SHUTDOWN_ACTION        = 3,
        //SHUTDOWN_HARD_ACTION   = 4,
        UNDEPLOY_ACTION        = 5,         // "one.vm.action"
        UNDEPLOY_HARD_ACTION   = 6,         // "one.vm.action"
        HOLD_ACTION            = 7,         // "one.vm.action"
        RELEASE_ACTION         = 8,         // "one.vm.action"
        STOP_ACTION            = 9,         // "one.vm.action"
        SUSPEND_ACTION         = 10,        // "one.vm.action"
        RESUME_ACTION          = 11,        // "one.vm.action"
        //BOOT_ACTION            = 12,
        DELETE_ACTION          = 13,        // "one.vm.recover"
        DELETE_RECREATE_ACTION = 14,        // "one.vm.recover"
        REBOOT_ACTION          = 15,        // "one.vm.action"
        REBOOT_HARD_ACTION     = 16,        // "one.vm.action"
        RESCHED_ACTION         = 17,        // "one.vm.action"
        UNRESCHED_ACTION       = 18,        // "one.vm.action"
        POWEROFF_ACTION        = 19,        // "one.vm.action"
        POWEROFF_HARD_ACTION   = 20,        // "one.vm.action"
        DISK_ATTACH_ACTION     = 21,        // "one.vm.attach"
        DISK_DETACH_ACTION     = 22,        // "one.vm.detach"
        NIC_ATTACH_ACTION      = 23,        // "one.vm.attachnic"
        NIC_DETACH_ACTION      = 24,        // "one.vm.detachnic"
        DISK_SNAPSHOT_CREATE_ACTION = 25,   // "one.vm.disksnapshotcreate"
        DISK_SNAPSHOT_DELETE_ACTION = 26,   // "one.vm.disksnapshotdelete"
        TERMINATE_ACTION       = 27,        // "one.vm.action"
        TERMINATE_HARD_ACTION  = 28,        // "one.vm.action"
        DISK_RESIZE_ACTION     = 29,        // "one.vm.diskresize"
        DEPLOY_ACTION          = 30,        // "one.vm.deploy"
        CHOWN_ACTION           = 31,        // "one.vm.chown"
        CHMOD_ACTION           = 32,        // "one.vm.chmod"
        UPDATECONF_ACTION      = 33,        // "one.vm.updateconf"
        RENAME_ACTION          = 34,        // "one.vm.rename"
        RESIZE_ACTION          = 35,        // "one.vm.resize"
        UPDATE_ACTION          = 36,        // "one.vm.update"
        SNAPSHOT_CREATE_ACTION = 37,        // "one.vm.snapshotcreate"
        SNAPSHOT_DELETE_ACTION = 38,        // "one.vm.snapshotdelete"
        SNAPSHOT_REVERT_ACTION = 39,        // "one.vm.snapshotrevert"
        DISK_SAVEAS_ACTION     = 40,        // "one.vm.disksaveas"
        DISK_SNAPSHOT_REVERT_ACTION = 41,   // "one.vm.disksnapshotrevert"
        RECOVER_ACTION         = 42,        // "one.vm.recover"
        RETRY_ACTION           = 43,        // "one.vm.recover"
        MONITOR_ACTION         = 44,        // internal, monitoring process
        DISK_SNAPSHOT_RENAME_ACTION = 45,   // "one.vm.disksnapshotrename"
        ALIAS_ATTACH_ACTION      = 46,      // "one.vm.attachnic"
        ALIAS_DETACH_ACTION      = 47,      // "one.vm.detachnic"
        POFF_MIGRATE_ACTION      = 48,      // "one.vm.migrate"
        POFF_HARD_MIGRATE_ACTION = 49,      // "one.vm.migrate"
        BACKUP_ACTION            = 50,      // "one.vm.backup"
        NIC_UPDATE_ACTION        = 51,      // "one.vm.updatenic"
        BACKUP_CANCEL_ACTION     = 52,      // "one.vm.backupcancel"
        SCHED_ADD_ACTION         = 53,      // "one.vm.schedadd"
        SCHED_UPDATE_ACTION      = 54,      // "one.vm.schedupdate"
        SCHED_DELETE_ACTION      = 55,      // "one.vm.scheddelete"
        SG_ATTACH_ACTION         = 56,      // "one.vm.attachsg"
        SG_DETACH_ACTION         = 57,      // "one.vm.detachsg"
    };

    static std::string action_to_str(Action action);

    static int action_from_str(const std::string& st, Action& action);

    /**
     * @return true if action requires ADMIN right
     */
    bool is_admin(Action action) const
    {
        return admin_actions.is_set(action);
    }

    /**
     * @return true if action requires ADMIN right
     */
    bool is_use(Action action) const
    {
        return use_actions.is_set(action);
    }

    /**
     * @return true if action requires ADMIN right
     */
    bool is_manage(Action action) const
    {
        return manage_actions.is_set(action);
    }

    /**
     * @return the auth type for the given action
     */
    AuthRequest::Operation get_auth_op(Action action) const;

    /**
     *  Sets the auth operations based on the provided template
     */
    int set_auth_ops(const Template& tmpl, std::string& error);

private:
    /**
     *  Set of VM actions that require USE permission
     */
    ActionSet<Action> use_actions;

    /**
     *  Set of VM actions that require MANAGE permission
     */
    ActionSet<Action> manage_actions;

    /**
     *  Set of VM actions that require ADMIN permission
     */
    ActionSet<Action> admin_actions;

    /**
     *  Returns action set from a string of actions seperated by commas
     */
    int set_auth_ops(const std::string& ops_str,
       ActionSet<Action>& ops_set, std::string& error);
};

#endif /*VMACTIONS_H*/
