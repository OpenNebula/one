/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#ifndef EXTERNAL_LEASES_H_
#define EXTERNAL_LEASES_H_

#include "Leases.h"
#include "VirtualNetwork.h"

using namespace std;

class ExternalLeases : public Leases
{
/*
# external api
get
set
release

# db api
add
del


TYPE = EXTERNAL
EXTERNAL_COMMAND = "/path/to/executable"
*/

public:

    // *************************************************************************
    // Constructor
    // *************************************************************************
    ExternalLeases(SqlDB *        db,
                 int           _oid,
                 unsigned int  _mac_prefix,
                 unsigned int  _global[],
                 unsigned int  _site[],
                 string        _external_command);

    ~ExternalLeases(){};

    /**
     * Returns an unused lease, which becomes used
     *   @param vid identifier of the VM getting this lease
     *   @param ip ip of the returned lease
     *   @param mac mac of  the returned lease
     *   @return 0 if success
     */
    int get(int vid, string&  ip, string&  mac, unsigned int eui64[]);

    /**
     * Ask for a specific lease in the network
     *  @param vid identifier of the VM getting this lease
     *  @param ip ip of lease requested
     *  @param mac mac of the lease
     *  @return 0 if success
     */
    int set(int vid, const string&  ip, string&  mac, unsigned int eui64[]);

    /**
     * Release an used lease, which becomes unused
     *   @param ip of the lease in use
     */
    void release(const string& ip);


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

    string external_command;

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


    int runCommand(string cmd, string& output, string& error);

    /**
     * Generate a random mac address based on the given prefix.
     * @param mac_prefix mac address prefix
     * @return the generated mac address
     */
    string generateRandomMac(string mac_prefix);

    string mac_prefix_to_string(int mac_prefix);

};

#endif /*EXTERNAL_LEASES_H_*/
