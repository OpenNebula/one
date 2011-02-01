#include "Template.h"

#include <string>
#include <iostream>

#include "test/OneUnitTest.h"

using namespace std;

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

class TemplateTest : public OneUnitTest
{
    CPPUNIT_TEST_SUITE (TemplateTest);

    CPPUNIT_TEST (test_parser);
    CPPUNIT_TEST (test_marshall);
    CPPUNIT_TEST (test_xml);
    CPPUNIT_TEST (test_str);
    CPPUNIT_TEST (test_get);
    CPPUNIT_TEST (test_remove);
    CPPUNIT_TEST (test_set);
    CPPUNIT_TEST (test_erase);
    CPPUNIT_TEST (test_from_xml);

    CPPUNIT_TEST_SUITE_END ();

private:
    Template *t, *tr, *t1;

    string   test_ok;
    string   test_ok_marshall;
    string   test_ok_xml;
    string   test_ok_str;

public:

    /* --------------------------------------------------------------------- */
    /* --------------------------------------------------------------------- */

    TemplateTest()
    {
        test_ok =
            "#This line is a comment\n"
            "  # Other comment\n"
            "MEMORY=345 # more comments behind an attribute\n"
            "   CPU     =         4\n"
            "#------------------------------\n"
            "#Comments in the middle\n"
            "#------------------------------\n"
            " empty_var = \n"
            "REQUIREMENTS = \"HOSTNAME = \\\"host*.com\\\"\"\n"
            " DISK= [file = path1, extra = \"disk attribute \"]\n"
            "DISK =[ FILE = \"path2\", EXTRA = str, TYPE=disk]\n"
            " graphics = [\n"
            "   VNC = \"127.0.0.1\",\n"
            "   PORT = 12\n"
            " ]\n";

        test_ok_marshall="CPU=4\nDISK=EXTRA=disk attribute @^_^@FILE=path1\n"
            "DISK=EXTRA=str@^_^@FILE=path2@^_^@TYPE=disk\nEMPTY_VAR=\n"
            "GRAPHICS=PORT=12@^_^@VNC=127.0.0.1\nMEMORY=345\n"
            "REQUIREMENTS=HOSTNAME = \"host*.com\"\n";

        test_ok_xml="<TEMPLATE><CPU><![CDATA[4]]></CPU><DISK><EXTRA>"
            "<![CDATA[disk attribute ]]></EXTRA><FILE><![CDATA[path1]]></FILE>"
            "</DISK><DISK><EXTRA><![CDATA[str]]></EXTRA><FILE><![CDATA[path2]]>"
            "</FILE><TYPE><![CDATA[disk]]></TYPE></DISK><EMPTY_VAR><![CDATA[]]>"
            "</EMPTY_VAR><GRAPHICS><PORT><![CDATA[12]]></PORT><VNC>"
            "<![CDATA[127.0.0.1]]></VNC></GRAPHICS><MEMORY><![CDATA[345]]>"
            "</MEMORY><REQUIREMENTS><![CDATA[HOSTNAME = \"host*.com\"]]>"
            "</REQUIREMENTS></TEMPLATE>";

        test_ok_str=
            "CPU=4\n"
            "DISK=EXTRA=disk attribute ,FILE=path1\n"
            "DISK=EXTRA=str,FILE=path2,TYPE=disk\n"
            "EMPTY_VAR=\n"
            "GRAPHICS=PORT=12,VNC=127.0.0.1\n"
            "MEMORY=345\n"
            "REQUIREMENTS=HOSTNAME = \"host*.com\"\n";
    }

    ~TemplateTest(){};

    /* --------------------------------------------------------------------- */
    /* --------------------------------------------------------------------- */

    void setUp()
    {
        char *error = 0;

        t = new Template();

        tr= new Template(true);
        tr->parse(test_ok,&error);

        t1= new Template();
        t1->parse(test_ok,&error);

        xmlInitParser();
    }

    void tearDown()
    {
        delete t;
        delete tr;
        delete t1;

        xmlCleanupParser();
    }

    /* ********************************************************************* */
    /* ********************************************************************* */

    void test_parser()
    {
        char * error = 0;
        int    rc;
        string tmp;

        rc = t->parse(test_ok,&error);

        if ( error != 0 )
        {
            cerr << error << endl;
            free(error);
        }

        CPPUNIT_ASSERT( rc == 0);
    }

