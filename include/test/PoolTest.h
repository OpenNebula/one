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

#ifndef POOL_TEST_H_
#define POOL_TEST_H_

#include <string>

#include "PoolSQL.h"
#include "Nebula.h"
#include "OneUnitTest.h"

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

class PoolTest : public OneUnitTest
{
protected:

    PoolSQL *       pool;
    PoolObjectSQL * obj;

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

    PoolTest():pool(0){};
    virtual ~PoolTest(){};

    /**
     *  Replaces all <REGTIME> elements, padding them with 0
     */
    string fix_regtimes(string& xml)
    {
        return fix_time(xml, "REGTIME");
    }

    string fix_stimes(string& xml)
    {
        return fix_time(xml, "STIME");
    }

    string fix_time(string& xml, string elem_name)
    {
        string start = "<"  + elem_name + ">";
        string replacement = "0000000000";
        size_t pos = 0;

        while( (pos = xml.find(start, pos)) != string::npos )
        {
            if ( xml[pos+start.size()] != '0' )
            {
                xml.replace( pos+start.size(), replacement.size(), replacement);
            }
            pos++;
        }

        return xml;
    }

public:

    void setUp()
    {
        create_db();

        bootstrap(db);

        pool = create_pool(db);
    };

    void tearDown()
    {
        delete_db();

        if ( pool != 0 )
        {
            delete pool;
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
        obj = pool->get(13, false);
        CPPUNIT_ASSERT( obj == 0 );

        // Allocate an object
        allocate(0);

        // Ask again for a non-existing oid
        obj = pool->get(213, false);
        CPPUNIT_ASSERT( obj == 0 );
    }

    void drop_and_get()
    {
        int oid_0, oid_1;
        string error_str;

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
        pool->drop(obj, error_str);

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
};

// -----------------------------------------------------------------------------

#endif // POOL_TEST_H_
