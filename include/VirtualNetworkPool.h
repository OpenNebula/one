/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#ifndef VIRTUAL_NETWORK_POOL_H_
#define VIRTUAL_NETWORK_POOL_H_

#include "PoolSQL.h"
#include "VirtualNetwork.h"
#include "BitMap.h"

#include <time.h>

class AuthRequest;
class VirtualMachineNic;

using namespace std;

/**
 *  The Virtual Network Pool class. ...
 */
class VirtualNetworkPool : public PoolSQL
{
public:

    VirtualNetworkPool(SqlDB * db,
            const string& str_mac_prefix,
            int default_size,
            vector<const SingleAttribute *>& restricted_attrs,
            vector<const VectorAttribute *>& hook_mads,
            const string& remotes_location,
            const vector<const SingleAttribute *>& _inherit_attrs,
            const VectorAttribute * vlan_conf,
            const VectorAttribute * vxlan_conf);

    ~VirtualNetworkPool(){};

    //--------------------------------------------------------------------------
    // Virtual Network DB access functions
    //--------------------------------------------------------------------------
    /**
     *  Function to allocate a new VNET object
     *    @param uid user identifier
     *    @param gid the id of the group this object is assigned to
     *    @param uname user name
     *    @param gname group name
     *    @param umask permissions umask
     *    @param vn_template a VirtualNetworkTemplate describing the VNET
     *    @param oid the id assigned to the VM (output)
     *    @param cluster_ids the ids of the clusters this VNET will belong to
     *    @param error_str Returns the error reason, if any
     *    @return oid on success, -1 error
     */
    int allocate (
        int                         uid,
        int                         gid,
        const string&               uname,
        const string&               gname,
        int                         umask,
        int                         parent_vid,
        VirtualNetworkTemplate *    vn_template,
        int *                       oid,
        const set<int>              &cluster_ids,
        string&                     error_str);

    /**
     *  Drops a Virtual Network and the associated VLAN_ID if needed
     */
    int drop(PoolObjectSQL * vn, string& error_msg)
    {
        release_vlan_id(static_cast<VirtualNetwork *>(vn));

        return PoolSQL::drop(vn, error_msg);
    };

    /**
     *  Function to get a VN from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid VN unique id
     *    @param lock locks the VN mutex
     *    @return a pointer to the VN, 0 if the VN could not be loaded
     */
    VirtualNetwork * get(int oid, bool lock)
    {
        return static_cast<VirtualNetwork *>(PoolSQL::get(oid,lock));
    };

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param name of the object
     *   @param uid id of owner
     *   @param lock locks the object if true
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    VirtualNetwork * get(const string& name, int uid, bool lock)
    {
        return static_cast<VirtualNetwork *>(PoolSQL::get(name,uid,lock));
    };

    /**
     *  Bootstraps the database table(s) associated to the VirtualNetwork pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        ostringstream oss;

        int rc;

        rc  = VirtualNetwork::bootstrap(_db);
        rc += _db->exec_local_wr(BitMap<0>::bootstrap(vlan_table, oss));

        return rc;
    };

    /**
     *  Dumps the Virtual Network pool in XML format. A filter can be also added
     *  to the query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param limit parameters used for pagination
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where, const string& limit)
    {
        return PoolSQL::dump(oss, "VNET_POOL", VirtualNetwork::table, where,
                             limit);
    }

    /**
     *  Get the mac prefix
     *  @return the mac prefix
     */
    static const unsigned int& mac_prefix()
    {
        return _mac_prefix;
    };

    /**
     *  Get the default network size
     *  @return the size
     */
    static const unsigned int& default_size()
    {
        return _default_size;
    };

    /**
     *  Gets the IDs of VNETs matching the given SQL where string.
     *    @param oids a vector that contains the IDs
     *    @param where SQL clause
     *    @return 0 on success
     */
    int search(vector<int>& oids, const string& where)
    {
        return PoolSQL::search(oids, VirtualNetwork::table, where);
    };

    //--------------------------------------------------------------------------
    // NIC Attribute build functions
    //--------------------------------------------------------------------------
    /**
     *  Generates a NIC attribute for VM templates using the VirtualNetwork
     *  metadata
     *    @param nic the nic attribute to be generated
     *    @param nic_id the id for this NIC
     *    @param uid of the VM owner
     *    @param vid of the VM requesting the lease
     *    @param error_str string describing the error
     *    @return 0 on success,
     *            -1 error,
     *            -2 not using the pool
     */
    int nic_attribute(
            PoolObjectSQL::ObjectType   ot,
            VirtualMachineNic *         nic,
            int                         nic_id,
            int                         uid,
            int                         vid,
            string&                     error_str);

