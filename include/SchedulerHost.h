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

#ifndef SCHEDULER_HOST_H_
#define SCHEDULER_HOST_H_

#include "Host.h"

using namespace std;


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The SchedulerHost class. It represents the scheduler version of the host,
 *  only read operations to the pool are allowed for the SchedulerHost class
 */
class SchedulerHost : public Host
{
    
public:

    SchedulerHost(){};

	~SchedulerHost(){};
    
    /**
     *  Gets the current host capacity
     *    @param cpu the host free cpu, scaled according to a given threshold
     *    @param memory the host free memory
     *    @param threshold to consider the host totally free
     */
    void get_capacity(int& cpu, int& memory, int threshold);
    
private:

    // ----------------------------------------
    // Friends
    // ----------------------------------------
    friend class SchedulerHostPool;
        
    // ----------------------------------------
    // SQL functions do not modify the DB!
    // ----------------------------------------
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
class SchedulerHostPool : public PoolSQL
{
public:

    //--------------------------------------------------------------------------
    // Constructor
    //--------------------------------------------------------------------------
    
    SchedulerHostPool(SqliteDB *db):PoolSQL(db){};

    ~SchedulerHostPool(){};
    
    /**
     *  Implements the Pool interface, just prints an error message. This
     *  class DOES NOT modify the database.
     */
    int allocate(
        PoolObjectSQL   *objsql);

    /**
     *  Gets an ScheulerHost from the pool (if needed the object is loaded from 
     *  the database).
     *   @param oid the object unique identifier
     *   @param lock locks the object if true
     * 
     *   @return a pointer to the object, 0 in case of failure
     */
    SchedulerHost * get(
        int     oid,
        bool    lock)
    {
        return static_cast<SchedulerHost *>(PoolSQL::get(oid,lock));
    };
            
    /**
     *  Set ups the host pool by performing the following actions:
     *  - All the objects stored in the pool are flushed
     *  - The ids of the hosts in the database are loaded
     *    @return 0 on success 
     */     
     int set_up();
     
private:
    friend class Scheduler;
    
    /**
     *  Hosts ids
     */
    vector<int> hids;
    
    /**
     *  Factory method for the PoolSQL class
     *    @return a pointer to a new SchedulerHost object
     */        
    PoolObjectSQL * create()
    {
        return new SchedulerHost;
    };
    
    /**
     *  Bootstrap method from the PoolSQL interface. It just prints
     *  an error message as this class MUST not modify the DB.
     */
    void bootstrap();
};

#endif /*SCHEDULER_HOST_H_*/
