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
#include <limits.h>
#include <string.h>

#include <iostream>
#include <sstream>

#include "HostShare.h"

/* ************************************************************************** */
/* HostShare :: Constructor/Destructor                                  */
/* ************************************************************************** */

HostShare::HostShare(
        int     _hsid,
        int     _max_disk,
        int     _max_mem,
        int     _max_cpu):
        ObjectSQL(),
        hsid(_hsid),
        endpoint(""),
        disk_usage(0),
        mem_usage(0),
        cpu_usage(0),
        max_disk(_max_disk),
        max_mem(_max_mem),
        max_cpu(_max_cpu),
        running_vms(0)
{
    
}

/* ************************************************************************** */
/* HostShare :: Database Access Functions                               */
/* ************************************************************************** */

const char * HostShare::table = "hostshares";

const char * HostShare::db_names = "(hsid,endpoint,disk_usage,"
    "mem_usage,cpu_usage,max_disk,max_mem,max_cpu,running_vms)";

const char * HostShare::db_bootstrap = "CREATE TABLE hostshares ("
	"hsid INTEGER PRIMARY KEY, endpoint TEXT,"
    "disk_usage INTEGER,mem_usage INTEGER,cpu_usage INTEGER,"
    "max_disk INTEGER,max_mem INTEGER,max_cpu INTEGER,running_vms INTEGER)";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostShare::unmarshall(int num, char **names, char ** values)
{
    if ((values[HSID] == 0) ||
        (values[ENDPOINT] == 0) ||
        (values[DISK_USAGE] == 0) ||
        (values[MEM_USAGE] == 0) ||
        (values[CPU_USAGE] == 0) ||
        (values[MAX_DISK] == 0) ||
        (values[MAX_MEMORY] == 0) ||
        (values[MAX_CPU] == 0) ||
        (values[RUNNING_VMS] == 0) ||
        (num != LIMIT ))
    {
        return -1;
    }

    hsid       = atoi(values[HSID]);
    endpoint   = values[ENDPOINT];
    disk_usage = atoi(values[DISK_USAGE]);
    mem_usage  = atoi(values[MEM_USAGE]);
    cpu_usage  = atoi(values[CPU_USAGE]);
	max_disk   = atoi(values[MAX_DISK]);
    max_mem    = atoi(values[MAX_MEMORY]);
    max_cpu    = atoi(values[MAX_CPU]);
    running_vms= atoi(values[RUNNING_VMS]);
    
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" int host_share_select_cb (
        void *                  _hs,
        int                     num,
        char **                 values,
        char **                 names)
{
    HostShare *    hs;

    hs = static_cast<HostShare *>(_hs);

    if (hs == 0)
    {
        return -1;
    }

    return hs->unmarshall(num,names,values);
};

/* -------------------------------------------------------------------------- */

int HostShare::select(SqliteDB * db)
{
    ostringstream   oss;
    int             rc;
    int             bhsid;

    oss << "SELECT * FROM " << table << " WHERE hsid = " << hsid;

    bhsid = hsid;
    hsid  = -1;

    rc = db->exec(oss,host_share_select_cb,(void *) this);

    if (hsid != bhsid )
    {
        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostShare::insert(SqliteDB * db)
{
    int rc;

    //Insert the HostShare
    rc = update(db);

    if ( rc != 0 )
    {
        return rc;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostShare::update(SqliteDB * db)
{
    ostringstream   oss;
    int             rc;
        		
    oss << "INSERT OR REPLACE INTO " << table << " "<< db_names <<" VALUES ("<<
        hsid << "," <<
        "'" << endpoint << "'," <<
        disk_usage << "," <<
        mem_usage << "," <<
        cpu_usage << "," <<
        max_disk << "," <<
        max_mem << "," <<
        max_cpu << "," <<
        running_vms << ")";

    rc = db->exec(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostShare::drop(SqliteDB * db)
{
    ostringstream   oss;

    // Drop the HostShare itself
    oss << "DELETE FROM " << table << " WHERE hsid=" << hsid;

    return db->exec(oss);
}

/* ************************************************************************** */
/* HostShare :: Misc                                                    */
/* ************************************************************************** */

ostream& operator<<(ostream& os, HostShare& hs)
{
	os << "\tHSID         = " << hs.hsid    << endl;
	os << "\tENDPOINT     = " << hs.endpoint<< endl;
	
    os << "\tMAX_CPU      = " << hs.max_cpu << endl;
    os << "\tMAX_MEMORY   = " << hs.max_mem << endl;
    os << "\tMAX_DISK     = " << hs.max_disk<< endl;

    os << "\tCPU_USAGE    = " << hs.cpu_usage << endl;
    os << "\tMEMORY_USAGE = " << hs.mem_usage << endl;
    os << "\tDISK_USAGE   = " << hs.disk_usage<< endl;
    
    os << "\tRUNNING_VMS  = " << hs.running_vms<< endl;
    
    return os;
};
