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
 *  The Host Pool class.
 */
class HostPool : public PoolSQL
{
public:

	HostPool(SqlDB * db):PoolSQL(db,Host::table){};

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
        string tm_mad_name);

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


    /** Drops a host from the DB, the host mutex MUST BE locked
     *    @param host pointer to Host
     */
    int drop(Host * host)
    {
    	return host->drop(db);
    };

    /**
     *  Bootstraps the database table(s) associated to the Host pool
     */
    static void bootstrap(SqlDB *_db)
    {
        Host::bootstrap(_db);
    };

    /**
     * Get the 10 least monitored hosts
     *   @param discovered hosts, map to store the retrieved hosts hids and
     *   hostnames
     *   @return int 0 if success
     */
    int discover(map<int, string> * discovered_hosts);

    /**
     * Allocates a given capacity to the host
     *   @param oid the id of the host to allocate the capacity
     *   @param cpu amount of CPU
     *   @param mem amount of main memory
     *   @param disk amount of disk
     */
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

    /**
     * De-Allocates a given capacity to the host
     *   @param oid the id of the host to allocate the capacity
     *   @param cpu amount of CPU
     *   @param mem amount of main memory
     *   @param disk amount of disk
     */
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

    /**
     *  Dumps the HOST pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where);

private:
    /**
     *  Factory method to produce Host objects
     *    @return a pointer to the new Host
     */
    PoolObjectSQL * create()
    {
        return new Host;
    };

    /**
     *  Callback function to get the IDs of the hosts to be monitored
     *  (Host::discover)
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int discover_cb(void * _map, int num, char **values, char **names);

    /**
     *  Callback function to get output the host pool in XML format
     *  (Host::dump)
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int dump_cb(void * _oss, int num, char **values, char **names);
};

#endif /*HOST_POOL_H_*/