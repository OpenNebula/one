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

#include "NebulaTemplate.h"
#include "Nebula.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * NebulaTemplate::conf_name="oned.conf";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

NebulaTemplate::NebulaTemplate(string& etc_location, string& var_location)
{
    ostringstream       os;
    SingleAttribute *   attribute;
    string              value;

    conf_file = etc_location + conf_name;

    // POLL_INTERVAL
    value = "300";
    
    attribute = new SingleAttribute("VM_POLLING_INTERVAL",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // MANAGER_TIMER
    value = "30";
    
    attribute = new SingleAttribute("MANAGER_TIMER",value);
    conf_default.insert(make_pair(attribute->name(),attribute));
    
    // MONITOR_INTERVAL
    value = "300";
    
    attribute = new SingleAttribute("HOST_MONITORING_INTERVAL",value);
    conf_default.insert(make_pair(attribute->name(),attribute));
    
    //XML-RPC Server PORT
    value = "2633";
    
    attribute = new SingleAttribute("PORT",value);
    conf_default.insert(make_pair(attribute->name(),attribute));
       
    //VM_DIR        
    attribute = new SingleAttribute("VM_DIR",var_location);
    conf_default.insert(make_pair(attribute->name(),attribute));
    
    //MAC_PREFIX    
    value = "00:01";
    
    attribute = new SingleAttribute("MAC_PREFIX",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //NETWORK_SIZE    
    value = "254";
    
    attribute = new SingleAttribute("NETWORK_SIZE",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //NETWORK_SIZE
    value = "5900";

    attribute = new SingleAttribute("VNC_BASE_PORT",value);
    conf_default.insert(make_pair(attribute->name(),attribute));    
    
    //DEBUG_LEVEL    
    value = Log::WARNING;
    
    attribute = new SingleAttribute("DEBUG_LEVEL",value);
    conf_default.insert(make_pair(attribute->name(),attribute));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


int NebulaTemplate::load_configuration()
{
    char *                              error = 0;
    map<string, Attribute *>::iterator  iter, j;    
    int                                 rc;
    
    string      aname;
    Attribute * attr;
    
    rc = parse(conf_file.c_str(), &error);
    
    if ( rc != 0 && error != 0)
    {

        cout << "\nError while parsing configuration file:\n" << error << endl;

        free(error);
        
        return -1;
    }
    
    for(iter=conf_default.begin();iter!=conf_default.end();)
    {
        aname = iter->first;
        attr  = iter->second;
        
        j = attributes.find(aname);
        
        if ( j == attributes.end() )
        {
            attributes.insert(make_pair(aname,attr));
            iter++;
        }
        else
        {
            delete iter->second;
            conf_default.erase(iter++);
        }
    }
    
    return 0;
}

