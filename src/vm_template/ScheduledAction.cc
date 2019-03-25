/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

    std::string rep_s = vector_value("REPEAT");

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
        return -2;
    }

    std::istringstream iss(et_s);
    int v_eo;

    iss >> v_eo;

    if (iss.fail() || !iss.eof())
    {
        return -1;
    }

    if ( v_eo < NEVER || v_eo > DATE )
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
        "Days in a month have to be in [1,31] range", // MONTHLY - 1
        "Days in a year have to be in [0,365] range", // YEARLY - 2
        "Hours have to be in [0,168] range" // HOURLY - 3
    };

    static int fday[] = {0,1,0,1};
    static int lday[] = {7,32,366,168};

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

    int _fday = *(_d.begin());
    int _lday = *(_d.rbegin());

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

int SchedAction::ends_in_range(EndOn eo, std::string& error)
{
    int end_value;
    int rc = vector_value("END_VALUE", end_value);

    if ( rc == -1 && eo != NEVER )
    {
        error = "Missing END_VALUE";
        return -2;
    }

    if ( eo == TIMES && end_value <= 0 )
    {
        error = "Error parsing END_VALUE, times has to be greater than 0";
        return -1;
    }
    else if ( eo == DATE )
    {
        struct tm val_tm;

        localtime_r((time_t *)&end_value, &val_tm);

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

int SchedAction::parse(std::string& error, bool clean)
{
    Repeat r;
    EndOn  eo;
    int rc_e, rc_ev;

    if ( repeat(r) == -1 )
    {
        error = "Error parsing REPEAT attribute";
        return -1;
    }

    rc_e  = endon(eo);
    rc_ev = ends_in_range(eo, error);

    if ( rc_e == -1 )
    {
        error = "Error parsing END_TYPE attribute";
        return -1;
    }
    else if ( rc_e == -2 && rc_ev != -2 )
    {
        error = "Error END_VALUE defined but not valid END_TYPE found";
        return -1;
    }
    else if ( rc_e == 0 && rc_ev != 0 )
    {
        return -1;
    }

    if ( !days_in_range(r, error) )
    {
        return -1;
    }


    if (clean)
    {
        remove("DONE");
        remove("MESSAGE");
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int days_in_period(SchedAction::Repeat& r, int month, int year)
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

    switch(r)
    {
        case SchedAction::WEEKLY:
            return 7;

        //Return value for months assume month day starts in 0
        case SchedAction::MONTHLY:
            return MONTHS_DAYS[month] + leap_month;

        case SchedAction::YEARLY:
            return 365 + leap_year;

        case SchedAction::HOURLY:
        case SchedAction::NONE:
            return 0;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool SchedAction::is_due(time_t stime)
{
    time_t action_time, done_time, origin = 0;
    int repeat;

    std::istringstream iss;

    bool has_done   = vector_value("DONE", done_time) == 0;
    bool has_repeat = vector_value("REPEAT", repeat) == 0;
    std::string action_time_s = vector_value("TIME");

    if ( action_time_s[0] == '+' )
    {
        origin = stime;
        action_time_s.erase(0, 1);
    }

    iss.str(action_time_s);

    iss >> action_time;

    if (iss.fail() || !iss.eof())
    {
        return false;
    }

    action_time += origin;

    return ((!has_done || done_time < action_time || has_repeat)
                && action_time < time(0));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

time_t SchedAction::next_action()
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

    if ( rc == -1 && eo != NEVER)
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
    /* Compute next event for the action - HOURLY                             */
    /* ---------------------------------------------------------------------  */
    time_t action_time;

    vector_value("TIME", action_time);

    if ( r == HOURLY )
    {
        action_time += *(_days.begin()) * 3600;

        replace("TIME", action_time);

        return action_time;
    }

    /* ---------------------------------------------------------------------  */
    /* Compute next event for the action - WEEKLY, MONTHLY & YEARLY           */
    /* ---------------------------------------------------------------------  */
    time_t current = time(0);

    struct tm current_tm;

    int cday;

    localtime_r(&current, &current_tm);

    switch(r)
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
            break;
    }

    std::set<int>::iterator it = _days.lower_bound(cday);

    int delta = 0;

    if (it == _days.end()) //after last day in range
    {
        int pdays = days_in_period(r, current_tm.tm_mon, current_tm.tm_year);

        delta = pdays - cday + *(_days.begin()); //assume start day is 0
    }
    else if (cday < *(_days.begin())) //before first day in range
    {
        delta = *(_days.begin()) - cday;
    }
    else if (*it != cday ) //is not today
    {
        delta = *it - cday;
    }

    action_time += delta * 24 * 3600;

    replace("TIME", action_time);

    return action_time;
}
