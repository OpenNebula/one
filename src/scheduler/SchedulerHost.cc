/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#include <limits.h>
#include <string.h>

#include <iostream>
#include <sstream>

#include "SchedulerHost.h"
#include "Scheduler.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SchedulerHost::get_capacity(int& cpu, int& memory, int threshold)
{
    int total_cpu;

    memory = get_share_free_mem();
    cpu    = get_share_free_cpu();
    
    total_cpu = get_share_max_cpu();

    /* eg. 96.7 >= 0.9 * 100, We need to round */
    if ( cpu >= threshold * total_cpu )
    {
        cpu = (int) ceil((float)cpu/100.0) * 100;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SchedulerHost::insert(SqliteDB *db)
{
    Scheduler::log("HOST",Log::ERROR,
                   "Scheduler can not insert hosts in database");

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SchedulerHost::update(SqliteDB *db)
{
    Scheduler::log("HOST",Log::ERROR,
                   "Scheduler can not update hosts in database");

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SchedulerHost::drop(SqliteDB *db)
{
    Scheduler::log("HOST",Log::ERROR,
                   "Scheduler can not delete hosts from database");

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SchedulerHostPool::allocate(
    PoolObjectSQL   *objsql)
{
    Scheduler::log("HOST",Log::ERROR,
                   "Scheduler can not allocate hosts in database");

    return -1;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SchedulerHostPool::bootstrap()
{
    Scheduler::log("HOST",Log::ERROR,
                   "Scheduler can not bootstrap database");
}

/* ************************************************************************** */
/* SchedulerHostPool                                                          */
/* ************************************************************************** */

extern "C"
{
    static int set_up_cb (
        void *                  _hids,
        int                     num,
        char **                 values,
        char **                 names)
    {
        vector<int> *    hids;

        hids = static_cast<vector<int> *>(_hids);

        if ((hids==0)||(num<=0)||(values[0]==0))
        {
            return -1;
        }

        hids->push_back(atoi(values[0]));

        return 0;
    };
}

/* -------------------------------------------------------------------------- */

int SchedulerHostPool::set_up()
{
    ostringstream   oss;
    int             rc;

    // -------------------------------------------------------------------------
    // Clean the pool to get updated data from db
    // -------------------------------------------------------------------------

    clean();

    hids.clear();

    // -------------------------------------------------------------------------
    // Load the ids (to get an updated list of hosts)
    // -------------------------------------------------------------------------

    lock();

    oss << "SELECT oid FROM " << Host::table 
    	<< " WHERE state != " << Host::DISABLED
        << " AND state != " << Host::ERROR;

    rc = db->exec(oss,set_up_cb,(void *) &hids);

    if ( rc != 0 )
    {
        unlock();

        return -1;
    }

    oss.str("");
    oss << "Discovered Hosts (enabled):";

    for (unsigned int i=0 ; i < hids.size() ; i++)
    {
        oss << " " << hids[i];
    }

    Scheduler::log("HOST",Log::DEBUG,oss);

    unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

