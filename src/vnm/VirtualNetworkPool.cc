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

const char * VirtualNetworkPool::vlan_table = "network_vlan_bitmap";

const int VirtualNetworkPool::VLAN_BITMAP_ID = 0;

/* -------------------------------------------------------------------------- */

VirtualNetworkPool::VirtualNetworkPool(
    SqlDB *                             db,
    const string&                       prefix,
    int                                 __default_size,
    vector<const SingleAttribute *>&    restricted_attrs,
    vector<const VectorAttribute *>&    hook_mads,
    const string&                       remotes_location,
    const vector<const SingleAttribute *>& _inherit_attrs,
    const VectorAttribute *             _vlan_conf,
    const VectorAttribute *             _vxlan_conf):
        PoolSQL(db, VirtualNetwork::table, true, true), vlan_conf(_vlan_conf),
        vlan_id_bitmap(vlan_conf, VLAN_BITMAP_ID, vlan_table),
        vxlan_conf(_vxlan_conf)
{
    istringstream iss;
    size_t        pos   = 0;
    int           count = 0;
    unsigned int  tmp;

    vector<const SingleAttribute *>::const_iterator it;

    string mac = prefix;

    _mac_prefix   = 0;
    _default_size = __default_size;

    if ( vlan_id_bitmap.select(VLAN_BITMAP_ID, db) != 0 )
    {
        vlan_id_bitmap.insert(VLAN_BITMAP_ID, db);
    }

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
        inherit_attrs.push_back((*it)->value());
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::allocate (
        int                         uid,
        int                         gid,
        const string&               uname,
        const string&               gname,
        int                         umask,
        int                         pvid,
        VirtualNetworkTemplate *    vn_template,
        int *                       oid,
        const set<int>              &cluster_ids,
        string&                     error_str)
{
    VirtualNetwork * vn;
    VirtualNetwork * vn_aux = 0;

    string name;

    ostringstream oss;

    vn = new VirtualNetwork(uid, gid, uname, gname, umask, pvid,
                            cluster_ids, vn_template);

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

    // Insert the VN in the DB
    *oid = PoolSQL::allocate(vn, error_str);

    // Get a free VLAN_ID from the pool if needed
    if ( *oid != -1 )
    {
        vn = get(*oid, true);

        if ( set_vlan_id(vn) != 0 )
        {
            error_str = "Cannot automatically assign VLAN_ID to network.";
            drop(vn, error_str);

            *oid = -1;
        };

        vn->unlock();
    }

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
        oss << "Cannot get IP/MAC lease from virtual network "
            << vnet->get_oid() << ".";

        error = oss.str();
    }

    vnet->unlock();


    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkPool::authorize_nic(
        PoolObjectSQL::ObjectType   ot,
        VectorAttribute *           nic,
        int                         uid,
        AuthRequest *               ar)
{
    string           network;
    VirtualNetwork * vnet = 0;
    PoolObjectAuth   perm;
    string           error;

    if (!(network = nic->vector_value("NETWORK_ID")).empty())
    {
        vnet = get_nic_by_id(network, error);
    }
    else if (!(network = nic->vector_value("NETWORK")).empty())
    {
        vnet = get_nic_by_name (nic, network, uid, error);

        if ( vnet != 0 )
        {
            nic->replace("NETWORK_ID", vnet->get_oid());
        }
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::set_vlan_id(VirtualNetwork * vn)
{
    string vn_mad;

    unsigned int start_vlan, hint_vlan;
    unsigned int vlan_id;

    ostringstream oss;

    if ( !vn->vlan_id.empty() || !vn->vlan_id_automatic )
    {
        return 0;
    }

    if ( vn->vn_mad.empty() )
    {
        return 0;
    }

    switch (VirtualNetwork::str_to_driver(vn->vn_mad))
    {
        case VirtualNetwork::VXLAN:
            if (vxlan_conf.vector_value("START", start_vlan) != 0)
            {
                start_vlan = 2; //default in oned.conf
            }

            vlan_id = start_vlan + vn->get_oid();
            oss << vlan_id;

            vn->vlan_id = oss.str();

            vn->vlan_id_automatic = true;

            update(vn);

            break;

        case VirtualNetwork::VLAN:
        case VirtualNetwork::OVSWITCH:
            start_vlan = vlan_id_bitmap.get_start_bit();
            hint_vlan  = start_vlan + (vn->get_oid() % (4095 - start_vlan ));

            if ( vlan_id_bitmap.get(hint_vlan, vlan_id) != 0 )
            {
                return -1;
            }

            oss << vlan_id;

            vn->vlan_id = oss.str();
            vn->vlan_id_automatic = true;

            vlan_id_bitmap.update(db);

            update(vn);

            break;

        default:
            break;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkPool::release_vlan_id(VirtualNetwork *vn)
{
    istringstream  is;

    unsigned int vlan_id;

    if ( !vn->vlan_id_automatic )
    {
        return;
    }

    if ( vn->vlan_id.empty() )
    {
        return;
    }

    if ( vn->vn_mad.empty() )
    {
        return;
    }

    is.str(vn->vlan_id);
    is >> vlan_id;

    switch (VirtualNetwork::str_to_driver(vn->vn_mad))
    {
        case VirtualNetwork::VLAN:
        case VirtualNetwork::OVSWITCH:
            vlan_id_bitmap.reset(vlan_id);
            vlan_id_bitmap.update(db);
            break;

        default:
            break;
    }
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

AddressRange * VirtualNetworkPool::allocate_ar(int rid, string &err)
{
    VirtualNetwork * rvn = get(rid, true);

    if ( rvn == 0 )
    {
        ostringstream oss;
        oss << "Virtual network " << rid << " does not exist";

        err = oss.str();
        return 0;
    }

    AddressRange *ar = rvn->allocate_ar();

    update(rvn);

    rvn->unlock();

    return ar;
}

int VirtualNetworkPool::add_ar(int rid, AddressRange *rar, string &err)
{
    VirtualNetwork * rvn = get(rid, true);

    if ( rvn == 0 )
    {
        delete rar;

        ostringstream oss;
        oss << "Virtual network " << rid << " does not exist";

        err = oss.str();
        return -1;
    }

    int rc = rvn->add_ar(rar);

    update(rvn);

    rvn->unlock();

    if ( rc != 0 )
    {
        delete rar;

        err = "Could not add the address range to the netwok";
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::reserve_addr(int pid, int rid, unsigned int rsize, string& err)
{
    AddressRange * rar = allocate_ar(rid, err);

    if ( rar == 0 )
    {
        return -1;
    }

    VirtualNetwork * pvn = get(pid, true);

    if ( pvn == 0 )
    {
        delete rar;

        ostringstream oss;
        oss << "Virtual network " << pid << " does not exist";

        err = oss.str();
        return -1;
    }

    int rc = pvn->reserve_addr(rid, rsize, rar, err);

    update(pvn);

    pvn->unlock();

    if ( rc != 0)
    {
        delete rar;
        return -1;
    }

    return add_ar(rid, rar, err);
}

/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::reserve_addr(int pid, int rid, unsigned int rsize, unsigned int ar_id,
        string& err)
{
    AddressRange * rar = allocate_ar(rid, err);

    if ( rar == 0 )
    {
        return -1;
    }

    VirtualNetwork * pvn = get(pid, true);

    if ( pvn == 0 )
    {
        delete rar;

        ostringstream oss;
        oss << "Virtual network " << pid << " does not exist";

        err = oss.str();
        return -1;
    }

    int rc = pvn->reserve_addr(rid, rsize, ar_id, rar, err);

    update(pvn);

    pvn->unlock();

    if ( rc != 0)
    {
        delete rar;
        return -1;
    }

    return add_ar(rid, rar, err);
}

/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::reserve_addr_by_ip(int pid, int rid, unsigned int rsize, unsigned int ar_id,
        const string& ip, string& err)
{
    AddressRange * rar = allocate_ar(rid, err);

    if ( rar == 0 )
    {
        return -1;
    }

    VirtualNetwork * pvn = get(pid, true);

    if ( pvn == 0 )
    {
        delete rar;

        ostringstream oss;
        oss << "Virtual network " << pid << " does not exist";

        err = oss.str();
        return -1;
    }

    int rc = pvn->reserve_addr_by_ip(rid, rsize, ar_id, ip, rar, err);

    update(pvn);

    pvn->unlock();

    if ( rc != 0)
    {
        delete rar;
        return -1;
    }

    return add_ar(rid, rar, err);
}

/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::reserve_addr_by_mac(int pid, int rid, unsigned int rsize, unsigned int ar_id,
        const string& mac, string& err)
{
    AddressRange * rar = allocate_ar(rid, err);

    if ( rar == 0 )
    {
        return -1;
    }

    VirtualNetwork * pvn = get(pid, true);

    if ( pvn == 0 )
    {
        delete rar;

        ostringstream oss;
        oss << "Virtual network " << pid << " does not exist";

        err = oss.str();
        return -1;
    }

    int rc = pvn->reserve_addr_by_mac(rid, rsize, ar_id, mac, rar, err);

    update(pvn);

    pvn->unlock();

    if ( rc != 0)
    {
        delete rar;
        return -1;
    }

    return add_ar(rid, rar, err);
}

