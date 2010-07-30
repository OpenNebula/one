/* ------------------------------------------------------------------------ */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)           */
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

#include <limits.h>
#include <string.h>

#include <iostream>
#include <sstream>

#include "Host.h"
#include "NebulaLog.h"

/* ************************************************************************ */
/* Host :: Constructor/Destructor                                           */
/* ************************************************************************ */

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
        last_monitored(0),
        cluster(ClusterPool::DEFAULT_CLUSTER_NAME),
        host_template(true,'=',"TEMPLATE")
        {};


Host::~Host(){};

/* ************************************************************************ */
/* Host :: Database Access Functions                                        */
/* ************************************************************************ */

const char * Host::table = "host_pool";

const char * Host::db_names = "(oid,host_name,state,im_mad,vm_mad,"
                              "tm_mad,last_mon_time, cluster, template)";

const char * Host::db_bootstrap = "CREATE TABLE IF NOT EXISTS host_pool ("
    "oid INTEGER PRIMARY KEY,host_name VARCHAR(512), state INTEGER,"
    "im_mad VARCHAR(128),vm_mad VARCHAR(128),tm_mad VARCHAR(128),"
    "last_mon_time INTEGER, cluster VARCHAR(128), template TEXT, "
    "UNIQUE(host_name, im_mad, vm_mad, tm_mad) )";

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Host::select_cb(void * nil, int num, char **values, char ** names)
{
    if ((!values[OID]) ||
        (!values[HOST_NAME]) ||
        (!values[STATE]) ||
        (!values[IM_MAD]) ||
        (!values[VM_MAD]) ||
        (!values[TM_MAD]) ||
        (!values[LAST_MON_TIME]) ||
        (!values[CLUSTER]) ||
        (!values[TEMPLATE]) ||
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

    cluster = values[CLUSTER];

    host_template.from_xml(values[TEMPLATE]);

    host_share.hsid  = oid;

    return 0;
}

/* ------------------------------------------------------------------------ */

int Host::select(SqlDB *db)
{
    ostringstream   oss;
    int             rc;
    int             boid;

    set_callback(static_cast<Callbackable::Callback>(&Host::select_cb));

    oss << "SELECT * FROM " << table << " WHERE oid = " << oid;

    boid = oid;
    oid  = -1;

    rc = db->exec(oss, this);

    unset_callback();

    if ((rc != 0) || (oid != boid ))
    {
        return -1;
    }

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

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Host::insert(SqlDB *db)
{
    int rc;
    map<int,HostShare *>::iterator iter;

    // Set up the share ID, to insert it
    if ( host_share.hsid == -1 )
    {
        host_share.hsid = oid;
    }

    // Update the HostShare
    rc = host_share.insert(db);

    if ( rc != 0 )
    {
        return rc;
    }

    //Insert the Host
    rc = insert_replace(db, false);

    if ( rc != 0 )
    {
        host_share.drop(db);

        return rc;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Host::update(SqlDB *db)
{
    int    rc;

    // Update the HostShare
    rc = host_share.update(db);

    if ( rc != 0 )
    {
        return rc;
    }

    rc = insert_replace(db, true);

    if ( rc != 0 )
    {
        return rc;
    }

    return 0;


}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Host::insert_replace(SqlDB *db, bool replace)
{
    ostringstream   oss;

    int    rc;
    string xml_template;

    char * sql_hostname;
    char * sql_im_mad_name;
    char * sql_tm_mad_name;
    char * sql_vmm_mad_name;
    char * sql_cluster;
    char * sql_template;

   // Update the Host

    sql_hostname = db->escape_str(hostname.c_str());

    if ( sql_hostname == 0 )
    {
        goto error_hostname;
    }

    sql_im_mad_name = db->escape_str(im_mad_name.c_str());

    if ( sql_im_mad_name == 0 )
    {
        goto error_im;
    }

    sql_tm_mad_name = db->escape_str(tm_mad_name.c_str());

    if ( sql_tm_mad_name == 0 )
    {
        goto error_tm;
    }

    sql_vmm_mad_name = db->escape_str(vmm_mad_name.c_str());

    if ( sql_vmm_mad_name == 0 )
    {
        goto error_vmm;
    }

    sql_cluster = db->escape_str(cluster.c_str());

    if ( sql_cluster == 0 )
    {
        goto error_cluster;
    }

    host_template.to_xml(xml_template);
    sql_template = db->escape_str(xml_template.c_str());

    if ( sql_template == 0 )
    {
        goto error_template;
    }

    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    // Construct the SQL statement to Insert or Replace

    oss <<" INTO "<< table <<" "<< db_names <<" VALUES ("
        <<          oid                 << ","
        << "'" <<   sql_hostname        << "',"
        <<          state               << ","
        << "'" <<   sql_im_mad_name     << "',"
        << "'" <<   sql_vmm_mad_name    << "',"
        << "'" <<   sql_tm_mad_name     << "',"
        <<          last_monitored      << ","
        << "'" <<   sql_cluster         << "',"
        << "'" <<   sql_template        << "')";

    rc = db->exec(oss);

    db->free_str(sql_hostname);
    db->free_str(sql_im_mad_name);
    db->free_str(sql_tm_mad_name);
    db->free_str(sql_vmm_mad_name);
    db->free_str(sql_cluster);
    db->free_str(sql_template);

    return rc;

error_template:
    db->free_str(sql_cluster);
error_cluster:
    db->free_str(sql_vmm_mad_name);
error_vmm:
    db->free_str(sql_tm_mad_name);
error_tm:
    db->free_str(sql_im_mad_name);
error_im:
    db->free_str(sql_hostname);
error_hostname:
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Host::dump(ostringstream& oss, int num, char **values, char **names)
{
    if ((!values[OID]) ||
        (!values[HOST_NAME]) ||
        (!values[STATE]) ||
        (!values[IM_MAD]) ||
        (!values[VM_MAD]) ||
        (!values[TM_MAD]) ||
        (!values[LAST_MON_TIME]) ||
        (!values[CLUSTER]) ||
        (!values[TEMPLATE]) ||
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
            "<LAST_MON_TIME>"<< values[LAST_MON_TIME]<<"</LAST_MON_TIME>"<<
            "<CLUSTER>"      << values[CLUSTER]      <<"</CLUSTER>"      <<
            values[TEMPLATE];

    HostShare::dump(oss,num - LIMIT, values + LIMIT, names + LIMIT);

    oss << "</HOST>";

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Host::drop(SqlDB * db)
{
    ostringstream oss;
    int rc;

    host_share.drop(db);

    oss << "DELETE FROM " << table << " WHERE oid=" << oid;

    rc = db->exec(oss);

    if ( rc == 0 )
    {
        set_valid(false);
    }

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Host::update_info(string &parse_str)
{
    char *  error_msg;
    int     rc;

    rc = host_template.parse(parse_str, &error_msg);

    if ( rc != 0 )
    {
        NebulaLog::log("ONE", Log::ERROR, error_msg);

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

/* ************************************************************************ */
/* Host :: Misc                                                             */
/* ************************************************************************ */

ostream& operator<<(ostream& os, Host& host)
{
    string host_str;

    os << host.to_xml(host_str);

    return os;
};

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

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
       "<CLUSTER>"       << cluster        << "</CLUSTER>"       <<
       host_share.to_xml(share_xml)  <<
       host_template.to_xml(template_xml) <<
    "</HOST>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

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
        "CLUSTER  = "  << cluster        << endl <<
        "ATTRIBUTES"   << endl << host_template.to_str(template_str) << endl <<
        "HOST SHARES"  << endl << host_share.to_str(share_str) <<endl;

    str = os.str();

    return str;
}
