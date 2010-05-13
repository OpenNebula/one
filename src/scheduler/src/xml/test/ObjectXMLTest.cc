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
#include <stdexcept>


#include <TestFixture.h>
#include <TestAssert.h>
#include <TestSuite.h>
#include <TestCaller.h>
#include <ui/text/TestRunner.h>
#include <cppunit/extensions/HelperMacros.h>
#include <unistd.h>

#include "ObjectXML.h"

/* ************************************************************************* */
/* ************************************************************************* */

class ObjectXMLTest : public CppUnit::TestFixture
{
    CPPUNIT_TEST_SUITE( ObjectXMLTest );

    CPPUNIT_TEST( xpath_access );
    CPPUNIT_TEST( node_constructor );
    CPPUNIT_TEST( doc_update );

    CPPUNIT_TEST_SUITE_END ();

public:
    void setUp()
    {
        xmlInitParser();
    };

    void tearDown()
    {
        xmlCleanupParser();
    };

    ObjectXMLTest(){};

    ~ObjectXMLTest(){};

    /* ********************************************************************* */
    /* ********************************************************************* */

    void xpath_access()
    {
        try
        {
            ObjectXML obj(xml_history_dump);
            vector<string> hostnames;

            hostnames = obj["/VM_POOL/VM/HISTORY/HOSTNAME"];

            CPPUNIT_ASSERT(hostnames.size() == 2);
            CPPUNIT_ASSERT(hostnames[0] == "A_hostname");
            CPPUNIT_ASSERT(hostnames[1] == "C_hostname");
        }
        catch(runtime_error& re)
        {
             cerr << re.what() << endl;
             CPPUNIT_ASSERT(1 == 0);
        }
    };


    void node_constructor()
    {
        try
        {
            ObjectXML obj(xml_history_dump);
            vector<xmlNodePtr> vms;
            int                num_vms;

            num_vms = obj.get_nodes("/VM_POOL/VM",vms);

            CPPUNIT_ASSERT(num_vms == 3);

            ObjectXML obj_vm_1(vms[0]);
            ObjectXML obj_vm_2(vms[1]);

            vector<string> results;

            results = obj_vm_1["/VM/HISTORY/HOSTNAME"];

            CPPUNIT_ASSERT(results.size() == 0);

            results.clear();

            results = obj_vm_2["/VM/HISTORY/HOSTNAME"];

            CPPUNIT_ASSERT(results.size() == 1);
            CPPUNIT_ASSERT(results[0] == "A_hostname");

        }
        catch(runtime_error& re)
        {
             cerr << re.what() << endl;
             CPPUNIT_ASSERT(1 == 0);
        }
    };

    void doc_update()
    {
        try
        {
            ObjectXML obj(xml_history_dump);
            vector<string> hostnames;

            hostnames = obj["/VM_POOL/VM/HISTORY/HOSTNAME"];

            CPPUNIT_ASSERT(hostnames.size() == 2);
            CPPUNIT_ASSERT(hostnames[0] == "A_hostname");
            CPPUNIT_ASSERT(hostnames[1] == "C_hostname");

            obj.update(xml_history_dump2);

            hostnames = obj["/VM_POOL/VM/HISTORY/HOSTNAME"];

            CPPUNIT_ASSERT(hostnames.size() == 2);
            CPPUNIT_ASSERT(hostnames[0] == "0_hostname");
            CPPUNIT_ASSERT(hostnames[1] == "1_hostname");
        }
        catch(runtime_error& re)
        {
             cerr << re.what() << endl;
             CPPUNIT_ASSERT(1 == 0);
        }
    };

    static const string xml_history_dump;
    static const string xml_history_dump2;
};

/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    CppUnit::TextUi::TestRunner runner;

    runner.addTest(ObjectXMLTest::suite());
    runner.run();

    return 0;
}

