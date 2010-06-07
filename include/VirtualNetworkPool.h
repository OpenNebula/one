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

#ifndef VIRTUAL_NETWORK_POOL_H_
#define VIRTUAL_NETWORK_POOL_H_

#include "PoolSQL.h"
#include "VirtualNetwork.h"

#include <time.h>

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
     *  Function to allocate a new VN object
     *    @param uid user identifier
     *    @param stemplate a string describing the VN
     *    @param oid the id assigned to the VM (output)
     *    @return oid on success, -1 error inserting in DB,-2 error parsing
     *     the template, -3 wrong attributes in template
     */
    int allocate (
        int     uid,
        const  string& stemplate,
        int *  oid);

    /**
     *  Function to get a VN from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid VN unique id
     *    @param lock locks the VN mutex
     *    @return a pointer to the VN, 0 if the VN could not be loaded
     */
    VirtualNetwork * get(
        int     oid,
        bool    lock)
    {
        return static_cast<VirtualNetwork *>(PoolSQL::get(oid,lock));
    };

    /**
     *  Function to get a VN from the pool using the network name
     *  If the object is not in memory it is loaded from the DB
     *    @param name VN unique name
     *    @param lock locks the VN mutex
     *    @return a pointer to the VN, 0 if the VN could not be loaded
     */
    VirtualNetwork * get(
        const string&  name,
        bool           lock);

    //--------------------------------------------------------------------------
    // Virtual Network DB access functions
    //--------------------------------------------------------------------------

    /**
     *  Updates the template of a VN, adding a new attribute (replacing it if
     *  already defined), the VN's mutex SHOULD be locked
     *    @param vn pointer to the virtual network object
     *    @param name of the new attribute
     *    @param value of the new attribute
     *    @return 0 on success
     */
    int update_template_attribute(
        VirtualNetwork *    vn,
        string&             name,
        string&             value)
    {
        return vn->update_template_attribute(db,name,value);
    };

    /**
     *  Bootstraps the database table(s) associated to the VirtualNetwork pool
     */
    static void bootstrap(SqlDB * _db)
    {
        VirtualNetwork::bootstrap(_db);
    };

    /**
     *  Dumps the Virtual Network pool in XML format. A filter can be also added
     *  to the query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where);

private:
    /**
     *  Holds the system-wide MAC prefix
     */
    unsigned int     mac_prefix;

    /**
     *  Default size for Virtual Networks
     */
    unsigned int     default_size;

    /**
     * Default public scope
     **/
    string              default_public;

    /**
     *  Factory method to produce VN objects
     *    @return a pointer to the new VN
     */
    PoolObjectSQL * create()
    {
        return new VirtualNetwork(mac_prefix, default_size);
    };

    /**
     *  Callback function to get output the virtual network pool in XML format
     *  (VirtualNetworkPool::dump)
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int dump_cb(void * _oss, int num, char **values, char **names);

    /**
     *  Callback function to get the ID of a given virtual network
     *  (VirtualNetworkPool::get)
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int get_cb(void * _oss, int num, char **values, char **names);
};

#endif /*VIRTUAL_NETWORK_POOL_H_*/
