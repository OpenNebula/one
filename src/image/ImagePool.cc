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

/* ************************************************************************** */
/* Image Pool                                                                 */
/* ************************************************************************** */

#include "ImagePool.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
string ImagePool::source_prefix;
string ImagePool::default_type;
string ImagePool::default_dev_prefix;

int ImagePool::init_cb(void *nil, int num, char **values, char **names)
{
    if ( num == 0 || values == 0 || values[0] == 0 )
    {
        return -1;
    }

    image_names.insert(make_pair(values[1],atoi(values[0])));

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


ImagePool::ImagePool(   SqlDB * db,
                        const string&   _source_prefix,
                        const string&   _default_type,
                        const string&   _default_dev_prefix):

                        PoolSQL(db,Image::table)
{
    ostringstream   sql;
    int             rc;

    // Init static defaults
    source_prefix       = _source_prefix;
    default_type        = _default_type;
    default_dev_prefix  = _default_dev_prefix;

    // Set default type
    if (_default_type != "OS"       &&
        _default_type != "CDROM"    &&
        _default_type != "DATABLOCK" )
    {
        NebulaLog::log("IMG", Log::ERROR,
                 "Bad default for image type, setting OS");
        default_type = "OS";
    }

    // Read from the DB the existing images, and build the ID:Name map
    set_callback(static_cast<Callbackable::Callback>(&ImagePool::init_cb));

    sql  << "SELECT oid, name FROM " <<  Image::table;

    rc = db->exec(sql, this);

    unset_callback();

    if ( rc != 0 )
    {
        NebulaLog::log("IMG", Log::ERROR,
                 "Could not load the existing images from the DB.");
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImagePool::allocate (
        int            uid,
        const  string& stemplate,
        int *          oid)
{
        int     rc;
        Image * img;

        string  name;
        char *  error_msg;

        // ---------------------------------------------------------------------
        // Build a new Image object
        // ---------------------------------------------------------------------
        img = new Image(uid);

        // ---------------------------------------------------------------------
        // Parse template
        // ---------------------------------------------------------------------
        rc = img->image_template.parse(stemplate, &error_msg);

        if ( rc != 0 )
        {
            goto error_parse;
        }

        img->get_template_attribute("NAME", name);

        // ---------------------------------------------------------------------
        // Insert the Object in the pool
        // ---------------------------------------------------------------------

        *oid = PoolSQL::allocate(img);

        if ( *oid == -1 )
        {
            return -1;
        }

        // ---------------------------------------------------------------------
        // Add the image name to the map of image_names
        // ---------------------------------------------------------------------

        image_names.insert(make_pair(name, *oid));

        return *oid;

error_parse:
    ostringstream oss;
    oss << "ImagePool template parse error: " << error_msg;
    NebulaLog::log("IMG", Log::ERROR, oss);
    free(error_msg);
    delete img;
    *oid = -2;
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImagePool::dump_cb(void * _oss, int num, char **values, char **names)
{
    ostringstream * oss;

    oss = static_cast<ostringstream *>(_oss);

    return Image::dump(*oss, num, values, names);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImagePool::dump(ostringstream& oss, const string& where)
{
    int             rc;
    ostringstream   cmd;

    oss << "<IMAGE_POOL>";

    set_callback(static_cast<Callbackable::Callback>(&ImagePool::dump_cb),
                  static_cast<void *>(&oss));

    cmd << "SELECT " << Image::table << ".*, user_pool.user_name FROM "
        << Image::table
        << " LEFT OUTER JOIN (SELECT oid, user_name FROM user_pool) "
        << "AS user_pool ON " << Image::table << ".uid = user_pool.oid";

    if ( !where.empty() )
    {
        cmd << " WHERE " << where;
    }

    rc = db->exec(cmd, this);

    oss << "</IMAGE_POOL>";

    unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
