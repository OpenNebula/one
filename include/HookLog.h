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

#ifndef HOOKLOG_H_
#define HOOKLOG_H_

#include <string>

#include "Attribute.h"

class SqlDB;

/**
 *  This class represents the execution log of Hooks. It writes/reads execution
 *  records in the DB.
 */
class HookLog
{
public:

    HookLog(SqlDB *db, const VectorAttribute * hl_conf);

    virtual ~HookLog() = default;

    /**
     *  Get the execution log for a given hook
     *    @param hkid the ID of the hook
     *    @param xml_log execution records in XML format
     *
     *    @return 0 on success
     */
    int dump_log(int hkid, std::string &xml_log);

    /**
     *  Get the execution log for all hooks
     *    @param xml_log execution records in XML format
     *
     *    @return 0 on success
     */
    int dump_log(std::string &xml_log);

    /**
     *  Get the execution log using a given where clause
     *    @param where_clause where cluase of the SQL query
     *    @param xml_log execution records in XML format
     *
     *    @return 0 on success
     */
    int dump_log(const std::string &where_clause, std::string &xml_log);

    /**
     *  Adds a new execution record to the hook
     *    @param hkid the ID of the hook
     *    @param rc return code of the execution
     *    @param xml_result rc, std streams and execution context
     *
     *    @return 0 on success
     */
    int add(int hkid, int rc, const std::string &xml_result);

    /**
     *  Retries a given execution for a host, using the same execution context
     *    @param hkid the ID of the hook
     *    @param exeid the execution identifier
     *    @param err_msg error message
     *
     *    @return 0 on success
     */
    int retry(int hkid, int exeid, std::string& err_msg);

    /**
     *  Bootstraps the database table(s) associated to the Hook Log
     *    @return 0 on success
     */
    static int bootstrap(SqlDB *_db);

    /**
     *  Drops object from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */

    int drop(SqlDB *db, const int hook_id);

private:

    // ----------------------------------------
    // DataBase implementation variables
    // ----------------------------------------

    /**
     *  Pointer to the database.
     */
    SqlDB * db;

    /**
     * Number of log records saved for each hook.
     */
    int log_retention;

    /**
     *  Dumps hook log records
     *    @param hkid -1 to dump all records
     *    @param exec_id -1 to dump all records
     *    @param xml_log execution results in xml format
     *
     *    @return 0 on success
     */
    int _dump_log(int hkid, int exec_id, std::string &xml_log);
};

#endif /*HOOKLOG_H_*/
