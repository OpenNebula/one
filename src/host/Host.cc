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

#include "Host.h"
extern "C"
{
#include "host_parser.h"
}

/* ************************************************************************** */
/* Host :: Constructor/Destructor                                  */
/* ************************************************************************** */

Host::Host(
    int     id,
    string _hostname,
    string _im_mad_name,
    string _vmm_mad_name,
    string _tm_mad_name,
    bool    _managed):
        PoolObjectSQL(id),
        hostname(_hostname),
        state(INIT),
        im_mad_name(_im_mad_name),
        vmm_mad_name(_vmm_mad_name),
        tm_mad_name(_tm_mad_name),
        last_monitored(time(0)),
        managed(_managed),
        host_template(id),
        host_share(id){};


Host::~Host(){};

/* ************************************************************************** */
/* Host :: Database Access Functions                               */
/* ************************************************************************** */

const char * Host::table = "host_pool";

const char * Host::db_names = "(oid,host_name,state,im_mad,vm_mad,"
                              "tm_mad,last_mon_time,managed)";

const char * Host::db_bootstrap = "CREATE TABLE host_pool ("
	"oid INTEGER PRIMARY KEY,host_name TEXT,state INTEGER,"
	"im_mad TEXT,vm_mad TEXT,tm_mad TEXT,last_mon_time INTEGER,"
    "managed INTEGER)";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Host::unmarshall(int num, char **names, char ** values)
{
    if ((values[OID] == 0) ||
            (values[HOST_NAME] == 0) ||
            (values[STATE] == 0) ||
            (values[IM_MAD] == 0) ||
            (values[VM_MAD] == 0) ||
            (values[TM_MAD] == 0) ||
            (values[LAST_MON_TIME] == 0) ||
            (values[MANAGED] == 0) ||
            (num != LIMIT ))
    {
        return -1;
    }

    oid              = atoi(values[OID]);
    hostname         = values[HOST_NAME];
    state            = static_cast<HostState>(atoi(values[STATE]));
    
    im_mad_name      = values[IM_MAD];
    vmm_mad_name     = values[VM_MAD];
    tm_mad_name      = values[TM_MAD];
    
    last_monitored   = static_cast<time_t>(atoi(values[LAST_MON_TIME]));
    
    managed          = atoi(values[MANAGED]) == 1?true:false;
    
    host_template.id = oid;
    host_share.hsid  = oid;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" int host_select_cb (
        void *                  _host,
        int                     num,
        char **                 values,
        char **                 names)
{
    Host *    host;

    host = static_cast<Host *>(_host);

    if (host == 0)
    {
        return -1;
    }

    return host->unmarshall(num,names,values);
};

/* -------------------------------------------------------------------------- */

