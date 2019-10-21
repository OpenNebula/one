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

#include "NebulaUtil.h"
#include "PostgreSqlDB.h"

#include "PostgreSqlDB.h"
#include <libpq-fe.h>

#include <iostream>

/*********
 * Doc: https://www.postgresql.org/docs/current/libpq.html
 ********/

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
    port = _port;
    user = _user;
    password = _password;
    database = _database;

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

    pthread_mutex_init(&mutex, 0);
    pthread_cond_init(&cond, 0);
}

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

    pthread_mutex_destroy(&mutex);
    pthread_cond_destroy(&cond);
}

/* -------------------------------------------------------------------------- */

char * PostgreSqlDB::escape_str(const string& str)
{
    char* buf = new char[str.size() * 2 + 1];
    int error;

    PQescapeStringConn(db_escape_connect, buf, str.c_str(), str.length(), &error);

    if ( error != 0 )
    {
        delete[] buf;

        return nullptr;
    }

    return buf;
}

/* -------------------------------------------------------------------------- */

void PostgreSqlDB::free_str(char * str)
{
    delete[] str;
}

/* -------------------------------------------------------------------------- */

bool PostgreSqlDB::multiple_values_support()
{
    if ( PQlibVersion() < 80200 )
    {
        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */

bool PostgreSqlDB::limit_support()
{
    return false;
}

/* -------------------------------------------------------------------------- */

bool PostgreSqlDB::fts_available()
{
    return false;
}

/* -------------------------------------------------------------------------- */

std::string PostgreSqlDB::get_limit_string(const std::string& str)
{
    // LIMIT m,n syntax is not supported in PostgreSQL so it needs to be changed
    // to LIMIT m OFFSET n, even if n is missing, or n is 0.

    std::string result = str;
    size_t pos;
    if ( (pos = result.find(',')) != std::string::npos )
    {
        result.replace(pos, 1, " OFFSET ");
        return result;
    }

    return result + " OFFSET 0";
}

/* -------------------------------------------------------------------------- */

int PostgreSqlDB::exec_ext(std::ostringstream& cmd, Callbackable *obj, bool quiet)
{
    preprocess_query(cmd);

    string str = cmd.str();
    const char* c_str = str.c_str();

    Log::MessageType error_type = quiet ? Log::DDEBUG : Log::ERROR;

    int ec = SqlDB::SUCCESS;

    PGconn* conn = get_db_connection();
    PGresult* res = PQexec(conn, c_str);

    if ( PQresultStatus(res) != PGRES_COMMAND_OK && PQresultStatus(res) != PGRES_TUPLES_OK )
    {
        const char* err_msg = PQerrorMessage(conn);
        
        ostringstream oss;
        oss << "SQL command was: " << c_str;
        oss << ", error " << err_msg;

        NebulaLog::log("ONE", error_type, oss);

        PQclear(res);
        free_db_connection(conn);

        ec = SqlDB::SQL;
        return ec;
    }

    // Get number of fields and rows of the result
    int n_fields = PQnfields(res);
    int n_rows = PQntuples(res);
    
    char** names = new char*[n_fields];
    char** values = new char*[n_fields];
            
    if ( obj != 0 )
    {
        if ( obj->isCallBackSet() && PQresultStatus(res) == PGRES_TUPLES_OK )
        {
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
        }
    
        if ( obj->get_affected_rows() == 0 && n_rows )
        {
            obj->set_affected_rows(n_rows);
        }
    }

    delete[] names;
    delete[] values;

    // Free the result and db connection
    PQclear(res);
    free_db_connection(conn);

    return ec;
}

/* -------------------------------------------------------------------------- */

PGconn * PostgreSqlDB::get_db_connection()
{
    PGconn* conn;

    pthread_mutex_lock(&mutex);

    while (db_connect.empty() == true)
    {
        pthread_cond_wait(&cond, &mutex);
    }

    conn = db_connect.front();
    db_connect.pop();

    pthread_mutex_unlock(&mutex);

    return conn;
}

/* -------------------------------------------------------------------------- */

void PostgreSqlDB::free_db_connection(PGconn * db)
{
    pthread_mutex_lock(&mutex);

    db_connect.push(db);

    pthread_cond_signal(&cond);

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */

void PostgreSqlDB::preprocess_query(std::ostringstream& cmd)
{
    std::string query = cmd.str();
    size_t pos;

    // Both CREATE TABLE and REPLACE should be at the start
    // so we don't change user data
    if ((pos = query.find("CREATE TABLE")) == 0)
    {
        replace_types(query, pos);
        cmd.str(query);
        return;
    }

    if ((pos = query.find("REPLACE")) == 0)
    {
        replace_replace_into(query);
    }
    
    cmd.str(query);
}

/* -------------------------------------------------------------------------- */

void PostgreSqlDB::replace_types(std::string& cmd, size_t start_pos)
{
    replace_substring(cmd, "MEDIUMTEXT", "TEXT");
    replace_substring(cmd, "LONGTEXT", "TEXT");
    replace_substring(cmd, "BIGINT UNSIGNED", "NUMERIC(20)");
}

/* -------------------------------------------------------------------------- */

void PostgreSqlDB::replace_substring(std::string& cmd, const std::string& s1, const std::string& s2)
{
    size_t pos = cmd.find(s1);
    while (pos != std::string::npos)
    {
        cmd.replace(pos, s1.length(), s2);
        
        pos = cmd.find(s1, pos + s2.length());
    }
}

/* -------------------------------------------------------------------------- */

void PostgreSqlDB::replace_replace_into(std::string& cmd)
{
    size_t pos = 0;
    
    cmd.replace(pos, 7, "INSERT");

    size_t db_names_start = cmd.find("(", pos) + 1;
    size_t db_names_end = cmd.find(")", db_names_start);
    std::string db_names = cmd.substr(db_names_start, db_names_end - db_names_start);

    std::vector<std::string> splits;
    one_util::split(db_names, ',', splits);
    
    cmd += " ON CONFLICT (" + splits[0] + ") DO UPDATE SET ";
    const char* sep = "";
    for (size_t i = 1; i < splits.size(); i++)
    {
        cmd += sep + splits[i] + " = EXCLUDED." + splits[i];
        sep = ", ";
    }
}
