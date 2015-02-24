/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

/*********
 * Doc: http://dev.mysql.com/doc/refman/5.5/en/c-api-function-overview.html
 ********/

const int MySqlDB::DB_CONNECT_SIZE = 10;

/* -------------------------------------------------------------------------- */

MySqlDB::MySqlDB(
        const string& _server,
        int           _port,
        const string& _user,
        const string& _password,
        const string& _database)
{
    vector<MYSQL *> connections(DB_CONNECT_SIZE);
    MYSQL * rc;

    ostringstream oss;

    server   = _server;
    port     = _port;
    user     = _user;
    password = _password;
    database = _database;

    // Initialize the MySQL library
    mysql_library_init(0, NULL, NULL);

    // Create connection pool to the server
    for (int i=0 ; i < DB_CONNECT_SIZE ; i++)
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
            throw runtime_error("Could not open connect to database server.");
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
        throw runtime_error("Could not open connect to database server.");
    }

    //Connect to the database & initialize connection pool
    oss << "CREATE DATABASE IF NOT EXISTS " << database;

    if ( mysql_query(connections[0], oss.str().c_str()) != 0 )
    {
        throw runtime_error("Could not create the database.");
    }

    oss.str("");
    oss << "USE " << database;

    for (int i=0 ; i < DB_CONNECT_SIZE ; i++)
    {
        if ( mysql_query(connections[i], oss.str().c_str()) != 0 )
        {
            throw runtime_error("Could not connect to the database.");
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

int MySqlDB::exec(ostringstream& cmd, Callbackable* obj, bool quiet)
{
    int          rc;

    const char * c_str;
    string       str;

    str   = cmd.str();
    c_str = str.c_str();

    Log::MessageType error_level = quiet ? Log::DDEBUG : Log::ERROR;

    MYSQL *db;

    db = get_db_connection();

    rc = mysql_query(db, c_str);

    if (rc != 0)
    {
        ostringstream   oss;
        const char *    err_msg = mysql_error(db);
        int             err_num = mysql_errno(db);

        if( err_num == CR_SERVER_GONE_ERROR || err_num == CR_SERVER_LOST )
        {
            oss << "MySQL connection error " << err_num << " : " << err_msg;

            // Try to re-connect
            if (mysql_real_connect(db, server.c_str(), user.c_str(),
                                    password.c_str(), database.c_str(),
                                    port, NULL, 0))
            {
                oss << "... Reconnected.";
            }
            else
            {
                oss << "... Reconnection attempt failed.";
            }
        }
        else
        {
            oss << "SQL command was: " << c_str;
            oss << ", error " << err_num << " : " << err_msg;
        }

        NebulaLog::log("ONE",error_level,oss);

        free_db_connection(db);

        return -1;
    }


    if ( (obj != 0) && (obj->isCallBackSet()) )
    {

        MYSQL_RES *         result;
        MYSQL_ROW           row;
        MYSQL_FIELD *       fields;
        unsigned int        num_fields;

        // Retrieve the entire result set all at once
        result = mysql_store_result(db);

        if (result == NULL)
        {
            ostringstream   oss;
            const char *    err_msg = mysql_error(db);
            int             err_num = mysql_errno(db);

            oss << "SQL command was: " << c_str;
            oss << ", error " << err_num << " : " << err_msg;

            NebulaLog::log("ONE",error_level,oss);

            free_db_connection(db);

            return -1;
        }

        // Fetch the names of the fields
        num_fields  = mysql_num_fields(result);
        fields      = mysql_fetch_fields(result);

        char ** names = new char*[num_fields];

        for(unsigned int i = 0; i < num_fields; i++)
        {
            names[i] = fields[i].name;
        }

        // Fetch each row, and call-back the object waiting for them
        while((row = mysql_fetch_row(result)))
        {
            obj->do_callback(num_fields, row, names);
        }

        // Free the result object
        mysql_free_result(result);

        delete[] names;
    }

    free_db_connection(db);

    return 0;
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
