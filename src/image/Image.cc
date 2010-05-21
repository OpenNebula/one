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
        bus(0),
        state(INIT)
        {};

Image::~Image(){};

/* ************************************************************************ */
/* Image :: Database Access Functions                                        */
/* ************************************************************************ */

const char * Image::table = "image_pool";

const char * Image::db_names = "(oid, uid, name, description, type, regtime," 
                               "source, target, bus, state, running_vms)";

const char * Image::db_bootstrap = "CREATE TABLE IF NOT EXISTS image_pool ("
    "oid INTEGER PRIMARY KEY, uid INTEGER, name VARCHAR(128), "
    "description TEXT, type INTEGER, regtime INTEGER, "
    "source VARCHAR, target VARCHAR, bus INTEGER, state INTEGER, "
    "running_vms INTEGER, UNIQUE(name) )";

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
        (!values[STATE]) ||
        (!values[RUNNING_VMS]) ||
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
    state       = static_cast<ImageState>(atoi(values[STATE])); 
    
    running_vms = atoi(values[RUNNING_VMS]); 

    image_template.id  = oid;

    return 0;
}

/* ------------------------------------------------------------------------ */
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
        <<          type            << ","       
        <<          regtime         << ","
        << "'" <<   sql_source      << "',"
        << "'" <<   sql_target      << "',"
        <<          bus             << ","
        <<          state           << ","
        <<          running_vms     << ")";     

    rc = db->exec(oss);

    db->free_str(sql_name);
    db->free_str(sql_description);
    db->free_str(sql_source);
    db->free_str(sql_target);

    return rc;

error_target:
    db->free_str(sql_source);
error_source:
    db->free_str(sql_description);
error_description:
    db->free_str(sql_name);
error_name:
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::dump(ostringstream& oss, int num, char **values, char **names)
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
        (!values[STATE]) ||
        (!values[RUNNING_VMS]) ||
        (num != LIMIT ))
    {
        return -1;
    }

    oss <<
        "<IMAGE>" <<
            "<ID>"             << values[OID]         << "</ID>"          <<
            "<UID>"            << values[UID]         << "</UID>"         <<
            "<NAME>"           << values[NAME]        << "</NAME>"        <<
            "<DESCRIPTION>"    << values[DESCRIPTION] << "</DESCRIPTION>" <<
            "<TYPE>"           << values[TYPE]        << "</TYPE>"        <<
            "<REGTIME>"        << values[REGTIME]     << "</REGTIME>"     <<
            "<SOURCE>"         << values[SOURCE]      << "</SOURCE>"      <<
            "<TARGET>"         << values[TARGET]      << "</TARGET>"      <<
            "<BUS>"            << values[BUS]         << "</BUS>"         <<
            "<STATE>"          << values[STATE]       << "</STATE>"       <<
            "<RUNNING_VMS>"    << values[RUNNING_VMS] << "</RUNNING_VMS>" <<                                                           
        "</IMAGE>";

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::drop(SqlDB * db)
{
    ostringstream oss;
    int rc;

    image_template.drop(db);

    oss << "DELETE FROM " << table << " WHERE oid=" << oid;

    rc = db->exec(oss);

    if ( rc == 0 )
    {
        set_valid(false);
    }

    return rc;
}


/* ************************************************************************ */
/* Image :: Misc                                                             */
/* ************************************************************************ */

ostream& operator<<(ostream& os, Image& image)
{
	string image_str;

	os << image.to_xml(image_str);

    return os;
};


/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

string& Image::to_xml(string& xml) const
{
    string template_xml;
    ostringstream   oss;



    oss <<
        "<IMAGE>" <<
            "<ID>"             << oid         << "</ID>"          <<
            "<UID>"            << uid         << "</UID>"         <<
            "<NAME>"           << name        << "</NAME>"        <<
            "<DESCRIPTION>"    << description << "</DESCRIPTION>" <<
            "<TYPE>"           << type        << "</TYPE>"        <<
            "<REGTIME>"        << regtime     << "</REGTIME>"     <<
            "<SOURCE>"         << source      << "</SOURCE>"      <<
            "<TARGET>"         << target      << "</TARGET>"      <<
            "<BUS>"            << bus         << "</BUS>"         <<
            "<STATE>"          << state       << "</STATE>"       <<
            "<RUNNING_VMS>"    << running_vms << "</RUNNING_VMS>" <<
            image_template.to_xml(template_xml)                   <<
        "</IMAGE>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

string& Image::to_str(string& str) const
{
    string template_str;

    ostringstream   os;

    os <<
        "ID          = "    << oid         << endl <<
        "UID         = "    << uid         << endl <<
        "NAME        = "    << name        << endl <<
        "DESCRIPTION = "    << description << endl <<
        "TYPE        = "    << type        << endl <<
        "REGTIME     = "    << regtime     << endl <<
        "SOURCE      = "    << source      << endl <<
        "TARGET      = "    << target      << endl <<
        "BUS         = "    << bus         << endl <<
        "STATE       = "    << state       << endl <<
        "RUNNING_VMS = "    << running_vms << endl <<
        "TEMPLATE"          << endl        
                            << image_template.to_str(template_str) 
                            << endl;

    str = os.str();

    return str;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

  
bool get_image(bool overwrite)
{
    if ( state == READY || state == USED )
    {
        running_vms++;
        
        if(overwrite)
        {
            state = LOCKED;
        }
        else
        {
            state = USED;
        }
        return true;
    }
    else
    {
        return false;
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */
    
void release_image()
{
    running_vms--;
    
    if ( state == USED && running_vms == 0 )
    {
        state = READY;
    }
}
