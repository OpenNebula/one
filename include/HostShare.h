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

#ifndef HOST_SHARE_H_
#define HOST_SHARE_H_

#include "SqliteDB.h"
#include "ObjectSQL.h"
#include <time.h>

using namespace std;

extern "C" int host_share_select_cb (void * _host_share, int num,char ** values, char ** names);

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The HostShare class. It represents a logical partition of a host...
 */
class HostShare : public ObjectSQL 
{
public:

    HostShare(
        int     _hsid=-1,
        int     _max_disk=0,
        int     _max_mem=0,
        int     _max_cpu=0);

    ~HostShare(){};

    /**
     * Gets the HostShare identifier
     *    @return HSID HostShare identifier
     */
    int get_hsid() const
    {
        return hsid;
    };

    /**
     *  Add a new VM to this share
     *    @param cpu requested by the VM
     *    @param mem requested by the VM
     *    @param disk requested by the VM
     */
    void add(int cpu, int mem, int disk)
    {
        cpu_usage  += cpu;
        mem_usage  += mem;
        disk_usage += disk;
        
        running_vms++;    
    }

    /**
     *  Delete a VM from this share
     *    @param cpu requested by the VM
     *    @param mem requested by the VM
     *    @param disk requested by the VM
     */
    void del(int cpu, int mem, int disk)
    {
        cpu_usage  -= cpu;
        mem_usage  -= mem;
        disk_usage -= disk;
        
        running_vms--;    
    }
    
    /**
     *  Check if this share can host a VM. 
     *    @param cpu requested by the VM
     *    @param mem requested by the VM
     *    @param disk requested by the VM
     * 
     *    @return true if the share can host the VM or it is the only one 
     *    configured
     */
    bool test(int cpu, int mem, int disk) const
    {
            return (((max_cpu  - cpu_usage ) >= cpu) &&
                    ((max_mem  - mem_usage ) >= mem) &&
                    ((max_disk - disk_usage) >= disk));
    }    
    
    /**
     *  Function to write a HostShare to an output stream
     */
    friend ostream& operator<<(ostream& os, HostShare& hs);

private:	
    /**
     *  HostShare identifier
     */
    int         hsid;

    /**
     *  HostShare's Endpoint
     */
    string      endpoint;

    /**
     *  HostShare disk usage (in Kb)
     */
    int         disk_usage;

    /**
     *  HostShare memory usage (in Kb)
     */
    int         mem_usage;

    /**
     *  HostShare cpu usage (in percentage)
     */
    int         cpu_usage;

    /**
     *  HostShare disk share (in GB), 0 means that the share will use all the
     *  avialable disk in the host
     */
	int         max_disk;

    /**
     *  HostShare memory share (in MB), 0 means that the share will use all the
     *  avialable disk in the host
     */
    int         max_mem;

    /**
     *  HostShare cpu usage (in percentage), 0 means that the share will use all 
     *  the avialable disk in the host
     */
    int         max_cpu;

    /**
     *  Number of running Virtual Machines in this HostShare
     */
    int         running_vms;
	
    // ----------------------------------------
    // Friends
    // ----------------------------------------

    friend class Host;
        
    friend int host_share_select_cb (
        void *  _hostshare, 
        int     num, 
        char ** values, 
        char ** names);
    
    // ----------------------------------------
    // DataBase implementation variables
    // ----------------------------------------

    enum ColNames
    {
        HSID         = 0,
        ENDPOINT     = 1,
        DISK_USAGE   = 2,
        MEM_USAGE    = 3,
        CPU_USAGE    = 4,
        MAX_DISK     = 5,
        MAX_MEMORY   = 6,
        MAX_CPU      = 7,
        RUNNING_VMS  = 8,
		LIMIT        = 9
	};

    static const char * table;
    
    static const char * db_names;

    static const char * db_bootstrap;

    // ----------------------------------------
    // Database methods
    // ----------------------------------------
    
    /**
     *  Reads the HostShare (identified with its HSID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqliteDB * db);

    /**
     *  Writes the HostShare in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqliteDB * db);

    /**
     *  Writes/updates the HostShare data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqliteDB * db);
    
    /**
     *  Drops hostshare from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqliteDB * db);
        
    /**
     *  Function to unmarshall a HostShare object
     *    @param num the number of columns read from the DB
     *    @para names the column names
     *    @para vaues the column values
     *    @return 0 on success
     */
    int unmarshall(int num, char **names, char ** values);    
};


#endif /*HOST_SHARE_H_*/
