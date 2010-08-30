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
#include <openssl/evp.h>
#include <iomanip>

#include "Image.h"
#include "ImagePool.h"

#include "AuthManager.h"
#include "UserPool.h"

/* ************************************************************************ */
/* Image :: Constructor/Destructor                                           */
/* ************************************************************************ */

Image::Image(int _uid, ImageTemplate * _image_template):
        PoolObjectSQL(-1),
        uid(_uid),
        name(""),
        type(OS),
        regtime(time(0)),
        source(""),
        state(INIT),
        running_vms(0)
{
    if (_image_template != 0)
    {
        image_template = _image_template;
    }
    else
    {
        image_template = new ImageTemplate;
    }
};

Image::~Image()
{
    if (image_template != 0)
    {
        delete image_template;
    }
};

/* ************************************************************************ */
/* Image :: Database Access Functions                                        */
/* ************************************************************************ */

const char * Image::table = "image_pool";

const char * Image::db_names = "(oid, uid, name, type, public, persistent, regtime, "
                               "source, state, running_vms, template)";

const char * Image::db_bootstrap = "CREATE TABLE IF NOT EXISTS image_pool ("
    "oid INTEGER PRIMARY KEY, uid INTEGER, name VARCHAR(128), "
    "type INTEGER, public INTEGER, persistent INTEGER, regtime INTEGER, source TEXT, state INTEGER, "
    "running_vms INTEGER, template TEXT, UNIQUE(name) )";

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::select_cb(void * nil, int num, char **values, char ** names)
{
    if ((!values[OID])          ||
        (!values[UID])          ||
        (!values[NAME])         ||
        (!values[TYPE])         ||
        (!values[PUBLIC])       ||
        (!values[PERSISTENT])   ||
        (!values[REGTIME])      ||
        (!values[SOURCE])       ||
        (!values[STATE])        ||
        (!values[RUNNING_VMS])  ||
        (!values[TEMPLATE])     ||
        (num != LIMIT ))
    {
        return -1;
    }

    oid         = atoi(values[OID]);
    uid         = atoi(values[UID]);

    name        = values[NAME];

    type           = static_cast<ImageType>(atoi(values[TYPE]));
    public_img     = atoi(values[PUBLIC]);
    persistent_img = atoi(values[PERSISTENT]);
    regtime        = static_cast<time_t>(atoi(values[REGTIME]));

    source      = values[SOURCE];

    state       = static_cast<ImageState>(atoi(values[STATE]));

    running_vms = atoi(values[RUNNING_VMS]);

    image_template->from_xml(values[TEMPLATE]);

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

    return 0;
}


