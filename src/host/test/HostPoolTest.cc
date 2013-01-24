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

#include <string>
#include <iostream>
#include <stdlib.h>

#include "HostPool.h"
#include "PoolTest.h"

using namespace std;

const string im_mads[]  = {"im_mad_one", "im_mad_2", "im_mad_3"};
const string im_mad = im_mads[0];
const string vmm_mad = "vmm_mad";
const string vnm_mad = "vnm_mad";

const string names[] = {"Host one", "Second host"};

/* ************************************************************************* */
/* ************************************************************************* */

class HostPoolTest : public PoolTest
{
    CPPUNIT_TEST_SUITE (HostPoolTest);

    ALL_POOLTEST_CPPUNIT_TESTS();

    CPPUNIT_TEST (update);
    CPPUNIT_TEST (discover);
    CPPUNIT_TEST (duplicates);
    CPPUNIT_TEST (name_index);

//    CPPUNIT_TEST (scale_test);

    CPPUNIT_TEST_SUITE_END ();

protected:

    void bootstrap(SqlDB* db)
    {
        HostPool::bootstrap(db);
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        vector<const Attribute *> hook;

        return new HostPool(db,hook,"./", "./", 0);
    };

    int allocate(int index)
    {
        int    oid;
        string err;
        return ((HostPool*)pool)->allocate(&oid, names[index], im_mads[index],
                     vmm_mad, vnm_mad, 
                     ClusterPool::NONE_CLUSTER_ID,
                     ClusterPool::NONE_CLUSTER_NAME,err);
    };

    void check(int index, PoolObjectSQL* obj)
    {
        string st;

        CPPUNIT_ASSERT( obj != 0 );

        Host * host = static_cast<Host *>(obj);

        ObjectXML xml(host->to_xml(st));

        CPPUNIT_ASSERT( host->get_name() == names[index] );

        xml.xpath(st, "/HOST/IM_MAD", "-");

        CPPUNIT_ASSERT( st == im_mads[index] );
    };


public:
    HostPoolTest(){xmlInitParser();};

    ~HostPoolTest(){xmlCleanupParser();};


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
        string err;

        string im_mad_2 = "another_im_mad";


        // If we try to allocate two hosts with the same name and drivers,
        // should fail
        rc = hp->allocate(&oid_0, 
                          names[0], 
                          im_mad, 
                          vmm_mad, 
                          vnm_mad, 
                          ClusterPool::NONE_CLUSTER_ID,
                          ClusterPool::NONE_CLUSTER_NAME,
                          err);
        CPPUNIT_ASSERT( oid_0 == 0 );
        CPPUNIT_ASSERT( rc    == oid_0 );

        rc = hp->allocate(&oid_1, 
                          names[0], 
                          im_mad, 
                          vmm_mad, 
                          vnm_mad, 
                          ClusterPool::NONE_CLUSTER_ID,
                          ClusterPool::NONE_CLUSTER_NAME,
                          err);
        CPPUNIT_ASSERT( oid_1 == -1 );
        CPPUNIT_ASSERT( rc    == oid_1 );

        // the hostname cannot be repeated if the drivers change
        rc = hp->allocate(&oid_1, 
                          names[0], 
                          im_mad_2, 
                          vmm_mad, 
                          vnm_mad, 
                          ClusterPool::NONE_CLUSTER_ID,
                          ClusterPool::NONE_CLUSTER_NAME,
                          err);
        CPPUNIT_ASSERT( oid_1 == -1 );
        CPPUNIT_ASSERT( rc    == oid_1 );

        // Get the hosts and check them
        host = hp->get(oid_0, false);
        CPPUNIT_ASSERT( host != 0 );
        CPPUNIT_ASSERT( host->get_im_mad() == im_mad );
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
        string err;

