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

#ifndef MYSQL_DB_H_
#define MYSQL_DB_H_

#include <string>
#include <sstream>
#include <stdexcept>
#include <queue>
#include <condition_variable>

#include <sys/time.h>
#include <sys/types.h>
#include <unistd.h>

#include "SqlDB.h"
#include "ObjectSQL.h"

#ifdef MYSQL_DB

#include <mysql.h>

/**
 * SqliteDB class. Provides a wrapper to the mysql database interface.
 */
class MySqlDB : public SqlDB
{
public:

    MySqlDB(const std::string& _server,
            int                _port,
            const std::string& _user,
            const std::string& _password,
            const std::string& _database,
            const std::string& _encoding,
            int                _connections,
            const std::string& _compare_binary);

    ~MySqlDB();

    /**
     *  This function returns a legal SQL string that can be used in an SQL
     *  statement. The string is encoded to an escaped SQL string, taking into
     *  account the current character set of the connection.
     *    @param str the string to be escaped
     *    @return a valid SQL string or NULL in case of failure
     */
    char * escape_str(const std::string& str) const override;

    /**
     *  Frees a previously scaped string
     *    @param str pointer to the str
     */
    void free_str(char * str) const override
    {
        delete[] str;
    }

protected:
    /**
     *  Wraps the mysql_query function call
     *    @param cmd the SQL command
     *    @param obj Callbackable obj to call if the query succeeds
     *    @return 0 on success
     */
    int exec_ext(std::ostringstream& c, Callbackable *o, bool q) override;

private:

    /**
     *  This functions set the encoding to that being used for the OpenNebula
     *  database and creates the database if needed
     */
    int db_encoding(std::string& error);

    /**
     *  Number of concurrent DB connections.
     */
    int  max_connections;

    /**
     * The MySql connection pool handler
     */
    std::queue<MYSQL *> db_connect;

    /**
     * Cached DB connection to escape strings (it uses the server character set)
     */
    MYSQL * db_escape_connect;

    /**
     *  MySQL Connection parameters
     */
    std::string server;

    int    port;

    std::string user;

    std::string password;

    std::string database;

    std::string encoding;

    /**
     *  Fine-grain mutex for DB access (pool of DB connections)
     */
    std::mutex _mutex;

    /**
     *  Conditional variable to wake-up waiting threads.
     */
    std::condition_variable  cond;

    /**
     *  Gets a free DB connection from the pool.
     */
    MYSQL * get_db_connection();

    /**
     *  Returns the connection to the pool.
     */
    void free_db_connection(MYSQL * db);
};
#else
//CLass stub
class MySqlDB : public SqlDB
{
public:

    MySqlDB(const std::string& _server,
            int                _port,
            const std::string& _user,
            const std::string& _password,
            const std::string& _database,
            const std::string& _encoding,
            int                _connections,
            std::string&       _compare_binary)
    {
        throw std::runtime_error("Aborting oned, MySQL support not compiled!");
    };

    ~MySqlDB() {};

    char * escape_str(const std::string& str) const override {return nullptr;};

    void free_str(char * str) const override {};

protected:
    int exec_ext(std::ostringstream& c, Callbackable *o, bool q) override
    {
        return -1;
    };
};
#endif

#endif /*MYSQL_DB_H_*/
