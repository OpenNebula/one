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
    LogDB(SqlDB * _db):db(_db), next_index(0), term(0){};

    virtual ~LogDB(){};

    void set_term(unsigned int t)
    {
        term = t;
    }

    void set_index(unsigned int i)
    {
        next_index = i;
    }

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

    virtual int exec_bootstrap(ostringstream& cmd)
    {
        return db->exec_bootstrap(cmd);
    }

    virtual int exec_rd(ostringstream& cmd, Callbackable* obj)
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

protected:
    int exec(ostringstream& cmd, Callbackable* obj, bool quiet)
    {
        return -1;
    }

private:
    /**
     *  Pointer to the underlying DB store
     */
    SqlDB * db;

    /**
     *  Index to be used by the next logDB record
     */
    unsigned int next_index;

    /**
     *  Current term to be included in new LogDB records generated during the
     *  term.
     */
    unsigned int term;

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
     *    @param request associated to the logDB entry to be inserted/updated
     *    @param replace true to replace an existing entry
     *
     *    @return 0 on success
     */
    int insert_replace(LogDBRequest * request, bool replace);
};

#endif /*LOG_DB_H_*/

