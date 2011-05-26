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

#define TO_UPPER(S) transform(S.begin(),S.end(),S.begin(),(int(*)(int))toupper)

/* ************************************************************************ */
/* Image :: Constructor/Destructor                                          */
/* ************************************************************************ */

Image::Image(int             _uid,
             int             _gid,
             ImageTemplate * _image_template):
        PoolObjectSQL(-1,"",_uid,_gid,table),
        type(OS),
        regtime(time(0)),
        source("-"),
        state(INIT),
        running_vms(0)
{
    if (_image_template != 0)
    {
        obj_template = _image_template;
    }
    else
    {
        obj_template = new ImageTemplate;
    }
}

Image::~Image()
{
    if (obj_template != 0)
    {
        delete obj_template;
    }
}

/* ************************************************************************ */
/* Image :: Database Access Functions                                       */
/* ************************************************************************ */

const char * Image::table = "image_pool";

const char * Image::db_names = "oid, name, body, uid, gid, public";

const char * Image::db_bootstrap = "CREATE TABLE IF NOT EXISTS image_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, uid INTEGER, "
    "gid INTEGER, public INTEGER, UNIQUE(name,uid) )";

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::insert(SqlDB *db, string& error_str)
{
    int rc;

    string path_attr;
    string type_att;
    string public_attr;
    string persistent_attr;
    string dev_prefix;
    string source_attr;

    // ---------------------------------------------------------------------
    // Check default image attributes
    // ---------------------------------------------------------------------

    // ------------ NAME --------------------

    get_template_attribute("NAME", name);

    // ------------ TYPE --------------------

    get_template_attribute("TYPE", type_att);

    TO_UPPER(type_att);

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

    obj_template->erase("PUBLIC");

    TO_UPPER(public_attr);

    public_obj = (public_attr == "YES");

    // ------------ PERSISTENT --------------------

    get_template_attribute("PERSISTENT", persistent_attr);

    obj_template->erase("PERSISTENT");

    TO_UPPER(persistent_attr);

    persistent_img = (persistent_attr == "YES");

    // An image cannot be public and persistent simultaneously

    if ( public_obj && persistent_img )
    {
        goto error_public_and_persistent;
    }

    // ------------ PREFIX --------------------

    get_template_attribute("DEV_PREFIX", dev_prefix);

    if( dev_prefix.empty() )
    {
        SingleAttribute * dev_att = new SingleAttribute("DEV_PREFIX",
                                          ImagePool::default_dev_prefix());

        obj_template->set(dev_att);
    }

    // ------------ PATH & SOURCE --------------------

    get_template_attribute("PATH", path_attr);
    get_template_attribute("SOURCE", source_attr);

    // The template should contain PATH or SOURCE
    if ( source_attr.empty() && path_attr.empty() )
    {
        string size_attr;
        string fstype_attr;

        istringstream iss;
        int size_mb;

        get_template_attribute("SIZE",   size_attr);
        get_template_attribute("FSTYPE", fstype_attr);

        // DATABLOCK image needs SIZE and FSTYPE
        if (type != DATABLOCK || size_attr.empty() || fstype_attr.empty())
        {
            goto error_no_path;
        }

        iss.str(size_attr);

        iss >> size_mb;

        if (iss.fail() == true)
        {
            goto error_size_format;
        }
    }
    else if ( !source_attr.empty() && !path_attr.empty() )
    {
        goto error_path_and_source;
    }
    else if ( !source_attr.empty() )
    {
        source = source_attr;
    }

    state = LOCKED; //LOCKED till the ImageManager copies it to the Repository

    //--------------------------------------------------------------------------
    // Insert the Image
    //--------------------------------------------------------------------------

    rc = insert_replace(db, false);

    if ( rc == -1 )
    {
        error_str = "Error inserting Image in DB.";
    }

    return rc;

error_type:
    error_str = "Incorrect TYPE in template.";
    goto error_common;

error_public_and_persistent:
    error_str = "Image cannot be public and persistent.";
    goto error_common;

error_no_path:
    if ( type == DATABLOCK )
    {
        error_str = "A DATABLOCK type IMAGE has to declare a PATH, or both "
                    "SIZE and FSTYPE.";
    }
    else
    {
        error_str = "No PATH in template.";
    }
    goto error_common;

error_size_format:
    error_str = "Wrong number in SIZE.";
    goto error_common;

error_path_and_source:
    error_str = "Template malformed, PATH and SOURCE are mutuallly exclusive.";
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

    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Update the Image

    sql_name = db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_xml = db->escape_str(to_xml(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
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

    oss <<" INTO "<< table <<" ("<< db_names <<") VALUES ("
        <<          oid             << ","
        << "'" <<   sql_name        << "',"
        << "'" <<   sql_xml         << "',"
        <<          uid             << ","
        <<          gid             << ","
        <<          public_obj      << ")";

    rc = db->exec(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_body:
    db->free_str(sql_name);
error_name:
    return -1;
}

/* ************************************************************************ */
/* Image :: Misc                                                             */
/* ************************************************************************ */

ostream& operator<<(ostream& os, Image& image)
{
    string image_str;

    os << image.to_xml(image_str);

    return os;
}

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
            "<GID>"            << gid             << "</GID>"         <<
            "<NAME>"           << name            << "</NAME>"        <<
            "<TYPE>"           << type            << "</TYPE>"        <<
            "<PUBLIC>"         << public_obj      << "</PUBLIC>"      <<
            "<PERSISTENT>"     << persistent_img  << "</PERSISTENT>"  <<
            "<REGTIME>"        << regtime         << "</REGTIME>"     <<
            "<SOURCE>"         << source          << "</SOURCE>"      <<
            "<STATE>"          << state           << "</STATE>"       <<
            "<RUNNING_VMS>"    << running_vms     << "</RUNNING_VMS>" <<
            obj_template->to_xml(template_xml)                      <<
        "</IMAGE>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::from_xml(const string& xml)
{
    vector<xmlNodePtr> content;
    int int_state;
    int int_type;

    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid, "/IMAGE/ID", -1);
    rc += xpath(uid, "/IMAGE/UID", -1);
    rc += xpath(gid, "/IMAGE/GID", -1);
    rc += xpath(name, "/IMAGE/NAME", "not_found");

    rc += xpath(int_type, "/IMAGE/TYPE", 0);
    rc += xpath(public_obj, "/IMAGE/PUBLIC", 0);
    rc += xpath(persistent_img, "/IMAGE/PERSISTENT", 0);
    rc += xpath(regtime, "/IMAGE/REGTIME", 0);

    rc += xpath(source, "/IMAGE/SOURCE", "not_found");
    rc += xpath(int_state, "/IMAGE/STATE", 0);
    rc += xpath(running_vms, "/IMAGE/RUNNING_VMS", -1);

    type  = static_cast<ImageType>(int_type);
    state = static_cast<ImageState>(int_state);

    // Get associated classes
    ObjectXML::get_nodes("/IMAGE/TEMPLATE", content);
    if( content.size() < 1 )
    {
        return -1;
    }

    rc += obj_template->from_xml_node(content[0]);

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::disk_attribute(  VectorAttribute * disk,
                            int *             index,
                            ImageType*        img_type)
{
    string  bus;
    string  target;
    string  driver;

    ostringstream  iid;

    *img_type = type;
    bus       = disk->vector_value("BUS");
    target    = disk->vector_value("TARGET");
    driver    = disk->vector_value("DRIVER");
    iid << oid;

    string template_bus;
    string template_target;
    string prefix;
    string template_driver;

    get_template_attribute("BUS", template_bus);
    get_template_attribute("TARGET", template_target);
    get_template_attribute("DRIVER", template_driver);

    get_template_attribute("DEV_PREFIX", prefix);

   //---------------------------------------------------------------------------
   //                       BASE DISK ATTRIBUTES
   //---------------------------------------------------------------------------

    disk->replace("IMAGE",    name);
    disk->replace("IMAGE_ID", iid.str());
    disk->replace("SOURCE",   source);

    if (bus.empty() && !template_bus.empty()) //BUS in Image, not in DISK
    {
        disk->replace("BUS",template_bus);
    }

    if (driver.empty() && !template_driver.empty())//DRIVER in Image,not in DISK
    {
        disk->replace("DRIVER",template_driver);
    }

   //---------------------------------------------------------------------------
   //   TYPE, READONLY, CLONE, and SAVE attributes
   //---------------------------------------------------------------------------

    if ( persistent_img )
    {
        disk->replace("CLONE","NO");
        disk->replace("SAVE","YES");
    }
    else
    {
        disk->replace("CLONE","YES");
        disk->replace("SAVE","NO");
    }

    switch(type)
    {
        case OS:
        case DATABLOCK:
          disk->replace("TYPE","DISK");
          disk->replace("READONLY","NO");
        break;

        case CDROM:
          disk->replace("TYPE","CDROM");
          disk->replace("READONLY","YES");
        break;
    }

   //---------------------------------------------------------------------------
   //   TARGET attribute
   //---------------------------------------------------------------------------

    if (target.empty()) //No TARGET in DISK attribute
    {
        if (!template_target.empty())
        {
            disk->replace("TARGET", template_target);
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

            disk->replace("TARGET", prefix);
        }
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */
