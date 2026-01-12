/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#include "BackupJobAPI.h"
#include "DispatchManager.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode BackupJobAllocateAPI::pool_allocate(std::unique_ptr<Template> tmpl,
                                                       int&                       id,
                                                       RequestAttributes&         att)
{
    /* ---------------------------------------------------------------------- */
    /* Get SCHED_ACTION attributes                                            */
    /* ---------------------------------------------------------------------- */
    std::vector<unique_ptr<VectorAttribute>> sas;

    tmpl->remove("SCHED_ACTION", sas);

    int priority;
    if (tmpl->get("PRIORITY", priority))
    {
        if (priority < BackupJob::MIN_PRIO || priority > BackupJob::MAX_PRIO)
        {
            att.resp_msg = "Wrong priority value";

            return Request::INTERNAL;
        }

        if (!att.is_admin() && priority > 50)
        {
            return Request::AUTHORIZATION;
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Create BackupJob object                                                */
    /* ---------------------------------------------------------------------- */
    BackupJobPool * bjpool = static_cast<BackupJobPool *>(pool);

    int rc = bjpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                              move(tmpl), &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    if (sas.empty())
    {
        return Request::SUCCESS;
    }

    /* ---------------------------------------------------------------------- */
    /* Create ScheduleAction and associate to the BackupJob                   */
    /* ---------------------------------------------------------------------- */
    std::vector<int> sa_ids;

    bool sa_error = false;

    for (auto& sa : sas)
    {
        sa->remove("ARGS");  // ARGS not used for Backup Job Scheduled Action

        int sa_id = sapool->allocate(PoolObjectSQL::BACKUPJOB, id, 0, sa.get(),
                                     att.resp_msg);

        if (sa_id < 0)
        {
            sa_error = true;
            break;
        }
        else
        {
            sa_ids.push_back(sa_id);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Error creating a SCHED_ACTION rollback created objects                 */
    /* ---------------------------------------------------------------------- */
    if (sa_error)
    {
        sapool->drop_sched_actions(sa_ids);

        if ( auto bj = bjpool->get(id) )
        {
            string error;

            bjpool->drop(bj.get(), error);
        }

        return Request::INTERNAL;
    }

    /* ---------------------------------------------------------------------- */
    /* Associate SCHED_ACTIONS to the BackupJob                               */
    /* ---------------------------------------------------------------------- */
    if ( auto bj = bjpool->get(id) )
    {
        for (const auto oid: sa_ids)
        {
            bj->sched_actions().add(oid);
        }

        bjpool->update(bj.get());
    }
    else
    {
        // BackupJob no longer exits, delete SchedActions
        sapool->drop_sched_actions(sa_ids);

        att.resp_msg = "BACKUPJOB deleted while setting up SCHED_ACTION";

        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int BackupJobAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                       bool recursive,
                       RequestAttributes& att)
{
    BackupJob * bj = static_cast<BackupJob *>(object.get());

    std::set<int> sa_ids(bj->sched_actions().get_collection());

    int rc = SharedAPI::drop(std::move(object), false, att);

    if (rc != 0)
    {
        return rc;
    }

    string error;
    rc = 0;

    for (const auto& id: sa_ids)
    {
        if (auto sa = sapool->get(id))
        {
            rc += sapool->drop(sa.get(), error);
        }
    }

    if ( rc != 0 )
    {
        att.resp_msg = "BackupJob deleted, but some associated schedules could not be removed";

        return -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode BackupJobAPI::backup(int oid, RequestAttributes& att)
{
    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto bj = bjpool->get(oid);

    if (bj == nullptr)
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    int rc = bj->execute(att.resp_msg);

    bjpool->update(bj.get());

    if (rc != 0)
    {
        NebulaLog::error("ReM", att.resp_msg);

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode BackupJobAPI::cancel(int oid, RequestAttributes& att)
{
    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto bj = bjpool->get(oid);

    if (bj == nullptr)
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    std::set<int> active_vms(bj->backing_up());

    bj->cancel();

    bjpool->update(bj.get());

    bj.reset();

    // Failure is because non-exist VM or wrong state, ignore failures
    auto dm = Nebula::instance().get_dm();

    for (const auto& vm_id : active_vms)
    {
        dm->backup_cancel(vm_id, att, att.resp_msg);
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode BackupJobAPI::retry(int oid, RequestAttributes& att)
{
    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto bj = bjpool->get(oid);

    if (bj == nullptr)
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    bj->retry();

    bjpool->update(bj.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode BackupJobAPI::priority(int oid,
                                          int priority,
                                          RequestAttributes& att)
{
    if ( priority > BackupJob::MAX_PRIO || priority < BackupJob::MIN_PRIO )
    {
        att.resp_msg = "Wrong priority value";

        return Request::ACTION;
    }

    if ( priority > BackupJob::MAX_USER_PRIO )
    {
        att.auth_op = AuthRequest::ADMIN;
    }

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto bj = bjpool->get(oid);

    if (bj == nullptr)
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    bj->priority(priority);

    bjpool->update(bj.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode BackupJobAPI::sched_add(int oid,
                                           const std::string& template_str,
                                           int& sa_id,
                                           RequestAttributes& att)
{
    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    // Create template from template string
    auto tmpl = std::make_unique<Template>();

    if (tmpl->parse_str_or_xml(template_str, att.resp_msg) != 0)
    {
        return Request::INTERNAL;
    }

    VectorAttribute * va = tmpl->get("SCHED_ACTION");

    if ( va == nullptr )
    {
        att.resp_msg = "No SCHED_ACTION attribute in template";

        return Request::ACTION;
    }

    sa_id = sapool->allocate(PoolObjectSQL::BACKUPJOB, oid, 0, va, att.resp_msg);

    if ( sa_id < 0 )
    {
        return Request::ACTION;
    }

    // Update Scheduled Action ID in the BJ
    if (auto bj = bjpool->get(oid))
    {
        bj->sched_actions().add(sa_id);

        bjpool->update(bj.get());
    }
    else
    {
        att.resp_id  = oid;

        // BackupJob no longer exists, cleanup the Scheduled Action
        if (auto sa = sapool->get(sa_id))
        {
            string err;
            sapool->drop(sa.get(), err);
        }

        return Request::NO_EXISTS;
    }

    att.resp_obj = PoolObjectSQL::SCHEDULEDACTION;
    att.resp_id  = sa_id;

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode BackupJobAPI::sched_delete(int oid,
                                              int sa_id,
                                              RequestAttributes& att)
{
    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    if (auto bj = bjpool->get(oid))
    {
        if ( bj->sched_actions().del(sa_id) == -1 )
        {
            att.resp_obj = PoolObjectSQL::SCHEDULEDACTION;
            att.resp_id  = sa_id;

            return Request::NO_EXISTS;
        }

        bjpool->update(bj.get());
    }
    else
    {
        return Request::NO_EXISTS;
    }

    if (auto sa = sapool->get(sa_id))
    {
        if (sapool->drop(sa.get(), att.resp_msg) != 0)
        {
            return Request::ACTION;
        }
    }

    att.resp_obj = PoolObjectSQL::SCHEDULEDACTION;
    att.resp_id  = sa_id;

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode BackupJobAPI::sched_update(int oid,
                                              int sa_id,
                                              const std::string& template_str,
                                              RequestAttributes& att)
{
    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    /* ---------------------------------------------------------------------- */
    /* Parse input template and get SCHED_ACTION attribute                    */
    /* ---------------------------------------------------------------------- */
    auto tmpl = std::make_unique<Template>();

    if (tmpl->parse_str_or_xml(template_str, att.resp_msg) != 0)
    {
        return Request::INTERNAL;
    }

    const VectorAttribute * v_sa = tmpl->get("SCHED_ACTION");

    if ( v_sa == nullptr )
    {
        att.resp_msg = "No SCHED_ACTION attribute in template";

        return Request::INTERNAL;
    }

    /* ---------------------------------------------------------------------- */
    /* Check Scheduled Action association                                     */
    /* ---------------------------------------------------------------------- */
    if (auto bj = bjpool->get(oid))
    {
        if (!bj->sched_actions().contains(sa_id))
        {
            std::ostringstream oss;
            oss << "SCHED_ACTION with id = " << sa_id << " doesn't exist";

            att.resp_msg = oss.str();

            return Request::INTERNAL;
        }
    }
    else
    {
        return Request::NO_EXISTS;
    }

    /* ---------------------------------------------------------------------- */
    /* Update the ScheduledAction                                             */
    /* ---------------------------------------------------------------------- */
    if (auto sa = sapool->get(sa_id))
    {
        if (sa->parse(v_sa, 0, att.resp_msg) == -1)
        {
            return Request::INTERNAL;
        }

        sapool->update(sa.get());
    }

    att.resp_obj = PoolObjectSQL::SCHEDULEDACTION;
    att.resp_id = sa_id;

    return Request::SUCCESS;
}
