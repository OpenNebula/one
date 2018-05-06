/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
#include "NebulaUtil.h"

int SchedAction::repeat(Repeat& r)
{
    r = NONE;

    std::string rep_s = vector_value("REP");

    if ( rep_s.empty() )
    {
        return 0;
    }

    std::istringstream iss(rep_s);
    int v_r;

    iss >> v_r;

    if (iss.fail() || !iss.eof())
    {
        return -1;
    }

    if ( v_r < WEEKLY || v_r > HOURLY )
    {
        return -1;
    }

    r = static_cast<Repeat>(v_r);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SchedAction::endon(EndOn& eo)
{
    eo = END_NONE;

    std::string et_s = vector_value("END_TYPE");

    if ( et_s.empty() )
    {
        return 0;
    }

    std::istringstream iss(et_s);
    int v_eo;

    iss >> v_eo;

    if (iss.fail() || !iss.eof())
    {
        return -1;
    }

    if ( v_eo < TIMES || v_eo > DATE )
    {
        return -1;
    }

    eo = static_cast<EndOn>(v_eo);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SchedAction::days(std::set<int>& _d)
{
    std::string st;

    int rc = vector_value("DAYS", st);

    if ( rc != 0 )
    {
        return 0;
    }

    one_util::split_unique<int>(st, ',', _d);

    if ( _d.empty() )
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool SchedAction::days_in_range(Repeat r, std::string& error)
{
    static const char * e[] = {
        "Days in a week have to be in [0,6] range", //WEEKLY - 0
        "Days in a month have to be in [0,31] range", // MONTHLY - 1
        "Days in a year have to be in [0,365] range", // YEARLY - 2
        "Hours have to be in [0,23] range" // HOURLY - 3
    };

    static int fday[] = {0,1,0,1};
    static int lday[] = {7,32,366,24};

    bool extra_check;

    std::set<int> _d;

    if ( days(_d) == -1 )
    {
        error = "Wrong format of DAYS attribute";
        return false;
    }
    else if ( _d.empty() )
    {
        return true;
    }

    int _fday = *(_d.cbegin());
    int _lday = *(_d.cend());

    switch(r)
    {
        case WEEKLY:
        case MONTHLY:
        case YEARLY:
            extra_check = false;
            break;
        case HOURLY:
            extra_check = _d.size() != 1;
            break;
        case NONE:
            return false;
    }

    if ( _fday < fday[r] || _lday >= lday[r] || extra_check )
    {
        error = e[r];
        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool SchedAction::ends_in_range(EndOn eo, std::string& error)
{
    int end_value;
    int rc = vector_value("END_VALUE", end_value);

    if ( rc == -1 )
    {
        error = "Missing END_VALUE";
        return false;
    }

    if ( eo == TIMES && end_value <= 0 )
    {
        error = "Error parsing END_VALUE, times has to be greater than 0";
        return false;
    }
    else if ( eo == DATE )
    {
        struct tm val_tm;

        time_t value = end_value;

        localtime_r(&value, &val_tm);

        time_t out = mktime(&val_tm);

        if (out == -1)
        {
            error = "Error parsing END_VALUE, wrong format for date.";
            return false;
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SchedAction::parse(std::string& error)
{
    Repeat r;
    EndOn  eo;

    if ( repeat(r) == -1 )
    {
        error = "Error parsing REPEAT attribute";
        return -1;
    }

    if ( endon(eo) == -1 )
    {
        error = "Error parsing END_TYPE attribute";
        return -1;
    }

    if ( !days_in_range(r, error) )
    {
        return -1;
    }

    if ( !ends_in_range(eo, error) )
    {
        return -1;
    }

    remove("DONE");
    remove("MESSAGE");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

map<int, int> MONTHS_DAYS = {{0, 31}, {1, 28}, {2, 30}, {3, 31}, {4, 30},
    {5, 31}, {6, 30}, {7, 31}, {8, 30}, {9, 31}, {10, 30}, {11, 31}};

/* -------------------------------------------------------------------------- */

static void check_months(struct tm * next)
{
    int days_month = MONTHS_DAYS[next->tm_mon];

    if ( next->tm_year+1900 % 4 == 0 && ( next->tm_year+1900 % 100 != 0 ||
                next->tm_year+1900 % 400 == 0) && next->tm_mon == 1)
    {
        days_month++;
    }

    if ( next->tm_mday > days_month)
    {
        next->tm_mday = next->tm_mday - MONTHS_DAYS[next->tm_mon];
        next->tm_mon++;
    }
}

/* -------------------------------------------------------------------------- */

static void sum_days(struct tm * next, struct tm * now, int mayor_day,
    int minor_day, int max_day, int comparative)
{
    if (mayor_day >= 0 && minor_day < max_day)
    {
        if( mayor_day <= comparative ) //next
        {
            next->tm_mday = next->tm_mday + (max_day - comparative + minor_day);
        }
        else // same
        {
            next->tm_mday = next->tm_mday + (mayor_day - comparative);
        }
    }

    check_months(next);
}

/* -------------------------------------------------------------------------- */

static void generate_next_day(int rep, int mayor_day, int minor_day,
    struct tm * next, struct tm * now)
{
    SchedAction::Repeat r = static_cast<SchedAction::Repeat>(rep);

    switch(r)
    {
        case SchedAction::WEEKLY:
            sum_days(next, now, mayor_day, minor_day, 7, next->tm_wday);

            next->tm_min  = now->tm_min;
            next->tm_hour = now->tm_hour;
            break;

        case SchedAction::MONTHLY:
            sum_days(next, now, mayor_day, minor_day, MONTHS_DAYS[next->tm_mon],
                next->tm_mday);

            next->tm_min  = now->tm_min;
            next->tm_hour = now->tm_hour;
            break;

        case SchedAction::YEARLY:
            sum_days(next, now, mayor_day, minor_day, 365, next->tm_yday);

            next->tm_min  = now->tm_min;
            next->tm_hour = now->tm_hour;
            break;

        case SchedAction::HOURLY:
        case SchedAction::NONE:
            break;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SchedAction::next_action()
{
    Repeat r;
    EndOn  eo;

    if ( repeat(r) == -1 )
    {
        return -1;
    }

    if ( endon(eo) == -1 )
    {
        return -1;
    }

    std::set<int> _days;

    if ( days(_days) == -1 )
    {
        return -1;
    }
    else if ( _days.empty() )
    {
        return -1;
    }

    /* ---------------------------------------------------------------------  */
    /* Check if action is already finished                                    */
    /* ---------------------------------------------------------------------  */
    int end_value;
    int rc = vector_value("END_VALUE", end_value);

    if ( rc == -1 )
    {
        return -1;
    }

    if ( eo == TIMES )
    {
        if (end_value <= 0)
        {
            return -1;
        }

        replace("END_VALUE", end_value - 1);
    }
    else if ( eo == DATE )
    {
        if ( time(0) > end_value )
        {
            return -1;
        }
    }

    /* ---------------------------------------------------------------------  */
    /* Compute next event for the action                                      */
    /* ---------------------------------------------------------------------  */

    time_t action_time;
    struct tm start_tm;

    localtime_r(&action_time, &start_tm);

    struct tm next = start_tm;
    int start_day;

    switch(r)
    {
        case WEEKLY:
            start_day = start_tm.tm_wday;
            break;

        case MONTHLY:
            start_day = start_tm.tm_mday;
            break;

        case YEARLY:
            start_day = start_tm.tm_yday;
            break;

        case HOURLY:
        case NONE:
            break;
    }

    std::set<int>::iterator it = _days.begin();

    if ( r != HOURLY ) //WEEKLY, MONTHLY, YEARLY
    {

        int minor_day = *it;
        int mayor_day;

        std::pair<std::set<int>::iterator, bool> ret = _days.insert(start_day);

        if ( ret.second == false )
        {
            mayor_day = *(ret.first);

            if ( ++ret.first != _days.end() )
            {
                mayor_day = *(ret.first);
            }
        }
        else
        {
            mayor_day = minor_day;

            if ( ++ret.first != _days.end() )
            {
                mayor_day = *(ret.first);
            }

            it = _days.find(start_day);

            _days.erase(it);

            if (*(--it) > mayor_day)
            {
                mayor_day = *it;
            }
        }

        generate_next_day(r, mayor_day, minor_day, &next, &start_tm);
    }
    else //HOURLY
    {
        int hours = *it;

        next.tm_min  = start_tm.tm_min;
        next.tm_hour = start_tm.tm_hour + hours;

        check_months(&next);
    }

    action_time = mktime(&next);

    if (action_time != -1)
    {
        replace("TIME", action_time);
    }
    else
    {
        return -1;
    }

    return 0;
}
