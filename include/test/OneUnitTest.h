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

#ifndef ONE_UNIT_TEST_H_
#define ONE_UNIT_TEST_H_

#include <string>
#include <iostream>
#include <stdlib.h>
#include <getopt.h>

#include <TestFixture.h>
#include <TestAssert.h>
#include <TestSuite.h>
#include <TestCaller.h>
#include <ui/text/TestRunner.h>
#include <cppunit/extensions/HelperMacros.h>
#include <cppunit/XmlOutputter.h>
#include <unistd.h>

#include "SqlDB.h"
#include "SqliteDB.h"
#include "MySqlDB.h"

using namespace std;

/* ************************************************************************* */
/* ************************************************************************* */

class OneUnitTest : public CppUnit::TestFixture
{
protected:
    // Global flag to use either Sqlite or MySQL
    static bool mysql;

    static SqlDB * db;
    static string db_name;
    static string xml_name;

public:

    void create_db()
    {
        if (mysql)
        {
            db = new MySqlDB(  "localhost",0,
                                "oneadmin","oneadmin",db_name);

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
    };

    void delete_db()
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

        if ( db != 0 )
        {
            delete db;
        }
    };

    static SqlDB * get_db()
    {
        return db;
    }

    static void set_one_auth(string path = "../../test/one_auth")
    {
        // The UserPool constructor checks if the DB contains at least
        // one user, and adds one automatically from the ONE_AUTH file.
        // So the ONE_AUTH environment is forced to point to a test one_auth
        // file.
        ostringstream oss;

        oss << getenv("PWD") << "/" << path;
        setenv("ONE_AUTH", oss.str().c_str(), 1);
    }

// *****************************************************************************
// *****************************************************************************


    static void show_options ()
    {
        cout << "Options:\n";
        cout << "    -h  --help         Show this help\n"
                "    -s  --sqlite       Run Sqlite tests (default)\n"
                "    -m  --mysql        Run MySQL tests\n"
                "    -l  --log          Keep the log file, test.log\n"
                "    -x  --xml          Create xml output files, for Hudson\n";
    }


    /*
     * Not a true main, but a static method that can be called from the
     * child classes' true main.
     * Options:
     *     s: run sqlite tests
     *     m: run mysql tests
     */
    static int main(int argc,
                    char ** argv,
                    CPPUNIT_NS::TestSuite* suite,
                    string xml_name = "output.xml")
    {

        // Option flags
        bool sqlite_flag = true;
        bool log_flag    = false;
        bool xml_flag    = false;

        // Long options
        const struct option long_opt[] =
        {
            { "sqlite", 0,  NULL,   's'},
            { "mysql",  0,  NULL,   'm'},
            { "log",    0,  NULL,   'l'},
            { "help",   0,  NULL,   'h'},
            { "xml",    0,  NULL,   'x'}
        };

        int c;
        while ((c = getopt_long (argc, argv, "smlhx", long_opt, NULL)) != -1)
            switch (c)
            {
                case 'm':
                    sqlite_flag = false;
                    break;
                case 'l':
                    log_flag = true;
                    break;
                case 'x':
                    xml_flag = true;
                    break;
                case 'h':
                    show_options();
                    return 0;
            }


        // When a DB query fails, it tries to log the error.
        // We need to set the log file, otherwise it will end in a dead-lock
        NebulaLog::init_log_system(NebulaLog::FILE, Log::DEBUG, "test.log");
        NebulaLog::log("Test", Log::INFO, "Test started");

        // Set the opennebula install location to be the current dir.
        // This will prevent some of the tests from writing the individual
        // VM log files in an existing OpenNebula installation
        setenv("ONE_LOCATION", ".", 1);

        CppUnit::TextUi::TestRunner runner;
        ofstream                    outputFile;

        if( xml_flag )
        {
            outputFile.open(xml_name.c_str());
            CppUnit::XmlOutputter* outputter =
                    new CppUnit::XmlOutputter(&runner.result(), outputFile);

            runner.setOutputter(outputter);
        }

        runner.addTest( suite );

        if (sqlite_flag)
        {
            OneUnitTest::mysql = false;
            NebulaLog::log("Test", Log::INFO, "Running Sqlite tests...");
            cout << "\nRunning Sqlite tests...\n";
        }
        else
        {
            OneUnitTest::mysql = true;
            NebulaLog::log("Test", Log::INFO, "Running MySQL tests...");
            cout << "\nRunning MySQL tests...\n";
        }

        runner.run();

        if( xml_flag )
        {
            outputFile.close();
        }

        if (!log_flag)
            remove("test.log");

        NebulaLog::finalize_log_system();

        return 0;
    }
};


/* -----------------------------------------------------------------------------

int main(int argc, char ** argv)
{
    return OneUnitTest::main(argc, argv, TestClass::suite());
}

----------------------------------------------------------------------------- */


#endif // ONE_UNIT_TEST_H_
