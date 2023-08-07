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

#include "RequestManagerBackupJob.h"
#include "Nebula.h"
#include "BackupJobPool.h"
#include "ScheduledActionPool.h"
#include "DispatchManager.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

RequestManagerBackupJob::RequestManagerBackupJob(const std::string& method_name,
                                                 const std::string& params,
                                                 const std::string& help)
    : Request(method_name, params, help)
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_bjpool();

    auth_object = PoolObjectSQL::BACKUPJOB;
    auth_op     = AuthRequest::MANAGE;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJobBackup::request_execute(xmlrpc_c::paramList const& _paramList,
                                      RequestAttributes& att)
{
    int bj_id = _paramList.getInt(1);

    if (!basic_authorization(bj_id, att))
    {
        return;
    }

    auto bjpool = static_cast<BackupJobPool*>(pool);
    auto bj     = bjpool->get(bj_id);

    if (bj == nullptr)
    {
        att.resp_id = bj_id;
        failure_response(NO_EXISTS, att);
        return;
    }

    int rc = bj->execute(att.resp_msg);

    bjpool->update(bj.get());

    if (rc != 0)
    {
        NebulaLog::error("ReM", att.resp_msg);

        failure_response(ACTION, att);
        return;
    }

    success_response(bj_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJobCancel::request_execute(xmlrpc_c::paramList const& _paramList,
                                      RequestAttributes& att)
{
    int  bj_id = _paramList.getInt(1);

    if (!basic_authorization(bj_id, att))
    {
        return;
    }

    auto bjpool = static_cast<BackupJobPool*>(pool);
    auto bj     = bjpool->get(bj_id);

    if (bj == nullptr)
    {
        att.resp_id = bj_id;

        failure_response(NO_EXISTS, att);
        return;
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

    success_response(bj_id, att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJobRetry::request_execute(xmlrpc_c::paramList const& _paramList,
                                      RequestAttributes& att)
{
    int  bj_id = _paramList.getInt(1);

    if (!basic_authorization(bj_id, att))
    {
        return;
    }

    auto bjpool = static_cast<BackupJobPool*>(pool);
    auto bj     = bjpool->get(bj_id);

    if (bj == nullptr)
    {
        att.resp_id = bj_id;

        failure_response(NO_EXISTS, att);
        return;
    }

    bj->retry();

    bjpool->update(bj.get());

    success_response(bj_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJobPriority::request_execute(xmlrpc_c::paramList const& _paramList,
                                        RequestAttributes& att)
{
    int bj_id = _paramList.getInt(1);
    int priority = _paramList.getInt(2);

    if ( priority > BackupJob::MAX_PRIO || priority < BackupJob::MIN_PRIO )
    {
        att.resp_msg = "Wrong priority value";

        failure_response(ACTION, att);
        return;
    }

    if ( priority > BackupJob::MAX_USER_PRIO )
    {
        att.auth_op = AuthRequest::ADMIN;
    }

    if (!basic_authorization(bj_id, att))
    {
        return;
    }

    auto bjpool = static_cast<BackupJobPool*>(pool);
    auto bj     = bjpool->get(bj_id);

    if (bj == nullptr)
    {
        att.resp_id = bj_id;

        failure_response(NO_EXISTS, att);
        return;
    }

    bj->priority(priority);

    bjpool->update(bj.get());

    success_response(bj_id, att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJobSchedAdd::request_execute(xmlrpc_c::paramList const& _paramList,
                                        RequestAttributes& att)
{
    int bj_id = _paramList.getInt(1);
    string template_str = _paramList.getString(2);

    if (!basic_authorization(bj_id, att))
    {
        return;
    }

    auto& nd = Nebula::instance();

    auto bjpool = nd.get_bjpool();
    auto sapool = nd.get_sapool();

    // Create template from template string
    auto tmpl = std::make_unique<Template>();

    if (tmpl->parse_str_or_xml(template_str, att.resp_msg) != 0)
    {
        failure_response(INTERNAL, att);
        return;
    }

    VectorAttribute * va = tmpl->get("SCHED_ACTION");

    if ( va == nullptr )
    {
        att.resp_msg = "No SCHED_ACTION attribute in template";

        failure_response(ACTION, att);
        return;
    }

    auto sa_id = sapool->allocate(PoolObjectSQL::BACKUPJOB, bj_id, 0, va, att.resp_msg);

    if ( sa_id < 0 )
    {
        failure_response(ACTION, att);
        return;
    }

    // Update Scheduled Action ID in the BJ
    if (auto bj = bjpool->get(bj_id))
    {
        bj->sched_actions().add(sa_id);

        bjpool->update(bj.get());
    }
    else
    {
        att.resp_id  = bj_id;

        // BackupJob no longer exists, cleanup the Scheduled Action
        if (auto sa = sapool->get(sa_id))
        {
            string err;
            sapool->drop(sa.get(), err);
        }

        failure_response(NO_EXISTS, att);
        return;
    }

    att.resp_obj = PoolObjectSQL::SCHEDULEDACTION;
    att.resp_id  = sa_id;

    success_response(sa_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJobSchedDelete::request_execute(xmlrpc_c::paramList const& _paramList,
                                           RequestAttributes& att)
{
    int bj_id = _paramList.getInt(1);
    int sa_id = _paramList.getInt(2);

    if (!basic_authorization(bj_id, att))
    {
        return;
    }

    auto& nd = Nebula::instance();
    auto bjpool = nd.get_bjpool();
    auto sapool = nd.get_sapool();

    if (auto bj = bjpool->get(bj_id))
    {
        if ( bj->sched_actions().del(sa_id) == -1 )
        {
            att.resp_obj = PoolObjectSQL::SCHEDULEDACTION;
            att.resp_id  = sa_id;

            failure_response(NO_EXISTS, att);
            return;
        }

        bjpool->update(bj.get());
    }
    else
    {
        failure_response(NO_EXISTS, att);
        return;
    }

    if (auto sa = sapool->get(sa_id))
    {
        if (sapool->drop(sa.get(), att.resp_msg) != 0)
        {
            failure_response(ACTION, att);
            return;
        }
    }

    att.resp_obj = PoolObjectSQL::SCHEDULEDACTION;
    att.resp_id  = sa_id;

    success_response(sa_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void BackupJobSchedUpdate::request_execute(xmlrpc_c::paramList const& _paramList,
                                           RequestAttributes& att)
{
    int bj_id = _paramList.getInt(1);
    int sa_id = _paramList.getInt(2);
    std::string template_str = _paramList.getString(3);

    if (!basic_authorization(bj_id, att))
    {
        return;
    }

    /* ---------------------------------------------------------------------- */
    /* Parse input template and get SCHED_ACTION attribute                    */
    /* ---------------------------------------------------------------------- */
    auto tmpl = std::make_unique<Template>();

    if (tmpl->parse_str_or_xml(template_str, att.resp_msg) != 0)
    {
        failure_response(INTERNAL, att);
        return;
    }

    const VectorAttribute * v_sa = tmpl->get("SCHED_ACTION");

    if ( v_sa == nullptr )
    {
        att.resp_msg = "No SCHED_ACTION attribute in template";

        failure_response(INTERNAL, att);
        return;
    }

    /* ---------------------------------------------------------------------- */
    /* Check Scheduled Action association                                     */
    /* ---------------------------------------------------------------------- */
    auto& nd = Nebula::instance();

    auto bjpool = nd.get_bjpool();
    auto sapool = nd.get_sapool();

    if (auto bj = bjpool->get(bj_id))
    {
        if (!bj->sched_actions().contains(sa_id))
        {
            std::ostringstream oss;
            oss << "SCHED_ACTION with id = " << sa_id << " doesn't exist";

            att.resp_msg = oss.str();

            failure_response(INTERNAL, att);

            return;
        }
    }
    else
    {
        failure_response(NO_EXISTS, att);

        return;
    }

    /* ---------------------------------------------------------------------- */
    /* Update the ScheduledAction                                             */
    /* ---------------------------------------------------------------------- */
    if (auto sa = sapool->get(sa_id))
    {
        if (sa->parse(v_sa, 0, att.resp_msg) == -1)
        {
            failure_response(INTERNAL, att);

            return;
        }

        sapool->update(sa.get());
    }

    att.resp_obj = PoolObjectSQL::SCHEDULEDACTION;
    att.resp_id = sa_id;

    success_response(sa_id, att);
}

