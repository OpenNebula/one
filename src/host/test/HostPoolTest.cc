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

#include "HostPool.h"
#include "PoolTest.h"

using namespace std;

const string im_mad  = "im_mad";
const string vmm_mad = "vmm_mad";
const string tm_mad  = "tm_mad";

const string names[] = {"Host one", "Second host"};

const string xmls[] =
{
    "<HOST><ID>0</ID><NAME>Host one</NAME><STATE>0</STATE>"
    "<IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD>"
    "<LAST_MON_TIME>0000000000</LAST_MON_TIME><HOST_SHARE><HID>0</HID>"
    "<DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE>"
    "<MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CPU>"
    "<FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU>"
    "<USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU>"
    "<RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST>",

    "<HOST><ID>1</ID><NAME>Second host</NAME><STATE>0</STATE>"
    "<IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD>"
    "<LAST_MON_TIME>0000000000</LAST_MON_TIME><HOST_SHARE><HID>1</HID>"
    "<DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE>"
    "<MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CPU>"
    "<FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU>"
    "<USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU>"
    "<RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST>"
};

// This xml dump result has the LAST_MON_TIMEs modified to 0000000000
const string xml_dump =
    "<HOST_POOL><HOST><ID>0</ID><NAME>a</NAME><STATE>0</STATE><IM_MAD>im_mad</I"
    "M_MAD><VM_MAD>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>000000"
    "0000</LAST_MON_TIME><HOST_SHARE><HID>0</HID><DISK_USAGE>0</DISK_USAGE><MEM"
    "_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM"
    ">0</MAX_MEM><MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_"
    "MEM><FREE_CPU>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><U"
    "SED_CPU>0</USED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST>"
    "<ID>1</ID><NAME>a name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MA"
    "D>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0000000000</LAST_M"
    "ON_TIME><HOST_SHARE><HID>1</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</ME"
    "M_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM>"
    "<MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CP"
    "U>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</U"
    "SED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST><ID>2</ID><N"
    "AME>a_name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</V"
    "M_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0000000000</LAST_MON_TIME><HOS"
    "T_SHARE><HID>2</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU"
    "_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</"
    "MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CP"
    "U><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUN"
    "NING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST><ID>3</ID><NAME>another "
    "name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD>"
    "<TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0000000000</LAST_MON_TIME><HOST_SHAR"
    "E><HID>3</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE"
    ">0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CP"
    "U><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU><USE"
    "D_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUNNING_V"
    "MS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST><ID>4</ID><NAME>host</NAME><ST"
    "ATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD><TM_MAD>tm_mad"
    "</TM_MAD><LAST_MON_TIME>0000000000</LAST_MON_TIME><HOST_SHARE><HID>4</HID>"
    "<DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE>"
    "<MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CPU><FREE_DISK>0"
    "</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU><USED_DISK>0</USED"
    "_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUNNING_VMS>0</RUNNING_"
    "VMS></HOST_SHARE></HOST></HOST_POOL>";

const string xml_dump_like_a =
    "<HOST_POOL><HOST><ID>0</ID><NAME>a</NAME><STATE>0</STATE><IM_MAD>im_mad</I"
    "M_MAD><VM_MAD>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>000000"
    "0000</LAST_MON_TIME><HOST_SHARE><HID>0</HID><DISK_USAGE>0</DISK_USAGE><MEM"
    "_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM"
    ">0</MAX_MEM><MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_"
    "MEM><FREE_CPU>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><U"
    "SED_CPU>0</USED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST>"
    "<ID>1</ID><NAME>a name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MA"
    "D>vmm_mad</VM_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0000000000</LAST_M"
    "ON_TIME><HOST_SHARE><HID>1</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</ME"
    "M_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM>"
    "<MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CP"
    "U>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</U"
    "SED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST><ID>2</ID><N"
    "AME>a_name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</V"
    "M_MAD><TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0000000000</LAST_MON_TIME><HOS"
    "T_SHARE><HID>2</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU"
    "_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</"
    "MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CP"
    "U><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUN"
    "NING_VMS>0</RUNNING_VMS></HOST_SHARE></HOST><HOST><ID>3</ID><NAME>another "
    "name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD>"
    "<TM_MAD>tm_mad</TM_MAD><LAST_MON_TIME>0000000000</LAST_MON_TIME><HOST_SHAR"
    "E><HID>3</HID><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE"
    ">0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CP"
    "U><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU><USE"
    "D_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUNNING_V"
    "MS>0</RUNNING_VMS></HOST_SHARE></HOST></HOST_POOL>";

const string replacement = "0000000000";


/* ************************************************************************* */
/* ************************************************************************* */

