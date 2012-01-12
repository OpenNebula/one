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
#include <stdexcept>

#include "ObjectXML.h"
#include "VirtualMachinePoolXML.h"
#include "HostPoolXML.h"

#include "test/OneUnitTest.h"

/* ************************************************************************* */
/* ************************************************************************* */

class FriendHostPool : public HostPoolXML
{
public:
    FriendHostPool(Client* client):HostPoolXML(client){};

    friend class HostXMLTest;

    static const string host_dump;
    static const string xmls[];

protected:

    void add_object(xmlNodePtr node)
    {
        xmlChar * str_ptr = xmlNodeGetContent(node->children->next);

        int hid;

        if (str_ptr != 0)
        {
            hid = atoi(reinterpret_cast<char *>(str_ptr));
            xmlFree(str_ptr);
        }
        else
        {

        }

        HostXML* vm = new HostXML( xmls[hid] );
        objects.insert( pair<int,ObjectXML*>(hid, vm) );
    };

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

class FriendVirtualMachinePool : public VirtualMachinePoolXML
{
public:
    FriendVirtualMachinePool
                (
                    Client* client,
                    unsigned int m_limit = 0
                 ):VirtualMachinePoolXML(client, m_limit){};

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
            // TODO
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

class VirtualMachineXMLTest : public OneUnitTest
{
    CPPUNIT_TEST_SUITE( VirtualMachineXMLTest );

    CPPUNIT_TEST( initialization );
    CPPUNIT_TEST( add_host );
    CPPUNIT_TEST( get_host );

    CPPUNIT_TEST_SUITE_END ();

private:
    static const string host_dump;

    FriendVirtualMachinePool * vmp;

    FriendHostPool* set_up_hpool()
    {
        FriendHostPool* hpool;

        hpool = new FriendHostPool(NULL);
        hpool->set_up();

        return hpool;
    };

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


