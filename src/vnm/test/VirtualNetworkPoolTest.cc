/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

#include <string>
#include <iostream>
#include <stdlib.h>

#include "VirtualNetworkPool.h"
#include "VirtualNetworkTemplate.h"
#include "PoolTest.h"
#include "ObjectXML.h"

using namespace std;

/* ************************************************************************* */
/* ************************************************************************* */

const int uids[] = {123, 261, 133, 78};

const string names[] = {"Net number one", "A virtual network","Net number two"};

const string templates[] =
{
            "NAME   = \"Net number one\"\n"
            "TYPE   = FIXED\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]",

            "NAME            = \"A virtual network\"\n"
            "TYPE            = RANGED\n"
            "BRIDGE          = br0\n"
            "NETWORK_SIZE    = C\n"
            "NETWORK_ADDRESS = 192.168.0.0\n"
            "PUBLIC          = YES",

            "NAME   = \"Net number two\"\n"
            "TYPE   = fixed\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.2.1, MAC=50:20:20:20:20:20]",

            "NAME   = \"Net number three\"\n"
            "TYPE   = not_a_type\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]",

            "NAME    = = \n"
            "TYPE   = not_a_type\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]",

            "NAME   = \"Only a name in this network\"\n",

           "NAME   = \"Only a name in this network\"\n"
           "TYPE   = RANGED\n"
           "BRIDGE          = br0\n"
           "NETWORK_SIZE    = C\n"
};

const string xmls[] =
{
    "<VNET><ID>0</ID><UID>123</UID><GID>0</GID><NAME>Net number one</NAME><TYPE>1</TYPE><BRIDGE>br1</BRIDGE><PUBLIC>0</PUBLIC><TOTAL_LEASES>0</TOTAL_LEASES><TEMPLATE><BRIDGE><![CDATA[br1]]></BRIDGE><LEASES><IP><![CDATA[130.10.0.1]]></IP><MAC><![CDATA[50:20:20:20:20:20]]></MAC></LEASES><NAME><![CDATA[Net number one]]></NAME><TYPE><![CDATA[FIXED]]></TYPE></TEMPLATE><LEASES><LEASE><IP>130.10.0.1</IP><MAC>50:20:20:20:20:20</MAC><USED>0</USED><VID>-1</VID></LEASE></LEASES></VNET>",

    "<VNET><ID>1</ID><UID>261</UID><GID>0</GID><NAME>A virtual network</NAME><TYPE>0</TYPE><BRIDGE>br0</BRIDGE><PUBLIC>1</PUBLIC><TOTAL_LEASES>0</TOTAL_LEASES><TEMPLATE><BRIDGE><![CDATA[br0]]></BRIDGE><NAME><![CDATA[A virtual network]]></NAME><NETWORK_ADDRESS><![CDATA[192.168.0.0]]></NETWORK_ADDRESS><NETWORK_SIZE><![CDATA[C]]></NETWORK_SIZE><TYPE><![CDATA[RANGED]]></TYPE></TEMPLATE><LEASES></LEASES></VNET>",

    "<VNET><ID>0</ID><UID>133</UID><GID>0</GID><NAME>Net number two</NAME><TYPE>1</TYPE><BRIDGE>br1</BRIDGE><PUBLIC>0</PUBLIC><TOTAL_LEASES>0</TOTAL_LEASES><TEMPLATE><BRIDGE><![CDATA[br1]]></BRIDGE><LEASES><IP><![CDATA[130.10.2.1]]></IP><MAC><![CDATA[50:20:20:20:20:20]]></MAC></LEASES><NAME><![CDATA[Net number two]]></NAME><TYPE><![CDATA[fixed]]></TYPE></TEMPLATE><LEASES><LEASE><IP>130.10.2.1</IP><MAC>50:20:20:20:20:20</MAC><USED>0</USED><VID>-1</VID></LEASE></LEASES></VNET>"
};

const string xml_dump =
    "<VNET_POOL><VNET><ID>0</ID><UID>1</UID><GID>0</GID><NAME>Net number one</NAME><TYPE>1</TYPE><BRIDGE>br1</BRIDGE><PUBLIC>0</PUBLIC><TOTAL_LEASES>0</TOTAL_LEASES><TEMPLATE><BRIDGE><![CDATA[br1]]></BRIDGE><LEASES><IP><![CDATA[130.10.0.1]]></IP><MAC><![CDATA[50:20:20:20:20:20]]></MAC></LEASES><NAME><![CDATA[Net number one]]></NAME><TYPE><![CDATA[FIXED]]></TYPE></TEMPLATE></VNET><VNET><ID>1</ID><UID>2</UID><GID>0</GID><NAME>A virtual network</NAME><TYPE>0</TYPE><BRIDGE>br0</BRIDGE><PUBLIC>1</PUBLIC><TOTAL_LEASES>0</TOTAL_LEASES><TEMPLATE><BRIDGE><![CDATA[br0]]></BRIDGE><NAME><![CDATA[A virtual network]]></NAME><NETWORK_ADDRESS><![CDATA[192.168.0.0]]></NETWORK_ADDRESS><NETWORK_SIZE><![CDATA[C]]></NETWORK_SIZE><TYPE><![CDATA[RANGED]]></TYPE></TEMPLATE></VNET></VNET_POOL>";

