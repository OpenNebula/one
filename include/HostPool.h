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

#ifndef HOST_POOL_H_
#define HOST_POOL_H_

#include "PoolSQL.h"
#include "Host.h"
#include "CachePool.h"

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
    HostPool(SqlDB * db, vector<const VectorAttribute *> hook_mads,
        const string& hook_location, const string& remotes_location,
        time_t expire_time);

    ~HostPool(){};

    /**
     *  Function to allocate a new Host object
     *    @param oid the id assigned to the Host
     *    @return the oid assigned to the object or -1 in case of failure
     */
    int allocate (
        int *  oid,
        const string& hostname,
        const string& im_mad_name,
        const string& vmm_mad_name,
        int           cluster_id,
        const string& cluster_name,
        string& error_str);

    /**
     *  Function to get a Host from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid Host unique id
     *    @param lock locks the Host mutex
     *    @return a pointer to the Host, 0 if the Host could not be loaded
     */
    Host * get(
        int     oid)
    {
        Host * h = static_cast<Host *>(PoolSQL::get(oid));

        if ( h != 0 )
        {
            HostVM * hv = get_host_vm(oid);

            h->tmp_lost_vms   = &(hv->tmp_lost_vms);
            h->tmp_zombie_vms = &(hv->tmp_zombie_vms);

            h->prev_rediscovered_vms = &(hv->prev_rediscovered_vms);
        }

        return h;
    };

    void update_prev_rediscovered_vms(int hoid,
        const set<int>& prev_rediscovered_vms)
    {

        if (hoid < 0)
        {
            return;
        }

        HostVM * hv = get_host_vm(hoid);

        hv->prev_rediscovered_vms = prev_rediscovered_vms;
    }

    /**
     *  Function to get a read only Host from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid Host unique id
     *    @return a pointer to the Host, 0 if the Host could not be loaded
     */
    Host * get_ro(
        int     oid)
    {
        Host * h = static_cast<Host *>(PoolSQL::get_ro(oid));

        if ( h != 0 )
        {
            HostVM * hv = get_host_vm(oid);

            h->tmp_lost_vms   = &(hv->tmp_lost_vms);
            h->tmp_zombie_vms = &(hv->tmp_zombie_vms);

            h->prev_rediscovered_vms = &(hv->prev_rediscovered_vms);
        }

        return h;
    };

    /**
     *  Function to get a Host from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param hostname
     *    @param lock locks the Host mutex
     *    @return a pointer to the Host, 0 if the Host could not be loaded
     */
    Host * get(string name)
    {
        // The owner is set to -1, because it is not used in the key() method
        Host * h = static_cast<Host *>(PoolSQL::get(name,-1));

        if ( h != 0 )
        {
            HostVM * hv = get_host_vm(h->oid);

            h->tmp_lost_vms   = &(hv->tmp_lost_vms);
            h->tmp_zombie_vms = &(hv->tmp_zombie_vms);

            h->prev_rediscovered_vms = &(hv->prev_rediscovered_vms);
        }

        return h;
    };

    /**
     *  Function to get a Host from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param hostname
     *    @param lock locks the Host mutex
     *    @return a pointer to the Host, 0 if the Host could not be loaded
     */
    Host * get_ro(string name)
    {
        // The owner is set to -1, because it is not used in the key() method
        Host * h = static_cast<Host *>(PoolSQL::get_ro(name,-1));

        if ( h != 0 )
        {
            HostVM * hv = get_host_vm(h->oid);

            h->tmp_lost_vms   = &(hv->tmp_lost_vms);
            h->tmp_zombie_vms = &(hv->tmp_zombie_vms);

            h->prev_rediscovered_vms = &(hv->prev_rediscovered_vms);
        }

        return h;
    };

    /**
     *  Generate an index key for the object
     *    @param name of the object
     *    @param uid owner of the object, only used if needed
     *
     *    @return the key, a string
     */
    string key(const string& name, int uid)
    {
        // Name is enough key because Hosts can't repeat names.
        return name;
    };

    /**
     *  Bootstraps the database table(s) associated to the Host pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB *_db)
    {
        return Host::bootstrap(_db);
    };

    /**
     * Get the least monitored hosts
     *   @param discovered hosts
     *   @param host_limit max. number of hosts to monitor at a time
     *   @param target_time Filters hosts with last_mon_time <= target_time
     *   @return int 0 if success
     */
    int discover(set<int> * discovered_hosts, int host_limit, time_t target_time);

    /**
     * Allocates a given capacity to the host
     *   @param oid the id of the host to allocate the capacity
     *   @param vm_id id of the vm to add to the host
     *   @param cpu amount of CPU, in percentage
     *   @param mem amount of main memory, in KB
     *   @param disk amount of disk
     *   @param pci devices requested by the VM
     *
     *   @return 0 on success -1 in case of failure
     */
    int add_capacity(int oid, int vm_id, int cpu, int mem, int disk,
            vector<VectorAttribute *> pci)
    {
        int rc = 0;
        Host * host = get(oid);

        if ( host != 0 )
        {
          host->add_capacity(vm_id, cpu, mem, disk, pci);

          update(host);

          host->unlock();
        }
        else
        {
            rc = -1;
        }

        return rc;
    };

    /**
     * De-Allocates a given capacity to the host
     *   @param oid the id of the host to allocate the capacity
     *   @param vm_id id of the vm to add to the host
     *   @param cpu amount of CPU
     *   @param mem amount of main memory
     *   @param disk amount of disk
     *   @param pci devices requested by the VM
     */
    void del_capacity(int oid, int vm_id, int cpu, int mem, int disk,
            vector<VectorAttribute *> pci)
    {
        Host *  host = get(oid);

        if ( host != 0 )
        {
            host->del_capacity(vm_id, cpu, mem, disk, pci);

            update(host);

            host->unlock();
        }
    };

    int drop(PoolObjectSQL * objsql, string& error_msg)
    {
        Host * host = static_cast<Host *>(objsql);
        int oid = host->oid;

        if ( host->get_share_running_vms() > 0 )
        {
            error_msg = "Can not remove a host with running VMs";
            return -1;
        }

        int rc = PoolSQL::drop(objsql, error_msg);

        if ( rc == 0 )
        {
            delete_host_vm(oid);
        }

        return rc;
    };

    /**
     *  Dumps the HOST pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param limit parameters used for pagination
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(string& oss, const string& where, const string& limit,
        bool desc)
    {
        return PoolSQL::dump(oss, "HOST_POOL", "body", Host::table, where, limit, desc);
    };

    /**
     *  Finds a set objects that satisfies a given condition
     *   @param oids a vector with the oids of the objects.
     *   @param the name of the DB table.
     *   @param where condition in SQL format.
     *
     *   @return 0 on success
     */
    int search(vector<int>& oids, const string& where)
    {
        return PoolSQL::search(oids, Host::table, where);
    };

    /**
     *  Dumps the host monitoring information entries in XML format. A filter
     *  can be also added to the query.
     *
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *
     *  @return 0 on success
     */
    int dump_monitoring(string& oss, const string&  where);

    /**
     *  Dumps the HOST monitoring information for a single HOST
     *
     *  @param oss the output stream to dump the pool contents
     *  @param hostid id of the target HOST
     *
     *  @return 0 on success
     */
    int dump_monitoring(string& oss, int hostid)
    {
        ostringstream filter;

        filter << "oid = " << hostid;

        return dump_monitoring(oss, filter.str());
    }

    /**
     * Inserts the last monitoring, and deletes old monitoring entries for this
     * host
     *
     * @param host pointer to the host object
     * @return 0 on success
     */
    int update_monitoring(Host * host)
    {
        if ( _monitor_expiration <= 0 )
        {
            return 0;
        }

        return host->update_monitoring(db);
    };

    /**
     * Deletes the expired monitoring entries for all hosts
     *
     * @return 0 on success
     */
    int clean_expired_monitoring();