    /* --------------------------------------------------------------------- */

    void test_marshall()
    {
        string tmp;

        t1->marshall(tmp);

        CPPUNIT_ASSERT(test_ok_marshall == tmp);
    }

    /* --------------------------------------------------------------------- */

    void test_xml()
    {
        string tmp;

        t1->to_xml(tmp);

        CPPUNIT_ASSERT(test_ok_xml == tmp);
    }

    /* --------------------------------------------------------------------- */

    void test_str()
    {
        string tmp;

        t1->to_str(tmp);

        CPPUNIT_ASSERT(test_ok_str == tmp);
    }

    /* --------------------------------------------------------------------- */

    void test_get()
    {
        vector<Attribute*> attrs;
        string             *tmp;

        CPPUNIT_ASSERT(t1->get("DISK",attrs) == 2 );

        CPPUNIT_ASSERT(attrs[0]->type() == Attribute::VECTOR);

        tmp = attrs[0]->to_xml();
        CPPUNIT_ASSERT( *tmp ==
            "<DISK><EXTRA><![CDATA[disk attribute ]]></EXTRA><FILE>"
            "<![CDATA[path1]]></FILE></DISK>");
        delete tmp;

        CPPUNIT_ASSERT(attrs[1]->type() == Attribute::VECTOR);

        tmp = attrs[1]->to_xml();
        CPPUNIT_ASSERT( *tmp ==
            "<DISK><EXTRA><![CDATA[str]]></EXTRA><FILE><![CDATA[path2]]>"
            "</FILE><TYPE><![CDATA[disk]]></TYPE></DISK>");
        delete tmp;

        CPPUNIT_ASSERT(t1->get("CPU",attrs) == 1 );

        CPPUNIT_ASSERT(attrs[2]->type() == Attribute::SIMPLE);

        tmp = attrs[2]->to_xml();
        CPPUNIT_ASSERT( *tmp == "<CPU><![CDATA[4]]></CPU>");
        delete tmp;

        string sval;
        string sname = "REQUIREMENTS";

        string iname = "MEMORY";
        int    ival;

        t1->get(iname,ival);
        t1->get(sname,sval);

        CPPUNIT_ASSERT ( ival == 345 );
        CPPUNIT_ASSERT ( sval == "HOSTNAME = \"host*.com\"");

    }

    /* --------------------------------------------------------------------- */

    void test_remove()
    {
        vector<Attribute*> attrs;

        string t1_xml;
        string rm_xml="<TEMPLATE><CPU><![CDATA[4]]></CPU><EMPTY_VAR>"
            "<![CDATA[]]></EMPTY_VAR><GRAPHICS><PORT><![CDATA[12]]></PORT><VNC>"
            "<![CDATA[127.0.0.1]]></VNC></GRAPHICS><MEMORY><![CDATA[345]]>"
            "</MEMORY><REQUIREMENTS><![CDATA[HOSTNAME = \"host*.com\"]]>"
            "</REQUIREMENTS></TEMPLATE>";

        t1->remove("DISK",attrs);
        t1->to_xml(t1_xml);

        CPPUNIT_ASSERT(t1_xml == rm_xml);

        delete attrs[0];
        delete attrs[1];
    }


    /* --------------------------------------------------------------------- */

