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

#include "DocumentAPI.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode DocumentAllocateAPI::allocate(const std::string&      str_tmpl,
                                                 int                     type,
                                                 int                     cluster_id,
                                                 int&                    oid,
                                                 RequestAttributes&      att)
{
    _type = type;

    return SharedAPI::allocate(str_tmpl, cluster_id, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode DocumentAllocateAPI::pool_allocate(std::unique_ptr<Template> tmpl,
                                                      int&                      id,
                                                      RequestAttributes&        att)
{
    int rc = docpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                               _type, move(tmpl), &id, att.resp_msg);

    return (rc < 0) ? Request::INTERNAL : Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode DocumentAPI::pool_allocate(int sid,
                                              std::unique_ptr<Template> tmpl,
                                              int& id,
                                              RequestAttributes& att)
{
    auto doc = docpool->get_ro(sid);

    if (!doc)
    {
        return Request::NO_EXISTS;
    }

    int dtype = doc->get_document_type();

    int rc =  docpool->allocate(att.uid, att.gid, att.uname, att.gname,
                                att.umask, dtype, std::move(tmpl), &id, att.resp_msg);

    return (rc < 0) ? Request::INTERNAL : Request::SUCCESS;
}   