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

#include <string>
#include <iostream>
#include <stdlib.h>

#include "HostPool.h"
#include "PoolTest.h"

using namespace std;

const string im_mad  = "im_mad";
const string vmm_mad = "vmm_mad";
const string tm_mad  = "tm_mad";

const string names[] = {"Host one", "Second host"};

const string xmls[] =
{
    "<HOST><ID>0</ID><NAME>Host one</NAME><STATE>0</STATE>"
    "<IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD>"
    "<LAST_MON_TIME>0</LAST_MON_TIME><CLUSTER>default</CLUSTER><HOST_SHARE><HID>0</HID>"
    "<DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE>"
    "<MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CPU>"
    "<FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU>"
    "<USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU>"
    "<RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST>",

    "<HOST><ID>1</ID><NAME>Second host</NAME><STATE>0</STATE>"
    "<IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD>"
    "<LAST_MON_TIME>0</LAST_MON_TIME><CLUSTER>default</CLUSTER><HOST_SHARE><HID>1</HID>"
    "<DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE>"
    "<MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CPU>"
    "<FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU>"
    "<USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU>"
    "<RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST>"
};

// This xml dump result has the LAST_MON_TIMEs modified to 0000000000
const string xml_dump =
    "<HOST_POOL><HOST><ID>0</ID><NAME>a</NAME><STATE>0</STATE><IM_MAD>im_mad</I"
    "M_MAD><VM_MAD>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0"
    "</LAST_MON_TIME><CLUSTER>default</CLUSTER><HOST_SHARE><HID>0</HID><DISK_USAGE>0</DISK_USAGE><MEM"
    "_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM"
    ">0</MAX_MEM><MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_"
    "MEM><FREE_CPU>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><U"
    "SED_CPU>0</USED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST>"
    "<ID>1</ID><NAME>a name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MA"
    "D>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0</LAST_M"
    "ON_TIME><CLUSTER>default</CLUSTER><HOST_SHARE><HID>1</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</ME"
    "M_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM>"
    "<MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CP"
    "U>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</U"
    "SED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST><ID>2</ID><N"
    "AME>a_name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</V"
    "M_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0</LAST_MON_TIME><CLUSTER>default</CLUSTER><HOS"
    "T_SHARE><HID>2</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU"
    "_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</"
    "MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CP"
    "U><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUN"
    "NING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST><ID>3</ID><NAME>another "
    "name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD>"
    "<TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0</LAST_MON_TIME><CLUSTER>default</CLUSTER><HOST_SHAR"
    "E><HID>3</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE"
    ">0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CP"
    "U><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU><USE"
    "D_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUNNING_V"
    "MS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST><ID>4</ID><NAME>host</NAME><ST"
    "ATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD><TM_MAD>tm_mad"
    "</TM_MAD><LAST_MON_TIME>0</LAST_MON_TIME><CLUSTER>default</CLUSTER><HOST_SHARE><HID>4</HID>"
    "<DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE>"
    "<MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CPU><FREE_DISK>0"
    "</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU><USED_DISK>0</USED"
    "_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUNNING_VMS>0</RUNNING_"
    "VMS></HOST_SHARE></HOST></HOST_POOL>";

const string xml_dump_like_a =
    "<HOST_POOL><HOST><ID>0</ID><NAME>a</NAME><STATE>0</STATE><IM_MAD>im_mad</I"
    "M_MAD><VM_MAD>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0"
    "</LAST_MON_TIME><CLUSTER>default</CLUSTER><HOST_SHARE><HID>0</HID><DISK_USAGE>0</DISK_USAGE><MEM"
    "_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM"
    ">0</MAX_MEM><MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_"
    "MEM><FREE_CPU>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><U"
    "SED_CPU>0</USED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST>"
    "<ID>1</ID><NAME>a name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MA"
    "D>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0</LAST_M"
    "ON_TIME><CLUSTER>default</CLUSTER><HOST_SHARE><HID>1</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</ME"
    "M_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM>"
    "<MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CP"
    "U>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</U"
    "SED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST><ID>2</ID><N"
    "AME>a_name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</V"
    "M_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0</LAST_MON_TIME><CLUSTER>default</CLUSTER><HOS"
    "T_SHARE><HID>2</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU"
    "_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</"
    "MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CP"
    "U><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUN"
    "NING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST><ID>3</ID><NAME>another "
    "name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD>"
    "<TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0</LAST_MON_TIME><CLUSTER>default</CLUSTER><HOST_SHAR"
    "E><HID>3</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE"
    ">0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CP"
    "U><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU><USE"
    "D_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUNNING_V"
    "MS>0</RUNNING_VMS></HOST_SHARE></HOST></HOST_POOL>";


