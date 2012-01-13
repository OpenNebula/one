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


/* ************************************************************************* */
/* ************************************************************************* */

class HostXMLTest : public OneUnitTest
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
        CPPUNIT_ASSERT( hp->objects.count(0) == 0);
        CPPUNIT_ASSERT( hp->objects.count(1) == 1);
        CPPUNIT_ASSERT( hp->objects.count(2) == 1);
        CPPUNIT_ASSERT( hp->objects.count(3) == 0);
        CPPUNIT_ASSERT( hp->objects.count(4) == 1);
        CPPUNIT_ASSERT( hp->objects.count(5) == 1);
        CPPUNIT_ASSERT( hp->objects.count(6) == 0);
        CPPUNIT_ASSERT( hp->objects.count(7) == 0);
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

        HostXML* host = (HostXML*) hp->objects[5];
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

        HostXML* host = (HostXML*) hp->objects[5];
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

        HostXML* host = (HostXML*) hp->objects[5];
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
    return OneUnitTest::main(argc, argv, HostXMLTest::suite(),
                            "HostXMLTest.xml");
}

// ----------------------------------------------------------------------------

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
    <MEM_USAGE>0</MEM_USAGE>\
    <CPU_USAGE>0</CPU_USAGE>\
    <MAX_DISK>0</MAX_DISK>\
    <MAX_MEM>8194368</MAX_MEM>\
    <MAX_CPU>800</MAX_CPU>\
    <FREE_DISK>0</FREE_DISK>\
    <FREE_MEM>7954812</FREE_MEM>\
    <FREE_CPU>800</FREE_CPU>\
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
    <MEM_USAGE>4280320</MEM_USAGE>\
    <CPU_USAGE>700</CPU_USAGE>\
    <MAX_DISK>0</MAX_DISK>\
    <MAX_MEM>16468252</MAX_MEM>\
    <MAX_CPU>800</MAX_CPU>\
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
    <MEM_USAGE>0</MEM_USAGE>\
    <CPU_USAGE>0</CPU_USAGE>\
    <MAX_DISK>0</MAX_DISK>\
    <MAX_MEM>8194368</MAX_MEM>\
    <MAX_CPU>800</MAX_CPU>\
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
    <MEM_USAGE>128</MEM_USAGE>\
    <CPU_USAGE>20</CPU_USAGE>\
    <MAX_DISK>512</MAX_DISK>\
    <MAX_MEM>512</MAX_MEM>\
    <MAX_CPU>200</MAX_CPU>\
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


