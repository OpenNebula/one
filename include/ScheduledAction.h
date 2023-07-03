/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#ifndef SCHEDULED_ACTION_H_
#define SCHEDULED_ACTION_H_

#include "PoolObjectSQL.h"

/**
 *  The Scheduled Action class,
 *  it represents planned actions fro Virtual Machine, Backup Jobs, ...
 */
class ScheduledAction : public PoolObjectSQL
{
public:
    enum Repeat
    {
        NONE    = -1,
        WEEKLY  = 0,
        MONTHLY = 1,
        YEARLY  = 2,
        HOURLY  = 3
    };

    enum EndOn
    {
        END_NONE = -1,
        NEVER    = 0,
        TIMES    = 1,
        DATE     = 2
    };

    ScheduledAction(PoolObjectSQL::ObjectType type, int parent_id);

    /**
     * Function to print the Scheduled Action into a string in
     * XML format. String and StreamString versions
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const override;

    /**
     * Init the Scheduled Action from Template string
     *  @param str Template as a string
     *  @return 0 on success, -1 otherwise
     */
    int parse(const VectorAttribute * va, time_t origin, std::string& error_str);

    /**
     *  This function checks that the DAYS attributes are in range
     *  according to the Repeat value:
     *    @param error in case of error
     *
     *    @return true if days are in range false (error) if not
     */
    bool days_in_range(std::string& error);

    /**
     *  This function checks that END_VALUE is properly defined for the
     *  associated END_TYPE
     *    @param error in case of error
     *
     *    @return 0 if days are in range, -1 error
     */
    int ends_in_range(std::string& error);

    /**
     *  @return true if the action needs to be executed.
     */
    bool is_due();

    /**
     *  Compute the next action, updating the TIME attribute for this action
     *    @return time for next action, if ended or error -1
     */
    time_t next_action();

    /**
     * Set Scheduled Action error message
     */
    void log_error(const std::string& error)
    {
        _message = error;
    }

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */
    const std::string& action()
    {
        return _action;
    }

    const std::string& args()
    {
        return _args;
    }

    // Friends
    friend class ScheduledActionPool;
    friend class PoolSQL;

private:
    /**
     * Objects that can include scheduled actions
     */
    static std::set<PoolObjectSQL::ObjectType> SCHED_OBJECTS;

    /**
     * Valid actions for VMs
     */
    static std::set<std::string> VM_ACTIONS;

    // ----------------------------------------
    // Scheduled Action fields
    // ----------------------------------------

    /**
     *  Type of object associated to the Scheduled Action
     */
    PoolObjectSQL::ObjectType _type;

    /**
     *  ID of object associated to the Scheduled Action
     */
    int _parent_id;

    /**
     * Action and arguments
     */
    std::string _action;

    std::string _args;

    /**
     *  Date to perform the action
     */
    time_t _time;

    /**
     *  Repeat schedule for the action
     */
    Repeat _repeat;

    std::string _days;

    EndOn _end_type;

    time_t _end_value;

    /**
     *
     */
    time_t _done;

    std::string _message;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override
    {
        update_from_str(xml_str);

        return rebuild_attributes();
    }

    /**
     *  Rebuilds the internal attributes using xpath
     */
    int rebuild_attributes();

    /**
     * Parse string time
     *  @param str_time Time as string
     *  @return action execution time. Returns -1 on error
     */
    time_t parse_time(std::string str_time, time_t origin);

    /**
     * Return number of days in the Repeat period
     */
    int days_in_period(int month, int year);

    // --------------- DB access methods ---------------

    /**
     *  Write the Scheduled Action to the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int insert(SqlDB * db, std::string& error_str) override;

    /**
     *  Updates the Scheduled Action
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
     int update(SqlDB * db) override
     {
        std::string error;

        return insert_replace(db, true, error);
     }

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @return 0 on success
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*SCHEDULED_ACTION_H_*/

