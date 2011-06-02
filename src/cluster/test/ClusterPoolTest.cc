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

#include "ClusterPool.h"
#include "PoolTest.h"

using namespace std;

const string names[] = {"cluster_a", "Second cluster"};

const string xmls[] =
{
    "<CLUSTER><ID>1</ID><NAME>cluster_a</NAME><HOSTS></HOSTS></CLUSTER>",
    "<CLUSTER><ID>2</ID><NAME>Second cluster</NAME><HOSTS></HOSTS></CLUSTER>"
};

const string cluster_default =
    "<CLUSTER><ID>0</ID><NAME>default</NAME><HOSTS></HOSTS></CLUSTER>";

const string cluster_xml_dump =
    "<CLUSTER_POOL><CLUSTER><ID>0</ID><NAME>default</NAME><HOSTS></HOSTS></CLUSTER><CLUSTER><ID>1</ID><NAME>cluster_a</NAME><HOSTS></HOSTS></CLUSTER><CLUSTER><ID>3</ID><NAME>cluster_c</NAME><HOSTS></HOSTS></CLUSTER><CLUSTER><ID>4</ID><NAME>cluster_d</NAME><HOSTS></HOSTS></CLUSTER></CLUSTER_POOL>";

const string host_0_cluster =
    "<HOST><ID>0</ID><NAME>Host one</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0</LAST_MON_TIME><CID>1</CID><HOST_SHARE><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST>";

const string host_0_default =
    "<HOST><ID>0</ID><NAME>Host one</NAME><STATE>0</STATE>"
    "<IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD>"
    "<LAST_MON_TIME>0</LAST_MON_TIME><CID>0</CID><HOST_SHARE>"
    "<DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE>"
    "<MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CPU>"
    "<FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU>"
    "<USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU>"
    "<RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST>";

/* ************************************************************************* */
/* ************************************************************************* */


#include "NebulaTest.h"

class NebulaTestCluster: public NebulaTest
{
public:
    NebulaTestCluster():NebulaTest()
    {
        NebulaTest::the_tester = this;

        need_host_pool = true;    
        need_cluster_pool= true;
    }
};

class ClusterPoolTest : public PoolTest
{
    CPPUNIT_TEST_SUITE (ClusterPoolTest);

    // Not all tests from PoolTest can be used. Because
    // of the initial default cluster added to the DB, the
    // oid_assignment would fail.
    CPPUNIT_TEST (get_from_cache);
    CPPUNIT_TEST (get_from_db);
    CPPUNIT_TEST (wrong_get);
    CPPUNIT_TEST (drop_and_get);

    CPPUNIT_TEST (name_pool);

    CPPUNIT_TEST (duplicates);
    CPPUNIT_TEST (delete_cluster);
    CPPUNIT_TEST (dump);

    CPPUNIT_TEST_SUITE_END ();

protected:

    NebulaTestCluster * tester;
    HostPool *          hpool;
    ClusterPool *       cpool;



    void bootstrap(SqlDB* db)
    {
        // setUp overwritten
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        // setUp overwritten
        return cpool;
    };

    int allocate(int index)
    {
        int    oid;
        string err;

        return cpool->allocate(&oid, names[index], err);
    };

    void check(int index, PoolObjectSQL* obj)
    {
        Cluster * cluster = static_cast<Cluster *>(obj);

        CPPUNIT_ASSERT( obj != 0 );

        string xml_str = "";
        string name = cluster->get_name();

        CPPUNIT_ASSERT( name == names[index] );

        // Get the xml
        cluster->to_xml(xml_str);

//  A little help for debugging
/*
        if( xml_str != xmls[index] )
        {
            cout << endl << xml_str << endl << "========"
                 << endl << xmls[index];
        }
//*/
        CPPUNIT_ASSERT( xml_str == xmls[index]);
    };

private:

    /**
     *  Allocates a Host.
     */
    void init_hp()
    {
        int    oid;
        string err;

        // Allocate a host
        oid = hpool->allocate(&oid, "Host one","im_mad","vmm_mad", "tm_mad", err);
        CPPUNIT_ASSERT(oid == 0);

        hpool->clean();
    };

public:
    ClusterPoolTest()
    {
        xmlInitParser();
    };

    ~ClusterPoolTest()
    {
        xmlCleanupParser();
    };

    void setUp()
    {
        create_db();

        tester = new NebulaTestCluster();

        Nebula& neb = Nebula::instance();
        neb.start();

        hpool   = neb.get_hpool();
        cpool   = neb.get_cpool();

        pool    = cpool;
    };

    void tearDown()
    {
        delete_db();

        delete tester;
    };

    /* ********************************************************************* */
    /* ********************************************************************* */

