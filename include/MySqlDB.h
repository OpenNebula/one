/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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
#include <mysql.h>

#include <sys/time.h>
#include <sys/types.h>
#include <unistd.h>

#include "NebulaLog.h"
#include "SqlDB.h"
#include "ObjectSQL.h"

using namespace std;

/*********
 * Doc: http://dev.mysql.com/doc/refman/5.5/en/c-api-function-overview.html
 ********/

/**
 * SqliteDB class. Provides a wrapper to the mysql database interface.
 */
class MySqlDB : public SqlDB
{
public:

    MySqlDB(
            string server,
            string user,
            string password,
            char * database)
    {

        // Initialize the MySQL library
        mysql_library_init(0, NULL, NULL);

        // Initialize a connection handler
        db = mysql_init(NULL);

        // Connect to the server
        if (!mysql_real_connect(db, server.c_str(), user.c_str(),
                                password.c_str(), database, 0, NULL, 0))
        {
            throw runtime_error("Could not open database.");
        }
    };

    ~MySqlDB()
    {
        // Close the connection to the MySQL server
        mysql_close(db);

        // End use of the MySQL library
        mysql_library_end();
    };

    /**
     *  Wraps the mysql_query function call
     *    @param cmd the SQL command
     *    @param obj Callbackable obj to call if the query succeeds
     *    @return 0 on success
     */
    int exec(ostringstream& cmd, Callbackable* obj=0)
    {
        int          rc;

        const char * c_str;
        string       str;


        int   (*callback)(void*,int,char**,char**);
        void * arg;

        str   = cmd.str();
        c_str = str.c_str();

        callback = 0;
        arg      = 0;


        rc = mysql_query(db, c_str);

        if (rc != 0)
        {
            ostringstream   oss;
            const char *    err_msg = mysql_error(db);
            int             err_num = mysql_errno(db);

            oss << "SQL command was: " << c_str;
            oss << ", error " << err_num << " : " << err_msg;

            NebulaLog::log("ONE",Log::ERROR,oss);

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

        return 0;
    };


    /**
     *  This function returns a legal SQL string that can be used in an SQL
     *  statement. The string is encoded to an escaped SQL string, taking into
     *  account the current character set of the connection.
     *    @param str the string to be escaped
     *    @return a valid SQL string or NULL in case of failure
     */
    char * escape_str(const string& str)
    {
        char * result = new char[str.size()*2+1];

        mysql_real_escape_string(db, result, str.c_str(), str.size());

        return result;
    };

    /**
     *  Frees a previously scaped string
     *    @param str pointer to the str
     */
    void free_str(char * str)
    {
        delete[] str;
    };

private:

    /**
     * The MySql connection handler
     */
    MYSQL *             db;
};

#endif /*MYSQL_DB_H_*/
