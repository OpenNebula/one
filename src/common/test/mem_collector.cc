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

extern "C"
{
#include "mem_collector.h"
}

#include <string.h>

#include <TestFixture.h>
#include <TestAssert.h>
#include <TestSuite.h>
#include <TestCaller.h>
#include <ui/text/TestRunner.h>

#include "test/one_test_common.h"

using namespace std;

class MemCollectorTest : public CppUnit::TestFixture
{
public:
    void setUp()
    {
    }

    void tearDown()
    {
    }

    void test_all_free()
    {
        mem_collector mc;

        mem_collector_init(&mc);

        char * st1 = mem_collector_strdup(&mc,"HOLA");
        char * st2 = mem_collector_strdup(&mc,"ADIOS");
        char * st3 = mem_collector_strdup(&mc,"HELLO");
        char * st4 = mem_collector_strdup(&mc,"BYE");

        CPPUNIT_ASSERT(strcmp(mc.str_buffer[0],"HOLA")==0);
        CPPUNIT_ASSERT(strcmp(mc.str_buffer[1],"ADIOS")==0);
        CPPUNIT_ASSERT(strcmp(mc.str_buffer[2],"HELLO")==0);
        CPPUNIT_ASSERT(strcmp(mc.str_buffer[3],"BYE")==0);
        
        //Check the content of the strings
        CPPUNIT_ASSERT(strcmp(st1,"HOLA")==0);
        CPPUNIT_ASSERT(strcmp(st2,"ADIOS")==0);
        CPPUNIT_ASSERT(strcmp(st3,"HELLO")==0);
        CPPUNIT_ASSERT(strcmp(st4,"BYE")==0);

        mem_collector_cleanup(&mc);

        CPPUNIT_ASSERT(mc.size == MEM_COLLECTOR_CHUNK);
    }

    void test_realloc()
    {
        mem_collector mc;
        int           max_size;

        max_size = (MEM_COLLECTOR_CHUNK * 3) + 5;

        mem_collector_init(&mc);

        for (int i=0; i < max_size ; i++)
        {
            mem_collector_strdup(&mc,"HOLA");
        }

        for (int i=0; i < max_size ; i++)
        {
            CPPUNIT_ASSERT(strcmp(mc.str_buffer[i],"HOLA")==0);
        }

        mem_collector_cleanup(&mc);

        CPPUNIT_ASSERT(mc.size == MEM_COLLECTOR_CHUNK * 4);
    }

    static CppUnit::TestSuite * suite()
    {
        CppUnit::TestSuite *ts=new CppUnit::TestSuite("mem_collector Tests");

        ts->addTest(new CppUnit::TestCaller<MemCollectorTest>(
                    "test_all_free() Test",
                    &MemCollectorTest::test_all_free));

        ts->addTest(new CppUnit::TestCaller<MemCollectorTest>(
                    "test_realloc() Test",
                    &MemCollectorTest::test_realloc));
        return ts;
    }
};

int main(int argc, char ** argv)
{
    CppUnit::TextUi::TestRunner tr;

    SETUP_XML_WRITER(tr, "mem_collector.xml");

    tr.addTest(MemCollectorTest::suite());
    tr.run();

    END_XML_WRITER

    return 0;
}
