#include "Template.h"

#include <string>
#include <iostream>

#include <TestFixture.h>
#include <TestAssert.h>
#include <TestSuite.h>
#include <TestCaller.h>
#include <ui/text/TestRunner.h>

using namespace std;

class TemplateTest : public CppUnit::TestFixture 
{
private:
    Template *t, *tr;
    string   test_ok;
    string   test_ok_marshall;
    string   test_ok_xml;
    string   test_ok_str;

public:
    void setUp()
    {
        t = new Template();
        tr= new Template(true);

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

        test_ok_xml="<TEMPLATE><CPU>4</CPU><DISK><EXTRA>disk attribute </EXTRA>"
            "<FILE>path1</FILE></DISK><DISK><EXTRA>str</EXTRA><FILE>path2</FILE>"
            "<TYPE>disk</TYPE></DISK><EMPTY_VAR></EMPTY_VAR><GRAPHICS>"
            "<PORT>12</PORT><VNC>127.0.0.1</VNC></GRAPHICS><MEMORY>345</MEMORY>"
            "<REQUIREMENTS>HOSTNAME = \"host*.com\"</REQUIREMENTS></TEMPLATE>";

        test_ok_str=
            "\n\tCPU=4"
            "\n\tDISK=EXTRA=disk attribute ,FILE=path1"
            "\n\tDISK=EXTRA=str,FILE=path2,TYPE=disk"
            "\n\tEMPTY_VAR="
            "\n\tGRAPHICS=PORT=12,VNC=127.0.0.1"
            "\n\tMEMORY=345"
            "\n\tREQUIREMENTS=HOSTNAME = \"host*.com\"";
    }

    void tearDown()
    {
        delete t;
        delete tr;
    }

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


    void test_marshall()
    {
        char * error = 0;
        int    rc;
        string tmp;

        rc = t->parse(test_ok,&error);

        CPPUNIT_ASSERT( rc == 0);

        t->marshall(tmp);

        CPPUNIT_ASSERT(test_ok_marshall == tmp);
    }

    void test_xml()
    {
        char * error = 0;
        int    rc;
        string tmp;

        rc = t->parse(test_ok,&error);
        
        CPPUNIT_ASSERT( rc == 0);

        t->to_xml(tmp);

        CPPUNIT_ASSERT(test_ok_xml == tmp);
    }
    
    void test_str()
    {
        char * error = 0;
        int    rc;
        string tmp;

        rc = t->parse(test_ok,&error);
        
        CPPUNIT_ASSERT( rc == 0);

        t->to_str(tmp);

        CPPUNIT_ASSERT(test_ok_str == tmp);
    }

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

        return ts;
    }
};

int main(int argc, char ** argv)
{
    CppUnit::TextUi::TestRunner tr;
    
    tr.addTest(TemplateTest::suite());
    tr.run();

    return 0;
}
