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

#ifndef LOG_DB_H_
#define LOG_DB_H_

#include <string>
#include <sstream>

#include "SqlDB.h"

/**
 *  This class represents a log record
 */
struct LogDBRecord
{
   /**
    *  Index for this log entry (and previous)
    */
    unsigned int index;

    unsigned int prev_index;

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
};

/**
 *  This class implements a generic DB interface with replication. The associated
 *  DB stores a log to replicate on followers.
 */
class LogDB : public SqlDB, Callbackable
{
public:
    LogDB(SqlDB * _db, bool solo, const std::string& log_retention);

    virtual ~LogDB();

    // -------------------------------------------------------------------------
    // Interface to access Log records
    // -------------------------------------------------------------------------
    /**
     *  Loads a log record from the database. Memory is allocated by this class
     *  and needs to be freed.
     *    @param index of the associated logDB entry
     *    @return the LogDB record
     */
    LogDBRecord * get_log_record(unsigned int index);

    /**
     *  Applies the SQL command of the given record to the database. The
     *  timestamp of the record is updated.
     *    @param lr the log record
     *    @param index of the log record
     */
    int apply_log_record(LogDBRecord * lr);

	int apply_log_records(unsigned int commit_index);

    /**
     *  Deletes the record in start_index and all that follow it
     *    @param start_index first log record to delete
     */
    int delete_log_records(unsigned int start_index);

    /**
     *  Inserts a new log record in the database. This method should be used
     *  in FOLLOWER mode to replicate leader log. It updates next_index and
     *  last_term to evaluate vote requests.
     *    @param index for the record
     *    @param term for the record
     *    @param sql command of the record
     *    @param timestamp associated to this record
     *
     *    @return -1 on failure, index of the inserted record on success
     */
    int insert_log_record(unsigned int index, unsigned int term,
            std::ostringstream& sql, time_t timestamp)
    {
        int rc;

        pthread_mutex_lock(&mutex);

	    rc = insert_replace(index, term, sql.str(), timestamp, false);

        if ( rc == 0 && term >= 0 && index >= 0 )
        {
            next_index = index + 1;

            last_term  = term;
        }

        pthread_mutex_unlock(&mutex);

        return rc;
    }

    //--------------------------------------------------------------------------
    // Functions to manage the Raft state. Log record 0, term -1
    // -------------------------------------------------------------------------

    /**
     *  Stores the raft state in the log
     *    @param raft attributes in XML format
     *    @param replace true to replace the current configuration or false to
     *    insert a new one
     *    @return 0 on success
     */
    int insert_raft_state(std::string& raft_xml, bool replace)
    {
        return insert_replace(-1, -1, raft_xml, 0, replace);
    }

    /**
     *  Returns the raft state attributes as stored in the log
     *    @param raft_xml attributes in xml
     *    @return 0 on success
     */
    int get_raft_state(std::string &raft_xml);

    /**
     *  Purge log records. Delete old records applied to database upto the
     *  LOG_RETENTION configuration variable.
     *    @return 0 on success
     */
    int purge_log();

    // -------------------------------------------------------------------------
    // SQL interface
    // -------------------------------------------------------------------------
    /**
     *  This function replicates the DB changes on followers before updating
     *  the DB state
     */
    int exec_wr(ostringstream& cmd);

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

    // -------------------------------------------------------------------------
    // Database methods
    // -------------------------------------------------------------------------
    static int bootstrap(SqlDB *_db)
    {
        std::ostringstream oss(db_bootstrap);

        return _db->exec_local_wr(oss);
    }

    /**
     *  This function gets and initialize log related index
     *    @param last_applied, highest index applied to the DB
     *    @param last_index
     *
     *    @return 0 on success
     */
    int setup_index(int& last_applied, int& last_index);

    /**
     *  Gets the index of the last record in the log
     *    @param _i the index
     *    @param _t the term
     */
    void get_last_record_index(unsigned int& _i, unsigned int& _t)
    {
        pthread_mutex_lock(&mutex);

        _i = next_index - 1;
        _t = last_term;

        pthread_mutex_unlock(&mutex);
    }

protected:
    int exec(std::ostringstream& cmd, Callbackable* obj, bool quiet)
    {
        return -1;
    }

private:
    pthread_mutex_t mutex;

    /**
     *  The Database was started in solo mode (no server_id defined)
     */
    bool solo;

    /**
     *  Pointer to the underlying DB store
     */
    SqlDB * db;

    /**
     *  Index to be used by the next logDB record
     */
    unsigned int next_index;

    /**
     *  Index of the last log entry applied to the DB state
     */
    unsigned int last_applied;

    /**
     *  Term of the last entry added to the log
     */
    unsigned int last_term;

    /**
     *  Max number of records to keep in the database
     */
    std::string log_retention;

    // -------------------------------------------------------------------------
    // DataBase implementation
    // -------------------------------------------------------------------------
    static const char * table;

    static const char * db_names;

    static const char * db_bootstrap;

    /**
     *  Callback to initialize the next_index and last_appled varibales.
     */
    int setup_index_cb(void *nil, int num, char **values, char **names);

    /**
     *  SQL callback for log record SELECT commands
     */
    int select_cb(void *req, int num, char **values, char **names);

    /**
     *  SQL callback for loading the raft state
     */
    int raft_state_cb(void *str_value, int num, char **values, char **names);

    /**
     *  Inserts or update a log record in the database
     *    @param index of the log entry
     *    @param term for the log entry
     *    @param sql command to modify DB state
     *    @param timestamp of record application to DB state
     *    @param replace true to replace an existing entry
     *
     *    @return 0 on success
     */
    int insert_replace(int index, int term, const std::string& sql,
            time_t timestamp, bool replace);

    /**
     *  Inserts a new log record in the database. If the record is successfully
     *  inserted the index is incremented
     *    @param term for the record
     *    @param sql command of the record
     *    @param timestamp associated to this record
     *
     *    @return -1 on failure, index of the inserted record on success
     */
    int insert_log_record(unsigned int term, std::ostringstream& sql,
            time_t timestamp);
};

#endif /*LOG_DB_H_*/

