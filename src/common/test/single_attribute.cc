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

#include "Attribute.h"

#include <string>
#include <iostream>

#include "test/OneUnitTest.h"

using namespace std;

class SingleAttributeTest : public OneUnitTest
{
    CPPUNIT_TEST_SUITE (SingleAttributeTest);

    CPPUNIT_TEST (test_type);
    CPPUNIT_TEST (test_name);
    CPPUNIT_TEST (test_value);
    CPPUNIT_TEST (test_marshall);
    CPPUNIT_TEST (test_xml);
    CPPUNIT_TEST (test_replace);

    CPPUNIT_TEST_SUITE_END ();

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
};

int main(int argc, char ** argv)
{
    return OneUnitTest::main(argc, argv, SingleAttributeTest::suite(),
                            "single_attribute.xml");
}
