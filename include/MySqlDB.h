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

#ifndef MYSQL_DB_H_
#define MYSQL_DB_H_

#include <string>
#include <sstream>
#include <stdexcept>
#include <queue>

#include <sys/time.h>
#include <sys/types.h>
#include <unistd.h>

#include "NebulaLog.h"
#include "SqlDB.h"
#include "ObjectSQL.h"


using namespace std;

#ifdef MYSQL_DB

#include <mysql.h>

/**
 * SqliteDB class. Provides a wrapper to the mysql database interface.
 */
class MySqlDB : public SqlDB
{
public:

    MySqlDB(const string& _server,
            int           _port,
            const string& _user,
            const string& _password,
            const string& _database,
            const string& _encoding,
            int           _connections);

    ~MySqlDB();

    /**
     *  This function returns a legal SQL string that can be used in an SQL
     *  statement. The string is encoded to an escaped SQL string, taking into
     *  account the current character set of the connection.
     *    @param str the string to be escaped
     *    @return a valid SQL string or NULL in case of failure
     */
    char * escape_str(const string& str);

    /**
     *  Frees a previously scaped string
     *    @param str pointer to the str
     */
    void free_str(char * str)
    {
        delete[] str;
    }

    /**
     * Returns true if the syntax INSERT VALUES (data), (data), (data)
     * is supported
     *
     * @return true if supported
     */
    bool multiple_values_support()
    {
        return true;
    }

    /**
     * Returns true if this Database can use LIMIT in queries with DELETE
     *  and UPDATE
     *
     * @return true if supported
     */
    bool limit_support()
    {
        return true;
    }

    /**
     *  Return true if the backend allows FTS index
     */
     bool fts_available()
     {
         return _fts_available;
     }

protected:
    /**
     *  Wraps the mysql_query function call
     *    @param cmd the SQL command
     *    @param obj Callbackable obj to call if the query succeeds
     *    @return 0 on success
     */
    int exec_ext(std::ostringstream& cmd, Callbackable *obj, bool quiet);

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
    queue<MYSQL *> db_connect;

    /**
     * Cached DB connection to escape strings (it uses the server character set)
     */
    MYSQL * db_escape_connect;

    /**
     *  MySQL Connection parameters
     */
    string server;

    int    port;

    string user;

    string password;

    string database;

    string encoding;

    bool _fts_available;

    /**
     *  Fine-grain mutex for DB access (pool of DB connections)
     */
    pthread_mutex_t mutex;

    /**
     *  Conditional variable to wake-up waiting threads.
     */
    pthread_cond_t  cond;

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

    MySqlDB(const string& _server,
            int           _port,
            const string& _user,
            const string& _password,
            const string& _database,
            const string& _encoding,
            int           _connections)
    {
        throw runtime_error("Aborting oned, MySQL support not compiled!");
    };

    ~MySqlDB(){};


    char * escape_str(const string& str){return 0;};

    void free_str(char * str){};

    bool multiple_values_support(){return true;};

    bool limit_support(){return true;};

    bool fts_available(){return false;};

protected:
    int exec_ext(std::ostringstream& cmd, Callbackable *obj, bool quiet){return -1;};
};
#endif

#endif /*MYSQL_DB_H_*/