const string cluster_default =
    "<CLUSTER><ID>0</ID><NAME>default</NAME></CLUSTER>";

const string cluster_xml_dump =
    "<CLUSTER_POOL><CLUSTER><ID>0</ID><NAME>default</NAME></CLUSTER><CLUSTER><ID>1</ID><NAME>cluster_a</NAME></CLUSTER><CLUSTER><ID>3</ID><NAME>cluster_c</NAME></CLUSTER><CLUSTER><ID>4</ID><NAME>cluster_d</NAME></CLUSTER></CLUSTER_POOL>";

const string host_0_cluster =
    "<HOST><ID>0</ID><NAME>Host one</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0</LAST_MON_TIME><CLUSTER>cluster_a</CLUSTER><HOST_SHARE><HID>0</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST>";
/* ************************************************************************* */
/* ************************************************************************* */

class HostPoolTest : public PoolTest
{
    CPPUNIT_TEST_SUITE (HostPoolTest);

    ALL_POOLTEST_CPPUNIT_TESTS();

    CPPUNIT_TEST (update);
    CPPUNIT_TEST (dump);
    CPPUNIT_TEST (dump_where);
    CPPUNIT_TEST (discover);
    CPPUNIT_TEST (duplicates);

    CPPUNIT_TEST (cluster_init);
    CPPUNIT_TEST (cluster_allocate);
    CPPUNIT_TEST (cluster_drop);
    CPPUNIT_TEST (cluster_id);
    CPPUNIT_TEST (cluster_dump);
    CPPUNIT_TEST (set_cluster);
    CPPUNIT_TEST (remove_cluster);

    CPPUNIT_TEST_SUITE_END ();

protected:

    void bootstrap(SqlDB* db)
    {
        HostPool::bootstrap(db);
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        return new HostPool(db);
    };

    int allocate(int index)
    {
        int oid;
        return ((HostPool*)pool)->allocate(&oid, names[index], im_mad,
                                           vmm_mad, tm_mad);
    };

    void check(int index, PoolObjectSQL* obj)
    {
        Host * host = static_cast<Host *>(obj);

        CPPUNIT_ASSERT( obj != 0 );

        string xml_str = "";
        string name = host->get_hostname();

        CPPUNIT_ASSERT( name == names[index] );

        // Get the xml
        host->to_xml(xml_str);
        CPPUNIT_ASSERT( xml_str == xmls[index]);
    };


public:
    HostPoolTest(){};

    ~HostPoolTest(){};


    /* ********************************************************************* */
    /* ********************************************************************* */


    void update()
    {
        HostPool * hp = static_cast<HostPool *>(pool);
        int oid_1 = allocate(0);

        Host* host = hp->get(oid_1, true);
        CPPUNIT_ASSERT( host != 0 );

        // Host object should be cached. Let's update its status
        host->set_state(Host::DISABLED);
        pool->update(host);

        host->unlock();

        host = hp->get(oid_1,false);
        CPPUNIT_ASSERT( host != 0 );
        CPPUNIT_ASSERT( host->get_state() == Host::DISABLED );

        //Now force access to DB

        pool->clean();
        host = hp->get(oid_1,false);

        CPPUNIT_ASSERT( host != 0 );
        CPPUNIT_ASSERT( host->get_state() == Host::DISABLED );
    };

    /* ********************************************************************* */

    void duplicates()
    {
        int rc, oid_0, oid_1;
        HostPool * hp = static_cast<HostPool *>(pool);
        Host * host;

        string tm_mad_2 = "another_tm_mad";


        // If we try to allocate two hosts with the same name and drivers,
        // should fail
        rc = hp->allocate(&oid_0, names[0], im_mad, vmm_mad, tm_mad);
        CPPUNIT_ASSERT( oid_0 == 0 );
        CPPUNIT_ASSERT( rc    == oid_0 );

        rc = hp->allocate(&oid_1, names[0], im_mad, vmm_mad, tm_mad);
        CPPUNIT_ASSERT( oid_1 == -1 );
        CPPUNIT_ASSERT( rc    == oid_1 );

        // But if the drivers change, the hostname can be repeated
        rc = hp->allocate(&oid_1, names[0], im_mad, vmm_mad, tm_mad_2);
        CPPUNIT_ASSERT( oid_1 == 1 );
        CPPUNIT_ASSERT( rc    == oid_1 );

        // Get the hosts and check them
        host = hp->get(oid_0, false);
        CPPUNIT_ASSERT( host != 0 );
        CPPUNIT_ASSERT( host->get_tm_mad() == tm_mad );

        host = hp->get(oid_1, false);
        CPPUNIT_ASSERT( host != 0 );
        CPPUNIT_ASSERT( host->get_tm_mad() == tm_mad_2 );
    }

