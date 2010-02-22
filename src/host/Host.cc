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

#include "Host.h"

/* ************************************************************************** */
/* Host :: Constructor/Destructor                                  */
/* ************************************************************************** */

Host::Host(
    int     id,
    string _hostname,
    string _im_mad_name,
    string _vmm_mad_name,
    string _tm_mad_name):
        PoolObjectSQL(id),
        hostname(_hostname),
        state(INIT),
        im_mad_name(_im_mad_name),
        vmm_mad_name(_vmm_mad_name),
        tm_mad_name(_tm_mad_name),
        last_monitored(time(0)),
        host_template(id)
        {};


Host::~Host(){};

/* ************************************************************************** */
/* Host :: Database Access Functions                               */
/* ************************************************************************** */

const char * Host::table = "host_pool";

const char * Host::db_names = "(oid,host_name,state,im_mad,vm_mad,"
                              "tm_mad,last_mon_time)";

const char * Host::db_bootstrap = "CREATE TABLE host_pool ("
	"oid INTEGER PRIMARY KEY,host_name TEXT,state INTEGER,"
	"im_mad TEXT,vm_mad TEXT,tm_mad TEXT,last_mon_time INTEGER)";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Host::unmarshall(int num, char **names, char ** values)
{
    if ((!values[OID]) ||
        (!values[HOST_NAME]) ||
        (!values[STATE]) ||
        (!values[IM_MAD]) ||
        (!values[VM_MAD]) ||
        (!values[TM_MAD]) ||
        (!values[LAST_MON_TIME]) ||
        (num != LIMIT ))
    {
        return -1;
    }

    oid      = atoi(values[OID]);
    hostname = values[HOST_NAME];
    state    = static_cast<HostState>(atoi(values[STATE]));
    
    im_mad_name  = values[IM_MAD];
    vmm_mad_name = values[VM_MAD];
    tm_mad_name  = values[TM_MAD];
    
    last_monitored = static_cast<time_t>(atoi(values[LAST_MON_TIME]));

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
    
    int    rc;

    char * sql_hostname;
    char * sql_im_mad_name;
    char * sql_tm_mad_name;
    char * sql_vmm_mad_name;
    
    // Update the Template

    rc = host_template.update(db);

    if ( rc != 0 )
    {
        return rc;
    }

    // Update the HostShare

    rc = host_share.update(db);

    if ( rc != 0 )
    {
        return rc;
    }

    // Update the Host
    
    sql_hostname = sqlite3_mprintf("%q",hostname.c_str());

    if ( sql_hostname == 0 )
    {
        goto error_hostname;
    }
    
    sql_im_mad_name = sqlite3_mprintf("%q",im_mad_name.c_str());

    if ( sql_im_mad_name == 0 )
    {
        goto error_im;
    }
   
    sql_tm_mad_name = sqlite3_mprintf("%q",tm_mad_name.c_str());

    if ( sql_tm_mad_name == 0 )
    {
        goto error_tm;
    }

    sql_vmm_mad_name = sqlite3_mprintf("%q",vmm_mad_name.c_str());

    if ( sql_vmm_mad_name == 0 )
    {
        goto error_vmm;
    }
    
    // Construct the SQL statement to Insert or Replace (effectively, update)

    oss << "INSERT OR REPLACE INTO " << table << " "<< db_names <<" VALUES ("
        << oid << ","
        << "'" << sql_hostname << "',"
        << state << ","
        << "'" << sql_im_mad_name << "',"
        << "'" << sql_vmm_mad_name << "',"
        << "'" << sql_tm_mad_name << "',"
        << last_monitored << ")";

    rc = db->exec(oss);

    sqlite3_free(sql_hostname);
    sqlite3_free(sql_im_mad_name);
    sqlite3_free(sql_tm_mad_name);
    sqlite3_free(sql_vmm_mad_name);

    return rc;
    
error_vmm:
    sqlite3_free(sql_tm_mad_name);
error_tm:
    sqlite3_free(sql_im_mad_name);
error_im:
    sqlite3_free(sql_hostname);
error_hostname:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Host::unmarshall(ostringstream& oss,
                     int            num,
                     char **        names,
                     char **        values)
{
    if ((!values[OID]) ||
        (!values[HOST_NAME]) ||
        (!values[STATE]) ||
        (!values[IM_MAD]) ||
        (!values[VM_MAD]) ||
        (!values[TM_MAD]) ||
        (!values[LAST_MON_TIME]) ||
        (num != LIMIT + HostShare::LIMIT ))
    {
        return -1;
    }

    oss <<
        "<HOST>" <<
            "<ID>"           << values[OID]          <<"</ID>"           <<
 		    "<NAME>"         << values[HOST_NAME]    <<"</NAME>"         <<
		    "<STATE>"        << values[STATE]        <<"</STATE>"        <<
		    "<IM_MAD>"       << values[IM_MAD]       <<"</IM_MAD>"       <<
		    "<VM_MAD>"       << values[VM_MAD]       <<"</VM_MAD>"       <<
		    "<TM_MAD>"       << values[TM_MAD]       <<"</TM_MAD>"       <<
			"<LAST_MON_TIME>"<< values[LAST_MON_TIME]<<"</LAST_MON_TIME>";
			
	HostShare::unmarshall(oss,num - LIMIT, names + LIMIT, values + LIMIT);
	
    oss << "</HOST>";

    return 0;

}

/* -------------------------------------------------------------------------- */

extern "C" int host_dump_cb (
        void *                  _oss,
        int                     num,
        char **                 values,
        char **                 names)
{
    ostringstream * oss;

    oss = static_cast<ostringstream *>(_oss);

    if (oss == 0)
    {
        return -1;
    }

    return Host::unmarshall(*oss,num,names,values);
};

/* -------------------------------------------------------------------------- */

int Host::dump(SqliteDB * db, ostringstream& oss, const string& where)
{
    int             rc;
    ostringstream   cmd;

    cmd << "SELECT * FROM " << Host::table << "," << HostShare::table
        << " ON " << Host::table << ".oid = " << HostShare::table << ".hid";

    if ( !where.empty() )
    {
        cmd << " WHERE " << where;
    }

    rc = db->exec(cmd,host_dump_cb,(void *) &oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Host::drop(SqliteDB * db)
{
    ostringstream oss;
    int rc;

    host_template.drop(db);

    host_share.drop(db);

    oss << "DELETE FROM " << table << " WHERE oid=" << oid;

    rc = db->exec(oss);

    if ( rc == 0 )
    {
        set_valid(false);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Host::update_info(string &parse_str)
{
    char *  error_msg;
    int     rc;

    rc = host_template.parse(parse_str, &error_msg);
    
    if ( rc != 0 )
    {
        //Nebula::log("ONE", Log::ERROR, error_msg);
        
        free(error_msg);
        return -1;
    }
    
    get_template_attribute("TOTALCPU",host_share.max_cpu);
    get_template_attribute("TOTALMEMORY",host_share.max_mem);

    get_template_attribute("FREECPU",host_share.free_cpu);
    get_template_attribute("FREEMEMORY",host_share.free_mem);

    get_template_attribute("USEDCPU",host_share.used_cpu);
    get_template_attribute("USEDMEMORY",host_share.used_mem);

    return 0;
}

/* ************************************************************************** */
/* Host :: Misc                                                               */
/* ************************************************************************** */

ostream& operator<<(ostream& os, Host& host)
{
	string host_str;
	
	os << host.to_xml(host_str);
	
    return os;
};


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Host::to_xml(string& xml) const
{
    string template_xml;
	string share_xml;
    ostringstream   oss;
 
    oss << 
    "<HOST>"                             
       "<ID>"            << oid       	   << "</ID>"            <<           
       "<NAME>"          << hostname 	   << "</NAME>"          << 
       "<STATE>"         << state          << "</STATE>"         << 
       "<IM_MAD>"        << im_mad_name    << "</IM_MAD>"        << 
       "<VM_MAD>"        << vmm_mad_name   << "</VM_MAD>"        << 
       "<TM_MAD>"        << tm_mad_name    << "</TM_MAD>"        << 
       "<LAST_MON_TIME>" << last_monitored << "</LAST_MON_TIME>" << 
 	   host_share.to_xml(share_xml)  << 
       host_template.to_xml(template_xml) << 
	"</HOST>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Host::to_str(string& str) const
{
    string template_str;
	string share_str;
	
    ostringstream   os;

    os << 
		"ID      =  "  << oid            << endl <<
    	"NAME = "      << hostname       << endl <<
    	"STATE    = "  << state          << endl <<
    	"IM MAD   = "  << im_mad_name    << endl <<
    	"VMM MAD  = "  << vmm_mad_name   << endl <<
    	"TM MAD   = "  << tm_mad_name    << endl <<
    	"LAST_MON = "  << last_monitored << endl <<
        "ATTRIBUTES"   << endl << host_template.to_str(template_str) << endl <<
        "HOST SHARES"  << endl << host_share.to_str(share_str) <<endl;

	str = os.str();
	
	return str;
}


/* ************************************************************************** */
/* Host :: Parse functions to compute rank and evaluate requirements          */
/* ************************************************************************** */

pthread_mutex_t Host::lex_mutex = PTHREAD_MUTEX_INITIALIZER;

extern "C"
{
    typedef struct yy_buffer_state * YY_BUFFER_STATE;
    
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
    YY_BUFFER_STATE     str_buffer = 0;
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
    YY_BUFFER_STATE     str_buffer = 0;
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
