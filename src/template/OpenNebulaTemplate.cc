/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#include "OpenNebulaTemplate.h"
#include "NebulaUtil.h"

#include <unistd.h>
#include <sys/stat.h>

#include <fstream>
#include <iostream>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * OpenNebulaTemplate::conf_name = "oned.conf";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int OpenNebulaTemplate::load_configuration()
{
    std::string error;

    if (NebulaTemplate::load_configuration() != 0)
    {
        return -1;
    }

    if (vm_actions.set_auth_ops(*this, error) != 0)
    {
        cout << "\nError while parsing configuration file:\n" << error << endl;
        return -1;
    }

    return 0;
}

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
# fs_lvm
# fs_lvmm_ssh
# shared
# qcow2
# ssh
# vmfs
# ceph
# dev
#*******************************************************************************
*/
    set_conf_tm("dummy", "NONE", "SYSTEM", "YES", "YES", "");

    set_conf_tm("lvm", "NONE",   "SELF",   "YES", "NO",  "");
    set_conf_tm("fs_lvm", "SYSTEM", "SYSTEM", "YES", "NO",  "raw");
    set_conf_tm("fs_lvm_ssh", "SYSTEM", "SYSTEM", "YES", "NO",  "raw");

    set_conf_tm("shared", "NONE", "SYSTEM", "YES", "YES", "");
    set_conf_tm("qcow2", "NONE", "SYSTEM", "YES", "NO",  "qcow2");

    set_conf_tm("ssh", "SYSTEM", "SYSTEM", "NO", "YES", "");
    set_conf_tm("vmfs", "NONE", "SYSTEM", "YES", "NO",  "");

    set_conf_tm("ceph", "NONE", "SELF", "YES", "NO", "raw");
    set_conf_tm("dev", "NONE", "NONE", "YES", "NO",  "");


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
    set_conf_ds("vcenter",
        "VCENTER_INSTANCE_ID, VCENTER_DS_REF, VCENTER_DC_REF, VCENTER_HOST, VCENTER_USER, VCENTER_PASSWORD",
        "NO");
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
    set_conf_market("one",  "", "monitor");
    set_conf_market("http", "BASE_URL,PUBLIC_DIR", "create, delete, monitor");
    set_conf_market("s3",   "ACCESS_KEY_ID,SECRET_ACCESS_KEY,REGION,BUCKET",
                    "create, delete, monitor");
    set_conf_market("docker_registry", "BASE_URL", "monitor");

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
    set_conf_auth("core", "YES", "NO", "NO", "-1");
    set_conf_auth("public", "NO", "NO", "NO", "-1");
    set_conf_auth("ssh", "YES", "NO", "NO", "-1");
    set_conf_auth("x509", "NO", "NO", "NO", "-1");
    set_conf_auth("ldap", "YES", "YES", "YES", "86400");
    set_conf_auth("server_cipher", "NO", "NO", "NO", "-1");
    set_conf_auth("server_x509", "NO", "NO", "NO", "-1");

    register_multiple_conf_default("AUTH_MAD_CONF");