private:
    /**
     * Stores several Host counters to give VMs one monitor grace cycle before
     * moving them to another state
     */
    struct HostVM
    {
        /**
         * Tmp set of lost VM IDs. 
         */
        set<int> tmp_lost_vms;

        /**
         * Tmp set of zombie VM IDs. 
         */
        set<int> tmp_zombie_vms;

        /**
         * VMs reported as found from the poweroff state.
         */
        set<int> prev_rediscovered_vms;
    };

    CachePool<HostVM> cache;

    HostVM * get_host_vm(int oid)
    {
        return cache.get_resource(oid);
    }

    void delete_host_vm(int oid)
    {
        cache.delete_resource(oid);
    }

    /**
     *  Factory method to produce Host objects
     *    @return a pointer to the new Host
     */
    PoolObjectSQL * create()
    {
        return new Host(-1,"","","",-1,"");
    };

    /**
     *  Callback function to get the IDs of the hosts to be monitored
     *  (Host::discover)
     *
     *    @param _set the set<int>* of host ids
     *    @param num the number of columns read from the DB
     *    @param values the column values
     *    @param names the column names
     *
     *    @return 0 on success
     */
    int discover_cb(void * _set, int num, char **values, char **names);

    /**
     * Deletes all monitoring entries for all hosts
     *
     * @return 0 on success
     */
    int clean_all_monitoring();

    /**
     * Size, in seconds, of the historical monitoring information
     */
    static time_t _monitor_expiration;
};

#endif /*HOST_POOL_H_*/
