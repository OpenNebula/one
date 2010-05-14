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
#include "HostPoolXML.h"

/* ************************************************************************* */
/* ************************************************************************* */

class FriendHostPool : public HostPoolXML
{
public:
    FriendHostPool(Client* client):HostPoolXML(client){};

    friend class HostXMLTest;

    static const string host_dump;

protected:
    int load_info(xmlrpc_c::value &result)
    {
        vector<xmlrpc_c::value> arrayData;
        arrayData.push_back(xmlrpc_c::value_boolean(true));
        arrayData.push_back(xmlrpc_c::value_string(host_dump));

        // Make an XML-RPC array out of it
        xmlrpc_c::value_array array(arrayData);
        result = array;

        return 0;
    };
};


/* ************************************************************************* */
/* ************************************************************************* */

class HostXMLTest : public CppUnit::TestFixture
{
    CPPUNIT_TEST_SUITE( HostXMLTest );

    CPPUNIT_TEST( initialization );
    CPPUNIT_TEST( get_capacity );
    CPPUNIT_TEST( test_capacity );
    CPPUNIT_TEST( add_capacity );

    CPPUNIT_TEST_SUITE_END ();

private:
    FriendHostPool * hp;

public:
    void setUp()
    {
        xmlInitParser();

        try
        {
            hp = new FriendHostPool(NULL);
        }
        catch(runtime_error& re)
        {
             cerr << re.what() << endl;
        }
    };

    void tearDown()
    {
        xmlCleanupParser();

        if (hp != 0)
        {
            delete hp;
        }
    };

    HostXMLTest(){};

    ~HostXMLTest(){};

    /* ********************************************************************* */

    void initialization()
    {
        int rc;


        CPPUNIT_ASSERT( hp != 0 );

        rc = hp->set_up();
        CPPUNIT_ASSERT( rc == 0 );

        CPPUNIT_ASSERT( hp->objects.size() == 4 );
        CPPUNIT_ASSERT( hp->objects.count(0) == 1);
        CPPUNIT_ASSERT( hp->objects.count(1) == 1);
        CPPUNIT_ASSERT( hp->objects.count(2) == 0);
        CPPUNIT_ASSERT( hp->objects.count(3) == 1);
        CPPUNIT_ASSERT( hp->objects.count(4) == 1);
    };

    void get_capacity()
    {
        int rc;


        CPPUNIT_ASSERT( hp != 0 );

        rc = hp->set_up();
        CPPUNIT_ASSERT( rc == 0 );

        CPPUNIT_ASSERT( hp->objects.size() == 4 );

        // TODO QUÉ ES THRESHOLD?
        int cpu, mem, threshold;
        threshold = 100;

        HostXML* host = (HostXML*) hp->objects[4];
        CPPUNIT_ASSERT(host != 0);

        host->get_capacity(cpu, mem, threshold);

        CPPUNIT_ASSERT(mem == 384);
        CPPUNIT_ASSERT(cpu == 180);
    };

    void test_capacity()
    {
        int rc;


        CPPUNIT_ASSERT( hp != 0 );

        rc = hp->set_up();
        CPPUNIT_ASSERT( rc == 0 );

        CPPUNIT_ASSERT( hp->objects.size() == 4 );

        HostXML* host = (HostXML*) hp->objects[4];
        CPPUNIT_ASSERT(host != 0);

        /*
        <DISK_USAGE>256</DISK_USAGE>"
        <MEM_USAGE>128</MEM_USAGE>"
        <CPU_USAGE>20</CPU_USAGE>"
        <MAX_DISK>512</MAX_DISK>"
        <MAX_MEM>512</MAX_MEM>"
        <MAX_CPU>200</MAX_CPU>"

        <FREE_DISK>256</FREE_DISK>"
        <FREE_MEM>384</FREE_MEM>"
        <FREE_CPU>180</FREE_CPU>"
        */

        int n_test = 4;

        int disk[] = {256, 260, 0, 100};
        int mem[]  = {384, 384, 0, 100};
        int cpu[]  = {180, 180, 0, 200};
        bool result[] = {true, false, true, false};

        for(int i = 0; i < n_test; i++)
        {
            bool test = host->test_capacity(cpu[i], mem[i], disk[i]);
            CPPUNIT_ASSERT(test == result[i]);
        }

    };

