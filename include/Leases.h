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

#ifndef LEASES_H_
#define LEASES_H_

#include "ObjectSQL.h"
#include "ObjectXML.h"
#include "Attribute.h"

#include <map>
#include <vector>
#include <sstream>

using namespace std;

/**
 *  The Leases class represents all the IP and MAC addresses (lease) that can
 *  be asigned (or are asigned) in a Virtual Network
 */
class Leases : public ObjectSQL
{
public:
    /**
     * Creates a new Lease set for a given Virtual Network (oid)
     * @param _db pinter to the DB object used to store the leases
     * @param _oid the virtual network unique identifier
     * @param _size the max number of leases
     */
    Leases(SqlDB * _db, int _oid, unsigned long _size, unsigned int _mac_prefix):
        ObjectSQL(),
        oid(_oid), size(_size), n_used(0), mac_prefix(_mac_prefix), db(_db){};

    virtual ~Leases()
    {
        map<unsigned int, Lease *>::iterator  it;

        for(it=leases.begin();it!=leases.end();it++)
        {
            delete it->second;
        }
    };

    friend ostream& operator<<(ostream& os, Leases& _leases);

    /**
     * Returns an unused lease, which becomes used
     *  @param vid identifier of the VM getting this lease
     *  @param ip ip of the returned lease
     *  @param mac mac of  the returned lease
     *  @return 0 if success
     */
     virtual int get(int vid, string& ip,string& mac) = 0;

     /**
      * Ask for a specific lease in the network
      *  @param vid identifier of the VM getting this lease
      *  @param ip ip of lease requested
      *  @param mac mac of the lease
      *  @return 0 if success
      */
     virtual int set(int vid, const string&  ip, string&  mac) = 0;

     /**
      * Release an used lease, which becomes unused
      *   @param ip of the lease in use
      */
     virtual void release(const string& ip) = 0;

    /**
     * Adds New leases. (Only implemented for FIXED networks)
     *  @param vector_leases vector of VectorAttribute objects. For the
     *         moment, the vector can only contain one LEASE.
     *  @param error_msg If the action fails, this message contains
     *         the reason.
     *  @return 0 on success
     */
    virtual int add_leases(vector<const Attribute*>& vector_leases,
                           string&                   error_msg) = 0;

    /**
     * Removes leases; if they are not used. (Only available for FIXED networks)
     *  @param vector_leases vector of VectorAttribute objects. For the
     *         moment, the vector can only contain one LEASE.
     *  @param error_msg If the action fails, this message contains
     *         the reason.
     *  @return 0 on success
     */
    virtual int remove_leases(vector<const Attribute*>& vector_leases,
                              string&                   error_msg) = 0;

    /**
     * Holds a Lease, marking it as used
     *  @param vector_leases vector of VectorAttribute objects. For the
     *         moment, the vector can only contain one LEASE.
     *  @param error_msg If the action fails, this message contains
     *         the reason.
     *  @return 0 on success
     */
    int hold_leases(vector<const Attribute*>& vector_leases, string& error_msg);

    /**
     * Releases a Lease on hold
     *  @param vector_leases vector of VectorAttribute objects. For the
     *         moment, the vector can only contain one LEASE.
     *  @param error_msg If the action fails, this message contains
     *         the reason.
     *  @return 0 on success
     */
    int free_leases(vector<const Attribute*>& vector_leases, string& error_msg);

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

protected:
    /**
     *  The Lease class, it represents a pair of IP and MAC assigned to
     *  a Virtual Machine
     */
    class Lease : public ObjectXML
    {
    public:
        /**
         * Creates a new lease, string form. This constructor throws a runtime
         * exception if the IP or MAC format is wrong.
         * @param _ip, the Lease IP in string format
         * @param _mac, the Lease MAC in string format
         * @param _vid, the ID of the VM owning the lease
         * @param _used, the lease is in use
         */
        //Lease(const string& _ip, const string& _mac,int _vid, bool _used=true);

        /**
        * Creates a new lease, numeric form.
        * @param _ip, the Lease IP in numeric format
        * @param _mac, the Lease MAC in numeric format
        * @param _vid, the ID of the VM owning the lease
        * @param _used, the lease is in use
        */
        Lease(unsigned int _ip, unsigned int _mac[], int _vid, bool _used=true)
            :ObjectXML(),ip(_ip), vid(_vid), used(_used)
        {
                // TODO check size
                mac[PREFIX]=_mac[PREFIX];
                mac[SUFFIX]=_mac[SUFFIX];
        };

