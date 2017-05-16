/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneAddServer::request_execute(xmlrpc_c::paramList const& paramList,
    RequestAttributes& att)
{
    int    id     = xmlrpc_c::value_int(paramList.getInt(1));
    string zs_str = xmlrpc_c::value_string(paramList.getString(2));
	int    zs_id;

    string error_str;

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

    Zone * zone = (static_cast<ZonePool *>(pool))->get(id, true);

    if ( zone == 0 )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);

        return;
    }

    if ( zone->add_server(zs_tmpl, zs_id, att.resp_msg) == -1 )
    {
        failure_response(ACTION, att);

        return;
    }

    pool->update(zone);

    zone->unlock();

	Nebula::instance().get_raftm()->add_server(zs_id);

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneDeleteServer::request_execute(xmlrpc_c::paramList const& paramList,
    RequestAttributes& att)
{
    int id    = xmlrpc_c::value_int(paramList.getInt(1));
    int zs_id = xmlrpc_c::value_int(paramList.getInt(2));

    string error_str;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    Zone * zone = (static_cast<ZonePool *>(pool))->get(id, true);

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

    pool->update(zone);

    zone->unlock();

	Nebula::instance().get_raftm()->delete_server(zs_id);

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

    int leader_id     = xmlrpc_c::value_int(paramList.getInt(1));
    int leader_commit = xmlrpc_c::value_int(paramList.getInt(2));
    unsigned int leader_term = xmlrpc_c::value_int(paramList.getInt(3));

    unsigned int index      = xmlrpc_c::value_int(paramList.getInt(4));
    unsigned int term       = xmlrpc_c::value_int(paramList.getInt(5));
    unsigned int prev_index = xmlrpc_c::value_int(paramList.getInt(6));
    unsigned int prev_term  = xmlrpc_c::value_int(paramList.getInt(7));

    string sql = xmlrpc_c::value_string(paramList.getString(8));

    unsigned int current_term = raftm->get_term();

    LogDBRecord lr, prev_lr;

    if ( att.uid != 0 )
    {
        att.resp_id  = current_term;

        failure_response(AUTHORIZATION, att);
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

    //HEARTBEAT
    if ( index == 0 && prev_index == 0 && term == 0 && prev_term == 0 &&
         sql.empty() )
    {
        unsigned int lindex, lterm;

        logdb->get_last_record_index(lindex, lterm);

        unsigned int new_commit = raftm->update_commit(leader_commit, lindex);

        logdb->apply_log_records(new_commit);

        success_response(static_cast<int>(current_term), att);
        return;
    }

    //REPLICATE
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

    if ( logdb->get_log_record(index, lr) != 0 )
    {
        if ( lr.term != term )
        {
            logdb->delete_log_records(index);
        }
    }

    ostringstream sql_oss(sql);

    if ( logdb->insert_log_record(index, term, sql_oss, 0) != 0 )
    {
        att.resp_msg = "Error writing log record";
        att.resp_id  = current_term;

        failure_response(ACTION, att);
        return;
    }

    unsigned int new_commit = raftm->update_commit(leader_commit, index);

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

    unsigned int candidate_log_index = xmlrpc_c::value_int(paramList.getInt(3));
    unsigned int candidate_log_term  = xmlrpc_c::value_int(paramList.getInt(4));

    unsigned int current_term = raftm->get_term();

    unsigned int log_index, log_term;

    logdb->get_last_record_index(log_index, log_term);

    if ( att.uid != 0 )
    {
        att.resp_id  = current_term;

        failure_response(AUTHORIZATION, att);
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

