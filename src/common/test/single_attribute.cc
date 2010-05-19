#include "Attribute.h"

#include <string>
#include <iostream>

#include <TestFixture.h>
#include <TestAssert.h>
#include <TestSuite.h>
#include <TestCaller.h>
#include <ui/text/TestRunner.h>

using namespace std;

class SingleAttributeTest : public CppUnit::TestFixture 
{
private:
    SingleAttribute *a, *b;
    
public:
    void setUp()
    {
        string a_name = "single_a";

        string b_name = "single_b";
        string b_value= "value_b";

        a = new SingleAttribute(a_name);
        b = new SingleAttribute(b_name, b_value);
    }

    void tearDown()
    {
        delete a;
        delete b;
    }

    void test_type()
    {
        CPPUNIT_ASSERT(a->type() == Attribute::SIMPLE);
        CPPUNIT_ASSERT(b->type() == Attribute::SIMPLE);
    }

    void test_name()
    {
        CPPUNIT_ASSERT(a->name() == "SINGLE_A");
        CPPUNIT_ASSERT(b->name() == "SINGLE_B");
    }

    void test_value()
    {
        CPPUNIT_ASSERT(a->value().empty() == true);
        CPPUNIT_ASSERT(b->value() == "value_b");
    }

    void test_marshall()
    {
        string *am, *bm;

        am = a->marshall();
        bm = b->marshall();

        CPPUNIT_ASSERT(am->empty() == true);
        CPPUNIT_ASSERT(*bm == "value_b");

        delete am;
        delete bm;
    }

    void test_xml()
    {
        string *am, *bm;

        am = a->to_xml();
        bm = b->to_xml();

        CPPUNIT_ASSERT(*am == "<SINGLE_A><![CDATA[]]></SINGLE_A>");
        CPPUNIT_ASSERT(*bm == "<SINGLE_B><![CDATA[value_b]]></SINGLE_B>");

        delete am;
        delete bm;
    }

    void test_replace()
    {
        string nv = "new_value_b";

        b->replace(nv);

        CPPUNIT_ASSERT(b->value() == "new_value_b");
    }

    static CppUnit::TestSuite * suite()
    {
        CppUnit::TestSuite *ts=new CppUnit::TestSuite("SingleAttribute Tests");

        ts->addTest(new CppUnit::TestCaller<SingleAttributeTest>(
                    "type() Test",
                    &SingleAttributeTest::test_type));

        ts->addTest(new CppUnit::TestCaller<SingleAttributeTest>(
                    "name() Test",
                    &SingleAttributeTest::test_name));
        
        ts->addTest(new CppUnit::TestCaller<SingleAttributeTest>(
                    "value() Test",
                    &SingleAttributeTest::test_value));
        
        ts->addTest(new CppUnit::TestCaller<SingleAttributeTest>(
                    "marshall() Test",
                    &SingleAttributeTest::test_marshall));
        
        ts->addTest(new CppUnit::TestCaller<SingleAttributeTest>(
                    "to_xml() Test",
                    &SingleAttributeTest::test_xml));

        ts->addTest(new CppUnit::TestCaller<SingleAttributeTest>(
                    "replace() Test",
                    &SingleAttributeTest::test_replace));
        return ts;
    }
};

int main(int argc, char ** argv)
{
    CppUnit::TextUi::TestRunner tr;
    
    tr.addTest(SingleAttributeTest::suite());
    tr.run();

    return 0;
}
