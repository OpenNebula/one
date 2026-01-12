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

#include "ZoneAPI.h"
#include "AclManager.h"
#include "Client.h"
#include "FedReplicaManager.h"
#include "LogDB.h"
#include "RaftManager.h"

#include <unistd.h>

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode ZoneAPI::allocate(const std::string& str_tmpl,
                                     int                cluster_id,
                                     int&               oid,
                                     RequestAttributes& att)
{
    att.auth_op = AuthRequest::CREATE;

    if(!Nebula::instance().is_federation_master())
    {
        att.resp_msg = "New zones can only be created at federation master";

        return Request::ALLOCATE;
    }

    return SharedAPI::allocate(str_tmpl, cluster_id, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ZoneAPI::pool_allocate(std::unique_ptr<Template> tmpl,
                                          int&                       id,
                                          RequestAttributes&         att)
{
    int rc = zpool->allocate(move(tmpl), &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    Nebula::instance().get_frm()->add_zone(id);

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ZoneAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                  bool recursive,
                  RequestAttributes& att)
{
    AclManager * aclm = Nebula::instance().get_aclm();

    int oid= object->get_oid();
    int rc = SharedAPI::drop(std::move(object), false, att);

    if ( rc == 0 )
    {
        aclm->del_zid_rules(oid);
    }

    Nebula::instance().get_frm()->delete_zone(oid);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ZoneAPI::add_server(int oid,
                                       string zs_str,
                                       RequestAttributes& att)
{
    Nebula& nd    = Nebula::instance();
    int    zs_id;

    string xmlep;
    string grpcep;

    if ( oid != nd.get_zone_id() )
    {
        att.resp_msg = "Servers have to be added through the target zone"
                       " endpoints";

        return Request::ACTION;
    }

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return Request::AUTHORIZATION;
    }

    Template zs_tmpl;

    int rc = zs_tmpl.parse_str_or_xml(zs_str, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    auto zone = zpool->get(oid);

    if ( zone == nullptr )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if ( zone->add_server(zs_tmpl, zs_id, xmlep, grpcep, att.resp_msg) == -1 )
    {
        return Request::ACTION;
    }

    if ( nd.is_federation_master() || !nd.is_federation_enabled() )
    {
        zpool->update(zone.get());
    }
    else
    {
        std::string tmpl_xml;

        int z_oid = zone->get_oid();

        unsigned int numservers = zone->servers_size();

        zone->to_xml(tmpl_xml);

        zone.reset();

        if ( Client::client()->master_update_zone(z_oid, tmpl_xml, att.resp_msg) != 0 )
        {
            NebulaLog::log("ReM", Log::ERROR, att.resp_msg);

            return Request::ACTION;
        }

        //Wait for zone update to propagate from master before adding the
        //new server
        if ( numservers == 2 )
        {
            bool updated = false;

            while (!updated)
            {
                if ((zone = zpool->get_ro(oid)))
                {
                    if ( zone->get_server(zs_id) != 0 )
                    {
                        updated = true;
                    }
                }

                usleep(250000);
            }
        }
    }

    nd.get_raftm()->add_server(zs_id, xmlep, grpcep);

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ZoneAPI::del_server(int oid,
                                       int zs_id,
                                       RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    if ( oid != nd.get_zone_id() )
    {
        att.resp_msg = "Servers have to be deleted through the target zone"
                       " endpoints";

        return Request::ACTION;
    }

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return Request::AUTHORIZATION;
    }

    auto zone = zpool->get(oid);

    if ( zone == nullptr )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if ( zone->delete_server(zs_id, att.resp_msg) == -1 )
    {
        return Request::ACTION;
    }

    nd.get_raftm()->delete_server(zs_id);

    if ( nd.is_federation_master() || !nd.is_federation_enabled() )
    {
        zpool->update(zone.get());
    }
    else
    {
        std::string tmpl_xml;

        int z_oid = zone->get_oid();

        zone->to_xml(tmpl_xml);

        if ( Client::client()->master_update_zone(z_oid, tmpl_xml, att.resp_msg) != 0 )
        {
            NebulaLog::log("ReM", Log::ERROR, att.resp_msg);

            return Request::ACTION;
        }
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ZoneAPI::reset_server(int oid,
                                         int zs_id,
                                         RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    if ( oid != nd.get_zone_id() )
    {
        att.resp_msg = "Servers have to be deleted through the target zone"
                       " endpoints";

        return Request::ACTION;
    }

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return Request::AUTHORIZATION;
    }

    nd.get_raftm()->reset_index(zs_id);

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ZoneAPI::enable(int oid,
                                   bool enable,
                                   RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();
    Zone::ZoneState state;

    if ( oid != nd.get_zone_id() )
    {
        att.resp_msg = "Enable/disable mode have to be set through the target"
                       " zone endpoints";

        return Request::ACTION;
    }

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return Request::AUTHORIZATION;
    }

    auto zone = zpool->get(oid);

    if ( enable )
    {
        zone->enable();
        state = Zone::ENABLED;
    }
    else
    {
        zone->disable();
        state = Zone::DISABLED;
    }

    if ( nd.is_federation_master() || !nd.is_federation_enabled() )
    {
        zpool->update(zone.get());
    }
    else
    {
        std::string tmpl_xml;

        zone->to_xml(tmpl_xml);

        if ( Client::client()->master_update_zone(oid, tmpl_xml, att.resp_msg) != 0 )
        {
            NebulaLog::error("ReM", att.resp_msg);

            return Request::ACTION;
        }
    }

    nd.set_zone_state(state);

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ZoneAPI::replicate_log(const ReplicateLogParams& params,
                                          RequestAttributes& att)
{
    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    RaftManager * raftm = nd.get_raftm();

    int leader_id            = params.leader_id;
    uint64_t leader_commit   = params.leader_commit;
    unsigned int leader_term = params.leader_term;

    uint64_t index           = params.index;
    unsigned int term        = params.term;
    uint64_t prev_index      = params.prev_index;
    unsigned int prev_term   = params.prev_term;
    uint64_t fed_index       = params.fed_index;

    std::string sql          = params.sql;

    unsigned int current_term = raftm->get_term();

    LogDBRecord lr, prev_lr;

    if (!att.is_oneadmin())
    {
        att.resp_id  = current_term;

        return Request::AUTHORIZATION;
    }

    if ( nd.is_cache() )
    {
        att.resp_msg = "Server is in cache mode.";
        att.resp_id  = 0;

        return Request::ACTION;
    }

    att.resp_id = current_term;

    if ( leader_term < current_term )
    {
        std::ostringstream oss;

        oss << "Leader term (" << leader_term << ") is outdated ("
            << current_term<<")";

        NebulaLog::log("ReM", Log::INFO, oss);

        att.resp_msg = oss.str();

        return Request::ACTION;
    }
    else if ( leader_term > current_term )
    {
        std::ostringstream oss;

        oss << "New term (" << leader_term << ") discovered from leader "
            << leader_id;

        NebulaLog::log("ReM", Log::INFO, oss);

        raftm->follower(leader_term);
    }

    if ( raftm->is_candidate() )
    {
        raftm->follower(leader_term);
    }

    raftm->update_last_heartbeat(leader_id);

    //--------------------------------------------------------------------------
    // HEARTBEAT
    //--------------------------------------------------------------------------
    if ( index == 0 && prev_index == 0 && term == 0 && prev_term == 0 &&
         sql.empty() )
    {
        unsigned int lterm;
        uint64_t lindex;

        logdb->get_last_record_index(lindex, lterm);

        uint64_t new_commit = raftm->update_commit(leader_commit, lindex);

        logdb->apply_log_records(new_commit);

        return Request::SUCCESS;
    }

    //--------------------------------------------------------------------------
    // REPLICATE
    //   0. Check it is a valid record (prevent spurious entries)
    //   1. Check log consistency (index, and previous index match)
    //   2. Insert record in the log
    //   3. Apply log records that can be safely applied
    //--------------------------------------------------------------------------
    if ( sql.empty() )
    {
        att.resp_msg = "Empty SQL command in log record";

        return Request::ACTION;
    }

    if ( index > 0 )
    {
        if ( logdb->get_log_record(prev_index, prev_index - 1, prev_lr) != 0 )
        {
            att.resp_msg = "Error loading previous log record";

            return Request::ACTION;
        }

        if ( prev_lr.term != prev_term )
        {
            att.resp_msg = "Previous log record missmatch";

            return Request::ACTION;
        }
    }

    if ( logdb->get_log_record(index, index - 1, lr) == 0 )
    {
        if ( lr.term != term )
        {
            logdb->delete_log_records(index);
        }
        else //Already a log record with same index and term
        {
            return Request::SUCCESS;
        }
    }

    ostringstream sql_oss(sql);

    if (logdb->insert_log_record(index, term, sql_oss, 0, fed_index, true) != 0)
    {
        att.resp_msg = "Error writing log record";

        return Request::ACTION;
    }

    uint64_t new_commit = raftm->update_commit(leader_commit, index);

    logdb->apply_log_records(new_commit);

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ZoneAPI::vote(unsigned int candidate_term,
                                 int candidate_id,
                                 uint64_t candidate_log_index,
                                 unsigned int candidate_log_term,
                                 RequestAttributes& att)
{
    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    RaftManager * raftm = nd.get_raftm();

    unsigned int current_term = raftm->get_term();

    unsigned int log_term;
    uint64_t log_index;

    logdb->get_last_record_index(log_index, log_term);

    att.resp_id  = current_term;

    if (candidate_id < 0)
    {
        return Request::INTERNAL;
    }

    if (!att.is_oneadmin())
    {
        return Request::AUTHORIZATION;
    }

    if ( nd.is_cache() )
    {
        att.resp_msg = "Server is in cache mode.";
        att.resp_id  = 0;

        return Request::ACTION;
    }

    if ( candidate_term < current_term )
    {
        att.resp_msg = "Candidate's term is outdated";

        return Request::ACTION;
    }
    else if ( candidate_term > current_term  )
    {
        std::ostringstream oss;

        oss << "New term (" << candidate_term << ") discovered from candidate "
            << candidate_id;

        NebulaLog::log("ReM", Log::INFO, oss);

        raftm->follower(candidate_term);
    }

    if ((log_term > candidate_log_term) || ((log_term == candidate_log_term) &&
                                            (log_index > candidate_log_index)))
    {
        att.resp_msg = "Candidate's log is outdated";

        return Request::ACTION;
    }

    if ( raftm->update_votedfor(candidate_id) != 0 )
    {
        att.resp_msg = "Already voted for another candidate";

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


Request::ErrorCode ZoneAPI::raft_status(std::string& xml,
                                        RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    RaftManager * raftm = nd.get_raftm();

    if ( auto ec = basic_authorization(nd.get_zone_id(), att); ec != Request::SUCCESS )
    {
        return ec;
    }

    raftm->to_xml(xml);

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ZoneAPI::replicate_fed_log(uint64_t index,
                                              uint64_t prev,
                                              std::string sql,
                                              RequestAttributes& att)
{
    std::ostringstream oss;

    Nebula& nd = Nebula::instance();

    FedReplicaManager * frm = nd.get_frm();

    if (!att.is_oneadmin())
    {
        att.replication_idx  = UINT64_MAX;

        return Request::AUTHORIZATION;
    }

    if ( nd.is_cache() )
    {
        att.resp_msg = "Server is in cache mode.";
        att.replication_idx  = UINT64_MAX;

        return Request::ACTION;
    }

    if ( sql.empty() )
    {
        oss << "Received an empty SQL command at index" << index;

        NebulaLog::log("ReM", Log::ERROR, oss);

        att.resp_msg = oss.str();
        att.replication_idx  = UINT64_MAX;

        return Request::REPLICATION;
    }

    if ( !nd.is_federation_slave() )
    {
        oss << "Cannot replicate federate log records on federation master";

        NebulaLog::log("ReM", Log::INFO, oss);

        att.resp_msg = oss.str();
        att.replication_idx  = UINT64_MAX;

        return Request::REPLICATION;
    }

    uint64_t rc = frm->apply_log_record(index, prev, sql);

    if ( rc == 0 )
    {
        att.replication_idx = index;
        return Request::SUCCESS;
    }

    if ( rc == UINT64_MAX )
    {
        oss << "Error replicating log entry " << index << " in zone";
        att.replication_idx  = index;
    }
    else // rc == last_index in log
    {
        oss << "Zone log is outdated last log index is " << rc;
        att.replication_idx  = rc;
    }

    NebulaLog::log("ReM", Log::INFO, oss);
    att.resp_msg = oss.str();

    return Request::REPLICATION;
}
