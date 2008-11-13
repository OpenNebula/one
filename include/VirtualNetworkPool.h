/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

    VirtualNetworkPool(SqliteDB * 		db, 
    				   const string&	str_mac_prefix,
    				   int 				default_size);

    ~VirtualNetworkPool(){};

    /**
     *  Function to allocate a new VN object
     *    @param uid user identifier
     *    @param stemplate a string describing the VN
     *    @param oid the id assigned to the VM (output)
     *    @return 0 on success, -1 error inserting in DB,-2 error parsing 
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
        bool    	   lock);

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
        VirtualNetwork *	vn,
        string&			 	name,
        string&			 	value)
    {
    	return vn->update_template_attribute(db,name,value);
    };

    /**
     *  Bootstraps the database table(s) associated to the VirtualNetwork pool
     */
    void bootstrap()
    {
        VirtualNetwork::bootstrap(db);
    };
    
    /** Drops a VN from the cache & DB, the VN mutex MUST BE locked
     *    @param vn pointer to VN
     */
    int drop(VirtualNetwork * vn)
    {
    	int rc = vn->drop(db);
    	
    	if ( rc == 0)
    	{
    		remove(static_cast<PoolObjectSQL *>(vn));	
    	}
        
        return rc;
    };
    
private:
    /**
     *  Factory method to produce VN objects
     *    @return a pointer to the new VN
     */
    PoolObjectSQL * create()
    {
        return new VirtualNetwork(mac_prefix, default_size);
    };
    
    /**
     *  Holds the system-wide MAC prefix
     */
    unsigned int     mac_prefix;
    
    /**
     *  Default size for Virtual Networks
     */
    unsigned int     default_size;    
};
 
#endif /*VIRTUAL_NETWORK_POOL_H_*/