    void add_capacity()
    {
        int rc;


        CPPUNIT_ASSERT( hp != 0 );

        rc = hp->set_up();
        CPPUNIT_ASSERT( rc == 0 );

        CPPUNIT_ASSERT( hp->objects.size() == 4 );

        HostXML* host = (HostXML*) hp->objects[4];
        CPPUNIT_ASSERT(host != 0);

        // add cpu, mem, disk
        host->add_capacity(100, 128, 128);


        int n_test = 2;

        int disk[] = {256, 128};
        int mem[]  = {384, 256};
        int cpu[]  = {180, 80};
        bool result[] = {false, true};

        for(int i = 0; i < n_test; i++)
        {
            bool test = host->test_capacity(cpu[i], mem[i], disk[i]);
            CPPUNIT_ASSERT(test == result[i]);
        }
    };
};

/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    CppUnit::TextUi::TestRunner runner;

    runner.addTest(HostXMLTest::suite());
    runner.run();

    return 0;
}

// ----------------------------------------------------------------------------

const string FriendHostPool::host_dump =
    "<HOST_POOL><HOST><ID>0</ID><NAME>a</NAME><STATE>0</STATE><IM_MAD>im_mad</I"
    "M_MAD><VM_MAD>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>000000"
    "0000</LAST_MON_TIME><HOST_SHARE><HID>0</HID><DISK_USAGE>0</DISK_USAGE><MEM"
    "_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM"
    ">0</MAX_MEM><MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_"
    "MEM><FREE_CPU>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><U"
    "SED_CPU>0</USED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST>"
    "<ID>1</ID><NAME>a name</NAME><STATE>1</STATE><IM_MAD>im_mad</IM_MAD><VM_MA"
    "D>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0000000000</LAST_M"
    "ON_TIME><HOST_SHARE><HID>1</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</ME"
    "M_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM>"
    "<MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CP"
    "U>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</U"
    "SED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST><ID>2</ID><N"
    "AME>a_name</NAME><STATE>3</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</V"
    "M_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0000000000</LAST_MON_TIME><HOS"
    "T_SHARE><HID>2</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU"
    "_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</"
    "MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CP"
    "U><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUN"
    "NING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST><ID>3</ID><NAME>another "
    "name</NAME><STATE>2</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD>"
    "<TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0000000000</LAST_MON_TIME><HOST_SHAR"
    "E><HID>3</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE"
    ">0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CP"
    "U><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU><USE"
    "D_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUNNING_V"
    "MS>0</RUNNING_VMS></HOST_SHARE></HOST>"
  "<HOST>"
"    <ID>4</ID>"
"    <NAME>host</NAME>"
"    <STATE>0</STATE>"
"    <IM_MAD>im_mad</IM_MAD>"
"    <VM_MAD>vmm_mad</VM_MAD>"
"    <TM_MAD>tm_mad</TM_MAD>"
"    <LAST_MON_TIME>0000000000</LAST_MON_TIME>"
"    <HOST_SHARE>"
"      <HID>4</HID>"
"      <DISK_USAGE>256</DISK_USAGE>"
"      <MEM_USAGE>128</MEM_USAGE>"
"      <CPU_USAGE>20</CPU_USAGE>"
"      <MAX_DISK>512</MAX_DISK>"
"      <MAX_MEM>512</MAX_MEM>"
"      <MAX_CPU>200</MAX_CPU>"
"      <FREE_DISK>256</FREE_DISK>"
"      <FREE_MEM>384</FREE_MEM>"
"      <FREE_CPU>180</FREE_CPU>"
"      <USED_DISK>256</USED_DISK>"
"      <USED_MEM>128</USED_MEM>"
"      <USED_CPU>20</USED_CPU>"
"      <RUNNING_VMS>0</RUNNING_VMS>"
"    </HOST_SHARE>"
"  </HOST>"
"</HOST_POOL>";
