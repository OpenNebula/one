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
#include "VirtualMachinePoolXML.h"

/* ************************************************************************* */
/* ************************************************************************* */


class FriendVirtualMachinePool : public VirtualMachinePoolXML
{
public:
    FriendVirtualMachinePool(Client* client):VirtualMachinePoolXML(client){};
    friend class VirtualMachineXMLTest;

    static const string vm_dump;
    static const string xmls[];

protected:


    void add_object(xmlNodePtr node)
    {
        xmlNodePtr nodeID;
        nodeID = node->children->next;


        xmlChar * str_ptr = xmlNodeGetContent(nodeID);
        int vid;

        if (str_ptr != 0)
        {
            vid = atoi(reinterpret_cast<char *>(str_ptr));
            xmlFree(str_ptr);
        }
        else
        {
            // TODO WHAT DO?
        }

        VirtualMachineXML* vm = new VirtualMachineXML( xmls[vid] );
        objects.insert( pair<int,ObjectXML*>(vid, vm) );
    };

    int load_info(xmlrpc_c::value &result)
    {
        vector<xmlrpc_c::value> arrayData;
        arrayData.push_back(xmlrpc_c::value_boolean(true));
        arrayData.push_back(xmlrpc_c::value_string(vm_dump));

        // Make an XML-RPC array out of it
        xmlrpc_c::value_array array(arrayData);
        result = array;

        return 0;
    };
};


/* ************************************************************************* */
/* ************************************************************************* */

class VirtualMachineXMLTest : public CppUnit::TestFixture
{
    CPPUNIT_TEST_SUITE( VirtualMachineXMLTest );

    CPPUNIT_TEST( initialization );


    CPPUNIT_TEST( add_host );
    CPPUNIT_TEST( set_priorities );
    CPPUNIT_TEST( get_host );

    CPPUNIT_TEST_SUITE_END ();

private:
    static const string host_dump;

    FriendVirtualMachinePool * vmp;

public:

    VirtualMachineXMLTest(){};

    ~VirtualMachineXMLTest(){};

    void setUp()
    {
        xmlInitParser();

        try
        {
            vmp = new FriendVirtualMachinePool(NULL);
        }
        catch(runtime_error& re)
        {
             cerr << re.what() << endl;
        }
    };

    void tearDown()
    {
        xmlCleanupParser();

        if (vmp != 0)
        {
            delete vmp;
        }
    };

    /* ********************************************************************* */

    void initialization()
    {
        int rc;

        CPPUNIT_ASSERT( vmp != 0 );

        rc = vmp->set_up();
        CPPUNIT_ASSERT( rc == 0 );

        CPPUNIT_ASSERT( vmp->objects.size() == 3 );

        CPPUNIT_ASSERT( vmp->objects.count(0) == 1);
        CPPUNIT_ASSERT( vmp->objects.count(1) == 1);
        CPPUNIT_ASSERT( vmp->objects.count(2) == 1);
        CPPUNIT_ASSERT( vmp->objects.count(3) == 0);
    };

    void add_host()
    {
        int rc;
        VirtualMachineXML* vm;
        vector<int> mh;

        CPPUNIT_ASSERT( vmp != 0 );

        rc = vmp->set_up();
        CPPUNIT_ASSERT( rc == 0 );

        vm = ((VirtualMachineXML*)vmp->objects[0]);
        CPPUNIT_ASSERT( vm != 0 );


        vm->get_matching_hosts(mh);
        CPPUNIT_ASSERT( mh.size() == 0 );

        vm->add_host( 2 );
        vm->add_host( 9 );
        vm->add_host( 4 );

        mh.clear();
        vm->get_matching_hosts(mh);

        CPPUNIT_ASSERT( mh.size() == 3 );

        CPPUNIT_ASSERT( mh[0] == 2 );
        CPPUNIT_ASSERT( mh[1] == 9 );
        CPPUNIT_ASSERT( mh[2] == 4 );
    };

    void set_priorities()
    {
        // TODO
    };

    void get_host()
    {
        int rc;
        VirtualMachineXML* vm;


        CPPUNIT_ASSERT( vmp != 0 );

        rc = vmp->set_up();
        CPPUNIT_ASSERT( rc == 0 );

        // TODO jugar con las VM y Host y mirar que cada VM coje el Host
        // que debería según sus requirements.
    };



};