class HostPoolTest : public PoolTest
{
    CPPUNIT_TEST_SUITE (HostPoolTest);

    ALL_POOLTEST_CPPUNIT_TESTS();

    CPPUNIT_TEST (update);
    CPPUNIT_TEST (dump);
    CPPUNIT_TEST (dump_where);
    CPPUNIT_TEST (discover);

    CPPUNIT_TEST_SUITE_END ();

protected:

    string database_name()
    {
        return "host_pool_test";
    };

    void bootstrap(SqlDB* db)
    {
        HostPool::bootstrap(db);
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        return new HostPool(db);
    };

    int allocate(int index)
    {
        int oid;
        ((HostPool*)pool)->allocate(&oid, names[index], im_mad, vmm_mad, tm_mad);
        return oid;
    };

    void check(int index, PoolObjectSQL* obj)
    {
        Host * host = static_cast<Host *>(obj);

        CPPUNIT_ASSERT( obj != 0 );

        string xml_str = "";
        string name = host->get_hostname();

        CPPUNIT_ASSERT( name == names[index] );

        // Get the xml and replace the LAST_MON_TIME to 0, so we can compare
        // it with a prepared string.
        host->to_xml(xml_str);
        xml_str.replace( xml_str.find("<LAST_MON_TIME>")+15, 10, "0000000000");

        CPPUNIT_ASSERT( xml_str == xmls[index]);

    };


public:
    HostPoolTest(){};

    ~HostPoolTest(){};


    /* ********************************************************************* */
    /* ********************************************************************* */


    void update()
    {
        int oid_1 = allocate(0);

        Host* host = ((HostPool*)pool)->get(oid_1, true);
        CPPUNIT_ASSERT(host!=0);
        
        // Host object should be cached. Let's update its status
        host->set_state(Host::DISABLED);
        pool->update(host);

        host->unlock();

        host = ((HostPool*)pool)->get(oid_1,false);
        CPPUNIT_ASSERT( host->get_state() == Host::DISABLED );

        //Now force access to DB

        pool->clean();
        host = ((HostPool*)pool)->get(oid_1,false);

        CPPUNIT_ASSERT( host->get_state() == Host::DISABLED );
    };

    void dump()
    {
        string names[] = {"a", "a name", "a_name", "another name", "host"};
        int rc, oid;

        for(int i=0; i<5; i++)
        {
            ((HostPool*)pool)->allocate(&oid, names[i], im_mad, vmm_mad, tm_mad);
        }

        ostringstream oss;

        rc = ((HostPool*)pool)->dump(oss, "");
        CPPUNIT_ASSERT(rc == 0);

        // To be able to compare one string to another, the monitoring times
        // have to be changed
        string result = oss.str();
        result.replace( 142, 10, replacement);
        result.replace( 648, 10, replacement);
        result.replace(1154, 10, replacement);
        result.replace(1666, 10, replacement);
        result.replace(2170, 10, replacement);

        CPPUNIT_ASSERT( result == xml_dump );
    }

    void dump_where()
    {
        string names[] = {"a", "a name", "a_name", "another name", "host"};
        int rc, oid;

        for(int i=0; i<5; i++)
        {
            ((HostPool*)pool)->allocate(&oid, names[i], im_mad, vmm_mad, tm_mad);
        }


        ostringstream oss;
        rc = ((HostPool*)pool)->dump(oss, "host_name LIKE 'a%'");
        CPPUNIT_ASSERT(rc == 0);

        // To be able to compare one string to another, the monitoring times
        // have to be changed
        string result = oss.str();
        result.replace( 142, 10, replacement);
        result.replace( 648, 10, replacement);
        result.replace(1154, 10, replacement);
        result.replace(1666, 10, replacement);


        CPPUNIT_ASSERT( result == xml_dump_like_a );
    }

    void discover()
    {
        int  rc, oid, i;

        map<int, string>           dh;
        map<int, string>::iterator it;

        Host *     host;
        HostPool * hp = static_cast<HostPool *>(pool);
        ostringstream oss;

        for(i=0, oss.str(""); i<20; i++,oss.str(""))
        {
            oss << "host" << i;

            hp->allocate(&oid, oss.str().c_str(), im_mad, vmm_mad, tm_mad);
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
        rc = hp->discover(&dh);
        CPPUNIT_ASSERT(rc == 0);
        CPPUNIT_ASSERT(dh.size() == 8);

        for(i=0,it=dh.begin(),oss.str("");it!=dh.end();it++,i++,oss.str(""))
        {
            CPPUNIT_ASSERT(it->first  == i);
            CPPUNIT_ASSERT(it->second == im_mad);
        }
    }
};

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return PoolTest::main(argc, argv, HostPoolTest::suite());
}
