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

#ifndef FIXED_LEASES_H_
#define FIXED_LEASES_H_

#include "Leases.h"

using namespace std;

/**
 *  The FixedLeases class represents a pool of fixed IP-MAC leases. A lease can
 *  be either a IP (the MAC is then PREFIX:IP) or the IP and MAC addresses. The
 *  pool is read from a template file, each lease is in the form:
 *    LEASE = [ IP = "<the ip>", MAC = "<the mac>"]
 */
class FixedLeases : public Leases
{
public:
    /**
     *  Create a FixedLeases from template
     */
    FixedLeases(SqlDB *                     db,
                int                         _oid,
                unsigned int                _mac_prefix,
                vector<const Attribute*>&   vector_leases);
    /**
     *  Create a plain FixedLeases, you can populate the lease pool using
     *  select()
     */
    FixedLeases(SqlDB *                     db,
                int                         _oid,
                unsigned int                _mac_prefix):
                    Leases(db,_oid,0,_mac_prefix),
                    current(leases.begin()){};

    ~FixedLeases(){};

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
        unset(ip);
    }

    /**
     * Adds New leases.
     *   @param vector_leases vector of VectorAttribute objects. For the
     *          moment, the vector can only contain one LEASE
     *   @param error_msg If the action fails, this message contains
     *          the reason.
     *   @return 0 on success
     */
    int add_leases(vector<const Attribute*>& leases, string& error_msg);

    /**
     * Removes leases; if they are not used.
     *  @param vector_leases vector of VectorAttribute objects. For the
     *         moment, the vector can only contain one LEASE.
     *  @param error_msg If the action fails, this message contains
     *         the reason.
     *  @return 0 on success
     */
    int remove_leases(vector<const Attribute*>& leases, string& error_msg);

    /**
     *  Loads the leases from the DB.
     */
    int select(SqlDB * db)
    {
        //Read the leases from the DB
        int rc = Leases::select(db);
        //Update the size
        size = leases.size();

        return rc;
    }

private:

    /**
     *  Current lease pointer
     */
    map<unsigned int, Lease *>::iterator  current;

    /**
     * Add a lease, from the Lease interface
     *  @param ip ip of the lease
     *  @param mac mac of the lease
     *  @param vid identifier of the VM getting this lease
     *  @param error_msg If the action fails, this message contains the reason.
     *  @param used Flag to insert the lease as used.
     *  @return 0 if success
     */
     int add(const string&  ip,
             const string&  mac,
             int            vid,
             string&        error_msg,
             bool           used=true);

    /**
     * Remove an existing lease, if it is not in use.
     *   @param ip ip of the lease
     *   @param error_msg If the action fails, this message contains the reason
     */
     int remove(const string& ip, string& error_msg);

    /**
     * Sets a lease as not used, from the Lease interface
     * @param ip ip of the lease to be deleted
     * @return 0 if success
     */
     int unset(const string& ip);

    /**
     * Updates the DB entry for this lease
     * @param lease Lease to be updated
     * @return 0 if success
     */
    int update_lease(Lease * lease);
};

#endif /*FIXED_LEASES_H_*/