/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    CppUnit::TextUi::TestRunner runner;

    runner.addTest(VirtualMachineXMLTest::suite());
    runner.run();

    return 0;
}

// ----------------------------------------------------------------------------


const string FriendVirtualMachinePool::xmls[] =
{
"<VM>\
  <ID>0</ID>\
  <UID>123</UID>\
  <NAME>VM name</NAME>\
  <LAST_POLL>0</LAST_POLL>\
  <STATE>1</STATE>\
  <LCM_STATE>0</LCM_STATE>\
  <STIME>0000000000</STIME>\
  <ETIME>0</ETIME>\
  <DEPLOY_ID/>\
  <MEMORY>0</MEMORY>\
  <CPU>0</CPU>\
  <NET_TX>0</NET_TX>\
  <NET_RX>0</NET_RX>\
  <TEMPLATE>\
    <CPU>1</CPU>\
    <MEMORY>128</MEMORY>\
    <NAME>VM name</NAME>\
    <VMID>0</VMID>\
  </TEMPLATE>\
</VM>",

"<VM>\
  <ID>1</ID>\
  <UID>123</UID>\
  <NAME>VM name</NAME>\
  <LAST_POLL>0</LAST_POLL>\
  <STATE>1</STATE>\
  <LCM_STATE>0</LCM_STATE>\
  <STIME>0000000000</STIME>\
  <ETIME>0</ETIME>\
  <DEPLOY_ID/>\
  <MEMORY>0</MEMORY>\
  <CPU>0</CPU>\
  <NET_TX>0</NET_TX>\
  <NET_RX>0</NET_RX>\
  <TEMPLATE>\
    <CPU>1</CPU>\
    <MEMORY>128</MEMORY>\
    <NAME>VM name</NAME>\
    <VMID>1</VMID>\
  </TEMPLATE>\
</VM>",

"<VM>\
  <ID>2</ID>\
  <UID>123</UID>\
  <NAME>VM name</NAME>\
  <LAST_POLL>0</LAST_POLL>\
  <STATE>1</STATE>\
  <LCM_STATE>0</LCM_STATE>\
  <STIME>0000000000</STIME>\
  <ETIME>0</ETIME>\
  <DEPLOY_ID/>\
  <MEMORY>0</MEMORY>\
  <CPU>0</CPU>\
  <NET_TX>0</NET_TX>\
  <NET_RX>0</NET_RX>\
  <TEMPLATE>\
    <CPU>1</CPU>\
    <MEMORY>128</MEMORY>\
    <NAME>VM name</NAME>\
    <VMID>2</VMID>\
  </TEMPLATE>\
</VM>"

/*
    "<VM><ID>0</ID><UID>123</UID><NAME>VM one</NAME><LAST_POLL>0</LAST_POLL><ST"
    "ATE>1</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0</ET"
    "IME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX"
    "><NET_RX>0</NET_RX><TEMPLATE><CPU>1</CPU><MEMORY>128</MEMORY><NAME>VM one<"
    "/NAME><VMID>0</VMID></TEMPLATE></VM>",

    "<VM><ID>1</ID><UID>261</UID><NAME>Second VM</NAME><LAST_POLL>0</LAST_POLL>"
    "<STATE>1</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0<"
    "/ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET"
    "_TX><NET_RX>0</NET_RX><TEMPLATE><CPU>2</CPU><MEMORY>256</MEMORY><NAME>Seco"
    "nd VM</NAME><VMID>1</VMID></TEMPLATE></VM>",

    "<VM><ID>2</ID><UID>123</UID><NAME>VM one</NAME><LAST_POLL>0</LAST_POLL><ST"
    "ATE>1</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0</ET"
    "IME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX"
    "><NET_RX>0</NET_RX><TEMPLATE><CPU>1</CPU><MEMORY>1024</MEMORY><NAME>VM one"
    "</NAME><VMID>0</VMID></TEMPLATE></VM>"
*/
};