const string xml_dump_where =
    "<VNET_POOL><VNET><ID>1</ID><UID>2</UID><GID>0</GID><NAME>A virtual network</NAME><TYPE>0</TYPE><BRIDGE>br0</BRIDGE><PUBLIC>1</PUBLIC><TOTAL_LEASES>0</TOTAL_LEASES><TEMPLATE><BRIDGE><![CDATA[br0]]></BRIDGE><NAME><![CDATA[A virtual network]]></NAME><NETWORK_ADDRESS><![CDATA[192.168.0.0]]></NETWORK_ADDRESS><NETWORK_SIZE><![CDATA[C]]></NETWORK_SIZE><TYPE><![CDATA[RANGED]]></TYPE></TEMPLATE></VNET></VNET_POOL>";

/* ************************************************************************* */
/* ************************************************************************* */

class VirtualNetworkPoolFriend : public VirtualNetworkPool
{
public:

    VirtualNetworkPoolFriend(   SqlDB *          db,
                                const string&    str_mac_prefix,
                                int              default_size):

                VirtualNetworkPool( db, str_mac_prefix, default_size)
                {};


    int allocate(const int& uid, const std::string& stemplate, int* oid)
    {
        VirtualNetworkTemplate * vn_template;
        char *          error_msg = 0;
        int             rc;
        string          err;

        vn_template = new VirtualNetworkTemplate;
        rc = vn_template->parse(stemplate,&error_msg);

        if( rc == 0 )
        {
            return VirtualNetworkPool::allocate(uid, 0, vn_template, oid, err);
        }
        else
        {
            if (error_msg != 0 )
            {
                free(error_msg);
            }

            delete vn_template;
            return -1;
        }
    };
};

/* ************************************************************************* */
/* ************************************************************************* */

class VirtualNetworkPoolTest : public PoolTest
{
    CPPUNIT_TEST_SUITE (VirtualNetworkPoolTest);

    ALL_POOLTEST_CPPUNIT_TESTS();
    CPPUNIT_TEST (allocate_rcs);
    CPPUNIT_TEST (get_using_name);
    CPPUNIT_TEST (wrong_get_name);
    CPPUNIT_TEST (update);
    CPPUNIT_TEST (size);
    CPPUNIT_TEST (duplicates);
    CPPUNIT_TEST (dump);
    CPPUNIT_TEST (dump_where);
    CPPUNIT_TEST (fixed_leases);
    CPPUNIT_TEST (ranged_leases);
    CPPUNIT_TEST (wrong_leases);
    CPPUNIT_TEST (overlapping_leases_ff);
    CPPUNIT_TEST (overlapping_leases_fr);
    CPPUNIT_TEST (overlapping_leases_rf);
    CPPUNIT_TEST (overlapping_leases_rr);
    CPPUNIT_TEST (drop_leases);
    CPPUNIT_TEST (public_attribute);
    CPPUNIT_TEST (vnpool_nic_attribute);

    CPPUNIT_TEST (add_lease_fixed);
    CPPUNIT_TEST (add_lease_ranged);
    CPPUNIT_TEST (add_lease_wrong_ip);
    CPPUNIT_TEST (add_lease_wrong_mac);
    CPPUNIT_TEST (add_lease_duplicate_ip);

    CPPUNIT_TEST (del_lease_fixed);
    CPPUNIT_TEST (del_lease_ranged);
    CPPUNIT_TEST (del_lease_wrong_ip);
    CPPUNIT_TEST (del_lease_nonexistent_ip);
    CPPUNIT_TEST (del_lease_used_ip);

    CPPUNIT_TEST_SUITE_END ();

protected:

    void bootstrap(SqlDB* db)
    {
        VirtualNetworkPool::bootstrap(db);
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        // VNet pool constructor needs DB, default mac prefix,
        // and default network size
        return new VirtualNetworkPool(db, "00:01", 126);
    };

    int allocate(int index)
    {
        int oid;
        return ((VirtualNetworkPoolFriend*)pool)->allocate(
                        uids[index],templates[index], &oid);
    };

    void check(int index, PoolObjectSQL* obj)
    {
        CPPUNIT_ASSERT( obj != 0 );

        string xml_str;
        ostringstream       oss;

        ((VirtualNetwork*)obj)->to_xml(xml_str);
        oss << * ((VirtualNetwork*)obj);

        xml_str = oss.str();
/*
        if( xml_str != xmls[index] )
        {
            cout << endl << xml_str << endl << "========"
                 << endl << xmls[index] << endl << "--------";
        }
//*/

        CPPUNIT_ASSERT( ((VirtualNetwork*)obj)->get_uid()       == uids[index] );
        CPPUNIT_ASSERT( xml_str == xmls[index] );
    };


public:
    VirtualNetworkPoolTest(){xmlInitParser();};

    ~VirtualNetworkPoolTest(){xmlCleanupParser();};

    /* ********************************************************************* */
    /* ********************************************************************* */

    void allocate_rcs()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend *>(pool);
        VirtualNetwork * vn;
        int              rc;

        // Check case
        rc = allocate(2);
        CPPUNIT_ASSERT( rc >= 0 );
        vn = vnpool->get(rc, false);
        check(2,vn);

        // Check template attribute
        rc = allocate(3);
        CPPUNIT_ASSERT( rc == -1 );

        // Parser error for Vnet template
        rc = allocate(4);
        CPPUNIT_ASSERT( rc == -1 );

        rc = allocate(5);
        CPPUNIT_ASSERT( rc == -1 );