/*
#*******************************************************************************
# Virtual Network Configuration
#*******************************************************************************
#dummy
#802.1Q
#ebtables
#fw
#ovswitch
#vxlan
#vcenter
#ovswitch_vxlan
#bridge
#elastic
#nodeport
#******
*/

    set_conf_vn("dummy", "linux");
    set_conf_vn("802.1Q", "linux");
    set_conf_vn("ebtables", "linux");
    set_conf_vn("fw", "linux");
    set_conf_vn("ovswitch", "openvswitch");
    set_conf_vn("vxlan", "linux");
    set_conf_vn("vcenter", "vcenter_port_groups");
    set_conf_vn("ovswitch_vxlan", "openvswitch");
    set_conf_vn("bridge", "linux");
    set_conf_vn("elastic", "linux");
    set_conf_vn("nodeport", "linux");

    register_multiple_conf_default("VN_MAD_CONF");
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

    get(conf_section, attrs);

    for (i = conf_default.begin(); i != conf_default.end(); )
    {
        if (i->first == conf_section)
        {
            found = false;

            d_attr = dynamic_cast<VectorAttribute*>(i->second);

            if (d_attr == 0)
            {
                continue;
            }

            d_name = d_attr->vector_value("NAME");

            for (j = attrs.begin(); j != attrs.end(); ++j)
            {
                if ( (*j)->vector_value("NAME") == d_name )
                {
                    found = true;
                    break;
                }
            }

            if (!found)
            {
                // insert into attributes
                attributes.insert(make_pair(conf_section, d_attr));
                ++i;
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
            ++i;
        }
    }
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
                                     const std::string& ds_migrate,
                                     const std::string& driver)
{
    VectorAttribute *   vattribute;
    std::map<std::string,std::string>  vvalue;

    vvalue.insert(make_pair("NAME", name));
    vvalue.insert(make_pair("LN_TARGET", ln_target));
    vvalue.insert(make_pair("CLONE_TARGET", clone_target));
    vvalue.insert(make_pair("SHARED", shared));
    vvalue.insert(make_pair("DS_MIGRATE", ds_migrate));
    vvalue.insert(make_pair("DRIVER", driver));

    vattribute = new VectorAttribute("TM_MAD_CONF", vvalue);
    conf_default.insert(make_pair(vattribute->name(), vattribute));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OpenNebulaTemplate::set_conf_market(const std::string& name,
                                         const std::string& required_attrs,
                                         const std::string& app_actions)
{
    VectorAttribute *   vattribute;
    std::map<std::string,std::string>  vvalue;

    vvalue.insert(make_pair("NAME", name));
    vvalue.insert(make_pair("REQUIRED_ATTRS", required_attrs));
    vvalue.insert(make_pair("APP_ACTIONS", app_actions));

    vattribute = new VectorAttribute("MARKET_MAD_CONF", vvalue);
    conf_default.insert(make_pair(vattribute->name(), vattribute));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OpenNebulaTemplate::set_conf_auth(const std::string& name,
                                       const std::string& password_change,
                                       const std::string& driver_managed_groups,
                                       const std::string& driver_managed_group_admin,
                                       const std::string& max_token_time)
{
    VectorAttribute *   vattribute;
    std::map<std::string,std::string>  vvalue;

    vvalue.insert(make_pair("NAME", name));
    vvalue.insert(make_pair("PASSWORD_CHANGE", password_change));
    vvalue.insert(make_pair("DRIVER_MANAGED_GROUPS", driver_managed_groups));
    vvalue.insert(make_pair("DRIVER_MANAGED_GROUP_ADMIN", driver_managed_group_admin));
    vvalue.insert(make_pair("MAX_TOKEN_TIME", max_token_time));

    vattribute = new VectorAttribute("AUTH_MAD_CONF", vvalue);
    conf_default.insert(make_pair(vattribute->name(), vattribute));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OpenNebulaTemplate::set_conf_vn(const std::string& name,
                                         const std::string& bridge_type)
{
    VectorAttribute *   vattribute;
    std::map<std::string,std::string>  vvalue;

    vvalue.insert(make_pair("NAME", name));
    vvalue.insert(make_pair("BRIDGE_TYPE", bridge_type));

    vattribute = new VectorAttribute("VN_MAD_CONF", vvalue);
    conf_default.insert(make_pair(vattribute->name(), vattribute));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OpenNebulaTemplate::set_conf_default()
{
    VectorAttribute *   vattribute;
    map<string,string>  vvalue;

/*
#*******************************************************************************
# Daemon configuration attributes
#-------------------------------------------------------------------------------
#  MANAGER_TIMER
#  MONITORING_INTERVAL_MARKET
#  MONITORING_INTERVAL_DATASTORE
#  MONITORING_INTERVAL_DB_UPDATE
#  DS_MONITOR_VM_DISK
#  VM_MONITORING_EXPIRATION_TIME
#  LISTEN_ADDRESS
#  PORT
#  DB
#  SCRIPTS_REMOTE_DIR
#  VM_SUBMIT_ON_HOLD
#  API_LIST_ORDER
#  VNC_PORTS
#  SHOWBACK_ONLY_RUNNING
#*******************************************************************************
*/
    set_conf_single("MANAGER_TIMER", "15");
    set_conf_single("MONITORING_INTERVAL_MARKET", "600");
    set_conf_single("MONITORING_INTERVAL_DATASTORE", "300");
    set_conf_single("MONITORING_INTERVAL_DB_UPDATE", "0");
    set_conf_single("DS_MONITOR_VM_DISK", "10");
    set_conf_single("VM_MONITORING_EXPIRATION_TIME", "14400");
    set_conf_single("PORT", "2633");
    set_conf_single("LISTEN_ADDRESS", "0.0.0.0");
    set_conf_single("SCRIPTS_REMOTE_DIR", "/var/tmp/one");
    set_conf_single("VM_SUBMIT_ON_HOLD", "NO");
    set_conf_single("API_LIST_ORDER", "DESC");
    set_conf_single("HOST_ENCRYPTED_ATTR", "EC2_ACCESS");
    set_conf_single("HOST_ENCRYPTED_ATTR", "EC2_SECRET");
    set_conf_single("HOST_ENCRYPTED_ATTR", "AZ_ID");
    set_conf_single("HOST_ENCRYPTED_ATTR", "AZ_CERT");
    set_conf_single("HOST_ENCRYPTED_ATTR", "VCENTER_PASSWORD");
    set_conf_single("HOST_ENCRYPTED_ATTR", "NSX_PASSWORD");
    set_conf_single("HOST_ENCRYPTED_ATTR", "ONE_PASSWORD");
    set_conf_single("SHOWBACK_ONLY_RUNNING", "NO");
    set_conf_single("CONTEXT_RESTRICTED_DIRS", "/etc");
    set_conf_single("CONTEXT_SAFE_DIRS", "");

    //DB CONFIGURATION
    vvalue.insert(make_pair("BACKEND","sqlite"));
    vvalue.insert(make_pair("TIMEOUT","2500"));

    vattribute = new VectorAttribute("DB",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));

    // LOG CONFIGURATION
    vvalue.clear();
    vvalue.insert(make_pair("SYSTEM","file"));
    vvalue.insert(make_pair("DEBUG_LEVEL","3"));
    vvalue.insert(make_pair("USE_VMS_LOCATION","NO"));

    vattribute = new VectorAttribute("LOG",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));

    // VNC CONFIGURATION
    vvalue.clear();
    vvalue.insert(make_pair("RESERVED",""));
    vvalue.insert(make_pair("START","5900"));

    vattribute = new VectorAttribute("VNC_PORTS",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));

    set_conf_single("MAX_BACKUPS", "5");
    set_conf_single("MAX_BACKUPS_HOST", "2");

/*
#*******************************************************************************
# Federation configuration attributes
#-------------------------------------------------------------------------------
#  FEDERATION
#   MODE
#   ZONE_ID
#   SERVER_ID
#   MASTER_ONED
#
#  RAFT
#   LOG_RETENTION
#   LOG_PURGE_TIMEOUT
#   ELECTION_TIMEOUT_MS
#   BROADCAST_TIMEOUT_MS
#   XMLRPC_TIMEOUT_MS
#   LIMIT_PURGE
#*******************************************************************************
*/
    // FEDERATION
    vvalue.clear();
    vvalue.insert(make_pair("MODE","STANDALONE"));
    vvalue.insert(make_pair("ZONE_ID","0"));
    vvalue.insert(make_pair("SERVER_ID","-1"));
    vvalue.insert(make_pair("MASTER_ONED",""));

    vattribute = new VectorAttribute("FEDERATION",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));

    //RAFT
    vvalue.clear();
    vvalue.insert(make_pair("LOG_RETENTION","500000"));
    vvalue.insert(make_pair("LOG_PURGE_TIMEOUT","600"));
    vvalue.insert(make_pair("ELECTION_TIMEOUT_MS","1500"));
    vvalue.insert(make_pair("BROADCAST_TIMEOUT_MS","500"));
    vvalue.insert(make_pair("XMLRPC_TIMEOUT_MS","100"));
    vvalue.insert(make_pair("LIMIT_PURGE","100000"));

    vattribute = new VectorAttribute("RAFT",vvalue);
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
    set_conf_single("LOG_CALL_FORMAT", "Req:%i UID:%u IP:%A %m invoked %l");

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
#  DEFAULT_IMAGE_PERSISTENCY
#  DEFAULT_IMAGE_PERSISTENCY_ON_NEW
#*******************************************************************************
*/
    set_conf_single("DATASTORE_LOCATION", var_location + "/datastores");
    set_conf_single("DATASTORE_CAPACITY_CHECK", "YES");

    set_conf_single("DEFAULT_IMAGE_TYPE", "OS");
    set_conf_single("DEFAULT_IMAGE_PERSISTENT", "");
    set_conf_single("DEFAULT_IMAGE_PERSISTENT_NEW", "");

    set_conf_single("DEFAULT_DEVICE_PREFIX", "hd");
    set_conf_single("DEFAULT_CDROM_DEVICE_PREFIX", "hd");

    set_conf_single("VM_SNAPSHOT_FACTOR", "0");
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

/*
#*******************************************************************************
# VM Operations Permissions
#*******************************************************************************
# VM_ADMIN_OPERATIONS
# VM_MANAGE_OPERATIONS
# VM_USE_OPERATIONS
#*******************************************************************************
*/
    set_conf_single("VM_ADMIN_OPERATIONS", "migrate, delete, recover, retry, "
            "deploy, resched");

    set_conf_single("VM_MANAGE_OPERATIONS", "undeploy, hold, release, stop, "
            "suspend, resume, reboot, poweroff, disk-attach, nic-attach, "
            "disk-snapshot, terminate, disk-resize, snapshot, updateconf, "
            "rename, resize, update, disk-saveas");

    set_conf_single("VM_USE_OPERATIONS", "");
/*/
#*******************************************************************************
# Hook Log Configuration
#*******************************************************************************
*/
    vvalue.clear();

    vvalue.insert(make_pair("LOG_RETENTION","10"));
    vattribute = new VectorAttribute("HOOK_LOG_CONF", vvalue);

    conf_default.insert(make_pair(vattribute->name(),vattribute));
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

        if (!ifile.is_open())
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

        if (!ofile.is_open())
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

