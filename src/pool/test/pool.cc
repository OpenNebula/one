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

using namespace std;

/* ************************************************************************* */
/* ************************************************************************* */

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
    SqliteDB * db;

    int create_allocate(int n, string st)
    {
        TestObjectSQL *obj = new TestObjectSQL(n,st);

        return pool->allocate(obj);
    };

public:
    PoolTest(){};

    ~PoolTest(){};
  
    void setUp()
    {
        string db_name = "test.db";
        unlink("test.db");
        
        db = new SqliteDB(db_name);

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
	for (int i=0 ; i < 499 ; i++)
        {
            create_allocate(i,"A Test object");
	    
	    obj_lock = pool->get(i, true);
            CPPUNIT_ASSERT(obj_lock != 0);
        }
        
        for (int i=499 ; i < 2000 ; i++)
        {
            create_allocate(i,"A Test object");
        }

        for (int i=499; i < 2000 ; i++)
        {
            obj = pool->get(i, true);
            CPPUNIT_ASSERT(obj != 0);

            CPPUNIT_ASSERT(obj->number == i);
            CPPUNIT_ASSERT(obj->text   == "A Test object");
            obj->unlock();
        }

	for (int i=0 ; i < 499 ; i++)
        {	    
	    obj_lock = pool->get(i, false);//pin object in the cache, it can't be removed
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
    runner.addTest( PoolTest::suite() );
    runner.run();
    return 0;
}