        rc = allocate(6);
        CPPUNIT_ASSERT( rc == -1 );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void get_using_name()
    {
        VirtualNetworkPool * vnpool = static_cast<VirtualNetworkPool *>(pool);
        VirtualNetwork * vn;
        int oid;

        // Allocate two objects
        oid = allocate(0);
        CPPUNIT_ASSERT( oid >= 0 );

        oid = allocate(1);
        CPPUNIT_ASSERT( oid >= 0 );

        // Get using its name
        vn = vnpool->get(names[1],uids[1], true);
        CPPUNIT_ASSERT(vn != 0);
        vn->unlock();

        check(1, vn);
        vn->unlock();

        vnpool->clean();

        // Get using its name
        vn = vnpool->get(names[1], uids[1], false);
        check(1, vn);
    };

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void wrong_get_name()
    {
        VirtualNetworkPool * vnpool = static_cast<VirtualNetworkPool *>(pool);
        VirtualNetwork * vn;

        // Empty Pool
        vn = vnpool->get("Wrong name", 0, true);
        CPPUNIT_ASSERT( vn == 0 );

        // Allocate an object
        allocate(0);

        // Ask again for a non-existing name
        vn = vnpool->get("Non existing name", uids[0], true);
        CPPUNIT_ASSERT( vn == 0 );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void update()
    {
        // TODO
    };

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void size()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend*>(pool);

        int             rc;
        VirtualNetwork* vnet;

        string templ[] = {
            // Fixed, 1 lease
            "NAME   = \"Net number one\"\n"
            "TYPE   = FIXED\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]",

            // Fixed, 3 leases
            "NAME   = \"Net A\"\n"
            "TYPE   = FIXED\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]"
            "LEASES = [IP=130.10.0.2, MAC=50:20:20:20:20:21]"
            "LEASES = [IP=130.10.0.3, MAC=50:20:20:20:20:22]",

            // Ranged, size "C"
            "NAME            = \"A virtual network\"\n"
            "TYPE            = RANGED\n"
            "BRIDGE          = br0\n"
            "NETWORK_SIZE    = C\n"
            "NETWORK_ADDRESS = 192.168.10.0\n",

            // Ranged, size "c"
            "NAME            = \"Another virtual network\"\n"
            "TYPE            = RANGED\n"
            "BRIDGE          = br0\n"
            "NETWORK_SIZE    = c\n"
            "NETWORK_ADDRESS = 192.168.10.0\n",

            // Size is "B"
            "NAME            = \"Net C\"\n"
            "TYPE            = RANGED\n"
            "BRIDGE          = br0\n"
            "NETWORK_SIZE    = B\n"
            "NETWORK_ADDRESS = 192.168.1.0\n",

            // Size "X", defaults to 128
            "NAME            = \"Net D\"\n"
            "TYPE            = RANGED\n"
            "BRIDGE          = br0\n"
            "NETWORK_SIZE    = X\n"
            "NETWORK_ADDRESS = 192.168.1.0\n",

            // Size 32
            "NAME            = \"Net E\"\n"
            "TYPE            = RANGED\n"
            "BRIDGE          = br0\n"
            "NETWORK_SIZE    = 30\n"
            "NETWORK_ADDRESS = 192.168.1.0\n"
        };

        unsigned int    sizes[7]={1,3,256,256,65536,128,32};
        int oid[7];

        for (int i = 0 ; i < 7 ; i++)
        {
            rc   = vnpool->allocate(uids[0], templ[i], &oid[i]);
            CPPUNIT_ASSERT( rc >= 0 );

            vnet = vnpool->get(oid[i], false);
            CPPUNIT_ASSERT( vnet != 0 );
            CPPUNIT_ASSERT( vnet->get_size() == sizes[i] );
        }

        vnpool->clean();

        for (int i = 0 ; i < 7 ; i++)
        {
            vnet = vnpool->get(oid[i], false);
            CPPUNIT_ASSERT( vnet != 0 );
            CPPUNIT_ASSERT( vnet->get_size() == sizes[i] );
        }
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void duplicates()
    {
        int rc, oid_0, oid_1, oid_2, oid_3;
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend *>(pool);
        VirtualNetwork     * vnet;

        // Allocate a vnet
        rc = vnpool->allocate(uids[0], templates[0], &oid_0);
        CPPUNIT_ASSERT( rc == oid_0 );
        CPPUNIT_ASSERT( rc == 0 );

        // Allocate the same vnet twice, with the same user ID. Should fail
        rc = vnpool->allocate(uids[0], templates[0], &oid_1);
        CPPUNIT_ASSERT( rc ==  oid_1 );
        CPPUNIT_ASSERT( rc == -1 );

        // Same VNet, with different user ID. Should succeed
        rc = vnpool->allocate(uids[1], templates[0], &oid_2);
        CPPUNIT_ASSERT( rc ==  oid_2 );
        CPPUNIT_ASSERT( rc == 1 );

        // Insert a different template, with the same user ID
        rc = vnpool->allocate(uids[1], templates[1], &oid_3);
        CPPUNIT_ASSERT( rc == oid_3 );
        CPPUNIT_ASSERT( rc == 2 );


        // Make sure the table contains two vnets with name[0]
        vector<int>     results;
        int             ret;
        const char *    table   = "network_pool";

        string where = "name = '" + names[0] + "'";

        ret = pool->search(results, table, where);
        CPPUNIT_ASSERT(ret             == 0);
        CPPUNIT_ASSERT(results.size()  == 2);
        CPPUNIT_ASSERT(results.at(0)   == oid_0);
        CPPUNIT_ASSERT(results.at(1)   == oid_2);

        // Get the vnet and check it, to make sure the user id was not rewritten
        vnet = vnpool->get(oid_0, false);
        check(0, vnet);
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void dump()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend*>(pool);
        int oid, rc;
        ostringstream oss;

        vnpool->allocate(1, templates[0], &oid);
        vnpool->allocate(2, templates[1], &oid);

        rc = pool->dump(oss, "");

        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();

//*
        if( result != xml_dump )
        {
            cout << endl << result << endl << "========"
                 << endl << xml_dump << endl << "--------";
        }
//*/

        CPPUNIT_ASSERT( result == xml_dump );
    };

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void dump_where()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend*>(pool);
        int oid, rc;
        ostringstream oss;

        vnpool->allocate(1, templates[0], &oid);
        vnpool->allocate(2, templates[1], &oid);

        string where = "name LIKE '%virtual%'";
        rc = pool->dump(oss, where);

        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();

//*
        if( result != xml_dump_where )
        {
            cout << endl << result << endl << "========"
                 << endl << xml_dump_where << endl << "--------";
        }
//*/

        CPPUNIT_ASSERT( result == xml_dump_where );
    };

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void fixed_leases()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend*>(pool);
        int rc, oid;
        VirtualNetwork *vn;

