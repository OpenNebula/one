/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

NebulaTemplate::NebulaTemplate(string& nebula_location)
{
    ostringstream       os;
    SingleAttribute *   attribute;
    string              value;
    Nebula&             nd = Nebula::instance();
        
    conf_file  = nebula_location + "/etc/";
    conf_file += conf_name;
    
    // VM_DIR
    os << nebula_location << "/var";
    value = os.str();
    
    attribute = new SingleAttribute("VM_DIR",value);
    conf_default.insert(make_pair(attribute->name(),attribute));
        
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
       
    //VM_RDIR    
    value = nd.get_nebula_location() + "/var";
    
    attribute = new SingleAttribute("VM_RDIR",value);
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

