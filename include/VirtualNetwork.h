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

#ifndef VIRTUAL_NETWORK_H_
#define VIRTUAL_NETWORK_H_


#include "PoolSQL.h"
#include "VirtualNetworkTemplate.h"
#include "Leases.h"

#include <vector>
#include <string>
#include <map>

#include <time.h>
#include <sstream>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The Virtual Network class. It represents a Virtual Network at manages its leases.
 *  One lease is formed by one IP and one MAC address.
 *  MAC address are derived from IP addresses.
 */
class VirtualNetwork : public PoolObjectSQL
{
public:

    /**
     * Possible types of networks
     */

    enum NetworkType
    {
        UNINITIALIZED   = -1,
        RANGED          =  0,
        FIXED           =  1,
    };

    // *************************************************************************
    // Virtual Network Public Methods
    // *************************************************************************

    /**
     * Gets the uid of the owner of the Virtual Network
     * @return uid
     **/
    int get_uid()
    {
        return uid;
    }

    /**
     *  Returns true if the Virtual Network is public
     *     @return true if the Virtual Network is public
     */
    bool is_public()
    {
        return (public_vnet == 1);
    };

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
     *    Release previously given lease
     *    @param _ip IP identifying the lease
     *    @return 0 if success
     */
    void release_lease(const string& ip)
    {
        return leases->release(ip);
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
     *  Function to write a Virtual Network in an output stream
     */
    friend ostream& operator<<(ostream& os, VirtualNetwork& vn);

    /**
     * Function to print the VirtualNetwork object into a string in
     * plain text
     *  @param str the resulting string
     *  @return a reference to the generated string
     */
    string& to_str(string& str) const;

    /**
     * Function to print the VirtualNetwork object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

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
    // Identification variables
    // -------------------------------------------------------------------------
    /**
     *  Name of the Virtual Network
     */
    string  name;

    /**
     *  Owner of the Virtual Network
     */
    int     uid;

    // -------------------------------------------------------------------------
    // Binded physical attributes
    // -------------------------------------------------------------------------

    /**
     *  Name of the bridge this VNW binds to
     */
    string  bridge;

    // -------------------------------------------------------------------------
    // Virtual Network Description
    // -------------------------------------------------------------------------
    /**
     * Holds the type of this network
     */
    NetworkType type;

    /**
     *  Public scope of this Virtual Network
     */
    int         public_vnet;

    /**
     *  Pointer to leases class, can be fixed or ranged.
     *  Holds information on given (and, optionally, possible) leases
     */
    Leases *    leases;

    /**
     *  The Virtual Network template, holds the VNW attributes.
     */
    VirtualNetworkTemplate  vn_template;

    // *************************************************************************
    // Non persistent data members from Nebula.conf
    // *************************************************************************

    /**
     *  MAC prefix for this OpenNebula site
     */
    unsigned int    mac_prefix;

    /**
     *  Default size for virtual networks
     */
    int             default_size;

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @return 0 on success
     */
    int insert_replace(SqlDB *db, bool replace);

    /**
     *  Bootstraps the database table(s) associated to the Virtual Network
     */
    static void bootstrap(SqlDB * db)
    {
        ostringstream oss_vnet(VirtualNetwork::db_bootstrap);
        ostringstream oss_templ(VirtualNetworkTemplate::db_bootstrap);
        ostringstream oss_lease(Leases::db_bootstrap);

        db->exec(oss_vnet);
        db->exec(oss_templ);
        db->exec(oss_lease);
    };

    /**
     *  Callback function to unmarshall a VNW object (VirtualNetwork::select)
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int select_cb(void * nil, int num, char **values, char **names);

    /**
     *  Function to drop VN entry in vn_pool
     *    @return 0 on success
     */
    int vn_drop(SqlDB * db);

    // ------------------------------------------------------------------------
    // Template
    // ------------------------------------------------------------------------

    /**
     *  Gets the values of a template attribute
     *    @param name of the attribute
     *    @param values of the attribute
     *    @return the number of values
     */
    int get_template_attribute(
        string& name,
        vector<const Attribute*>& values) const
    {
        return vn_template.get(name,values);
    };

    /**
     *  Gets the values of a template attribute
     *    @param name of the attribute
     *    @param values of the attribute
     *    @return the number of values
     */
    int get_template_attribute(
        const char *name,
        vector<const Attribute*>& values) const
    {
        string str=name;
        return vn_template.get(str,values);
    };

    /**
     *  Gets a string based VN attribute
     *    @param name of the attribute
     *    @param value of the attribute (a string), will be "" if not defined
     */
    void get_template_attribute(
        const char *    name,
        string&         value) const
    {
        string str=name;
        vn_template.get(str,value);
    }

    /**
     *  Gets a string based VN attribute
     *    @param name of the attribute
     *    @param value of the attribute (an int), will be 0 if not defined
     */
    void get_template_attribute(
        const char *    name,
        int&            value) const
    {
        string str=name;
        vn_template.get(str,value);
    }

    /**
     *  Updates the template of a VNW, adding a new attribute (replacing it if
     *  already defined), the VN's mutex SHOULD be locked
     *    @param db pointer to the DB
     *    @param name of the new attribute
     *    @param value of the new attribute
     *    @return 0 on success
     */
    int update_template_attribute(
        SqlDB * db,
        string& name,
        string& value)
    {
        SingleAttribute * sattr;
        int               rc;

        sattr = new SingleAttribute(name,value);
        rc    = vn_template.replace_attribute(db,sattr);

        if (rc != 0)
        {
            delete sattr;
        }

        return rc;
    }

protected:

    //**************************************************************************
    // Constructor
    //**************************************************************************

    VirtualNetwork(unsigned int _mac_prefix, int _default_size);

    ~VirtualNetwork();

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

	enum ColNames
    {
        OID             = 0,
        UID             = 1,
        NAME            = 2,
        TYPE            = 3,
        BRIDGE          = 4,
        PUBLIC          = 5,
        LIMIT           = 6
    };

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
     *  Writes the Virtual Network and its associated template and leases in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB * db);

    /**
     *  Writes/updates the Virtual Network data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB * db);

    /**
     * Deletes a VNW from the database and all its associated information:
     *   - VNW template
     *   - given leases
     *   @param db pointer to the db
     *   @return 0 on success
     */
    int drop(SqlDB * db)
    {
        int rc;

        rc =  vn_template.drop(db);

        rc += leases->drop(db);

        rc += vn_drop(db);

        return rc;
    }

    /**
     *  Dumps the contect of a VirtualNetwork object in the given stream using
     *  XML format
     *    @param oss the output stream
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
     static int dump(ostringstream& oss, int num, char **values, char **names);
};

#endif /*VIRTUAL_NETWORK_H_*/
