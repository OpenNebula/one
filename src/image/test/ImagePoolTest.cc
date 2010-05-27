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

#include "ImagePool.h"
#include "PoolTest.h"

using namespace std;

const int uids[] = {123, 261, 123};

const string names[] = {"VM one", "Second VM", "VM one"};

    // TODO change templates
const string templates[] =
{
    "NAME   = \"VM one\"\n"
    "MEMORY = 128\n"
    "CPU    = 1",

    "NAME   = \"Second VM\"\n"
    "MEMORY = 256\n"
    "CPU    = 2",

    "NAME   = \"VM one\"\n"
    "MEMORY = 1024\n"
    "CPU    = 1"
};

    // TODO change xmls
const string xmls[] =
{
    "<VM><ID>0</ID><UID>123</UID><NAME>VM one</NAME><LAST_POLL>0</LAST_POLL><ST"
    "ATE>1</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0</ET"
    "IME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX"
    "><NET_RX>0</NET_RX><TEMPLATE><CPU><![CDATA[1]]></CPU><MEMORY><![CDATA[128]"
    "]></MEMORY><NAME><![CDATA[VM one]]></NAME><VMID><![CDATA[0]]></VMID>"
    "</TEMPLATE></VM>",

    "<VM><ID>1</ID><UID>261</UID><NAME>Second VM</NAME><LAST_POLL>0</LAST_POLL>"
    "<STATE>1</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0<"
    "/ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET"
    "_TX><NET_RX>0</NET_RX><TEMPLATE><CPU><![CDATA[2]]></CPU><MEMORY>"
    "<![CDATA[256]]></MEMORY><NAME><![CDATA[Second VM]]></NAME><VMID>"
    "<![CDATA[1]]></VMID></TEMPLATE></VM>",

    "<VM><ID>0</ID><UID>123</UID><NAME>VM one</NAME><LAST_POLL>0</LAST_POLL><ST"
    "ATE>1</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0</ET"
    "IME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX"
    "><NET_RX>0</NET_RX><TEMPLATE><CPU>1</CPU><MEMORY>1024</MEMORY><NAME>VM one"
    "</NAME><VMID>0</VMID></TEMPLATE></VM>"
};

/*
// This xml dump result has the STIMEs modified to 0000000000
const string xml_dump =
    "<VM_POOL><VM><ID>0</ID><UID>1</UID><USERNAME>A user</USERNAME><NAME>VM one"
    "</NAME><LAST_POLL>0</LAST_POLL><STATE>1</STATE><LCM_STATE>0</LCM_STATE><ST"
    "IME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</ME"
    "MORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX></VM><VM><ID>1</ID><U"
    "ID>2</UID><USERNAME>B user</USERNAME><NAME>Second VM</NAME><LAST_POLL>0</L"
    "AST_POLL><STATE>2</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME>"
    "<ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_"
    "TX>0</NET_TX><NET_RX>0</NET_RX></VM></VM_POOL>";

const string xml_dump_where =
    "<VM_POOL><VM><ID>0</ID><UID>1</UID><USERNAME>A user</USERNAME><NAME>VM one"
    "</NAME><LAST_POLL>0</LAST_POLL><STATE>1</STATE><LCM_STATE>0</LCM_STATE><ST"
    "IME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</ME"
    "MORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX></VM></VM_POOL>";


//*/

/* ************************************************************************* */
/* ************************************************************************* */

class ImagePoolTest : public PoolTest
{
    CPPUNIT_TEST_SUITE (ImagePoolTest);

    ALL_POOLTEST_CPPUNIT_TESTS();

    CPPUNIT_TEST_SUITE_END ();

protected:

    void bootstrap(SqlDB* db)
    {
        ImagePool::bootstrap(db);
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        return new ImagePool(db, "source_prefix", "OS", "IDE");
    };

    int allocate(int index)
    {
        int oid;
        return ((ImagePool*)pool)->allocate(uids[index],
                                            templates[index],
                                            false);
    };

    void check(int index, PoolObjectSQL* obj)
    {
        CPPUNIT_ASSERT( obj != 0 );

        string xml_str = "";

        // Get the xml and replace the STIME to 0, so we can compare it
        ((Image*)obj)->to_xml(xml_str);

        CPPUNIT_ASSERT( ((Image*)obj)->get_name() == names[index] );
        CPPUNIT_ASSERT( xml_str == xmls[index]);
    };

public:
    ImagePoolTest(){};

    ~ImagePoolTest(){};


    /* ********************************************************************* */
    /* ********************************************************************* */

};

/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return PoolTest::main(argc, argv, ImagePoolTest::suite());
}
