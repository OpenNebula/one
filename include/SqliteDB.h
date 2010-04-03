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

#ifndef SQLITE_DB_H_
#define SQLITE_DB_H_

#include <string>
#include <sstream>
#include <stdexcept>
#include <sqlite3.h>

#include <sys/time.h>
#include <sys/types.h>
#include <unistd.h>

#include "Log.h"
#include "SqlDB.h"
#include "ObjectSQL.h"

using namespace std;

extern "C" int sqlite_callback (
        void *                  _obj,
        int                     num,
        char **                 values,
        char **                 names)
{
    ObjectSQL *obj;

    obj = static_cast<ObjectSQL *>(_obj);

    if (obj == 0)
    {
        return -1;
    }

    return obj->do_callback(num,values,names);
};

/**
 * SqliteDB class. Provides a wrapper to the sqlite3 database interface. It also
 * provides "global" synchronization mechanism to use it in a multithread
 * environment.
 */
class SqliteDB : public SqlDB
{
public:

    SqliteDB(string& db_name, Log::LogFunction _log = 0):log(_log)
    {
        int rc;

        pthread_mutex_init(&mutex,0);

        rc = sqlite3_open(db_name.c_str(), &db);

        if ( rc != SQLITE_OK )
        {
            throw runtime_error("Could not open database.");
        }
    };

    ~SqliteDB()
    {
        pthread_mutex_destroy(&mutex);

        sqlite3_close(db);
    };

    /**
     *  Wraps the sqlite3_exec function call, and locks the DB mutex.
     *    @param sql_cmd the SQL command
     *    @param callbak function to execute on each data returned, watch the
     *    mutex you block in the callback.
     *    @param arg to pass to the callback function
     *    @return 0 on success
     */
    int exec(ostringstream& cmd, Callbackable* obj=0)
    {
        int          rc;

        const char * c_str;
        string       str;

        int          counter = 0;

        char *       err_msg = 0;
        char **      ptr = (log==0) ? 0 : &err_msg;

        int   (*callback)(void*,int,char**,char**);
        void * arg;

        str   = cmd.str();
        c_str = str.c_str();

        callback = 0;
        arg      = 0;

        if ((obj != 0)&&(obj->isCallBackSet()))
        {
            callback = sqlite_callback;
            arg      = static_cast<void *>(obj);
        }

        lock();

        do
        {
            counter++;

            rc = sqlite3_exec(db, c_str, callback, arg, ptr);

            if (rc == SQLITE_BUSY || rc == SQLITE_IOERR_BLOCKED)
            {
                struct timeval timeout;
                fd_set zero;

                FD_ZERO(&zero);
                timeout.tv_sec  = 0;
                timeout.tv_usec = 250000;

                select(0, &zero, &zero, &zero, &timeout);
            }
        }while( (rc == SQLITE_BUSY || rc == SQLITE_IOERR_BLOCKED) &&
                (counter < 10));

        unlock();

        if (rc != SQLITE_OK)
        {
            if ((log != 0) && (err_msg != 0))
            {
                ostringstream oss;

                oss << "SQL command was: " << c_str << ", error: " << err_msg;
                log("ONE",Log::ERROR,oss,0,Log::ERROR);
            }

            if ( err_msg != 0)
            {
                sqlite3_free(err_msg);
            }

            return -1;
        }

        return 0;
    };

    /**
     *  Performs a DB transaction
     *    @param sql_cmd the SQL command
     *    @param callbak function to execute on each data returned
     *    @param arg to pass to the callback function
     *    @return 0 on success
     */
    int exec(const char * cmd_c_str, Callbackable* obj=0)
    {
        string          cmd_str = cmd_c_str;
        ostringstream   cmd;

        cmd.str(cmd_str);

        return exec(cmd, obj);
    };

    /**
     *  This function returns a legal SQL string that can be used in an SQL
     *  statement.
     *    @param str the string to be escaped
     *    @return a valid SQL string or NULL in case of failure
     */
    char * escape_str(const string& str)
    {
        return sqlite3_mprintf("%q",str.c_str());
    };

    /**
     *  Frees a previously scaped string
     *    @param str pointer to the str
     */
    void free_str(char * str)
    {
        sqlite3_free(str);
    };

private:
    /**
     *  Fine-grain mutex for DB access
     */
    pthread_mutex_t     mutex;

    /**
     *  Pointer to the database.
     */
    sqlite3 *           db;

    /**
     *  Log facility
     */
    Log::LogFunction    log;

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

#endif /*SQLITE_DB_H_*/