        for(i=0, oss.str(""); i<20; i++,oss.str(""))
        {
            oss << "host" << i;

            hp->allocate(&oid, 
                         oss.str(), 
                         im_mad, 
                         vmm_mad, 
                         vnm_mad, 
                         ClusterPool::NONE_CLUSTER_ID,
                         ClusterPool::NONE_CLUSTER_NAME,
                         err);
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
        rc = hp->discover(&dh,100);

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

    void scale_test()
    {
        time_t the_time, the_time2;
        int oid,i,j;

        ostringstream oss,ossdump;
        string        err;
        Host * host;

        string monitor = "ARCH=x86_64 MODELNAME=\"Intel(R) Core(TM)2 Duo CPU P9300 @ 2.26GHz\" HYPERVISOR=kvm TOTALCPU=200 CPUSPEED=800 TOTALMEMORY=4005416 USEDMEMORY=2351928 FREEMEMORY=2826904 FREECPU=188.4 USEDCPU=11.599999999999994 NETRX=0 NETTX=0 HOSTNAME=pc-ruben";

        cout << endl << "Allocate Test" << endl;

        tearDown();

        for (i=1000; i<30000 ; i = i + 5000)
        {
            setUp();
            
            HostPool * hp = static_cast<HostPool *>(pool);

            the_time = time(0);

            for (j=0,oss.str(""); j<i ; j=j+1,oss.str(""))
            {
                oss << "host" << j;

                hp->allocate(&oid, 
                         oss.str(), 
                         im_mad, 
                         vmm_mad, 
                         vnm_mad, 
                         ClusterPool::NONE_CLUSTER_ID,
                         ClusterPool::NONE_CLUSTER_NAME,
                         err);
            }

            the_time2 = time(0) - the_time;

            hp->clean();

            the_time = time(0);

            hp->dump(ossdump, "");

            cout <<"\t"<<i<<"\t"<<the_time2<<"\t"<<time(0)-the_time<< endl;

            tearDown();
        } 

        cout << endl << "Read Test" << endl;

        setUp();


        // Allocate a HostPool
        setUp();

        HostPool * hp = static_cast<HostPool *>(pool);

        for (i=10000,oss.str(""); i<30000 ; i++,oss.str(""))
        {
            oss << "host" << i;
            hp->allocate(&oid, 
                         oss.str(), 
                         im_mad, 
                         vmm_mad, 
                         vnm_mad, 
                         ClusterPool::NONE_CLUSTER_ID,
                         ClusterPool::NONE_CLUSTER_NAME,
                         err);

            host = hp->get(oid, false);

            host->update_info(monitor);
            hp->update(host);
        }
           
       //Load test 
        for (i=0; i<25000; i=i+5000)
        {
            hp->clean();

            the_time = time(0);

            for (j=0; j<i ; j++)
            {
                host = hp->get(j,true);
                host->unlock();
            }

            cout << "\t" << i << "\t" << time(0) - the_time << endl;
        }
    }

    /* ********************************************************************* */

    void name_index()
    {
        HostPool *  hp = static_cast<HostPool *>(pool);
        Host        *host_oid, *host_name;
        int         oid_0;
        //int         uid_0;
        string      name_0;

        oid_0 = allocate(0);

        CPPUNIT_ASSERT(oid_0 != -1);

        // ---------------------------------
        // Get by oid
        host_oid = hp->get(oid_0, true);
        CPPUNIT_ASSERT(host_oid != 0);

        name_0 = host_oid->get_name();
        //uid_0  = host_oid->get_uid();

        host_oid->unlock();

        // Get by name and check it is the same object
        host_name = hp->get(name_0, true);
        CPPUNIT_ASSERT(host_name != 0);
        host_name->unlock();

        CPPUNIT_ASSERT(host_oid == host_name);

        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        hp->clean();

        // Get by oid
        host_oid = hp->get(oid_0, true);
        CPPUNIT_ASSERT(host_oid != 0);
        host_oid->unlock();

        // Get by name and check it is the same object
        host_name = hp->get(name_0, true);
        CPPUNIT_ASSERT(host_name != 0);
        host_name->unlock();

        CPPUNIT_ASSERT(host_oid == host_name);

        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        hp->clean();

        // Get by name
        host_name = hp->get(name_0, true);
        CPPUNIT_ASSERT(host_name != 0);
        host_name->unlock();

        // Get by oid and check it is the same object
        host_oid = hp->get(oid_0, true);
        CPPUNIT_ASSERT(host_oid != 0);
        host_oid->unlock();

        CPPUNIT_ASSERT(host_oid == host_name);
    }
};


/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return PoolTest::main(argc, argv, HostPoolTest::suite(), "host_pool.xml");
}
