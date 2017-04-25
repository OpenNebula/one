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
#include <map>

#include "SqlDB.h"
#include "LogDBRequest.h"

class LogDB : public SqlDB, Callbackable
{
public:
    LogDB(SqlDB * _db);

    virtual ~LogDB();

    /**
     *  Return the request associated to the given logdb record. If there is
     *  no client waiting for its replication it is loaded from the DB.
     *    @param index of the associated logDB entry
     *    @return the LogDB replication request
     *
     */
    LogDBRequest * get_request(unsigned int index);

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
        ostringstream oss(db_bootstrap);

        return _db->exec_local_wr(oss);
    }

protected:
    int exec(ostringstream& cmd, Callbackable* obj, bool quiet)
    {
        return -1;
    }

private:
    pthread_mutex_t mutex;

    /**
     *  Pointer to the underlying DB store
     */
    SqlDB * db;

    /**
     *  Index to be used by the next logDB record
     */
    unsigned int next_index;

    /**
     *  List of pending requests (a client is waiting for the log entry to be
     *  replicated in a majority of followers)
     */
    std::map<unsigned int, LogDBRequest *> requests;

    // -------------------------------------------------------------------------
    // DataBase implementation
    // -------------------------------------------------------------------------
    static const char * table;

    static const char * db_names;

    static const char * db_bootstrap;

    /**
     *  Callback to initialize the next_index varibale.
     */
    int init_cb(void *nil, int num, char **values, char **names);

    /**
     *  This function loads a log record from the database and returns the an
     *  associated replication request
     *    @param index of the record
     *
     *    @return the request 0 if failure
     */
    int select_cb(void *req, int num, char **values, char **names);

    LogDBRequest * select(int index);

    /**
     *  Inserts or update a log record in the database
     *    @param index of the log entry
     *    @param term for the log entry
     *    @param sql command to modify DB state
     *    @param replace true to replace an existing entry
     *
     *    @return 0 on success
     */
    int insert_replace(int index, int term, const std::string& sql,
            bool replace);
};

#endif /*LOG_DB_H_*/

