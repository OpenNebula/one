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

#ifndef SQL_DB_H_
#define SQL_DB_H_

#include <sstream>
#include "Callbackable.h"

using namespace std;

/**
 * SqlDB class.Provides an abstract interface to implement a SQL backend
 */
class SqlDB
{
public:

    SqlDB(){};

    virtual ~SqlDB(){};

    /**
     *  Performs a DB transaction
     *    @param sql_cmd the SQL command
     *    @param callbak function to execute on each data returned
     *    @param quiet True to log errors with DDEBUG level instead of ERROR
     *    @return 0 on success
     */
    virtual int exec(ostringstream& cmd, Callbackable* obj=0, bool quiet=false) = 0;

    /**
     *  This function returns a legal SQL string that can be used in an SQL
     *  statement.
     *    @param str the string to be escaped
     *    @return a valid SQL string or NULL in case of failure
     */
    virtual char * escape_str(const string& str) = 0;

    /**
     *  Frees a previously scaped string
     *    @param str pointer to the str
     */
    virtual void free_str(char * str) = 0;

    /**
     * Returns true if the syntax INSERT VALUES (data), (data), (data)
     * is supported
     *
     * @return true if supported
     */
    virtual bool multiple_values_support() = 0;
};

#endif /*SQL_DB_H_*/