    /* ********************************************************************* */

    void dump()
    {
        string names[] = {"a", "a name", "a_name", "another name", "host"};
        int rc, oid;

        for(int i=0; i<5; i++)
        {
            ((HostPool*)pool)->allocate(&oid, names[i], im_mad, vmm_mad, tm_mad);
        }

        ostringstream oss;

        rc = ((HostPool*)pool)->dump(oss, "");
        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();

        CPPUNIT_ASSERT( result == xml_dump );
    }

    /* ********************************************************************* */

    void dump_where()
    {
        string names[] = {"a", "a name", "a_name", "another name", "host"};
        int rc, oid;

        for(int i=0; i<5; i++)
        {
            ((HostPool*)pool)->allocate(&oid, names[i], im_mad, vmm_mad, tm_mad);
        }


        ostringstream oss;
        rc = ((HostPool*)pool)->dump(oss, "host_name LIKE 'a%'");
        CPPUNIT_ASSERT(rc == 0);


        string result = oss.str();

        CPPUNIT_ASSERT( result == xml_dump_like_a );
    }

    /* ********************************************************************* */

    void discover()
    {
        int  rc, oid, i;

        map<int, string>           dh;
        map<int, string>::iterator it;

        Host *     host;
        HostPool * hp = static_cast<HostPool *>(pool);
        ostringstream oss;

        for(i=0, oss.str(""); i<20; i++,oss.str(""))
        {
            oss << "host" << i;

            hp->allocate(&oid, oss.str().c_str(), im_mad, vmm_mad, tm_mad);
            CPPUNIT_ASSERT(oid == i);

            if (i >=8 )
            {
                host = hp->get(oid, false);
                CPPUNIT_ASSERT(host!=0);
                host->disable();
                hp->update(host);
            }
        }

        // Discover the enabled hosts
        rc = hp->discover(&dh, 100);
        CPPUNIT_ASSERT(rc == 0);
        CPPUNIT_ASSERT(dh.size() == 8);

        for(i=0,it=dh.begin(),oss.str("");it!=dh.end();it++,i++,oss.str(""))
        {
            CPPUNIT_ASSERT(it->first  == i);
            CPPUNIT_ASSERT(it->second == im_mad);

            host = hp->get(i, false);
            CPPUNIT_ASSERT(host!=0);
            CPPUNIT_ASSERT(host->isEnabled());
        }
    }

    /* ********************************************************************* */
    /* ********************************************************************* */

    void cluster_init()
    {
        HostPool * hp = static_cast<HostPool *>(pool);

        CPPUNIT_ASSERT( hp->info_cluster(0) == cluster_default );
    }

    /* ********************************************************************* */

    void cluster_allocate()
    {
        HostPool * hp = static_cast<HostPool *>(pool);
        int clid, rc;

        rc = hp->allocate_cluster(&clid, "new_cluster");
        CPPUNIT_ASSERT( rc == clid );
        CPPUNIT_ASSERT( clid == 1 );

        CPPUNIT_ASSERT( hp->info_cluster(clid) ==
                "<CLUSTER><ID>1</ID><NAME>new_cluster</NAME></CLUSTER>");

        // Try to allocate using the same name
        rc = hp->allocate_cluster(&clid, "new_cluster");
        CPPUNIT_ASSERT( rc == clid );
        CPPUNIT_ASSERT( clid == -1 );
    }

    /* ********************************************************************* */

    void cluster_drop()
    {
        HostPool * hp = static_cast<HostPool *>(pool);
        int clid, rc;

        // Drop a non-existing cluster
        rc = hp->drop_cluster(20);
        CPPUNIT_ASSERT( rc == -1 );

        // Allocate a cluster and drop it
        rc = hp->allocate_cluster(&clid, "new_cluster");
        CPPUNIT_ASSERT( clid == 1);

        rc = hp->drop_cluster(clid);
        CPPUNIT_ASSERT( rc == 0 );

        // Try to drop the default cluster, should fail
        rc = hp->drop_cluster(0);
        CPPUNIT_ASSERT( rc == -1 );
    }

