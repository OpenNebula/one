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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Image * ImageManager::acquire_image(int image_id)
{
    Image * img;
    int     rc;

    img = ipool->get(image_id,true);

    if ( img == 0 )
    {
        return 0;
    }

    rc = acquire_image(img);

    if ( rc != 0 )
    {
        img->unlock();
        img = 0;
    }

    return img;
}

/* -------------------------------------------------------------------------- */

Image * ImageManager::acquire_image(const string& name, int uid)
{
    Image * img;
    int     rc;

    img = ipool->get(name,uid,true);

    if ( img == 0 )
    {
        return 0;
    }

    rc = acquire_image(img);

    if ( rc != 0 )
    {
        img->unlock();
        img = 0;
    }

    return img;
}

/* -------------------------------------------------------------------------- */

int ImageManager::acquire_image(Image *img)
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
                 rc = -1;
             }
             else
             {
                 img->inc_running();
                 ipool->update(img);
             }
        break;

        case Image::DISABLED:
        case Image::LOCKED:
        case Image::ERROR:
        default:
           rc = -1;
        break;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::move_image(Image *img, const string& source)
{
    const ImageManagerDriver* imd = get();
    ostringstream oss;

    if ( imd == 0 )
    {
        NebulaLog::log("ImM",Log::ERROR,
                "Could not get driver to update repository");
        return;
    }

    oss << "Moving disk " << source << " to repository image " 
        << img->get_oid();

    imd->mv(img->get_oid(),source,img->get_source());

    NebulaLog::log("ImM",Log::INFO,oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::disk_to_image(const string& disk_path, 
                                 int           disk_num, 
                                 const string& save_id)
{
    int sid;

    istringstream iss;
    Image *       img;

    ostringstream disk_file;

    iss.str(save_id);

    iss >> sid;

    img = ipool->get(sid,true);

    if ( img == 0 )
    {
        NebulaLog::log("ImM",Log::ERROR,"Could not get image to saveas disk.");
    }
    else
    {
        disk_file << disk_path << "/disk." << disk_num;

        move_image(img,disk_file.str());
    }

    img->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::release_image(int           iid,
                                 const string& disk_path, 
                                 int           disk_num, 
                                 const string& save_id)
{
    int rvms;

    int sid = -1;

    istringstream iss;
    Image *       img;

    ostringstream disk_file;

    if ( save_id.empty() == false )
    {
        iss.str(save_id);

        iss >> sid;
    }

    img = ipool->get(iid,true);

    if ( img == 0 )
    {
        return;
    }

    switch (img->get_state())
    {
        case Image::USED:
            rvms = img->dec_running();

            if ( img->isPersistent() && !disk_path.empty() )
            {
                disk_file << disk_path << "/disk." << disk_num;

                img->set_state(Image::LOCKED);

                move_image(img,disk_file.str());

                ipool->update(img);

                img->unlock();
            }
            else 
            {
                if ( rvms == 0)
                {
                    img->set_state(Image::READY);
                }

                ipool->update(img);

                img->unlock();

                if ( sid != -1 )
                {
                    img = ipool->get(sid,true);

                    if ( img == 0 )
                    {
                        NebulaLog::log("ImM",Log::ERROR,
                            "Could not get image to saveas disk.");
                    }
                    else
                    {
                        disk_file << disk_path << "/disk." << disk_num;

                        move_image(img,disk_file.str());
                    }

                    img->unlock();
                }
            }
        break;

        case Image::DISABLED:
        case Image::READY:
        case Image::ERROR:
        case Image::LOCKED:
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

int ImageManager::delete_image(int iid)
{
    Image * img;
    string  source;

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
                return -1; //Can not remove images in use
            }
        break; 

        case Image::USED:
            img->unlock();
            return -1; //Can not remove images in use
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
        return -1;
    }

    source = img->get_source();

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
        imd->rm(img->get_oid(),img->get_source());
    }

    img->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::register_image(int iid)
{
    const ImageManagerDriver* imd = get();
    ostringstream oss;

    string path;
    Image* img;

    if ( imd == 0 )
    {
        NebulaLog::log("ImM",Log::ERROR,
                "Could not get driver to update repository");
        return -1;
    }

    img = ipool->get(iid,true);

    if (img == 0)
    {
        return -1;
    }

    path = img->get_path();

    if ( path.empty() == true ) //NO PATH -> USE SOURCE OR MKFS FOR DATABLOCK
    {
        if ( img->get_type() == Image::DATABLOCK)
        {
            string fs   = img->get_fstype();
            int    size = img->get_size();

            imd->mkfs(img->get_oid(), fs, size);
         
            oss << "Creating disk at " << img->get_source() << " of " 
                << size << "Mb with format " << fs;
        }
        else
        {
            string source = img->get_source();

            if (source != "-") //SAVE_AS IMAGE DO NOT ENABLE THE IMAGE
            {
                img->set_state(Image::READY);
                ipool->update(img);

                oss << "Using source " << img->get_source() 
                    << " from template for image " << img->get_name();
            }
        }
    }
    else //PATH -> COPY TO REPOSITORY AS SOURCE
    {
        imd->cp(img->get_oid(), path);
        oss << "Copying " << path <<" to repository for image "<<img->get_oid();
    }
    
    NebulaLog::log("ImM",Log::INFO,oss);

    img->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

