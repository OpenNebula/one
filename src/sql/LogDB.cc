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

const char * LogDB::db_names = "log_index, term, sql, timestamp";

const char * LogDB::db_bootstrap = "CREATE TABLE IF NOT EXISTS "
    "logdb (log_index INTEGER PRIMARY KEY, term INTEGER, sql MEDIUMTEXT, "
    "timestamp INTEGER)";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

LogDB::LogDB(SqlDB * _db, bool _solo, const std::string& _lret):solo(_solo),
    db(_db), next_index(0), last_applied(-1), log_retention(_lret)
{
    int r, i;

    pthread_mutex_init(&mutex, 0);

    setup_index(r, i);
};

LogDB::~LogDB()
{
    delete db;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::setup_index_cb(void *int_value, int num, char **values, char **names)
{
    int * value = static_cast<int *>(int_value);

    if ( values[0] != 0 && num == 1 )
    {
        *value = atoi(values[0]);
    }

    return 0;
}

int LogDB::setup_index(int& _last_applied, int& _last_index)
{
    std::ostringstream oss;
    int rc = 0;

    _last_applied = 0;
    _last_index   = -1;

    set_callback(static_cast<Callbackable::Callback>(&LogDB::setup_index_cb),
            static_cast<void *>(&_last_index));

    oss << "SELECT MAX(log_index) FROM logdb";

    rc += db->exec_rd(oss, this);

    unset_callback();

    if ( rc == 0 )
    {
        pthread_mutex_lock(&mutex);

        next_index = _last_index + 1;

        pthread_mutex_unlock(&mutex);
    }

    oss.str("");

    set_callback(static_cast<Callbackable::Callback>(&LogDB::setup_index_cb),
            static_cast<void *>(&_last_applied));

    oss << "SELECT MAX(log_index) FROM logdb WHERE timestamp != 0";

    rc += db->exec_rd(oss, this);

    unset_callback();

    if ( rc == 0 )
    {
        pthread_mutex_lock(&mutex);

        last_applied = _last_applied;

        pthread_mutex_unlock(&mutex);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::select_cb(void *req, int num, char **values, char **names)
{
    if ( !values[0] || !values[1] || !values[2] || !values[3] || !values[4]
            || !values[5] || num != 6 )
    {
        return -1;
    }

    LogDBRecord ** request = static_cast<LogDBRecord **>(req);

    *request = new LogDBRecord;

    (*request)->index = static_cast<unsigned int>(atoi(values[0]));
    (*request)->term  = static_cast<unsigned int>(atoi(values[1]));
    (*request)->sql   = values[2];

    (*request)->timestamp  = static_cast<unsigned int>(atoi(values[3]));

    (*request)->prev_index = static_cast<unsigned int>(atoi(values[4]));
    (*request)->prev_term  = static_cast<unsigned int>(atoi(values[5]));

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

LogDBRecord * LogDB::get_log_record(unsigned int index)
{
    ostringstream oss;

    LogDBRecord * request = 0;

    int prev_index = index - 1;

    if ( prev_index < 0 )
    {
        prev_index = 0;
    }

    oss << "SELECT c.log_index, c.term, c.sql, c.timestamp, p.log_index, p.term"
        << " FROM logdb c, logdb p WHERE c.log_index = " << index
        << " AND p.log_index = " << prev_index;

    set_callback(static_cast<Callbackable::Callback>(&LogDB::select_cb),
            static_cast<void *>(&request));

    db->exec_rd(oss, this);

    unset_callback();

    return request;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::insert_replace(int index, int term, const std::string& sql,
        time_t timestamp, bool replace)
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
        << "'" << sql_db << "',"
        << timestamp << ")";

    int rc = db->exec_wr(oss);

    db->free_str(sql_db);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::apply_log_record(LogDBRecord * lr)
{
    ostringstream oss_sql;

    oss_sql.str(lr->sql);

    int rc = db->exec_wr(oss_sql);

    insert_replace(lr->index, lr->term, lr->sql, time(0), true);

    if ( rc == 0 )
    {
        last_applied = lr->index;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::insert_log_record(unsigned int term, std::ostringstream& sql,
        time_t timestamp)
{
    pthread_mutex_lock(&mutex);

    unsigned int index = next_index;

    if ( insert_replace(index, term, sql.str(), timestamp, false) != 0 )
    {
        NebulaLog::log("DBM", Log::ERROR, "Cannot insert log record in DB");

        pthread_mutex_unlock(&mutex);

        return -1;
    }

    next_index++;

    pthread_mutex_unlock(&mutex);

    return index;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::exec_wr(ostringstream& cmd)
{
    int rc;

    RaftManager * raftm = Nebula::instance().get_raftm();

    // -------------------------------------------------------------------------
    // OpenNebula was started in solo mode
    // -------------------------------------------------------------------------
    if ( solo )
    {
        //TODO USE LAST_TERM IN SOlO MODE TO REENGAGE HA
        if ( insert_log_record(0, cmd, time(0)) == -1 )
        {
            return -1;
        }

        return db->exec_wr(cmd);
    }
    else if ( raftm == 0 || !raftm->is_leader() )
    {
        NebulaLog::log("DBM", Log::ERROR,"Tried to modify DB being a follower");
        return -1;
    }

    // -------------------------------------------------------------------------
    // Insert log entry in the database and replicate on followers
    // -------------------------------------------------------------------------
    int rindex = insert_log_record(raftm->get_term(), cmd, 0);

    if ( rindex == -1 )
    {
        return -1;
    }

    ReplicaRequest rr(rindex);

    raftm->replicate_log(&rr);

    // Wait for completion
    rr.wait();

    if ( !raftm->is_leader() ) // Check we are still leaders before applying
    {
        NebulaLog::log("DBM", Log::ERROR, "Not applying log record, oned is"
                " now a follower");
        rc = -1;
    }
    else if ( rr.result == true ) //Record replicated on majority of followers
    {
		rc = apply_log_records(rindex);
    }
    else
    {
        std::ostringstream oss;

        oss << "Cannot replicate log record on followers: " << rr.message;

        NebulaLog::log("DBM", Log::ERROR, oss);

        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::delete_log_records(unsigned int start_index)
{
    std::ostringstream oss;
    int rc;

    oss << "DELETE FROM " << table << " WHERE log_index >= start_index";

    rc = db->exec_wr(oss);

    if ( rc == 0 )
    {
        pthread_mutex_lock(&mutex);

        next_index = start_index;

        pthread_mutex_unlock(&mutex);
    }

	return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::apply_log_records(unsigned int commit_index)
{
	int rc;

    pthread_mutex_lock(&mutex);

	while (last_applied < commit_index )
	{
    	LogDBRecord * lr = get_log_record(last_applied + 1);

		if ( lr == 0 )
		{
            pthread_mutex_unlock(&mutex);
			return -1;
		}

		rc = apply_log_record(lr);

		delete lr;

		if ( rc != 0 )
		{
            pthread_mutex_unlock(&mutex);
			return -1;
		}
	}

    pthread_mutex_unlock(&mutex);

	return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::purge_log()
{
    std::ostringstream oss;

    // keep the last "log_retention" records as well as those not applied to DB
    oss << "DELETE FROM logdb WHERE timestamp >0 AND log_index NOT IN "
        << "(SELECT log_index FROM logdb ORDER BY log_index DESC LIMIT "
        << log_retention <<")";

    return db->exec_wr(oss);
}

