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

#ifndef VIRTUAL_NETWORK_H_
#define VIRTUAL_NETWORK_H_


#include "PoolSQL.h"
#include "Leases.h"
#include "VirtualNetworkTemplate.h"
#include "Clusterable.h"

#include <vector>
#include <string>
#include <map>

#include <time.h>
#include <sstream>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The Virtual Network class. It represents a Virtual Network at manages its 
 *  leases. One lease is formed by one IP and one MAC address.
 *  MAC address are derived from IP addresses.
 */
class VirtualNetwork : public PoolObjectSQL, public Clusterable
{
public:

    /**
     * Possible types of networks
     */

    enum NetworkType
    {
        UNINITIALIZED   = -1,
        RANGED          =  0,
        FIXED           =  1
    };

    // *************************************************************************
    // Virtual Network Public Methods
    // *************************************************************************

    /**
     *  Factory method for virtual network templates
     */
    Template * get_new_template() const
    {
        return new VirtualNetworkTemplate;
    }

    /**
     * Adds Leases to the virtual network (Only implemented for FIXED networks)
     *  @param leases template in the form LEASES = [IP=XX, MAC=XX].
     *         MAC is optional. The template can only contain one LEASE 
     *         definition.
     *  @param error_msg If the action fails, this message contains the reason.
     *  @return 0 on success
     */
    int add_leases(VirtualNetworkTemplate * leases, string& error_msg);

    /**
     * Removes Leases from the virtual network; if they are not used.(Only 
     * implemented for FIXED networks)
     *  @param leases template in the form LEASES = [IP=XX].
     *         The template can only contain one LEASE definition.
     *  @param error_msg If the action fails, this message contains
     *         the reason.
     *  @return 0 on success
     */
    int remove_leases(VirtualNetworkTemplate* leases, string& error_msg);

    /**
     * Holds a Lease, marking it as used
     *  @param leases template in the form LEASES = [IP=XX].
     *          The template can only contain one LEASE definition.
     *  @param error_msg If the action fails, this message contains the reason.
     *  @return 0 on success
     */
    int hold_leases(VirtualNetworkTemplate * leases, string& error_msg);

    /**
     * Releases a Lease on hold
     *  @param leases template in the form LEASES = [IP=XX].
     *          The template can only contain one LEASE definition.
     *  @param error_msg If the action fails, this message contains
     *         the reason.
     *  @return 0 on success
     */
    int free_leases(VirtualNetworkTemplate* leases, string& error_msg);

    /**
     *    Gets a new lease for a specific VM
     *    @param vid VM identifier
     *    @param _ip pointer to string for IP to be stored into
     *    @param _mac pointer to string for MAC to be stored into
     *    @param _bridge name of the physical bridge this VN binds to
     *    @return 0 if success
     */
    int get_lease(int vid, string& _ip, string& _mac, string& _bridge)
    {
        _bridge = bridge;
        return leases->get(vid,_ip,_mac);
    };

    /**
     *    Asks for an specific lease of the given virtual network
     *    @param vid VM identifier
     *    @param _ip the ip of the requested lease
     *    @param _mac pointer to string for MAC to be stored into
     *    @param _bridge name of the physical bridge this VN binds to
     *    @return 0 if success
     */
    int set_lease(int vid, const string& _ip, string& _mac, string& _bridge)
    {
        _bridge = bridge;
        return leases->set(vid,_ip,_mac);
    };

    /**
     *  Release previously given lease
     *    @param _ip IP identifying the lease
     *    @return 0 if success
     */
    void release_lease(const string& ip)
    {
        return leases->release(ip);
    };

    /**
     *  Check if a VM is the owner of the ip 
     *    @param ip of the lease to be checked
     *    @param vid the ID of the VM
     *    @return true if the ip was already assigned
     */
    bool is_owner (const string& ip, int vid)
    {
        return leases->is_owner(ip, vid);
    };

    /**
     *    Gets size of the network (used + free)
     *    @return number of hosts that can be fitted in this network
     */
    unsigned int get_size()
    {
        return leases->size;
    };

    /**
     * Function to print the VirtualNetwork object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    /**
     * Function to print the VirtualNetwork object into a string in
     * XML format. The extended XML includes the LEASES
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml_extended(string& xml) const;

    /**
     * Modifies the given nic attribute adding the following attributes:
     *  * IP:  leased from network
     *  * MAC: leased from network
     *  * BRIDGE: for this virtual network
     *  @param nic attribute for the VM template
     *  @param vid of the VM getting the lease
     *  @return 0 on success
     */
    int nic_attribute(VectorAttribute * nic, int vid);

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class VirtualNetworkPool;

    // *************************************************************************
    // Virtual Network Private Attributes
    // *************************************************************************

    // -------------------------------------------------------------------------
    // Binded physical attributes
    // -------------------------------------------------------------------------

    /**
     *  Name of the bridge this VNW binds to
     */
    string  bridge;

    /**
     *  Name of the physical device the bridge should be attached to
     */
    string  phydev;
    
    /**
     *  VLAN ID of the NIC
     */
    string  vlan_id;

    /**
     *  Whether or not to isolate this network with the vnm driver
     */
    int     vlan;

    // -------------------------------------------------------------------------
    // Virtual Network Description
    // -------------------------------------------------------------------------
    /**
     * Holds the type of this network
     */
    NetworkType type;

    /**
     *  Pointer to leases class, can be fixed or ranged.
     *  Holds information on given (and, optionally, possible) leases
     */
    Leases *    leases;

    unsigned int ip_start;
    unsigned int ip_end;

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int insert_replace(SqlDB *db, bool replace, string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the Virtual Network
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        int rc;

        ostringstream oss_vnet(VirtualNetwork::db_bootstrap);
        ostringstream oss_lease(Leases::db_bootstrap);

        rc =  db->exec(oss_vnet);
        rc += db->exec(oss_lease);

        return rc;
    };

    /**
     * Function to print the VirtualNetwork object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @param extended If true, leases are included
     *  @return a reference to the generated string
     */
    string& to_xml_extended(string& xml, bool extended) const;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

    //**************************************************************************
    // Constructor
    //**************************************************************************

    VirtualNetwork(int                      uid,
                   int                      gid,
                   const string&            _uname,
                   const string&            _gname,
                   int                      _cluster_id,
                   const string&            _cluster_name,
                   VirtualNetworkTemplate * _vn_template = 0);

    ~VirtualNetwork();

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    static const char * table;

    static const char * db_names;

    static const char * db_bootstrap;

    /**
     *  Reads the Virtual Network (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqlDB * db);

    /**
     *  Reads the Virtual Network (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @param name of the network
     *    @param uid of the owner 
     * 
     *    @return 0 on success
     */
    int select(SqlDB * db, const string& name, int uid);

    /**
     *  Reads the Virtual Network leases from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select_leases(SqlDB * db);

    /**
     *  Writes the Virtual Network and its associated template and leases in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB * db, string& error_str);

    /**
     *  Writes/updates the Virtual Network data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB * db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     * Deletes a VNW from the database and all its associated information:
     *   - VNW template
     *   - given leases
     *   @param db pointer to the db
     *   @return 0 on success
     */
    int drop(SqlDB * db);
};

#endif /*VIRTUAL_NETWORK_H_*/
