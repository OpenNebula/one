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
#include "AuthManager.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
string ImagePool::_source_prefix;
string ImagePool::_default_type;
string ImagePool::_default_dev_prefix;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ImagePool::ImagePool(   SqlDB * db,
                        const string&   __source_prefix,
                        const string&   __default_type,
                        const string&   __default_dev_prefix):
                        PoolSQL(db,Image::table,true)
{
    ostringstream sql;

    // Init static defaults
    _source_prefix       = __source_prefix;
    _default_type        = __default_type;
    _default_dev_prefix  = __default_dev_prefix;

    // Set default type
    if (_default_type != "OS"       &&
        _default_type != "CDROM"    &&
        _default_type != "DATABLOCK" )
    {
        NebulaLog::log("IMG", Log::ERROR, "Bad default for image type, setting OS");
        _default_type = "OS";
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImagePool::allocate (
        int            uid,
        string         user_name,
        ImageTemplate* img_template,
        int *          oid,
        string&        error_str)
{
    Image * img;
    string  name;

    // ---------------------------------------------------------------------
    // Build a new Image object
    // ---------------------------------------------------------------------
    img = new Image(uid, user_name, img_template);

    img->get_template_attribute("NAME", name);

    // ---------------------------------------------------------------------
    // Insert the Object in the pool
    // ---------------------------------------------------------------------
    *oid = PoolSQL::allocate(img, error_str);

    return *oid;
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

    cmd << "SELECT body FROM " << Image::table;

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

int ImagePool::disk_attribute(VectorAttribute *  disk,
                              int                disk_id,
                              int *              index,
                              Image::ImageType * img_type,
                              int                uid)
{
    string  source;
    Image * img = 0;
    int     rc;

    ostringstream oss;

    source = disk->vector_value("IMAGE");

    if (source.empty())
    {
        istringstream   is;
        int             image_id;

        source = disk->vector_value("IMAGE_ID");

        if (!source.empty())
        {
            is.str(source);
            is >> image_id;

            if( !is.fail() )
            {
                img = get(image_id,true);

                if (img == 0)
                {
                    return -1;
                }
            }
        }
    }
    else
    {
        img = get(source,uid,true);

        if (img == 0)
        {
            return -1;
        }
    }

    if (img == 0)
    {
        string type = disk->vector_value("TYPE");

        transform(type.begin(), type.end(), type.begin(), (int(*)(int))toupper);

        if( type == "SWAP" )
        {
            string target = disk->vector_value("TARGET");

            if ( target.empty() )
            {
                string  dev_prefix = _default_dev_prefix;

                dev_prefix += "d";

                disk->replace("TARGET", dev_prefix);
            }
        }

        rc = -2;
    }
    else
    {
        rc = img->disk_attribute(disk, index, img_type);

        if ( rc == 0 )
        {
            update(img);
        }

        img->unlock();
    }

    oss << disk_id;
    disk->replace("DISK_ID",oss.str());

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImagePool::authorize_disk(VectorAttribute * disk,int uid, AuthRequest * ar)
{
    string  source;
    Image * img = 0;

    source = disk->vector_value("IMAGE");

    if (source.empty())
    {
        istringstream   is;
        int             image_id;

        source = disk->vector_value("IMAGE_ID");

        if (source.empty())
        {
            return;
        }

        is.str(source);
        is >> image_id;

        if( !is.fail() )
        {
            img = get(image_id,true);
        }
    }
    else
    {
        img = get(source,uid,true);
    }

    if (img == 0)
    {
        return;
    }

    ar->add_auth(AuthRequest::IMAGE,
                 img->get_oid(),
                 AuthRequest::USE,
                 img->get_uid(),
                 img->isPublic());

    img->unlock();
}
