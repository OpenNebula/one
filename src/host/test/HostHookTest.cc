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

#include "OneUnitTest.h"
#include "Nebula.h"
#include "NebulaTestHost.h"

#include <string>
#include <iostream>
#include <stdlib.h>

using namespace std;

class HostHookTest : public OneUnitTest
{

    CPPUNIT_TEST_SUITE (HostHookTest);

    CPPUNIT_TEST (allocate_hook);
    CPPUNIT_TEST (monitoring_error);
    CPPUNIT_TEST (error_imd);
    CPPUNIT_TEST (disable_hook);

    CPPUNIT_TEST_SUITE_END ();

private:

    Host *          host;
    HostPool *      hpool;
    HookManager *   hm;

    NebulaTestHost * tester;

    int     oid;
    int     rc;

public:

    void setUp()
    {
        // Create var dir.
        string command = "mkdir -p var";
        std::system(command.c_str());

        create_db();

        tester = new NebulaTestHost();

        Nebula& neb = Nebula::instance();
        neb.start();

        hpool   = neb.get_hpool();
        hm      = static_cast<HookManager*>(neb.get_hm());
    }

    void tearDown()
    {
        // -----------------------------------------------------------
        // Stop the managers & free resources
        // -----------------------------------------------------------

        hm->finalize();

        //sleep to wait drivers???
        pthread_join(hm->get_thread_id(),0);

        //XML Library
        xmlCleanupParser();

        delete_db();
        
        delete tester;

        // Clean up var dir.
        string command = "rm -r var";
        std::system(command.c_str());
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void allocate_hook()
    {
        string err;

        hpool->allocate(&oid, 
                        "host_test", 
                        "im_mad", 
                        "vmm_mad", 
                        "vnm_mad",
                        ClusterPool::NONE_CLUSTER_ID,
                        ClusterPool::NONE_CLUSTER_NAME,
                        err);

        CPPUNIT_ASSERT( oid >= 0 );

        sleep(1);

        ostringstream oss;
        oss << "ls ./var/hook_create_" << oid << " > /dev/null 2>&1";
        rc = std::system(oss.str().c_str());

        CPPUNIT_ASSERT( rc == 0 );
    }

/* -------------------------------------------------------------------------- */

    void monitoring_error()
    {
        string err;


        hpool->allocate(&oid, 
                        "host_test", 
                        "im_mad", 
                        "vmm_mad", 
                        "vnm_mad",
                        ClusterPool::NONE_CLUSTER_ID,
                        ClusterPool::NONE_CLUSTER_NAME,
                        err);
        CPPUNIT_ASSERT( oid >= 0 );

        host = hpool->get(oid, true);
        CPPUNIT_ASSERT( host != 0 );

        host->touch(false);
        hpool->update(host);

        host->unlock();

        sleep(1);

        ostringstream oss;
        oss << "ls ./var/hook_error_" << oid << " > /dev/null 2>&1";
        rc = std::system(oss.str().c_str());

        CPPUNIT_ASSERT( rc == 0 );
    }

/* -------------------------------------------------------------------------- */

    void error_imd()
    {
        string err;

        hpool->allocate(&oid, 
                        "host_test", 
                        "im_mad", 
                        "vmm_mad", 
                        "vnm_mad",
                        ClusterPool::NONE_CLUSTER_ID,
                        ClusterPool::NONE_CLUSTER_NAME,
                        err);
        CPPUNIT_ASSERT( oid >= 0 );

        host = hpool->get(oid, true);
        CPPUNIT_ASSERT( host != 0 );

        host->set_state(Host::ERROR);
        hpool->update(host);

        host->unlock();

        sleep(1);

        ostringstream oss;
        oss << "ls ./var/hook_error_" << oid << " > /dev/null 2>&1";
        rc = std::system(oss.str().c_str());

        CPPUNIT_ASSERT( rc == 0 );
    }

/* -------------------------------------------------------------------------- */

    void disable_hook()
    {
        string err;

        hpool->allocate(&oid, 
                        "host_test", 
                        "im_mad", 
                        "vmm_mad", 
                        "vnm_mad",
                        ClusterPool::NONE_CLUSTER_ID,
                        ClusterPool::NONE_CLUSTER_NAME,
                        err);

        CPPUNIT_ASSERT( oid >= 0 );

        host = hpool->get(oid, true);
        CPPUNIT_ASSERT( host != 0 );

        host->disable();
        hpool->update(host);

        host->unlock();

        sleep(1);

        ostringstream oss;
        oss << "ls ./var/hook_disable_" << oid << " > /dev/null 2>&1";
        rc = std::system(oss.str().c_str());

        CPPUNIT_ASSERT( rc == 0 );
    }

/* -------------------------------------------------------------------------- */
};


int main(int argc, char ** argv)
{
    OneUnitTest::set_one_auth();

    return OneUnitTest::main(argc, argv, HostHookTest::suite(),"host_hook.xml");
}
