/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestManagerZone.h"
#include "Nebula.h"
#include "Client.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static Request::ErrorCode master_update_zone(int oid, const std::string& xml,
        RequestAttributes& att)
{
    Client * client = Client::client();

    xmlrpc_c::value         result;
    vector<xmlrpc_c::value> values;

    std::ostringstream oss("Cannot update zone at federation master: ",
            std::ios::ate);
    try
    {
        client->call("one.zone.updatedb", "is", &result, oid, xml.c_str());
    }
    catch (exception const& e)
    {
        oss << e.what();
        att.resp_msg = oss.str();

        return Request::ACTION;
    }

    values = xmlrpc_c::value_array(result).vectorValueValue();

    if ( xmlrpc_c::value_boolean(values[0]) == false )
    {
        std::string e = xmlrpc_c::value_string(values[1]);
        oss << e;

        att.resp_msg = oss.str();

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneAddServer::request_execute(xmlrpc_c::paramList const& paramList,
    RequestAttributes& att)
{
    Nebula& nd    = Nebula::instance();

    int    id     = xmlrpc_c::value_int(paramList.getInt(1));
    string zs_str = xmlrpc_c::value_string(paramList.getString(2));
	int    zs_id;

    string error_str, xmlep;

    if ( id != nd.get_zone_id() )
    {
        att.resp_msg = "Servers have to be added through the target zone"
             " endpoints";
        failure_response(ACTION, att);

        return;
    }

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    Template zs_tmpl;

    int rc = zs_tmpl.parse_str_or_xml(zs_str, error_str);

    if ( rc != 0 )
    {
        att.resp_msg = error_str;
        failure_response(ACTION, att);

        return;
    }

    Zone * zone = (static_cast<ZonePool *>(pool))->get(id);

    if ( zone == 0 )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);

        return;
    }

    if ( zone->add_server(zs_tmpl, zs_id, xmlep, att.resp_msg) == -1 )
    {
        failure_response(ACTION, att);

        return;
    }

    if ( nd.is_federation_master() || !nd.is_federation_enabled() )
    {
        std::vector<int> zids;

        pool->update(zone);

        zone->unlock();
    }
    else
    {
        std::string tmpl_xml;

        int oid = zone->get_oid();

        unsigned int numservers = zone->servers_size();

        zone->to_xml(tmpl_xml);

        ErrorCode ec = master_update_zone(oid, tmpl_xml, att);

        zone->unlock();

        if ( ec != SUCCESS )
        {
            NebulaLog::log("ReM", Log::ERROR, att.resp_msg);

            failure_response(ec, att);
            return;
        }

        //Wait for zone update to propagate from master before adding the
        //new server
        if ( numservers == 2 )
        {
            bool updated = false;

            while (!updated)
            {
                Zone * zone = (static_cast<ZonePool *>(pool))->get(id);

                if ( zone != 0 )
                {
                    if ( zone->get_server(zs_id) != 0 )
                    {
                        updated = true;
                    }

                    zone->unlock();
                }

                usleep(250000);
            }
        }
    }

	nd.get_raftm()->add_server(zs_id, xmlep);

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneDeleteServer::request_execute(xmlrpc_c::paramList const& paramList,
    RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    int id     = xmlrpc_c::value_int(paramList.getInt(1));
    int zs_id  = xmlrpc_c::value_int(paramList.getInt(2));

    string error_str;

    if ( id != nd.get_zone_id() )
    {
        att.resp_msg = "Servers have to be deleted through the target zone"
             " endpoints";
        failure_response(ACTION, att);

        return;
    }

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    Zone * zone = (static_cast<ZonePool *>(pool))->get(id);

    if ( zone == 0 )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);

        return;
    }

    if ( zone->delete_server(zs_id, att.resp_msg) == -1 )
    {
        failure_response(ACTION, att);
        zone->unlock();

        return;
    }

	nd.get_raftm()->delete_server(zs_id);

    if ( nd.is_federation_master() || !nd.is_federation_enabled() )
    {
        std::vector<int> zids;

        pool->update(zone);

        zone->unlock();
    }
    else
    {
        std::string tmpl_xml;

        int oid = zone->get_oid();

        zone->to_xml(tmpl_xml);

        ErrorCode ec = master_update_zone(oid, tmpl_xml, att);

        zone->unlock();

        if ( ec != SUCCESS )
        {
            NebulaLog::log("ReM", Log::ERROR, att.resp_msg);

            failure_response(ec, att);
            return;
        }
    }

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneResetServer::request_execute(xmlrpc_c::paramList const& paramList,
    RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    int id     = xmlrpc_c::value_int(paramList.getInt(1));
    int zs_id  = xmlrpc_c::value_int(paramList.getInt(2));

    string error_str;

    if ( id != nd.get_zone_id() )
    {
        att.resp_msg = "Servers have to be deleted through the target zone"
             " endpoints";
        failure_response(ACTION, att);

        return;
    }

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

	nd.get_raftm()->reset_index(zs_id);

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneReplicateLog::request_execute(xmlrpc_c::paramList const& paramList,
    RequestAttributes& att)
{
    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    RaftManager * raftm = nd.get_raftm();

    int leader_id            = xmlrpc_c::value_int(paramList.getInt(1));
    uint64_t leader_commit   = xmlrpc_c::value_i8(paramList.getI8(2));
    unsigned int leader_term = xmlrpc_c::value_int(paramList.getInt(3));

    uint64_t index          = xmlrpc_c::value_i8(paramList.getI8(4));
    unsigned int term       = xmlrpc_c::value_int(paramList.getInt(5));
    uint64_t prev_index     = xmlrpc_c::value_i8(paramList.getI8(6));
    unsigned int prev_term  = xmlrpc_c::value_int(paramList.getInt(7));
    uint64_t fed_index      = xmlrpc_c::value_i8(paramList.getI8(8));

    string sql = xmlrpc_c::value_string(paramList.getString(9));

    unsigned int current_term = raftm->get_term();

    LogDBRecord lr, prev_lr;

    if (!att.is_oneadmin())
    {
        att.resp_id  = current_term;

        failure_response(AUTHORIZATION, att);
        return;
    }

    if ( nd.is_cache() )
    {
        att.resp_msg = "Server is in cache mode.";
        att.resp_id  = 0;

        failure_response(ACTION, att);
        return;
    }

    if ( leader_term < current_term )
    {
        std::ostringstream oss;

        oss << "Leader term (" << leader_term << ") is outdated ("
            << current_term<<")";

        NebulaLog::log("ReM", Log::INFO, oss);

        att.resp_msg = oss.str();
        att.resp_id  = current_term;

        failure_response(ACTION, att);
        return;
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

        success_response(static_cast<int>(current_term), att);
        return;
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
        att.resp_id  = current_term;

        failure_response(ACTION, att);
        return;
    }

    if ( index > 0 )
    {
        if ( logdb->get_log_record(prev_index, prev_lr) != 0 )
        {
            att.resp_msg = "Error loading previous log record";
            att.resp_id  = current_term;

            failure_response(ACTION, att);
            return;
        }

        if ( prev_lr.term != prev_term )
        {
            att.resp_msg = "Previous log record missmatch";
            att.resp_id  = current_term;

            failure_response(ACTION, att);
            return;
        }
    }

    if ( logdb->get_log_record(index, lr) == 0 )
    {
        if ( lr.term != term )
        {
            logdb->delete_log_records(index);
        }
        else //Already a log record with same index and term
        {
            success_response(static_cast<int>(current_term), att);
            return;
        }
    }

    ostringstream sql_oss(sql);

    if (logdb->insert_log_record(index, term, sql_oss, 0, fed_index, true) != 0)
    {
        att.resp_msg = "Error writing log record";
        att.resp_id  = current_term;

        failure_response(ACTION, att);
        return;
    }

    uint64_t new_commit = raftm->update_commit(leader_commit, index);

    logdb->apply_log_records(new_commit);

    success_response(static_cast<int>(current_term), att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneVoteRequest::request_execute(xmlrpc_c::paramList const& paramList,
    RequestAttributes& att)
{
    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    RaftManager * raftm = nd.get_raftm();

    unsigned int candidate_term  = xmlrpc_c::value_int(paramList.getInt(1));
    unsigned int candidate_id    = xmlrpc_c::value_int(paramList.getInt(2));

    uint64_t candidate_log_index = xmlrpc_c::value_i8(paramList.getI8(3));
    unsigned int candidate_log_term  = xmlrpc_c::value_int(paramList.getInt(4));

    unsigned int current_term = raftm->get_term();

    unsigned int log_term;
    uint64_t log_index;

    logdb->get_last_record_index(log_index, log_term);

    if (!att.is_oneadmin())
    {
        att.resp_id  = current_term;

        failure_response(AUTHORIZATION, att);
        return;
    }

    if ( nd.is_cache() )
    {
        att.resp_msg = "Server is in cache mode.";
        att.resp_id  = 0;

        failure_response(ACTION, att);
        return;
    }

    if ( candidate_term < current_term )
    {
        att.resp_msg = "Candidate's term is outdated";
        att.resp_id  = current_term;

        failure_response(ACTION, att);
        return;
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
        att.resp_id  = current_term;

        failure_response(ACTION, att);
        return;
    }

    if ( raftm->update_votedfor(candidate_id) != 0 )
    {
        att.resp_msg = "Already voted for another candidate";
        att.resp_id  = current_term;

        failure_response(ACTION, att);
        return;
    }

    raftm->update_last_heartbeat(-1);

    success_response(static_cast<int>(current_term), att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneRaftStatus::request_execute(xmlrpc_c::paramList const& paramList,
    RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    RaftManager * raftm = nd.get_raftm();

    std::string raft_xml;

    if ( basic_authorization(nd.get_zone_id(), att) == false )
    {
        return;
    }

    raftm->to_xml(raft_xml);

    success_response(raft_xml, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneReplicateFedLog::request_execute(xmlrpc_c::paramList const& paramList,
    RequestAttributes& att)
{
    std::ostringstream oss;

    Nebula& nd = Nebula::instance();

    FedReplicaManager * frm = nd.get_frm();

    uint64_t index  = xmlrpc_c::value_i8(paramList.getI8(1));
    uint64_t prev   = xmlrpc_c::value_i8(paramList.getI8(2));
    string sql = xmlrpc_c::value_string(paramList.getString(3));

    if (!att.is_oneadmin())
    {
        att.replication_idx  = UINT64_MAX;

        failure_response(AUTHORIZATION, att);
        return;
    }

    if ( nd.is_cache() )
    {
        att.resp_msg = "Server is in cache mode.";
        att.replication_idx  = UINT64_MAX;

        failure_response(ACTION, att);
        return;
    }

    if ( sql.empty() )
    {
        oss << "Received an empty SQL command at index" << index;

        NebulaLog::log("ReM", Log::ERROR, oss);

        att.resp_msg = oss.str();
        att.replication_idx  = UINT64_MAX;

        failure_response_replication(att);
        return;
    }

    if ( !nd.is_federation_slave() )
    {
        oss << "Cannot replicate federate log records on federation master";

        NebulaLog::log("ReM", Log::INFO, oss);

        att.resp_msg = oss.str();
        att.replication_idx  = UINT64_MAX;

        failure_response_replication(att);
        return;
    }

    uint64_t rc = frm->apply_log_record(index, prev, sql);

    if ( rc == 0 )
    {
        success_response(index, att);
    }
    else if ( rc == UINT64_MAX )
    {
        oss << "Error replicating log entry " << index << " in zone";

        NebulaLog::log("ReM", Log::INFO, oss);

        att.resp_msg = oss.str();
        att.replication_idx  = index;

        failure_response_replication(att);
    }
    else // rc == last_index in log
    {
        oss << "Zone log is outdated last log index is " << rc;

        NebulaLog::log("ReM", Log::INFO, oss);

        att.resp_msg = oss.str();
        att.replication_idx  = rc;

        failure_response_replication(att);
    }

    return;
}

