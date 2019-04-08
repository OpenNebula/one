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

#ifndef LOG_DB_H_
#define LOG_DB_H_

#include <string>
#include <sstream>
#include <set>

#include "SqlDB.h"

/**
 *  This class represents a log record
 */
class LogDBRecord : public Callbackable
{
public:
   /**
    *  Index for this log entry (and previous)
    */
    uint64_t index;

    uint64_t prev_index;

    /**
     *  Term where this log (and previous) entry was generated
     */
    unsigned int term;

    unsigned int prev_term;

    /**
     *  SQL command to exec in the DB to update (INSERT, REPLACE, DROP)
     */
    std::string sql;

    /**
     *  Time when the record has been applied to DB. 0 if not applied
     */
    time_t timestamp;

    /**
     *  The index in the federation, -1 if the log entry is not federated.
     *  At master fed_index is equal to index.
     */
    uint64_t fed_index;

    /**
     *  Sets callback to load register from DB
     */
    void set_callback()
    {
        Callbackable::set_callback(
                static_cast<Callbackable::Callback>(&LogDBRecord::select_cb));
    }

private:
    /**
     *  SQL callback to load logDBRecord from DB (SELECT commands)
     */
    int select_cb(void *nil, int num, char **values, char **names);
};

/**
 *  This class implements a generic DB interface with replication. The associated
 *  DB stores a log to replicate on followers.
 */
class LogDB : public SqlDB
{
public:
    LogDB(SqlDB * _db, bool solo, bool cache, uint64_t log_retention,
            uint64_t limit_purge);

    virtual ~LogDB();

    // -------------------------------------------------------------------------
    // Interface to access Log records
    // -------------------------------------------------------------------------
    /**
     *  Loads a log record from the database. Memory is allocated by this class
     *  and needs to be freed.
     *    @param index of the associated logDB entry
     *    @param lr logDBrecored to load from the DB
     *    @return 0 on success -1 otherwise
     */
    int get_log_record(uint64_t index, LogDBRecord& lr);

    /**
     *  Applies the SQL command of the given record to the database. The
     *  timestamp of the record is updated.
     *    @param index of the log record
     */
    int apply_log_records(uint64_t commit_index);

    /**
     *  Deletes the record in start_index and all that follow it
     *    @param start_index first log record to delete
     */
    int delete_log_records(uint64_t start_index);

    /**
     *  Inserts a new log record in the database. This method should be used
     *  in FOLLOWER mode to replicate leader log.
     *    @param index for the record
     *    @param term for the record
     *    @param sql command of the record
     *    @param timestamp associated to this record
     *    @param fed_index index in the federation -1 if not federated
     *    @param replace if true will replace the record if it exists
     *
     *    @return -1 on failure, index of the inserted record on success
     */
    int insert_log_record(uint64_t index, unsigned int term,
            std::ostringstream& sql, time_t timestamp, uint64_t fed_index,
            bool replace);

    /**
     *  Replicate a log record on followers. It will also replicate any missing
     *  previous records
     *    @param rindex of the record to replicate
     *
     *    @return 0 on success, -1 in case of failure
     */
    int replicate(uint64_t rindex);

    //--------------------------------------------------------------------------
    // Functions to manage the Raft state. Log record 0, term -1
    // -------------------------------------------------------------------------
    /**
     *  Stores the raft state in the log
     *    @param raft attributes in XML format
     *    @return 0 on success
     */
    int update_raft_state(std::string name, std::string& raft_xml);

    /**
     *  Returns the raft state attributes as stored in the log
     *    @param raft_xml attributes in xml
     *    @return 0 on success
     */
    int get_raft_state(std::string name, std::string &raft_xml);

    /**
     *  Purge log records. Delete old records applied to database upto the
     *  LOG_RETENTION configuration variable.
     *    @return number of records deleted from DB
     */
    int purge_log();

    // -------------------------------------------------------------------------
    // SQL interface
    // -------------------------------------------------------------------------
    /**
     *  This function replicates the DB changes on followers before updating
     *  the DB state
     */
    int exec_wr(ostringstream& cmd)
    {
        return _exec_wr(cmd, UINT64_MAX);
    }

    int exec_wr(ostringstream& cmd, Callbackable* obj)
    {
        return exec_wr(cmd);
    }

    int exec_federated_wr(ostringstream& cmd)
    {
        return _exec_wr(cmd, 0);
    }

    int exec_federated_wr(ostringstream& cmd, uint64_t index)
    {
        return _exec_wr(cmd, index);
    }

    int exec_local_wr(ostringstream& cmd)
    {
        return db->exec_local_wr(cmd);
    }

    int exec_rd(ostringstream& cmd, Callbackable* obj)
    {
        return db->exec_rd(cmd, obj);
    }

    char * escape_str(const string& str)
    {
        return db->escape_str(str);
    }

    void free_str(char * str)
    {
        db->free_str(str);
    }

    bool multiple_values_support()
    {
        return db->multiple_values_support();
    }

    bool limit_support()
    {
        return db->limit_support();
    }

