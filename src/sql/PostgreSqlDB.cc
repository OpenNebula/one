/* -------------------------------------------------------------------------- */
/* Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                */
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

#include "PostgreSqlDB.h"
#include "NebulaUtil.h"
#include "NebulaLog.h"

#include <libpq-fe.h>

#include <iostream>

/*********
 * Doc: https://www.postgresql.org/docs/current/libpq.html
 ********/

#define PG_DEFAULT_PORT 5432

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PostgreSqlDB::PostgreSqlDB(
    const string& _server,
    int           _port,
    const string& _user,
    const string& _password,
    const string& _database,
    int           _connections)
{
    PGconn* conn;

    server = _server;
    port   = _port;
    user   = _user;

    password = _password;
    database = _database;

    if ( port == 0 )
    {
        port = PG_DEFAULT_PORT;
    }

    max_connections = _connections;

    // Set up connection parameters
    string params = "host=" + _server
                  + " port=" + to_string(port)
                  + " user=" + user
                  + " password=" + password
                  + " dbname=" + database;

    // Create connection pool
    for (int i = 0; i < max_connections; i++)
    {
        conn = PQconnectdb(params.c_str());

        if ( PQstatus(conn) == CONNECTION_BAD )
        {
            ostringstream oss;
            oss << "Could not open connect to database server: "
                << PQerrorMessage(conn);

            throw runtime_error(oss.str());
        }

        db_connect.push(conn);
    }

    db_escape_connect = PQconnectdb(params.c_str());

    if ( PQserverVersion(db_escape_connect) < 90500 )
    {
        std::string error = "PostgreSQL version error: must be 9.5 or higher.";

        NebulaLog::log("ONE", Log::ERROR, error);

        throw runtime_error(error);
    }

    features = {
        {SqlFeature::MULTIPLE_VALUE, PQlibVersion() > 80200},
        {SqlFeature::LIMIT, false},
        {SqlFeature::FTS, false},
        {SqlFeature::COMPARE_BINARY, false}
    };
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PostgreSqlDB::~PostgreSqlDB()
{
    while (!db_connect.empty())
    {
        PGconn* conn = db_connect.front();
        db_connect.pop();

        PQfinish(conn);
    }

    PQfinish(db_escape_connect);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

char * PostgreSqlDB::escape_str(const string& str) const
{
    char* buf = new char[str.size() * 2 + 1];
    int err;

    PQescapeStringConn(db_escape_connect, buf, str.c_str(), str.length(), &err);

    if ( err != 0 )
    {
        delete[] buf;

        return nullptr;
    }

    return buf;
}

/* -------------------------------------------------------------------------- */

void PostgreSqlDB::free_str(char * str) const
{
    delete[] str;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PostgreSqlDB::exec_ext(std::ostringstream& cmd, Callbackable *obj, bool quiet)
{
    string str = preprocess_query(cmd);

    const char* c_str = str.c_str();

    Log::MessageType error_type = quiet ? Log::DDEBUG : Log::ERROR;


    PGconn* conn  = get_db_connection();

    PGresult* res = PQexec(conn, c_str);

    if ( PQstatus(conn) == CONNECTION_BAD )
    {
        PQreset(conn);

        if ( PQstatus(conn) == CONNECTION_BAD )
        {
            NebulaLog::error("ONE", "Lost connection to DB, unable to reconnect");

            PQclear(res);
            free_db_connection(conn);

            return SqlDB::CONNECTION;
        }
        else
        {
            NebulaLog::info("ONE", "Succesfully reconnected to DB");

            // Re-execute the query
            PQclear(res);
            res = PQexec(conn, c_str);
        }
    }

    if ( PQresultStatus(res) != PGRES_COMMAND_OK &&
         PQresultStatus(res) != PGRES_TUPLES_OK )
    {
        const char* err_msg = PQerrorMessage(conn);

        ostringstream oss;
        oss << "SQL command was: " << c_str;
        oss << ", error " << err_msg;

        NebulaLog::log("ONE", error_type, oss);

        PQclear(res);
        free_db_connection(conn);

        return SqlDB::SQL;
    }

    if ( obj == 0 )
    {
        // Free the result and db connection
        PQclear(res);
        free_db_connection(conn);

        return SqlDB::SUCCESS;
    }

    int ec = SqlDB::SUCCESS;

    // Get number of fields and rows of the result
    int n_fields = PQnfields(res);
    int n_rows   = PQntuples(res);

    if ( obj->isCallBackSet() && PQresultStatus(res) == PGRES_TUPLES_OK )
    {
        char** names  = new char*[n_fields];
        char** values = new char*[n_fields];

        // Get column names
        for (int i = 0; i < n_fields; i++)
        {
            names[i] = PQfname(res, i);
        }

        // For each row
        for (int row = 0; row < n_rows; row++)
        {
            // get values in that row
            for (int field = 0; field < n_fields; field++)
            {
                values[field] = PQgetvalue(res, row, field);
            }

            // and do a callback on them
            if ( obj->do_callback(n_fields, values, names) != 0 )
            {
                ec = SqlDB::SQL;
                break;
            }
        }

        delete[] names;
        delete[] values;
    }

    if ( obj->get_affected_rows() == 0 && n_rows )
    {
        obj->set_affected_rows(n_rows);
    }

    // Free the result and db connection
    PQclear(res);
    free_db_connection(conn);

    return ec;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PGconn * PostgreSqlDB::get_db_connection()
{
    PGconn* conn;

    unique_lock<mutex> lock(_mutex);

    cond.wait(lock, [&]{ return !db_connect.empty(); });

    conn = db_connect.front();
    db_connect.pop();

    return conn;
}

/* -------------------------------------------------------------------------- */

void PostgreSqlDB::free_db_connection(PGconn * db)
{
    lock_guard<mutex> lock(_mutex);

    db_connect.push(db);

    cond.notify_one();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void replace_substring(std::string& cmd, const std::string& s1,
        const std::string& s2)
{
    size_t pos = cmd.find(s1);

    while (pos != std::string::npos)
    {
        cmd.replace(pos, s1.length(), s2);

        pos = cmd.find(s1, pos + s2.length());
    }
}

std::string PostgreSqlDB::preprocess_query(std::ostringstream& cmd)
{
    std::string query = cmd.str();
    size_t pos;

    // Both CREATE TABLE and REPLACE should be at the start
    // so we don't change user data
    if ((pos = query.find("CREATE TABLE")) == 0)
    {
        replace_substring(query, "MEDIUMTEXT", "TEXT");
        replace_substring(query, "LONGTEXT", "TEXT");
        replace_substring(query, "BIGINT UNSIGNED", "NUMERIC(20)");
    }
    else if ((pos = query.find("REPLACE")) == 0)
    {
        query.replace(0, 7, "INSERT");

        size_t table_start = query.find("INTO ", 7) + 5;

        size_t names_start = query.find("(", table_start) + 1;
        size_t names_end   = query.find(")", names_start);

        std::string db_names = query.substr(names_start, names_end - names_start);
        std::string table    = query.substr(table_start, names_start - 2 - table_start);

        std::vector<std::string> splits;
        one_util::split(db_names, ',', splits);

        query += " ON CONFLICT ON CONSTRAINT " + table + "_pkey DO UPDATE SET ";

        const char* sep = "";

        for (auto &s: splits)
        {
            query += sep + s + " = EXCLUDED." + s;
            sep = ", ";
        }
    }

    return query;
}

