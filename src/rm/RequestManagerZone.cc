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

    int leader_id  = xmlrpc_c::value_int(paramList.getInt(1));
    int commit     = xmlrpc_c::value_int(paramList.getInt(2));

    unsigned int index      = xmlrpc_c::value_int(paramList.getInt(3));
    unsigned int term       = xmlrpc_c::value_int(paramList.getInt(4));
    unsigned int prev_index = xmlrpc_c::value_int(paramList.getInt(5));
    unsigned int prev_term  = xmlrpc_c::value_int(paramList.getInt(6));

    string sql = xmlrpc_c::value_string(paramList.getString(7));

    unsigned int current_term = raftm->get_term();

    LogDBRecord * lr;

    if ( att.uid != 0 )
    {
        att.resp_id  = current_term;

        failure_response(AUTHORIZATION, att);
        return;
    }

    if ( !raftm->is_follower() )
    {
        att.resp_msg = "oned is not a follower. Cannot replicate log record.";
        att.resp_id  = current_term;

        failure_response(ACTION, att);
        return;
    }

    if ( term < current_term )
    {
        att.resp_msg = "Leader term is outdated";
        att.resp_id  = current_term;

        failure_response(ACTION, att);
        return;
    }

    raftm->update_last_heartbeat();

    //HEARTBEAT
    if ( index == 0 && prev_index == 0 && term == 0 && prev_term == 0 &&
         sql.empty() )
    {
        success_response(static_cast<int>(current_term), att);
        return;
    }

    //REPLICATE
    if ( index > 0 )
    {
        lr = logdb->get_log_record(prev_index);

        if ( lr == 0 )
        {
            att.resp_msg = "Previous log record missing";
            att.resp_id  = current_term;

            failure_response(ACTION, att);
            return;
        }

        if ( lr->prev_term != prev_term )
        {
            delete lr;

            att.resp_msg = "Previous log record missmatch";
            att.resp_id  = current_term;

            failure_response(ACTION, att);
            return;
        }

        delete lr;
    }

    lr = logdb->get_log_record(index);

    if ( lr != 0 )
    {
        if ( lr->term != term )
        {
            logdb->delete_log_records(index);
        }
    }

    ostringstream sql_oss(sql);

    logdb->insert_log_record(index, term, sql_oss, 0);

    unsigned int new_commit = raftm->update_commit(commit, index);

    logdb->apply_log_records(new_commit);

    success_response(static_cast<int>(current_term), att);
}