    bool fts_available()
    {
        return db->fts_available();
    }
    // -------------------------------------------------------------------------
    // Database methods
    // -------------------------------------------------------------------------
    static int bootstrap(SqlDB *_db);

    /**
     *  This function gets and initialize log related index
     *    @param last_applied, highest index applied to the DB
     *    @param last_index
     *
     *    @return 0 on success
     */
    int setup_index(uint64_t& last_applied, uint64_t& last_index);

    /**
     *  Gets the index & term of the last record in the log
     *    @param _i the index
     *    @param _t the term
     */
    void get_last_record_index(uint64_t& _i, unsigned int& _t);

    // -------------------------------------------------------------------------
    // Federate log methods
    // -------------------------------------------------------------------------
    /**
     *  Get last federated index, and previous
     */
    uint64_t last_federated();

    uint64_t previous_federated(uint64_t index);

    uint64_t next_federated(uint64_t index);

protected:
    int exec_ext(std::ostringstream& cmd, Callbackable *obj, bool quiet)
    {
        return SqlDB::INTERNAL;
    };

private:
    pthread_mutex_t mutex;

    /**
     *  The Database was started in solo mode (no server_id defined)
     */
    bool solo;

    /**
     * True for cache servers
     */
    bool cache;

    /**
     *  Pointer to the underlying DB store
     */
    SqlDB * db;

    /**
     *  Index to be used by the next logDB record
     */
    uint64_t next_index;

    /**
     *  Index of the last log entry applied to the DB state
     */
    uint64_t last_applied;

    /**
     *  Index of the last (highest) log entry
     */
    uint64_t last_index;

    /**
     *  term of the last (highest) log entry
     */
    unsigned int last_term;

    /**
     *  Max number of records to keep in the database
     */
    uint64_t log_retention;

    /**
     *  Max number of logs purged on each call.
     */
    uint64_t limit_purge;

    // -------------------------------------------------------------------------
    // Federated Log
    // -------------------------------------------------------------------------
    /**
     *  The federated log stores a map with the federated log index and its
     *  corresponding local index. For the master both are the same
     */
    std::set<uint64_t> fed_log;

    /**
     *  Generates the federated index, it should be called whenever a server
     *  takes leadership.
     */
    void build_federated_index();

    // -------------------------------------------------------------------------
    // DataBase implementation
    // -------------------------------------------------------------------------
    static const char * table;

    static const char * db_names;

    static const char * db_bootstrap;

    /**
     *  Replicates writes in the followers and apply changes to DB state once
     *  it is safe to do so.
     *
     *  @param federated -1 not federated (fed_index = -1), 0 generate fed index
     *  (fed_index = index), > 0 set (fed_index = federated)
     */
    int _exec_wr(ostringstream& cmd, uint64_t federated);

    /**
     *  Applies the SQL command of the given record to the database. The
     *  timestamp of the record is updated.
     *    @param lr the log record
     */
    int apply_log_record(LogDBRecord * lr);

    /**
     *  Inserts or update a log record in the database
     *    @param index of the log entry
     *    @param term for the log entry
     *    @param sql command to modify DB state
     *    @param ts timestamp of record application to DB state
     *    @param fi the federated index -1 if none
     *    @param replace if true will replace the record if it exists
     *
     *    @return 0 on success
     */
    int insert(uint64_t index, int term, const std::string& sql, time_t ts,
               uint64_t fi, bool replace);

    /**
     *  Inserts a new log record in the database. If the record is successfully
     *  inserted the index is incremented
     *    @param term for the record
     *    @param sql command of the record
     *    @param timestamp associated to this record
     *    @param federated, if true it will set fed_index == index, -1 otherwise
     *
     *    @return -1 on failure, index of the inserted record on success
     */
    uint64_t insert_log_record(uint64_t term, std::ostringstream& sql,
            time_t timestamp, uint64_t fed_index);
};

// -----------------------------------------------------------------------------
// This is a LogDB decoration, it replicates the DB write commands on slaves
// It should be passed as DB for federated pools.
// -----------------------------------------------------------------------------
class FedLogDB: public SqlDB
{
public:
    FedLogDB(LogDB *db):_logdb(db){};

    virtual ~FedLogDB(){};

    int exec_wr(ostringstream& cmd);

    int exec_local_wr(ostringstream& cmd)
    {
        return _logdb->exec_local_wr(cmd);
    }

    int exec_rd(ostringstream& cmd, Callbackable* obj)
    {
        return _logdb->exec_rd(cmd, obj);
    }

    char * escape_str(const string& str)
    {
        return _logdb->escape_str(str);
    }

    void free_str(char * str)
    {
        _logdb->free_str(str);
    }

    bool multiple_values_support()
    {
        return _logdb->multiple_values_support();
    }

    bool limit_support()
    {
        return _logdb->limit_support();
    }

    bool fts_available()
    {
        return _logdb->fts_available();
    }

protected:
    int exec_ext(std::ostringstream& cmd, Callbackable *obj, bool quiet)
    {
        return SqlDB::INTERNAL;
    };

private:

    LogDB * _logdb;
};

#endif /*LOG_DB_H_*/