        /**
         *  Creates a new empty lease. Method from_xml should be called right
         *  after this constructor.
         */
        Lease():ObjectXML(){};

        ~Lease(){};

        /**
        * Converts this lease's IP and MAC to string
        * @param ip ip of the lease in string
        * @param mac mac of the lease in string
        */
        void to_string(string& _ip, string& _mac) const;

        /**
         * Conversion from string IP to unsigned int IP
         * @return 0 if success
         */
        static int ip_to_number(const string& ip, unsigned int& i_ip);

        /**
         * Conversion from unsigned int IP to string IP
         */
        static void ip_to_string(const unsigned int i_ip, string& ip);

        /**
         * Conversion from string MAC to unsigned int[] MAC
         * @return 0 if success
         */
        static int mac_to_number(const string& mac, unsigned int i_mac[]);

        /**
         * Conversion from string IP to unsigned int IP
         */
        static void mac_to_string(const unsigned int i_mac[], string& mac);

        /**
         * Prints a Lease in a single line
         */
        friend ostream& operator<<(ostream& os, Lease& _lease);

        /**
         * Function to print the Lease object into a string in
         * XML format
         *  @param xml the resulting XML string
         *  @return a reference to the generated string
         */
        string& to_xml(string& xml) const;

        /**
         * Function to print the Lease object into a string in
         * XML format. The output contains all the internal attributes,
         * to be saved in the DB as a blob
         *  @param xml the resulting XML string
         *  @return a reference to the generated string
         */
        string& to_xml_db(string& xml) const;

        /**
         *  Rebuilds the object from an xml formatted string
         *    @param xml_str The xml-formatted string
         *
         *    @return 0 on success, -1 otherwise
         */
        int from_xml(const string &xml_str);

        /**
         * Constants to access the array storing the MAC address
         */
        enum MACIndex
        {
            SUFFIX  = 0,/**< Lower significant 4 bytes */
            PREFIX  = 1 /**< Higher significant 2 bytes */
        };

        unsigned int    ip;

        unsigned int    mac [2];

        int             vid;

        bool            used;
    };

    friend class VirtualNetwork;
    friend class VirtualNetworkPool;

    // -------------------------------------------------------------------------
    // Leases fields
    // -------------------------------------------------------------------------
    /**
     * Leases identifier. Connects it to a Virtual Network
     */
    int            oid;

    /**
     * Number of possible leases (free + assigned)
     */
    unsigned int  size;

    /**
     * Hash of leases, indexed by lease.ip
     */
    map<unsigned int, Lease *> leases;

    /**
     * Number of used leases
     */
    int n_used;

    /**
     *  The default MAC prefix for the Leases
     */
    unsigned int mac_prefix;

    // -------------------------------------------------------------------------
    // DataBase implementation variables
    // -------------------------------------------------------------------------
    /**
     * Pointer to the DataBase
     */
    SqlDB *  db;

    static const char * table;

    static const char * db_names;

    static const char * db_bootstrap;

    // -------------------------------------------------------------------------
    // Leases methods
    // -------------------------------------------------------------------------

    /**
     * Check if the passed ip corresponds with a given lease
     * @param ip of the lease to be checked
     * @return true if the ip was already assigned
     */
    bool check(const string& ip);

    /**
     * Check if the passed ip corresponds with a given lease
     * @param ip of the lease to be checked
     * @return true if the ip was already assigned
     */
    bool check(unsigned int ip);

    /**
     * Check if a VM is the owner of the ip 
     * @param ip of the lease to be checked
     * @param vid the ID of the VM
     * @return true if the ip was already assigned
     */
    bool is_owner(const string& ip, int vid);

    /**
     *  Reads the leases from the DB, and updates the lease hash table
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    virtual int select(SqlDB * db);

    friend ostream& operator<<(ostream& os, Lease& _lease);

    /**
     * Function to print the Leases object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

private:
    /**
     *  Callback function to unmarshall a Lease object (Lease::select)
     *    @param num the number of columns read from the DB
     *    @para names the column names
     *    @para vaues the column values
     *    @return 0 on success
     */
    int select_cb(void *nil, int num, char **values, char **names);

    /**
     *  This method should not be called, leases are added/removed/updated
     *  through add/del interface
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int insert(SqlDB * db, string& error_str);

    /**
     *  Leases are added/removed/updated through add/del interface
     *  This method is for pool management.
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int drop(SqlDB * db);

    /**
     *  This method should not be called, leases are added/removed/updated
     *  through add/del interface
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int update(SqlDB * db);
};

#endif /*LEASES_H_*/

