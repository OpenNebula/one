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

#include "HostPool.h"
#include "PoolTest.h"

using namespace std;

const string im_mad  = "im_mad";
const string vmm_mad = "vmm_mad";
const string vnm_mad = "vnm_mad";

const string names[] = {"Host one", "Second host"};

const string xmls[] =
{
    "<HOST><ID>0</ID><NAME>Host one</NAME><STATE>0</STATE>"
    "<IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD><VN_MAD>vnm_mad</VN_MAD>"
    "<LAST_MON_TIME>0</LAST_MON_TIME><HOST_SHARE>"
    "<DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE>"
    "<MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CPU>"
    "<FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU>"
    "<USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU>"
    "<RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST>",

    "<HOST><ID>1</ID><NAME>Second host</NAME><STATE>0</STATE>"
    "<IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD><VN_MAD>vnm_mad</VN_MAD>"
    "<LAST_MON_TIME>0</LAST_MON_TIME><HOST_SHARE>"
    "<DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE>"
    "<MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CPU>"
    "<FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU>"
    "<USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU>"
    "<RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST>"
};

// This xml dump result has the LAST_MON_TIMEs modified to 0000000000
const string xml_dump =
    "<HOST_POOL><HOST><ID>0</ID><NAME>a</NAME><STATE>0</STATE><IM_MAD>im_mad</I"
    "M_MAD><VM_MAD>vmm_mad</VM_MAD><VN_MAD>vnm_mad</VN_MAD><LAST_MON_TIME>0"
    "</LAST_MON_TIME><HOST_SHARE><DISK_USAGE>0</DISK_USAGE><MEM"
    "_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM"
    ">0</MAX_MEM><MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_"
    "MEM><FREE_CPU>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><U"
    "SED_CPU>0</USED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST><HOST>"
    "<ID>1</ID><NAME>a name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MA"
    "D>vmm_mad</VM_MAD><VN_MAD>vnm_mad</VN_MAD><LAST_MON_TIME>0</LAST_M"
    "ON_TIME><HOST_SHARE><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</ME"
    "M_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM>"
    "<MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CP"
    "U>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</U"
    "SED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST><HOST><ID>2</ID><N"
    "AME>a_name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</V"
    "M_MAD><VN_MAD>vnm_mad</VN_MAD><LAST_MON_TIME>0</LAST_MON_TIME><HOS"
    "T_SHARE><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU"
    "_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</"
    "MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CP"
    "U><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUN"
    "NING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST><HOST><ID>3</ID><NAME>another "
    "name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD>"
    "<VN_MAD>vnm_mad</VN_MAD><LAST_MON_TIME>0</LAST_MON_TIME><HOST_SHAR"
    "E><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE"
    ">0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CP"
    "U><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU><USE"
    "D_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUNNING_V"
    "MS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST><HOST><ID>4</ID><NAME>host</NAME><ST"
    "ATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD><VN_MAD>vnm_mad</VN_MAD>"
    "<LAST_MON_TIME>0</LAST_MON_TIME><HOST_SHARE>"
    "<DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE>"
    "<MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CPU><FREE_DISK>0"
    "</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU><USED_DISK>0</USED"
    "_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUNNING_VMS>0</RUNNING_"
    "VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST></HOST_POOL>";

const string xml_dump_like_a =
    "<HOST_POOL><HOST><ID>0</ID><NAME>a</NAME><STATE>0</STATE><IM_MAD>im_mad</I"
    "M_MAD><VM_MAD>vmm_mad</VM_MAD><VN_MAD>vnm_mad</VN_MAD><LAST_MON_TIME>0"
    "</LAST_MON_TIME><HOST_SHARE><DISK_USAGE>0</DISK_USAGE><MEM"
    "_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM"
    ">0</MAX_MEM><MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_"
    "MEM><FREE_CPU>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><U"
    "SED_CPU>0</USED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST><HOST>"
    "<ID>1</ID><NAME>a name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MA"
    "D>vmm_mad</VM_MAD><VN_MAD>vnm_mad</VN_MAD><LAST_MON_TIME>0</LAST_M"
    "ON_TIME><HOST_SHARE><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</ME"
    "M_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM>"
    "<MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CP"
    "U>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</U"
    "SED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST><HOST><ID>2</ID><N"
    "AME>a_name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</V"
    "M_MAD><VN_MAD>vnm_mad</VN_MAD><LAST_MON_TIME>0</LAST_MON_TIME><HOS"
    "T_SHARE><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU"
    "_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</"
    "MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CP"
    "U><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUN"
    "NING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST><HOST><ID>3</ID><NAME>another "
    "name</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD>"
    "<VN_MAD>vnm_mad</VN_MAD><LAST_MON_TIME>0</LAST_MON_TIME><HOST_SHAR"
    "E><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE"
    ">0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CP"
    "U><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU><USE"
    "D_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUNNING_V"
    "MS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST></HOST_POOL>";

