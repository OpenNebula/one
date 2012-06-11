/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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
#include "Nebula.h"
#include "PoolObjectAuth.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
string ImagePool::_default_type;
string ImagePool::_default_dev_prefix;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ImagePool::ImagePool(SqlDB *       db,
                     const string& __default_type,
                     const string& __default_dev_prefix,
                     vector<const Attribute *>& restricted_attrs):
                        PoolSQL(db, Image::table, true)
{
    ostringstream sql;

    // Init static defaults
    _default_type       = __default_type;
    _default_dev_prefix = __default_dev_prefix;

    // Set default type
    if (_default_type != "OS"       &&
        _default_type != "CDROM"    &&
        _default_type != "DATABLOCK" )
    {
        NebulaLog::log("IMG", Log::ERROR, "Bad default for type, setting OS");
        _default_type = "OS";
    }

    // Set restricted attributes
    ImageTemplate::set_restricted_attributes(restricted_attrs);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImagePool::allocate (
        int             uid,
        int             gid,
        const string&   uname,
        const string&   gname,
        ImageTemplate*  img_template,
        int             ds_id,
        const string&   ds_name,
        Image::DiskType disk_type,
        const string&   ds_data,
        int *           oid,
        string&         error_str)
{
    Image *         img;
    Image *         img_aux = 0;
    string          name;
    ostringstream   oss;

    img = new Image(uid, gid, uname, gname, img_template);

    // -------------------------------------------------------------------------
    // Check name & duplicates
    // -------------------------------------------------------------------------
    img->get_template_attribute("NAME", name);

    if ( name.empty() )
    {
        goto error_name;
    }

    if ( name.length() > 128 )
    {
        goto error_name_length;
    }

    img_aux = get(name,uid,false);

    if( img_aux != 0 )
    {
        goto error_duplicated;
    }

    img->ds_name = ds_name;
    img->ds_id   = ds_id;
    
    img->disk_type = disk_type;

    // ---------------------------------------------------------------------
    // Insert the Object in the pool & Register the image in the repository
    // ---------------------------------------------------------------------
    *oid = PoolSQL::allocate(img, error_str);
    
    if ( *oid != -1 )
    {
        Nebula&        nd     = Nebula::instance();
        ImageManager * imagem = nd.get_imagem();

        if ( imagem->register_image(*oid, ds_data) == -1 )
        {
            error_str = "Failed to copy image to repository. "
                        "Image left in ERROR state.";
            return -1;
        }
    }

    return *oid;

error_name:
    oss << "NAME cannot be empty.";
    goto error_common;

error_name_length:
    oss << "NAME is too long; max length is 128 chars.";
    goto error_common;

error_duplicated:
    oss << "NAME is already taken by IMAGE "
        << img_aux->get_oid() << ".";
    goto error_common;

error_common:
    delete img;

    *oid = -1;
    error_str = oss.str();

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int get_disk_uid(VectorAttribute *  disk, int _uid)
{
    istringstream  is;

    string uid_s ;
    string uname;
    int    uid;

    if (!(uid_s = disk->vector_value("IMAGE_UID")).empty())
    {
        is.str(uid_s);
        is >> uid;

        if( is.fail() )
        {
            return -1;
        }
    }
    else if (!(uname = disk->vector_value("IMAGE_UNAME")).empty())
    {
        User *     user;
        Nebula&    nd    = Nebula::instance();
        UserPool * upool = nd.get_upool();
        
        user = upool->get(uname,true);
        
        if ( user == 0 )
        {
            return -1;
        }

        uid = user->get_oid();

        user->unlock();
    }
    else
    {
        uid = _uid;        
    }

    return uid;
}
        
/* -------------------------------------------------------------------------- */

static int get_disk_id(const string& id_s)
{
    istringstream  is;
    int            id;

    is.str(id_s);
    is >> id;

    if( is.fail() )
    {
        return -1;
    }

    return id;
}

/* -------------------------------------------------------------------------- */

int ImagePool::disk_attribute(VectorAttribute * disk,
                              int               disk_id,
                              Image::ImageType& img_type,
                              string&           dev_prefix,
                              int               uid,
                              int&              image_id,
                              string&           error_str)
{
    string  source;
    Image * img = 0;
    int     rc  = 0;
    int     datastore_id;
    int     iid;

    ostringstream oss;

    Nebula&         nd      = Nebula::instance();
    ImageManager *  imagem  = nd.get_imagem();

    if (!(source = disk->vector_value("IMAGE")).empty())
    {
        int uiid = get_disk_uid(disk,uid);
       
        if ( uiid == -1)
        {
            error_str = "Cannot get user set in IMAGE_UID or IMAGE_UNAME.";
            return -1; 
        }

        img = imagem->acquire_image(source, uiid, error_str);

        if ( img == 0 )
        {
            return -1;
        }

        iid = img->get_oid();
    }
    else if (!(source = disk->vector_value("IMAGE_ID")).empty())
    {
        iid = get_disk_id(source);

        if ( iid == -1)
        {
            error_str = "Wrong ID set in IMAGE_ID";
            return -1; 
        }

        img = imagem->acquire_image(iid, error_str);

        if ( img == 0 )
        {
            return -1;
        }
    }
    else //Not using the image repository (volatile DISK)
    {
        string type = disk->vector_value("TYPE");

        transform(type.begin(),type.end(),type.begin(),(int(*)(int))toupper);

        if ( type == "SWAP" || type == "FS" ) 
        {
            dev_prefix = _default_dev_prefix;
            img_type   = Image::DATABLOCK;
        }
        else
        {
            error_str = "Unknown disk type " + type;
            return -1;
        }
    }

    if ( img != 0 )
    {
        DatastorePool * ds_pool = nd.get_dspool();
        Datastore *     ds;

        iid = img->get_oid();
        rc  = img->disk_attribute(disk, img_type, dev_prefix);

        image_id     = img->get_oid();
        datastore_id = img->get_ds_id();

        img->unlock();

        if (rc == -1)
        {
            imagem->release_image(iid, false);
            error_str = "Unknown internal error";

            return -1;
        }

        ds = ds_pool->get(datastore_id, true);

        if ( ds == 0 )
        {
            imagem->release_image(iid, false);
            error_str = "Associated datastore for the image does not exist";

            return -1;
        }

        ds->disk_attribute(disk);

        ds->unlock();
    }

    oss << disk_id;
    disk->replace("DISK_ID",oss.str());

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImagePool::authorize_disk(VectorAttribute * disk,int uid, AuthRequest * ar)
{
    string          source;
    Image *         img = 0;
    
    PoolObjectAuth  perm;

    if (!(source = disk->vector_value("IMAGE")).empty())
    {
        int uiid = get_disk_uid(disk,uid);
       
        if ( uiid == -1)
        {
            return; 
        }

        img = get(source , uiid, true);

        if ( img != 0 )
        {
            disk->replace("IMAGE_ID", img->get_oid());
        }
    }
    else if (!(source = disk->vector_value("IMAGE_ID")).empty())
    {
        int iid = get_disk_id(source);

        if ( iid == -1)
        {
            return; 
        }

        img = get(iid, true);
    }

    if (img == 0)
    {
        return;
    }

    img->get_permissions(perm);

    img->unlock();

    ar->add_auth(AuthRequest::USE, perm);
}
