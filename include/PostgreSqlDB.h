/* -------------------------------------------------------------------------- */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

#ifndef POSTGRESQL_DB_H_
#define POSTGRESQL_DB_H_

#include <string>
#include <stdexcept>
#include <queue>

#include "NebulaLog.h"
#include "SqlDB.h"
#include "ObjectSQL.h"

#ifdef POSTGRESQL_DB

#include <libpq-fe.h>

/**
 *  PostgreSqlDB class. Provides a wrapper to the PostgreSQL database interface.
 */
class PostgreSqlDB : public SqlDB
{
public:
    PostgreSqlDB(
        const string& _server,
        int           _port,
        const string& _user,
        const string& _password,
        const string& _database,
        int           _connections);

    ~PostgreSqlDB();

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

    /**
     *  @param sid the offset
     *  @param eid the rowcount
     *  @return string with compatible LIMIT clause syntax
     *  LIMIT row_count OFFSET offset
     *  
     *  +---+---+---+---+---+---+---+---+--
     *  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |...
     *  +---+---+---+---+---+---+---+---+--
     *          |                   |
     *          /-------------------/
     *            LIMIT 5 OFFSET 3
     */

    std::string limit_string(int sid, int eid) override
    {
        std::ostringstream oss;
        oss << "LIMIT " << eid << " OFFSET " << sid;

        return oss.str();
    }

    std::string limit_string(int sid) override
    {
        std::ostringstream oss;
        oss << "LIMIT " << sid << " OFFSET 0";

        return oss.str();
    }

protected:
    int exec_ext(std::ostringstream& cmd, Callbackable *obj, bool quiet) override;

private:

    /**
     *  Number of concurrent DB connections.
     */
    int max_connections;

    /**
     *  Connection pool
     */
    queue<PGconn *> db_connect;

    /**
     *  DB connection to escape strings
     */
    PGconn * db_escape_connect;

    /**
     *  Connection parameters
     */
    string  server;
    int     port;
    string  user;
    string  password;
    string  database;

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
    PGconn * get_db_connection();

    /**
     *  Returns the connection to the pool.
     */
    void free_db_connection(PGconn * db);

    /**
     *  Preprocesses the query to be compatible with PostgreSQL syntax
     *
     *  Any change to this method should be reflected in BackEndPostgreSQL class
     *  in src/onedb/onedb_backend.rb
     *
     *  This method alters to queries:
     *    - CREATE TABLE to adjust type names
     *      . MEDIUMTEXT -> TEXT
     *      . LONGTEXT -> TEXT
     *      . BIGINT UNSIGNED -> NUMERIC
     *
     *    - REPLACE INTO into PostgreSQL INSERT INTO query with ON CONFLICT
     *    clause. For example:
     *       REPLACE INTO pool_control (tablename, last_oid) VALUES ('acl',0)
     *    changes to:
     *       INSERT INTO pool_control (tablename, last_oid) VALUES ('acl',0)
     *          ON CONFLICT (tablename) DO UPDATE SET last_oid = EXCLUDED.last_oid
     ***************************************************************************
     *  Any change to this method should be reflected in BackEndPostgreSQL class
     *  in src/onedb/onedb_backend.rb
     ***************************************************************************
     */
    static std::string preprocess_query(std::ostringstream& cmd);
};
#else
// Class stub
class PostgreSqlDB : public SqlDB
{
public:
    PostgreSqlDB(
        const string& _server,
        int           _port,
        const string& _user,
        const string& _password,
        const string& _database,
        int           _connections)
    {
        throw runtime_error("Aborting oned, PostgreSQL support not compiled!");
    }
    ~PostgreSqlDB(){}

    char * escape_str(const string& str) override {return 0;};

    void free_str(char * str) override {};

    std::string limit_string(int sid, int eid) override {return "";}

protected:
    int exec_ext(std::ostringstream& c, Callbackable *o, bool q) override {
        return -1;
    };
};
#endif

#endif /*POSTGRESQL_DB_H*/
