/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
#include "AddressRange.h"
#include <sstream>
#include <ctype.h>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

unsigned int VirtualNetworkPool::_mac_prefix;
unsigned int VirtualNetworkPool::_default_size;

/* -------------------------------------------------------------------------- */

VirtualNetworkPool::VirtualNetworkPool(
    SqlDB *                             db,
    const string&                       prefix,
    int                                 __default_size,
    vector<const Attribute *>&          restricted_attrs,
    vector<const Attribute *>           hook_mads,
    const string&                       remotes_location,
    const vector<const Attribute *>&    _inherit_attrs):
    PoolSQL(db, VirtualNetwork::table, true, true)
{
    istringstream iss;
    size_t        pos   = 0;
    int           count = 0;
    unsigned int  tmp;

    vector<const Attribute *>::const_iterator it;

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

    VirtualNetworkTemplate::set_restricted_attributes(restricted_attrs);
    AddressRange::set_restricted_attributes(restricted_attrs);

    register_hooks(hook_mads, remotes_location);

    for (it = _inherit_attrs.begin(); it != _inherit_attrs.end(); it++)
    {
        const SingleAttribute* sattr = static_cast<const SingleAttribute *>(*it);

        inherit_attrs.push_back(sattr->value());
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::allocate (
    int            uid,
    int            gid,
    const string&  uname,
    const string&  gname,
    int            umask,
    int            pvid,
    VirtualNetworkTemplate * vn_template,
    int *          oid,
    int            cluster_id,
    const string&  cluster_name,
    string&        error_str)
{
    VirtualNetwork * vn;
    VirtualNetwork * vn_aux = 0;

    string name;

    ostringstream oss;

    vn = new VirtualNetwork(uid, gid, uname, gname, umask, pvid,
                            cluster_id, cluster_name, vn_template);

    // Check name
    vn->PoolObjectSQL::get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    // Check for duplicates
    vn_aux = get(name,uid,false);

    if( vn_aux != 0 )
    {
        goto error_duplicated;
    }

    *oid = PoolSQL::allocate(vn, error_str);

    return *oid;


error_duplicated:
    oss << "NAME is already taken by NET " << vn_aux->get_oid() << ".";
    error_str = oss.str();

error_name:
    delete vn;
    *oid = -1;

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
        oss << "User " << uid << " does not own a network with name: " << name
            << " . Set NETWORK_UNAME or NETWORK_UID of owner in NIC.";

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

int VirtualNetworkPool::nic_attribute(
        PoolObjectSQL::ObjectType   ot,
        VectorAttribute*            nic,
        int                         nic_id,
        int                         uid,
        int                         vid,
        string&                     error)
{
    int              rc;
    string           network;
    VirtualNetwork * vnet = 0;

    nic->replace("NIC_ID", nic_id);

    if (!(network = nic->vector_value("NETWORK_ID")).empty())
    {
        vnet = get_nic_by_id(network, error);
    }
    else if (!(network = nic->vector_value("NETWORK")).empty())
    {
        vnet = get_nic_by_name (nic, network, uid, error);
    }
    else //Not using a pre-defined network
    {
        return -2;
    }

    if (vnet == 0)
    {
        return -1;
    }

    if (ot == PoolObjectSQL::VM)
    {
        rc = vnet->nic_attribute(nic, vid, inherit_attrs);
    }
    else // (ot == PoolObjectSQL::VROUTER)
    {
        rc = vnet->vrouter_nic_attribute(nic, vid, inherit_attrs);
    }

    if ( rc == 0 )
    {
        update(vnet);
    }
    else
    {
        ostringstream oss;
        oss << "Cannot get IP/MAC lease from virtual network " << vnet->get_oid() << ".";

        error = oss.str();
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
