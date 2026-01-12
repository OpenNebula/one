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

#include "VMGroupAPI.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VMGroupAllocateAPI::pool_allocate(std::unique_ptr<Template> tmpl,
                                                     int&                       id,
                                                     RequestAttributes&         att)
{
    int rc = vmgpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                               move(tmpl), &id, att.resp_msg);

    return (rc < 0) ? Request::INTERNAL : Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VMGroupAPI::add_role(int oid,
                                        const std::string& tmpl_str,
                                        RequestAttributes& att)
{
    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    Template tmpl;

    if (tmpl.parse_str_or_xml(tmpl_str, att.resp_msg) != 0)
    {
        return Request::ACTION;
    }

    VectorAttribute * va = tmpl.get("ROLE");

    if (!va)
    {
        att.resp_msg = "No ROLE attribute in template";

        return Request::ACTION;
    }

    auto vmgroup = vmgpool->get(oid);

    if (!vmgroup)
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if (vmgroup->add_role(va, att.resp_msg) != 0)
    {
        return Request::ACTION;
    }

    vmgpool->update(vmgroup.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VMGroupAPI::del_role(int oid,
                                        int role_id,
                                        RequestAttributes& att)
{
    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto vmgroup = vmgpool->get(oid);

    if (!vmgroup)
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if (vmgroup->del_role(role_id, att.resp_msg) != 0)
    {
        return Request::ACTION;
    }

    vmgpool->update(vmgroup.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VMGroupAPI::update_role(int oid,
                                           int role_id,
                                           const std::string& tmpl_str,
                                           RequestAttributes& att)
{
    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    Template tmpl;

    if (tmpl.parse_str_or_xml(tmpl_str, att.resp_msg) != 0)
    {
        return Request::ACTION;
    }

    VectorAttribute * va = tmpl.get("ROLE");

    if (!va)
    {
        att.resp_msg = "No ROLE attribute in template";

        return Request::ACTION;
    }

    auto vmgroup = vmgpool->get(oid);

    if (vmgroup->update_role(role_id, va, att.resp_msg) != 0)
    {
        return Request::ACTION;
    }

    vmgpool->update(vmgroup.get());

    return Request::SUCCESS;
}
