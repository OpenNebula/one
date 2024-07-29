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

#ifndef SQL_DB_H_
#define SQL_DB_H_

#include <sstream>
#include <map>
#include "Callbackable.h"

/**
 * SqlDB class.Provides an abstract interface to implement a SQL backend
 */
class SqlDB
{
public:

    SqlDB() {};

    virtual ~SqlDB() {};

    enum SqlError
    {
        SUCCESS     = 0,
        INTERNAL    = -1,
        CONNECTION  = -100,
        SQL         = -200,
        SQL_DUP_KEY = -201
    };

    enum class SqlFeature
    {
        MULTIPLE_VALUE, // syntax INSERT VALUES (data), (data), (data)
        LIMIT,          // LIMIT in queries with DELETE and UPDATE
        JSON_QUERY,     // JSON queries Search
        COMPARE_BINARY  // Use BINARY for comparing name in DB
    };

    /* ---------------------------------------------------------------------- */
    /* Database Operations                                                    */
    /* ---------------------------------------------------------------------- */

    /**
     *   Operations on the database:
     *     - exec_local_wr, perform modifications locally, without replication
     *     - exec_rd, read only access to local DB
     *     - exec_wr, update DB and replicate changes
     *    @param sql_cmd the SQL command
     *    @param callbak function to execute on each data returned
     *    @return 0 on success
     */
    virtual int exec_local_wr(std::ostringstream& cmd)
    {
        return exec(cmd, 0, false);
    }

    virtual int exec_rd(std::ostringstream& cmd, Callbackable* obj)
    {
        return exec(cmd, obj, false);
    }

    virtual int exec_wr(std::ostringstream& cmd)
    {
        return exec(cmd, 0, false);
    }

    virtual int exec_wr(std::ostringstream& cmd, Callbackable* obj)
    {
        return exec(cmd, obj, false);
    }

    /* ---------------------------------------------------------------------- */

    int exec_ext(std::ostringstream& cmd)
    {
        return exec_ext(cmd, 0, false);
    }

    int exec_ext(std::ostringstream& cmd, Callbackable * obj)
    {
        return exec_ext(cmd, obj, false);
    }

    /**
      *  This function returns a legal SQL string that can be used in an SQL
      *  statement.
      *    @param str the string to be escaped
      *    @return a valid SQL string or NULL in case of failure
      */
    virtual char * escape_str(const std::string& str) const = 0;

    /**
     *  Frees a previously scaped string
     *    @param str pointer to the str
     */
    virtual void free_str(char * str) const = 0;


    virtual bool supports(SqlFeature ft) const
    {
        auto it = features.find(ft);

        if ( it == features.end() )
        {
            return false;
        }

        return it->second;
    }

    /**
     *  @return pointer to a non-federated version of this database
     */
    virtual SqlDB * get_local_db()
    {
        return this;
    }

    /**
     *  @return string with compatible LIMIT clause syntax
     *  LIMIT [offset], row_count
     *
     *  +---+---+---+---+---+---+---+---+--
     *  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |...
     *  +---+---+---+---+---+---+---+---+--
     *          |                   |
     *          /-------------------/
     *              LIMIT 3, 5
     */
    virtual std::string limit_string(int sid, int eid) const
    {
        std::ostringstream oss;

        oss << "LIMIT " << sid << "," << eid;

        return oss.str();
    }

    virtual std::string limit_string(int sid) const
    {
        std::ostringstream oss;

        oss << "LIMIT " << sid;

        return oss.str();
    }

    void add_binary(std::ostringstream& oss)
    {
        if (supports(SqlFeature::COMPARE_BINARY))
        {
            oss << "BINARY ";
        }
    }

    /**
     * Set maximal number of consecutive errors to terminate oned in HA environment
     * -1 to disable this feature
     */
    void set_errors_limit(int limit)
    {
        errors_limit = limit;
    }

protected:
    /**
     *  Performs a DB transaction
     *    @param sql_cmd the SQL command
     *    @param callbak function to execute on each data returned
     *    @param quiet True to log errors with DDEBUG level instead of ERROR
     *    @return 0 on success -1 on failure
     */
    int exec(std::ostringstream& cmd, Callbackable* obj, bool quiet);

    /**
     *  This function performs a DB transaction and returns and extended error code
     *    @return SqlError enum
     */
    virtual int exec_ext(std::ostringstream& cmd, Callbackable *obj, bool quiet) = 0;

    /**
     *  Feature set
     */
    std::map<SqlFeature, bool> features =
    {
        {SqlFeature::MULTIPLE_VALUE, false},
        {SqlFeature::LIMIT, false},
        {SqlFeature::JSON_QUERY, false},
        {SqlFeature::COMPARE_BINARY, false}
    };

private:
    /**
     * Actual number of consecutive errors
     */
    int consecutive_errors = 0;

    /**
     * Maximal number of consecutive errors to terminate oned in HA environment
     * -1 to disable this feature
     */
    int errors_limit = -1;
};

#endif /*SQL_DB_H_*/
