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

#include "MySqlDB.h"
#include <mysql/errmsg.h>

/*********
 * Doc: http://dev.mysql.com/doc/refman/5.5/en/c-api-function-overview.html
 ********/

/* -------------------------------------------------------------------------- */

MySqlDB::MySqlDB(
        const string& _server,
        int           _port,
        const string& _user,
        const string& _password,
        const string& _database)
{
    server   = _server;
    port     = _port;
    user     = _user;
    password = _password;
    database = _database;

    // Initialize the MySQL library
    mysql_library_init(0, NULL, NULL);

    // Initialize a connection handler
    db = mysql_init(NULL);

    // Connect to the server
    if (!mysql_real_connect(db, server.c_str(), user.c_str(),
                            password.c_str(), 0, port, NULL, 0))
    {
        throw runtime_error("Could not open database.");
    }

    pthread_mutex_init(&mutex,0);
}

/* -------------------------------------------------------------------------- */

MySqlDB::~MySqlDB()
{
    // Close the connection to the MySQL server
    mysql_close(db);

    // End use of the MySQL library
    mysql_library_end();

    pthread_mutex_destroy(&mutex);
}

/* -------------------------------------------------------------------------- */

int MySqlDB::exec(ostringstream& cmd, Callbackable* obj)
{
    int          rc;

    const char * c_str;
    string       str;

    str   = cmd.str();
    c_str = str.c_str();

    lock();

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

        NebulaLog::log("ONE",Log::ERROR,oss);

        unlock();

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

            NebulaLog::log("ONE",Log::ERROR,oss);

            unlock();

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

    unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */

char * MySqlDB::escape_str(const string& str)
{
    char * result = new char[str.size()*2+1];

    mysql_real_escape_string(db, result, str.c_str(), str.size());

    return result;
}

/* -------------------------------------------------------------------------- */

void MySqlDB::free_str(char * str)
{
    delete[] str;
}

/* -------------------------------------------------------------------------- */
