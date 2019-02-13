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

#include "MySqlDB.h"
#include <mysql/errmsg.h>
#include <mysqld_error.h>

/*********
 * Doc: https://dev.mysql.com/doc/refman/8.0/en/c-api.html
 ********/

/* -------------------------------------------------------------------------- */

MySqlDB::MySqlDB(
        const string& _server,
        int           _port,
        const string& _user,
        const string& _password,
        const string& _database,
        int           _max_connections)
{
    vector<MYSQL *> connections(_max_connections);
    MYSQL * rc;

    ostringstream oss;

    server   = _server;
    port     = _port;
    user     = _user;
    password = _password;
    database = _database;

    max_connections = _max_connections;

    // Initialize the MySQL library
    mysql_library_init(0, NULL, NULL);

    // Create connection pool to the server
    for (int i=0 ; i < max_connections ; i++)
    {
        connections[i] = mysql_init(NULL);

        rc = mysql_real_connect(connections[i],
                                server.c_str(),
                                user.c_str(),
                                password.c_str(),
                                0,
                                port,
                                NULL,
                                0);
        if ( rc == NULL)
        {
            ostringstream oss;

            oss << "Could not open connect to database server: "
                << mysql_error(connections[i]);

            throw runtime_error(oss.str());
        }
    }

    db_escape_connect = mysql_init(NULL);

    rc = mysql_real_connect(db_escape_connect,
                            server.c_str(),
                            user.c_str(),
                            password.c_str(),
                            0,
                            port,
                            NULL,
                            0);

    if ( rc == NULL)
    {
        ostringstream oss;

        oss << "Could not open connect to database server: "
            << mysql_error(db_escape_connect);

        throw runtime_error(oss.str());
    }

    //Connect to the database & initialize connection pool
    oss << "CREATE DATABASE IF NOT EXISTS " << database;

    if ( mysql_query(connections[0], oss.str().c_str()) != 0 )
    {
        throw runtime_error("Could not create the database.");
    }

    oss.str("");
    oss << "USE " << database;

    for (int i=0 ; i < max_connections ; i++)
    {
        if ( mysql_query(connections[i], oss.str().c_str()) != 0 )
        {
            ostringstream oss;

            oss << "Could not connect to database server: "
                << mysql_error(connections[i]);

            throw runtime_error(oss.str());
        }

        db_connect.push(connections[i]);
    }

    pthread_mutex_init(&mutex,0);

    pthread_cond_init(&cond,0);
}

/* -------------------------------------------------------------------------- */

MySqlDB::~MySqlDB()
{
    // Close the connections to the MySQL server
    while (!db_connect.empty())
    {
        MYSQL * db = db_connect.front();
        db_connect.pop();

        mysql_close(db);
    }

    mysql_close(db_escape_connect);

    // End use of the MySQL library
    mysql_library_end();

    pthread_mutex_destroy(&mutex);

    pthread_cond_destroy(&cond);
}

/* -------------------------------------------------------------------------- */

bool MySqlDB::multiple_values_support()
{
    return true;
}

/* -------------------------------------------------------------------------- */

bool MySqlDB::limit_support()
{
    return true;
}

/* -------------------------------------------------------------------------- */

