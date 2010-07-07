#include "TemplateSQL.h"
#include "SqliteDB.h"
#include "SqlDB.h"
#include "MySqlDB.h"
#include "Log.h"

#include <string>
#include <iostream>
#include <unistd.h>
#include <getopt.h>

#include <TestFixture.h>
#include <TestAssert.h>
#include <TestSuite.h>
#include <TestCaller.h>
#include <ui/text/TestRunner.h>
#include <cppunit/extensions/HelperMacros.h>

using namespace std;

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

/* --------------------------------------- */
/*   WRAPPER TO ACCESS TEMPLATESQL CLASS   */
/* --------------------------------------- */

class TSQL : public TemplateSQL
{
public:
    TSQL(const char * _table,
         int          template_id = -1,
         bool         replace     = false,
         const char   separator   = '=',
         const char * xml_root    = "TEMPLATE"):
        TemplateSQL(_table,template_id,replace,separator,xml_root){}

    ~TSQL(){}

    /* --------------------------------------------------------------------- */
    int insert(SqlDB * db){return TemplateSQL::insert(db);}
    int update(SqlDB * db){return TemplateSQL::update(db);}
    int select(SqlDB * db){return TemplateSQL::select(db);}
    int drop  (SqlDB * db){return TemplateSQL::drop(db);}

    /* --------------------------------------------------------------------- */
    int replace_attribute(SqlDB * db, Attribute * attr)
        {return TemplateSQL::replace_attribute(db,attr);}
    int insert_attribute(SqlDB * db, Attribute * attr)
        {return TemplateSQL::insert_attribute(db,attr);}
    int remove_attribute(SqlDB * db, const string& name)
        {return TemplateSQL::remove_attribute(db,name);};
    /* --------------------------------------------------------------------- */
    int id(){return TemplateSQL::id;};
    void sid(int i){TemplateSQL::id = i;}
};

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

class TemplateSQLTest : public CppUnit::TestFixture
{

    CPPUNIT_TEST_SUITE (TemplateSQLTest);

    CPPUNIT_TEST (test_insert);
    CPPUNIT_TEST (test_update);
    CPPUNIT_TEST (test_select);
    CPPUNIT_TEST (test_drop);
    CPPUNIT_TEST (test_replace_attribute);
    CPPUNIT_TEST (test_insert_attribute);
    CPPUNIT_TEST (test_remove_attribute);

    CPPUNIT_TEST_SUITE_END ();

private:
    SqlDB *db;

    string db_name;

    string template_ok;
    string template_xml;

public:
    // Global flag to use either Sqlite or MySQL
    static bool mysql;

    /* --------------------------------------------------------------------- */
    /* --------------------------------------------------------------------- */

    TemplateSQLTest()
    {
        db_name  = "ONE_test_database";

        template_ok =
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

        template_xml =
            "<TEMPLATE><CPU><![CDATA[4]]></CPU><DISK><EXTRA><![CDATA[disk attribute ]]></EXTRA><FILE><![CDATA[path1]]></FILE></DISK><DISK><EXTRA><![CDATA[str]]></EXTRA><FILE><![CDATA[path2]]></FILE><TYPE><![CDATA[disk]]></TYPE></DISK><EMPTY_VAR><![CDATA[]]></EMPTY_VAR><GRAPHICS><PORT><![CDATA[12]]></PORT><VNC><![CDATA[127.0.0.1]]></VNC></GRAPHICS><MEMORY><![CDATA[345]]></MEMORY><REQUIREMENTS><![CDATA[HOSTNAME = \"host*.com\"]]></REQUIREMENTS></TEMPLATE>";
    }

    ~TemplateSQLTest(){};

    /* --------------------------------------------------------------------- */
    /* --------------------------------------------------------------------- */

