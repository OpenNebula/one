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

#include "ClusterXRPC.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ClusterAllocateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                          RequestAttributesXRPC& att)
{
    int oid;

    auto ec = allocate(paramList.getString(1), // name
                       oid,
                       att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void ClusterDeleteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                        RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = del(paramList.getInt(1), // id
                  false,               // recursive
                  att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void ClusterInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                      RequestAttributesXRPC& att)
{
    string xml;

    auto ec = info(paramList.getInt(1),       // id
                   paramList.size() > 2 ? paramList.getBoolean(2) : false,   // decrypt
                   xml,
                   att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */

void ClusterUpdateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                        RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = update(oid,                      // id
                     paramList.getString(2),   // template
                     paramList.size() > 3 ? paramList.getInt(3) : 0, // append
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void ClusterRenameXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                        RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = rename(oid,                     // id
                     paramList.getString(2),  // name
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void ClusterAddHostXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = AddHost(oid,                  // id
                      paramList.getInt(2),  // host id
                      att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void ClusterDelHostXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = DelHost(oid,                  // id
                      paramList.getInt(2),  // host id
                      att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void ClusterAddDatastoreXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                              RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = AddDatastore(oid,                  // id
                           paramList.getInt(2),  // datastore id
                           att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void ClusterDelDatastoreXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                              RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = DelDatastore(oid,                  // id
                           paramList.getInt(2),  // datastore id
                           att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void ClusterAddVNetXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = AddVNet(oid,                  // id
                      paramList.getInt(2),  // net id
                      att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void ClusterDelVNetXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = DelVNet(oid,                  // id
                      paramList.getInt(2),  // net id
                      att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void ClusterOptimizeXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                          RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec =  Optimize(oid, att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void ClusterPlanExecuteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                             RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = PlanExecute(oid, att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void ClusterPlanDeleteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                            RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = PlanDelete(oid, att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ClusterPoolInfoXRPC::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributesXRPC&      att)
{
    string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}