// ----------------------------------------------------------------------------
const string ObjectXMLTest::xml_history_dump =
    "<VM_POOL><VM><ID>0</ID><UID>0</UID><USERNAME>one_user_test</USERNAME>"
    "<NAME>VM one</NAME><LAST_POLL>0</LAST_POLL><STATE>1</STATE><LCM_STATE>"
    "0</LCM_STATE><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID>"
    "</DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>"
    "0</NET_RX></VM><VM><ID>1</ID><UID>0</UID><USERNAME>"
    "one_user_test</USERNAME><NAME>Second VM</NAME><LAST_POLL>0</LAST_POLL>"
    "<STATE>2</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME>"
    "<ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU>"
    "<NET_TX>0</NET_TX><NET_RX>0</NET_RX><HISTORY><SEQ>0</SEQ><HOSTNAME>"
    "A_hostname</HOSTNAME><HID>0</HID><STIME>0</STIME><ETIME>0</ETIME><PSTIME>"
    "0</PSTIME><PETIME>0</PETIME><RSTIME>0</RSTIME><RETIME>0</RETIME><ESTIME>"
    "0</ESTIME><EETIME>0</EETIME><REASON>0</REASON></HISTORY></VM><VM><ID>2"
    "</ID><UID>0</UID><USERNAME>one_user_test</USERNAME><NAME>VM one</NAME>"
    "<LAST_POLL>0</LAST_POLL><STATE>2</STATE><LCM_STATE>0</LCM_STATE><STIME>"
    "0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0"
    "</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><HISTORY><SEQ>1"
    "</SEQ><HOSTNAME>C_hostname</HOSTNAME><HID>2</HID><STIME>0</STIME><ETIME>0"
    "</ETIME><PSTIME>0</PSTIME><PETIME>0</PETIME><RSTIME>0</RSTIME><RETIME>0"
    "</RETIME><ESTIME>0</ESTIME><EETIME>0</EETIME><REASON>0</REASON></HISTORY>"
    "</VM></VM_POOL>";

const string ObjectXMLTest::xml_history_dump2 =
    "<VM_POOL><VM><ID>0</ID><UID>0</UID><USERNAME>one_user_test</USERNAME>"
    "<NAME>VM one</NAME><LAST_POLL>0</LAST_POLL><STATE>1</STATE><LCM_STATE>"
    "0</LCM_STATE><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID>"
    "</DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>"
    "0</NET_RX></VM><VM><ID>1</ID><UID>0</UID><USERNAME>"
    "one_user_test</USERNAME><NAME>Second VM</NAME><LAST_POLL>0</LAST_POLL>"
    "<STATE>2</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME>"
    "<ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU>"
    "<NET_TX>0</NET_TX><NET_RX>0</NET_RX><HISTORY><SEQ>0</SEQ><HOSTNAME>"
    "0_hostname</HOSTNAME><HID>0</HID><STIME>0</STIME><ETIME>0</ETIME><PSTIME>"
    "0</PSTIME><PETIME>0</PETIME><RSTIME>0</RSTIME><RETIME>0</RETIME><ESTIME>"
    "0</ESTIME><EETIME>0</EETIME><REASON>0</REASON></HISTORY></VM><VM><ID>2"
    "</ID><UID>0</UID><USERNAME>one_user_test</USERNAME><NAME>VM one</NAME>"
    "<LAST_POLL>0</LAST_POLL><STATE>2</STATE><LCM_STATE>0</LCM_STATE><STIME>"
    "0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0"
    "</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><HISTORY><SEQ>1"
    "</SEQ><HOSTNAME>1_hostname</HOSTNAME><HID>2</HID><STIME>0</STIME><ETIME>0"
    "</ETIME><PSTIME>0</PSTIME><PETIME>0</PETIME><RSTIME>0</RSTIME><RETIME>0"
    "</RETIME><ESTIME>0</ESTIME><EETIME>0</EETIME><REASON>0</REASON></HISTORY>"
    "</VM></VM_POOL>";