    void get_host()
    {
        VirtualMachineXML*  vm;
        HostPoolXML*        hpool;
        vector<float>       priorities;
        int                 hid;
        int                 rc;
        map<int, int>  host_vms;

        CPPUNIT_ASSERT( vmp != 0 );

        rc = vmp->set_up();
        CPPUNIT_ASSERT( rc == 0 );

        hpool = set_up_hpool();
        CPPUNIT_ASSERT( hpool != 0 );


        vm = vmp->get(0);
        CPPUNIT_ASSERT( vm != 0 );

        rc = vm->get_host(hid, hpool,host_vms,1);
        CPPUNIT_ASSERT( rc == -1 );

        // get_host will iterate in reverse order the available hosts, and
        // return the first to fit the requirements; in this case
        // cpu: 50   mem: 128
        vm->add_host( 5 );
        vm->add_host( 4 );
        vm->add_host( 2 );
        vm->add_host( 1 );

        rc = vm->get_host(hid, hpool,host_vms,1);

        CPPUNIT_ASSERT( rc  == 0 );
        CPPUNIT_ASSERT( hid == 4 );

        // If we set host 5 to have the greatest priority, get_host should
        // return it.

        priorities.push_back(1.0); // hid 5
        priorities.push_back(0.8); // hid 4
        priorities.push_back(0.5); // hid 2
        priorities.push_back(0.3); // hid 1

        vm->set_priorities(priorities);

        rc = vm->get_host(hid, hpool,host_vms,1);

        CPPUNIT_ASSERT( rc  == 0 );
        CPPUNIT_ASSERT( hid == 5 );

        delete hpool;
    };



};

/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return OneUnitTest::main(argc, argv, VirtualMachineXMLTest::suite(),
                            "VirtualMachineXMLTest.xml");
}

// ----------------------------------------------------------------------------


const string FriendVirtualMachinePool::xmls[] =
{
" <VM> <ID> 0 </ID> <UID> 0 </UID> <GID>2</GID> <NAME> vm-example </NAME> <LAST_POLL> 0 </LAST_POLL> <STATE> 1 </STATE> <LCM_STATE> 0 </LCM_STATE> <STIME> 1274087556 </STIME> <ETIME> 1274087589 </ETIME> <DEPLOY_ID/> <MEMORY> 0 </MEMORY> <CPU> 0 </CPU> <NET_TX> 0 </NET_TX> <NET_RX> 0 </NET_RX> <TEMPLATE> <CONTEXT> <HOSTNAME> vm-example </HOSTNAME> <IP_GEN> 10.0.0. </IP_GEN> <IP_PRIVATE> 10.0.0.1 </IP_PRIVATE> </CONTEXT> <CPU> 0.5 </CPU> <DISK> <READONLY> no </READONLY> <SOURCE> /local/xen/domains/etch/disk.img </SOURCE> <TARGET> sda1 </TARGET> </DISK> <DISK> <READONLY> no </READONLY> <SOURCE> /local/xen/domains/etch/swap.img </SOURCE> <TARGET> sda2 </TARGET> </DISK> <GRAPHICS> <LISTEN> 127.0.0.1 </LISTEN> <PORT> 5 </PORT> <TYPE> vnc </TYPE> </GRAPHICS> <MEMORY> 128 </MEMORY> <NAME> vm-example </NAME> <NIC> <BRIDGE> eth0 </BRIDGE> <IP> 10.0.0.1 </IP> <MAC> 00:03:0a:00:00:01 </MAC> <NETWORK> Private LAN </NETWORK> <VNID> 0 </VNID> </NIC> <OS> <INITRD> /initrd.img </INITRD> <KERNEL> /vmlinuz </KERNEL> <ROOT> sda1 </ROOT> </OS> <VMID> 0 </VMID> </TEMPLATE> <HISTORY> <SEQ> 0 </SEQ> <HOSTNAME> host16 </HOSTNAME> <HID> 15 </HID> <STIME> 1274087589 </STIME> <ETIME> 1274087589 </ETIME> <PSTIME> 1274087589 </PSTIME> <PETIME> 1274087589 </PETIME> <RSTIME> 0 </RSTIME> <RETIME> 0 </RETIME> <ESTIME> 0 </ESTIME> <EETIME> 0 </EETIME> <REASON> 1 </REASON> </HISTORY> </VM> ",

"<VM> <ID> 1 </ID> <UID> 0 </UID> <GID>2</GID> <NAME> vm-example </NAME> <LAST_POLL> 0 </LAST_POLL> <STATE> 1 </STATE> <LCM_STATE> 0 </LCM_STATE> <STIME> 1274087557 </STIME> <ETIME> 1274087590 </ETIME> <DEPLOY_ID/> <MEMORY> 0 </MEMORY> <CPU> 0 </CPU> <NET_TX> 0 </NET_TX> <NET_RX> 0 </NET_RX> <TEMPLATE> <CONTEXT> <HOSTNAME> vm-example </HOSTNAME> <IP_GEN> 10.0.0. </IP_GEN> <IP_PRIVATE> 10.0.0.2 </IP_PRIVATE> </CONTEXT> <CPU> 0.5 </CPU> <DISK> <READONLY> no </READONLY> <SOURCE> /local/xen/domains/etch/disk.img </SOURCE> <TARGET> sda1 </TARGET> </DISK> <DISK> <READONLY> no </READONLY> <SOURCE> /local/xen/domains/etch/swap.img </SOURCE> <TARGET> sda2 </TARGET> </DISK> <GRAPHICS> <LISTEN> 127.0.0.1 </LISTEN> <PORT> 5 </PORT> <TYPE> vnc </TYPE> </GRAPHICS> <MEMORY> 128 </MEMORY> <NAME> vm-example </NAME> <NIC> <BRIDGE> eth0 </BRIDGE> <IP> 10.0.0.2 </IP> <MAC> 00:03:0a:00:00:02 </MAC> <NETWORK> Private LAN </NETWORK> <VNID> 0 </VNID> </NIC> <OS> <INITRD> /initrd.img </INITRD> <KERNEL> /vmlinuz </KERNEL> <ROOT> sda1 </ROOT> </OS> <VMID> 1 </VMID> </TEMPLATE> <HISTORY> <SEQ> 0 </SEQ> <HOSTNAME> host16 </HOSTNAME> <HID> 15 </HID> <STIME> 1274087589 </STIME> <ETIME> 1274087589 </ETIME> <PSTIME> 1274087589 </PSTIME> <PETIME> 1274087589 </PETIME> <RSTIME> 0 </RSTIME> <RETIME> 0 </RETIME> <ESTIME> 0 </ESTIME> <EETIME> 0 </EETIME> <REASON> 1 </REASON> </HISTORY> </VM> ",

"<VM> <ID> 2 </ID> <UID> 0 </UID> <GID> 1 </GID> <NAME> vm-example </NAME> <LAST_POLL> 0 </LAST_POLL> <STATE> 1 </STATE> <LCM_STATE> 0 </LCM_STATE> <STIME> 1274087557 </STIME> <ETIME> 1274087590 </ETIME> <DEPLOY_ID/> <MEMORY> 0 </MEMORY> <CPU> 0 </CPU> <NET_TX> 0 </NET_TX> <NET_RX> 0 </NET_RX> <TEMPLATE> <CONTEXT> <HOSTNAME> vm-example </HOSTNAME> <IP_GEN> 10.0.0. </IP_GEN> <IP_PRIVATE> 10.0.0.3 </IP_PRIVATE> </CONTEXT> <CPU> 0.5 </CPU> <DISK> <READONLY> no </READONLY> <SOURCE> /local/xen/domains/etch/disk.img </SOURCE> <TARGET> sda1 </TARGET> </DISK> <DISK> <READONLY> no </READONLY> <SOURCE> /local/xen/domains/etch/swap.img </SOURCE> <TARGET> sda2 </TARGET> </DISK> <GRAPHICS> <LISTEN> 127.0.0.1 </LISTEN> <PORT> 5 </PORT> <TYPE> vnc </TYPE> </GRAPHICS> <MEMORY> 128 </MEMORY> <NAME> vm-example </NAME> <NIC> <BRIDGE> eth0 </BRIDGE> <IP> 10.0.0.3 </IP> <MAC> 00:03:0a:00:00:03 </MAC> <NETWORK> Private LAN </NETWORK> <VNID> 0 </VNID> </NIC> <OS> <INITRD> /initrd.img </INITRD> <KERNEL> /vmlinuz </KERNEL> <ROOT> sda1 </ROOT> </OS> <VMID> 2 </VMID> </TEMPLATE> <HISTORY> <SEQ> 0 </SEQ> <HOSTNAME> host16 </HOSTNAME> <HID> 15 </HID> <STIME> 1274087589 </STIME> <ETIME> 1274087590 </ETIME> <PSTIME> 1274087589 </PSTIME> <PETIME> 1274087590 </PETIME> <RSTIME> 0 </RSTIME> <RETIME> 0 </RETIME> <ESTIME> 0 </ESTIME> <EETIME> 0 </EETIME> <REASON> 1 </REASON> </HISTORY> </VM> "
};

const string FriendVirtualMachinePool::vm_dump =
"<VM_POOL> <VM> <ID> 0 </ID> <UID> 0 </UID> <GID> 0 </GID> <USERNAME> carlos </USERNAME> <NAME> vm-example </NAME> <LAST_POLL> 0 </LAST_POLL> <STATE> 1 </STATE> <LCM_STATE> 0 </LCM_STATE> <STIME> 1274087556 </STIME> <ETIME> 1274087589 </ETIME> <DEPLOY_ID/> <MEMORY> 0 </MEMORY> <CPU> 0 </CPU> <NET_TX> 0 </NET_TX> <NET_RX> 0 </NET_RX> <HISTORY> <SEQ> 0 </SEQ> <HOSTNAME> host16 </HOSTNAME> <HID> 15 </HID> <STIME> 1274087589 </STIME> <ETIME> 1274087589 </ETIME> <PSTIME> 1274087589 </PSTIME> <PETIME> 1274087589 </PETIME> <RSTIME> 0 </RSTIME> <RETIME> 0 </RETIME> <ESTIME> 0 </ESTIME> <EETIME> 0 </EETIME> <REASON> 1 </REASON> </HISTORY> </VM> <VM> <ID> 1 </ID> <UID> 0 </UID> <GID> 0 </GID> <USERNAME> carlos </USERNAME> <NAME> vm-example </NAME> <LAST_POLL> 0 </LAST_POLL> <STATE> 1 </STATE> <LCM_STATE> 0 </LCM_STATE> <STIME> 1274087557 </STIME> <ETIME> 1274087590 </ETIME> <DEPLOY_ID/> <MEMORY> 0 </MEMORY> <CPU> 0 </CPU> <NET_TX> 0 </NET_TX> <NET_RX> 0 </NET_RX> <HISTORY> <SEQ> 0 </SEQ> <HOSTNAME> host16 </HOSTNAME> <HID> 15 </HID> <STIME> 1274087589 </STIME> <ETIME> 1274087589 </ETIME> <PSTIME> 1274087589 </PSTIME> <PETIME> 1274087589 </PETIME> <RSTIME> 0 </RSTIME> <RETIME> 0 </RETIME> <ESTIME> 0 </ESTIME> <EETIME> 0 </EETIME> <REASON> 1 </REASON> </HISTORY> </VM> <VM> <ID> 2 </ID> <UID> 0 </UID> <GID> 1 </GID> <USERNAME> carlos </USERNAME> <NAME> vm-example </NAME> <LAST_POLL> 0 </LAST_POLL> <STATE> 1 </STATE> <LCM_STATE> 0 </LCM_STATE> <STIME> 1274087557 </STIME> <ETIME> 1274087590 </ETIME> <DEPLOY_ID/> <MEMORY> 0 </MEMORY> <CPU> 0 </CPU> <NET_TX> 0 </NET_TX> <NET_RX> 0 </NET_RX> <HISTORY> <SEQ> 0 </SEQ> <HOSTNAME> host16 </HOSTNAME> <HID> 15 </HID> <STIME> 1274087589 </STIME> <ETIME> 1274087590 </ETIME> <PSTIME> 1274087589 </PSTIME> <PETIME> 1274087590 </PETIME> <RSTIME> 0 </RSTIME> <RETIME> 0 </RETIME> <ESTIME> 0 </ESTIME> <EETIME> 0 </EETIME> <REASON> 1 </REASON> </HISTORY> </VM> </VM_POOL> ";

const string FriendHostPool::xmls[] =
{
"",

"<HOST>\
  <ID>1</ID>\
  <NAME>ursa12</NAME>\
  <STATE>2</STATE>\
  <IM_MAD>im_kvm</IM_MAD>\
  <VM_MAD>vmm_kvm</VM_MAD>\
  <TM_MAD>tm_shared</TM_MAD>\
  <LAST_MON_TIME>1274107238</LAST_MON_TIME>\
  <HOST_SHARE>\
    <HID>1</HID>\
    <DISK_USAGE>0</DISK_USAGE>\
    <MEM_USAGE>262144</MEM_USAGE>\
    <CPU_USAGE>80</CPU_USAGE>\
    <MAX_DISK>0</MAX_DISK>\
    <MAX_MEM>524288</MAX_MEM>\
    <MAX_CPU>100</MAX_CPU>\
    <FREE_DISK>0</FREE_DISK>\
    <FREE_MEM>0</FREE_MEM>\
    <FREE_CPU>0</FREE_CPU>\
    <USED_DISK>0</USED_DISK>\
    <USED_MEM>536220</USED_MEM>\
    <USED_CPU>0</USED_CPU>\
    <RUNNING_VMS>0</RUNNING_VMS>\
  </HOST_SHARE>\
  <TEMPLATE>\
    <ARCH>x86_64</ARCH>\
    <CPUSPEED>2326</CPUSPEED>\
    <FREECPU>800.0</FREECPU>\
    <FREEMEMORY>7954812</FREEMEMORY>\
    <HOSTNAME>ursa12</HOSTNAME>\
    <HYPERVISOR>kvm</HYPERVISOR>\
    <MODELNAME>Intel(R) Xeon(R) CPU           E5410  @ 2.33GHz</MODELNAME>\
    <NETRX>18584233465</NETRX>\
    <NETTX>117426</NETTX>\
    <TOTALCPU>800</TOTALCPU>\
    <TOTALMEMORY>8194368</TOTALMEMORY>\
    <USEDCPU>0.0</USEDCPU>\
    <USEDMEMORY>536220</USEDMEMORY>\
  </TEMPLATE>\
</HOST>",

"<HOST>\
  <ID>2</ID>\
  <NAME>ursa</NAME>\
  <STATE>2</STATE>\
  <IM_MAD>im_kvm</IM_MAD>\
  <VM_MAD>vmm_kvm</VM_MAD>\
  <TM_MAD>tm_shared</TM_MAD>\
  <LAST_MON_TIME>1274107299</LAST_MON_TIME>\
  <HOST_SHARE>\
    <HID>2</HID>\
    <DISK_USAGE>0</DISK_USAGE>\
    <MEM_USAGE>458752</MEM_USAGE>\
    <CPU_USAGE>20</CPU_USAGE>\
    <MAX_DISK>0</MAX_DISK>\
    <MAX_MEM>524288</MAX_MEM>\
    <MAX_CPU>100</MAX_CPU>\
    <FREE_DISK>0</FREE_DISK>\
    <FREE_MEM>9104256</FREE_MEM>\
    <FREE_CPU>613</FREE_CPU>\
    <USED_DISK>0</USED_DISK>\
    <USED_MEM>13897924</USED_MEM>\
    <USED_CPU>186</USED_CPU>\
    <RUNNING_VMS>7</RUNNING_VMS>\
  </HOST_SHARE>\
  <TEMPLATE>\
    <ARCH>x86_64</ARCH>\
    <CPUSPEED>2327</CPUSPEED>\
    <FREECPU>613.6</FREECPU>\
    <FREEMEMORY>9104256</FREEMEMORY>\
    <HOSTNAME>ursa</HOSTNAME>\
    <HYPERVISOR>kvm</HYPERVISOR>\
    <MODELNAME>Intel(R) Xeon(R) CPU           E5410  @ 2.33GHz</MODELNAME>\
    <NETRX>102804341287</NETRX>\
    <NETTX>2186665283</NETTX>\
    <TOTALCPU>800</TOTALCPU>\
    <TOTALMEMORY>16468252</TOTALMEMORY>\
    <USEDCPU>186.4</USEDCPU>\
    <USEDMEMORY>13897924</USEDMEMORY>\
  </TEMPLATE>\
</HOST>",

"",

"<HOST>\
  <ID>4</ID>\
  <NAME>ursa11</NAME>\
  <STATE>2</STATE>\
  <IM_MAD>im_kvm</IM_MAD>\
  <VM_MAD>vmm_kvm</VM_MAD>\
  <TM_MAD>tm_shared</TM_MAD>\
  <LAST_MON_TIME>1274107328</LAST_MON_TIME>\
  <HOST_SHARE>\
    <HID>4</HID>\
    <DISK_USAGE>0</DISK_USAGE>\
    <MEM_USAGE>262144</MEM_USAGE>\
    <CPU_USAGE>10</CPU_USAGE>\
    <MAX_DISK>0</MAX_DISK>\
    <MAX_MEM>524288</MAX_MEM>\
    <MAX_CPU>100</MAX_CPU>\
    <FREE_DISK>0</FREE_DISK>\
    <FREE_MEM>7958684</FREE_MEM>\
    <FREE_CPU>800</FREE_CPU>\
    <USED_DISK>0</USED_DISK>\
    <USED_MEM>621616</USED_MEM>\
    <USED_CPU>0</USED_CPU>\
    <RUNNING_VMS>0</RUNNING_VMS>\
  </HOST_SHARE>\
  <TEMPLATE>\
    <ARCH>x86_64</ARCH>\
    <CPUSPEED>2327</CPUSPEED>\
    <FREECPU>800.0</FREECPU>\
    <FREEMEMORY>7958684</FREEMEMORY>\
    <HOSTNAME>ursa11</HOSTNAME>\
    <HYPERVISOR>kvm</HYPERVISOR>\
    <MODELNAME>Intel(R) Xeon(R) CPU           E5410  @ 2.33GHz</MODELNAME>\
    <NETRX>26567502961</NETRX>\
    <NETTX>4061</NETTX>\
    <TOTALCPU>800</TOTALCPU>\
    <TOTALMEMORY>8194368</TOTALMEMORY>\
    <USEDCPU>0.0</USEDCPU>\
    <USEDMEMORY>621616</USEDMEMORY>\
  </TEMPLATE>\
</HOST>",

"<HOST>\
  <ID>5</ID>\
  <NAME>ursa10</NAME>\
  <STATE>2</STATE>\
  <IM_MAD>im_kvm</IM_MAD>\
  <VM_MAD>vmm_kvm</VM_MAD>\
  <TM_MAD>tm_shared</TM_MAD>\
  <LAST_MON_TIME>1274107300</LAST_MON_TIME>\
  <HOST_SHARE>\
    <HID>5</HID>\
    <DISK_USAGE>256</DISK_USAGE>\
    <MEM_USAGE>0</MEM_USAGE>\
    <CPU_USAGE>30</CPU_USAGE>\
    <MAX_DISK>512</MAX_DISK>\
    <MAX_MEM>524288</MAX_MEM>\
    <MAX_CPU>100</MAX_CPU>\
    <FREE_DISK>256</FREE_DISK>\
    <FREE_MEM>384</FREE_MEM>\
    <FREE_CPU>180</FREE_CPU>\
    <USED_DISK>0</USED_DISK>\
    <USED_MEM>2191756</USED_MEM>\
    <USED_CPU>6</USED_CPU>\
    <RUNNING_VMS>0</RUNNING_VMS>\
  </HOST_SHARE>\
  <TEMPLATE>\
    <ARCH>x86_64</ARCH>\
    <CPUSPEED>2327</CPUSPEED>\
    <FREECPU>793.6</FREECPU>\
    <FREEMEMORY>7871464</FREEMEMORY>\
    <HOSTNAME>ursa10</HOSTNAME>\
    <HYPERVISOR>kvm</HYPERVISOR>\
    <MODELNAME>Intel(R) Xeon(R) CPU           E5410  @ 2.33GHz</MODELNAME>\
    <NETRX>42525516540</NETRX>\
    <NETTX>144088</NETTX>\
    <TOTALCPU>800</TOTALCPU>\
    <TOTALMEMORY>8194368</TOTALMEMORY>\
    <USEDCPU>6.39999999999998</USEDCPU>\
    <USEDMEMORY>2191756</USEDMEMORY>\
  </TEMPLATE>\
</HOST>"
};

const string FriendHostPool::host_dump =
"<HOST_POOL> <HOST> <ID>1</ID> <NAME>ursa12</NAME> <STATE>2</STATE> <IM_MAD>im_kvm</IM_MAD> <VM_MAD>vmm_kvm</VM_MAD> <TM_MAD>tm_shared</TM_MAD> <LAST_MON_TIME>1274107145</LAST_MON_TIME> <HOST_SHARE> <HID>1</HID> <DISK_USAGE>0</DISK_USAGE> <MEM_USAGE>0</MEM_USAGE> <CPU_USAGE>0</CPU_USAGE> <MAX_DISK>0</MAX_DISK> <MAX_MEM>8194368</MAX_MEM> <MAX_CPU>800</MAX_CPU> <FREE_DISK>0</FREE_DISK> <FREE_MEM>7955180</FREE_MEM> <FREE_CPU>800</FREE_CPU> <USED_DISK>0</USED_DISK> <USED_MEM>535848</USED_MEM> <USED_CPU>0</USED_CPU> <RUNNING_VMS>0</RUNNING_VMS> </HOST_SHARE> </HOST> <HOST> <ID>2</ID> <NAME>ursa</NAME> <STATE>2</STATE> <IM_MAD>im_kvm</IM_MAD> <VM_MAD>vmm_kvm</VM_MAD> <TM_MAD>tm_shared</TM_MAD> <LAST_MON_TIME>1274107206</LAST_MON_TIME> <HOST_SHARE> <HID>2</HID> <DISK_USAGE>0</DISK_USAGE> <MEM_USAGE>4280320</MEM_USAGE> <CPU_USAGE>700</CPU_USAGE> <MAX_DISK>0</MAX_DISK> <MAX_MEM>16468252</MAX_MEM> <MAX_CPU>800</MAX_CPU> <FREE_DISK>0</FREE_DISK> <FREE_MEM>9109156</FREE_MEM> <FREE_CPU>628</FREE_CPU> <USED_DISK>0</USED_DISK> <USED_MEM>13891232</USED_MEM> <USED_CPU>172</USED_CPU> <RUNNING_VMS>7</RUNNING_VMS> </HOST_SHARE> </HOST> <HOST> <ID>4</ID> <NAME>ursa11</NAME> <STATE>2</STATE> <IM_MAD>im_kvm</IM_MAD> <VM_MAD>vmm_kvm</VM_MAD> <TM_MAD>tm_shared</TM_MAD> <LAST_MON_TIME>1274107145</LAST_MON_TIME> <HOST_SHARE> <HID>4</HID> <DISK_USAGE>0</DISK_USAGE> <MEM_USAGE>0</MEM_USAGE> <CPU_USAGE>0</CPU_USAGE> <MAX_DISK>0</MAX_DISK> <MAX_MEM>8194368</MAX_MEM> <MAX_CPU>800</MAX_CPU> <FREE_DISK>0</FREE_DISK> <FREE_MEM>7958684</FREE_MEM> <FREE_CPU>800</FREE_CPU> <USED_DISK>0</USED_DISK> <USED_MEM>621616</USED_MEM> <USED_CPU>0</USED_CPU> <RUNNING_VMS>0</RUNNING_VMS> </HOST_SHARE> </HOST> <HOST> <ID>5</ID> <NAME>ursa10</NAME> <STATE>2</STATE> <IM_MAD>im_kvm</IM_MAD> <VM_MAD>vmm_kvm</VM_MAD> <TM_MAD>tm_shared</TM_MAD> <LAST_MON_TIME>1274107207</LAST_MON_TIME> <HOST_SHARE> <HID>5</HID> <DISK_USAGE>0</DISK_USAGE> <MEM_USAGE>0</MEM_USAGE> <CPU_USAGE>0</CPU_USAGE> <MAX_DISK>0</MAX_DISK> <MAX_MEM>8194368</MAX_MEM> <MAX_CPU>800</MAX_CPU> <FREE_DISK>0</FREE_DISK> <FREE_MEM>7870776</FREE_MEM> <FREE_CPU>796</FREE_CPU> <USED_DISK>0</USED_DISK> <USED_MEM>2192424</USED_MEM> <USED_CPU>4</USED_CPU> <RUNNING_VMS>0</RUNNING_VMS> </HOST_SHARE> </HOST> <HOST> <ID>6</ID> <NAME>ursa08</NAME> <STATE>3</STATE> <IM_MAD>im_kvm</IM_MAD> <VM_MAD>vmm_kvm</VM_MAD> <TM_MAD>tm_shared</TM_MAD> <LAST_MON_TIME>1274107176</LAST_MON_TIME> <HOST_SHARE> <HID>6</HID> <DISK_USAGE>0</DISK_USAGE> <MEM_USAGE>0</MEM_USAGE> <CPU_USAGE>0</CPU_USAGE> <MAX_DISK>0</MAX_DISK> <MAX_MEM>0</MAX_MEM> <MAX_CPU>0</MAX_CPU> <FREE_DISK>0</FREE_DISK> <FREE_MEM>6585200</FREE_MEM> <FREE_CPU>0</FREE_CPU> <USED_DISK>0</USED_DISK> <USED_MEM>1132608</USED_MEM> <USED_CPU>0</USED_CPU> <RUNNING_VMS>0</RUNNING_VMS> </HOST_SHARE> </HOST> <HOST> <ID>7</ID> <NAME>ursa09</NAME> <STATE>3</STATE> <IM_MAD>im_kvm</IM_MAD> <VM_MAD>vmm_kvm</VM_MAD> <TM_MAD>tm_shared</TM_MAD> <LAST_MON_TIME>1274107146</LAST_MON_TIME> <HOST_SHARE> <HID>7</HID> <DISK_USAGE>0</DISK_USAGE> <MEM_USAGE>524288</MEM_USAGE> <CPU_USAGE>100</CPU_USAGE> <MAX_DISK>0</MAX_DISK> <MAX_MEM>8194368</MAX_MEM> <MAX_CPU>800</MAX_CPU> <FREE_DISK>0</FREE_DISK> <FREE_MEM>7286128</FREE_MEM> <FREE_CPU>798</FREE_CPU> <USED_DISK>0</USED_DISK> <USED_MEM>8011908</USED_MEM> <USED_CPU>1</USED_CPU> <RUNNING_VMS>1</RUNNING_VMS> </HOST_SHARE> </HOST> </HOST_POOL> ";