    /* ********************************************************************* */

    void cluster_id()
    {
        HostPool * hp = static_cast<HostPool *>(pool);
        int clid, rc;
        ostringstream oss;

        // Allocate some clusters
        rc = hp->allocate_cluster(&clid, "cluster_a");
        CPPUNIT_ASSERT( rc == 1 );

        rc = hp->allocate_cluster(&clid, "cluster_b");
        CPPUNIT_ASSERT( rc == 2 );

        rc = hp->allocate_cluster(&clid, "cluster_c");
        CPPUNIT_ASSERT( rc == 3 );

        rc = hp->allocate_cluster(&clid, "cluster_d");
        CPPUNIT_ASSERT( rc == 4 );

        // Drop id 2
        rc = hp->drop_cluster(2);
        CPPUNIT_ASSERT( rc == 0 );

        // Next one should use id 5, because the biggest id is 4
        rc = hp->allocate_cluster(&clid, "cluster_e");
        CPPUNIT_ASSERT( rc == 5 );

        // Drop id 5
        rc = hp->drop_cluster(5);
        CPPUNIT_ASSERT( rc == 0 );

        // Next one should use id 5, because the biggest id is 4 again
        rc = hp->allocate_cluster(&clid, "cluster_f");
        CPPUNIT_ASSERT( rc == 5 );

    }

    /* ********************************************************************* */

    void cluster_dump()
    {
        HostPool * hp = static_cast<HostPool *>(pool);
        int clid, rc;
        ostringstream oss;

        // Allocate some clusters
        rc = hp->allocate_cluster(&clid, "cluster_a");
        CPPUNIT_ASSERT( rc == 1 );

        rc = hp->allocate_cluster(&clid, "cluster_b");
        CPPUNIT_ASSERT( rc == 2 );

        rc = hp->allocate_cluster(&clid, "cluster_c");
        CPPUNIT_ASSERT( rc == 3 );

        rc = hp->allocate_cluster(&clid, "cluster_d");
        CPPUNIT_ASSERT( rc == 4 );


        // Drop one of them
        rc = hp->drop_cluster(2);
        CPPUNIT_ASSERT( rc == 0 );

        // dump the pool
        rc = hp->dump_cluster(oss);
        CPPUNIT_ASSERT( oss.str() == cluster_xml_dump );
    }

    /* ********************************************************************* */

    void set_cluster()
    {
        HostPool *  hp = static_cast<HostPool *>(pool);
        Host*       host;
        int         clid, rc, oid;
        string      xml_str;

        // Allocate a host
        oid = allocate(0);

        host = hp->get(0, false);

        rc = hp->allocate_cluster(&clid, "cluster_a");
        CPPUNIT_ASSERT( rc == 1 );

        rc = hp->set_cluster(host, clid);
        CPPUNIT_ASSERT( rc == 0 );

        host->to_xml(xml_str);
        CPPUNIT_ASSERT( xml_str == host_0_cluster);


        // Try to set a non-existing cluster
        rc = hp->set_cluster(host, 20);
        CPPUNIT_ASSERT( rc == -1 );

        CPPUNIT_ASSERT( xml_str == host_0_cluster);

    }

    /* ********************************************************************* */

    void remove_cluster()
    {
        HostPool *  hp = static_cast<HostPool *>(pool);
        Host*       host;
        int         clid, rc, oid;
        string      xml_str;

        // Allocate a host
        oid = allocate(0);

        host = hp->get(0, false);

        rc = hp->allocate_cluster(&clid, "cluster_a");
        CPPUNIT_ASSERT( rc == 1 );

        // Set host 0 to cluster 1
        rc = hp->set_cluster(host, clid);
        CPPUNIT_ASSERT( rc == 0 );

        // Check
        host->to_xml(xml_str);
        CPPUNIT_ASSERT( xml_str == host_0_cluster);

        // Remove the cluster
        rc = hp->set_default_cluster(host);
        CPPUNIT_ASSERT( rc == 0 );

        // The host should have been moved to the default cluster
        host->to_xml(xml_str);
        check(0, host);
    }
};


/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return PoolTest::main(argc, argv, HostPoolTest::suite());
}
