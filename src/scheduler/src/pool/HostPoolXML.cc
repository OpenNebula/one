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

#include "HostPoolXML.h"


int HostPoolXML::set_up()
{
    ostringstream   oss;
    int             rc;

    rc = PoolXML::set_up();

    if ( rc == 0 )
    {
        oss.str("");
        oss << "Discovered Hosts (enabled):";

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

void HostPoolXML::add_object(xmlNodePtr node)
{
    if ( node == 0 || node->children == 0 )
    {
        NebulaLog::log("HOST",Log::ERROR,
                       "XML Node does not represent a valid Host");

       return;
    }

    xmlChar *     str_ptr = xmlNodeGetContent(node->children);
    istringstream iss(reinterpret_cast<char *>(str_ptr));

    int             hid;
    xmlrpc_c::value result;

    iss >> hid;
    xmlFree(str_ptr);

    client->call(client->get_endpoint(),            // serverUrl
                  "one.host.info",                  // methodName
                  "si",                             // arguments format
                  &result,                          // resultP
                  client->get_oneauth().c_str(),    // argument 0
                  hid);                             // argument 1

    vector<xmlrpc_c::value> values =
                    xmlrpc_c::value_array(result).vectorValueValue();

    bool   success = xmlrpc_c::value_boolean( values[0] );
    string message = xmlrpc_c::value_string(  values[1] );

    if( !success )
    {
        ostringstream oss;

        oss << "ONE returned error while retrieving info for Host " << hid;
        oss << ":" << endl;
        oss << message;

        NebulaLog::log("HOST",Log::ERROR,oss);
    }
    else
    {
        HostXML* host = new HostXML( message );

        objects.insert( pair<int,ObjectXML*>(hid, host) );
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPoolXML::load_info(xmlrpc_c::value &result)
{
    try
    {
        client->call( client->get_endpoint(),           // serverUrl
                      "one.hostpool.info",              // methodName
                      "s",                              // arguments format
                      &result,                          // resultP
                      client->get_oneauth().c_str()     // argument
                    );
        return 0;
    }
    catch (exception const& e)
    {
        ostringstream   oss;
        oss << "Exception raised: " << e.what();

        NebulaLog::log("HOST", Log::ERROR, oss);

        return -1;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

