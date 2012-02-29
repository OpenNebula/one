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

#ifndef VIRTUAL_NETWORK_POOL_H_
#define VIRTUAL_NETWORK_POOL_H_

#include "PoolSQL.h"
#include "VirtualNetwork.h"

#include <time.h>

class AuthRequest;

using namespace std;

/**
 *  The Virtual Network Pool class. ...
 */
class VirtualNetworkPool : public PoolSQL
{
public:

    VirtualNetworkPool(SqlDB *          db,
                       const string&    str_mac_prefix,
                       int              default_size);

    ~VirtualNetworkPool(){};

    /**
     *  Function to allocate a new VNET object
     *    @param uid user identifier
     *    @param gid the id of the group this object is assigned to
     *    @param vn_template a VirtualNetworkTemplate describing the VNET
     *    @param oid the id assigned to the VM (output)
     *    @param cluster_id the id of the cluster this VNET will belong to
     *    @param cluster_name the name of the cluster this VNET will belong to
     *    @param error_str Returns the error reason, if any
     *    @return oid on success, -1 error
     */
    int allocate (
        int                         uid,
        int                         gid,
        const string&               uname,
        const string&               gname,
        VirtualNetworkTemplate *    vn_template,
        int *                       oid,
        int                         cluster_id,
        const string&               cluster_name,
        string&                     error_str);

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

    //--------------------------------------------------------------------------
    // Virtual Network DB access functions
    //--------------------------------------------------------------------------

    /**
     *  Generates a NIC attribute for VM templates using the VirtualNetwork
     *  metadata
     *    @param nic the nic attribute to be generated
     *    @param vid of the VM requesting the lease
     *    @param error_str string describing the error
     *    @return 0 on success, 
     *            -1 error, 
     *            -2 not using the pool
     */
    int nic_attribute(VectorAttribute * nic, int uid, int vid, string& error_str);

    /**
     *  Generates an Authorization token for a NIC attribute
     *    @param nic the nic to be authorized
     *    @param ar the AuthRequest
     */
    void authorize_nic(VectorAttribute * nic, int uid, AuthRequest * ar);

    /**
     *  Bootstraps the database table(s) associated to the VirtualNetwork pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        return VirtualNetwork::bootstrap(_db);
    };

    /**
     *  Dumps the Virtual Network pool in XML format. A filter can be also added
     *  to the query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where)
    {
        return PoolSQL::dump(oss, "VNET_POOL", VirtualNetwork::table,where);
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

private:
    /**
     *  Holds the system-wide MAC prefix
     */
    static unsigned int     _mac_prefix;

    /**
     *  Default size for Virtual Networks
     */
    static unsigned int     _default_size;

    /**
     *  Factory method to produce VN objects
     *    @return a pointer to the new VN
     */
    PoolObjectSQL * create()
    {
        return new VirtualNetwork(-1,-1,"","",-1,"",0);
    };

    /**
     *  Function to get a VirtualNetwork by its name, as provided by a VM 
     *  template
     */
    VirtualNetwork * get_nic_by_name(VectorAttribute * nic, 
                                     const string&     name,
                                     int               _uidi,
                                     string&           error);

    /**
     *  Function to get a VirtualNetwork by its id, as provided by a VM template
     */
    VirtualNetwork * get_nic_by_id(const string& id_s, string& error);
};

#endif /*VIRTUAL_NETWORK_POOL_H_*/