    void test_set()
    {
        string t1_xml="<TEMPLATE><CPU><![CDATA[4]]></CPU><DISK><EXTRA>"
            "<![CDATA[disk attribute ]]></EXTRA><FILE><![CDATA[path1]]>"
            "</FILE></DISK><DISK><EXTRA><![CDATA[str]]></EXTRA><FILE>"
            "<![CDATA[path2]]></FILE><TYPE><![CDATA[disk]]></TYPE></DISK>"
            "<EMPTY_VAR><![CDATA[]]></EMPTY_VAR><GRAPHICS><PORT><![CDATA[12]]>"
            "</PORT><VNC><![CDATA[127.0.0.1]]></VNC></GRAPHICS><MEMORY>"
            "<![CDATA[345]]></MEMORY><REQUIREMENTS>"
            "<![CDATA[HOSTNAME = \"host*.com\"]]></REQUIREMENTS><XTRA>"
            "<![CDATA[44]]></XTRA></TEMPLATE>";
        string xml;

        string nattr = "XTRA";
        string vattr = "44";

        SingleAttribute *a = new SingleAttribute(nattr,vattr);

        t1->set(a);
        t1->to_xml(xml);

        CPPUNIT_ASSERT(t1_xml == xml);

        nattr = "CPU";
        vattr = "5";

        t1_xml="<TEMPLATE><CPU><![CDATA[4]]></CPU><CPU><![CDATA[5]]></CPU><DISK"
        "><EXTRA><![CDATA[disk attribute ]]></EXTRA><FILE><![CDATA[path1]]>"
        "</FILE></DISK><DISK><EXTRA><![CDATA[str]]></EXTRA><FILE><![CDATA[path2"
        "]]></FILE><TYPE><![CDATA[disk]]></TYPE></DISK><EMPTY_VAR><![CDATA[]]>"
        "</EMPTY_VAR><GRAPHICS><PORT><![CDATA[12]]></PORT><VNC><![CDATA[127.0.0"
        ".1]]></VNC></GRAPHICS><MEMORY><![CDATA[345]]></MEMORY><REQUIREMENTS>"
        "<![CDATA[HOSTNAME = \"host*.com\"]]></REQUIREMENTS><XTRA><![CDATA[44]]"
        "></XTRA></TEMPLATE>";
        SingleAttribute *b = new SingleAttribute(nattr,vattr);

        t1->set(b);
        t1->to_xml(xml);

        CPPUNIT_ASSERT(t1_xml == xml);

        string tr_xml="<TEMPLATE><CPU><![CDATA[5]]></CPU><DISK><EXTRA><![CDATA["
        "str]]></EXTRA><FILE><![CDATA[path2]]></FILE><TYPE><![CDATA[disk]]></TY"
        "PE></DISK><EMPTY_VAR><![CDATA[]]></EMPTY_VAR><GRAPHICS><PORT><![CDATA["
        "12]]></PORT><VNC><![CDATA[127.0.0.1]]></VNC></GRAPHICS><MEMORY><![CDAT"
        "A[345]]></MEMORY><REQUIREMENTS><![CDATA[HOSTNAME = \"host*.com\"]]></R"
        "EQUIREMENTS></TEMPLATE>";
        SingleAttribute *c = new SingleAttribute(nattr,vattr);

        tr->set(c);
        tr->to_xml(xml);

        CPPUNIT_ASSERT(tr_xml == xml);
    }

    /* --------------------------------------------------------------------- */

    void test_erase()
    {
        // There are Single and Vector type attributes, and any att. can be
        // unique within the template, or not.

        int n;

        // Non-existing attribute
        n = t1->erase("NON_EXISTING_ATT");
        CPPUNIT_ASSERT( n == 0 );

        // CPU is a Unique & Single Att.
        n = t1->erase("CPU");
        CPPUNIT_ASSERT( n == 1 );

        // GRAPHICS is a Unique & Vector Att.
        n = t1->erase("GRAPHICS");
        CPPUNIT_ASSERT( n == 1 );

        // MEMORY is now a Multiple & Single Att.
        SingleAttribute* satt = new SingleAttribute("MEMORY", "123");
        t1->set(satt);

        n = t1->erase("MEMORY");
        CPPUNIT_ASSERT( n == 2 );

        // DISK is a Multiple & Vector Att.
        n = t1->erase("DISK");
        CPPUNIT_ASSERT( n == 2 );
    }

    /* --------------------------------------------------------------------- */

    void test_from_xml()
    {
        string      str1;
        string      str2;
        Template    t_xml;
        int         rc;

        // Generate a xml from a Template generated from a text template
        t1->to_xml(str1);
        CPPUNIT_ASSERT(test_ok_xml == str1);

        // Parse the xml in a new Template object
        rc = t_xml.from_xml(str1);
        CPPUNIT_ASSERT(rc == 0);

        // Check correct output of this xml-generated Template object
        t_xml.to_xml(str2);
        CPPUNIT_ASSERT(str1 == str2);

        str1 = "";
        str2 = "";

        t1->to_str(str1);
        t_xml.to_str(str2);

        CPPUNIT_ASSERT(str1 == str2);
    }
};

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return OneUnitTest::main(argc, argv, TemplateTest::suite());
}
