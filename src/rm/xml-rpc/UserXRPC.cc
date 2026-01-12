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

#include "UserXRPC.h"
#include "ClusterPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void UserAllocateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                       RequestAttributesXRPC& att)
{
    int oid;

    std::vector<int> group_ids;

    if (paramList.size() > 4)
    {
        auto arr = xmlrpc_c::value_array(paramList.getArray(4)).vectorValueValue();
        for (const auto& val : arr)
        {
            group_ids.push_back(xmlrpc_c::value_int(val));
        }
    }

    auto ec = allocate(paramList.getString(1),       // username
                       paramList.getString(2),       // password
                       paramList.getString(3),       // driver
                       group_ids,                    // group IDs
                       ClusterPool::NONE_CLUSTER_ID, // cluster ID
                       oid,
                       att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void UserDeleteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = del(oid,      // id
                  false,    // recursive
                  att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserChangePasswordXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                             RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = password(oid,                    // user_id
                       paramList.getString(2), // new_password
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserChangeAuthXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = change_auth(oid,                    // user_id
                          paramList.getString(2), // new_auth
                          paramList.getString(3), // new_password
                          att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserSetQuotaXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                       RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = quota(oid,                    // user_id
                    paramList.getString(2), // quota
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserEnableXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = enable(oid,                     // user_id
                     paramList.getBoolean(2), // enable
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void UserUpdateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = update(oid,                      // user_id
                     paramList.getString(2) ,  // template
                     paramList.size() > 3 ? paramList.getInt(3) : 0, // append
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserChangeGroupXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                          RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = chown(oid,                  // user_id
                    -1,                   // new_uid
                    paramList.getInt(2),  // new_oid
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserAddGroupXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                       RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = add_group(oid,                  // user_id
                        paramList.getInt(2),  // group_id
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserDelGroupXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                       RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = del_group(oid,                  // user_id
                        paramList.getInt(2),  // group_id
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserQuotaInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                        RequestAttributesXRPC& att)
{
    string xml;

    auto ec = quota_info(xml, att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserQuotaUpdateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                          RequestAttributesXRPC& att)
{
    string quota_template = paramList.getString(1);

    auto ec = quota_update(quota_template, att);

    response(ec, quota_template, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserLoginXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                    RequestAttributesXRPC& att)
{
    string token = paramList.getString(2);

    auto ec = login(paramList.getString(1), // uname
                    token,                  // token
                    paramList.getInt(3),    // valid
                    paramList.size() > 4 ? paramList.getInt(4) : -1, // egid
                    att);

    response(ec, token, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                   RequestAttributesXRPC& att)
{
    string xml;

    auto ec = info(paramList.getInt(1),     // id
                   paramList.size() > 2 ? paramList.getBoolean(2) : false, // decrypt
                   xml,
                   att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void UserPoolInfoXRPC::request_execute(xmlrpc_c::paramList const&  paramList,
                                       RequestAttributesXRPC&      att)
{
    string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}
