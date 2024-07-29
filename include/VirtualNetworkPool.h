/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
#include "OneDB.h"

class AuthRequest;
class VirtualMachineNic;
class VirtualMachine;

/**
 *  The Virtual Network Pool class. ...
 */
class VirtualNetworkPool : public PoolSQL
{
public:

    VirtualNetworkPool(SqlDB * db,
                       const std::string& str_mac_prefix,
                       unsigned long int default_size,
                       std::vector<const SingleAttribute *>& restricted_attrs,
                       std::vector<const SingleAttribute *>& encrypted_attrs,
                       const std::vector<const SingleAttribute *>& _inherit_attrs,
                       const VectorAttribute * vlan_conf,
                       const VectorAttribute * vxlan_conf);

    ~VirtualNetworkPool() {};

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
            const std::string&          uname,
            const std::string&          gname,
            int                         umask,
            int                         parent_vid,
            std::unique_ptr<VirtualNetworkTemplate> vn_template,
            int *                       oid,
            const std::set<int>         &cluster_ids,
            std::string&                error_str);

    /**
     *  Updates a Virtual Network in the data base. It also updates the previous state
     *  after executing the hooks.
     *    @param objsql a pointer to the Host
     *
     *    @return 0 on success.
     */
    int update(PoolObjectSQL * objsql) override;

    /**
     *  Drops a Virtual Network and the associated VLAN_ID if needed
     */
    int drop(PoolObjectSQL * vn, std::string& error_msg) override
    {
        release_vlan_id(static_cast<VirtualNetwork *>(vn));

        return PoolSQL::drop(vn, error_msg);
    };

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the VN unique identifier
     *   @return a pointer to the VN, nullptr in case of failure
     */
    std::unique_ptr<VirtualNetwork> get(int oid)
    {
        return PoolSQL::get<VirtualNetwork>(oid);
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param oid the VN unique identifier
     *   @return a pointer to the VN, nullptr in case of failure
     */
    std::unique_ptr<VirtualNetwork> get_ro(int oid)
    {
        return PoolSQL::get_ro<VirtualNetwork>(oid);
    }

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param name of the object
     *   @param uid id of owner
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    std::unique_ptr<VirtualNetwork> get(const std::string& name, int uid)
    {
        return PoolSQL::get<VirtualNetwork>(name, uid);
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param name of the object
     *   @param uid id of owner
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    std::unique_ptr<VirtualNetwork> get_ro(const std::string& name, int uid)
    {
        return PoolSQL::get_ro<VirtualNetwork>(name, uid);
    }

    /**
     *  Bootstraps the database table(s) associated to the VirtualNetwork pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        std::ostringstream oss;

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
     *  @param sid first element used for pagination
     *  @param eid last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(std::string& oss, const std::string& where, int sid, int eid,
             bool desc) override
    {
        return PoolSQL::dump(oss, "VNET_POOL", "body", one_db::vn_table,
                             where, sid, eid, desc);
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
    static const unsigned long int& default_size()
    {
        return _default_size;
    };

    /**
     *  Gets the IDs of VNETs matching the given SQL where string.
     *    @param oids a vector that contains the IDs
     *    @param where SQL clause
     *    @return 0 on success
     */
    int search(std::vector<int>& oids, const std::string& where)
    {
        return PoolSQL::search(oids, one_db::vn_table, where);
    };

    const std::set<std::string>& get_inherited_attrs() const
    {
        return inherit_attrs;
    }

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
            std::string&                error_str);

    /**
     *  Generates an Authorization token for a NIC attribute
     *    @param nic the nic to be authorized
     *    @param ar the AuthRequest
     *    @param  check_lock for check if the resource is lock or not
     *    @param uid of user making the request
     *    @param sgs to check the security groups
     */
    void authorize_nic(
            PoolObjectSQL::ObjectType   ot,
            VirtualMachineNic *         nic,
            int                         uid,
            AuthRequest *               ar,
            std::set<int> &             sgs,
            bool                        check_lock);

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
    int reserve_addr(int pid, int rid, unsigned int rsize, std::string& err);

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
                     std::string& err);

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
                           unsigned int ar_id, const std::string& ip, std::string& err);

    int reserve_addr_by_ip6(int pid, int rid, unsigned int rsize,
                            unsigned int ar_id, const std::string& ip, std::string& err);

    int reserve_addr_by_mac(int pid, int rid, unsigned int rsize,
                            unsigned int ar_id, const std::string& mac, std::string& err);

    void delete_success(std::unique_ptr<VirtualNetwork> vn);

private:
    /**
     *  Holds the system-wide MAC prefix
     */
    static unsigned int _mac_prefix;

    /**
     *  Default size for Virtual Networks
     */
    static unsigned long int _default_size;

    /**
     * VNet attributes to be injected into the VM nic
     */
    std::set<std::string> inherit_attrs;

    /**
     *  Configuration attributes for the vlan_id pool
     */
    const VectorAttribute vlan_conf;

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
    std::unique_ptr<VirtualNetwork> get_nic_by_name(VirtualMachineNic * nic,
                                                    const std::string&  name,
                                                    int                 _uidi,
                                                    bool                ro,
                                                    std::string&        error);
    /**
     *  Function to get a VirtualNetwork by its id, as provided by a VM template
     */
    std::unique_ptr<VirtualNetwork> get_nic_by_id(const std::string& id_s,
                                                  bool ro,
                                                  std::string& error);

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
     *  Helper functions to compute the next vlan_id for 802.1Q and VXLAN.
     *    @param vnid network id
     *    @param vlan_var, attribute to store the vlan_id
     *    @param auto_var, attribute to flag this vlan_id as auto generated
     */
    int set_8021Q_id(int vnid, std::string& vlan_var, bool& auto_var);

    int set_vxlan_id(int vnid, std::string& vlan_var, bool& auto_var);

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
    AddressRange * allocate_ar(int rid, std::string &err);

    /**
     *  Adds a new AR to a VNET
     *    @param rid VNET ID
     *    @param ar pointer to the AR
     *    @param err string if any
     *    @return 0 on success
     */
    int add_ar(int rid, AddressRange *rar, std::string &err);

    /**
     *  Factory method to produce VN objects
     *    @return a pointer to the new VN
     */
    PoolObjectSQL * create() override
    {
        std::set <int> empty;
        return new VirtualNetwork(-1, -1, "", "", 0, -1, empty, 0);
    };
};

#endif /*VIRTUAL_NETWORK_POOL_H_*/
