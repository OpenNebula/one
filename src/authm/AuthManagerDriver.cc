/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "AuthManagerDriver.h"
#include "AuthManager.h"
#include "NebulaLog.h"

#include "Nebula.h"
#include <sstream>

/* ************************************************************************** */
/* Driver ASCII Protocol Implementation                                       */
/* ************************************************************************** */

void AuthManagerDriver::authorize(int           oid,
                                  int           uid,
                                  const string& reqs,
                                  bool          acl) const
{
    ostringstream os;

    os << "AUTHORIZE " << oid << " " << uid << " " << reqs << " " << acl <<endl;

    write(os);
}

void AuthManagerDriver::authenticate(int           oid,
                                     int           uid,
                                     const string& driver,
                                     const string& username,
                                     const string& password,
                                     const string& session) const
{
    ostringstream os;

    os << "AUTHENTICATE " << oid << " "
                          << uid << " "
                          << driver << " "
                          << username << " "
                          << password << " "
                          << session  << endl;

    write(os);
}

/* ************************************************************************** */
/* MAD Interface                                                              */
/* ************************************************************************** */

void AuthManagerDriver::protocol(const string& message) const
{
    istringstream is(message);
    ostringstream os;

    string        action;
    string        result;
    string        info="";

    int           id;

    os << "Message received: " << message;
    NebulaLog::log("AuM", Log::DEBUG, os);

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
                is.clear();
                getline(is,info);
                NebulaLog::log("AuM", log_type(result[0]), info.c_str());
            }

            return;
        }
    }
    else
        return;

    getline(is,info);

    if (action == "LOG")
    {
        NebulaLog::log("AuM",Log::INFO,info.c_str());
    }
    else if (result == "SUCCESS")
    {
        authm->notify_request(id,true,info);
    }
    else
    {
        authm->notify_request(id,false,info);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AuthManagerDriver::recover()
{
    NebulaLog::log("AuM",Log::INFO,"Recovering Authorization drivers");
}
