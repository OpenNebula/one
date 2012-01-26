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
                            const string& source) const
{
    ostringstream os;

    os << "CP " << oid << " " << source << endl;

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
                              const string& fs,
                              int           size_mb) const
{
    ostringstream os;

    os << "MKFS " << oid << " " << fs << " " << size_mb << endl;
    write(os);
}

/* -------------------------------------------------------------------------- */

void ImageManagerDriver::rm(int oid, const string& destination) const
{
    ostringstream os;

    os << "RM " << oid << " " << destination << endl;

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
    else if ( action == "MV" )
    {
        if ( result == "SUCCESS" )
        {
            if (image->get_source() == "-")
            {
                image->set_source(source);
            }

            image->set_size(size_mb);

            image->set_state(Image::READY);

            ipool->update(image);

            NebulaLog::log("ImM", Log::INFO, "Image saved and ready to use.");
        }
        else
        {
            goto error_mv;
        }
    }
    else if ( action == "MKFS" )
    {
        if ( result == "SUCCESS" )
        {
            image->set_source(source);
            image->set_size(size_mb);

            image->set_state(Image::READY);

            ipool->update(image);

            NebulaLog::log("ImM", Log::INFO, "Image created and ready to use");
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

error_mv:
    os.str("");
    os << "Error saving image to the repository";
    goto error_common;

error_mkfs:
    os.str("");
    os << "Error creating datablock";
    goto error_common;

error_rm:
    image->unlock();

    os.str("");
    os << "Error removing image from repository. Remove file " << source
       << "  to completely delete image.";

    getline(is,info);

    if (!info.empty() && (info[0] != '-'))
    {
        os << ": " << info;
    }

    NebulaLog::log("ImM", Log::ERROR, os);

    return;

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

