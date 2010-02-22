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

#ifndef SCHEDULER_VIRTUAL_MACHINE_H_
#define SCHEDULER_VIRTUAL_MACHINE_H_

#include "VirtualMachine.h"
#include "SchedulerHost.h"

using namespace std;


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The SchedulerHost class. It represents the scheduler version of the host,
 *  only read operations to the pool are allowed for the SchedulerHost class
 */
class SchedulerVirtualMachine : public VirtualMachine
{
    
public:

    SchedulerVirtualMachine(){};

	~SchedulerVirtualMachine()
    {
        vector<SchedulerVirtualMachine::Host *>::iterator	jt;
                
        for (jt=hosts.begin();jt!=hosts.end();jt++)
        {
            delete *jt;
        }
    };
    
    /**
     *  Adds a new share to the map of suitable shares to start this VM
     *    @param  hid of the selected host
     *    @param hsid of the selected host share
     */
    void add_host(int hid)    
    {
    	SchedulerVirtualMachine::Host * ss;
    	
    	ss = new SchedulerVirtualMachine::Host(hid);
    	
        hosts.push_back(ss);
    };
    
    /**
     *  Gets the matching hosts ids 
     *    @param mh vector with the hids of the matching hosts
     */
    void get_matching_hosts(vector<int>& mh)
    {
        vector<SchedulerVirtualMachine::Host *>::iterator i;
        
        for(i=hosts.begin();i!=hosts.end();i++)
        {
            mh.push_back((*i)->hid);
        }
    };
    
    /**
     *  Sets the priorities for each matching host
     */
    void set_priorities(vector<float>& total);
    
    /**
     * 
     */
     int get_host(int& hid, SchedulerHostPool * hpool);

    /**
     *  Function to write a Virtual Machine in an output stream
     */
    friend ostream& operator<<(ostream& os, SchedulerVirtualMachine& vm);
                
private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class SchedulerVirtualMachinePool;
    
    //--------------------------------------------------------------------------
    
    struct Host
    {
        int 			hid;
        float			priority;

        Host(int _hid):
        	hid(_hid),
        	priority(0){};

        ~Host(){};
        
        bool operator<(const Host& b) const { //Sort by priority
            return priority < b.priority;
        }        
    };

    static bool host_cmp (const Host * a, const Host * b )
    {
        return (*a < *b );
    };
    
    //--------------------------------------------------------------------------

    /**
     *  Matching hosts 
     */
    vector<SchedulerVirtualMachine::Host *>	hosts;
        
    // -------------------------------------------------------------------------
    // SQL functions do not modify the DB!
    // -------------------------------------------------------------------------
    
    int insert(SqliteDB *db);

    int update(SqliteDB *db);
    
    int drop(SqliteDB *db);        
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The SchedulerHost class. It represents the scheduler version of the host,
 *  read only operation to the pool are allowed for the SchedulerHost class
 */
class SchedulerVirtualMachinePool : public PoolSQL
{
public:

    SchedulerVirtualMachinePool(SqliteDB * db):PoolSQL(db){};

    ~SchedulerVirtualMachinePool(){};
    
    int allocate(
        PoolObjectSQL   *objsql);
    
    SchedulerVirtualMachine * get(
        int     oid,
        bool    lock)
    {
        return static_cast<SchedulerVirtualMachine *>(PoolSQL::get(oid,lock));
    };
        
    /**
     *  Set ups the VM pool by performing the following actions:
     *  - All the objects stored in the pool are flushed
     *  - The ids of the pendings VMs in the database are loaded
     *    @return 0 on success 
     */     
     int set_up();    
    
private:
    friend class Scheduler;
        
    /**
     *  The ids of the pending VMs 
     */
    vector<int> pending_vms;
    
    PoolObjectSQL * create()
    {
        return new SchedulerVirtualMachine;
    };
    
    void bootstrap();
};

#endif /*SCHEDULER_VIRTUAL_MACHINE_H_*/
