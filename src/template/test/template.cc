#include "Template.h"

#include <string>
#include <iostream>

#include <TestFixture.h>
#include <TestAssert.h>
#include <TestSuite.h>
#include <TestCaller.h>
#include <ui/text/TestRunner.h>

using namespace std;

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

class TemplateTest : public CppUnit::TestFixture 
{
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
            "\n\tCPU=4"
            "\n\tDISK=EXTRA=disk attribute ,FILE=path1"
            "\n\tDISK=EXTRA=str,FILE=path2,TYPE=disk"
            "\n\tEMPTY_VAR="
            "\n\tGRAPHICS=PORT=12,VNC=127.0.0.1"
            "\n\tMEMORY=345"
            "\n\tREQUIREMENTS=HOSTNAME = \"host*.com\"";
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
    }

    void tearDown()
    {
        delete t;
        delete tr;
        delete t1;
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

    /* ********************************************************************* */
    /* ********************************************************************* */

    static CppUnit::TestSuite * suite()
    {
        CppUnit::TestSuite *ts=new CppUnit::TestSuite("Template Tests");

        ts->addTest(new CppUnit::TestCaller<TemplateTest>(
                    "parse() Test",
                    &TemplateTest::test_parser));
        
        ts->addTest(new CppUnit::TestCaller<TemplateTest>(
                    "marshall() Test",
                    &TemplateTest::test_marshall));

        ts->addTest(new CppUnit::TestCaller<TemplateTest>(
                    "xml() Test",
                    &TemplateTest::test_xml));

        ts->addTest(new CppUnit::TestCaller<TemplateTest>(
                    "str() Test",
                    &TemplateTest::test_str));

        ts->addTest(new CppUnit::TestCaller<TemplateTest>(
                    "get() Test",
                    &TemplateTest::test_get));

        ts->addTest(new CppUnit::TestCaller<TemplateTest>(
                    "remove() Test",
                    &TemplateTest::test_remove));

        ts->addTest(new CppUnit::TestCaller<TemplateTest>(
                    "set() Test",
                    &TemplateTest::test_set));
        return ts;
    }
};

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    CppUnit::TextUi::TestRunner tr;
    
    tr.addTest(TemplateTest::suite());
    tr.run();

    return 0;
}
