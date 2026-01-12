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

#include "SecurityGroupAPI.h"
#include "LifeCycleManager.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SecurityGroupAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                           bool recursive,
                           RequestAttributes& att)
{
    if (object->get_oid() == 0)
    {
        att.resp_msg  = "The default security group (ID 0) cannot be deleted.";

        return -1;
    }

    SecurityGroup * sgroup = static_cast<SecurityGroup *>(object.get());

    if ( sgroup->get_vms() > 0 )
    {
        att.resp_msg = "The security group has VMs using it";

        return -1;
    }

    return SharedAPI::drop(std::move(object), false, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SecurityGroupAPI::pool_allocate(std::unique_ptr<Template> tmpl,
                                                   int& id,
                                                   RequestAttributes& att)
{
    int rc = sgpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                              std::move(tmpl), &id, att.resp_msg);

    return rc < 0 ? Request::INTERNAL : Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SecurityGroupAPI::commit(int oid,
                                            bool recover,
                                            RequestAttributes& att)
{
    LifeCycleManager*  lcm = Nebula::instance().get_lcm();


    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto sg = sgpool->get(oid);

    if ( !sg )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    sg->commit(recover);

    sgpool->update(sg.get());

    lcm->trigger_updatesg(oid);

    return Request::SUCCESS;
}
