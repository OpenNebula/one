extern "C"
{
#include "mem_collector.h"
}

#include <TestFixture.h>
#include <TestAssert.h>
#include <TestSuite.h>
#include <TestCaller.h>
#include <ui/text/TestRunner.h>

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

        mem_collector_free(&mc,st1);
        mem_collector_free(&mc,st2);
        mem_collector_free(&mc,st3);
        mem_collector_free(&mc,st4);

        mem_collector_cleanup(&mc);

        CPPUNIT_ASSERT(mc.size == MEM_COLLECTOR_CHUNK);
    }

    void test_not_free()
    {
        mem_collector mc;

        mem_collector_init(&mc);

        char * st1 = mem_collector_strdup(&mc,"HOLA");
        char * st2 = mem_collector_strdup(&mc,"ADIOS");
        char * st3 = mem_collector_strdup(&mc,"HELLO");
        char * st4 = mem_collector_strdup(&mc,"BYE");

        mem_collector_free(&mc,st2);
        mem_collector_free(&mc,st4);

        mem_collector_cleanup(&mc);

        CPPUNIT_ASSERT(mc.size == MEM_COLLECTOR_CHUNK);
    }

    void test_realloc()
    {
        mem_collector mc;
        int           max_size;

        max_size = (MEM_COLLECTOR_CHUNK * 3) + 1;

        mem_collector_init(&mc);

        for (int i=0; i < max_size ; i++)
        {
            mem_collector_strdup(&mc,"HOLA");
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
                    "test_not_free() Test",
                    &MemCollectorTest::test_not_free));

        ts->addTest(new CppUnit::TestCaller<MemCollectorTest>(
                    "test_realloc() Test",
                    &MemCollectorTest::test_realloc));
        return ts;
    }
};

int main(int argc, char ** argv)
{
    CppUnit::TextUi::TestRunner tr;

    tr.addTest(MemCollectorTest::suite());
    tr.run();

    return 0;
}
