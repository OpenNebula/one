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

#include "ScheduledAction.h"
#include "Nebula.h"
#include "OneDB.h"

using namespace std;

std::set<std::string> ScheduledAction::VM_ACTIONS = {
    "terminate",
    "terminate-hard",
    "undeploy",
    "undeploy-hard",
    "hold",
    "release",
    "stop",
    "suspend",
    "resume",
    "reboot",
    "reboot-hard",
    "poweroff",
    "poweroff-hard",
    "snapshot-create",
    "snapshot-revert",
    "snapshot-delete",
    "disk-snapshot-create",
    "disk-snapshot-revert",
    "disk-snapshot-delete",
    "backup"
};

std::set<PoolObjectSQL::ObjectType> ScheduledAction::SCHED_OBJECTS = {
    PoolObjectSQL::VM,
    PoolObjectSQL::BACKUPJOB
};
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ScheduledAction::ScheduledAction(PoolObjectSQL::ObjectType type,
                                 int parent_id)
    : PoolObjectSQL(-1, SCHEDULEDACTION, "", -1, -1, "", "", one_db::scheduled_action_table)
    , _type(type)
    , _parent_id(parent_id)
    , _action("")
    , _args("")
    , _time(-1)
    , _repeat(NONE)
    , _days("")
    , _end_type(END_NONE)
    , _end_value(-1)
    , _done(-1)
    , _message("")
{
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& ScheduledAction::to_xml(string& xml) const
{
    ostringstream oss;

    oss << "<SCHED_ACTION>"
        << "<ID>" << oid << "</ID>"
        << "<PARENT_ID>" << _parent_id << "</PARENT_ID>"
        << "<TYPE>"   << type_to_str(_type)   << "</TYPE>"
        << "<ACTION>" << _action << "</ACTION>"
        << "<ARGS>"   << _args   << "</ARGS>"
        << "<TIME>"   << _time   << "</TIME>"
        << "<REPEAT>" << _repeat << "</REPEAT>"
        << "<DAYS>"   << _days   << "</DAYS>"
        << "<END_TYPE>"  << _end_type  << "</END_TYPE>"
        << "<END_VALUE>" << _end_value  << "</END_VALUE>"
        << "<DONE>"    << _done    << "</DONE>"
        << "<MESSAGE>" << _message << "</MESSAGE>"
        << "</SCHED_ACTION>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ScheduledAction::parse(const VectorAttribute * va, time_t origin, string& error_str)
{
    string tmp_str;

    switch (_type)
    {
        case PoolObjectSQL::BACKUPJOB:
            _action = "backup";
            break;

        case PoolObjectSQL::VM:
            if (va->vector_value("ACTION", tmp_str) == 0 && !tmp_str.empty())
            {
                if ( VM_ACTIONS.find(tmp_str) == VM_ACTIONS.end() )
                {
                    error_str = tmp_str + " is not supported.";
                    return -1;
                }

                _action = tmp_str;
            }

            break;

        default:
            error_str = "Not supported object type";
            return -1;
    };

    if (_action.empty())
    {
        error_str = "No ACTION in template for Scheduled Action.";
        return -1;
    }

    tmp_str.clear();

    if (va->vector_value("TIME", tmp_str) == 0 && !tmp_str.empty())
    {
        _time = parse_time(tmp_str, origin);
    }

    if (_time == -1)
    {
        error_str = "Unable to parse the time value or value is empty: " + tmp_str;
        return -1;
    }

    int tmp_int;

    if (va->vector_value("REPEAT", tmp_int) == 0)
    {
        if (tmp_int >= NONE && tmp_int <= HOURLY)
        {
            _repeat = static_cast<Repeat>(tmp_int);
        }
        else
        {
            error_str = "Wrong REPEAT value: " + tmp_int;
            return -1;
        }
    }

    if (_repeat == NONE)
    {
        _days = "";
    }
    else if (va->vector_value("DAYS", _days) == 0)
    {
        if (!days_in_range(error_str))
        {
            return -1;
        }
    }
    else if (_days.empty())
    {
        error_str = "Repeat set, but DAYS are empty";
        return -1;
    }

    if (va->vector_value("END_TYPE", tmp_int) == 0)
    {
        if (tmp_int >= END_NONE && tmp_int <= DATE)
        {
            _end_type = static_cast<EndOn>(tmp_int);
        }
        else
        {
            error_str = "Wrong END_TYPE value: " + tmp_int;
            return -1;
        }
    }

    if (_end_type <= NEVER)
    {
        _end_value = -1;
    }
    else if (va->vector_value("END_VALUE", _end_value) == 0)
    {
        if (ends_in_range(error_str))
        {
            return -1;
        }
    }
    else if (_end_value < 0)
    {
        error_str = "END_TYPE set, but END_VALUE is empty";
    }

    if (va->vector_value("ARGS", tmp_str) == 0)
    {
        _args = tmp_str;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool ScheduledAction::days_in_range(std::string& error)
{
    static const char * e[] = {
        "Days in a week have to be in [0,6] range",   //WEEKLY - 0
        "Days in a month have to be in [1,31] range", // MONTHLY - 1
        "Days in a year have to be in [0,365] range", // YEARLY - 2
        "Hours have to be in [0,168] range"           // HOURLY - 3
    };

    static int fday[] = {0,1,0,1};
    static int lday[] = {7,32,366,168};

    bool extra_check;

    std::set<int> d;

    one_util::split_unique<int>(_days, ',', d);

    if ( d.empty() && _repeat > NONE)
    {
        error = "Scheduled Action repeat set, but DAYS are empty";

        return false;
    }

    int _fday = *(d.begin());
    int _lday = *(d.rbegin());

    switch(_repeat)
    {
        case WEEKLY:
        case MONTHLY:
        case YEARLY:
            extra_check = false;
            break;
        case HOURLY:
            extra_check = d.size() != 1;
            break;
        case NONE:
            return d.empty();
    }

    if ( _fday < fday[_repeat] || _lday >= lday[_repeat] || extra_check )
    {
        error = e[_repeat];
        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ScheduledAction::ends_in_range(std::string& error)
{
    if ( _end_type == TIMES && _end_value < 0 )
    {
        error = "Error parsing END_VALUE, times has to be greater or equal to 0";
        return -1;
    }
    else if ( _end_type == DATE )
    {
        struct tm val_tm;

        localtime_r((time_t *)&_end_value, &val_tm);

        time_t out = mktime(&val_tm);

        if (out == -1)
        {
            error = "Error parsing END_VALUE, wrong format for date.";
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool ScheduledAction::is_due()
{
    // -------------------------------------------------------------------------
    // Check action has already finished (END_TYPE and END_VALUE defined)
    // -------------------------------------------------------------------------
    bool has_ended = false;

    switch (_end_type)
    {
        case END_NONE:
        case NEVER:
            has_ended = false;
            break;
        case TIMES:
            has_ended = _end_value <= 0;
            break;
        case DATE:
            has_ended = time(0) > _end_value;
            break;
    }

    if (has_ended)
    {
        return false;
    }

    // -------------------------------------------------------------------------
    // Check if the action has been completed
    // -------------------------------------------------------------------------
    if (_done > 0 && _done >= _time)
    {
        return false; //Action has been already completed
    }

    return _time < time(0); //Action is due
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

time_t ScheduledAction::next_action()
{
    time_t current = time(0);
    _done = current;

    if (_repeat == NONE)
    {
        return -1;
    }

    std::set<int> days_set;

    one_util::split_unique<int>(_days, ',', days_set);

    if ( days_set.empty() )
    {
        return -1;
    }

    /* ---------------------------------------------------------------------  */
    /* Check if action is already finished                                    */
    /* ---------------------------------------------------------------------  */
    if (_end_type == TIMES)
    {
        if (_end_value <= 0)
        {
            return -1;
        }

        --_end_value;
    }
    else if (_end_type == DATE)
    {
        if (time(0) > _end_value)
        {
            return -1;
        }
    }

    /* ---------------------------------------------------------------------  */
    /* Compute next event for the action - HOURLY                             */
    /* ---------------------------------------------------------------------  */
    if ( _repeat == HOURLY )
    {
        do {
            _time += *(days_set.begin()) * 3600;
        } while (_time < current);

        return _time;
    }

    /* ---------------------------------------------------------------------  */
    /* Compute next event for the action - WEEKLY, MONTHLY & YEARLY           */
    /* ---------------------------------------------------------------------  */
    struct tm current_tm;

    int cday;

    localtime_r(&current, &current_tm);

    switch(_repeat)
    {
        case WEEKLY:
            cday   = current_tm.tm_wday;
            break;

        case MONTHLY:
            cday   = current_tm.tm_mday;
            break;

        case YEARLY:
            cday   = current_tm.tm_yday;
            break;

        case HOURLY:
        case NONE:
            return -1;
    }

    int delta = 0;

    if (cday < *(days_set.begin())) //before first day in range
    {
        delta = *(days_set.begin()) - cday;
    }
    else if (cday >= *(days_set.rbegin())) //after or last day in range
    {
        int pdays = days_in_period(current_tm.tm_mon, current_tm.tm_year);

        delta = pdays - cday + *(days_set.begin()); //assume start day is 0
    }
    else //day in range
    {
        auto nday_it = days_set.upper_bound(cday);

        delta = *nday_it - cday;
    }

    _time += delta * 24 * 3600;

    return _time;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ScheduledAction::rebuild_attributes()
{
    int tmp_int;
    string tmp_str;
    int rc = 0;

    rc += xpath(oid, "/SCHED_ACTION/ID", -1);
    rc += xpath(_parent_id, "/SCHED_ACTION/PARENT_ID", -1);
    rc += xpath(_action, "/SCHED_ACTION/ACTION", "");
    rc += xpath(_args, "/SCHED_ACTION/ARGS", "");
    rc += xpath(_time, "/SCHED_ACTION/TIME",(time_t) -1);
    rc += xpath(_done, "/SCHED_ACTION/DONE",(time_t) -1);
    rc += xpath(_days, "/SCHED_ACTION/DAYS", "");
    rc += xpath(_message, "/SCHED_ACTION/MESSAGE", "");
    rc += xpath(_end_value, "/SCHED_ACTION/END_VALUE", (time_t)-1);

    rc += xpath(tmp_str, "/SCHED_ACTION/TYPE", "");
    _type = str_to_type(tmp_str);

    rc += xpath(tmp_int, "/SCHED_ACTION/REPEAT", static_cast<int>(NONE));
    _repeat = static_cast<Repeat>(tmp_int);

    rc += xpath(tmp_int, "/SCHED_ACTION/END_TYPE", static_cast<int>(END_NONE));
    _end_type = static_cast<EndOn>(tmp_int);

    if (rc != 0)
    {
        NebulaLog::error("SCH", "Unable to create ScheduledAction from xml");

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

time_t ScheduledAction::parse_time(std::string str_time, time_t origin)
{
    time_t action_time;

    std::istringstream iss;

    if ( str_time[0] == '+' )
    {
        str_time.erase(0, 1);
    }
    else
    {
        origin = 0;
    }

    iss.str(str_time);

    iss >> action_time;

    if (iss.fail() || !iss.eof())
    {
        return -1;
    }

    action_time += origin;

    return action_time;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ScheduledAction::days_in_period(int month, int year)
{
    static map<int, int> MONTHS_DAYS = {{0, 31}, {1, 28}, {2, 31}, {3, 30},
        {4, 31}, {5, 30}, {6, 31}, {7, 31}, {8, 30}, {9, 31}, {10, 30},
        {11, 31}};

    int leap_year  = 0;
    int leap_month = 0;

    year += 1900;

    if (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0))
    {
        leap_year = 1;

        if ( month == 1 )
        {
            leap_month = 1;
        }
    }

    switch(_repeat)
    {
        case WEEKLY:
            return 7;

        //Return value for months assume month day starts in 0
        case MONTHLY:
            return MONTHS_DAYS[month] + leap_month;

        case YEARLY:
            return 365 + leap_year;

        case HOURLY:
        case NONE:
            return 0;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ScheduledAction::insert(SqlDB * db, std::string& error_str)
{
    if ( SCHED_OBJECTS.find(_type) == SCHED_OBJECTS.end() )
    {
        error_str = PoolObjectSQL::type_to_str(_type) + " is not supported.";
        NebulaLog::error("SCH", error_str);

        return -1;
    }

    return insert_replace(db, false, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ScheduledAction::insert_replace(SqlDB *db, bool replace, std::string& error_str)
{
    ostringstream   oss;

    string tmp;
    char * sql_xml;

    int    rc;

    sql_xml = db->escape_str(to_xml(tmp));

    if ( sql_xml == 0 )
    {
        error_str = "Error creating Scheduled Action XML.";
        return -1;
    }

    if ( validate_xml(sql_xml) != 0 )
    {
        error_str = "Error validating Scheduled Action XML.";
        return -1;
    }

    if(replace)
    {
        oss << "UPDATE " << one_db::scheduled_action_table << " SET "
            << "body = '" <<  sql_xml << "', "
            << "time = "  <<  _time   << ", "
            << "done = "  <<  _done
            << " WHERE oid = " << oid;
    }
    else
    {
        oss << "INSERT INTO " << one_db::scheduled_action_table
            << " (" << one_db::scheduled_action_db_names << ") VALUES ("
            <<         oid        << ","
            <<         _parent_id << ","
            << "'"  << type_to_str(_type) << "',"
            << "'"  << sql_xml    << "',"
            <<         _time      << ","
            <<         _done      << ")";
    }

    rc = db->exec_wr(oss);

    db->free_str(sql_xml);

    if (rc != 0)
    {
        error_str = "Error inserting ScheduledAction to DB, the SQL querry was: " + oss.str();
    }

    return rc;
}
