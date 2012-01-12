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
#include <map>

#include "test/OneUnitTest.h"

using namespace std;

class VectorAttributeTest : public OneUnitTest
{
    CPPUNIT_TEST_SUITE (VectorAttributeTest);

    CPPUNIT_TEST (test_type);
    CPPUNIT_TEST (test_name);
    CPPUNIT_TEST (test_value);
    CPPUNIT_TEST (test_marshall);
    CPPUNIT_TEST (test_xml);
    CPPUNIT_TEST (test_replace);

    CPPUNIT_TEST_SUITE_END ();

private:
    VectorAttribute   *a, *b;
    map<string,string> b_value;

public:
    void setUp()
    {
        string a_name = "vector_a";
        string b_name = "vector_b";

        b_value.insert(make_pair("attr1","val1"));
        b_value.insert(make_pair("attr2","val2"));
        b_value.insert(make_pair("attr3","val3"));

        a = new VectorAttribute(a_name);
        b = new VectorAttribute(b_name, b_value);
    }

    void tearDown()
    {
        delete a;
        delete b;
    }

    void test_type()
    {
        CPPUNIT_ASSERT(a->type() == Attribute::VECTOR);
        CPPUNIT_ASSERT(b->type() == Attribute::VECTOR);
    }

    void test_name()
    {
        CPPUNIT_ASSERT(a->name() == "VECTOR_A");
        CPPUNIT_ASSERT(b->name() == "VECTOR_B");
    }

    void test_value()
    {
        CPPUNIT_ASSERT(a->value().empty() == true);
        CPPUNIT_ASSERT(b->value() == b_value);

        CPPUNIT_ASSERT(a->vector_value("NAME").empty() == true);
        CPPUNIT_ASSERT(b->vector_value("NAME").empty() == true);

        CPPUNIT_ASSERT(b->vector_value("attr1") == "val1");
        CPPUNIT_ASSERT(b->vector_value("attr2") == "val2");
        CPPUNIT_ASSERT(b->vector_value("attr3") == "val3");
    }

    void test_marshall()
    {
        string *am, *bm;

        am = a->marshall();
        bm = b->marshall();

        CPPUNIT_ASSERT(am == 0);
        CPPUNIT_ASSERT(*bm == "attr1=val1@^_^@attr2=val2@^_^@attr3=val3");

        VectorAttribute c("vector_c");
        c.unmarshall(*bm);

        CPPUNIT_ASSERT(c.vector_value("attr1") == "val1");
        CPPUNIT_ASSERT(c.vector_value("attr2") == "val2");
        CPPUNIT_ASSERT(c.vector_value("attr3") == "val3");

        delete am;
        delete bm;
    }

    void test_xml()
    {
        string *am, *bm;

        am = a->to_xml();
        bm = b->to_xml();

        CPPUNIT_ASSERT(*am == "<VECTOR_A></VECTOR_A>");
        CPPUNIT_ASSERT(*bm == "<VECTOR_B><attr1><![CDATA[val1]]></attr1><attr2>"
                              "<![CDATA[val2]]></attr2><attr3><![CDATA[val3]]>"
                              "</attr3></VECTOR_B>");
        delete am;
        delete bm;
    }

    void test_replace()
    {
        map<string,string> nm;
        string nv = "new_val1";

        b->replace("attr1",nv);

        CPPUNIT_ASSERT(b->vector_value("attr1") == "new_val1");

        nm.insert(make_pair("other_attr1","other_val1"));
        nm.insert(make_pair("other_attr2","other_val2"));

        b->replace(nm);

        CPPUNIT_ASSERT(b->vector_value("other_attr1") == "other_val1");
        CPPUNIT_ASSERT(b->vector_value("other_attr2") == "other_val2");
        CPPUNIT_ASSERT(b->vector_value("attr3").empty() == true);
        CPPUNIT_ASSERT(b->value() == nm);
    }
};

int main(int argc, char ** argv)
{
    return OneUnitTest::main(argc, argv, VectorAttributeTest::suite(),
                            "vector_attribute.xml");
}