    void setUp()
    {
        if (mysql)
        {
            db = new MySqlDB("localhost","oneadmin","oneadmin",NULL);

            ostringstream   oss1;
            oss1 << "DROP DATABASE IF EXISTS " << db_name;
            db->exec(oss1);

            ostringstream   oss;
            oss << "CREATE DATABASE " << db_name;
            db->exec(oss);

            ostringstream   oss2;
            oss2 << "use " << db_name;
            db->exec(oss2);
        }
        else
        {
            unlink(db_name.c_str());

            db = new SqliteDB(db_name);
        }

        ostringstream db_bs(
                "CREATE TABLE IF NOT EXISTS template (id INTEGER, "
                "name TEXT, type INTEGER, value TEXT)");

        CPPUNIT_ASSERT(db->exec(db_bs) == 0);
    }

    void tearDown()
    {
        if (mysql)
        {
            ostringstream   oss;
            oss << "DROP DATABASE IF EXISTS " << db_name;
            db->exec(oss);
        }
        else
        {
            unlink(db_name.c_str());
        }

        if( db != 0 )
            delete db;
    }

    /* ********************************************************************* */
    /* ********************************************************************* */

    void test_insert()
    {
        char * error = 0;
        int    rc;
        string tmp;
        TSQL   t("template");

        rc = t.parse(template_ok,&error);

        if ( error != 0 )
        {
            cerr << error << endl;
            free(error);
        }

        CPPUNIT_ASSERT( rc == 0);

        t.sid(0);
        CPPUNIT_ASSERT( t.insert(db) == 0 );
        CPPUNIT_ASSERT( t.id() == 0 );

        t.sid(1);
        CPPUNIT_ASSERT( t.insert(db) == 0 );
        CPPUNIT_ASSERT( t.id() == 1 );
    }

    /* --------------------------------------------------------------------- */

    void test_update()
    {
        int         rc;
        string      att_name = "NEW_ATT";
        string      value = "";

        ostringstream db_bs(
          "CREATE TABLE IF NOT EXISTS template_replace (id INTEGER, "
          "name VARCHAR(256), type INTEGER, value TEXT, PRIMARY KEY(id,name))");

        CPPUNIT_ASSERT(db->exec(db_bs) == 0);

        TSQL t ("template_replace",0);
        TSQL t2("template_replace",0);

        // Insert template t into the DB
        t.insert(db);

        // Add a new vector attribute to t, and insert it into the DB
        SingleAttribute * s_att = new SingleAttribute(att_name, "some value");
        t.insert_attribute(db, ((Attribute*)s_att));


        // Now replace the attribute's value
        s_att->replace("a new value");

        // And update the DB
        t.update(db);

        // Read from the DB to t2
        rc = t2.select(db);
        CPPUNIT_ASSERT( rc == 0 );

        t2.get(att_name, value);
        CPPUNIT_ASSERT( value == "a new value" );
    }

    /* --------------------------------------------------------------------- */

    void test_select()
    {
        char * error = 0;

        TSQL t("template");
        TSQL t2("template",23);

        string t2_xml;

        t.sid(23);
        t.parse(template_ok,&error);

        int rc = t.insert(db);
        CPPUNIT_ASSERT( rc == 0 );

        if ( error != 0 )
        {
            free(error);
        }

        CPPUNIT_ASSERT( t2.select(db) == 0 );

        t2.to_xml(t2_xml);

        CPPUNIT_ASSERT( t2_xml == template_xml );
    }

    /* --------------------------------------------------------------------- */

    void test_drop()
    {
        char *  error = 0;
        string  str   = "";

        TSQL t ("template",0);
        TSQL t2("template",0);

        t.parse(template_ok,&error);
        t.insert(db);

        if ( error != 0 )
        {
            free(error);
        }

        // Drop the template from the DB
        t.drop(db);

        // Try to read it from the DB
        CPPUNIT_ASSERT( t2.select(db) == 0 );
        // It should be empty
        CPPUNIT_ASSERT( t2.to_str(str) == "" );
    }

    /* --------------------------------------------------------------------- */

