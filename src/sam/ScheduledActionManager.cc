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

#include "ScheduledActionManager.h"
#include "Nebula.h"
#include "BackupJob.h"
#include "BackupJobPool.h"
#include "ScheduledActionPool.h"
#include "VirtualMachinePool.h"
#include "DispatchManager.h"
#include "RequestManagerVirtualMachine.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ScheduledActionManager::ScheduledActionManager(time_t timer,
                                               int max_backups,
                                               int max_backups_host)
    : timer_thread(timer, [this](){timer_action();})
    , _max_backups(max_backups)
    , _max_backups_host(max_backups_host)
{
    NebulaLog::info("SCH", "Staring Scheduled Action Manager...");

    auto& nd = Nebula::instance();

    bj_pool = nd.get_bjpool();
    vm_pool = nd.get_vmpool();
    sa_pool = nd.get_sapool();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ScheduledActionManager::finalize()
{
    timer_thread.stop();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ScheduledActionManager::timer_action()
{
    scheduled_vm_actions();

    update_backup_counters();

    run_vm_backups();

    scheduled_backup_jobs();

    backup_jobs();

    vm_backups.clear();

    host_backups.clear();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ScheduledActionManager::scheduled_vm_actions()
{
    // Get due Scheduled Actions from DB (only one action per VM)
    auto actions_to_launch = sa_pool->get_is_due_actions(PoolObjectSQL::VM);

    set<int> processed_vms;

    for (const auto& action : actions_to_launch)
    {
        auto vm_id = action.second;

        if (processed_vms.count(vm_id) > 0)
        {
            continue;
        }

        processed_vms.insert(vm_id);

        auto sa = sa_pool->get_ro(action.first);

        if (!sa)
        {
            continue;
        }

        if (sa->action() == "backup")
        {
            vm_backups.push_back(action);

            return;
        }

        auto aname = sa->action();

        sa.release();

        run_scheduled_action_vm(vm_id, action.first, aname);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ScheduledActionManager::update_backup_counters()
{
    // Read VMs in backup state, make a map with host backups count
    vector<int> backups;

    vm_pool->get_backup(backups);

    active_backups = backups.size();

    for (auto vm_id : backups)
    {
        auto vm = vm_pool->get_ro(vm_id);

        if (!vm)
        {
            continue;
        }

        auto hid = vm->get_hid();
        auto it  = host_backups.find(hid);

        if ( it == host_backups.end() )
        {
            host_backups.insert(std::pair<int, int>(hid, 1));
        }
        else
        {
            ++it->second;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ScheduledActionManager::run_vm_backups()
{
    for (auto backup : vm_backups)
    {
        int sa_id = backup.first;
        int vm_id = backup.second;

        /* ------------------------------------------------------------------ */
        /* Backup jobs consistency checks:                                    */
        /*  - Active backups vs max_backups                                   */
        /*  - Active backups in host per max_backups_host                     */
        /*  - VM still exists                                                 */
        /* ------------------------------------------------------------------ */
        if (_max_backups != 0 && active_backups >= _max_backups)
        {
            ostringstream oss;
            oss << "Reached max number of active backups (" << _max_backups << ")";

            NebulaLog::debug("SCH", oss.str());
            break;
        }

        auto vm = vm_pool->get_ro(vm_id);

        if (!vm)
        {
            ostringstream oss;
            oss << "Unable scheduled backup for non-exist VM: " << vm_id;

            NebulaLog::debug("SCH", oss.str());
            continue;
        }

        // Check max backups host
        int hid = vm->get_hid();

        if (_max_backups_host != 0 && host_backups[hid] >= _max_backups_host)
        {
            std::ostringstream oss;
            oss << "Reached max number of host backups (" << _max_backups_host
                << ") for host " << vm->get_hid();

            NebulaLog::debug("SCH", oss.str());
            break;
        }

        vm.reset();

        run_scheduled_action_vm(vm_id, sa_id, "backup");

        /* ------------------------------------------------------------------ */
        /* Update backup counters                                             */
        /* ------------------------------------------------------------------ */
        ++active_backups;
        ++host_backups[hid];
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ScheduledActionManager::scheduled_backup_jobs()
{
    // Get IDs of Backup Jobs with due Scheduled Actions from DB
    auto actions_to_launch = sa_pool->get_is_due_actions(PoolObjectSQL::BACKUPJOB);

    set<int> processed_bjs;

    for (const auto& action : actions_to_launch)
    {
        std::ostringstream oss;
        std::string        error;

        auto bj_id = action.second;

        if (processed_bjs.count(bj_id) > 0)
        {
            continue;
        }

        processed_bjs.insert(bj_id);

        auto bj = bj_pool->get(bj_id);
        auto sa = sa_pool->get(action.first);

        if (!bj || !sa)
        {
            continue;
        }

        oss << "Executing action '" << sa->action() << "' for Backup Job "
            << bj->get_oid() << " : ";

        if (bj->execute(error) == 0)
        {
            sa->log_error("");

            sa->next_action();

            oss << "Success.";

            NebulaLog::info("SCH", oss.str());
        }
        else
        {
            std::ostringstream oss_aux;

            oss_aux << one_util::log_time(time(0)) << " : " << error;

            sa->log_error(oss_aux.str());

            oss << "Failure. " << error;

            NebulaLog::error("SCH", oss.str());
        }

        sa_pool->update(sa.get());
        bj_pool->update(bj.get());
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ScheduledActionManager::backup_jobs()
{
    // Get Backup Jobs by priority and start VM backups
    auto bj_ids = bj_pool->active();

    for (auto bj_id : bj_ids)
    {
        auto bj = bj_pool->get(bj_id);

        if (!bj)
        {
            continue;
        }

        // Copy (not reference) of outdated and backing_up vms (modified in loop)
        auto vms = bj->backup_vms();

        auto outdated   = bj->outdated();
        auto backing_up = bj->backing_up();

        auto mode  = bj->exec_mode();
        auto ds_id = bj->ds_id();
        auto reset = bj->reset();

        for (auto vm_id : vms)
        {
            if (!outdated.count(vm_id))
            {
                continue;
            }

            /* -------------------------------------------------------------- */
            /* Backup jobs consistency checks:                                */
            /*  - Active backups vs SEQUENTIAL                                */
            /*  - Active backups vs max_backups                               */
            /*  - Active backups in host per max_backups_host                 */
            /*  - VM is not in DONE                                           */
            /*  - VM still exists                                             */
            /* -------------------------------------------------------------- */
            if (mode == BackupJob::SEQUENTIAL && backing_up.size() >= 1)
            {
                ostringstream oss;

                oss << "BackupJob " << bj_id << ": waiting for a active backup to complete";
                NebulaLog::debug("SCH", oss.str());

                break;
            }

            if (_max_backups != 0 && active_backups >= _max_backups)
            {
                ostringstream oss;

                oss << "Reached max number of active backups (" << _max_backups << ")";
                NebulaLog::debug("SCH", oss.str());

                break;
            }

            auto vm = vm_pool->get(vm_id);

            if (!vm)
            {
                ostringstream oss;

                bj->remove_vm(vm_id);

                oss << "Backup Job " << bj_id << ": Remove non-exist VM " << vm_id;
                NebulaLog::debug("SCH", oss.str());

                continue;
            }

            if (vm->get_state() == VirtualMachine::DONE)
            {
                ostringstream oss;

                bj->remove_vm(vm_id);

                oss << "Backup Job " << bj_id << ": Removing done VM " << vm_id;
                NebulaLog::debug("SCH", oss.str());

                continue;
            }

            int hid = vm->get_hid();

            if (_max_backups_host != 0 && host_backups[hid] >= _max_backups_host)
            {
                std::ostringstream oss;

                oss << "Reached max number of backups (" << _max_backups_host
                    << ") for host " << hid;
                NebulaLog::debug("SCH", oss.str());

                break;
            }

            /* -------------------------------------------------------------- */
            /* Create a backup condiguration for VM & set Backup Job          */
            /* -------------------------------------------------------------- */
            auto& backups = vm->backups();

            bool bck_vol = false;

            if (bj->get_template_attribute("BACKUP_VOLATILE", bck_vol))
            {
                bck_vol = backups.do_volatile();
            }

            bool inc = vm->get_disks().backup_increment(bck_vol) && !vm->has_snapshots();

            string   err;
            Template tmpl;

            bj->get_backup_config(tmpl);

            if ( backups.parse(&tmpl, inc, true, err) != 0 )
            {
                bj->set_template_error_message(err);

                bj->add_error(vm_id);

                NebulaLog::error("SCH", err);
                continue;
            }

            backups.backup_job_id(bj_id);

            vm_pool->update(vm.get());

            vm.reset();

            /* -------------------------------------------------------------- */
            /* Launch backup, notify backup job                               */
            /* -------------------------------------------------------------- */
            VirtualMachineBackup vm_backup;

            RequestAttributes ra(AuthRequest::ADMIN,
                                 UserPool::ONEADMIN_ID,
                                 GroupPool::ONEADMIN_ID,
                                 PoolObjectSQL::VM);

            auto ec = vm_backup.request_execute(ra, vm_id, ds_id, reset);

            if ( ec != Request::SUCCESS)
            {
                err = Request::failure_message(ec, ra, "backup");

                bj->set_template_error_message(err);

                bj->add_error(vm_id);

                NebulaLog::error("SCH", err);
                continue;
            }

            bj->backup_started(vm_id);

            /* -------------------------------------------------------------- */
            /* Update backup counters                                         */
            /* -------------------------------------------------------------- */
            ++active_backups;
            ++host_backups[hid];
        }

        bj_pool->update(bj.get());
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ScheduledActionManager::run_scheduled_action_vm(int vm_id, int sa_id, const std::string& aname)
{
    std::ostringstream oss;

    oss << "Executing action '" << aname << "' for VM " << vm_id << " : ";

    string error;

    auto rc = vm_action_call(vm_id, sa_id, error);

    auto sa = sa_pool->get(sa_id);

    if ( !sa )
    {
        return;
    }

    if (rc == 0)
    {
        sa->log_error("");

        sa->next_action();

        oss << "Success.";
    }
    else
    {
        std::ostringstream oss_aux;

        std::string time_str = one_util::log_time(time(0));

        oss_aux << time_str << " : " << error;

        sa->log_error(oss_aux.str());

        oss << "Failure. " << error;
    }

    sa_pool->update(sa.get());

    NebulaLog::info("SCH", oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static bool parse_args(std::queue<std::string>& tokens)
{
    return true;
}

/**
 * Parses tokens to specific value with given type
 *
 * @param tokens values to parse
 * @param value given type to parse it
 *
 * @return 0 on success, -1 otherwise
 */
template<typename T, typename... Args>
static bool parse_args(std::queue<std::string>& tokens, T& value, Args&... args)
{
    if (tokens.empty())
    {
        return false;
    }

    bool rc = one_util::str_cast(tokens.front(), value);

    tokens.pop();

    if (!rc)
    {
        return false;
    }

    return parse_args(tokens, args...);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ScheduledActionManager::vm_action_call(int vmid, int sa_id, string& error)
{
    auto sa = sa_pool->get_ro(sa_id);

    const string& aname = sa->action();
    const string& args_st = sa->args();

    Request::ErrorCode ec;

    stringstream ss(args_st);
    queue<string> args;

    string tmp_arg;

    while (getline(ss, tmp_arg, ','))
    {
        args.push(tmp_arg);
    }

    RequestAttributes ra(AuthRequest::ADMIN,
                         UserPool::ONEADMIN_ID,
                         GroupPool::ONEADMIN_ID,
                         PoolObjectSQL::VM);

    if (aname == "snapshot-create")
    {
        string name;

        if (!parse_args(args, name))
        {
            error = "Missing or malformed ARGS for: snapshot-create."
                    " Format: snapshot-name";
            return -1;
        }

        VirtualMachineSnapshotCreate request;
        ec = request.request_execute(ra, vmid, name);
    }
    else if (aname == "snapshot-revert")
    {
        int snapid = 0;

        if (!parse_args(args, snapid))
        {
            error = "Missing or malformed ARGS for: snapshot-revert."
                    " Format: snapshot-id";
            return -1;
        }

        VirtualMachineSnapshotRevert request;
        ec = request.request_execute(ra, vmid, snapid);
    }
    else if (aname == "snapshot-delete")
    {
        int snapid = 0;

        if (!parse_args(args, snapid))
        {
            error = "Missing or malformed ARGS for: snapshot-delete."
                    " Format: snapshot-id";
            return -1;
        }

        VirtualMachineSnapshotDelete request;
        ec = request.request_execute(ra, vmid, snapid);
    }
    else if (aname == "disk-snapshot-create")
    {
        int diskid = 0;
        string name;

        if (!parse_args(args, diskid, name))
        {
            error = "Missing or malformed ARGS for: disk-snapshot-create."
                    " Format: disk-id, snapshot-name";
            return -1;
        }

        VirtualMachineDiskSnapshotCreate request;
        ec = request.request_execute(ra, vmid, diskid, name);
    }
    else if (aname == "disk-snapshot-revert")
    {
        int diskid = 0, snapid = 0;

        if (!parse_args(args, diskid, snapid))
        {
            error = "Missing or malformed ARGS for: disk-snapshot-revert."
                    " Format: disk-id, snapshot-id";
            return -1;
        }


        VirtualMachineDiskSnapshotRevert request;
        ec = request.request_execute(ra, vmid, diskid, snapid);
    }
    else if (aname == "disk-snapshot-delete")
    {
        int diskid = 0, snapid = 0;

        if (!parse_args(args, diskid, snapid))
        {
            error = "Missing or malformed ARGS for: disk-snapshot-delete."
                    " Format: disk-id, snapshot-id";
            return -1;
        }

        VirtualMachineDiskSnapshotDelete request;
        ec = request.request_execute(ra, vmid, diskid, snapid);
    }
    else if (aname == "backup")
    {
        int dsid = -1;
        bool reset = false;

        if (!parse_args(args, dsid, reset))
        {
            error = "Missing or malformed ARGS for: backup."
                    " Format: datastore-id, reset";
            return -1;
        }

        VirtualMachineBackup request;
        ec = request.request_execute(ra, vmid, dsid, reset);
    }
    else
    {
        VirtualMachineAction req;
        ec = req.request_execute(ra, aname, vmid);
    }

    if (ec != Request::SUCCESS)
    {
        error = Request::failure_message(ec, ra, aname);
        NebulaLog::error("SCH", error);

        return -1;
    }

    return 0;
}
