/* ------------------------------------------------------------------------ */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)           */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* ------------------------------------------------------------------------ */

#ifndef HOST_SHARE_H_
#define HOST_SHARE_H_

#include "SqlDB.h"
#include "ObjectSQL.h"
#include <time.h>

using namespace std;

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

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

    /**
     * Function to print the HostShare object into a string in
     * plain text
     *  @param str the resulting string
     *  @return a reference to the generated string
     */
    string& to_str(string& str) const;

    /**
     * Function to print the HostShare object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

private:

    int hsid; /**< HostShare identifier */

    int disk_usage; /**< Disk allocated to VMs (in Mb).        */
    int mem_usage;  /**< Memory allocated to VMs (in Mb)       */
    int cpu_usage;  /**< CPU  allocated to VMs (in percentage) */

    int max_disk;   /**< Total disk capacity (in Mb)           */
    int max_mem;    /**< Total memory capacity (in Mb)         */
    int max_cpu;    /**< Total cpu capacity (in percentage)    */

    int free_disk;  /**< Free disk from the IM monitor         */
    int free_mem;   /**< Free memory from the IM monitor       */
    int free_cpu;   /**< Free cpu from the IM monitor          */

    int used_disk;  /**< Used disk from the IM monitor         */
    int used_mem;   /**< Used memory from the IM monitor       */
    int used_cpu;   /**< Used cpu from the IM monitor          */

    int running_vms; /**< Number of running VMs in this Host   */

    // ----------------------------------------
    // Friends
    // ----------------------------------------

    friend class Host;
    friend class HostPool;

    // ----------------------------------------
    // DataBase implementation variables
    // ----------------------------------------

    enum ColNames
    {
        HID         = 0,
        DISK_USAGE  = 1,
        MEM_USAGE   = 2,
        CPU_USAGE   = 3,
        MAX_DISK    = 4,
        MAX_MEMORY  = 5,
        MAX_CPU     = 6,
        FREE_DISK   = 7,
        FREE_MEMORY = 8,
        FREE_CPU    = 9,
        USED_DISK   = 10,
        USED_MEMORY = 11,
        USED_CPU    = 12,
        RUNNING_VMS = 13,
        LIMIT       = 14
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
    int select(SqlDB * db);

    /**
     *  Writes the HostShare in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB * db, string& error_str);

    /**
     *  Writes/updates the HostShare data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB * db);

    /**
     *  Drops hostshare from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB * db);

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @return 0 one success
    */
    int insert_replace(SqlDB *db, bool replace);

    /**
     *  Callback function to unmarshall a HostShare object (HostShare::select)
     *    @param num the number of columns read from the DB
     *    @para names the column names
     *    @para vaues the column values
     *    @return 0 on success
     */
    int select_cb(void * nil, int num, char **values, char **names);

    /**
     *  Function to unmarshall a HostShare object in to an output stream in XML
     *    @param oss the output stream
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    static int dump(ostringstream& oss, int num, char **values, char **names);

};


#endif /*HOST_SHARE_H_*/