    void test_replace_attribute()
    {
        int         rc;
        string      att_name = "NEW_ATT";
        string      value = "";


        TSQL t ("template",0);
        TSQL t2("template",0);

        // Add a new vector attribute to t, and insert it into the DB
        VectorAttribute * v_att = new VectorAttribute(att_name);
        v_att->replace("A", "A value");
        v_att->replace("B", "B value");
        v_att->replace("C", "C value");

        t.insert(db);
        t.insert_attribute(db, ((Attribute*)v_att));



        // Now replace its value, with a single value attribute
        SingleAttribute * s_att = new SingleAttribute(att_name, "some value");

        t.replace_attribute(db, ((Attribute*)s_att) );


        // Read from the DB to t2
        rc = t2.select(db);
        CPPUNIT_ASSERT( rc == 0 );

        t2.get(att_name, value);
        CPPUNIT_ASSERT( value == "some value" );
    }

    /* --------------------------------------------------------------------- */

    void test_insert_attribute()
    {
        Attribute * att;
        int         rc;
        string      att_name = "NEW_ATT";
        string      value = "";


        TSQL t ("template",0);
        TSQL t2("template",0);

        // Add a new attribute to t, and insert it into the DB
        att = new SingleAttribute(att_name, "some value");

        t.insert(db);
        t.insert_attribute(db, att);

        // Read from the DB to t2
        rc = t2.select(db);
        CPPUNIT_ASSERT( rc == 0 );

        t2.get(att_name, value);
        CPPUNIT_ASSERT( value == "some value" );
    }

    /* --------------------------------------------------------------------- */

    void test_remove_attribute()
    {
        Attribute * att;
        int         rc;
        string      att_name = "NEW_ATT";
        string      value = "";


        TSQL t ("template",0);
        TSQL t2("template",0);

        // Add a new attribute to t, and insert it into the DB
        att = new SingleAttribute(att_name, "some value");

        t.insert(db);
        t.insert_attribute(db, att);

        t.remove_attribute(db, att_name);

        // Read from the DB to t2
        rc = t2.select(db);
        CPPUNIT_ASSERT( rc == 0 );

        t2.get(att_name, value);
        CPPUNIT_ASSERT( value == "" );
    }
};

/* ************************************************************************* */

bool TemplateSQLTest::mysql;

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

static void show_options ()
{
    cout << "Options:\n";
    cout << "    -h  --help         Show this help\n"
            "    -s  --sqlite       Run Sqlite tests (default)\n"
            "    -m  --mysql        Run MySQL tests\n"
            "    -l  --log          Keep the log file, test.log\n";
}

int main(int argc, char ** argv)
{

    // Option flags
    bool sqlite_flag = true;
    bool log_flag    = false;

    // Long options
    const struct option long_opt[] =
    {
        { "sqlite", 0,  NULL,   's'},
        { "mysql",  0,  NULL,   'm'},
        { "log",    0,  NULL,   'l'},
        { "help",   0,  NULL,   'h'}
    };

    int c;
    while ((c = getopt_long (argc, argv, "smlh", long_opt, NULL)) != -1)
        switch (c)
        {
            case 'm':
                sqlite_flag = false;
                break;
            case 'l':
                log_flag = true;
                break;
            case 'h':
                show_options();
                return 0;
        }


    CppUnit::TextUi::TestRunner tr;

    tr.addTest(TemplateSQLTest::suite());

    NebulaLog::init_log_system(NebulaLog::FILE, Log::DEBUG, "test.log");
    NebulaLog::log("Test", Log::INFO, "Test started");


    if (sqlite_flag)
    {
        TemplateSQLTest::mysql = false;
        NebulaLog::log("Test", Log::INFO, "Running Sqlite tests...");
        cout << "\nRunning Sqlite tests...\n";
    }
    else
    {
        TemplateSQLTest::mysql = true;
        NebulaLog::log("Test", Log::INFO, "Running MySQL tests...");
        cout << "\nRunning MySQL tests...\n";
    }


    tr.run();


    if (!log_flag)
        remove("test.log");

    NebulaLog::finalize_log_system();

    return 0;
}
