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

#ifndef SQLITE_DB_H_
#define SQLITE_DB_H_

#include <string>
#include <sstream>
#include <stdexcept>

#include <sys/time.h>
#include <sys/types.h>
#include <unistd.h>

#include "NebulaLog.h"

#include "SqlDB.h"
#include "ObjectSQL.h"

using namespace std;

#ifdef SQLITE_DB

#include <sqlite3.h>

/**
 * SqliteDB class. Provides a wrapper to the sqlite3 database interface. It also
 * provides "global" synchronization mechanism to use it in a multithread
 * environment.
 */
class SqliteDB : public SqlDB
{
public:

    SqliteDB(const string& db_name);

    ~SqliteDB();

    /**
     *  This function returns a legal SQL string that can be used in an SQL
     *  statement.
     *    @param str the string to be escaped
     *    @return a valid SQL string or NULL in case of failure
     */
    char * escape_str(const string& str) override;

    /**
     *  Frees a previously scaped string
     *    @param str pointer to the str
     */
    void free_str(char * str) override;

protected:
    /**
     *  Wraps the sqlite3_exec function call, and locks the DB mutex.
     *    @param sql_cmd the SQL command
     *    @param callbak function to execute on each data returned, watch the
     *    mutex you block in the callback.
     *    @param arg to pass to the callback function
     *    @return 0 on success
     */
    int exec_ext(std::ostringstream& cmd, Callbackable *obj, bool quiet) override;

private:
    /**
     *  Fine-grain mutex for DB access
     */
    pthread_mutex_t mutex;

    /**
     *  Pointer to the database.
     */
    sqlite3 * db;

    /**
     *  Function to lock the DB
     */
    void lock()
    {
        pthread_mutex_lock(&mutex);
    };

    /**
     *  Function to unlock the DB
     */
    void unlock()
    {
        pthread_mutex_unlock(&mutex);
    };
};
#else
//CLass stub
class SqliteDB : public SqlDB
{
public:

    SqliteDB(const string& db_name)
    {
        throw runtime_error("Aborting oned, Sqlite support not compiled!");
    }

    ~SqliteDB() = default;

    char * escape_str(const string& str) override { return 0; }

    void free_str(char * str) override {};

    std::string get_limit_string(const std::string& str) override { return str; }

protected:
    int exec_ext(std::ostringstream& cmd, Callbackable *obj, bool quiet) override
    {
        return -1;
    }
};
#endif

#endif /*SQLITE_DB_H_*/
