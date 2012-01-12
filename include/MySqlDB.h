/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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
            const string& _database);

    ~MySqlDB();

    /**
     *  Wraps the mysql_query function call
     *    @param cmd the SQL command
     *    @param obj Callbackable obj to call if the query succeeds
     *    @return 0 on success
     */
    int exec(ostringstream& cmd, Callbackable* obj=0);

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
    void free_str(char * str);

private:

    /**
     * The MySql connection handler
     */
    MYSQL *             db;

    /**
     *  MySQL Connection parameters
     */
    string              server;

    int                 port;

    string              user;

    string              password;

    string              database;

    /**
     *  Fine-grain mutex for DB access
     */
    pthread_mutex_t     mutex;

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
class MySqlDB : public SqlDB
{
public:

    MySqlDB(
            string server,
            int    port,
            string user,
            string password,
            string database)
    {
        throw runtime_error("Aborting oned, MySQL support not compiled!");
    };

    ~MySqlDB(){};

    int exec(ostringstream& cmd, Callbackable* obj=0){return -1;};

    char * escape_str(const string& str){return 0;};

    void free_str(char * str){};
};
#endif

#endif /*MYSQL_DB_H_*/
