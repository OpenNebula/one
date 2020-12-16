/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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
#include <queue>
#include <mutex>
#include <condition_variable>

#include "SqlDB.h"

#ifdef POSTGRESQL_DB

#include <libpq-fe.h>

/**
 *  PostgreSqlDB class. Provides a wrapper to the PostgreSQL database interface.
 */
class PostgreSqlDB : public SqlDB
{
public:
    PostgreSqlDB(
        const std::string& _server,
        int                _port,
        const std::string& _user,
        const std::string& _password,
        const std::string& _database,
        int                _connections);

    ~PostgreSqlDB();

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

    std::string limit_string(int sid, int eid) const override
    {
        std::ostringstream oss;
        oss << "LIMIT " << eid << " OFFSET " << sid;

        return oss.str();
    }

    std::string limit_string(int sid) const override
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
    std::queue<PGconn *> db_connect;

    /**
     *  DB connection to escape strings
     */
    PGconn * db_escape_connect;

    /**
     *  Connection parameters
     */
    std::string  server;
    int          port;
    std::string  user;
    std::string  password;
    std::string  database;

    /**
     *  Fine-grain mutex for DB access (pool of DB connections)
     */
    std::mutex _mutex;

    /**
     *  Conditional variable to wake-up waiting threads.
     */
    std::condition_variable cond;

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
        const std::string& _server,
        int                _port,
        const std::string& _user,
        const std::string& _password,
        const std::string& _database,
        int                _connections)
    {
        throw std::runtime_error("Aborting oned, PostgreSQL support not compiled!");
    }

    ~PostgreSqlDB(){}

    char * escape_str(const std::string& str) const override {return 0;};

    void free_str(char * str) const override {};

protected:
    int exec_ext(std::ostringstream& c, Callbackable *o, bool q) override {
        return -1;
    };
};
#endif

#endif /*POSTGRESQL_DB_H*/
