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

#include "LogDB.h"
#include "Nebula.h"
#include "NebulaUtil.h"
#include "ZoneServer.h"
#include "Callbackable.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * LogDB::table = "logdb";

const char * LogDB::db_names = "log_index, term, sqlcmd, timestamp, fed_index, applied";

const char * LogDB::db_bootstrap = "CREATE TABLE IF NOT EXISTS "
    "logdb (log_index BIGINT UNSIGNED PRIMARY KEY, term INTEGER, sqlcmd MEDIUMTEXT, "
    "timestamp INTEGER, fed_index BIGINT UNSIGNED, applied BOOLEAN)";

/* -------------------------------------------------------------------------- */

int LogDB::bootstrap(SqlDB *_db)
{
    int rc;

    std::ostringstream oss(db_bootstrap);

    rc = _db->exec_local_wr(oss);

    // Create indexes
    oss.str("CREATE INDEX fed_index_idx on logdb (fed_index);");

    rc += _db->exec_local_wr(oss);

    oss.str("CREATE INDEX applied_idx on logdb (applied);");

    rc += _db->exec_local_wr(oss);

    return rc;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDBRecord::select_cb(void *nil, int num, char **values, char **names)
{
    if ( !values || !values[0] || !values[1] || !values[2] || !values[3] ||
            !values[4] || !values[5] || !values[6] || num != 7 )
    {
        return -1;
    }

    std::string zsql;

    std::string * _sql;

    std::istringstream iss;

    iss.str(string(values[0]));
    iss >> index;
    iss.clear();

    term  = static_cast<unsigned int>(atoi(values[1]));
    zsql  = values[2];

    timestamp  = static_cast<unsigned int>(atoi(values[3]));

    iss.str(string(values[4]));
    iss >> fed_index;
    iss.clear();

    iss.str(string(values[5]));
    iss >> prev_index;
    iss.clear();

    prev_term  = static_cast<unsigned int>(atoi(values[6]));

    _sql = one_util::zlib_decompress(zsql, true);

    if ( _sql == 0 )
    {

        std::ostringstream oss;

        oss << "Error zlib inflate for " << index << ", " << fed_index
            << ", " << zsql;

        NebulaLog::log("DBM", Log::ERROR, oss);

        return -1;
    }

    sql = *_sql;

    delete _sql;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

LogDB::LogDB(SqlDB * _db, bool _solo, bool _cache, uint64_t _lret, uint64_t _lp):
    solo(_solo), cache(_cache), db(_db), next_index(0), last_applied(-1), last_index(-1),
    last_term(-1), log_retention(_lret), limit_purge(_lp)
{
    uint64_t r, i;

    pthread_mutex_init(&mutex, 0);

    LogDBRecord lr;

    if ( get_log_record(0, lr) != 0 )
    {
        std::ostringstream oss;

        oss << time(0);

        insert_log_record(0, 0, oss, time(0), -1, false);
    }

    setup_index(r, i);
};

LogDB::~LogDB()
{
    delete db;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::setup_index(uint64_t& _last_applied, uint64_t& _last_index)
{
    int rc = 0;

    std::ostringstream oss;

    single_cb<uint64_t> cb;

    LogDBRecord lr;

    _last_applied = 0;
    _last_index   = UINT64_MAX;

    pthread_mutex_lock(&mutex);

    cb.set_callback(&_last_index);

    oss << "SELECT MAX(log_index) FROM logdb";

    rc += db->exec_rd(oss, &cb);

    if ( rc == 0 && cb.get_affected_rows() != 0)
    {
        next_index = _last_index + 1;
        last_index = _last_index;
    }

    cb.unset_callback();

    oss.str("");

    cb.set_callback(&_last_applied);

    oss << "SELECT MAX(log_index) FROM logdb WHERE applied = 1";

    rc += db->exec_rd(oss, &cb);

    cb.unset_callback();

    if ( rc == 0 )
    {
        last_applied = _last_applied;
    }

    rc += get_log_record(last_index, lr);

    if ( rc == 0 )
    {
        last_term = lr.term;
    }

    build_federated_index();

    pthread_mutex_unlock(&mutex);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::get_log_record(uint64_t index, LogDBRecord& lr)
{
    ostringstream oss;

    uint64_t prev_index = index - 1;

    if ( index == 0 )
    {
        prev_index = 0;
    }

    oss << "SELECT c.log_index, c.term, c.sqlcmd,"
        << " c.timestamp, c.fed_index, p.log_index, p.term"
        << " FROM logdb c, logdb p WHERE c.log_index = " << index
        << " AND p.log_index = " << prev_index;

    lr.set_callback();

    int rc = db->exec_rd(oss, &lr);

    lr.unset_callback();

    if ( lr.get_affected_rows() == 0 )
    {
        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LogDB::get_last_record_index(uint64_t& _i, unsigned int& _t)
{
    pthread_mutex_lock(&mutex);

    _i = last_index;
    _t = last_term;

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::get_raft_state(std::string name, std::string &raft_xml)
{
    ostringstream oss;

    single_cb<std::string> cb;

    oss << "SELECT body FROM system_attributes WHERE name = '" << name << "'";

    cb.set_callback(&raft_xml);

    int rc = db->exec_rd(oss, &cb);

    cb.unset_callback();

    if ( raft_xml.empty() )
    {
        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::update_raft_state(std::string name, std::string& raft_xml)
{
    std::ostringstream oss;

    char * sql_db = db->escape_str(raft_xml.c_str());

    if ( sql_db == 0 )
    {
        return -1;
    }

    oss << "UPDATE system_attributes SET body ='" << sql_db << "' WHERE name = '" << name << "'";

    db->free_str(sql_db);

    return db->exec_wr(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::insert(uint64_t index, int term, const std::string& sql, time_t tstamp,
        uint64_t fed_index, bool replace)
{
    std::ostringstream oss;

    std::string * zsql;

    zsql = one_util::zlib_compress(sql, true);

    if ( zsql == 0 )
    {
        return -1;
    }

    char * sql_db = db->escape_str(zsql->c_str());

    delete zsql;

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

    bool applied = tstamp != 0;

    oss << " INTO " << table << " ("<< db_names <<") VALUES ("
        << index << "," << term << "," << "'" << sql_db << "'," << tstamp
        << "," << fed_index << "," << applied << ")";

    int rc = db->exec_wr(oss);

    if ( rc != 0 )
    {
        //Check for duplicate (leader retrying i.e. xmlrpc client timeout)
        LogDBRecord lr;

        if ( get_log_record(index, lr) == 0 )
        {
            NebulaLog::log("DBM", Log::ERROR, "Duplicated log record");
            rc = 0;
        }
        else
        {
            rc = -1;
        }
    }

    db->free_str(sql_db);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::apply_log_record(LogDBRecord * lr)
{
    ostringstream oss_sql(lr->sql);

    int rc = db->exec_ext(oss_sql);

    if (rc == SqlDB::SUCCESS || rc == SqlDB::SQL_DUP_KEY)
    {
        std::ostringstream oss;

        oss << "UPDATE logdb SET timestamp = " << time(0) << ", applied = 1" << " WHERE "
            << "log_index = " << lr->index << " AND timestamp = 0";

        if ( db->exec_wr(oss) != 0 )
        {
            NebulaLog::log("DBM", Log::ERROR, "Cannot update log record");
        }

        last_applied = lr->index;

        rc = 0;
    }
    else
    {
        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

uint64_t LogDB::insert_log_record(uint64_t term, std::ostringstream& sql,
        time_t timestamp, uint64_t fed_index)
{
    pthread_mutex_lock(&mutex);

    uint64_t index = next_index;

    uint64_t _fed_index;

    if ( fed_index == 0 )
    {
        _fed_index = index;
    }
    else
    {
        _fed_index = fed_index;
    }

    if ( insert(index, term, sql.str(), timestamp, _fed_index, false) != 0 )
    {
        NebulaLog::log("DBM", Log::ERROR, "Cannot insert log record in DB");

        pthread_mutex_unlock(&mutex);

        return -1;
    }

    //allocate a replication request if log record is going to be replicated
    if ( timestamp == 0 )
    {
        Nebula::instance().get_raftm()->replicate_allocate(next_index);
    }

    last_index = next_index;

    last_term  = term;

    next_index++;

    if ( fed_index != UINT64_MAX )
    {
        fed_log.insert(_fed_index);
    }

    pthread_mutex_unlock(&mutex);

    return index;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::insert_log_record(uint64_t index, unsigned int term,
        std::ostringstream& sql, time_t timestamp, uint64_t fed_index,
        bool replace)
{
    int rc;

    pthread_mutex_lock(&mutex);

    rc = insert(index, term, sql.str(), timestamp, fed_index, replace);

    if ( rc == 0 )
    {
        if ( index > last_index )
        {
            last_index = index;

            last_term  = term;

            next_index = last_index + 1;
        }

        if ( fed_index != UINT64_MAX )
        {
            fed_log.insert(fed_index);
        }
    }

    pthread_mutex_unlock(&mutex);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::_exec_wr(ostringstream& cmd, uint64_t federated)
{
    int rc;

    RaftManager * raftm = Nebula::instance().get_raftm();

    // -------------------------------------------------------------------------
    // OpenNebula was started in solo mode
    // -------------------------------------------------------------------------
    if ( solo )
    {
        rc = db->exec_wr(cmd);

        if ( rc == 0 && Nebula::instance().is_federation_enabled() )
        {
            insert_log_record(0, cmd, time(0), federated);

            pthread_mutex_lock(&mutex);

            last_applied = last_index;

            pthread_mutex_unlock(&mutex);
        }

        return rc;
    }
    else if ( cache )
    {
        NebulaLog::log("DBM", Log::ERROR,"Tried to modify DB in caching mode");
        return -1;
    }
    else if ( raftm == 0 || !raftm->is_leader() )
    {
        NebulaLog::log("DBM", Log::ERROR,"Tried to modify DB being a follower");
        return -1;
    }

    // -------------------------------------------------------------------------
    // Insert log entry in the database and replicate on followers
    // -------------------------------------------------------------------------
    uint64_t rindex = insert_log_record(raftm->get_term(), cmd, 0, federated);

    if ( rindex == UINT64_MAX )
    {
        return -1;
    }

    return replicate(rindex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::delete_log_records(uint64_t start_index)
{
    std::ostringstream oss;
    int rc;

    pthread_mutex_lock(&mutex);

    oss << "DELETE FROM " << table << " WHERE log_index >= " << start_index;

    rc = db->exec_wr(oss);

    if ( rc == 0 )
    {
        LogDBRecord lr;

        next_index = start_index;

        last_index = start_index - 1;

        if ( get_log_record(last_index, lr) == 0 )
        {
            last_term = lr.term;
        }
    }

    pthread_mutex_unlock(&mutex);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::apply_log_records(uint64_t commit_index)
{
    pthread_mutex_lock(&mutex);

    while (last_applied < commit_index )
    {
        LogDBRecord lr;

        if ( get_log_record(last_applied + 1, lr) != 0 )
        {
            pthread_mutex_unlock(&mutex);
            return -1;
        }

        if ( apply_log_record(&lr) != 0 )
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
    std::ostringstream oss, foss;

    empty_cb cb;

    multiple_cb<std::vector, uint64_t> cb_info;
    single_cb<string> cb_min_idx;
    std::vector<uint64_t> maxmin_i;
    std::vector<uint64_t> maxmin_e;
    string min_idx;

    int rc  = 0;
    int frc = 0;

    pthread_mutex_lock(&mutex);

    /* ---------------- Record log state -------------------- */

    oss << "SELECT MIN(log_index), MAX(log_index) FROM logdb WHERE log_index >= 0";

    cb_info.set_callback(&maxmin_i);

    db->exec_rd(oss, &cb_info);

    cb_info.unset_callback();

    /* ---------------------------------------------------------------------- */
    /* Non-federated records. Keep last log_retention records                 */
    /* ---------------------------------------------------------------------- */

    oss.str("");
    oss << "  SELECT MIN(i.log_index) FROM ("
        << "    SELECT log_index FROM logdb WHERE fed_index = " << UINT64_MAX
        << "      AND applied = 1 AND log_index >= 0 "
        << "      ORDER BY log_index DESC LIMIT " << log_retention
        << "  ) AS i";

    cb_min_idx.set_callback(&min_idx);

    db->exec_rd(oss, &cb_min_idx);

    cb_min_idx.unset_callback();

    cb.set_affected_rows(0);

    oss.str("");
    oss << "DELETE FROM logdb WHERE applied = 1 AND log_index >= 0 "
        << "AND fed_index = " << UINT64_MAX << " AND log_index < " << min_idx;

    if ( db->limit_support() )
    {
        oss << " LIMIT " << limit_purge;
    }

    if ( db->exec_wr(oss, &cb) != -1 )
    {
        rc = cb.get_affected_rows();
    }

    /* ---------------- Record log state -------------------- */

    oss.str("");
    oss << "SELECT MIN(log_index), MAX(log_index) FROM logdb WHERE log_index >= 0";

    cb_info.set_callback(&maxmin_e);

    db->exec_rd(oss, &cb_info);

    cb_info.unset_callback();

    oss.str("");
    oss << "Purging obsolete LogDB records: " << rc << " records purged. Log state: "
        << maxmin_i[0] << "," << maxmin_i[1] << " - " << maxmin_e[0] << "," << maxmin_e[1];

    NebulaLog::log("DBM", Log::INFO, oss);

    /* ---------------------------------------------------------------------- */
    /* Federated records. Keep last log_retention federated records           */
    /* ---------------------------------------------------------------------- */

    foss << "Purging obsolete federated LogDB records: ";

    if ( fed_log.size() < log_retention )
    {
        foss << "0 records purged. Federated log size: " << fed_log.size();

        NebulaLog::log("DBM", Log::INFO, foss);

        pthread_mutex_unlock(&mutex);

        return rc;
    }

    oss.str("");
    oss << "  SELECT MIN(i.log_index) FROM ("
        << "    SELECT log_index FROM logdb WHERE fed_index != " << UINT64_MAX
        << "      AND applied = 1 AND log_index >= 0 "
        << "      ORDER BY log_index DESC LIMIT " << log_retention
        << "  ) AS i";

    cb_min_idx.set_callback(&min_idx);

    db->exec_rd(oss, &cb_min_idx);

    cb_min_idx.unset_callback();

    cb.set_affected_rows(0);

    oss.str("");
    oss << "DELETE FROM logdb WHERE applied = 1 AND log_index >= 0 "
        << "AND fed_index != " << UINT64_MAX << " AND log_index < " << min_idx;

    if ( db->limit_support() )
    {
        oss << " LIMIT " << limit_purge;
    }

    if ( db->exec_wr(oss, &cb) != -1 )
    {
        frc = cb.get_affected_rows();

        rc += frc;
    }

    build_federated_index();

    foss << frc << " records purged. Federated log size: " << fed_log.size();

    NebulaLog::log("DBM", Log::INFO, foss);

    pthread_mutex_unlock(&mutex);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LogDB::replicate(uint64_t rindex)
{
    int rc;

    RaftManager * raftm = Nebula::instance().get_raftm();

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

void LogDB::build_federated_index()
{
    std::ostringstream oss;

    fed_log.clear();

    set_cb<uint64_t> cb;

    cb.set_callback(&fed_log);

    oss << "SELECT fed_index FROM " << table << " WHERE fed_index != " << UINT64_MAX;

    db->exec_rd(oss, &cb);

    cb.unset_callback();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

uint64_t LogDB::last_federated()
{
    pthread_mutex_lock(&mutex);

    uint64_t findex = -1;

    if ( !fed_log.empty() )
    {
        set<uint64_t>::reverse_iterator rit;

        rit = fed_log.rbegin();

        findex = *rit;
    }

    pthread_mutex_unlock(&mutex);

    return findex;
}

/* -------------------------------------------------------------------------- */

uint64_t LogDB::previous_federated(uint64_t i)
{
    set<uint64_t>::iterator it;

    pthread_mutex_lock(&mutex);

    uint64_t findex = UINT64_MAX;

    it = fed_log.find(i);

    if ( it != fed_log.end() && it != fed_log.begin() )
    {
        findex = *(--it);
    }

    pthread_mutex_unlock(&mutex);

    return findex;
}

/* -------------------------------------------------------------------------- */

uint64_t LogDB::next_federated(uint64_t i)
{
    set<uint64_t>::iterator it;

    pthread_mutex_lock(&mutex);

    uint64_t findex = UINT64_MAX;

    it = fed_log.find(i);

    if ( it != fed_log.end() && it != --fed_log.end() )
    {
        findex = *(++it);
    }

    pthread_mutex_unlock(&mutex);

    return findex;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FedLogDB::exec_wr(ostringstream& cmd)
{
    FedReplicaManager * frm = Nebula::instance().get_frm();

    int rc = _logdb->exec_federated_wr(cmd);

    if ( rc != 0 )
    {
        return rc;
    }

    frm->replicate(cmd.str());

    return rc;
}

