/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
#include "NebulaLog.h"

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

    return obj->do_callback(num, values, names);
};

/* -------------------------------------------------------------------------- */

SqliteDB::SqliteDB(const string& db_name, int timeout)
{
    int rc = sqlite3_open(db_name.c_str(), &db);

    if ( rc != SQLITE_OK )
    {
        throw runtime_error("Could not open database.");
    }

    int enable_limit = sqlite3_compileoption_used("SQLITE_ENABLE_UPDATE_DELETE_LIMIT");

    if (enable_limit == 1)
    {
        NebulaLog::log("ONE", Log::INFO,
                       "sqlite has enabled: SQLITE_ENABLE_UPDATE_DELETE_LIMIT");
    }

    sqlite3_extended_result_codes(db, 1);

    sqlite3_busy_timeout(db, timeout);

    features =
    {
        {SqlFeature::MULTIPLE_VALUE, false},
        {SqlFeature::LIMIT, enable_limit == 1},
        {SqlFeature::JSON_QUERY, false},
        {SqlFeature::COMPARE_BINARY, false}
    };
}

/* -------------------------------------------------------------------------- */

SqliteDB::~SqliteDB()
{
    sqlite3_close(db);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SqliteDB::exec_ext(std::ostringstream& cmd, Callbackable *obj, bool quiet)
{
    int rc, ec;

    const char * c_str;
    string       str;

    char * err_msg = 0;

    int   (*callback)(void*, int, char**, char**);
    void * arg;

    Log::MessageType error_level;
    std::ostringstream oss;

    str   = cmd.str();
    c_str = str.c_str();

    callback = 0;
    arg      = 0;

    if ((obj != 0)&&(obj->isCallBackSet()))
    {
        callback = sqlite_callback;
        arg      = static_cast<void *>(obj);
    }

    {
        lock_guard<mutex> lock(_mutex);

        rc = sqlite3_exec(db, c_str, callback, arg, &err_msg);

        if (obj != 0 && obj->get_affected_rows() == 0)
        {
            int num_rows = sqlite3_changes(db);

            if (num_rows > 0)
            {
                obj->set_affected_rows(num_rows);
            }
        }
    }

    switch(rc)
    {
        case SQLITE_BUSY:
        case SQLITE_IOERR:
            ec = SqlDB::CONNECTION;
            break;

        case SQLITE_OK:
            ec = SqlDB::SUCCESS;
            break;

        // Error codes that should be considered applied for the RAFT log.
        case SQLITE_CONSTRAINT_UNIQUE:
            ec = SqlDB::SQL_DUP_KEY;
            break;

        default:
            ec = SqlDB::SQL;
            break;
    }

    if ( ec != SqlDB::SUCCESS && err_msg != NULL )
    {
        error_level = quiet ? Log::DDEBUG : Log::ERROR;

        oss << "SQL command was: " << c_str << ", error: " << err_msg;
        NebulaLog::log("ONE", error_level, oss);

        sqlite3_free(err_msg);
    }

    return ec;
}

/* -------------------------------------------------------------------------- */

char * SqliteDB::escape_str(const string& str) const
{
    return sqlite3_mprintf("%q", str.c_str());
}

/* -------------------------------------------------------------------------- */

void SqliteDB::free_str(char * str) const
{
    sqlite3_free(str);
}

