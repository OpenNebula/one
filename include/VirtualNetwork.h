/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
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

extern "C" int vn_select_cb (void * _vn, int num,char ** values, char ** names);

extern "C" int vn_dump_cb (void *  _oss, int num, char ** values, char ** names);

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

    //------------------------------------------------------------------------
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
    
private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class VirtualNetworkPool;

    friend int vn_select_cb (
        void *  _vm,
        int     num,
        char ** values,
        char ** names);

    friend int vn_dump_cb (
        void *  _oss,
        int     num,
        char ** values,
        char ** names);

    // *************************************************************************
    // Virtual Network Private Attributes
    // *************************************************************************

    // -------------------------------------------------------------------------
    // Identification variables
    // -------------------------------------------------------------------------
    /**
     *  Name of the Virtual Network
     */
    string 	name;

    /**
     *  Owner of the Virtual Network
     */
    int		uid;

    // -------------------------------------------------------------------------
    // Binded physical attributes
    // -------------------------------------------------------------------------

    /**
     *  Name of the bridge this VNW binds to
     */
    string	bridge;

    // -------------------------------------------------------------------------
    // Virtual Network Description
    // -------------------------------------------------------------------------
    /**
     * Holds the type of this network
     */
    NetworkType	type;

    /**
     *  Pointer to leases class, can be fixed or ranged.
     *  Holds information on given (and, optionally, possible) leases
     */
    Leases *	leases;

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
    unsigned int 	mac_prefix;

    /**
     *  Default size for virtual networks
     */
    int				default_size;

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Bootstraps the database table(s) associated to the Virtual Network
     */
    static void bootstrap(SqliteDB * db)
    {
        db->exec(VirtualNetwork::db_bootstrap);

        db->exec(VirtualNetworkTemplate::db_bootstrap);

        db->exec(Leases::db_bootstrap);
    };

    /**
     *  Function to unmarshall a VNW object, and associated classes.
     *    @param num the number of columns read from the DB
     *    @para names the column names
     *    @para vaues the column values
     *    @return 0 on success
     */
    int unmarshall(int num, char **names, char ** values);

    /**
     *  Function to unmarshall a VNW object into an stream in XML format.
     *    @param oss the output stream
     *    @param num the number of columns read from the DB
     *    @para names the column names
     *    @para vaues the column values
     *    @return 0 on success
     */
    static int unmarshall(ostringstream& oss, 
                          int            num, 
                          char **        names, 
                          char **        values);
    /**
     *  Function to drop VN entry in vn_pool
     *    @return 0 on success
     */
    int vn_drop(SqliteDB * db);



    /**
     *  Updates the template of a VNW, adding a new attribute (replacing it if
     *  already defined), the VN's mutex SHOULD be locked
     *    @param vm pointer to the virtual network object
     *    @param name of the new attribute
     *    @param value of the new attribute
     *    @return 0 on success
     */
    int update_template_attribute(
    	SqliteDB * 			db,
        string&			 	name,
        string&			 	value)
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
        LIMIT           = 5
    };

    static const char * table;

    static const char * db_names;

    static const char * db_bootstrap;

    /**
     *  Reads the Virtual Network (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqliteDB * db);

    /**
     *  Writes the Virtual Network and its associated template and leases in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqliteDB * db);

    /**
     *  Writes/updates the Virtual Network data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqliteDB * db);

    /**
     * Deletes a VNW from the database and all its associated information:
     *   - VNW template
     *   - given leases
     *   @param db pointer to the db
     *   @return 0 on success
     */
    int drop(SqliteDB * db)
    {
    	int rc;

    	rc =  vn_template.drop(db);

        rc += leases->drop(db);

        rc += vn_drop(db);

    	return rc;
    }

    /**
     *  Dumps the contect of a set of Host objects in the given stream
     *  using XML format
     *    @param db pointer to the db
     *    @param oss the output stream
     *    @param where string to filter the VirtualMachine objects
     *    @return 0 on success
     */
    static int dump(SqliteDB * db, ostringstream& oss, const string& where);    
};

#endif /*VIRTUAL_NETWORK_H_*/
