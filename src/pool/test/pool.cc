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

#include <string>
#include <iostream>
#include <getopt.h>

#include "test/OneUnitTest.h"
#include "PoolSQL.h"
#include "TestPoolSQL.h"

using namespace std;

/* ************************************************************************* */
/* ************************************************************************* */

class PoolTest : public OneUnitTest
{
    CPPUNIT_TEST_SUITE (PoolTest);
    CPPUNIT_TEST (allocate_get);
    CPPUNIT_TEST (wrong_get);
    CPPUNIT_TEST (search);
    CPPUNIT_TEST (cache_test);
    CPPUNIT_TEST (cache_name_test);
    CPPUNIT_TEST_SUITE_END ();

private:
    TestPool * pool;

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
        create_db();

        TestObjectSQL::bootstrap(db);

        pool = new TestPool(db);
    };

    void tearDown()
    {
        delete pool;
        delete_db();
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
        string          where   = "name = '" + stB + "'";
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
            ostringstream name;
            name << "A Test object " << i;

            create_allocate(i,name.str());

            obj_lock = pool->get(i, true);
            CPPUNIT_ASSERT(obj_lock != 0);
        }

        for (int i=14999 ; i < 15200 ; i++) //Works with just 1 cache line
        {
            ostringstream name;
            name << "A Test object " << i;

            create_allocate(i,name.str());
        }

        for (int i=14999; i < 15200 ; i++)
        {
            ostringstream name;
            name << "A Test object " << i;

            obj = pool->get(i, true);
            CPPUNIT_ASSERT(obj != 0);

            CPPUNIT_ASSERT(obj->number == i);
            CPPUNIT_ASSERT(obj->text   == name.str());
            obj->unlock();
        }

        for (int i=0 ; i < 14999 ; i++)
        {
            obj_lock = pool->get(i, false);
            obj_lock->unlock();
        }
    };


    void cache_name_test()
    {
        TestObjectSQL *obj;
        TestObjectSQL *obj_lock;

        ostringstream oss;
        string        err_str;

        //pin object in the cache, it can't be removed -
        //Should be set to MAX_POOL -1
        for (int i=0 ; i < 14999 ; i++)
        {
            oss.str("");
            oss << "obj_" << i;

            create_allocate(i, oss.str());

            obj_lock = pool->get(oss.str(), 0, true);
            CPPUNIT_ASSERT(obj_lock != 0);
        }

        for (int i=14999 ; i < 15200 ; i++) //Works with just 1 cache line
        {
            oss.str("");
            oss << "obj_" << i;

            create_allocate(i, oss.str());
        }

        for (int i=14999; i < 15200 ; i++)
        {
            oss.str("");
            oss << "obj_" << i;

            obj = pool->get(oss.str(), 0, true);
            CPPUNIT_ASSERT(obj != 0);

            CPPUNIT_ASSERT(obj->number      == i);
            CPPUNIT_ASSERT(obj->get_name()  == obj->text);
            CPPUNIT_ASSERT(obj->get_name()  == oss.str());
            obj->unlock();
        }

        // Delete some of the locked objects, and create new with the same name
        for (int i=10 ; i < 21 ; i++)
        {
            oss.str("");
            oss << "obj_" << i;

            obj_lock = pool->get(oss.str(), 0, false);
            CPPUNIT_ASSERT(obj_lock != 0);

            pool->drop(obj_lock, err_str);
            obj_lock->unlock();

            create_allocate(i, oss.str());
        }

        // Try to get the new objects
        for (int i=10 ; i < 21 ; i++)
        {
            oss.str("");
            oss << "obj_" << i;

            obj = pool->get(oss.str(), 0, true);

            CPPUNIT_ASSERT(obj != 0);

            CPPUNIT_ASSERT(obj->number      == i);
            CPPUNIT_ASSERT(obj->get_oid()   >= 15200);
            CPPUNIT_ASSERT(obj->get_name()  == oss.str());
            obj->unlock();
        }

        for (int i=0 ; i < 14999 ; i++)
        {
            obj_lock = pool->get(i, false);

            if ( obj_lock != 0 )
            {
                obj_lock->unlock();
            }
        }
    };
};

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return OneUnitTest::main(argc, argv, PoolTest::suite());
}
