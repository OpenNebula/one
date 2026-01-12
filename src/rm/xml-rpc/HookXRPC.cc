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

#include "HookXRPC.h"
#include "ClusterPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookAllocateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                       RequestAttributesXRPC& att)
{
    int oid;

    auto ec = allocate(paramList.getString(1),       // template
                       ClusterPool::NONE_CLUSTER_ID,
                       oid,
                       att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookDeleteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = del(oid,      // id
                  false,    // recursive
                  att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookUpdateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = update(oid,                      // hook_id
                     paramList.getString(2) ,  // template
                     paramList.size() > 3 ? paramList.getInt(3) : 0, // append
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookRenameXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = rename(oid,                     // id
                     paramList.getString(2),  // name
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void HookLockXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                      RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = lock(oid,                     // id
                   paramList.getInt(2),     // lock level
                   paramList.size() > 3 ? paramList.getBoolean(3) : false, // test
                   att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookUnlockXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = unlock(oid,
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookRetryXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                    RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = retry(oid,                 // id
                    paramList.getInt(2), // hk_exe_id
                    att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                   RequestAttributesXRPC& att)
{
    string xml;

    auto ec = info(paramList.getInt(1),      // id
                   paramList.size() > 2 ? paramList.getBoolean(2) : false,  // decrypt
                   xml,
                   att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookPoolInfoXRPC::request_execute(xmlrpc_c::paramList const&  paramList,
                                       RequestAttributesXRPC&      att)
{
    string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookPoolLogInfoXRPC::request_execute(xmlrpc_c::paramList const&  paramList,
                                          RequestAttributesXRPC&      att)
{
    string xml;

    auto ec = log_info(paramList.getInt(1),  // min_ts
                       paramList.getInt(2),  // max_ts
                       paramList.getInt(3),  // hook_id
                       paramList.getInt(4),  // rc_hook
                       xml,
                       att);

    response(ec, xml, att);
}