int Host::select(SqliteDB *db)
{
    ostringstream   oss;
    int             rc;
    int             boid;
    
    oss << "SELECT * FROM " << table << " WHERE oid = " << oid;

    boid = oid;
    oid  = -1;

    rc = db->exec(oss, host_select_cb, (void *) this);

    if ((rc != 0) || (oid != boid ))
    {
        return -1;
    }

    // Get the template

    rc = host_template.select(db);

    if ( rc != 0 )
    {
        return -1;
    }

    // Select the host shares from the DB

    rc = host_share.select(db);

    if ( rc != 0 )
    {
    	return rc;
	}

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Host::insert(SqliteDB *db)
{
    int rc;
    map<int,HostShare *>::iterator iter;

    // Set up the template ID, to insert it

    if ( host_template.id == -1 )
    {
        host_template.id = oid;
    }

    // Set up the share ID, to insert it

    if ( host_share.hsid == -1 )
    {
    	host_share.hsid = oid;
    }
    
    //Insert the Host and its template
    rc = update(db);

    if ( rc != 0 )
    {
        return rc;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Host::update(SqliteDB *db)
{
    ostringstream   oss;
    int             rc;

    int             managed_i = managed?1:0;

    //Update template.

    rc = host_template.update(db);

    if ( rc != 0 )
    {
        return rc;
    }

    // Let's get the HostShares before the host

    rc = host_share.update(db);

    if ( rc != 0 )
    {
        return rc;
    }

    // Construct the SQL statement to Insert or Replace (effectively, update)

    oss << "INSERT OR REPLACE INTO " << table << " "<< db_names <<" VALUES ("<<
    oid << "," <<
    "'" << hostname << "'," <<
    state << "," <<
    "'" << im_mad_name << "'," <<
    "'" << vmm_mad_name << "'," <<
    "'" << tm_mad_name << "'," <<
    last_monitored << "," <<
    managed_i << ")";

    rc = db->exec(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Host::drop(SqliteDB * db)
{
    ostringstream   oss;
    
    map<int,HostShare *>::iterator iter;

    // First, drop the template
    host_template.drop(db);

    // Second, drop the host_shares
    host_share.drop(db);

    // Third, drop the host itself
    oss << "DELETE FROM " << table << " WHERE oid=" << oid;

    return db->exec(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Host::update_info(string &parse_str)
{
    char *  error_msg;
    int     rc;
    
    // If we have a default

    rc = host_template.parse(parse_str, &error_msg);
    
    if ( rc != 0 )
    {
        /*
        Nebula::log("ONE", Log::ERROR, error_msg);
        */
        free(error_msg);
        return -1;
    }
    
    get_template_attribute("TOTALCPU",host_share.max_cpu);
    get_template_attribute("TOTALMEMORY",host_share.max_mem);
    
    return 0;
}

/* ************************************************************************** */
/* Host :: Misc                                                               */
/* ************************************************************************** */

ostream& operator<<(ostream& os, Host& host)
{
    os << "HID      = "  << host.oid          << endl;
    os << "HOSTNAME = "  << host.hostname     << endl;
    os << "IM MAD   = "  << host.im_mad_name  << endl;
    os << "VMM MAD  = "  << host.vmm_mad_name << endl;
    os << "TM MAD   = "  << host.tm_mad_name  << endl;
    os << "MANAGED  = "  << host.managed      << endl;
    os << "ATTRIBUTES"   << endl << host.host_template<< endl;
    os << "HOST SHARES"  << endl << host.host_share <<endl;

    return os;
};

/* ************************************************************************** */
/* Host :: Parse functions to compute rank and evaluate requirements          */
/* ************************************************************************** */

pthread_mutex_t Host::lex_mutex = PTHREAD_MUTEX_INITIALIZER;

extern "C"
{
    int host_requirements_parse(Host * host, bool& result, char ** errmsg);

    int host_rank_parse(Host * host, int& result, char ** errmsg);

    int host_lex_destroy();

    YY_BUFFER_STATE host__scan_string(const char * str);

    void host__delete_buffer(YY_BUFFER_STATE);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Host::match(const string& requirements, bool& result, char **errmsg)
{
    YY_BUFFER_STATE     str_buffer;
    const char *        str;
    int                 rc;

    pthread_mutex_lock(&lex_mutex);

    *errmsg = 0;

    str = requirements.c_str();

    str_buffer = host__scan_string(str);

    if (str_buffer == 0)
    {
        goto error_yy;
    }

    rc = host_requirements_parse(this,result,errmsg);

    host__delete_buffer(str_buffer);

    host_lex_destroy();

    pthread_mutex_unlock(&lex_mutex);

    return rc;

error_yy:

    *errmsg=strdup("Error setting scan buffer");

    pthread_mutex_unlock(&lex_mutex);

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Host::rank(const string& rank, int& result, char **errmsg)
{
    YY_BUFFER_STATE     str_buffer;
    const char *        str;
    int                 rc;

    pthread_mutex_lock(&lex_mutex);

    *errmsg = 0;

    str = rank.c_str();

    str_buffer = host__scan_string(str);

    if (str_buffer == 0)
    {
        goto error_yy;
    }

    rc = host_rank_parse(this,result,errmsg);

    host__delete_buffer(str_buffer);

    host_lex_destroy();

    pthread_mutex_unlock(&lex_mutex);

    return rc;

error_yy:

    *errmsg=strdup("Error setting scan buffer");

    pthread_mutex_unlock(&lex_mutex);

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
