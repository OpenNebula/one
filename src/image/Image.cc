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

#include "Image.h"

/* ************************************************************************ */
/* Image :: Constructor/Destructor                                           */
/* ************************************************************************ */

Image::Image(int _uid):
        PoolObjectSQL(-1),
        uid(_uid),
        name(""),
        description(""),
        type(0),
        registration_time(time(0)),
        source(""),
        target(""),
        bus(0)
        {};

Image::~Image(){};

/* ************************************************************************ */
/* Image :: Database Access Functions                                        */
/* ************************************************************************ */

const char * Image::table = "image_pool";

const char * Image::db_names = "(oid, uid, name, description, type, regtime," 
                               "source, target, bus)";

const char * Image::db_bootstrap = "CREATE TABLE IF NOT EXISTS image_pool ("
    "oid INTEGER PRIMARY KEY, uid INTEGER, name VARCHAR(128), "
    "description TEXT, type INTEGER, regtime INTEGER, "
    "source VARCHAR, target VARCHAR, bus INTEGER, UNIQUE(name) )";

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::select_cb(void * nil, int num, char **values, char ** names)
{
    if ((!values[OID]) ||
        (!values[UID]) ||
        (!values[NAME]) ||
        (!values[DESCRIPTION]) ||
        (!values[TYPE]) ||
        (!values[REGTIME]) ||
        (!values[SOURCE]) ||
        (!values[TARGET]) ||
        (!values[BUS]) ||
        (num != LIMIT ))
    {
        return -1;
    }

    oid         = atoi(values[OID]);
    uid         = atoi(values[UID]);
    
    name        = values[NAME];
    description = values[DESCRIPTION];
    
    type        = static_cast<ImageType>(atoi(values[TYPE]));
    regtime     = static_cast<time_t>(atoi(values[REGTIME]));
    
    source      = values[SOURCE];
    target      = values[TARGET];
    
    bus         = static_cast<BusType>(atoi(values[BUS]));   

    image_template.id  = oid;

    return 0;
}

/* ------------------------------------------------------------------------ */

int Image::select(SqlDB *db)
{
    ostringstream   oss;
    int             rc;
    int             boid;

    set_callback(static_cast<Callbackable::Callback>(&Image::select_cb));

    oss << "SELECT * FROM " << table << " WHERE oid = " << oid;

    boid = oid;
    oid  = -1;

    rc = db->exec(oss, this);

    if ((rc != 0) || (oid != boid ))
    {
        return -1;
    }

    // Get the template

    rc = image_template.select(db);

    if ( rc != 0 )
    {
        return -1;
    }
    
    return 0;
}


/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::insert(SqlDB *db)
{
    int rc;

    // Set up the template ID, to insert it
    if ( image_template.id == -1 )
    {
        image_template.id = oid;
    }

    // Insert the Template
    rc = image_template.insert(db);

    if ( rc != 0 )
    {
        return rc;
    }

    //Insert the Image
    rc = insert_replace(db, false);

    if ( rc != 0 )
    {
        image_template.drop(db);

        return rc;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::update(SqlDB *db)
{
    int    rc;

    // Update the Template
    rc = image_template.update(db);

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

int Image::insert_replace(SqlDB *db, bool replace)
{
    ostringstream   oss;

    int    rc;

    char * sql_name;
    char * sql_description;
    char * sql_source;
    char * sql_target;

   // Update the Image

    sql_name = db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_description = db->escape_str(description.c_str());

    if ( sql_description == 0 )
    {
        goto error_description;
    }

    sql_source = db->escape_str(source.c_str());

    if ( sql_source == 0 )
    {
        goto error_source;
    }

    sql_target = db->escape_str(target.c_str());

    if ( sql_target == 0 )
    {
        goto error_target;
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
        <<          oid             << ","
        <<          uid             << ","
        << "'" <<   sql_name        << "',"
        << "'" <<   sql_description << "',"
        <<          type            << ","       // TODO CHECK ENUM << OPERATOR
        <<          regtime         << ","
        << "'" <<   sql_source      << "',"
        << "'" <<   sql_target      << "',"
        <<          bus             << ")";      // TODO CHECK ENUM << OPERATOR

    rc = db->exec(oss);

    db->free_str(sql_hostname);
    db->free_str(sql_im_mad_name);
    db->free_str(sql_tm_mad_name);
    db->free_str(sql_vmm_mad_name);

    return rc;
// TODO error names
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
        "ATTRIBUTES"   << endl << host_template.to_str(template_str) << endl <<
        "HOST SHARES"  << endl << host_share.to_str(share_str) <<endl;

	str = os.str();

	return str;
}
