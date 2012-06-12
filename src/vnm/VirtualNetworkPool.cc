/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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
#include "UserPool.h"
#include "NebulaLog.h"
#include "Nebula.h"
#include "PoolObjectAuth.h"
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
    PoolSQL(db, VirtualNetwork::table, true)
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
    int            gid,
    const string&  uname,
    const string&  gname,
    VirtualNetworkTemplate * vn_template,
    int *          oid,
    int            cluster_id,
    const string&  cluster_name,
    string&        error_str)
{
    VirtualNetwork *         vn;
    VirtualNetwork *         vn_aux = 0;
    string          name;
    ostringstream   oss;

    vn = new VirtualNetwork(uid, gid, uname, gname,
                            cluster_id, cluster_name, vn_template);

    // Check name
    vn->get_template_attribute("NAME", name);

    if ( name.empty() )
    {
        goto error_name;
    }

    if ( name.length() > 128 )
    {
        goto error_name_length;
    }

    // Check for duplicates
    vn_aux = get(name,uid,false);

    if( vn_aux != 0 )
    {
        goto error_duplicated;
    }

    *oid = PoolSQL::allocate(vn, error_str);

    return *oid;

error_name:
    oss << "NAME cannot be empty.";

    goto error_common;

error_name_length:
    oss << "NAME is too long; max length is 128 chars.";
    goto error_common;

error_duplicated:
    oss << "NAME is already taken by NET "
        << vn_aux->get_oid() << ".";

error_common:
    delete vn;

    *oid = -1;
    error_str = oss.str();

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualNetwork * VirtualNetworkPool::get_nic_by_name(VectorAttribute * nic, 
                                                     const string&     name,
                                                     int               _uid,
                                                     string&           error)
{
    istringstream  is;

    string uid_s ;
    string uname;
    int    uid;

    VirtualNetwork * vnet;

    if (!(uid_s = nic->vector_value("NETWORK_UID")).empty())
    {
        is.str(uid_s);
        is >> uid;

        if( is.fail() )
        {
            error = "Cannot get user in NETWORK_UID";
            return 0;
        }
    }
    else if (!(uname = nic->vector_value("NETWORK_UNAME")).empty())
    {
        User *     user;
        Nebula&    nd    = Nebula::instance();
        UserPool * upool = nd.get_upool();
        
        user = upool->get(uname,true);
        
        if ( user == 0 )
        {
            error = "User set in NETWORK_UNAME does not exist";
            return 0;
        }

        uid = user->get_oid();

        user->unlock();
    }
    else
    {
        uid = _uid;        
    }

    vnet = get(name,uid,true);

    if (vnet == 0)
    {
        ostringstream oss;
        oss << "Virtual network " << name << " does not exist for user " << uid;

        error = oss.str(); 
    }

    return vnet;
}
        
/* -------------------------------------------------------------------------- */

VirtualNetwork * VirtualNetworkPool::get_nic_by_id(const string& id_s, 
                                                   string&       error)
{
    istringstream  is;
    int            id;

    VirtualNetwork * vnet = 0;

    is.str(id_s);
    is >> id;

    if( !is.fail() )
    {
        vnet = get(id,true);
    }

    if (vnet == 0)
    {
        ostringstream oss;
        oss << "Virtual network with ID: " << id_s << " does not exist";

        error = oss.str(); 
    }

    return vnet;
}

int VirtualNetworkPool::nic_attribute(VectorAttribute * nic, 
                                      int     uid, 
                                      int     vid,
                                      string& error)
{
    string           network;
    VirtualNetwork * vnet = 0;

    if (!(network = nic->vector_value("NETWORK")).empty())
    {
        vnet = get_nic_by_name (nic, network, uid, error);
    }
    else if (!(network = nic->vector_value("NETWORK_ID")).empty())
    {
        vnet = get_nic_by_id(network, error);
    }
    else //Not using a pre-defined network
    {
        return -2;
    } 

    if (vnet == 0)
    {
        return -1;
    }

    int rc = vnet->nic_attribute(nic,vid);

    if ( rc == 0 )
    {
        update(vnet);
    }
    else
    {
        error = "Cannot get IP/MAC lease from virtual network.";
    }

    vnet->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkPool::authorize_nic(VectorAttribute * nic, 
                                       int uid, 
                                       AuthRequest * ar)
{
    string           network;
    VirtualNetwork * vnet = 0;
    PoolObjectAuth   perm;
    string           error;

    if (!(network = nic->vector_value("NETWORK")).empty())
    {
        vnet = get_nic_by_name (nic, network, uid, error);

        if ( vnet != 0 )
        {
            nic->replace("NETWORK_ID", vnet->get_oid());
        }
    }
    else if (!(network = nic->vector_value("NETWORK_ID")).empty())
    {
        vnet = get_nic_by_id(network, error);
    }
    else //Not using a pre-defined network
    {
        return;
    } 

    if (vnet == 0)
    {
        return;
    }

    vnet->get_permissions(perm);

    vnet->unlock();

    ar->add_auth(AuthRequest::USE, perm);
}