    /**
     *  Generates an Authorization token for a NIC attribute
     *    @param nic the nic to be authorized
     *    @param ar the AuthRequest
     */
    void authorize_nic(
            PoolObjectSQL::ObjectType   ot,
            VirtualMachineNic *         nic,
            int                         uid,
            AuthRequest *               ar);

    //--------------------------------------------------------------------------
    // VNET Reservation interface
    //--------------------------------------------------------------------------
    /**
     *  Reserve an address range
     *    @param pid the parent VNET ID to get the leases from
     *    @param rid the reservation VNET ID to store the reserved AR
     *    @param rsize number of addresses to reserve
     *    @param err error message
     *    @return 0 on success
     */
    int reserve_addr(int pid, int rid, unsigned int rsize, string& err);

    /**
     *  Reserve an address range
     *    @param pid the parent VNET ID to get the leases from
     *    @param rid the reservation VNET ID to store the reserved AR
     *    @param rsize number of addresses to reserve
     *    @param ar_id AR to make the reservation from
     *    @param err error message
     *    @return 0 on success
     */
    int reserve_addr(int pid, int rid, unsigned int rsize, unsigned int ar_id,
            string& err);

    /**
     *  Reserve an address range
     *    @param pid the parent VNET ID to get the leases from
     *    @param rid the reservation VNET ID to store the reserved AR
     *    @param rsize number of addresses to reserve
     *    @param ar_id AR to make the reservation from
     *    @param ip/mac the first ip/mac in the reservations
     *    @param err error message
     *    @return 0 on success
     */
    int reserve_addr_by_ip(int pid, int rid, unsigned int rsize,
            unsigned int ar_id, const string& ip, string& err);

    int reserve_addr_by_ip6(int pid, int rid, unsigned int rsize,
            unsigned int ar_id, const string& ip, string& err);

    int reserve_addr_by_mac(int pid, int rid, unsigned int rsize,
            unsigned int ar_id, const string& mac, string& err);

private:
    /**
     *  Holds the system-wide MAC prefix
     */
    static unsigned int _mac_prefix;

    /**
     *  Default size for Virtual Networks
     */
    static unsigned int _default_size;

    /**
     * VNet attributes to be injected into the VM nic
     */
    vector<string> inherit_attrs;

    /**
     *  Configuration attributes for the vlan_id pool
     */
    const VectorAttribute vlan_conf;

    /**
     *  Bitmap with vlan_id in use for the 802.1Q driver
     */
    BitMap<4096> vlan_id_bitmap;

   /**
    *  ID for the VLAN_BITMAP, to store it in the DB
    */
    static const int VLAN_BITMAP_ID;

    /**
     *  Configuration attributes for the vxlan_id pool
     */
    const VectorAttribute vxlan_conf;

    /**
     * Virtual Network bitmap pool for VLANs table
     */
    static const char * vlan_table;

    //--------------------------------------------------------------------------
    // NIC Attribute build functions
    //--------------------------------------------------------------------------
    /**
     *  Function to get a VirtualNetwork by its name, as provided by a VM
     *  template
     */
    VirtualNetwork * get_nic_by_name(VirtualMachineNic * nic,
                                     const string&     name,
                                     int               _uidi,
                                     string&           error);
    /**
     *  Function to get a VirtualNetwork by its id, as provided by a VM template
     */
    VirtualNetwork * get_nic_by_id(const string& id_s, string& error);

    //--------------------------------------------------------------------------
    // VLAN ID management functions
    //--------------------------------------------------------------------------
    /**
     *  Gets a free VLAN_ID, if not set by the user, and for VXLAN, VLAN and
     *  OVSWITCH networks.
     *    @param vn pointer to the network
     *    @return 0 on success
     */
    int set_vlan_id(VirtualNetwork * vn);

    /**
     *  Free a previously allocated VLAN ID if needed
     *    @param vn pointer to the network
     */
    void release_vlan_id(VirtualNetwork *vn);

    //--------------------------------------------------------------------------
    // VNET Reservation Functions
    //--------------------------------------------------------------------------
    /**
     *  Allocate a new AR from the given VNET
     *    @param rid VNET ID
     *    @param err string if any
     *    @return pointer to the allocated AR
     */
    AddressRange * allocate_ar(int rid, string &err);

    /**
     *  Adds a new AR to a VNET
     *    @param rid VNET ID
     *    @param ar pointer to the AR
     *    @param err string if any
     *    @return 0 on success
     */
    int add_ar(int rid, AddressRange *rar, string &err);

    /**
     *  Factory method to produce VN objects
     *    @return a pointer to the new VN
     */
    PoolObjectSQL * create()
    {
        set <int> empty;
        return new VirtualNetwork(-1,-1,"","",0,-1,empty,0);
    };
};

#endif /*VIRTUAL_NETWORK_POOL_H_*/
