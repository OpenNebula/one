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

void ImageManagerDriver::mv(int           oid, 
                            const string& source, 
                            const string& destination) const
{
    ostringstream os;

    os << "MV " << oid << " " << source << " " << destination << endl;

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

void ImageManagerDriver::protocol(
    string&     message)
{
    istringstream is(message);
    ostringstream os;

    string        action;
    string        result;

    int           id;
    Image *       image;
    string        source;
    unsigned int  size_mb;

    string        info;

    os << "Message received: " << message;
    NebulaLog::log("ImG", Log::DEBUG, os);

    // Parse the driver message
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
                string info;

                is.clear();
                getline(is,info);

                NebulaLog::log("ImG",log_type(result[0]), info.c_str());
            }

            return;
        }
    }
    else
        return;

    // Parse driver message for CP, MV and MKFS
    // <CP|MV|MKFS> SUCESS IMAGE_ID SOURCE SIZE
    if ( (result == "SUCCESS") && (action != "RM") )
    {
        if ( is.good() )
        {
            is >> source >> ws;
        }

        if ( is.good() )
        {
            is >> size_mb >> ws;
        }

        if ( is.fail() )
        {
            result = "FAILURE";
        }
    }
   

    // Get the image from the pool 
    image = ipool->get(id,true);

    if ( image == 0 )
    {
        return;
    }

    // Driver Actions
    if ( action == "CP" )
    {
        if ( result == "SUCCESS" )
        {
            image->set_source(source);
            image->set_size(size_mb);

            image->set_state(Image::READY);

            ipool->update(image);

            NebulaLog::log("ImM", Log::INFO, "Image copied and ready to use.");
        }
        else
        {
            goto error_cp;
        }
    }
    else if ( action == "MKFS" )
    {
        if ( result == "SUCCESS" )
        {
            bool   is_saving = image->isSaving();

            string disk_id;
            string vm_id;
            int    rc;

            image->set_source(source);

            if (is_saving)
            {
                image->get_template_attribute("SAVED_DISK_ID",disk_id);
                image->get_template_attribute("SAVED_VM_ID",  vm_id);
            }
            else
            {
                image->set_size(size_mb);

                image->set_state(Image::READY);

                NebulaLog::log("ImM", Log::INFO, 
                               "Image created and ready to use");
            }

            ipool->update(image);

            image->unlock();

            if (is_saving)
            {
                Nebula& nd = Nebula::instance();

                VirtualMachinePool * vmpool = nd.get_vmpool();

                VirtualMachine * vm;
                istringstream    iss(vm_id);

                int vm_id_i;

                iss >> vm_id_i;

                vm = vmpool->get(vm_id_i, true);

                if ( vm == 0 )
                {
                    goto error_save_no_vm;
                }

                rc = vm->save_disk(disk_id, source, id);

                if ( rc == -1 )
                {
                    vm->unlock();
                    goto error_save_state_vm;
                }

                vmpool->update(vm);

                vm->unlock();
            }

            return;
        }
        else
        {
            goto error_mkfs;
        }
    }
    else if ( action == "RM" )
    {
        int    rc;
        string tmp_error;
 
        rc = ipool->drop(image, tmp_error);

        if ( rc < 0 )
        {
            NebulaLog::log("ImM",Log::ERROR,"Image could not be removed from DB");
        }

        if ( result == "SUCCESS" )
        {
            NebulaLog::log("ImM",Log::INFO,"Image successfully removed.");
        }
        else
        {
            goto error_rm;
        }
    }
    else if (action == "LOG")
    {
        getline(is,info);
        NebulaLog::log("ImM", log_type(result[0]), info.c_str());
    }

    image->unlock();

    return;

error_cp:
    os.str("");
    os << "Error copying image in the repository";
    goto error_common;

error_mkfs:
    os.str("");
    os << "Error creating datablock";
    goto error_common;

error_rm:
    os.str("");
    os << "Error removing image from repository. Remove file " << image->get_source()
       << " to completely delete image.";

    image->unlock();

    getline(is,info);

    if (!info.empty() && (info[0] != '-'))
    {
        os << ": " << info;
    }

    NebulaLog::log("ImM", Log::ERROR, os);
    return;

error_save_no_vm:
    os.str("");
    os << "Image created for SAVE_AS, but the associated VM does not exist.";

    goto error_save_common;

error_save_state_vm:
    os.str("");
    os << "Image created for SAVE_AS, but VM is no longer running";

    goto error_save_common;

error_save_common:
    image = ipool->get(id, true);

    if (image == 0 )
    {
        return;
    }

error_common:
    getline(is,info);

    if (!info.empty() && (info[0] != '-'))
    {
        os << ": " << info;
        image->set_template_error_message(os.str());
    }

    NebulaLog::log("ImM", Log::ERROR, os);

    image->set_state(Image::ERROR);
    ipool->update(image);

    image->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManagerDriver::recover()
{
    NebulaLog::log("ImG",Log::INFO,"Recovering Image Repository drivers");
}