        string ip     = "";
        string mac    = "";
        string bridge = "";


        // First VNet template is a fixed network with only one IP
        oid = allocate(0);
        CPPUNIT_ASSERT( oid != -1 );

        vn = vnpool->get(oid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Ask for an IP
        vn->lock();
        rc = vn->get_lease(33, ip, mac, bridge);
        vn->unlock();

        // Check the only available IP was granted
        CPPUNIT_ASSERT( rc == 0 );
        CPPUNIT_ASSERT( ip      == "130.10.0.1" );
        CPPUNIT_ASSERT( mac     == "50:20:20:20:20:20" );
        CPPUNIT_ASSERT( bridge  == "br1" );


        // Clean the cache
        pool->clean();

        // Read the Vnet from the DB
        vn = vnpool->get(oid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Ask for another IP
        vn->lock();
        rc = vn->get_lease(77, ip, mac, bridge);
        vn->unlock();

        // Check that the only IP available is in use
        CPPUNIT_ASSERT( rc != 0 );


        // Instead of asking for a free IP, lets request the specific IP that
        // we know is in use
        vn->lock();
        rc = vn->set_lease(77, ip, mac, bridge);
        vn->unlock();
        CPPUNIT_ASSERT( rc != 0 );


        // Release the lease
        vn->lock();
        vn->release_lease(ip);
        vn->unlock();

        // Clean the mac and bridge strings, to make sure they are correctly
        // assigned
        mac    = "";
        bridge = "";

        // Now that the lease is free, ask for it again
        vn->lock();
        rc = vn->set_lease(77, ip, mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc == 0 );
        CPPUNIT_ASSERT( ip      == "130.10.0.1" );
        CPPUNIT_ASSERT( mac     == "50:20:20:20:20:20" );
        CPPUNIT_ASSERT( bridge  == "br1" );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void ranged_leases()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend*>(pool);
        int rc, oid;
        VirtualNetwork *vn;

        string ip     = "";
        string mac    = "";
        string bridge = "";

        string tmpl =
            "NAME            = \"A ranged network\"\n"
            "TYPE            = RANGED\n"
            "BRIDGE          = bridge0\n"
            "NETWORK_SIZE    = 3\n"
            "NETWORK_ADDRESS = 192.168.50.0\n";


        vnpool->allocate(45, tmpl, &oid);
        CPPUNIT_ASSERT( oid != -1 );

        vn = vnpool->get(oid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Ask for an IP
        vn->lock();
        rc = vn->get_lease(33, ip, mac, bridge);
        vn->unlock();

        // Check that it is valid IP
        CPPUNIT_ASSERT( rc == 0 );
        CPPUNIT_ASSERT( ip      == "192.168.50.1" );
        CPPUNIT_ASSERT( mac     == "00:01:c0:a8:32:01" );
        CPPUNIT_ASSERT( bridge  == "bridge0" );

        // Clean the cache
        pool->clean();

        // Read the Vnet from the DB
        vn = vnpool->get(oid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Ask for the IP already in use
        vn->lock();
        rc = vn->set_lease(77, ip, mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc != 0 );


        // Ask for two more IPs
        vn->lock();
        rc = vn->get_lease(123, ip, mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc == 0 );

        vn->lock();
        rc = vn->get_lease(456, ip, mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc == 0 );


        // All IPs are now used
        vn->lock();
        rc = vn->get_lease(789, ip, mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc != 0 );

        // Release one of the 3 IPs
        vn->lock();
        vn->release_lease("192.168.50.2");
        vn->unlock();


        // Clean the mac and bridge strings, to make sure they are correctly
        // assigned
        mac    = "";
        bridge = "";

        // Now that the lease is free, ask for it again
        vn->lock();
        rc = vn->get_lease(77, ip, mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc == 0 );
        CPPUNIT_ASSERT( ip      == "192.168.50.2" );
        CPPUNIT_ASSERT( mac     == "00:01:c0:a8:32:02" );
        CPPUNIT_ASSERT( bridge  == "bridge0" );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void wrong_leases()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend*>(pool);
        int rc, oid_0, oid_1;
        VirtualNetwork *vn;

        string ip     = "";
        string mac    = "";
        string bridge = "";


        // First VNet template is a fixed network with only one IP
        oid_0 = allocate(0);
        CPPUNIT_ASSERT( oid_0 != -1 );

        vn = vnpool->get(oid_0, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Ask for a non-defined IP
        vn->lock();
        ip = "130.10.0.17";
        rc = vn->set_lease(33, ip, mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc == -1 );

        // Allocate a ranged VNet
        oid_1 = allocate(1);
        CPPUNIT_ASSERT( oid_1 != -1 );

        vn = vnpool->get(oid_1, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Ask for an out of range IP
        vn->lock();
        ip = "130.10.0.17";
        rc = vn->set_lease(33, ip, mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc == -1 );

        // Ask the second Vnet for a lease defined by the first one
        vn->lock();
        rc = vn->set_lease(1234, "130.10.0.1", mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc == -1 );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void overlapping_leases_ff()
    {
        // It is a different Vnet from #0: different user, name, and bridge.
        // But both of them use the IP 130.10.0.1
        string tmpl_B =
            "NAME   = \"New Network\"\n"
            "TYPE   = FIXED\n"
            "BRIDGE = br9\n"
            "LEASES = [IP=130.10.0.5, MAC=50:20:20:20:20:21]\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:22]\n";

        overlapping_leases(templates[0], tmpl_B);
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void overlapping_leases_fr()
    {
        // Now use a ranged network, also containig the IP 130.10.0.1
        string tmpl_B =
            "NAME   = \"New Network\"\n"
            "TYPE   = RANGED\n"
            "BRIDGE = br9\n"
            "NETWORK_SIZE    = 3\n"
            "NETWORK_ADDRESS = 130.10.0.0\n";

        overlapping_leases(templates[0], tmpl_B);
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void overlapping_leases_rf()
    {
        // It is a different Vnet from #0: different user, name, and bridge.
        // But both of them use the IP 130.10.0.1
        string tmpl_A =
            "NAME   = \"New Network\"\n"
            "TYPE   = RANGED\n"
            "BRIDGE = br9\n"
            "NETWORK_SIZE    = 3\n"
            "NETWORK_ADDRESS = 130.10.0.0\n";

        overlapping_leases(tmpl_A, templates[0]);
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void overlapping_leases_rr()
    {
        // It is a different Vnet from #0: different user, name, and bridge.
        // But both of them use the IP 130.10.0.1
        string tmpl_A =
            "NAME   = \"Network A\"\n"
            "TYPE   = RANGED\n"
            "BRIDGE = br9\n"
            "NETWORK_SIZE    = 3\n"
            "NETWORK_ADDRESS = 130.10.0.0\n";

        string tmpl_B =
            "NAME   = \"Network B\"\n"
            "TYPE   = RANGED\n"
            "BRIDGE = br7\n"
            "NETWORK_SIZE    = 9\n"
            "NETWORK_ADDRESS = 130.10.0.0\n";

        overlapping_leases(tmpl_A, tmpl_B);
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    // Runs a test using the given templates
    void overlapping_leases(string tmpl_A, string tmpl_B)
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend*>(pool);
        int rc, oid_0, oid_new;
        VirtualNetwork *vn;

        string ip     = "";
        string mac    = "";
        string bridge = "";

        ostringstream   oss;
        string          xpath;

        vector<int>     results;


        // First VNet template
        vnpool->allocate(13, tmpl_A, &oid_0);
        CPPUNIT_ASSERT( oid_0 != -1 );

        // Second VNet
        vnpool->allocate(45, tmpl_B, &oid_new);
        CPPUNIT_ASSERT( oid_new != -1 );

        // Get this second VNet
        vn = vnpool->get(oid_new, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Set a lease. Ask for the IP that both Vnets have
        vn->lock();
        rc = vn->set_lease(1234, "130.10.0.1", mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc == 0 );

        // ---------------------------------------------------------------------
        // The IP ...1 should be tagged as used only in the second Vnet

        // Clean the cache, forcing the pool to read the objects from the DB
        pool->clean();

        // First VNet
        vn = vnpool->get(oid_0, false);
        CPPUNIT_ASSERT( vn != 0 );
        oss << *vn;

        // 0 Used leases
        ObjectXML::xpath_value(xpath, oss.str().c_str(), "/VNET/TOTAL_LEASES" );
        CPPUNIT_ASSERT( xpath == "0" );

        // Second VNet
        vn = vnpool->get(oid_new, false);
        CPPUNIT_ASSERT( vn != 0 );
        oss.str("");
        oss << *vn;

        // 1 Used leases
        ObjectXML::xpath_value(xpath, oss.str().c_str(), "/VNET/TOTAL_LEASES" );
        CPPUNIT_ASSERT( xpath == "1" );
        // ---------------------------------------------------------------------


        // Now check that the first VNet has that IP available
        vn = vnpool->get(oid_0, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Ask the first VNet for the IP that both Vnets have
        vn->lock();
        rc = vn->set_lease(5678, "130.10.0.1", mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc == 0 );

        // Release the lease on first Vnet
        vn->lock();
        vn->release_lease("130.10.0.1");
        vn->unlock();


        // Get again the second VNet
        vn = vnpool->get(oid_new, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Ask for the IP, should be still used
        vn->lock();
        rc = vn->set_lease(1234, "130.10.0.1", mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc != 0 );

        // ---------------------------------------------------------------------
        // Check that in the DB, only one lease is used

        // Clean the cache, forcing the pool to read the objects from the DB
        pool->clean();

        // First VNet
        vn = vnpool->get(oid_0, false);
        CPPUNIT_ASSERT( vn != 0 );
        oss.str("");
        oss << *vn;

        // 0 Used leases
        ObjectXML::xpath_value(xpath, oss.str().c_str(), "/VNET/TOTAL_LEASES" );
        CPPUNIT_ASSERT( xpath == "0" );

        // Second VNet
        vn = vnpool->get(oid_new, false);
        CPPUNIT_ASSERT( vn != 0 );
        oss.str("");
        oss << *vn;

        // 1 Used leases
        ObjectXML::xpath_value(xpath, oss.str().c_str(), "/VNET/TOTAL_LEASES" );
        CPPUNIT_ASSERT( xpath == "1" );
        // ---------------------------------------------------------------------
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void drop_leases()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend*>(pool);
        int rc, oid;
        VirtualNetwork *vn;

        string ip     = "";
        string mac    = "";
        string bridge = "";

        vector<int>     results;

        // Allocate a VNet
        oid = allocate(0);
        CPPUNIT_ASSERT( oid != -1 );

        vn = vnpool->get(oid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Drop the VNet
        pool->drop(vn);

        // Check that the leases were also dropped
        const char *    table   = "leases";
        string          where   = "oid > -1";

        rc = pool->search(results, table, where);
        CPPUNIT_ASSERT(rc              == 0);
        CPPUNIT_ASSERT(results.size()  == 0);
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void public_attribute()
    {
        int oid;
        VirtualNetworkPoolFriend * vnp =
                                static_cast<VirtualNetworkPoolFriend*>(pool);
        VirtualNetwork *     vn;

        string templates[] =
        {
            // false
            "NAME   = \"name A\"\n"
            "TYPE   = FIXED\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]\n",

            // true
            "NAME   = \"name B\"\n"
            "TYPE   = FIXED\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]\n"
            "PUBLIC = YES",

            // false
            "NAME   = \"name C\"\n"
            "TYPE   = FIXED\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]\n"
            "PUBLIC = NO",

            // false
            "NAME   = \"name D\"\n"
            "TYPE   = FIXED\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]\n"
            "PUBLIC = 1",

            // true
            "NAME   = \"name E\"\n"
            "TYPE   = FIXED\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]\n"
            "PUBLIC = Yes",

            // false
            "NAME   = \"name F\"\n"
            "TYPE   = FIXED\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]\n"
            "PUBLIC = TRUE",

            // true
            "NAME   = \"name G\"\n"
            "TYPE   = FIXED\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]\n"
            "PUBLIC = yes",

            // false
            "NAME   = \"name H\"\n"
            "TYPE   = FIXED\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]\n"
            "PUBLIC = 'YES'",

            // true
            "NAME   = \"name I\"\n"
            "TYPE   = FIXED\n"
            "BRIDGE = br1\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]\n"
            "PUBLIC = \"YES\"",

            "END"
        };

        bool results[] = {  false, true, false, false,
                            true, false, true, false, true };

        int i = 0;
        while( templates[i] != "END" )
        {

            vnp->allocate(0, templates[i], &oid);

            CPPUNIT_ASSERT( oid >= 0 );

            vn = vnp->get( oid, false );
            CPPUNIT_ASSERT( vn != 0 );

//cout << endl << i << ":expected " << results[i] << " got " << vn->is_public();
            CPPUNIT_ASSERT( vn->isPublic() == results[i] );
            i++;
        }
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void vnpool_nic_attribute()
    {
        VirtualNetworkPoolFriend * vnp =
                                static_cast<VirtualNetworkPoolFriend *>(pool);

        VectorAttribute *   disk;
        int                 oid_0, oid_1;
        string              value;

        // ---------------------------------------------------------------------
        // Allocate 2 vnets

        string template_0 = "NAME   = \"Net 0\"\n"
                            "TYPE   = FIXED\n"
                            "BRIDGE = br1\n"
                            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]";

        string template_1 = "NAME   = \"Net 1\"\n"
                            "TYPE   = FIXED\n"
                            "BRIDGE = br2\n"
                            "LEASES = [IP=130.10.0.5, MAC=50:20:20:20:20:25]";

        vnp->allocate(0, template_0, &oid_0);
        CPPUNIT_ASSERT( oid_0 == 0 );

        vnp->allocate(0, template_1, &oid_1);
        CPPUNIT_ASSERT( oid_1 == 1 );

        // Disk using network 0
        disk = new VectorAttribute("DISK");
        disk->replace("NETWORK", "Net 0");

        ((VirtualNetworkPool*)vnp)->nic_attribute(disk, 0, 0);

        value = "";
        value = disk->vector_value("NETWORK");
        CPPUNIT_ASSERT( value == "Net 0" );

        value = "";
        value = disk->vector_value("MAC");
        CPPUNIT_ASSERT( value == "50:20:20:20:20:20" );

        value = "";
        value = disk->vector_value("BRIDGE");
        CPPUNIT_ASSERT( value == "br1" );

        value = "";
        value = disk->vector_value("NETWORK_ID");
        CPPUNIT_ASSERT( value == "0" );

        value = "";
        value = disk->vector_value("IP");
        CPPUNIT_ASSERT( value == "130.10.0.1" );

        delete disk;


        // Disk using network 1 index
        disk = new VectorAttribute("DISK");
        disk->replace("NETWORK_ID", "1");

        ((VirtualNetworkPool*)vnp)->nic_attribute(disk,0, 0);

        value = "";
        value = disk->vector_value("NETWORK");
        CPPUNIT_ASSERT( value == "Net 1" );

        value = "";
        value = disk->vector_value("MAC");
        CPPUNIT_ASSERT( value == "50:20:20:20:20:25" );

        value = "";
        value = disk->vector_value("BRIDGE");
        CPPUNIT_ASSERT( value == "br2" );

        value = "";
        value = disk->vector_value("NETWORK_ID");
        CPPUNIT_ASSERT( value == "1" );

        value = "";
        value = disk->vector_value("IP");
        CPPUNIT_ASSERT( value == "130.10.0.5" );

        delete disk;
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void add_lease_fixed()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend *>(pool);
        VirtualNetwork * vn;
        int              nid, rc;
        char *           error_msg = 0;
        string           error_str;

        string           ip     = "";
        string           mac    = "";
        string           bridge = "";

        VirtualNetworkTemplate leases_template;


        // Create a leases template as the RM would do
        string str_template = "LEASES = [ IP = 130.10.0.2 ]";

        rc = leases_template.parse(str_template,&error_msg);
        CPPUNIT_ASSERT( rc == 0 );

        // Allocate a fixed net with only 1 ip
        nid = allocate(0);
        CPPUNIT_ASSERT( nid >= 0 );
        vn = vnpool->get(nid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Add one more lease
        vn->lock();
        rc = vn->add_leases(&leases_template, error_str);
        vn->unlock();
        CPPUNIT_ASSERT( rc == 0 );

        // Request the first IP
        vn->lock();
        ip = "130.10.0.1";
        rc = vn->set_lease(77, ip, mac, bridge);
        vn->unlock();
        CPPUNIT_ASSERT( rc == 0 );

        // Ask for another IP, the added one should be granted
        vn->lock();
        ip = "";
        rc = vn->get_lease(77, ip, mac, bridge);
        vn->unlock();
        CPPUNIT_ASSERT( rc == 0 );
        CPPUNIT_ASSERT( ip == "130.10.0.2" );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void add_lease_ranged()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend *>(pool);
        VirtualNetwork * vn;
        int              nid, rc;
        char *           error_msg = 0;
        string           error_str;


        VirtualNetworkTemplate leases_template;

        // Create a leases template as the RM would do
        string str_template = "LEASES = [ IP = 130.10.0.2 ]";

        rc = leases_template.parse(str_template,&error_msg);
        CPPUNIT_ASSERT( rc == 0 );

        // Allocate a ranged net
        nid = allocate(1);
        CPPUNIT_ASSERT( nid >= 0 );
        vn = vnpool->get(nid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Add one more lease
        vn->lock();
        rc = vn->add_leases(&leases_template, error_str);
        vn->unlock();
        CPPUNIT_ASSERT( rc != 0 );
        CPPUNIT_ASSERT( error_str != "" );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void add_lease_wrong_ip()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend *>(pool);
        VirtualNetwork * vn;
        int              nid, rc;
        char *           error_msg = 0;
        string           error_str;

        VirtualNetworkTemplate leases_template;


        // Create a leases template as the RM would do
        string str_template = "LEASES = [ IP = 130.0.2 ]";

        rc = leases_template.parse(str_template,&error_msg);
        CPPUNIT_ASSERT( rc == 0 );

        // Allocate a fixed net with only 1 ip
        nid = allocate(0);
        CPPUNIT_ASSERT( nid >= 0 );
        vn = vnpool->get(nid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Add one more lease
        vn->lock();
        rc = vn->add_leases(&leases_template, error_str);
        vn->unlock();

        CPPUNIT_ASSERT( rc != 0 );
        CPPUNIT_ASSERT( error_str != "" );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void add_lease_wrong_mac()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend *>(pool);
        VirtualNetwork * vn;
        int              nid, rc;
        char *           error_msg = 0;
        string           error_str;

        VirtualNetworkTemplate leases_template;


        // Create a leases template as the RM would do
        string str_template = "LEASES=[ IP=130.10.0.2, MAC=50:20:20.10.2 ]";

        rc = leases_template.parse(str_template,&error_msg);
        CPPUNIT_ASSERT( rc == 0 );

        // Allocate a fixed net with only 1 ip
        nid = allocate(0);
        CPPUNIT_ASSERT( nid >= 0 );
        vn = vnpool->get(nid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Add one more lease
        vn->lock();
        rc = vn->add_leases(&leases_template, error_str);
        vn->unlock();

        CPPUNIT_ASSERT( rc != 0 );
        CPPUNIT_ASSERT( error_str != "" );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void add_lease_duplicate_ip()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend *>(pool);
        VirtualNetwork * vn;
        int              nid, rc;
        char *           error_msg = 0;
        string           error_str;

        string           ip     = "";
        string           mac    = "";
        string           bridge = "";

        VirtualNetworkTemplate leases_template;


        // Create a leases template as the RM would do
        string str_template = "LEASES = [ IP = 130.10.0.2 ]";

        rc = leases_template.parse(str_template,&error_msg);
        CPPUNIT_ASSERT( rc == 0 );

        // Allocate a fixed net with only 1 ip
        nid = allocate(0);
        CPPUNIT_ASSERT( nid >= 0 );
        vn = vnpool->get(nid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Add one more lease
        vn->lock();
        rc = vn->add_leases(&leases_template, error_str);
        vn->unlock();
        CPPUNIT_ASSERT( rc == 0 );

        // Add the same lease once more
        vn->lock();
        rc = vn->add_leases(&leases_template, error_str);
        vn->unlock();

        CPPUNIT_ASSERT( rc != 0 );
        CPPUNIT_ASSERT( error_str != "" );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void del_lease_fixed()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend *>(pool);
        VirtualNetwork * vn;
        int              nid, rc;
        char *           error_msg = 0;
        string           error_str;

        string           ip     = "";
        string           mac    = "";
        string           bridge = "";

        VirtualNetworkTemplate leases_template;


        // Create a leases template as the RM would do
        string str_template = "LEASES = [ IP = 130.10.0.1 ]";

        rc = leases_template.parse(str_template,&error_msg);
        CPPUNIT_ASSERT( rc == 0 );

        // Allocate a fixed net with only 1 ip
        nid = allocate(0);
        CPPUNIT_ASSERT( nid >= 0 );
        vn = vnpool->get(nid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Delete the only IP this network has
        vn->lock();
        rc = vn->remove_leases(&leases_template, error_str);
        vn->unlock();
        CPPUNIT_ASSERT( rc == 0 );

        // Ask for an IP, it should fail because there aren't any left
        vn->lock();
        rc = vn->get_lease(77, ip, mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc != 0 );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void del_lease_ranged()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend *>(pool);
        VirtualNetwork * vn;
        int              nid, rc;
        char *           error_msg = 0;
        string           error_str;

        string           ip     = "";
        string           mac    = "";
        string           bridge = "";

        VirtualNetworkTemplate leases_template;


        // Create a leases template as the RM would do
        string str_template = "LEASES = [ IP = 192.168.0.5 ]";

        rc = leases_template.parse(str_template,&error_msg);
        CPPUNIT_ASSERT( rc == 0 );

        // Allocate a ranged net
        nid = allocate(1);
        CPPUNIT_ASSERT( nid >= 0 );
        vn = vnpool->get(nid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Try to delete an IP
        vn->lock();
        rc = vn->remove_leases(&leases_template, error_str);
        vn->unlock();

        CPPUNIT_ASSERT( rc != 0 );
        CPPUNIT_ASSERT( error_str != "" );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void del_lease_wrong_ip()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend *>(pool);
        VirtualNetwork * vn;
        int              nid, rc;
        char *           error_msg = 0;
        string           error_str;

        string           ip     = "";
        string           mac    = "";
        string           bridge = "";

        VirtualNetworkTemplate leases_template;


        // Create a leases template as the RM would do
        string str_template = "LEASES = [ IP = 130.1 ]";

        rc = leases_template.parse(str_template,&error_msg);
        CPPUNIT_ASSERT( rc == 0 );

        // Allocate a fixed net with only 1 ip
        nid = allocate(0);
        CPPUNIT_ASSERT( nid >= 0 );
        vn = vnpool->get(nid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Try to delete an IP
        vn->lock();
        rc = vn->remove_leases(&leases_template, error_str);
        vn->unlock();

        CPPUNIT_ASSERT( rc != 0 );
        CPPUNIT_ASSERT( error_str != "" );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void del_lease_nonexistent_ip()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend *>(pool);
        VirtualNetwork * vn;
        int              nid, rc;
        char *           error_msg = 0;
        string           error_str;

        string           ip     = "";
        string           mac    = "";
        string           bridge = "";

        VirtualNetworkTemplate leases_template;


        // Create a leases template as the RM would do
        string str_template = "LEASES = [ IP = 130.10.0.10 ]";

        rc = leases_template.parse(str_template,&error_msg);
        CPPUNIT_ASSERT( rc == 0 );

        // Allocate a fixed net with only 1 ip
        nid = allocate(0);
        CPPUNIT_ASSERT( nid >= 0 );
        vn = vnpool->get(nid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Try to delete an IP not contained in this network
        vn->lock();
        rc = vn->remove_leases(&leases_template, error_str);
        vn->unlock();

        CPPUNIT_ASSERT( rc != 0 );
        CPPUNIT_ASSERT( error_str != "" );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void del_lease_used_ip()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend *>(pool);
        VirtualNetwork * vn;
        int              nid, rc;
        char *           error_msg = 0;
        string           error_str;

        string           ip     = "";
        string           mac    = "";
        string           bridge = "";

        VirtualNetworkTemplate leases_template;


        // Create a leases template as the RM would do
        string str_template = "LEASES = [ IP = 130.10.0.1 ]";

        rc = leases_template.parse(str_template,&error_msg);
        CPPUNIT_ASSERT( rc == 0 );

        // Allocate a fixed net with only 1 ip
        nid = allocate(0);
        CPPUNIT_ASSERT( nid >= 0 );
        vn = vnpool->get(nid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Request the only IP this network has
        vn->lock();
        ip = "130.10.0.1";
        rc = vn->set_lease(77, ip, mac, bridge);
        vn->unlock();
        CPPUNIT_ASSERT( rc == 0 );

        // Try to delete that IP
        vn->lock();
        rc = vn->remove_leases(&leases_template, error_str);
        vn->unlock();

        CPPUNIT_ASSERT( rc != 0 );
        CPPUNIT_ASSERT( error_str != "" );
    }
};

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return PoolTest::main(argc, argv, VirtualNetworkPoolTest::suite());
}
