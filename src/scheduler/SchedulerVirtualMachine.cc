/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

/* ************************************************************************** */
/* SchedulerVirtualMachine                                                    */
/* ************************************************************************** */

int SchedulerVirtualMachine::insert(SqliteDB *db)
{
    Scheduler::log("VM",Log::ERROR,
                   "Scheduler can not insert VMs in database");

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SchedulerVirtualMachine::update(SqliteDB *db)
{
    Scheduler::log("VM",Log::ERROR,
                   "Scheduler can not update VMs in database");

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SchedulerVirtualMachine::drop(SqliteDB *db)
{
    Scheduler::log("VM",Log::ERROR,
                   "Scheduler can not delete VMs in database");

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SchedulerVirtualMachine::set_priorities(vector<float>& total)
{
    if ( hosts.size() != total.size() )
    {
        Scheduler::log("VM",Log::ERROR,"Wrong size for priority vector");
        return;
    }
    
    for (unsigned int i=0; i<hosts.size(); i++)
    {
    	hosts[i]->priority = total[i];
    }

    //Sort the shares using the priority
    
    sort(hosts.begin(),hosts.end());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SchedulerVirtualMachine::get_host(
    int&                hid,
    SchedulerHostPool * hpool)
{
    vector<SchedulerVirtualMachine::Host *>::reverse_iterator  i;

    vector<int>::iterator   j;
    SchedulerHost *         host;

    int cpu;
    int mem;
    int dsk;

    get_requirements(cpu,mem,dsk);

    for (i=hosts.rbegin();i!=hosts.rend();i++)
    {
        host = hpool->get((*i)->hid,false);

        if ( host == 0 )
        {
            continue;
        }
        
        if (host->test_capacity(cpu,mem,dsk)==true)
        {
        	host->add_capacity(cpu,mem,dsk);
            hid  = (*i)->hid;

            return 0;        	
        }
    }

    hid  = -1;

    return -1;
}

/* ************************************************************************** */
/* Scheuler Virtual Machine :: Misc                                                    */
/* ************************************************************************** */

ostream& operator<<(ostream& os, SchedulerVirtualMachine& vm)
{
    vector<SchedulerVirtualMachine::Host *>::reverse_iterator  i;
    vector<int>::iterator j;

    for (i=vm.hosts.rbegin();i!=vm.hosts.rend();i++)
    {
        os << "\t" << (*i)->priority << "\t" << (*i)->hid << endl;
    }

    return os;
};

/* ************************************************************************** */
/* SchedulerVirtualMachinePool                                                */
/* ************************************************************************** */

int SchedulerVirtualMachinePool::allocate(
    PoolObjectSQL   *objsql)
{
    Scheduler::log("HOST",Log::ERROR,
                   "Scheduler can not allocate VMs in database");

    return -1;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SchedulerVirtualMachinePool::bootstrap()
{
    Scheduler::log("HOST",Log::ERROR,
                   "Scheduler can not bootstrap database");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SchedulerVirtualMachinePool::set_up()
{
    ostringstream   oss;
    string          where;
    int             rc;

    // -------------------------------------------------------------------------
    // Clean the pool to get updated data from db
    // -------------------------------------------------------------------------

    clean();

    pending_vms.clear();

    // -------------------------------------------------------------------------
    // Load an updated list of pending VMs
    // -------------------------------------------------------------------------

    oss << "state == " << VirtualMachine::PENDING;

    where = oss.str();

    rc = PoolSQL::search(
             pending_vms,
             VirtualMachine::table,
             where);

    oss.str("");
    oss << "Pending virtual machines :";


    for (unsigned int i=0 ; i < pending_vms.size() ; i++)
    {
        oss << " " << pending_vms[i];
    }

    Scheduler::log("VM",Log::DEBUG,oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
