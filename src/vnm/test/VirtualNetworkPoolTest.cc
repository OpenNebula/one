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
            "NETWORK_ADDRESS = 192.168.0.0",

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
    "<VNET><ID>0</ID><UID>123</UID><GID>0</GID><UNAME>the_user</UNAME><GNAME>oneadmin</GNAME><NAME>Net number one</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>1</TYPE><BRIDGE>br1</BRIDGE><VLAN>0</VLAN><PHYDEV/><VLAN_ID/><TOTAL_LEASES>0</TOTAL_LEASES><TEMPLATE></TEMPLATE><LEASES><LEASE><IP>130.10.0.1</IP><MAC>50:20:20:20:20:20</MAC><USED>0</USED><VID>-1</VID></LEASE></LEASES></VNET>",

    "<VNET><ID>1</ID><UID>261</UID><GID>0</GID><UNAME>the_user</UNAME><GNAME>oneadmin</GNAME><NAME>A virtual network</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>0</TYPE><BRIDGE>br0</BRIDGE><VLAN>0</VLAN><PHYDEV/><VLAN_ID/><RANGE><IP_START>192.168.0.1</IP_START><IP_END>192.168.0.254</IP_END></RANGE><TOTAL_LEASES>0</TOTAL_LEASES><TEMPLATE><NETWORK_MASK><![CDATA[255.255.255.0]]></NETWORK_MASK></TEMPLATE><LEASES></LEASES></VNET>",

    "<VNET><ID>0</ID><UID>133</UID><GID>0</GID><UNAME>the_user</UNAME><GNAME>oneadmin</GNAME><NAME>Net number two</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>1</TYPE><BRIDGE>br1</BRIDGE><VLAN>0</VLAN><PHYDEV/><VLAN_ID/><TOTAL_LEASES>0</TOTAL_LEASES><TEMPLATE></TEMPLATE><LEASES><LEASE><IP>130.10.2.1</IP><MAC>50:20:20:20:20:20</MAC><USED>0</USED><VID>-1</VID></LEASE></LEASES></VNET>",
};

const string xml_dump =
    "<VNET_POOL><VNET><ID>0</ID><UID>1</UID><GID>0</GID><UNAME>the_user</UNAME><GNAME>oneadmin</GNAME><NAME>Net number one</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>1</TYPE><BRIDGE>br1</BRIDGE><VLAN>0</VLAN><PHYDEV/><VLAN_ID/><TOTAL_LEASES>0</TOTAL_LEASES><TEMPLATE></TEMPLATE></VNET><VNET><ID>1</ID><UID>2</UID><GID>0</GID><UNAME>the_user</UNAME><GNAME>oneadmin</GNAME><NAME>A virtual network</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>0</TYPE><BRIDGE>br0</BRIDGE><VLAN>0</VLAN><PHYDEV/><VLAN_ID/><RANGE><IP_START>192.168.0.1</IP_START><IP_END>192.168.0.254</IP_END></RANGE><TOTAL_LEASES>0</TOTAL_LEASES><TEMPLATE><NETWORK_MASK><![CDATA[255.255.255.0]]></NETWORK_MASK></TEMPLATE></VNET></VNET_POOL>";

const string xml_dump_where =
    "<VNET_POOL><VNET><ID>1</ID><UID>2</UID><GID>0</GID><UNAME>the_user</UNAME><GNAME>oneadmin</GNAME><NAME>A virtual network</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>0</TYPE><BRIDGE>br0</BRIDGE><VLAN>0</VLAN><PHYDEV/><VLAN_ID/><RANGE><IP_START>192.168.0.1</IP_START><IP_END>192.168.0.254</IP_END></RANGE><TOTAL_LEASES>0</TOTAL_LEASES><TEMPLATE><NETWORK_MASK><![CDATA[255.255.255.0]]></NETWORK_MASK></TEMPLATE></VNET></VNET_POOL>";

/* ************************************************************************* */
/* ************************************************************************* */
#include "NebulaTest.h"

