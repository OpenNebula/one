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

#include "ImageManager.h"
#include "NebulaLog.h"
#include "ImagePool.h"
#include "SSLTools.h"
#include "SyncRequest.h"
#include "Template.h"
#include "Nebula.h"


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Image * ImageManager::acquire_image(int image_id, string& error)
{
    Image * img;
    int     rc;

    img = ipool->get(image_id,true);

    if ( img == 0 )
    {
        ostringstream oss;
        oss << "Image with ID: " << image_id  << " does not exists";

        error = oss.str();
        return 0;
    }

    rc = acquire_image(img, error);

    if ( rc != 0 )
    {
        img->unlock();
        img = 0;
    }

    return img;
}

/* -------------------------------------------------------------------------- */

Image * ImageManager::acquire_image(const string& name, int uid, string& error)
{
    Image * img;
    int     rc;

    img = ipool->get(name,uid,true);

    if ( img == 0 )
    {
        ostringstream oss;
        oss << "Image " << name << " does not exists for user " << uid;

        error = oss.str();
        return 0;
    }

    rc = acquire_image(img, error);

    if ( rc != 0 )
    {
        img->unlock();
        img = 0;
    }

    return img;
}

/* -------------------------------------------------------------------------- */

int ImageManager::acquire_image(Image *img, string& error)
{
    int rc = 0;

    switch (img->get_state())
    {
        case Image::READY:
            img->inc_running();
            img->set_state(Image::USED);
            ipool->update(img);
        break;

        case Image::USED:
             if (img->isPersistent())
             {
                 error = "Cannot acquire persistent image, it is already in use";
                 rc    = -1;
             }
             else
             {
                 img->inc_running();
                 ipool->update(img);
             }
        break;

        case Image::DISABLED:
             error = "Cannot acquire image, it is disabled";
             rc    = -1;
        break;
        case Image::LOCKED:
             error = "Cannot acquire image, it is locked";
             rc    = -1;
        break;
        case Image::ERROR:
             error = "Cannot acquire image, it is in an error state";
             rc    = -1;
        break;
        default:
           rc    = -1;
        break;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::release_image(int iid, bool failed)
{
    int rvms;

    Image * img;

    ostringstream disk_file;

    img = ipool->get(iid,true);

    if ( img == 0 )
    {
        return;
    }

    switch (img->get_state())
    {
        case Image::USED:
            rvms = img->dec_running();

            if (img->isPersistent())
            {
                if (failed == true)
                {
                    img->set_state(Image::ERROR);
                }
                else
                {                
                    img->set_state(Image::READY);
                }
            }
            else if ( rvms == 0 )
            {
                img->set_state(Image::READY);
            }

            ipool->update(img);

            img->unlock();
        break;

        case Image::LOCKED: //SAVE_AS images are LOCKED till released
            if ( img->isSaving() )
            {
                if (failed == true)
                {
                    img->set_state(Image::ERROR);
                }
                else
                {
                    img->set_state(Image::READY);
                }

                ipool->update(img);
            }
            else
            {
                NebulaLog::log("ImM",Log::ERROR,
                    "Trying to release image in wrong state.");
            }

            img->unlock();
            break;

        case Image::DISABLED:
        case Image::READY:
        case Image::ERROR:
            NebulaLog::log("ImM",Log::ERROR,
                "Trying to release image in wrong state.");
        default:
            img->unlock();
        break;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::enable_image(int iid, bool to_enable)
{
    int rc = 0;
    Image * img;

    img = ipool->get(iid,true);

    if ( img == 0 )
    {
        return -1;
    }

    if ( to_enable == true )
    {
        switch (img->get_state())
        {
            case Image::DISABLED:
            case Image::ERROR:
                img->set_state(Image::READY);
                ipool->update(img);
            case Image::READY:
            break;
            default:
                rc = -1;
            break;
        }
    }
    else 
    {
        switch (img->get_state())
        {
            case Image::READY:
            case Image::ERROR:
                img->set_state(Image::DISABLED);
                ipool->update(img);
            case Image::DISABLED:
            break;
            default:
                rc = -1;
            break;
        }
    }

    img->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::delete_image(int iid, const string& ds_data)
{
    Image * img;

    string   source;
    string   img_tmpl;
    string * drv_msg;

    int size;
    int ds_id;

    int    uid;
    int    gid;
    Group* group;
    User * user;

    Nebula&    nd    = Nebula::instance();
    UserPool * upool = nd.get_upool();
    GroupPool* gpool = nd.get_gpool();

    img = ipool->get(iid,true);

    if ( img == 0 )
    {
        return -1;
    }

    switch(img->get_state())
    {
        case Image::READY:
            if ( img->get_running() != 0 )
            {
                img->unlock();
                return -1; //Cannot remove images in use
            }
        break; 

        case Image::USED:
            img->unlock();
            return -1; //Cannot remove images in use
        break;

        case Image::INIT:
        case Image::DISABLED:
        case Image::LOCKED:
        case Image::ERROR:
        break;
    }

    const ImageManagerDriver* imd = get();

    if ( imd == 0 )
    {
        img->unlock();
        return -1;
    }

    drv_msg = format_message(img->to_xml(img_tmpl), ds_data);
    source  = img->get_source();
    size    = img->get_size();
    ds_id   = img->get_ds_id();
    uid     = img->get_uid();
    gid     = img->get_gid();
    
    if (source.empty())
    {
        string err_str;
        int    rc;
        
        rc = ipool->drop(img, err_str);

        if ( rc < 0 )
        {
            NebulaLog::log("ImM",Log::ERROR,
                "Image could not be removed from DB");
        }
    }
    else
    {
        imd->rm(img->get_oid(), *drv_msg);
    }

    img->unlock();

    delete drv_msg;

    /* -------------------- Update Group & User quota counters -------------- */
    
    Template img_usage;

    img_usage.add("DATASTORE", ds_id);
    img_usage.add("SIZE", size);

    if ( uid != UserPool::ONEADMIN_ID )
    {
        user = upool->get(uid, true);

        if ( user != 0 )
        {
            user->quota.ds_del(&img_usage);

            upool->update(user);

            user->unlock();
        } 
    }

    if ( gid != GroupPool::ONEADMIN_ID )
    {
        group = gpool->get(gid, true);

        if ( group != 0 )
        {
            group->quota.ds_del(&img_usage);

            gpool->update(group);

            group->unlock();
        }        
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::register_image(int iid, const string& ds_data)
{
    const ImageManagerDriver* imd = get();

    ostringstream oss;
    Image *       img;

    string        path;
    string        img_tmpl;
    string *      drv_msg;


    if ( imd == 0 )
    {
        NebulaLog::log("ImM",Log::ERROR, "Could not get datastore driver");
        return -1;
    }

    img = ipool->get(iid,true);

    if (img == 0)
    {
        return -1;
    }

    drv_msg = format_message(img->to_xml(img_tmpl), ds_data);
    path    = img->get_path();

    if ( path.empty() == true ) //NO PATH
    {
        string source = img->get_source();

        if ( img->isSaving() || img->get_type() == Image::DATABLOCK )
        {
            imd->mkfs(img->get_oid(), *drv_msg);
         
            oss << "Creating disk at " << source 
                << " of "<<  img->get_size()
                << "Mb (type: " <<  img->get_fstype() << ")";
        }
        else if ( !source.empty() ) //Source in Template
        {
            img->set_state(Image::READY);
            ipool->update(img);

            oss << "Using source " << source
                << " from template for image " << img->get_name();
        }
    }
    else //PATH -> COPY TO REPOSITORY AS SOURCE
    {
        imd->cp(img->get_oid(), *drv_msg);
        oss << "Copying " << path <<" to repository for image "<<img->get_oid();
    }
    
    NebulaLog::log("ImM",Log::INFO,oss);

    img->unlock();

    delete drv_msg;

    return 0;
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::stat_image(Template*     img_tmpl, 
                             const string& ds_data, 
                             string&       res)
{
    const ImageManagerDriver* imd = get();

    string* drv_msg;
    string  type_att;

    ostringstream  img_data;

    SyncRequest sr;

    int rc = 0;

    img_tmpl->get("TYPE", type_att);

    switch (Image::str_to_type(type_att))
    {
        case Image::OS:
        case Image::CDROM:
            img_tmpl->get("SOURCE", res);

            if (!res.empty())
            {
                res = "0";
                return 0;
            }

            img_tmpl->get("PATH", res);

            if (res.empty())
            {
                res = "Either PATH or SOURCE are required for " + type_att;
                return -1;
            }

            img_data << "<IMAGE><PATH>" << res << "</PATH></IMAGE>";
            break;

        case Image::DATABLOCK:
            img_tmpl->get("SIZE", res);

            if (res.empty())
            {
                res = "SIZE attribute is mandatory for DATABLOCK.";
                return -1;
            }
            
            return 0;
    }

    add_request(&sr);
     
    drv_msg = format_message(img_data.str(), ds_data);

    imd->stat(sr.id, *drv_msg);

    sr.wait();

    delete drv_msg;

    res = sr.message;

    if ( sr.result != true )
    {
        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string * ImageManager::format_message(
    const string& img_data,
    const string& ds_data)
{
    ostringstream oss;

    oss << "<DS_DRIVER_ACTION_DATA>"
        << img_data
        << ds_data
        << "</DS_DRIVER_ACTION_DATA>";

    return SSLTools::base64_encode(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

