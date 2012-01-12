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

#ifndef RANGED_LEASES_H_
#define RANGED_LEASES_H_

#include "Leases.h"
#include "VirtualNetwork.h"

using namespace std;

class RangedLeases : public Leases
{
public:

    // *************************************************************************
    // Constructor
    // *************************************************************************
    RangedLeases(SqlDB *        db,
                 int           _oid,
                 unsigned int  _mac_prefix,
                 unsigned int  _ip_start,
                 unsigned int  _ip_end);

    ~RangedLeases(){};

    /**
     * Reads (and clears) the necessary attributes to define a Ranged VNet
     * @param vn Virtual Network
     * @param ip_start First IP of the range
     * @param ip_end Last IP of the range
     * @param error_str Error reason, if any
     * @return 0 on success, -1 otherwise
     */
    static int process_template(VirtualNetwork * vn,
            unsigned int& ip_start, unsigned int& ip_end, string& error_str);

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
     *  Adds New leases.
     *  Only available for FIXED networks.
     *    @param vector_leases vector of VectorAttribute objects. For the
     *      moment, the vector can only contain one LEASE.
     *    @param error_msg If the action fails, this message contains
     *      the reason.
     *    @return 0 on success
     */
    int add_leases(vector<const Attribute*>& vector_leases, string& error_msg)
    {
        error_msg = "Adding new leases is only supported for FIXED networks.";
        return -1;
    }

    /**
     *  Removes leases; if they are not used.
     *  Only available for FIXED networks.
     *    @param vector_leases vector of VectorAttribute objects. For the
     *      moment, the vector can only contain one LEASE.
     *    @param error_msg If the action fails, this message contains
     *      the reason.
     *    @return 0 on success
     */
    int remove_leases(vector<const Attribute*>& vector_leases, string& error_msg)
    {
        error_msg = "Removing leases is only supported for FIXED networks.";
        return -1;
    }

    /**
     *  Loads the leases from the DB.
     */
    int select(SqlDB * db)
    {
        //Read the leases from the DB
        int rc = Leases::select(db);

        return rc;
    }

private:

    unsigned int ip_start;
    unsigned int ip_end;

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

