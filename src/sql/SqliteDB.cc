/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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


#include "SqliteDB.h"

using namespace std;

/* -------------------------------------------------------------------------- */

extern "C" int sqlite_callback (
        void *                  _obj,
        int                     num,
        char **                 values,
        char **                 names)
{
    Callbackable *obj;

    obj = static_cast<Callbackable *>(_obj);

    if (obj == 0)
    {
        return -1;
    }

    return obj->do_callback(num,values,names);
};

/* -------------------------------------------------------------------------- */

SqliteDB::SqliteDB(const string& db_name)
{
    int rc;

    pthread_mutex_init(&mutex,0);

    rc = sqlite3_open(db_name.c_str(), &db);

    if ( rc != SQLITE_OK )
    {
        throw runtime_error("Could not open database.");
    }
}

/* -------------------------------------------------------------------------- */

SqliteDB::~SqliteDB()
{
    pthread_mutex_destroy(&mutex);

    sqlite3_close(db);
}

/* -------------------------------------------------------------------------- */

bool SqliteDB::multiple_values_support()
{
    // Versions > 3.7.11 support multiple value inserts, but tests
    // have ended in segfault. A transaction seems to perform better
    //return SQLITE_VERSION_NUMBER >= 3007011;
    return false;
}

/* -------------------------------------------------------------------------- */

int SqliteDB::exec(ostringstream& cmd, Callbackable* obj, bool quiet)
{
    int          rc;

    const char * c_str;
    string       str;

    int          counter = 0;
    char *       err_msg = 0;

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

        rc = sqlite3_exec(db, c_str, callback, arg, &err_msg);

        if (rc == SQLITE_BUSY || rc == SQLITE_IOERR)
        {
            struct timeval timeout;
            fd_set zero;

            FD_ZERO(&zero);
            timeout.tv_sec  = 0;
            timeout.tv_usec = 250000;

            select(0, &zero, &zero, &zero, &timeout);
        }
    }while( (rc == SQLITE_BUSY || rc == SQLITE_IOERR) &&
            (counter < 10));

    unlock();

    if (rc != SQLITE_OK)
    {
        if (err_msg != 0)
        {
            Log::MessageType error_level = quiet ? Log::DDEBUG : Log::ERROR;

            ostringstream oss;

            oss << "SQL command was: " << c_str << ", error: " << err_msg;
            NebulaLog::log("ONE",error_level,oss);

            sqlite3_free(err_msg);
        }

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

char * SqliteDB::escape_str(const string& str)
{
    return sqlite3_mprintf("%q",str.c_str());
}

/* -------------------------------------------------------------------------- */

void SqliteDB::free_str(char * str)
{
    sqlite3_free(str);
}

