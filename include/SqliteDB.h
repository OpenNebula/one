/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#include "SqlDB.h"
#include "ObjectSQL.h"

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

    SqliteDB(const std::string& db_name, int timeout);

    ~SqliteDB();

    /**
     *  This function returns a legal SQL string that can be used in an SQL
     *  statement.
     *    @param str the string to be escaped
     *    @return a valid SQL string or NULL in case of failure
     */
    char * escape_str(const std::string& str) const override;

    /**
     *  Frees a previously scaped string
     *    @param str pointer to the str
     */
    void free_str(char * str) const override;

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
    std::mutex _mutex;

    /**
     *  Pointer to the database.
     */
    sqlite3 * db;

};
#else
//CLass stub
class SqliteDB : public SqlDB
{
public:

    SqliteDB(const std::string& db_name, int timeout)
    {
        throw std::runtime_error("Aborting oned, Sqlite support not compiled!");
    }

    ~SqliteDB() = default;

    char * escape_str(const std::string& str) const override { return 0; }

    void free_str(char * str) const override {};

protected:
    int exec_ext(std::ostringstream& cmd, Callbackable *obj, bool quiet) override
    {
        return -1;
    }
};
#endif

#endif /*SQLITE_DB_H_*/
