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
#include "test/OneUnitTest.h"

/* ************************************************************************* */
/* ************************************************************************* */

class ObjectXMLTest : public OneUnitTest
{
    CPPUNIT_TEST_SUITE( ObjectXMLTest );

    CPPUNIT_TEST( xpath_access );
    CPPUNIT_TEST( node_constructor );
    CPPUNIT_TEST( doc_update );
    CPPUNIT_TEST( requirements );
    CPPUNIT_TEST( rank );
    CPPUNIT_TEST( xpath );
    CPPUNIT_TEST( xpath_value );

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


    void xpath_value()
    {
        int    rc;
        string im_mad;

        rc = ObjectXML::xpath_value(im_mad,host.c_str(),"/HOST/IM_MAD");

        CPPUNIT_ASSERT(rc == 0);
        CPPUNIT_ASSERT(im_mad == "im_kvm");

        rc = ObjectXML::xpath_value(im_mad,host.c_str(),"/HOST/NO_IM_MAD");

        CPPUNIT_ASSERT(rc == -1);
    };

    void xpath()
    {
        try
        {
            ObjectXML obj(xml_history_dump);
            string str_exists;
            string str_no_exists;
            
            int    int_exists;
            int    int_no_exists;
            int    int_malformed;
            int    rc;

            rc = obj.xpath(str_exists,"/VM_POOL/VM/HISTORY/HOSTNAME","default_host");
            CPPUNIT_ASSERT(str_exists == "A_hostname");
            CPPUNIT_ASSERT(rc == 0);

            rc = obj.xpath(str_no_exists,"/VM_POOL/NOT_AN_ELEMENT","default_host");
            CPPUNIT_ASSERT(str_no_exists == "default_host");
            CPPUNIT_ASSERT(rc == -1);

            rc = obj.xpath(int_exists,"/VM_POOL/VM/STATE",35);
            CPPUNIT_ASSERT(int_exists == 1);
            CPPUNIT_ASSERT(rc == 0);

            rc = obj.xpath(int_no_exists,"/VM_POOL/NOT_AN_ELEMENT",35);
            CPPUNIT_ASSERT(int_no_exists == 35);
            CPPUNIT_ASSERT(rc == -1);

            rc = obj.xpath(int_malformed,"/VM_POOL/VM/USERNAME",33);
            CPPUNIT_ASSERT(int_malformed == 33);
            CPPUNIT_ASSERT(rc == -1);
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

            obj.free_nodes(vms);
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

            obj.update_from_str(xml_history_dump2);

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


    void requirements()
    {
        try
        {
            ObjectXML obj(host);

            char* err;
            bool  res;
            int   rc;

            // -----------------------------------------------------------------
            // REQUIREMENTS MATCHING
            // -----------------------------------------------------------------
            string reqs[] =
            {
                "TOTALCPU =  800",      // exact value matching
                "TOTALCPU != 800",      // Not equal
                "TOTALCPU > 5",         // Greater than expr.
                "! (TOTALCPU > 5)",     // Not exp.

                "HOSTNAME = \"ursa12\"",        // Exact string matching
                "HOSTNAME = \"ursa*\"",         // Shell wildcard
                "HOSTNAME = \"ursa\"",

                "HID = 1",
                "ARCH = \"*64*\"",
                "RUNNING_VMS < 100",

                "CLUSTER = \"cluster A\"",
                "CLUSTER = \"default\"",
                "CLUSTER = clusterA",
                "CLUSTER = \"Cluster A\"",

        /*
            // Boolean operators
            "HOSTNAME = \"ursa*\" & NETRX = \"13335836573\"",
            // Operator precedence
            "HOSTNAME = \"ursa*\" | HOSTNAME = \"no\" & HOSTNAME = \"no\"",
            "( HOSTNAME = \"ursa*\" | HOSTNAME = \"no\" ) & HOSTNAME = \"no\"",
        //*/

                "END"
            };

            bool results[] = { true, false, true, false,
                               true, true, false,
                               true, true, true,
                               true, false, false, false
                            /*
                               true, true, false,
                            //*/
                             };

            int i = 0;
            while( reqs[i] != "END" )
            {
// cout << endl << i << " - " << reqs[i];
                rc = obj.eval_bool( reqs[i], res, &err );
// cout << "··· rc: " << rc << "  result: " << res << "  expected: " << results[i] << endl;
                CPPUNIT_ASSERT( rc == 0 );
                CPPUNIT_ASSERT( res == results[i] );

                i++;
            }

            // Non-existing attribute compared to string value
            rc = obj.eval_bool( "FOO = \"BAR\"", res, &err );
            CPPUNIT_ASSERT( rc == 0 );
            CPPUNIT_ASSERT( res == false );

            // Non-existing attribute compared to numeric value
            rc = obj.eval_bool( "FOO = 123", res, &err );
            CPPUNIT_ASSERT( rc == 0 );
            CPPUNIT_ASSERT( res == false );


            // Existing string attribute compared to numeric value
            rc = obj.eval_bool( "HOSTNAME = 123 ", res, &err );
            CPPUNIT_ASSERT( rc == 0 );
            CPPUNIT_ASSERT( res == false );

            // Existing numeric attribute compared to string value should work
            rc = obj.eval_bool( "TOTALCPU =  \"800\"", res, &err );
            CPPUNIT_ASSERT( rc == 0 );
            CPPUNIT_ASSERT( res == true );

            // Bad syntax
            // TODO: Right now eval_bool returns 1 in case of error, and result
            // is not set to false.
            rc = obj.eval_bool( "TOTALCPU ^ * - = abc", res, &err );
            CPPUNIT_ASSERT( rc != 0 );
            CPPUNIT_ASSERT( res == false );

            if (err != 0)
            {
                free( err );
            }
        }
        catch(runtime_error& re)
        {
             cerr << re.what() << endl;
             CPPUNIT_ASSERT(1 == 0);
        }
    };


    void rank()
    {
        try
        {
            ObjectXML obj(host);

            char* err;
            int   res;
            int   rc;

            // -----------------------------------------------------------------
            // RANK EXPRESSIONS
            // -----------------------------------------------------------------
            string rank_exp[] =
            {
                "RUNNING_VMS",          // Single attribute
                "MAX_CPU + NETTX",      // Simple operations
                "RUNNING_VMS * 10",     // Operations with fixed values
                "- FREE_MEM",           // Unary operator
                "2 + 4 * 10",           // Operator precedence
                "(2 + 4) * 10",
                "END"
            };

            int results[] =
            {
                12,
                47959 + 800,
                12 * 10,
                -7959232,
                2 + 4 * 10,
                (2 + 4) * 10,
            };

            int i = 0;
            while( rank_exp[i] != "END" )
            {
// cout << endl << i << " - " << rank_exp[i];
                rc = obj.eval_arith( rank_exp[i], res, &err );
// cout << "··· rc: " << rc << "  res: " << res << "  expected: " << results[i] << endl;
                CPPUNIT_ASSERT( rc == 0 );
                CPPUNIT_ASSERT( res == results[i] );

                i++;
            }


            // Non-existing attribute
            rc = obj.eval_arith( "FOO", res, &err );
            CPPUNIT_ASSERT( rc == 0 );
            CPPUNIT_ASSERT( res == 0 );

            // Non-existing attribute and operators
            rc = obj.eval_arith( "FOO + 10", res, &err );
            CPPUNIT_ASSERT( rc == 0 );
            CPPUNIT_ASSERT( res == 10 );
        }
        catch(runtime_error& re)
        {
             cerr << re.what() << endl;
             CPPUNIT_ASSERT(1 == 0);
        }
    };

    static const string xml_history_dump;
    static const string xml_history_dump2;
    static const string host;
};

/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return OneUnitTest::main(argc, argv, ObjectXMLTest::suite());
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

const string ObjectXMLTest::host =
  "<HOST>"
  "<ID>1</ID>"
  "<NAME>ursa12</NAME>"
  "<STATE>2</STATE>"
  "<IM_MAD>im_kvm</IM_MAD>"
  "<VM_MAD>vmm_kvm</VM_MAD>"
  "<TM_MAD>tm_shared</TM_MAD>"
  "<LAST_MON_TIME>1273799044</LAST_MON_TIME>"
  "<CLUSTER>cluster A</CLUSTER>"
  "<HOST_SHARE>"
  "  <HID>1</HID>"
  "  <DISK_USAGE>0</DISK_USAGE>"
  "  <MEM_USAGE>0</MEM_USAGE>"
  "  <CPU_USAGE>0</CPU_USAGE>"
  "  <MAX_DISK>0</MAX_DISK>"
  "  <MAX_MEM>8194368</MAX_MEM>"
  "  <MAX_CPU>800</MAX_CPU>"
  "  <FREE_DISK>0</FREE_DISK>"
  "  <FREE_MEM>7959232</FREE_MEM>"
  "  <FREE_CPU>800</FREE_CPU>"
  "  <USED_DISK>0</USED_DISK>"
  "  <USED_MEM>523080</USED_MEM>"
  "  <USED_CPU>0</USED_CPU>"
  "  <RUNNING_VMS>12</RUNNING_VMS>"
  "</HOST_SHARE>"
  "<TEMPLATE>"
  "  <ARCH>x86_64</ARCH>"
  "  <CPUSPEED>2326</CPUSPEED>"
  "  <FREECPU>800.0</FREECPU>"
  "  <FREEMEMORY>7959232</FREEMEMORY>"
  "  <HOSTNAME>ursa12</HOSTNAME>"
  "  <HYPERVISOR>kvm</HYPERVISOR>"
  "  <MODELNAME>Intel(R) Xeon(R) CPU           E5410  @ 2.33GHz</MODELNAME>"
  "  <NETRX>13335836573</NETRX>"
  "  <NETTX>47959</NETTX>"
  "  <TOTALCPU>800</TOTALCPU>"
  "  <TOTALMEMORY>8194368</TOTALMEMORY>"
  "  <USEDCPU>0.0</USEDCPU>"
  "  <USEDMEMORY>523080</USEDMEMORY>"
  "</TEMPLATE>"
  "</HOST>";