class NebulaTestVNet: public NebulaTest
{
public:
    NebulaTestVNet():NebulaTest()
    {
        NebulaTest::the_tester = this;

        need_vnet_pool = true;
    };
};

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
            return VirtualNetworkPool::allocate(uid, 0,"the_user","oneadmin",
                    vn_template, oid, ClusterPool::NONE_CLUSTER_ID,
                    ClusterPool::NONE_CLUSTER_NAME, err);
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
    CPPUNIT_TEST (use_phydev);
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

    CPPUNIT_TEST (range_definition);

    CPPUNIT_TEST (name_index);
    CPPUNIT_TEST (chown_name_index);

    CPPUNIT_TEST_SUITE_END ();

protected:
    NebulaTestVNet *tester;
    VirtualNetworkPool *vnpool;

    void bootstrap(SqlDB* db)
    {
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        return vnpool;
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

        ((VirtualNetwork*)obj)->to_xml_extended(xml_str);

//*
        if( xml_str != xmls[index] )
        {
            cout << endl << xml_str << endl << "========"
                 << endl << xmls[index] << endl << "--------";
        }
//*/

        CPPUNIT_ASSERT( ((VirtualNetwork*)obj)->get_uid() == uids[index] );
        CPPUNIT_ASSERT( xml_str == xmls[index] );
    };


public:
    VirtualNetworkPoolTest(){xmlInitParser();};

    ~VirtualNetworkPoolTest(){xmlCleanupParser();};

    void setUp()
    {
        create_db();

        tester = new NebulaTestVNet();

        Nebula& neb = Nebula::instance();
        neb.start();

        vnpool   = neb.get_vnpool();

        pool    = vnpool;
    };

    void tearDown()
    {
        // -----------------------------------------------------------

        delete_db();

        delete tester;
    };
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

    void use_phydev()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend*>(pool);
        VirtualNetwork *vn;

        int rc,oid;

        ostringstream       oss;

        string xml_str;
        string phydev_templates[] = {
            "NAME = \"BRIDGE and PHYDEV\"\n"
            "TYPE = FIXED\n"
            "BRIDGE = br0\n"
            "PHYDEV = eth0\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]\n",

            "NAME = \"No BRIDGE only PHYDEV\"\n"
            "TYPE = FIXED\n"
            "PHYDEV = eth0\n"
            "LEASES = [IP=130.10.0.1, MAC=50:20:20:20:20:20]\n",
            };

        string phydev_xml[] = {
            "<VNET><ID>0</ID><UID>0</UID><GID>0</GID><UNAME>the_user</UNAME><GNAME>oneadmin</GNAME><NAME>BRIDGE and PHYDEV</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>1</TYPE><BRIDGE>br0</BRIDGE><VLAN>1</VLAN><PHYDEV>eth0</PHYDEV><VLAN_ID/><TOTAL_LEASES>0</TOTAL_LEASES><TEMPLATE></TEMPLATE><LEASES><LEASE><IP>130.10.0.1</IP><MAC>50:20:20:20:20:20</MAC><USED>0</USED><VID>-1</VID></LEASE></LEASES></VNET>",
            "<VNET><ID>1</ID><UID>0</UID><GID>0</GID><UNAME>the_user</UNAME><GNAME>oneadmin</GNAME><NAME>No BRIDGE only PHYDEV</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>1</TYPE><BRIDGE>onebr1</BRIDGE><VLAN>1</VLAN><PHYDEV>eth0</PHYDEV><VLAN_ID/><TOTAL_LEASES>0</TOTAL_LEASES><TEMPLATE></TEMPLATE><LEASES><LEASE><IP>130.10.0.1</IP><MAC>50:20:20:20:20:20</MAC><USED>0</USED><VID>-1</VID></LEASE></LEASES></VNET>"
        };

        // test vm with bridge and phydev
        rc   = vnpool->allocate(0,phydev_templates[0], &oid);
        CPPUNIT_ASSERT( rc >= 0 );
        vn = vnpool->get(rc, false);

        CPPUNIT_ASSERT( vn != 0 );

        ((VirtualNetwork*)vn)->to_xml_extended(xml_str);

//*
        if( xml_str != phydev_xml[0] )
        {
            cout << endl << xml_str << endl << "========"
                 << endl << phydev_xml[0] << endl << "--------";
        }
