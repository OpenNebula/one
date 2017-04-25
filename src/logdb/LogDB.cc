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

int LogDB::init_cb(void *nil, int num, char **values, char **names)
{
    if ( values[0] != 0 )
    {
        next_index = atoi(values[0]) + 1;
    }

    return 0;
}

LogDB::LogDB(SqlDB * _db):db(_db), next_index(0)
{
    ostringstream   oss;

    pthread_mutex_init(&mutex, 0);

    set_callback(static_cast<Callbackable::Callback>(&LogDB::init_cb));

    oss << "SELECT MAX(log_index) FROM logdb";

    db->exec_rd(oss,this);

    unset_callback();
};

LogDB::~LogDB()
{
    std::map<unsigned int, LogDBRequest *>::iterator it;

    for ( it = requests.begin(); it != requests.end(); ++it )
    {
        delete it->second;
    }

    delete db;
};

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

    Zone * zone;

    int server_id = nd.get_server_id();
    int zone_id   = nd.get_zone_id();

    ZoneServer * server = 0;
    unsigned int term   = 0;

    unsigned int num_servers;

    bool is_leader;

    if ( server_id != -1 && zpool != 0 )
    {
        zone = zpool->get(zone_id, true);

        if ( zone != 0  )
        {
            num_servers = zone->servers_size();

            if ( num_servers > 1 )
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

        unsigned int index = next_index++;

        pthread_mutex_unlock(&mutex);

        if ( insert_replace(index, term, cmd.str(), false) != 0 )
        {
            NebulaLog::log("DBM", Log::ERROR, "Cannot insert log record in DB");
        }

        return db->exec_wr(cmd);
    }

    // -------------------------------------------------------------------------
    // Insert log entry in the database and replicate on followers
    // -------------------------------------------------------------------------

    if ( !is_leader )
    {
        NebulaLog::log("DBM", Log::ERROR,"Tried to modify DB being a follower");
        return -1;
    }

    pthread_mutex_lock(&mutex);

    if ( insert_replace(next_index, term, cmd.str(), false) != 0 )
    {
        NebulaLog::log("DBM", Log::ERROR, "Cannot insert log record in DB");

        pthread_mutex_unlock(&mutex);

        return -1;
    }

    LogDBRequest * lr = select(next_index);

    lr->to_commit(num_servers/2);

    requests.insert(std::make_pair(next_index, lr));

    next_index++;

    pthread_mutex_unlock(&mutex);

    zone = zpool->get(zone_id, true);

    if ( zone == 0 )
    {
        return -1;
    }

    server = zone->get_server(server_id);

    if ( server == 0 )
    {
        zone->unlock();

        return -1;
    }

    server->logdbm_replicate();

    zone->unlock();

    // Wait for completion
    lr->wait();

	bool replica_result = lr->result;

    if ( replica_result == true ) //Record replicated on majority of followers
    {
        zone = zpool->get(zone_id, true);

        if ( zone == 0 )
        {
            return -1;
        }

        server = zone->get_server(server_id);

        if ( server == 0 )
        {
            zone->unlock();

            return -1;
        }

		server->set_commit(next_index);

		while ( server->get_commit() > server->get_applied() )
		{
			ostringstream oss_sql;

			LogDBRequest * lr = select(server->get_applied());

			oss_sql.str(lr->sql());

			rc += db->exec_wr(oss_sql);

			oss_sql.str("");

			oss_sql << "Log record " << server->get_applied() << " applied to "
				    << "DB. Server index: commit - " << server->get_commit();

			server->inc_applied();

			oss_sql << " applied - " << server->get_applied();
		}

        zone->unlock();
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
    if ( !values[0] || !values[1] || !values[2] || !values[3] || !values[4]
            || num != 1 )
    {
        return -1;
    }

    LogDBRequest ** request = static_cast<LogDBRequest **>(req);

    unsigned int index = static_cast<unsigned int>(atoi(values[0]));
    unsigned int term  = static_cast<unsigned int>(atoi(values[1]));
    unsigned int prev_index = static_cast<unsigned int>(atoi(values[3]));
    unsigned int prev_term  = static_cast<unsigned int>(atoi(values[4]));

    *request = new LogDBRequest(index, term, prev_index, prev_term, values[2]);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

LogDBRequest * LogDB::select(int index)
{
    ostringstream oss;

    LogDBRequest * request = 0;

    int prev_index = index - 1;

    if ( prev_index < 0 )
    {
        prev_index = 0;
    }

    oss << "SELECT c.log_index, c.term, c.sql, p.log_index, p.term"
        << " FROM logdb l, logdbc WHERE l.log_index = " << index
        << " WHERE l.log_index = " << index << " AND p.log_index = "
        << prev_index;

    set_callback(static_cast<Callbackable::Callback>(&LogDB::select_cb),
            static_cast<void *>(&request));

    db->exec_rd(oss, this);

    return request;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::insert_replace(int index, int term, const std::string& sql,
        bool replace)
{
    std::ostringstream oss;

    char * sql_db = db->escape_str(sql.c_str());

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
        << index << ","
        << term << ","
        << "'" << sql_db << "')";

    int rc = db->exec_wr(oss);

    db->free_str(sql_db);

    return rc;
}
