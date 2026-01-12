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

#include "VdcXRPC.h"
#include "ClusterPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VdcAllocateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void VdcDeleteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void VdcUpdateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                    RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = update(oid,                      // vdc_id
                     paramList.getString(2) ,  // template
                     paramList.size() > 3 ? paramList.getInt(3) : 0, // append
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VdcRenameXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void VdcAddGroupXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                      RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = add_group(oid,                  // vdc_id
                        paramList.getInt(2),  // group_id
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VdcDelGroupXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                      RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = del_group(oid,                  // vdc_id
                        paramList.getInt(2),  // group_id
                        att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VdcAddClusterXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                        RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = add_cluster(oid,                  // vdc_id
                          paramList.getInt(2),  // zone_id
                          paramList.getInt(3),  // cluster_id
                          att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VdcDelClusterXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                        RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = del_cluster(oid,                  // vdc_id
                          paramList.getInt(2),  // zone_id
                          paramList.getInt(3),  // cluster_id
                          att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VdcAddHostXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = add_host(oid,                  // vdc_id
                       paramList.getInt(2),  // zone_id
                       paramList.getInt(3),  // host_id
                       att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VdcDelHostXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = del_host(oid,                  // vdc_id
                       paramList.getInt(2),  // zone_id
                       paramList.getInt(3),  // host_id
                       att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VdcAddDatastoreXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                          RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = add_datastore(oid,                  // vdc_id
                            paramList.getInt(2),  // zone_id
                            paramList.getInt(3),  // datastore_id
                            att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VdcDelDatastoreXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                          RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = del_datastore(oid,                  // vdc_id
                            paramList.getInt(2),  // zone_id
                            paramList.getInt(3),  // datastore_id
                            att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VdcAddVnetXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = add_vnet(oid,                  // vdc_id
                       paramList.getInt(2),  // zone_id
                       paramList.getInt(3),  // vnet_id
                       att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VdcDelVnetXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = del_vnet(oid,                  // vdc_id
                       paramList.getInt(2),  // zone_id
                       paramList.getInt(3),  // vnet_id
                       att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VdcInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void VdcPoolInfoXRPC::request_execute(xmlrpc_c::paramList const&  paramList,
                                      RequestAttributesXRPC&      att)
{
    string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}
