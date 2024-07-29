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

#ifndef SCHEDULED_ACTION_MANAGER_H_
#define SCHEDULED_ACTION_MANAGER_H_

#include "Listener.h"
#include "ScheduledAction.h"

class BackupJob;
class BackupJobPool;
class ScheduledActionPool;
class VirtualMachinePool;

/**
 * Scheduled Action Manager - launches scheduled actions, executes Backup Jobs
 * This class should in future replace the standalone Scheduler
 */
class ScheduledActionManager
{
public:
    ScheduledActionManager(time_t timer, int max_backups, int max_backups_host);

    void finalize();

private:
    friend class ScheduledActions;

    Timer timer_thread;

    BackupJobPool *bj_pool;

    ScheduledActionPool *sa_pool;

    VirtualMachinePool *vm_pool;

    int _max_backups;
    int _max_backups_host;

    int active_backups;

    /*
     * Count backups per host map<host_id, backups_count>
     */
    std::map<int, int> host_backups;

    /*
     * List of backups to run <sa_id, vm_id>
     */
    std::vector<std::pair<int, int>> vm_backups;

    // Periodically called method,
    void timer_action();

    /*
     * Manages Virtual Machine scheduled actions
     */
    void scheduled_vm_actions();

    /*
     *
     */
    void update_backup_counters();

    /*
     * Run Virtual Machine Scheduled backups
     */
    void run_vm_backups();

    /*
     * Manages Backup Job scheduled actions
     */
    void scheduled_backup_jobs();

    /*
     * Manages backups created by BackupJob
     */
    void backup_jobs();

    void run_scheduled_action_vm(int vm_id, int sa_id, const std::string& aname);

    int vm_action_call(int vmid, int sa_id, std::string& error);
};

#endif /*SCHEDULE_MANAGER_H_*/

