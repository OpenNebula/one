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

#ifndef POOL_TEST_H_
#define POOL_TEST_H_

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
#include <unistd.h>

#include "SqlDB.h"
#include "SqliteDB.h"
#include "MySqlDB.h"
#include "PoolSQL.h"
#include "Nebula.h"

#include "test/one_test_common.h"

// Use this macro in sub-classes to add all the tests defined here
#define ALL_POOLTEST_CPPUNIT_TESTS()    \
    CPPUNIT_TEST (oid_assignment);      \
    CPPUNIT_TEST (get_from_cache);      \
    CPPUNIT_TEST (get_from_db);         \
    CPPUNIT_TEST (wrong_get);           \
    CPPUNIT_TEST (drop_and_get);        \

using namespace std;


/* ************************************************************************* */
/* ************************************************************************* */

class PoolTest : public CppUnit::TestFixture
{
private:
// Global flag to use either Sqlite or MySQL
static bool mysql;


protected:

    PoolSQL * pool;
    SqlDB * db;

    PoolObjectSQL* obj;

    static string db_name;

    /*
     * Bootstrap the DB with the neccessary tables for the test
     */
    virtual void bootstrap(SqlDB* db) = 0;

    /*
     * Create the appropiate pool
     */
    virtual PoolSQL* create_pool(SqlDB* db) = 0;


    /*
     * Allocate the indexth sample pool object
     */
    virtual int allocate(int index) = 0;

    /*
     * Check if the indexth sample object is equal to this one
     */
    virtual void check(int index, PoolObjectSQL* obj) = 0;

    PoolTest():pool(0),db(0){};
    virtual ~PoolTest(){};

public:

    void setUp()
    {
        if (mysql)
        {
            db = new MySqlDB("localhost",0,"oneadmin","oneadmin",NULL);

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

        bootstrap(db);

        pool = create_pool(db);
    };

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

	if ( pool != 0 )
	{
            delete pool;
	}

	if ( db != 0 )
	{
            delete db;
	}
    };

// *****************************************************************************

    void oid_assignment()
    {
        int oid;

        oid = allocate(0);
        // first element in the pool should have oid=0
        CPPUNIT_ASSERT(oid == 0);

        oid = allocate(1);
        // second element in the pool should have oid=1
        CPPUNIT_ASSERT(oid == 1);
    }

    // Try to allocate two objects, and retrieve them
    void get_from_cache()
    {
        int oid_0, oid_1;

        // Allocate two objects
        oid_0 = allocate(0);
        oid_1 = allocate(1);

        CPPUNIT_ASSERT(oid_0 != -1);
        CPPUNIT_ASSERT(oid_1 != -1);

        // ---------------------------------

        // Get first object and check its integrity
        obj = pool->get(oid_0, false);
        check(0, obj);

        // Same for the second, but ask it to be locked
        obj = pool->get(oid_1, true);
        if(obj != 0)
        {
            obj->unlock();
        }

        check(1, obj);
    };

    // Try to allocate two objects, and retrieve them
    void get_from_db()
    {
        int oid_0, oid_1;

        // Allocate two objects
        oid_0 = allocate(0);
        oid_1 = allocate(1);

        CPPUNIT_ASSERT(oid_0 != -1);
        CPPUNIT_ASSERT(oid_1 != -1);

        // Clean the cache, forcing the pool to read the objects from the DB
        pool->clean();

        // ---------------------------------
        // Get first object and check its integrity
        obj = pool->get(oid_0, false);
        check(0, obj);

        // Same for the second one, but ask it to be locked
        obj = pool->get(oid_1, true);
        if(obj != 0)
        {
            obj->unlock();
        }
        check(1, obj);

    };

    void wrong_get()
    {
        // The pool is empty
        // Non existing oid
        obj = pool->get(13, true);
        CPPUNIT_ASSERT( obj == 0 );

        // Allocate an object
        allocate(0);

        // Ask again for a non-existing oid
        obj = pool->get(213, true);
        CPPUNIT_ASSERT( obj == 0 );
    }

    void drop_and_get()
    {
        int oid_0, oid_1;

        // Allocate two objects
        oid_0 = allocate(0);
        oid_1 = allocate(1);

        CPPUNIT_ASSERT(oid_0 != -1);
        CPPUNIT_ASSERT(oid_1 != -1);

        // Get the first object
        obj = pool->get(oid_0, true);

        if(obj != 0)
        {
            obj->unlock();
        }

        CPPUNIT_ASSERT(obj != 0);

        obj->lock();

        // Delete it
        pool->drop(obj);

        if(obj != 0)
        {
            obj->unlock();
        }

        // It should be gone now
        obj = pool->get(oid_0, false);
        CPPUNIT_ASSERT(obj == 0);

        // The cache is cleaned, the object should be also gone from the DB
        pool->clean();
        obj = pool->get(oid_0, true);
        CPPUNIT_ASSERT(obj == 0);

        // But the other object must be accessible
        obj = pool->get(oid_1, false);
        check(1, obj);
    };


// *****************************************************************************


    static void show_options ()
    {
        cout << "Options:\n";
        cout << "    -h  --help         Show this help\n"
                "    -s  --sqlite       Run Sqlite tests (default)\n"
                "    -m  --mysql        Run MySQL tests\n"
                "    -l  --log          Keep the log file, test.log\n";
    }


    /*
     * Not a true main, but a static method that can be called from the
     * child classes' true main.
     * Options:
     *     s: run sqlite tests
     *     m: run mysql tests
     */
    static int main(int argc, char ** argv, CPPUNIT_NS::TestSuite* suite)
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


        // When a DB query fails, it tries to log the error.
        // We need to set the log file, otherwise it will end in a dead-lock
        NebulaLog::init_log_system(NebulaLog::FILE, Log::DEBUG, "test.log");
        NebulaLog::log("Test", Log::INFO, "Test started");

        CppUnit::TextUi::TestRunner runner;

        SETUP_XML_WRITER(runner, "output.xml")

        runner.addTest( suite );

        if (sqlite_flag)
        {
            PoolTest::mysql = false;
            NebulaLog::log("Test", Log::INFO, "Running Sqlite tests...");
            cout << "\nRunning Sqlite tests...\n";
        }
        else
        {
            PoolTest::mysql = true;
            NebulaLog::log("Test", Log::INFO, "Running MySQL tests...");
            cout << "\nRunning MySQL tests...\n";
        }

        runner.run();

	END_XML_WRITER

        if (!log_flag)
            remove("test.log");

        NebulaLog::finalize_log_system();

        return 0;
    }
};

// -----------------------------------------------------------------------------

bool PoolTest::mysql;

string PoolTest::db_name = "ONE_test_database";

// -----------------------------------------------------------------------------

#endif // POOL_TEST_H_
