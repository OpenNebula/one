/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#ifndef LOG_DB_H_
#define LOG_DB_H_

#include <string>
#include <sstream>

#include "SqlDB.h"
#include "LogDBRequest.h"

class LogDB : public SqlDB
{
public:
    LogDB(SqlDB * _db):db(_db), term(0), index(0){};

    virtual ~LogDB(){};

    void set_term(unsigned int t)
    {
        term = t;
    }

    void set_index(unsigned int i)
    {
        next_index = i;
    }

    int exec_wr(ostringstream& cmd)
    {
        int rc;

        //TODO: WRITE RECORD IN DB
        //
        LogDBRecord * lr = new LogDBRequest(next_index, term, cmd);

        next_index++;

        //LogDBManager->triger(NEW_LOG_RECORD);

        lr.wait();

        if ( lr.result == true )
        {
            rc = exec(cmd, 0, false);
        }
        else
        {
            rc = -1;
            //Nebula::Log
        }

        return rc;
    }

    // -------------------------------------------------------------------------
    // SQL interface. Use database store implementation
    // -------------------------------------------------------------------------
    char * escape_str(const string& str)
    {
        return db->escape_str(str);
    }

    void free_str(char * str)
    {
        db->free_str(str);
    }

    bool multiple_values_support()
    {
        return db->multiple_values_support();
    }

protected:
    int exec(ostringstream& cmd, Callbackable* obj, bool quiet)
    {
        return db->exec(cmd, obj, quiet);
    }

private:
    /**
     *  Pointer to the underlying DB store
     */
    SqlDB * db;

    /**
     *  Index to be used by the next logDB record
     */
    unsigned int next_index;

    /**
     *  Current term to be included in new LogDB records generated during the
     *  term.
     */
    unsigned int term;

};

#endif /*LOG_DB_H_*/

