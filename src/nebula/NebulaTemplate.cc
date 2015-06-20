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

#include "NebulaTemplate.h"
#include "NebulaUtil.h"

#include <unistd.h>
#include <sys/stat.h>

#include <fstream>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int NebulaTemplate::load_configuration()
{
    char * error = 0;
    int    rc;

    string      aname;
    Attribute * attr;

    map<string, Attribute *>::iterator  iter, j, prev;

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

            prev = iter++;

            conf_default.erase(prev);
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
#  MONITORING_THREADS
#  HOST_PER_INTERVAL
#  HOST_MONITORING_EXPIRATION_TIME
#  VM_INDIVIDUAL_MONITORING
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
    value = "60";

    attribute = new SingleAttribute("MONITORING_INTERVAL",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // MONITORING_THREADS
    value = "50";

    attribute = new SingleAttribute("MONITORING_THREADS",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // HOST_PER_INTERVAL
    value = "15";

    attribute = new SingleAttribute("HOST_PER_INTERVAL",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // HOST_MONITORING_EXPIRATION_TIME
    value = "43200";

    attribute = new SingleAttribute("HOST_MONITORING_EXPIRATION_TIME",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // VM_INDIVIDUAL_MONITORING
    value = "no";

    attribute = new SingleAttribute("VM_INDIVIDUAL_MONITORING",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // VM_PER_INTERVAL
    value = "5";

    attribute = new SingleAttribute("VM_PER_INTERVAL",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // VM_MONITORING_EXPIRATION_TIME
    value = "14400";

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
# Federation configuration attributes
#-------------------------------------------------------------------------------
#  FEDERATION
#   MODE
#   ZONE_ID
#   MASTER_ONED
#*******************************************************************************
*/
    // FEDERATION
    vvalue.clear();
    vvalue.insert(make_pair("MODE","STANDALONE"));
    vvalue.insert(make_pair("ZONE_ID","0"));
    vvalue.insert(make_pair("MASTER_ONED",""));

    vattribute = new VectorAttribute("FEDERATION",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));

/*
#*******************************************************************************
# Default showback cost
#*******************************************************************************
*/
    vvalue.clear();
    vvalue.insert(make_pair("CPU_COST","0"));
    vvalue.insert(make_pair("MEMORY_COST","0"));
    vvalue.insert(make_pair("DISK_COST","0"));

    vattribute = new VectorAttribute("DEFAULT_COST",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));

/*
#*******************************************************************************
# XML-RPC server configuration
#-------------------------------------------------------------------------------
#  MAX_CONN
#  MAX_CONN_BACKLOG
#  KEEPALIVE_TIMEOUT
#  KEEPALIVE_MAX_CONN
#  TIMEOUT
#  RPC_LOG
#  MESSAGE_SIZE
#  LOG_CALL_FORMAT
#*******************************************************************************
*/
    // MAX_CONN
    value = "15";

    attribute = new SingleAttribute("MAX_CONN",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // MAX_CONN_BACKLOG
    value = "15";

    attribute = new SingleAttribute("MAX_CONN_BACKLOG",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // KEEPALIVE_TIMEOUT
    value = "15";

    attribute = new SingleAttribute("KEEPALIVE_TIMEOUT",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // KEEPALIVE_MAX_CONN
    value = "30";

    attribute = new SingleAttribute("KEEPALIVE_MAX_CONN",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // TIMEOUT
    value = "15";

    attribute = new SingleAttribute("TIMEOUT",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // RPC_LOG
    value = "NO";

    attribute = new SingleAttribute("RPC_LOG",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //MESSAGE_SIZE
    value = "1073741824";

    attribute = new SingleAttribute("MESSAGE_SIZE",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //LOG_CALL_FORMAT
    value = "Req:%i UID:%u %m invoked %l";

    attribute = new SingleAttribute("LOG_CALL_FORMAT",value);
    conf_default.insert(make_pair(attribute->name(),attribute));
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
#  DATASTORE_BASE_PATH
#  DATASTORE_CAPACITY_CHECK
#  DEFAULT_IMAGE_TYPE
#  DEFAULT_DEVICE_PREFIX
#  DEFAULT_CDROM_DEVICE_PREFIX
#*******************************************************************************
*/
    //DATASTORE_LOCATION
    attribute = new SingleAttribute("DATASTORE_LOCATION",
                                     var_location + "/datastores");
    conf_default.insert(make_pair(attribute->name(),attribute));

    //DATASTORE_BASE_PATH
    attribute = new SingleAttribute("DATASTORE_BASE_PATH",
                                     var_location + "/datastores");
    conf_default.insert(make_pair(attribute->name(),attribute));

    //DATASTORE_CAPACITY_CHECK
    value = "YES";

    attribute = new SingleAttribute("DATASTORE_CAPACITY_CHECK",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //DEFAULT_IMAGE_TYPE
    value = "OS";

    attribute = new SingleAttribute("DEFAULT_IMAGE_TYPE",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //DEFAULT_DEVICE_PREFIX
    value = "hd";

    attribute = new SingleAttribute("DEFAULT_DEVICE_PREFIX",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //DEFAULT_CDROM_DEVICE_PREFIX
    attribute = new SingleAttribute("DEFAULT_CDROM_DEVICE_PREFIX",value);
    conf_default.insert(make_pair(attribute->name(),attribute));
/*
#*******************************************************************************
# Auth Manager Configuration
#*******************************************************************************
# DEFAULT_AUTH
# SESSION_EXPIRATION_TIME
# ENABLE_OTHER_PERMISSIONS
# DEFAULT_UMASK
#*******************************************************************************
*/
    // DEFAULT_AUTH
    value = "default";

    attribute = new SingleAttribute("DEFAULT_AUTH",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int OpenNebulaTemplate::load_key()
{
    string keyfile = var_location + "/.one/one_key";
    string key;

    if (access(keyfile.c_str(), F_OK) == 0) //Key file exists
    {
        ifstream ifile;

        ifile.open(keyfile.c_str(), ios::in);

        if ( !ifile.is_open() )
        {
            cout << "Could not create OpenNebula keyfile: " << keyfile;
            return -1;
        }

        ifile >> key;

        ifile.close();
    }
    else
    {
        string dirpath = var_location + "/.one";

        if (access(dirpath.c_str(), F_OK) != 0)
        {
            if (mkdir(dirpath.c_str(), S_IRWXU) == -1)
            {
                cout << "Could not create directory: " << dirpath << endl;
                return -1;
            }
        }

        ofstream ofile;

        ofile.open(keyfile.c_str(), ios::out | ios::trunc);

        if ( !ofile.is_open() )
        {
            cout << "Could not create OpenNebula keyfile: " << keyfile;
            return -1;
        }

        key = one_util::random_password();

        ofile << key << endl;

        ofile.close();

        if (chmod(keyfile.c_str(), S_IRUSR | S_IWUSR) != 0)
        {
            cout << "Could not set access mode to: " << keyfile << endl;
            return -1;
        }
    }


    SingleAttribute * attribute = new SingleAttribute("ONE_KEY", key);
    attributes.insert(make_pair(attribute->name(),attribute));

    return 0;
}