//*/

        CPPUNIT_ASSERT( xml_str == phydev_xml[0] );

        // test vm with phydev only
        oss.str("");

        rc   = vnpool->allocate(0,phydev_templates[1], &oid);
        CPPUNIT_ASSERT( rc >= 0 );
        vn = vnpool->get(rc, false);

        CPPUNIT_ASSERT( vn != 0 );

        ((VirtualNetwork*)vn)->to_xml_extended(xml_str);

//*
        if( xml_str != phydev_xml[1] )
        {
            cout << endl << xml_str << endl << "========"
                 << endl << phydev_xml[1] << endl << "--------";
        }
//*/

        CPPUNIT_ASSERT( xml_str == phydev_xml[1] );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void wrong_get_name()
    {
        VirtualNetworkPool * vnpool = static_cast<VirtualNetworkPool *>(pool);
        VirtualNetwork * vn;

        // Empty Pool
        vn = vnpool->get(23 , true);
        CPPUNIT_ASSERT( vn == 0 );

        // Allocate an object
        allocate(0);

        // Ask again for a non-existing name
        vn = vnpool->get(23, true);
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
            "NETWORK_ADDRESS = 192.168.0.0\n",

            // Size 126
            "NAME            = \"Net D\"\n"
            "TYPE            = RANGED\n"
            "BRIDGE          = br0\n"
            "NETWORK_SIZE    = 126\n"
            "NETWORK_ADDRESS = 192.168.1.0\n",

            // Size 30
            "NAME            = \"Net E\"\n"
            "TYPE            = RANGED\n"
            "BRIDGE          = br0\n"
            "NETWORK_SIZE    = 30\n"
            "NETWORK_ADDRESS = 192.168.1.0\n"
        };

        unsigned int    sizes[7]={1,3,254,254,65534,126,30};
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
        CPPUNIT_ASSERT( mac     == "00:02:c0:a8:32:01" );
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


        // Ask for the rest of IPs
        vn->lock();
        rc = vn->get_lease(123, ip, mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc == 0 );

        vn->lock();
        rc = vn->get_lease(456, ip, mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc == 0 );

        vn->lock();
        rc = vn->get_lease(457, ip, mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc == 0 );

        vn->lock();
        rc = vn->get_lease(458, ip, mac, bridge);
        vn->unlock();

        CPPUNIT_ASSERT( rc == 0 );

        vn->lock();
        rc = vn->get_lease(459, ip, mac, bridge);
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
        CPPUNIT_ASSERT( mac     == "00:02:c0:a8:32:02" );
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

        string          xml_str;
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
        vn->to_xml_extended(xml_str);

        // 0 Used leases
        ObjectXML::xpath_value(xpath, xml_str.c_str(), "/VNET/TOTAL_LEASES" );
        CPPUNIT_ASSERT( xpath == "0" );

        // Second VNet
        vn = vnpool->get(oid_new, false);
        CPPUNIT_ASSERT( vn != 0 );
        vn->to_xml_extended(xml_str);

        // 1 Used leases
        ObjectXML::xpath_value(xpath, xml_str.c_str(), "/VNET/TOTAL_LEASES" );
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
        vn->to_xml_extended(xml_str);

        // 0 Used leases
        ObjectXML::xpath_value(xpath, xml_str.c_str(), "/VNET/TOTAL_LEASES" );
        CPPUNIT_ASSERT( xpath == "0" );

        // Second VNet
        vn = vnpool->get(oid_new, false);
        CPPUNIT_ASSERT( vn != 0 );
        vn->to_xml_extended(xml_str);

        // 1 Used leases
        ObjectXML::xpath_value(xpath, xml_str.c_str(), "/VNET/TOTAL_LEASES" );
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
        string          tmp_error;

        // Allocate a VNet
        oid = allocate(0);
        CPPUNIT_ASSERT( oid != -1 );

        vn = vnpool->get(oid, false);
        CPPUNIT_ASSERT( vn != 0 );

        // Drop the VNet
        pool->drop(vn, tmp_error);

        // Check that the leases were also dropped
        const char *    table   = "leases";
        string          where   = "oid > -1";

        rc = pool->search(results, table, where);
        CPPUNIT_ASSERT(rc              == 0);
        CPPUNIT_ASSERT(results.size()  == 0);
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void vnpool_nic_attribute()
    {
        VirtualNetworkPoolFriend * vnp =
                                static_cast<VirtualNetworkPoolFriend *>(pool);

        VectorAttribute *   disk;
        int                 oid_0, oid_1;
        string              value, error;

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

        ((VirtualNetworkPool*)vnp)->nic_attribute(disk, 0, 0, error);

        ((VirtualNetworkPool*)vnp)->nic_attribute(disk, 0, 0, error);

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

        ((VirtualNetworkPool*)vnp)->nic_attribute(disk,0, 0, error);

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void range_definition()
    {
        VirtualNetworkPoolFriend * vnpool =
                                static_cast<VirtualNetworkPoolFriend*>(pool);

        int             rc;
        VirtualNetwork* vnet;

        int             oid;
        string          xml_str;
        string          xpath;
        string          err;

        // All these templates should create the same range
        string templ[] = {
                "NAME            = R\n"
                "TYPE            = RANGED\n"
                "BRIDGE          = vbr0\n"
                "NETWORK_ADDRESS = 10.10.10.0\n"
                "NETWORK_SIZE    = C\n",

                "NAME            = R\n"
                "TYPE            = RANGED\n"
                "BRIDGE          = vbr0\n"
                "NETWORK_ADDRESS = 10.10.10.0\n"
                "NETWORK_SIZE    = 254\n",

                "NAME            = R\n"
                "TYPE            = RANGED\n"
                "BRIDGE          = vbr0\n"
                "NETWORK_ADDRESS = 10.10.10.0/24\n",

                "NAME            = R\n"
                "TYPE            = RANGED\n"
                "BRIDGE          = vbr0\n"
                "NETWORK_ADDRESS = 10.10.10.0\n"
                "NETWORK_MASK    = 255.255.255.0\n",



                "NAME            = R\n"
                "TYPE            = RANGED\n"
                "BRIDGE          = vbr0\n"
                "NETWORK_ADDRESS = 10.10.10.0/24\n"
                "IP_START        = 10.10.10.17\n",

                "NAME            = R\n"
                "TYPE            = RANGED\n"
                "BRIDGE          = vbr0\n"
                "NETWORK_ADDRESS = 10.10.10.0/24\n"
                "IP_END          = 10.10.10.41\n",

                "NAME            = R\n"
                "TYPE            = RANGED\n"
                "BRIDGE          = vbr0\n"
                "NETWORK_ADDRESS = 10.10.10.0/24\n"
                "IP_START        = 10.10.10.17\n"
                "IP_END          = 10.10.10.41\n",



                "NAME            = R\n"
                "TYPE            = RANGED\n"
                "BRIDGE          = vbr0\n"
                "IP_START        = 10.10.10.17\n"
                "IP_END          = 10.10.10.41\n",

                "NAME            = R\n"
                "TYPE            = RANGED\n"
                "BRIDGE          = vbr0\n"
                "NETWORK_ADDRESS = 10.10.10.0\n",
        };

        string ip_start[] = {
                "10.10.10.1",
                "10.10.10.1",
                "10.10.10.1",
                "10.10.10.1",

                "10.10.10.17",
                "10.10.10.1",
                "10.10.10.17",

                "10.10.10.17",

                "10.10.10.1",
        };

        string ip_end[] = {
                "10.10.10.254",
                "10.10.10.254",
                "10.10.10.254",
                "10.10.10.254",

                "10.10.10.254",
                "10.10.10.41",
                "10.10.10.41",

                "10.10.10.41",

                "10.10.10.126",
        };


        for (int i = 0 ; i < 9 ; i++)
        {
            rc = vnpool->allocate(uids[0], templ[i], &oid);

            CPPUNIT_ASSERT( rc >= 0 );

            vnet = vnpool->get(oid, false);
            CPPUNIT_ASSERT( vnet != 0 );

            vnet->to_xml_extended(xml_str);

            ObjectXML::xpath_value(xpath, xml_str.c_str(), "/VNET/RANGE/IP_START" );
            CPPUNIT_ASSERT( xpath == ip_start[i] );

            ObjectXML::xpath_value(xpath, xml_str.c_str(), "/VNET/RANGE/IP_END" );
            CPPUNIT_ASSERT( xpath == ip_end[i] );

            vnpool->drop(vnet, err);
        }
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void name_index()
    {
        VirtualNetwork  *vnet_oid, *vnet_name;
        int             oid_0;
        int             uid_0;
        string          name_0;

        oid_0 = allocate(0);

        CPPUNIT_ASSERT(oid_0 != -1);


        // ---------------------------------
        // Get by oid
        vnet_oid = vnpool->get(oid_0, true);
        CPPUNIT_ASSERT(vnet_oid != 0);

        name_0 = vnet_oid->get_name();
        uid_0  = vnet_oid->get_uid();

        vnet_oid->unlock();

        // Get by name and check it is the same object
        vnet_name = vnpool->get(name_0, uid_0, true);
        CPPUNIT_ASSERT(vnet_name != 0);
        vnet_name->unlock();

        CPPUNIT_ASSERT(vnet_oid == vnet_name);

        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        vnpool->clean();

        // Get by oid
        vnet_oid = vnpool->get(oid_0, true);
        CPPUNIT_ASSERT(vnet_oid != 0);
        vnet_oid->unlock();

        // Get by name and check it is the same object
        vnet_name = vnpool->get(name_0, uid_0, true);
        CPPUNIT_ASSERT(vnet_name != 0);
        vnet_name->unlock();

        CPPUNIT_ASSERT(vnet_oid == vnet_name);

        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        vnpool->clean();

        // Get by name
        vnet_name = vnpool->get(name_0, uid_0, true);
        CPPUNIT_ASSERT(vnet_name != 0);
        vnet_name->unlock();

        // Get by oid and check it is the same object
        vnet_oid = vnpool->get(oid_0, true);
        CPPUNIT_ASSERT(vnet_oid != 0);
        vnet_oid->unlock();

        CPPUNIT_ASSERT(vnet_oid == vnet_name);
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void chown_name_index()
    {
        VirtualNetwork      *vnet_oid, *vnet_name;
        int     oid;
        int     old_uid;
        int     new_uid = 3456;
        string  name;

        oid = allocate(0);

        CPPUNIT_ASSERT(oid != -1);


        // ---------------------------------
        // Get by oid
        vnet_oid = vnpool->get(oid, true);
        CPPUNIT_ASSERT(vnet_oid != 0);

        name = vnet_oid->get_name();
        old_uid  = vnet_oid->get_uid();

        // Change owner and update cache index
        vnet_oid->set_user(new_uid, "new_username");
        vnpool->update(vnet_oid);
        vnet_oid->unlock();

        vnpool->update_cache_index(name, old_uid, name, new_uid);

        // Get by name, new_uid and check it is the same object
        vnet_name = vnpool->get(name, new_uid, true);
        CPPUNIT_ASSERT(vnet_name != 0);
        vnet_name->unlock();

        CPPUNIT_ASSERT(vnet_oid == vnet_name);

        // Get by name, old_uid and check it does not exist
        vnet_name = vnpool->get(name, old_uid, true);
        CPPUNIT_ASSERT(vnet_name == 0);

        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        vnpool->clean();


        // Get by name, old_uid and check it does not exist
        vnet_name = vnpool->get(name, old_uid, true);
        CPPUNIT_ASSERT(vnet_name == 0);

        // Get by oid
        vnet_oid = vnpool->get(oid, true);
        CPPUNIT_ASSERT(vnet_oid != 0);
        vnet_oid->unlock();

        // Get by name, new_uid and check it is the same object
        vnet_name = vnpool->get(name, new_uid, true);
        CPPUNIT_ASSERT(vnet_name != 0);
        vnet_name->unlock();

        CPPUNIT_ASSERT(vnet_oid == vnet_name);
    }
};

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return PoolTest::main(argc, argv, VirtualNetworkPoolTest::suite());
}
