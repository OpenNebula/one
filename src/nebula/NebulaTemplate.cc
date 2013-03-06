/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int NebulaTemplate::load_configuration()
{
    char * error = 0;
    int    rc;

    string      aname;
    Attribute * attr;

    map<string, Attribute *>::iterator  iter, j;

    set_conf_default();

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
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * OpenNebulaTemplate::conf_name="oned.conf";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OpenNebulaTemplate::set_conf_default()
{
    SingleAttribute *   attribute;
    VectorAttribute *   vattribute;
    string              value;
    map<string,string>  vvalue;

    // MANAGER_TIMER
    value = "15";

    attribute = new SingleAttribute("MANAGER_TIMER",value);
    conf_default.insert(make_pair(attribute->name(),attribute));
/*
#*******************************************************************************
# Daemon configuration attributes
#-------------------------------------------------------------------------------
#  MONITORING_INTERVAL
#  HOST_PER_INTERVAL
#  HOST_MONITORING_EXPIRATION_TIME
#  VM_PER_INTERVAL
#  VM_MONITORING_EXPIRATION_TIME
#  PORT
#  DB
#  VNC_BASE_PORT
#  SCRIPTS_REMOTE_DIR
#  VM_SUBMIT_ON_HOLD
#*******************************************************************************
*/
    // MONITORING_INTERVAL
    value = "300";

    attribute = new SingleAttribute("MONITORING_INTERVAL",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // HOST_PER_INTERVAL
    value = "15";

    attribute = new SingleAttribute("HOST_PER_INTERVAL",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // HOST_MONITORING_EXPIRATION_TIME
    value = "86400";

    attribute = new SingleAttribute("HOST_MONITORING_EXPIRATION_TIME",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // VM_PER_INTERVAL
    value = "5";

    attribute = new SingleAttribute("VM_PER_INTERVAL",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // VM_MONITORING_EXPIRATION_TIME
    value = "86400";

    attribute = new SingleAttribute("VM_MONITORING_EXPIRATION_TIME",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //XML-RPC Server PORT
    value = "2633";

    attribute = new SingleAttribute("PORT",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //DB CONFIGURATION
    vvalue.insert(make_pair("BACKEND","sqlite"));

    vattribute = new VectorAttribute("DB",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));

    //VNC_BASE_PORT
    value = "5900";

    attribute = new SingleAttribute("VNC_BASE_PORT",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //XML-RPC Server PORT
    value = "2633";

    attribute = new SingleAttribute("PORT",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //SCRIPTS_REMOTE_DIR
    value = "/var/tmp/one";

    attribute = new SingleAttribute("SCRIPTS_REMOTE_DIR",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // VM_SUBMIT_ON_HOLD
    value = "NO";

    attribute = new SingleAttribute("VM_SUBMIT_ON_HOLD",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // LOG CONFIGURATION
    vvalue.clear();
    vvalue.insert(make_pair("SYSTEM","file"));
    vvalue.insert(make_pair("DEBUG_LEVEL","3"));

    vattribute = new VectorAttribute("LOG",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));
/*
#*******************************************************************************
# Physical Networks configuration
#*******************************************************************************
#  NETWORK_SIZE
#  MAC_PREFIX
#*******************************************************************************
*/
    //MAC_PREFIX
    value = "02:00";

    attribute = new SingleAttribute("MAC_PREFIX",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //NETWORK_SIZE
    value = "254";

    attribute = new SingleAttribute("NETWORK_SIZE",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

/*
#*******************************************************************************
# Datastore Configuration
#*******************************************************************************
#  DATASTORE_LOCATION
#  DEFAULT_IMAGE_TYPE
#  DEFAULT_DEVICE_PREFIX
#*******************************************************************************
*/
    //DATASTORE_LOCATION
    attribute = new SingleAttribute("DATASTORE_LOCATION",
                                     var_location + "/datastores");
    conf_default.insert(make_pair(attribute->name(),attribute));

    //DEFAULT_IMAGE_TYPE
    value = "OS";

    attribute = new SingleAttribute("DEFAULT_IMAGE_TYPE",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //DEFAULT_DEVICE_PREFIX
    value = "hd";

    attribute = new SingleAttribute("DEFAULT_DEVICE_PREFIX",value);
    conf_default.insert(make_pair(attribute->name(),attribute));
/*
#*******************************************************************************
# Auth Manager Configuration
#*******************************************************************************
# SESSION_EXPIRATION_TIME
# ENABLE_OTHER_PERMISSIONS
# DEFAULT_UMASK
#*******************************************************************************
*/
    // SESSION_EXPIRATION_TIME
    value = "0";

    attribute = new SingleAttribute("SESSION_EXPIRATION_TIME",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // ENABLE_OTHER_PERMISSIONS
    value = "YES";

    attribute = new SingleAttribute("ENABLE_OTHER_PERMISSIONS",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // DEFAULT_UMASK
    value = "177";

    attribute = new SingleAttribute("DEFAULT_UMASK",value);
    conf_default.insert(make_pair(attribute->name(),attribute));
}