const string FriendVirtualMachinePool::vm_dump =
"<VM_POOL>"
"  <VM>"
"    <ID>0</ID>"
"    <UID>0</UID>"
"    <USERNAME>one_user_test</USERNAME>"
"    <NAME>VM one</NAME>"
"    <LAST_POLL>0</LAST_POLL>"
"    <STATE>1</STATE>"
"    <LCM_STATE>0</LCM_STATE>"
"    <STIME>0000000000</STIME>"
"    <ETIME>0</ETIME>"
"    <DEPLOY_ID/>"
"    <MEMORY>0</MEMORY>"
"    <CPU>0</CPU>"
"    <NET_TX>0</NET_TX>"
"    <NET_RX>0</NET_RX>"
"  </VM>"
"  <VM>"
"    <ID>1</ID>"
"    <UID>0</UID>"
"    <USERNAME>one_user_test</USERNAME>"
"    <NAME>Second VM</NAME>"
"    <LAST_POLL>0</LAST_POLL>"
"    <STATE>1</STATE>"
"    <LCM_STATE>0</LCM_STATE>"
"    <STIME>0000000000</STIME>"
"    <ETIME>0</ETIME>"
"    <DEPLOY_ID/>"
"    <MEMORY>0</MEMORY>"
"    <CPU>0</CPU>"
"    <NET_TX>0</NET_TX>"
"    <NET_RX>0</NET_RX>"
"    <HISTORY>"
"      <SEQ>0</SEQ>"
"      <HOSTNAME>A_hostname</HOSTNAME>"
"      <HID>0</HID>"
"      <STIME>0</STIME>"
"      <ETIME>0</ETIME>"
"      <PSTIME>0</PSTIME>"
"      <PETIME>0</PETIME>"
"      <RSTIME>0</RSTIME>"
"      <RETIME>0</RETIME>"
"      <ESTIME>0</ESTIME>"
"      <EETIME>0</EETIME>"
"      <REASON>0</REASON>"
"    </HISTORY>"
"  </VM>"
"  <VM>"
"    <ID>2</ID>"
"    <UID>0</UID>"
"    <USERNAME>one_user_test</USERNAME>"
"    <NAME>VM one</NAME>"
"    <LAST_POLL>0</LAST_POLL>"
"    <STATE>1</STATE>"
"    <LCM_STATE>0</LCM_STATE>"
"    <STIME>0000000000</STIME>"
"    <ETIME>0</ETIME>"
"    <DEPLOY_ID/>"
"    <MEMORY>0</MEMORY>"
"    <CPU>0</CPU>"
"    <NET_TX>0</NET_TX>"
"    <NET_RX>0</NET_RX>"
"    <HISTORY>"
"      <SEQ>1</SEQ>"
"      <HOSTNAME>C_hostname</HOSTNAME>"
"      <HID>2</HID>"
"      <STIME>0</STIME>"
"      <ETIME>0</ETIME>"
"      <PSTIME>0</PSTIME>"
"      <PETIME>0</PETIME>"
"      <RSTIME>0</RSTIME>"
"      <RETIME>0</RETIME>"
"      <ESTIME>0</ESTIME>"
"      <EETIME>0</EETIME>"
"      <REASON>0</REASON>"
"    </HISTORY>"
"  </VM>"
"  <VM>"
"    <ID>3</ID>"
"    <UID>0</UID>"
"    <USERNAME>one_user_test</USERNAME>"
"    <NAME>VM three</NAME>"
"    <LAST_POLL>0</LAST_POLL>"
"    <STATE>2</STATE>"
"    <LCM_STATE>0</LCM_STATE>"
"    <STIME>0000000000</STIME>"
"    <ETIME>0</ETIME>"
"    <DEPLOY_ID/>"
"    <MEMORY>0</MEMORY>"
"    <CPU>0</CPU>"
"    <NET_TX>0</NET_TX>"
"    <NET_RX>0</NET_RX>"
"    <HISTORY>"
"      <SEQ>1</SEQ>"
"      <HOSTNAME>C_hostname</HOSTNAME>"
"      <HID>2</HID>"
"      <STIME>0</STIME>"
"      <ETIME>0</ETIME>"
"      <PSTIME>0</PSTIME>"
"      <PETIME>0</PETIME>"
"      <RSTIME>0</RSTIME>"
"      <RETIME>0</RETIME>"
"      <ESTIME>0</ESTIME>"
"      <EETIME>0</EETIME>"
"      <REASON>0</REASON>"
"    </HISTORY>"
"  </VM>"
"</VM_POOL>";

const string VirtualMachineXMLTest::host_dump =
"<HOST_POOL>"

"  <HOST>"
"    <ID>9</ID>"
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

"  <HOST>"
"    <ID>13</ID>"
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

"  <HOST>"
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
