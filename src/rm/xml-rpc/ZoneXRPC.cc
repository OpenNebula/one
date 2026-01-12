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

#include "ZoneXRPC.h"
#include "ClusterPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneAllocateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                       RequestAttributesXRPC& att)
{
    int oid;

    auto ec = allocate(paramList.getString(1),       // template
                       ClusterPool::NONE_CLUSTER_ID, // cluster ID
                       oid,
                       att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneDeleteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void ZoneUpdateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                      RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = update(oid,                      // zone_id
                     paramList.getString(2) ,  // template
                     paramList.size() > 3 ? paramList.getInt(3) : 0, // append
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneRenameXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void ZoneAddServerXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                        RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = add_server(oid,                     // zone_id
                         paramList.getString(2),  // server_zone_str
                         att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ZoneDelServerXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                        RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = del_server(oid,                  // zone_id
                         paramList.getInt(2),  // server_zone_id
                         att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ZoneResetServerXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                          RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = reset_server(oid,                  // zone_id
                           paramList.getInt(2),  // server_zone_id
                           att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ZoneEnableXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = enable(oid,                      // zone_id
                     paramList.getBoolean(2),  // enable
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ZoneReplicateLogXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                           RequestAttributesXRPC& att)
{
    ReplicateLogParams params{
        paramList.getInt(1),                             // leader_id
        static_cast<uint64_t>(paramList.getI8(2)),       // leader_commit
        static_cast<unsigned int>(paramList.getInt(3)),  // leader_term
        static_cast<uint64_t>(paramList.getI8(4)),       // index
        static_cast<unsigned int>(paramList.getInt(5)),  // term
        static_cast<uint64_t>(paramList.getI8(6)),       // prev_index
        static_cast<unsigned int>(paramList.getInt(7)),  // prev_term
        static_cast<uint64_t>(paramList.getI8(8)),       // fed_index
        paramList.getString(9),                          // sql
    };

    auto ec = replicate_log(params, att);

    response(ec, att.resp_id, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ZoneVoteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                  RequestAttributesXRPC& att)
{
    auto ec = vote(paramList.getInt(1),  // candidate_term
                   paramList.getInt(2),  // candidate_id
                   paramList.getI8(3),   // candidate_log_index
                   paramList.getInt(4),  // candidate_log_term
                   att);

    response(ec, att.resp_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneRaftStatusXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributesXRPC& att)
{
    string xml;

    auto ec = raft_status(xml, att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ZoneReplicateFedLogXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                              RequestAttributesXRPC& att)
{
    auto ec = replicate_fed_log(paramList.getI8(1),      // index
                                paramList.getI8(2),      // prev
                                paramList.getString(3),  // sql
                                att);

    response(ec, att.replication_idx, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneUpdateDBXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                       RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = update_db(oid,                     // zone_id
                        paramList.getString(2),  // xml
                        att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void ZonePoolInfoXRPC::request_execute(xmlrpc_c::paramList const&  paramList,
                                       RequestAttributesXRPC&      att)
{
    string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}
