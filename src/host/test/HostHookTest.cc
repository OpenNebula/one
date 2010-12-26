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
#include <fstream>

#include "HostPool.h"
#include "PoolTest.h"

using namespace std;

/* ************************************************************************* */
/* ************************************************************************* */

class HostHookTest : public PoolTest
{
    CPPUNIT_TEST_SUITE (HostHookTest);

    CPPUNIT_TEST (allocate_hook);
//    CPPUNIT_TEST (error_hook);
//    CPPUNIT_TEST (disable_hook);
    CPPUNIT_TEST_SUITE_END ();

protected:

    void bootstrap(SqlDB* db)
    {
        HostPool::bootstrap(db);
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        map<string,string> hook_value;
        VectorAttribute *  hook;

        vector<const Attribute *> host_hooks;

        hook_value.insert(make_pair("NAME","create_test"));
        hook_value.insert(make_pair("ON","ERROR"));
        hook_value.insert(make_pair("COMMAND","/bin/touch"));
        hook_value.insert(make_pair("ARGUMENTS","/tmp/host_$HID"));
        hook_value.insert(make_pair("REMOTE","no"));

        hook = new VectorAttribute("HOST_HOOK",hook_value);



        host_hooks.push_back(hook);

        return new HostPool(db,host_hooks,"./");
    };

    int allocate(int index){return 0;};
    void check(int index, PoolObjectSQL* obj){};

public:
    HostHookTest(){xmlInitParser();};

    ~HostHookTest(){xmlCleanupParser();};


    /* ********************************************************************* */
    /* ********************************************************************* */


    void allocate_hook()
    {
        HostPool * hp = static_cast<HostPool *>(pool);

        string err;
        int    oid;

        fstream fd;

        hp->allocate(&oid, "host_test", "im_mad", "vmm_mad", "tm_mad", err);

        Host* host = hp->get(oid, true);

        CPPUNIT_ASSERT( host != 0 );

        host->unlock();

        ostringstream oss;

        oss << "/tmp/host_" << oid ;

        fd.open(oss.str().c_str(), fstream::in | fstream::out );

        CPPUNIT_ASSERT( fd.fail() == false );

        fd.close();
    };

    /* ********************************************************************* */
};


/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return PoolTest::main(argc, argv, HostHookTest::suite());
}