const string host0_updated =
    "<HOST><ID>0</ID><NAME>Host one</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD><VN_MAD>vnm_mad</VN_MAD><LAST_MON_TIME>0</LAST_MON_TIME><HOST_SHARE><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE><ATT_A><![CDATA[VALUE_A]]></ATT_A><ATT_B><![CDATA[VALUE_B]]></ATT_B></TEMPLATE></HOST>";

const string host_0_cluster =
    "<HOST><ID>0</ID><NAME>Host one</NAME><STATE>0</STATE><IM_MAD>im_mad</IM_MAD><VM_MAD>vmm_mad</VM_MAD><VN_MAD>vnm_mad</VN_MAD><LAST_MON_TIME>0</LAST_MON_TIME><CLUSTER>cluster_a</CLUSTER><HOST_SHARE><DISK_USAGE>0</DISK_USAGE><MEM_USAGE>0</MEM_USAGE><CPU_USAGE>0</CPU_USAGE><MAX_DISK>0</MAX_DISK><MAX_MEM>0</MAX_MEM><MAX_CPU>0</MAX_CPU><FREE_DISK>0</FREE_DISK><FREE_MEM>0</FREE_MEM><FREE_CPU>0</FREE_CPU><USED_DISK>0</USED_DISK><USED_MEM>0</USED_MEM><USED_CPU>0</USED_CPU><RUNNING_VMS>0</RUNNING_VMS></HOST_SHARE><TEMPLATE></TEMPLATE></HOST>";
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
    CPPUNIT_TEST (duplicates);
    CPPUNIT_TEST (update_info);
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
        return ((HostPool*)pool)->allocate(&oid, names[index], im_mad,
                     vmm_mad, vnm_mad, 
                     ClusterPool::NONE_CLUSTER_ID,
                     ClusterPool::NONE_CLUSTER_NAME,err);
    };

    void check(int index, PoolObjectSQL* obj)
    {
        Host * host = static_cast<Host *>(obj);

        CPPUNIT_ASSERT( obj != 0 );

        string xml_str = "";
        string name = host->get_name();

        CPPUNIT_ASSERT( name == names[index] );

        // Get the xml
        host->to_xml(xml_str);

//  A little help for debugging
//*
        if( xml_str != xmls[index] )
        {
            cout << endl << xml_str << endl << "========"
                 << endl << xmls[index] << endl;
        }
//*/
        CPPUNIT_ASSERT( xml_str == xmls[index]);
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

    void dump()
    {
        string names[] = {"a", "a name", "a_name", "another name", "host"};
        int rc, oid;
        string err;

        for(int i=0; i<5; i++)
        {
            ((HostPool*)pool)->allocate(&oid, 
                          names[i], 
                          im_mad, 
                          vmm_mad, 
                          vnm_mad, 
                          ClusterPool::NONE_CLUSTER_ID,
                          ClusterPool::NONE_CLUSTER_NAME,
                          err);
        }

        ostringstream oss;

        rc = ((HostPool*)pool)->dump(oss, "");
        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();

//  A little help for debugging
/*
        if( result != xml_dump )
        {
            cout << endl << result << endl << "========"
                 << endl << xml_dump << endl;
        }
*/

        CPPUNIT_ASSERT( result == xml_dump );
    }

    /* ********************************************************************* */

    void dump_where()
    {
        string names[] = {"a", "a name", "a_name", "another name", "host"};
        int rc, oid;
        string err;

        for(int i=0; i<5; i++)
        {
            ((HostPool*)pool)->allocate(&oid, 
                          names[i], 
                          im_mad, 
                          vmm_mad, 
                          vnm_mad, 
                          ClusterPool::NONE_CLUSTER_ID,
                          ClusterPool::NONE_CLUSTER_NAME,
                          err);
        }

        ostringstream oss;
        rc = ((HostPool*)pool)->dump(oss, "name LIKE 'a%'");
        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();

//  A little help for debugging
/*
        if( result != xml_dump_like_a )
        {
            cout << endl << result << endl << "========"
                 << endl << xml_dump_like_a << endl;
        }
*/

        CPPUNIT_ASSERT( result == xml_dump_like_a );
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

    void update_info()
    {
        int         rc;
        int         oid_1;
        HostPool *  hp = static_cast<HostPool *>(pool);
        Host*       host;
        string      str;

        oid_1 = allocate(0);

        host = hp->get(oid_1, false);
        CPPUNIT_ASSERT( host != 0 );

        string info = "ATT_A=VALUE_A ATT_B=VALUE_B";
        rc = host->update_info(info);

        CPPUNIT_ASSERT(rc == 0);

        pool->update(host);

        host = hp->get(oid_1,false);
        CPPUNIT_ASSERT( host != 0 );
        CPPUNIT_ASSERT( host->to_xml(str) == host0_updated );

        //Now force access to DB
        pool->clean();
        host = hp->get(oid_1,false);

        CPPUNIT_ASSERT( host != 0 );
        CPPUNIT_ASSERT( host->to_xml(str) == host0_updated );
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