    // Test intended to check the PoolSQL name index functionallity
    void name_pool()
    {
        Cluster *   cluster;
        int         oid;
        string      err;


        // Allocate some clusters
        cpool->allocate(&oid, "name_1", err);
        CPPUNIT_ASSERT( oid == 1 );

        cpool->allocate(&oid, "name_2", err);
        CPPUNIT_ASSERT( oid == 2 );

        cpool->allocate(&oid, "name_3", err);
        CPPUNIT_ASSERT( oid == 3 );

        // Clean the cache
        cpool->clean();

        cpool->allocate(&oid, "name_4", err);
        CPPUNIT_ASSERT( oid == 4 );

        cpool->allocate(&oid, "name_5", err);
        CPPUNIT_ASSERT( oid == 5 );

        // Cluster names 0-3 should be unknown, and 4-5 cached
        // Ask for a cached object
        cluster = cpool->get("name_5", false);
        CPPUNIT_ASSERT( cluster != 0 );
        CPPUNIT_ASSERT( cluster->get_oid() == 5 );
        CPPUNIT_ASSERT( cluster->get_name() == "name_5" );

        // Ask for non-cached object
        cluster = cpool->get("name_2", false);
        CPPUNIT_ASSERT( cluster != 0 );
        CPPUNIT_ASSERT( cluster->get_oid() == 2 );
        CPPUNIT_ASSERT( cluster->get_name() == "name_2" );

        // Ask for non-existing object
        cluster = cpool->get("name_X", false);
        CPPUNIT_ASSERT( cluster == 0 );
    };

    /* ********************************************************************* */

    void duplicates()
    {
        int rc, oid;
        string err;

        // Allocate a cluster.
        rc = cpool->allocate(&oid, names[1], err);
        CPPUNIT_ASSERT( oid == 1 );
        CPPUNIT_ASSERT( oid == rc );

        // Try to allocate twice the same cluster, should fail
        rc = cpool->allocate(&oid, names[1], err);
        CPPUNIT_ASSERT( rc  == -1 );
        CPPUNIT_ASSERT( oid == rc );
    }

    /* ********************************************************************* */

    void delete_cluster()
    {
        Host *          host;
        Cluster         * cluster, * cluster_old;

        int             rc, oid, host_gid;
        string          xml_str;

        init_hp();
        host = hpool->get(0, false);
        CPPUNIT_ASSERT(host != 0);

        // Allocate a cluster
        oid = allocate(0);
        CPPUNIT_ASSERT(oid == 1);

        cluster = cpool->get(1, false);

        // Get current host cluster
        host_gid = host->get_gid();

        // Set cluster
        rc = host->set_gid(cluster->get_oid());
        CPPUNIT_ASSERT( rc == 0 );

        // Add host ID to cluster
        rc = static_cast<ObjectCollection*>(cluster)->add_collection_id(host);
        CPPUNIT_ASSERT( rc == 0 );

        // Update the DB
        hpool->update(host);
        cpool->update(cluster);

        // Now get the old cluster, and remove the Host Id from it
        cluster_old = cpool->get(host_gid, false);
        CPPUNIT_ASSERT(cluster_old != 0);

        cluster_old->del_collection_id(host);
        cpool->update(cluster_old);


        host->to_xml(xml_str);
        CPPUNIT_ASSERT( xml_str == host_0_cluster);

        // Delete the cluster
        rc = cpool->drop(cluster);
        CPPUNIT_ASSERT( rc == 0 );

        // The host should have been moved to the default cluster
        host = hpool->get(0, false);
        host->to_xml(xml_str);
/*
        if( xml_str != host_0_default )
        {
            cout << endl << xml_str << endl << "========"
                 << endl << host_0_default;
        }
//*/
        CPPUNIT_ASSERT( xml_str == host_0_default);
    }

    /* ********************************************************************* */

    void dump()
    {
        Cluster *       cluster;
        int             oid, rc;
        ostringstream   oss;
        string          err;

        // Allocate some clusters
        rc = cpool->allocate(&oid, "cluster_a", err);
        CPPUNIT_ASSERT( rc == 1 );

        rc = cpool->allocate(&oid, "cluster_b", err);
        CPPUNIT_ASSERT( rc == 2 );

        rc = cpool->allocate(&oid, "cluster_c", err);
        CPPUNIT_ASSERT( rc == 3 );

        rc = cpool->allocate(&oid, "cluster_d", err);
        CPPUNIT_ASSERT( rc == 4 );

        // Drop one of them
        cluster = cpool->get(2, false);
        CPPUNIT_ASSERT( cluster != 0 );

        rc = cpool->drop(cluster);
        CPPUNIT_ASSERT( rc == 0 );

        // dump the pool
        rc = cpool->dump(oss,"");
/*
        if( oss.str() != cluster_xml_dump )
        {
            cout << endl << oss.str() << endl << "========"
                 << endl << cluster_xml_dump;
        }
//*/
        CPPUNIT_ASSERT( oss.str() == cluster_xml_dump );
    }
};

/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return PoolTest::main(argc, argv, ClusterPoolTest::suite());
}
