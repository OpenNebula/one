/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
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

#ifndef HOST_POOL_H_
#define HOST_POOL_H_

#include "PoolSQL.h"
#include "Host.h"

#include <time.h>
#include <sstream>

#include <iostream>

#include <vector>

using namespace std;

/**
 *  The Host Pool class. ...
 */
class HostPool : public PoolSQL
{
public:

	HostPool(SqliteDB * db):PoolSQL(db,Host::table){};

    ~HostPool(){};

    /**
     *  Function to allocate a new Host object
     *    @param oid the id assigned to the Host
     *    @return 0 on success
     */
    int allocate (
        int *  oid,
        string hostname,
        string im_mad_name, 
        string vmm_mad_name, 
        string tm_mad_name,
        bool   managed = true);        

    /**
     *  Function to get a Host from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid Host unique id
     *    @param lock locks the Host mutex
     *    @return a pointer to the Host, 0 if the Host could not be loaded
     */
    Host * get(
        int     oid,
        bool    lock)
    {
        return static_cast<Host *>(PoolSQL::get(oid,lock));
    };
    
    /** Update a particular Host 
     *    @param host pointer to Host
     *    @return 0 on success
     */
    int update(Host * host)
    {
		return host->update(db);
    };
    
    
    /** Drops a host from the cache & DB, the host mutex MUST BE locked
     *    @param host pointer to Host
     */
    int drop(Host * host)
    {
    	int rc = host->drop(db);
    	
    	if ( rc == 0)
    	{
    		remove(static_cast<PoolObjectSQL *>(host));	
    	}
        
        return rc;
    };

    /**
     *  Bootstraps the database table(s) associated to the Host pool
     */
    void bootstrap()
    {
        Host::bootstrap(db);
    };
    
    /**
     * Get the 10 least monitored hosts
     * param discovered hosts map to store the retrieved hosts hids and hostnames are 
     * return int 0 if success
     */
    int discover(map<int, string> * discovered_hosts);

    void add_capacity(int oid,int cpu, int mem, int disk)
    {
    	Host *  host = get(oid, true);
    	        
    	if ( host != 0 )
    	{
    		host->add_capacity(cpu, mem, disk);
    	        
    	    update(host);
    	        
    	    host->unlock();
    	}
    };
    
    void del_capacity(int oid,int cpu, int mem, int disk)
    {
    	Host *  host = get(oid, true);
    	        
    	if ( host != 0 )
    	{
    		host->del_capacity(cpu, mem, disk);
    	        
    	    update(host);
    	        
    	    host->unlock();
    	}    	
    };
    
private:
    /**
     *  Factory method to produce Host objects
     *    @return a pointer to the new Host
     */
    PoolObjectSQL * create()
    {
        return new Host;
    };

};

#endif /*HOST_POOL_H_*/
