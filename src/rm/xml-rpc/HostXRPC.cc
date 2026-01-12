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

#include "HostXRPC.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostAllocateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                       RequestAttributesXRPC& att)
{
    int oid;

    auto ec = allocate(paramList.getString(1), // name
                       paramList.getString(2), // IM mad
                       paramList.getString(3), // VM mad
                       paramList.getInt(4),    // cluster id
                       oid,
                       att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostDeleteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void HostInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void HostUpdateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = update(oid,                      // id
                     paramList.getString(2) ,  // template
                     paramList.size() > 3 ? paramList.getInt(3) : 0, // append
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostRenameXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = rename(oid,                     // id
                     paramList.getString(2),  // name
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostStatusXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = status(paramList.getInt(1), // id
                     paramList.getInt(2), // status
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitoringXRPC::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributesXRPC&      att)
{
    string xml;

    auto ec = monitoring(paramList.getInt(1), // id
                         xml,
                         att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostPoolInfoXRPC::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributesXRPC&      att)
{
    string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostPoolMonitoringXRPC::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributesXRPC&      att)
{
    string xml;

    auto ec = monitoring(paramList.size() > 1 ? paramList.getInt(1) : -1, // seconds
                         xml,
                         att);

    response(ec, xml, att);
}
