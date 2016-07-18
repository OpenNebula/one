/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

    set_multiple_conf_default();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * OpenNebulaTemplate::conf_name="oned.conf";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OpenNebulaTemplate::set_multiple_conf_default()
{
/*
#*******************************************************************************
# Transfer Manager Configuration
#*******************************************************************************
# dummy
# lvm
# shared
# fs_lvm
# qcow2
# ssh
# vmfs
# ceph
# dev
#*******************************************************************************
*/
    set_conf_tm("dummy",  "NONE",   "SYSTEM", "YES", "YES");
    set_conf_tm("lvm",    "NONE",   "SELF",   "YES", "NO");
    set_conf_tm("shared", "NONE",   "SYSTEM", "YES", "YES");
    set_conf_tm("fs_lvm", "SYSTEM", "SYSTEM", "YES", "NO");
    set_conf_tm("qcow2",  "NONE",   "SYSTEM", "YES", "NO");
    set_conf_tm("ssh",    "SYSTEM", "SYSTEM", "NO",  "YES");
    set_conf_tm("vmfs",   "NONE",   "SYSTEM", "YES", "NO");
    set_conf_tm("ceph",   "NONE",   "SELF",   "YES", "NO");
    set_conf_tm("dev",    "NONE",   "NONE",   "YES", "NO");

    register_multiple_conf_default("TM_MAD_CONF");
/*
#*******************************************************************************
# Datastore Manager Configuration
#*******************************************************************************
# ceph
# dev
# dummy
# fs
# lvm
# shared
# ssh
# vmfs
#******
*/
    set_conf_ds("dev",            "DISK_TYPE",            "YES");
    set_conf_ds("iscsi_libvirt",  "DISK_TYPE,ISCSI_HOST", "YES");
    set_conf_ds("dummy",          "",                     "NO");
    set_conf_ds("fs",             "",                     "NO");
    set_conf_ds("lvm",            "DISK_TYPE",            "NO");
    set_conf_ds("shared",         "",                     "NO");
    set_conf_ds("ssh",            "",                     "NO");
    set_conf_ds("vmfs",           "BRIDGE_LIST",          "NO");
    set_conf_ds("ceph",
                "DISK_TYPE,BRIDGE_LIST,CEPH_HOST,CEPH_USER,CEPH_SECRET",
                "NO");

    register_multiple_conf_default("DS_MAD_CONF");
/*
#*******************************************************************************
# Marketplace Manager Configuration
#*******************************************************************************
# http
# s3
#******
*/
    set_conf_market("one",  "");
    set_conf_market("http", "BASE_URL,PUBLIC_DIR");
    set_conf_market("s3",   "ACCESS_KEY_ID,SECRET_ACCESS_KEY,REGION,BUCKET");

    register_multiple_conf_default("MARKET_MAD_CONF");
/*
#*******************************************************************************
# Auth Manager Configuration
#*******************************************************************************
# core
# public
# ssh
# x509
# ldap
# server_cipher
# server_x509
#******
*/
    set_conf_auth("core", "YES");
    set_conf_auth("public", "NO");
    set_conf_auth("ssh", "YES");
    set_conf_auth("x509", "NO");
    set_conf_auth("ldap", "YES");
    set_conf_auth("server_cipher", "NO");
    set_conf_auth("server_x509", "NO");

    register_multiple_conf_default("AUTH_MAD_CONF");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OpenNebulaTemplate::register_multiple_conf_default(
                                                const std::string& conf_section)
{
    std::string d_name;

    bool found;

    VectorAttribute* d_attr;

    std::map<std::string, Attribute *>::iterator i, prev;

    std::vector<const VectorAttribute*>::const_iterator j;
    std::vector<const VectorAttribute*> attrs;

    get(conf_section.c_str(), attrs);

    for(i = conf_default.begin(); i != conf_default.end(); )
    {
        if ( i->first == conf_section )
        {
            found = false;

            d_attr = dynamic_cast<VectorAttribute*>(i->second);

            if (d_attr == 0)
            {
                continue;
            }

            d_name = d_attr->vector_value("NAME");

            for (j = attrs.begin(); j != attrs.end(); j++)
            {
                if ( (*j)->vector_value("NAME") == d_name )
                {
                    found = true;
                    break;
                }
            }

            if ( !found )
            {
                // insert into attributes
                attributes.insert(make_pair(conf_section, d_attr));
                i++;
            }
            else
            {
                // remove from conf_defaults
                delete i->second;
                prev = i++;
                conf_default.erase(prev);
            }
        }
        else
        {
            i++;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OpenNebulaTemplate::set_conf_single(const std::string& attr,
                                         const std::string& value)
{
    SingleAttribute *   attribute;

    attribute = new SingleAttribute(attr, value);
    conf_default.insert(make_pair(attribute->name(),attribute));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OpenNebulaTemplate::set_conf_ds(const std::string& name,
                                     const std::string& required_attrs,
                                     const std::string& persistent_only)
{
    VectorAttribute *   vattribute;
    std::map<std::string,std::string>  vvalue;

    vvalue.insert(make_pair("NAME", name));
    vvalue.insert(make_pair("REQUIRED_ATTRS", required_attrs));
    vvalue.insert(make_pair("PERSISTENT_ONLY", persistent_only));

    vattribute = new VectorAttribute("DS_MAD_CONF", vvalue);
    conf_default.insert(make_pair(vattribute->name(), vattribute));
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OpenNebulaTemplate::set_conf_tm(const std::string& name,
                                     const std::string& ln_target,
                                     const std::string& clone_target,
                                     const std::string& shared,
                                     const std::string& ds_migrate)
{
    VectorAttribute *   vattribute;
    std::map<std::string,std::string>  vvalue;

    vvalue.insert(make_pair("NAME", name));
    vvalue.insert(make_pair("LN_TARGET", ln_target));
    vvalue.insert(make_pair("CLONE_TARGET", clone_target));
    vvalue.insert(make_pair("SHARED", shared));
    vvalue.insert(make_pair("DS_MIGRATE", ds_migrate));

    vattribute = new VectorAttribute("TM_MAD_CONF", vvalue);
    conf_default.insert(make_pair(vattribute->name(), vattribute));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OpenNebulaTemplate::set_conf_market(const std::string& name,
                                         const std::string& required_attrs)
{
    VectorAttribute *   vattribute;
    std::map<std::string,std::string>  vvalue;

    vvalue.insert(make_pair("NAME", name));
    vvalue.insert(make_pair("REQUIRED_ATTRS", required_attrs));

    vattribute = new VectorAttribute("MARKET_MAD_CONF", vvalue);
    conf_default.insert(make_pair(vattribute->name(), vattribute));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OpenNebulaTemplate::set_conf_auth(const std::string& name,
                                       const std::string& password_change)
{
    VectorAttribute *   vattribute;
    std::map<std::string,std::string>  vvalue;

    vvalue.insert(make_pair("NAME", name));
    vvalue.insert(make_pair("PASSWORD_CHANGE", password_change));

    vattribute = new VectorAttribute("AUTH_MAD_CONF", vvalue);
    conf_default.insert(make_pair(vattribute->name(), vattribute));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OpenNebulaTemplate::set_conf_default()
{
    VectorAttribute *   vattribute;
    string              value;
    map<string,string>  vvalue;

/*
#*******************************************************************************
# Daemon configuration attributes
#-------------------------------------------------------------------------------
#  MANAGER_TIMER
#  MONITORING_INTERVAL
#  MONITORING_THREADS
#  HOST_PER_INTERVAL
#  HOST_MONITORING_EXPIRATION_TIME
#  VM_INDIVIDUAL_MONITORING
#  VM_PER_INTERVAL
#  VM_MONITORING_EXPIRATION_TIME
#  LISTEN_ADDRESS
#  PORT
#  DB
#  SCRIPTS_REMOTE_DIR
#  VM_SUBMIT_ON_HOLD
#  VNC_PORTS
#*******************************************************************************
*/
    set_conf_single("MANAGER_TIMER", "15");
    set_conf_single("MONITORING_INTERVAL", "60");
    set_conf_single("MONITORING_THREADS", "50");
    set_conf_single("HOST_PER_INTERVAL", "15");
    set_conf_single("HOST_MONITORING_EXPIRATION_TIME", "43200");
    set_conf_single("VM_INDIVIDUAL_MONITORING", "no");
    set_conf_single("VM_PER_INTERVAL", "5");
    set_conf_single("VM_MONITORING_EXPIRATION_TIME", "14400");
    set_conf_single("PORT", "2633");
    set_conf_single("LISTEN_ADDRESS", "0.0.0.0");
    set_conf_single("SCRIPTS_REMOTE_DIR", "/var/tmp/one");
    set_conf_single("VM_SUBMIT_ON_HOLD", "NO");

    //DB CONFIGURATION
    vvalue.insert(make_pair("BACKEND","sqlite"));

    vattribute = new VectorAttribute("DB",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));

    // LOG CONFIGURATION
    vvalue.clear();
    vvalue.insert(make_pair("SYSTEM","file"));
    vvalue.insert(make_pair("DEBUG_LEVEL","3"));

    vattribute = new VectorAttribute("LOG",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));

    // VNC CONFIGURATION
    vvalue.clear();
    vvalue.insert(make_pair("RESERVED",""));
    vvalue.insert(make_pair("START","5900"));

    vattribute = new VectorAttribute("VNC_PORTS",vvalue);
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
    set_conf_single("MAX_CONN", "15");
    set_conf_single("MAX_CONN_BACKLOG", "15");
    set_conf_single("KEEPALIVE_TIMEOUT", "15");
    set_conf_single("KEEPALIVE_MAX_CONN", "30");
    set_conf_single("TIMEOUT", "15");
    set_conf_single("RPC_LOG", "NO");
    set_conf_single("MESSAGE_SIZE", "1073741824");
    set_conf_single("LOG_CALL_FORMAT", "Req:%i UID:%u %m invoked %l");

/*
#*******************************************************************************
# Physical Networks configuration
#*******************************************************************************
#  NETWORK_SIZE
#  MAC_PREFIX
#  VLAN_ID
#  VXLAN_ID
#  PCI_PASSTHROUGH_BUS
#*******************************************************************************
*/
    set_conf_single("MAC_PREFIX", "02:00");
    set_conf_single("NETWORK_SIZE", "254");

    vvalue.clear();
    vvalue.insert(make_pair("RESERVED","0, 1, 4095"));
    vvalue.insert(make_pair("START","2"));

    vattribute = new VectorAttribute("VLAN_IDS",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));

    vvalue.clear();
    vvalue.insert(make_pair("START","2"));

    vattribute = new VectorAttribute("VXLAN_IDS",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));

    set_conf_single("PCI_PASSTHROUGH_BUS", "0x01");
/*
#*******************************************************************************
# Datastore Configuration
#*******************************************************************************
#  DATASTORE_LOCATION
#  DATASTORE_CAPACITY_CHECK
#  DEFAULT_IMAGE_TYPE
#  DEFAULT_DEVICE_PREFIX
#  DEFAULT_CDROM_DEVICE_PREFIX
#*******************************************************************************
*/
    set_conf_single("DATASTORE_LOCATION", var_location + "/datastores");
    set_conf_single("DATASTORE_CAPACITY_CHECK", "YES");
    set_conf_single("DEFAULT_IMAGE_TYPE", "OS");
    set_conf_single("DEFAULT_DEVICE_PREFIX", "hd");
    set_conf_single("DEFAULT_CDROM_DEVICE_PREFIX", "hd");

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
    set_conf_single("DEFAULT_AUTH", "default");
    set_conf_single("SESSION_EXPIRATION_TIME", "0");
    set_conf_single("ENABLE_OTHER_PERMISSIONS", "YES");
    set_conf_single("DEFAULT_UMASK", "177");
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
