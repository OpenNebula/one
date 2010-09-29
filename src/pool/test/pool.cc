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

#include <string>
#include <iostream>
#include <getopt.h>

#include <TestFixture.h>
#include <TestAssert.h>
#include <TestSuite.h>
#include <TestCaller.h>
#include <ui/text/TestRunner.h>
#include <cppunit/extensions/HelperMacros.h>
#include <unistd.h>

#include "PoolSQL.h"
#include "TestPoolSQL.h"
#include "SqliteDB.h"
#include "MySqlDB.h"
#include "SqlDB.h"

#include "test/one_test_common.h"

using namespace std;

/* ************************************************************************* */
/* ************************************************************************* */
bool mysql;

class PoolTest : public CppUnit::TestFixture
{
    CPPUNIT_TEST_SUITE (PoolTest);
    CPPUNIT_TEST (allocate_get);
    CPPUNIT_TEST (wrong_get);
    CPPUNIT_TEST (search);
    CPPUNIT_TEST (cache_test);
    CPPUNIT_TEST_SUITE_END ();

private:
    TestPool * pool;
    SqlDB * db;

    int create_allocate(int n, string st)
    {
        string err;
        TestObjectSQL *obj = new TestObjectSQL(n,st);

        return pool->allocate(obj, err);
    };

public:
    PoolTest(){};

    ~PoolTest(){};

    void setUp()
    {
        string db_name = "testdb";

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

        TestObjectSQL::bootstrap(db);

        pool = new TestPool(db);
    };

    void tearDown()
    {
        delete db;
        delete pool;
    };

    /* ********************************************************************* */
    /* ********************************************************************* */

    // Try to allocate two objects, and retrieve them
    void allocate_get()
    {
        int n1      = 3;
        int n2      = 7;
        string st1  = "text number one";
        string st2  = "another text";

        TestObjectSQL *obj;
        int oid;

        oid = create_allocate(n1,st1);
        // first element in the pool should have oid=0
        CPPUNIT_ASSERT(oid == 0);

        oid = create_allocate(n2,st2);
        // second element in the pool should have oid=1
        CPPUNIT_ASSERT(oid == 1);

        // ---------------------------------
        obj = pool->get(0, false);
        CPPUNIT_ASSERT(obj != 0);

        CPPUNIT_ASSERT(obj->number == n1);
        CPPUNIT_ASSERT(obj->text   == st1);

        // ---------------------------------
        obj = pool->get(1, true);
        CPPUNIT_ASSERT(obj != 0);

        CPPUNIT_ASSERT(obj->number == n2);
        CPPUNIT_ASSERT(obj->text   == st2);
        obj->unlock();
    };

    void wrong_get()
    {
        int n1     = 2;
        string st1 = "object 2";

        TestObjectSQL *obj;
        int oid;

        oid = create_allocate(n1,st1);

        obj = pool->get(oid,true);
        CPPUNIT_ASSERT(obj != 0);

        obj->drop(db);
        obj->unlock();

        obj = pool->get(oid,true);
        CPPUNIT_ASSERT(obj == 0);

        pool->clean();
        obj = pool->get(oid,true);
        CPPUNIT_ASSERT(obj == 0);
    };

    void search()
    {
        int nA      = 13;
        int nB      = 17;
        string stA  = "String value for number 13";
        string stB  = "String value for number 17";

        int oidA = create_allocate(nA, stA);
        int oidB = create_allocate(nB, stB);

        vector<int>     results;
        const char *    table   = "test_pool";
        string          where   = "text = '" + stB + "'";
        int             ret;

        ret = pool->search(results, table, where);
        CPPUNIT_ASSERT(ret              == 0);
        CPPUNIT_ASSERT(results.size()  == 1);
        CPPUNIT_ASSERT(results.at(0)   == oidB);

        results.erase(results.begin(), results.end());

        where = "number < 18";

        ret = pool->search(results, table, where);
        CPPUNIT_ASSERT(ret              == 0);
        CPPUNIT_ASSERT(results.size()  == 2);
        CPPUNIT_ASSERT(results.at(0)   == oidA);
        CPPUNIT_ASSERT(results.at(1)   == oidB);
    };

    void cache_test()
    {
        TestObjectSQL *obj;
        TestObjectSQL *obj_lock;

	//pin object in the cache, it can't be removed -
        //Should be set to MAX_POOL -1
	for (int i=0 ; i < 14999 ; i++)
        {
            create_allocate(i,"A Test object");

	    obj_lock = pool->get(i, true);
            CPPUNIT_ASSERT(obj_lock != 0);
        }

        for (int i=14999 ; i < 15200 ; i++) //Works with just 1 cache line
        {
            create_allocate(i,"A Test object");
        }

        for (int i=14999; i < 15200 ; i++)
        {
            obj = pool->get(i, true);
            CPPUNIT_ASSERT(obj != 0);

            CPPUNIT_ASSERT(obj->number == i);
            CPPUNIT_ASSERT(obj->text   == "A Test object");
            obj->unlock();
        }

	for (int i=0 ; i < 14999 ; i++)
        {
	    obj_lock = pool->get(i, false);
	    obj_lock->unlock();
        }
    };
};

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    CppUnit::TextUi::TestRunner runner;
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
                cout << "Options:\n";
                cout << "    -h  --help         Show this help\n"
                        "    -s  --sqlite       Run Sqlite tests (default)\n"
                        "    -m  --mysql        Run MySQL tests\n"
                        "    -l  --log          Keep the log file, test.log\n";
                return 0;
        }

    NebulaLog::init_log_system(NebulaLog::FILE, Log::ERROR, "test.log");

    if (sqlite_flag)
    {
        mysql = false;
        NebulaLog::log("Test", Log::INFO, "Running Sqlite tests...");
        cout << "\nRunning Sqlite tests...\n";
    }
    else
    {
        mysql = true;
        NebulaLog::log("Test", Log::INFO, "Running MySQL tests...");
        cout << "\nRunning MySQL tests...\n";
    }

    SETUP_XML_WRITER(runner, "pool.xml")

    runner.addTest( PoolTest::suite() );
    runner.run();

    if (!log_flag)
        remove("test.log");

    END_XML_WRITER

    NebulaLog::finalize_log_system();

    return 0;
}