/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::insert(SqlDB *db, string& error_str)
{
    int rc;

    string  source_att;
    string  type_att;
    string  public_attr;
    string  persistent_attr;
    string  dev_prefix;

    ostringstream tmp_hashstream;
    ostringstream tmp_sourcestream;

    // ---------------------------------------------------------------------
    // Check default image attributes
    // ---------------------------------------------------------------------

    // ------------ NAME --------------------

    get_template_attribute("NAME", name);

    if ( name.empty() == true )
    {
        goto error_name;
    }

    // ------------ TYPE --------------------

    get_template_attribute("TYPE", type_att);

    transform (type_att.begin(), type_att.end(), type_att.begin(),
        (int(*)(int))toupper);

    if ( type_att.empty() == true )
    {
        type_att = ImagePool::default_type();
    }

    if (set_type(type_att) != 0)
    {
        goto error_type;
    }

    // ------------ PUBLIC --------------------

    get_template_attribute("PUBLIC", public_attr);
    image_template->erase("PUBLIC");

    transform (public_attr.begin(), public_attr.end(), public_attr.begin(),
        (int(*)(int))toupper);

    public_img = (public_attr == "YES");

    // ------------ PERSISTENT --------------------

    get_template_attribute("PERSISTENT", persistent_attr);
    image_template->erase("PERSISTENT");

    transform (persistent_attr.begin(), persistent_attr.end(), persistent_attr.begin(),
        (int(*)(int))toupper);

    persistent_img = (persistent_attr == "YES");

    // An image cannot be public and persistent simultaneously

    if ( public_img && persistent_img )
    {
        goto error_public_and_persistent;
    }

    // ------------ PREFIX --------------------

    get_template_attribute("DEV_PREFIX", dev_prefix);

    if( dev_prefix.empty() )
    {
        SingleAttribute * dev_att = new SingleAttribute("DEV_PREFIX",
                                          ImagePool::default_dev_prefix());

        image_template->set(dev_att);
    }

    // ------------ SOURCE (path to store the image)--------------------

    tmp_hashstream << uid << ":" << name;

    tmp_sourcestream << ImagePool::source_prefix() << "/";
    tmp_sourcestream << sha1_digest(tmp_hashstream.str());

    source = tmp_sourcestream.str();


    state = DISABLED;

    //--------------------------------------------------------------------------
    // Insert the Image
    //--------------------------------------------------------------------------

    rc = insert_replace(db, false);

    if ( rc == -1 )
    {
        error_str = "Error inserting Image in DB.";
    }

    return rc;

error_name:
    error_str = "NAME not present in image template.";
    goto error_common;

error_type:
    error_str = "Incorrect TYPE in image template.";
    goto error_common;

error_public_and_persistent:
    error_str = "Image cannot be public and persistent.";
    goto error_common;

error_common:
    NebulaLog::log("IMG", Log::ERROR, error_str);
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::update(SqlDB *db)
{
    return insert_replace(db, true);;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::insert_replace(SqlDB *db, bool replace)
{
    ostringstream   oss;

    int    rc;

    string xml_template;

    char * sql_name;
    char * sql_source;
    char * sql_template;

    // Update the Image

    sql_name = db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_source = db->escape_str(source.c_str());

    if ( sql_source == 0 )
    {
        goto error_source;
    }

    image_template->to_xml(xml_template);
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
        <<          oid             << ","
        <<          uid             << ","
        << "'" <<   sql_name        << "',"
        <<          type            << ","
        <<          public_img      << ","
        <<          persistent_img  << ","
        <<          regtime         << ","
        << "'" <<   sql_source      << "',"
        <<          state           << ","
        <<          running_vms     << ","
        << "'" <<   sql_template    << "')";

    rc = db->exec(oss);

    db->free_str(sql_name);
    db->free_str(sql_source);
    db->free_str(sql_template);

    return rc;

error_template:
    db->free_str(sql_source);
error_source:
    db->free_str(sql_name);
error_name:
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::dump(ostringstream& oss, int num, char **values, char **names)
{
    if ((!values[OID])          ||
        (!values[UID])          ||
        (!values[NAME])         ||
        (!values[TYPE])         ||
        (!values[PUBLIC])       ||
        (!values[PERSISTENT])   ||
        (!values[REGTIME])      ||
        (!values[SOURCE])       ||
        (!values[STATE])        ||
        (!values[RUNNING_VMS])  ||
        (!values[TEMPLATE])     ||
        (num != LIMIT + 1))
    {
        return -1;
    }

    oss <<
        "<IMAGE>" <<
            "<ID>"             << values[OID]         << "</ID>"          <<
            "<UID>"            << values[UID]         << "</UID>"         <<
            "<USERNAME>"       << values[LIMIT]       << "</USERNAME>"    <<
            "<NAME>"           << values[NAME]        << "</NAME>"        <<
            "<TYPE>"           << values[TYPE]        << "</TYPE>"        <<
            "<PUBLIC>"         << values[PUBLIC]      << "</PUBLIC>"      <<
            "<PERSISTENT>"     << values[PERSISTENT]  << "</PERSISTENT>"  <<
            "<REGTIME>"        << values[REGTIME]     << "</REGTIME>"     <<
            "<SOURCE>"         << values[SOURCE]      << "</SOURCE>"      <<
            "<STATE>"          << values[STATE]       << "</STATE>"       <<
            "<RUNNING_VMS>"    << values[RUNNING_VMS] << "</RUNNING_VMS>" <<
                                  values[TEMPLATE]                        <<
        "</IMAGE>";

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::drop(SqlDB * db)
{
    ostringstream oss;
    int rc;

    // Only delete the VM
    if (running_vms != 0)
    {
        return -1;
    }

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
            "<ID>"             << oid             << "</ID>"          <<
            "<UID>"            << uid             << "</UID>"         <<
            "<NAME>"           << name            << "</NAME>"        <<
            "<TYPE>"           << type            << "</TYPE>"        <<
            "<PUBLIC>"         << public_img      << "</PUBLIC>"      <<
            "<PERSISTENT>"     << persistent_img  << "</PERSISTENT>"  <<
            "<REGTIME>"        << regtime         << "</REGTIME>"     <<
            "<SOURCE>"         << source          << "</SOURCE>"      <<
            "<STATE>"          << state           << "</STATE>"       <<
            "<RUNNING_VMS>"    << running_vms     << "</RUNNING_VMS>" <<
            image_template->to_xml(template_xml)                      <<
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
        "ID          = "    << oid             << endl <<
        "UID         = "    << uid             << endl <<
        "NAME        = "    << name            << endl <<
        "TYPE        = "    << type            << endl <<
        "PUBLIC      = "    << public_img      << endl <<
        "PERSISTENT  = "    << persistent_img  << endl <<
        "REGTIME     = "    << regtime         << endl <<
        "SOURCE      = "    << source          << endl <<
        "STATE       = "    << state           << endl <<
        "RUNNING_VMS = "    << running_vms     << endl <<
        "TEMPLATE"          << endl
                            << image_template->to_str(template_str)
                            << endl;

    str = os.str();

    return str;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::acquire_image()
{
    int rc = 0;


    switch (state)
    {
        case READY:
            running_vms++;
            state = USED;
        break;

        case USED:
             if (persistent_img)
             {
                 rc = -1;
             }
             else
             {
                 running_vms++;
             }
        break;

        case DISABLED:
        default:
           rc = -1;
        break;
    }

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

bool Image::release_image()
{
    bool dirty = false;

    switch (state)
    {
        case USED:
            running_vms--;

            if ( running_vms == 0)
            {
                state = READY;
            }

            dirty = true;
        break;

        case DISABLED:
        case READY:
        default:
        break;
    }

    return dirty;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::disk_attribute(  VectorAttribute * disk,
                            int *             index,
                            ImageType*        img_type)
{
    string  bus;
    string  target;

    ostringstream  iid;

    *img_type = type;
    bus       = disk->vector_value("BUS");
    target    = disk->vector_value("TARGET");
    iid << oid;

    string template_bus;
    string template_target;
    string prefix;

    get_template_attribute("BUS", template_bus);
    get_template_attribute("TARGET", template_target);
    get_template_attribute("DEV_PREFIX", prefix);

    //--------------------------------------------------------------------------
    //                       Acquire the image
    //--------------------------------------------------------------------------

    if ( acquire_image() != 0 )
    {
        return -1;
    }

   //---------------------------------------------------------------------------
   //                       NEW DISK ATTRIBUTES
   //---------------------------------------------------------------------------

    map<string,string> new_disk;

    new_disk.insert(make_pair("IMAGE",    name));
    new_disk.insert(make_pair("IMAGE_ID", iid.str()));
    new_disk.insert(make_pair("SOURCE",   source));

    if (!bus.empty())
    {
        new_disk.insert(make_pair("BUS",bus));
    }
    else if (!template_bus.empty())
    {
            new_disk.insert(make_pair("BUS",template_bus));
    }

   //---------------------------------------------------------------------------
   //   TYPE, READONLY, CLONE, and SAVE attributes
   //---------------------------------------------------------------------------

    if ( persistent_img )
    {
        new_disk.insert(make_pair("CLONE","NO"));
        new_disk.insert(make_pair("SAVE","YES"));

        new_disk.insert(make_pair("SAVE_AS", iid.str())); // Tells the hook to overwrite
    }
    else
    {
        new_disk.insert(make_pair("CLONE","YES"));
        new_disk.insert(make_pair("SAVE","NO"));
    }

    switch(type)
    {
        case OS:
        case DATABLOCK:
          new_disk.insert(make_pair("TYPE","DISK"));
          new_disk.insert(make_pair("READONLY","NO"));
        break;

        case CDROM:
          new_disk.insert(make_pair("TYPE","CDROM"));
          new_disk.insert(make_pair("READONLY","YES"));
        break;
    }

   //---------------------------------------------------------------------------
   //   TARGET attribute
   //---------------------------------------------------------------------------

    if (!target.empty())
    {
        new_disk.insert(make_pair("TARGET", target));
    }
    else if (!template_target.empty())
    {
        new_disk.insert(make_pair("TARGET", template_target));
    }
    else
    {
        switch(type)
        {
            case OS:
                prefix += "a";
            break;

            case CDROM:
                prefix += "c"; // b is for context
            break;

            case DATABLOCK:
                prefix += static_cast<char>(('e'+ *index));
                *index  = *index + 1;
            break;

        }

        new_disk.insert(make_pair("TARGET", prefix));
    }

    disk->replace(new_disk);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Image::sha1_digest(const string& pass)
{
    EVP_MD_CTX     mdctx;
    unsigned char  md_value[EVP_MAX_MD_SIZE];
    unsigned int   md_len;
    ostringstream  oss;

    EVP_MD_CTX_init(&mdctx);
    EVP_DigestInit_ex(&mdctx, EVP_sha1(), NULL);

    EVP_DigestUpdate(&mdctx, pass.c_str(), pass.length());

    EVP_DigestFinal_ex(&mdctx,md_value,&md_len);
    EVP_MD_CTX_cleanup(&mdctx);

    for(unsigned int i = 0; i<md_len; i++)
    {
        oss << setfill('0') << setw(2) << hex << nouppercase
            << (unsigned short) md_value[i];
    }

    return oss.str();
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

