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

#include "RequestManagerSchedAction.h"
#include "ScheduledActionPool.h"

using namespace std;


void RequestManagerSchedAdd::request_execute(xmlrpc_c::paramList const& paramList,
                                             RequestAttributes& att)
{
    int oid  = paramList.getInt(1);
    string template_str = paramList.getString(2);

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    time_t stime;

    if ( auto vm = pool->get_ro<VirtualMachine>(oid) )
    {
        stime = vm->get_stime();
    }
    else
    {
        att.resp_id = oid;

        failure_response(NO_EXISTS, att);
        return;
    }

    /* ---------------------------------------------------------------------- */
    /* Parse input template and create ScheduledAction object                 */
    /* ---------------------------------------------------------------------- */
    auto sapool = Nebula::instance().get_sapool();

    auto tmpl = std::make_unique<Template>();

    if (tmpl->parse_str_or_xml(template_str, att.resp_msg) != 0)
    {
        failure_response(INTERNAL, att);
        return;
    }

    const VectorAttribute * va = tmpl->get("SCHED_ACTION");

    if ( va == nullptr )
    {
        att.resp_msg = "No SCHED_ACTION attribute in template";

        failure_response(ACTION, att);
        return;
    }

    auto sa_id = sapool->allocate(PoolObjectSQL::VM, oid, stime, va, att.resp_msg);

    if ( sa_id < 0 )
    {
        failure_response(ACTION, att);
        return;
    }

    /* ---------------------------------------------------------------------- */
    /* Update the VirtualMachine to add the new ScheduledAction               */
    /* ---------------------------------------------------------------------- */
    if (auto vm = pool->get<VirtualMachine>(oid))
    {
        vm->sched_actions().add(sa_id);

        pool->update(vm.get());
    }
    else
    {
        att.resp_id = oid;

        // VM no longer exists, cleanup the Scheduled Action
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

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerSchedDelete::request_execute(xmlrpc_c::paramList const& paramList,
                                                RequestAttributes& att)
{
    int oid  = paramList.getInt(1);
    int sched_id = paramList.getInt(2);

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    if ( auto vm = pool->get<VirtualMachine>(oid) )
    {
        if ( vm->sched_actions().del(sched_id) == -1 )
        {
            att.resp_obj = PoolObjectSQL::SCHEDULEDACTION;
            att.resp_id  = sched_id;

            failure_response(NO_EXISTS, att);
            return;
        }

        pool->update(vm.get());
    }
    else
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);

        return;
    }

    auto& nd    = Nebula::instance();
    auto sapool = nd.get_sapool();

    if (auto sa = sapool->get(sched_id))
    {
        if (sapool->drop(sa.get(), att.resp_msg) != 0)
        {
            failure_response(ACTION, att);
            return;
        }
    }

    att.resp_obj = PoolObjectSQL::SCHEDULEDACTION;
    att.resp_id  = sched_id;

    success_response(sched_id, att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerSchedUpdate::request_execute(xmlrpc_c::paramList const& paramList,
                                                RequestAttributes& att)
{
    int oid      = paramList.getInt(1);
    int sched_id = paramList.getInt(2);

    string template_str = paramList.getString(3);

    if ( basic_authorization(oid, att) == false )
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
    time_t stime;

    if ( auto vm = pool->get<VirtualMachine>(oid) )
    {
        stime = vm->get_stime();

        if (!vm->sched_actions().contains(sched_id))
        {
            std::ostringstream oss;
            oss << "SCHED_ACTION with id = " << sched_id << " doesn't exist";

            att.resp_msg = oss.str();

            failure_response(INTERNAL, att);
            return;
        }
    }
    else
    {
        att.resp_id = oid;

        failure_response(NO_EXISTS, att);
        return;
    }

    /* ---------------------------------------------------------------------- */
    /* Update the ScheduledAction                                             */
    /* ---------------------------------------------------------------------- */
    auto sapool = Nebula::instance().get_sapool();

    if (auto sa = sapool->get(sched_id))
    {
        if (sa->parse(v_sa, stime, att.resp_msg) == -1)
        {
            failure_response(INTERNAL, att);
            return;
        }

        sapool->update(sa.get());
    }

    att.resp_obj = PoolObjectSQL::SCHEDULEDACTION;
    att.resp_id  = sched_id;

    success_response(sched_id, att);

    return;
}

