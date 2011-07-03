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

#include "UserPoolXML.h"


int UserPoolXML::set_up()
{
    ostringstream   oss;
    int             rc;

    rc = PoolXML::set_up();

    if ( rc == 0 )
    {
        oss.str("");
        oss << "Users (enabled):";

        map<int,ObjectXML*>::iterator it;

        for (it=objects.begin();it!=objects.end();it++)
        {
            oss << " " << it->first;
        }

        NebulaLog::log("HOST",Log::DEBUG,oss);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void UserPoolXML::add_object(xmlNodePtr node)
{
    if ( node == 0 || node->children == 0 )
    {
        NebulaLog::log("USER",Log::ERROR,
                       "XML Node does not represent a valid User");

        return;
    }

    UserXML* user = new UserXML(node);

    objects.insert(pair<int,ObjectXML*>(user->get_uid(), user));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPoolXML::load_info(xmlrpc_c::value &result)
{
    try
    {
        client->call(client->get_endpoint(),           // serverUrl
                     "one.userpool.info",              // methodName
                     "s",                              // arguments format
                     &result,                          // resultP
                     client->get_oneauth().c_str());   // argument
        return 0;
    }
    catch (exception const& e)
    {
        ostringstream   oss;
        oss << "Exception raised: " << e.what();

        NebulaLog::log("USER", Log::ERROR, oss);

        return -1;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

