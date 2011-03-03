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

#include "VirtualNetworkPool.h"
#include "NebulaLog.h"

#include "AuthManager.h"
#include <sstream>
#include <ctype.h>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

unsigned int VirtualNetworkPool::_mac_prefix;
unsigned int VirtualNetworkPool::_default_size;

/* -------------------------------------------------------------------------- */

VirtualNetworkPool::VirtualNetworkPool(SqlDB * db,
    const string&   prefix,
    int             __default_size):
    PoolSQL(db,VirtualNetwork::table)
{
    istringstream iss;
    size_t        pos   = 0;
    int           count = 0;
    unsigned int  tmp;

    string mac = prefix;

    _mac_prefix   = 0;
    _default_size = __default_size;

    while ( (pos = mac.find(':')) !=  string::npos )
    {
        mac.replace(pos,1," ");
        count++;
    }

    if (count != 1)
    {
        NebulaLog::log("VNM",Log::ERROR,
                       "Wrong MAC prefix format, using default");
        _mac_prefix = 1; //"00:01"

        return;
    }

    iss.str(mac);

    iss >> hex >> _mac_prefix >> ws >> hex >> tmp >> ws;
    _mac_prefix <<= 8;
    _mac_prefix += tmp;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::allocate (
    int            uid,
    string         user_name,
    VirtualNetworkTemplate * vn_template,
    int *          oid,
    string&        error_str)
{
    VirtualNetwork *    vn;

    vn = new VirtualNetwork(user_name, vn_template);

    vn->uid = uid;

    *oid = PoolSQL::allocate(vn, error_str);

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::get_cb(void * _oid, int num, char **values,char **names)
{
    int * oid;

    oid = static_cast<int *>(_oid);

    if ( oid == 0 || values == 0 || values[0] == 0 )
    {
        return -1;
    }

    *oid = atoi(values[0]);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualNetwork * VirtualNetworkPool::get(const string& name, bool lock)
{
    ostringstream   oss;

    int oid = -1;
    int rc;

    char * sql_name = db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        return 0;
    }

    set_callback(
        static_cast<Callbackable::Callback>(&VirtualNetworkPool::get_cb),
        static_cast<void *>(&oid));

    oss << "SELECT oid FROM " << VirtualNetwork::table << " WHERE name = '"
        << sql_name << "'";

    rc = db->exec(oss, this);

    unset_callback();

    db->free_str(sql_name);

    if (rc != 0 || oid == -1)
    {
        return 0;
    }

    return get(oid,lock);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::dump_cb(void * _oss,
                                int     num,
                                char ** values,
                                char ** names)
{
    ostringstream * oss;

    oss = static_cast<ostringstream *>(_oss);

    return VirtualNetwork::dump(*oss, num, values, names);
}

/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::dump(ostringstream& oss, const string& where)
{
    int             rc;
    ostringstream   cmd;

    oss << "<VNET_POOL>";

    set_callback(
        static_cast<Callbackable::Callback>(&VirtualNetworkPool::dump_cb),
        static_cast<void *>(&oss));

    cmd << "SELECT body FROM " << VirtualNetwork::table;

    if ( !where.empty() )
    {
        cmd << " WHERE " << where;
    }

    rc = db->exec(cmd,this);

    oss << "</VNET_POOL>";

    unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::nic_attribute(VectorAttribute * nic, int vid)
{
    string           network;
    VirtualNetwork * vnet = 0;

    network = nic->vector_value("NETWORK");

    if (network.empty())
    {
        istringstream   is;
        int             network_id;

        network = nic->vector_value("NETWORK_ID");

        if(network.empty())
        {
            return -2;
        }

        is.str(network);
        is >> network_id;

        if( !is.fail() )
        {
            vnet = get(network_id,true);
        }
    }
    else
    {
        vnet = get(network,true);
    }

    if (vnet == 0)
    {
        return -1;
    }

    int rc = vnet->nic_attribute(nic,vid);

    vnet->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkPool::authorize_nic(VectorAttribute * nic, AuthRequest * ar)
{
    string           network;
    VirtualNetwork * vnet = 0;

    network = nic->vector_value("NETWORK");

    if (network.empty())
    {
        istringstream   is;
        int             network_id;

        network = nic->vector_value("NETWORK_ID");

        if(network.empty())
        {
            return;
        }

        is.str(network);
        is >> network_id;

        if( !is.fail() )
        {
            vnet = get(network_id,true);
        }
    }
    else
    {
        vnet = get(network,true);
    }

    if (vnet == 0)
    {
        return;
    }

    ar->add_auth(AuthRequest::NET,
                 vnet->get_vnid(),
                 AuthRequest::USE,
                 vnet->get_uid(),
                 vnet->isPublic());

    vnet->unlock();
}
