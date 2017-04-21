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

#include "LogDB.h"
#include "Nebula.h"
#include "ZoneServer.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * LogDB::table = "logdb";

const char * LogDB::db_names = "log_index, term, sql";

const char * LogDB::db_bootstrap = "CREATE TABLE IF NOT EXISTS "
    "logdb (log_index INTEGER PRIMARY KEY, term INTEGER, sql MEDIUMTEXT)";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

LogDBRequest * LogDB::get_request(unsigned int index)
{
    std::map<unsigned int, LogDBRequest *>::iterator it;

    LogDBRequest * req = 0;

    pthread_mutex_lock(&mutex);

    it = requests.find(index);

    if ( it != requests.end() )
    {
        req = it->second;
    }

    pthread_mutex_unlock(&mutex);

    if ( req == 0  )
    {
        LogDBRequest * req = select(index);

        if ( req != 0 )
        {
            pthread_mutex_lock(&mutex);

            requests.insert(std::make_pair(index, req));

            pthread_mutex_unlock(&mutex);
        }
    }

    return req;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
int LogDB::exec_wr(ostringstream& cmd)
{
    int rc;

    Nebula& nd       = Nebula::instance();
    ZonePool * zpool = nd.get_zonepool();

    int server_id = nd.get_server_id();
    int zone_id   = nd.get_zone_id();

    ZoneServer * server = 0;
    unsigned int term   = 0;

    bool is_leader;

    if ( server_id != -1 )
    {
        Zone * zone = zpool->get(zone_id, true);

        if ( zone != 0  )
        {
            if ( zone->servers_size() > 1 )
            {
                server = zone->get_server(server_id);
                term   = server->get_term();
            }

            if ( server != 0 )
            {
                is_leader = server->is_leader();
            }

            zone->unlock();
        }
    }

    // -------------------------------------------------------------------------
    // OpenNebula was started in solo mode
    // -------------------------------------------------------------------------
    if ( server == 0 )
    {
        pthread_mutex_lock(&mutex);

        LogDBRequest lr(next_index, term, cmd);

        next_index++;

        pthread_mutex_unlock(&mutex);

        if ( insert_replace(&lr, false) != 0 )
        {
            NebulaLog::log("DBM", Log::ERROR, "Cannot insert log record in DB");
        }

        return db->exec_wr(cmd);
    }

    // -------------------------------------------------------------------------
    // Insert log entry in the database and replicate on followers
    // -------------------------------------------------------------------------

    if ( ! is_leader )
    {
        NebulaLog::log("DBM", Log::ERROR,"Tried to modify DB being a follower");
        return -1;
    }

    pthread_mutex_lock(&mutex);

    LogDBRequest * lr = new LogDBRequest(next_index, term, cmd);

    requests.insert(std::make_pair(next_index, lr));

    next_index++;

    pthread_mutex_unlock(&mutex);

    if ( insert_replace(lr, false) != 0 )
    {
        NebulaLog::log("DBM", Log::ERROR, "Cannot insert log record in DB");
    }


    //LogDBManager->triger(NEW_LOG_RECORD);

    // Wait for completion
    lr->wait();

    if ( lr->result == true ) //Record replicated on majority of followers
    {
        rc = db->exec_wr(cmd);
    }
    else
    {
        std::ostringstream oss;

        oss << "Cannot replicate log record on followers: " << lr->message;

        NebulaLog::log("DBM", Log::ERROR, oss);

        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::select_cb(void *req, int num, char **values, char **names)
{
    if ( (!values[0]) || (!values[1]) || (!values[2]) || (num != 1) )
    {
        return -1;
    }

    LogDBRequest ** request = static_cast<LogDBRequest **>(req);

    unsigned int index = static_cast<unsigned int>(atoi(values[0]));
    unsigned int term  = static_cast<unsigned int>(atoi(values[1]));

    *request = new LogDBRequest(index, term, values[2]);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

LogDBRequest * LogDB::select(int index)
{
    ostringstream oss;

    LogDBRequest * request = 0;

    oss << "SELECT index, term, sql FROM logdb WHERE index = " << index;

    set_callback(static_cast<Callbackable::Callback>(&LogDB::select_cb),
            static_cast<void *>(&request));

    db->exec_rd(oss, this);

    return request;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::insert_replace(LogDBRequest * request, bool replace)
{
    std::ostringstream oss;

    char * sql_db = db->escape_str(request->sql().c_str());

    if ( sql_db == 0 )
    {
        return -1;
    }

    if (replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    oss << " INTO " << table << " ("<< db_names <<") VALUES ("
        << request->index() << ","
        << request->term() << ","
        << "'" << sql_db << "')";

    int rc = db->exec_wr(oss);

    db->free_str(sql_db);

    return rc;
}
