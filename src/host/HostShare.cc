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
#include <algorithm> 

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
        disk_usage(0),
        mem_usage(0),
        cpu_usage(0),
        max_disk(_max_disk),
        max_mem(_max_mem),
        max_cpu(_max_cpu),
        free_disk(0),
        free_mem(0),
        free_cpu(0),
        used_disk(0),
        used_mem(0),
        used_cpu(0),
        running_vms(0)
{
}

/* ************************************************************************** */
/* HostShare :: Database Access Functions                               */
/* ************************************************************************** */

const char * HostShare::table = "host_shares";

const char * HostShare::db_names = "(hid,"
    "disk_usage, mem_usage, cpu_usage,"
    "max_disk,   max_mem,   max_cpu,"
    "free_disk,  free_mem,  free_cpu,"
    "used_disk,  used_mem,  used_cpu,"
    "running_vms)";

const char * HostShare::db_bootstrap = "CREATE TABLE host_shares ("
	"hid INTEGER PRIMARY KEY,"
    "disk_usage INTEGER, mem_usage INTEGER, cpu_usage INTEGER,"
    "max_disk  INTEGER,  max_mem   INTEGER, max_cpu   INTEGER,"
    "free_disk INTEGER,  free_mem  INTEGER, free_cpu  INTEGER,"
    "used_disk INTEGER,  used_mem  INTEGER, used_cpu  INTEGER,"
    "running_vms INTEGER)";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostShare::unmarshall(int num, char **names, char ** values)
{
    if ((!values[HID]) ||
        (!values[DISK_USAGE]) ||
        (!values[MEM_USAGE]) ||
        (!values[CPU_USAGE]) ||
        (!values[MAX_DISK]) ||
        (!values[MAX_MEMORY]) ||
        (!values[MAX_CPU]) ||
        (!values[FREE_DISK]) ||
        (!values[FREE_MEMORY]) ||
        (!values[FREE_CPU]) ||
        (!values[USED_DISK]) ||
        (!values[USED_MEMORY]) ||
        (!values[USED_CPU]) ||
        (!values[RUNNING_VMS]) ||
        (num != LIMIT ))
    {
        return -1;
    }

    hsid = atoi(values[HID]);

    disk_usage = atoi(values[DISK_USAGE]);
    mem_usage  = atoi(values[MEM_USAGE]);
    cpu_usage  = atoi(values[CPU_USAGE]);
    
    max_disk = atoi(values[MAX_DISK]);
    max_mem  = atoi(values[MAX_MEMORY]);
    max_cpu  = atoi(values[MAX_CPU]);

    free_disk = atoi(values[FREE_DISK]);
    free_mem  = atoi(values[FREE_MEMORY]);
    free_cpu  = atoi(values[FREE_CPU]);

    used_disk = atoi(values[USED_DISK]);
    used_mem  = atoi(values[USED_MEMORY]);
    used_cpu  = atoi(values[USED_CPU]);

    running_vms = atoi(values[RUNNING_VMS]);
    
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostShare::unmarshall(ostringstream& oss,
                          int            num,
                          char **        names,
                          char **        values)
{
	if ((!values[HID]) ||
        (!values[DISK_USAGE]) ||
	    (!values[MEM_USAGE]) ||
	    (!values[CPU_USAGE]) ||
	    (!values[MAX_DISK]) ||
	    (!values[MAX_MEMORY]) ||
	    (!values[MAX_CPU]) ||
	    (!values[FREE_DISK]) ||
	    (!values[FREE_MEMORY]) ||
	    (!values[FREE_CPU]) ||
	    (!values[USED_DISK]) ||
	    (!values[USED_MEMORY]) ||
	    (!values[USED_CPU]) ||
	    (!values[RUNNING_VMS]) ||
		(num != LIMIT))
	{
		return -1;
	}
	
	oss <<
	    "<HOST_SHARE>"  <<
		    "<HID>"       << values[HID]         << "</HID>"       <<
		    "<DISK_USAGE>"<< values[DISK_USAGE]  << "</DISK_USAGE>"<<
		    "<MEM_USAGE>" << values[MEM_USAGE]   << "</MEM_USAGE>" <<
		    "<CPU_USAGE>" << values[CPU_USAGE]   << "</CPU_USAGE>" <<
		    "<MAX_DISK>"  << values[MAX_DISK]    << "</MAX_DISK>"  <<
		    "<MAX_MEM>"   << values[MAX_MEMORY]  << "</MAX_MEM>"   <<
		    "<MAX_CPU>"   << values[MAX_CPU]     << "</MAX_CPU>"   <<
		    "<FREE_DISK>" << values[FREE_DISK]   << "</FREE_DISK>" <<
		    "<FREE_MEM>"  << values[FREE_MEMORY] << "</FREE_MEM>"  <<
		    "<FREE_CPU>"  << values[FREE_CPU]    << "</FREE_CPU>"  <<
		    "<USED_DISK>" << values[USED_DISK]   << "</USED_DISK>" <<
		    "<USED_MEM>"  << values[USED_MEMORY] << "</USED_MEM>"  <<
		    "<USED_CPU>"  << values[USED_CPU]    << "</USED_CPU>"  <<
		    "<RUNNING_VMS>"<<values[RUNNING_VMS] << "</RUNNING_VMS>"<<
		"</HOST_SHARE>";
		
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

    oss << "SELECT * FROM " << table << " WHERE hid = " << hsid;

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

    oss << "INSERT OR REPLACE INTO " << table << " "<< db_names <<" VALUES ("
        << hsid << ","
        << disk_usage <<","<< mem_usage <<","<< cpu_usage<< ","
        << max_disk   <<","<< max_mem   <<","<< max_cpu  << ","
        << free_disk  <<","<< free_mem  <<","<< free_cpu << ","
        << used_disk  <<","<< used_mem  <<","<< used_cpu << ","
        << running_vms<< ")";

    rc = db->exec(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostShare::drop(SqliteDB * db)
{
    ostringstream   oss;

    oss << "DELETE FROM " << table << " WHERE hid=" << hsid;

    return db->exec(oss);
}

/* ************************************************************************** */
/* HostShare :: Misc                                                    */
/* ************************************************************************** */

ostream& operator<<(ostream& os, HostShare& hs)
{
    string str;

    os << hs.to_xml(str);
    
    return os;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& HostShare::to_xml(string& xml) const
{
    string template_xml;
    ostringstream   oss;

    oss << "<HOST_SHARE>"
          << "<HID>"        << hsid       << "</HID>"        
          << "<DISK_USAGE>" << disk_usage << "</DISK_USAGE>"
          << "<MEM_USAGE>"  << mem_usage  << "</MEM_USAGE>"
          << "<CPU_USAGE>"  << cpu_usage  << "</CPU_USAGE>"        
          << "<MAX_DISK>"   << max_disk   << "</MAX_DISK>"
          << "<MAX_MEM>"    << max_mem    << "</MAX_MEM>"
          << "<MAX_CPU>"    << max_cpu    << "</MAX_CPU>"        
          << "<FREE_DISK>"  << free_disk  << "</FREE_DISK>"
          << "<FREE_MEM>"   << free_mem   << "</FREE_MEM>"
          << "<FREE_CPU>"   << free_cpu   << "</FREE_CPU>"        
          << "<USED_DISK>"  << used_disk  << "</USED_DISK>"
          << "<USED_MEM>"   << used_mem   << "</USED_MEM>"
          << "<USED_CPU>"   << used_cpu   << "</USED_CPU>"        
          << "<RUNNING_VMS>"<<running_vms <<"</RUNNING_VMS>"
        << "</HOST_SHARE>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& HostShare::to_str(string& str) const
{
    string template_xml;
    ostringstream   oss;

    oss<< "\tHID          = " << hsid    
       << "\tCPU_USAGE    = " << cpu_usage << endl
       << "\tMEMORY_USAGE = " << mem_usage << endl
       << "\tDISK_USAGE   = " << disk_usage<< endl       
       << "\tMAX_CPU      = " << max_cpu << endl
       << "\tMAX_MEMORY   = " << max_mem << endl
       << "\tMAX_DISK     = " << max_disk<< endl
       << "\tFREE_CPU     = " << free_cpu << endl
       << "\tFREE_MEMORY  = " << free_mem << endl
       << "\tFREE_DISK    = " << free_disk<< endl
       << "\tUSED_CPU     = " << used_cpu << endl
       << "\tUSED_MEMORY  = " << used_mem << endl
       << "\tUSED_DISK    = " << used_disk<< endl
       << "\tRUNNING_VMS  = " << running_vms<< endl;

    str = oss.str();

    return str;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