int MySqlDB::exec_ext(std::ostringstream& cmd, Callbackable *obj, bool quiet)
{
    string str         = cmd.str();
    const char * c_str = str.c_str();

    int ec = SqlDB::SUCCESS;

    Log::MessageType error_level = quiet ? Log::DDEBUG : Log::ERROR;

    struct timespec timer;

    Log::start_timer(&timer);

    MYSQL * db = get_db_connection();

    int rc = mysql_query(db, c_str);

    if (rc != 0)
    {
        ostringstream oss;

        const char * err_msg = mysql_error(db);
        int          err_num = mysql_errno(db);

        switch(err_num)
        {
            case CR_SERVER_GONE_ERROR:
            case CR_SERVER_LOST:
                oss << "MySQL connection error " << err_num << " : " << err_msg;

                // Try to re-connect
                if (mysql_real_connect(db, server.c_str(), user.c_str(),
                        password.c_str(), database.c_str(), port, NULL, 0))
                {
                    oss << "... Reconnected.";
                }
                else
                {
                    oss << "... Reconnection attempt failed.";
                }

                ec = SqlDB::CONNECTION;
                break;

            // Error codes that should be considered applied for the RAFT log.
            case ER_DUP_ENTRY:
                ec = SqlDB::SQL_DUP_KEY;
                break;

            default:
                ec = SqlDB::SQL; //Default exit code for errors
                break;
        }

        if (ec != SqlError::CONNECTION)
        {
            oss << "SQL command was: " << c_str;
            oss << ", error " << err_num << " : " << err_msg;
        }

        NebulaLog::log("ONE", error_level, oss);

        free_db_connection(db);

        return ec;
    }

    if (obj != 0)
    {
        // Retrieve the entire result set all at once
        MYSQL_RES * result = mysql_store_result(db);

        int num_rows = mysql_affected_rows(db);

        if ( obj->isCallBackSet() )
        {
            MYSQL_ROW           row;
            MYSQL_FIELD *       fields;
            unsigned int        num_fields;

            if (result == NULL)
            {
                ostringstream   oss;
                const char *    err_msg = mysql_error(db);
                int             err_num = mysql_errno(db);

                oss << "SQL command was: " << c_str;
                oss << ", error " << err_num << " : " << err_msg;

                NebulaLog::log("ONE",error_level,oss);

                free_db_connection(db);

                return SqlDB::SQL;
            }

            // Fetch the names of the fields
            num_fields = mysql_num_fields(result);
            fields     = mysql_fetch_fields(result);

            char ** names = new char*[num_fields];

            for(unsigned int i = 0; i < num_fields; i++)
            {
                names[i] = fields[i].name;
            }

            // Fetch each row, and call-back the object waiting for them
            while((row = mysql_fetch_row(result)))
            {
                if ( obj->do_callback(num_fields, row, names) != 0 )
                {
                    ec = SqlDB::SQL;
                    break;
                }
            }

            delete[] names;
        }

        if ( obj->get_affected_rows() == 0 && num_rows > 0)
        {
            obj->set_affected_rows(num_rows);
        }

        // Free the result object
        mysql_free_result(result);
    }

    free_db_connection(db);

    double sec = Log::stop_timer(&timer);

    if ( sec > 0.5 )
    {
        std::ostringstream oss;

        oss << "Slow query (" << one_util::float_to_str(sec) << "s) detected: "
            << str;

        NebulaLog::log("SQL", Log::WARNING, oss);
    }

    return ec;
}

/* -------------------------------------------------------------------------- */

char * MySqlDB::escape_str(const string& str)
{
    char * result = new char[str.size()*2+1];

    mysql_real_escape_string(db_escape_connect, result, str.c_str(), str.size());

    return result;
}

/* -------------------------------------------------------------------------- */

void MySqlDB::free_str(char * str)
{
    delete[] str;
}

/* -------------------------------------------------------------------------- */

MYSQL * MySqlDB::get_db_connection()
{
    MYSQL *db;

    pthread_mutex_lock(&mutex);

    while ( db_connect.empty() == true )
    {
        pthread_cond_wait(&cond, &mutex);
    }

    db = db_connect.front();

    db_connect.pop();

    pthread_mutex_unlock(&mutex);

    return db;
}

/* -------------------------------------------------------------------------- */

void MySqlDB::free_db_connection(MYSQL * db)
{
    pthread_mutex_lock(&mutex);

    db_connect.push(db);

    pthread_cond_signal(&cond);

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */

bool MySqlDB::fts_available()
{
    unsigned long version;

    version = mysql_get_server_version(db_escape_connect);

    if (version >= 50600)
    {
        return true;
    }
    else
    {
        return false;
    }
}

/* -------------------------------------------------------------------------- */
