/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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
                            const string& source, 
                            const string& destination) const
{
    ostringstream os;

    os << "CP " << oid << " " << source << " " << destination << endl;

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
                              const string& destination, 
                              const string& fs,
                              int           size_mb) const
{
    ostringstream os;

    os << "MKFS " << oid << " " << destination << " " << 
                     fs << " " << size_mb << endl;
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

                NebulaLog::log("ImG",Log::INFO, info.c_str());
            }

            return;
        }
    }
    else
        return;

    // Get the image from the pool 
    image = ipool->get(id,true);

    if ( image == 0 )
    {
        return;
    }

    // Driver Actions
    if ( action == "CP" )
    {
//        Nebula        &ne = Nebula::instance();
//        ImageManager* imgm= ne.get_imgm();

        if ( result == "SUCCESS" )
        {
            NebulaLog::log("ImG", Log::INFO, "CP SUCCESS");
        }
        else
        {
            NebulaLog::log("ImG", Log::INFO, "CP FAILURE");
        }
    }
    else if ( action == "MV" )
    {
        if ( result == "SUCCESS" )
        {
            NebulaLog::log("ImG", Log::INFO, "MV SUCCESS");
        }
        else
        {
            NebulaLog::log("ImG", Log::INFO, "MV FAILURE");
        }
    }
    else if ( action == "MKFS" )
    {
        if ( result == "SUCCESS" )
        {
            NebulaLog::log("ImG", Log::INFO, "MKFS SUCCESS");
        }
        else
        {
            NebulaLog::log("ImG", Log::INFO, "MKFS FAILURE");
        }
    }
    else if ( action == "RM" )
    {
        if ( result == "SUCCESS" )
        {
            NebulaLog::log("ImG", Log::INFO, "RM SUCCESS");
        }
        else
            NebulaLog::log("ImG", Log::INFO, "RM FAILURE");
        {
        }
    }
    else if (action == "LOG")
    {
        string info;

        getline(is,info);
        NebulaLog::log("ImG", Log::INFO, info.c_str());
    }

    image->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManagerDriver::recover()
{
    NebulaLog::log("ImG",Log::INFO,"Recovering Image Repository drivers");
}
