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

#ifndef RANGED_LEASES_H_
#define RANGED_LEASES_H_

#include "Leases.h"

using namespace std;

class RangedLeases : public Leases
{
public:

    // *************************************************************************
    // Constructor
    // *************************************************************************
    RangedLeases(SqliteDB *    db,
                 int           _oid,
                 unsigned long _size,
                 unsigned int  _mac_prefix,
                 const string& _network_address);

    ~RangedLeases(){};

    /**
     * Returns an unused lease, which becomes used
     *   @param vid identifier of the VM getting this lease
     *   @param ip ip of the returned lease
     *   @param mac mac of  the returned lease
     *   @return 0 if success
     */
    int get(int vid, string&  ip, string&  mac);

    /**
     * Ask for a specific lease in the network
     *  @param vid identifier of the VM getting this lease
     *  @param ip ip of lease requested
     *  @param mac mac of the lease
     *  @return 0 if success
     */
    int set(int vid, const string&  ip, string&  mac);
    
    /**
     * Release an used lease, which becomes unused
     *   @param ip of the lease in use
     */
    void release(const string& ip)
    {
    	del(ip);
    }
    
    /**
     *  Loads the leases from the DB.
     */
    int select(SqliteDB * db)
    {
    	//Read the leases from the DB
    	int rc = Leases::select(db);
    	
    	return rc;
    }
    
private:
	/**
	 *  The default MAC prefix for the OpenNebula cluster
	 */
	unsigned int mac_prefix;
	
	/**
	 *  The Network address to generate leases
	 */
	unsigned int network_address;
	
	unsigned int current;
	
    /**
     * Add a lease, from the Lease interface
     * @param ip ip of the lease
     * @param mac mac of the lease
     * @param vid identifier of the VM getting this lease
     * @return 0 if success
     */
     int add(unsigned int ip, unsigned int mac[], int vid, bool used=true);
       
    /**
     * Remove a lease, from the Lease interface
     * @param db pointer to DB
     * @param ip ip of the lease to be deleted
     * @return 0 if success
     */
     int del(const string& ip);
                                   
};

#endif /*RANGED_LEASES_H_*/
