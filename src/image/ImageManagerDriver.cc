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

#include "ImageManagerDriver.h"
#include "ImagePool.h"

#include "NebulaLog.h"

#include "Nebula.h"
#include <sstream>

/* ************************************************************************** */
/* Driver ASCII Protocol Implementation                                       */
/* ************************************************************************** */

void ImageManagerDriver::cp(int           oid, 
                            const string& drv_msg) const
{
    ostringstream os;

    os << "CP " << oid << " " << drv_msg << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */

void ImageManagerDriver::stat(int           oid, 
                              const string& drv_msg) const
{
    ostringstream os;

    os << "STAT " << oid << " " << drv_msg << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */

void ImageManagerDriver::mkfs(int           oid, 
                              const string& drv_msg) const
{
    ostringstream os;

    os << "MKFS " << oid << " " << drv_msg << endl;
    
    write(os);
}

/* -------------------------------------------------------------------------- */

void ImageManagerDriver::rm(int oid, const string& drv_msg) const
{
    ostringstream os;

    os << "RM " << oid << " " << drv_msg << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/* ************************************************************************** */
/* MAD Interface                                                              */
/* ************************************************************************** */

static void stat_action(istringstream& is, int id, const string& result)
{
    string size_mb;
    string info;

    Nebula& nd        = Nebula::instance();
    ImageManager * im = nd.get_imagem();

    if ( result == "SUCCESS" )
    {
        if ( is.good() )
        {
            is >> size_mb >> ws;
        }

        if ( is.fail() )
        {
            im->notify_request(id, false, "Cannot get size from STAT");
        }

        im->notify_request(id, true, size_mb);
    }
    else
    {
        getline(is,info);

        im->notify_request(id, false, info);
    }
}

/* -------------------------------------------------------------------------- */

static void cp_action(istringstream& is, 
                      ImagePool*     ipool, 
                      int            id, 
                      const string&  result)
{
    string  source;
    string  info;

    Image * image;

    ostringstream oss;

    image = ipool->get(id,true);

    if ( image == 0 )
    {
        return;
    }

    if ( result == "FAILURE" )
    {
       goto error; 
    }

    if ( is.good() )
    {
        is >> source >> ws;
    }

    if ( is.fail() )
    {
        goto error;
    }
    
    image->set_source(source);

    image->set_state(Image::READY);

    ipool->update(image);

    image->unlock();

    NebulaLog::log("ImM", Log::INFO, "Image copied and ready to use.");

    return;

error:
    oss << "Error copying image in the repository";

    getline(is, info);

    if (!info.empty() && (info[0] != '-'))
    {
        oss << ": " << info;
    }
    
    NebulaLog::log("ImM", Log::ERROR, oss);

    image->set_template_error_message(oss.str());
    image->set_state(Image::ERROR);

    ipool->update(image);

    image->unlock();

    return;
}

/* -------------------------------------------------------------------------- */

static void mkfs_action(istringstream& is, 
                        ImagePool*     ipool, 
                        int            id, 
                        const string&  result)
{
    string  source;
    Image * image;
    bool    is_saving;

    string disk_id;
    string vm_id;
    string info;
    int    rc;

    VirtualMachine * vm;
    ostringstream    oss;

    Nebula& nd                  = Nebula::instance();
    VirtualMachinePool * vmpool = nd.get_vmpool();

    image = ipool->get(id, true);

    if ( image == 0 )
    {
        return;
    }

    if ( result == "FAILURE" )
    {
       goto error_img; 
    }

    if ( is.good() )
    {
        is >> source >> ws;
    }

    if ( is.fail() )
    {
        goto error_img;
    }

    is_saving = image->isSaving();    

    image->set_source(source);

    if (is_saving)
    {
        image->get_template_attribute("SAVED_DISK_ID", disk_id);
        image->get_template_attribute("SAVED_VM_ID",   vm_id);
    }
    else
    {
        image->set_state(Image::READY);

        NebulaLog::log("ImM", Log::INFO, "Image created and ready to use");
    }

    ipool->update(image);

    image->unlock();

    if ( ! is_saving )
    {
        return;
    }

    /* ---------------- Set up information for the Saved Image -------------- */

    vm = vmpool->get(vm_id, true);

    if ( vm == 0 )
    {
        goto error_save_get;
    }

    rc = vm->save_disk(disk_id, source, id);

    if ( rc == -1 )
    {
        goto error_save_state;
    }

    vmpool->update(vm);

    vm->unlock();

    return;

error_img:
    oss << "Error creating datablock";
    goto error;

error_save_get:
    oss << "Image created for SAVE_AS, but the associated VM does not exist.";
    goto error_save;

error_save_state:
    vm->unlock();
    oss << "Image created for SAVE_AS, but VM is no longer running";

error_save:
    image = ipool->get(id, true);

    if ( image == 0 )
    {
        NebulaLog::log("ImM", Log::ERROR, oss);
        return;
    }

error:
    getline(is,info);

    if (!info.empty() && (info[0] != '-'))
    {
        oss << ": " << info;
    }
    
    NebulaLog::log("ImM", Log::ERROR, oss);

    image->set_template_error_message(oss.str());
    image->set_state(Image::ERROR);

    ipool->update(image);

    image->unlock();

    return ;
}

/* -------------------------------------------------------------------------- */

static void rm_action(istringstream& is, 
                      ImagePool*     ipool, 
                      int            id, 
                      const string&  result)
{
    int     rc;
    string  tmp_error;
    string  source;
    string  info;
    Image * image;

    ostringstream oss;

    image = ipool->get(id, true);

    if ( image == 0 )
    {
        return;
    }

    source = image->get_source();

    rc = ipool->drop(image, tmp_error);

    image->unlock();

    if ( result == "FAILURE" )
    {
       goto error; 
    }
    else if ( rc < 0 )
    {
        goto error_drop;
    }

    NebulaLog::log("ImM", Log::INFO, "Image successfully removed.");

    return;

error_drop:
    oss << "Error removing image from DB: " << tmp_error 
        << ". Remove image source " << source << " to completely delete image.";

    NebulaLog::log("ImM", Log::ERROR, oss);
    return;

error:
    oss << "Error removing image from datastore. Manually remove image source "
        << source << " to completely delete the image";

    getline(is,info);

    if (!info.empty() && (info[0] != '-'))
    {
        oss << ": " << info;
    }
    
    NebulaLog::log("ImM", Log::ERROR, oss);

    image->set_template_error_message(oss.str());
    image->set_state(Image::ERROR);

    ipool->update(image);

    image->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManagerDriver::protocol(
    string&     message)
{
    istringstream is(message);
    ostringstream oss;

    string action;
    string result;
    string source;
    string info; 
    int    id;
    
    oss << "Message received: " << message;
    NebulaLog::log("ImG", Log::DEBUG, oss);

    // --------------------- Parse the driver message --------------------------

    if ( is.good() )
        is >> action >> ws;
    else
        return;

    if ( is.good() )
        is >> result >> ws;
    else
        return;

    if ( is.good() )
    {
        is >> id >> ws;

        if ( is.fail() )
        {
            if ( action == "LOG" )
            {
                is.clear();
                getline(is,info);

                NebulaLog::log("ImG",log_type(result[0]), info.c_str());
            }

            return;
        }
    }
    else
        return;

    if ( action == "STAT" )
    {
        stat_action(is, id, result);
    }
    else if ( action == "CP" )
    {
        cp_action(is, ipool, id, result);
    }
    else if ( action == "MKFS" )
    {
        mkfs_action(is, ipool, id, result);
    }
    else if ( action == "RM" )
    {
        rm_action(is, ipool, id, result);
    }
    else if (action == "LOG")
    {
        getline(is,info);
        NebulaLog::log("ImM", log_type(result[0]), info.c_str());
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManagerDriver::recover()
{
    NebulaLog::log("ImG",Log::INFO,"Recovering Image Repository drivers");
}

