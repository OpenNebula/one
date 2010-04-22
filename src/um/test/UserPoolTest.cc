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
#include <stdlib.h>

#include "UserPool.h"
#include "PoolTest.h"

using namespace std;

/* ************************************************************************* */
/* ************************************************************************* */

const string usernames[] = { "A user", "B user", "C user", "D user", "E user" };
const string passwords[] = { "A pass", "B pass", "C pass", "D pass", "E pass" };

class UserPoolTest : public PoolTest
{
    CPPUNIT_TEST_SUITE (UserPoolTest);

    // Not all tests from PoolTest can be used. Because
    // of the initial user added to the DB, the oid_assignment would fail.
    CPPUNIT_TEST (get_from_cache);
    CPPUNIT_TEST (get_from_db);
    CPPUNIT_TEST (wrong_get);
    CPPUNIT_TEST (drop_and_get);

    CPPUNIT_TEST (sha1_digest);
    CPPUNIT_TEST (split_secret);
    CPPUNIT_TEST (initial_user);
    CPPUNIT_TEST (authenticate);
    CPPUNIT_TEST (get_using_name);
    CPPUNIT_TEST (wrong_get_name);
    CPPUNIT_TEST (update);
    CPPUNIT_TEST (dump);

    CPPUNIT_TEST_SUITE_END ();

protected:

    string database_name()
    {
        return "user_pool_test";
    };

    void bootstrap(SqlDB* db)
    {
        UserPool::bootstrap(db);
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        return new UserPool(db);
    };

    int allocate(int index)
    {
        int oid;
        ((UserPool*)pool)->allocate(&oid, usernames[index], passwords[index], true);
        return oid;
    };

    void check(int index, PoolObjectSQL* obj)
    {
        CPPUNIT_ASSERT( obj != 0 );

        string name = ((User*)obj)->get_username();
        CPPUNIT_ASSERT( name == usernames[index] );
        CPPUNIT_ASSERT( ((User*)obj)->get_password() == passwords[index] );
    };

public:

    UserPoolTest()
    {
        // The UserPool constructor checks if the DB contains at least
        // one user, and adds one automatically from the ONE_AUTH file.
        // So the ONE_AUTH environment is forced to point to a test one_auth
        // file.
        ostringstream oss;

        oss << getenv("PWD") << "/one_auth";
        setenv("ONE_AUTH", oss.str().c_str(), 1);
    };

    ~UserPoolTest(){};

    /* ********************************************************************* */
    /* ********************************************************************* */

    void sha1_digest()
    {
        string st   = "top_secret_string";
        string sha1 = "773260f433f7fd6f89c1f1bfc32e080fc0748478";

        CPPUNIT_ASSERT( sha1 == User::sha1_digest(st) );
    }

    void split_secret()
    {
        string secret = "left_part-user.N  AME:pass--word..SECRET?";
        string left   = "";
        string right  = "";

        User::split_secret(secret, left, right);

        CPPUNIT_ASSERT( left  == "left_part-user.N  AME" );
        CPPUNIT_ASSERT( right == "pass--word..SECRET?" );
    }

    void initial_user()
    {
        // When creating a new pool, the constructor will check if the DB
        // contains at least one user.
        // If it doesn't, it adds one automatically from:
        //  * The $ONE_AUTH file.
        //  * The ~/.one/one_auth file.

        // The ONE_AUTH environment variable was forced to point to a prepared
        // one_auth file at set-up, so the pool should contain the user
        //      one_user_test:password

        User* user = (User*) pool->get(0, false);
        CPPUNIT_ASSERT(user != 0);

        CPPUNIT_ASSERT( user->get_uid()      == 0 );
        CPPUNIT_ASSERT( user->get_username() == "one_user_test" );
        CPPUNIT_ASSERT( user->get_password() == User::sha1_digest("password") );
    }

    void authenticate()
    {
        UserPool* user_pool = (UserPool*) pool;
        // There is an initial user, created with the one_auth file:
        //      one_user_test:password
        string session="one_user_test:5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8";

        int oid = user_pool->authenticate( session );
        CPPUNIT_ASSERT( oid == 0 );

        session = "one_user_test:wrong_password";
        oid = user_pool->authenticate( session );
        CPPUNIT_ASSERT( oid == -1 );

        session = "unknown_user:5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8";
        oid = user_pool->authenticate( session );
        CPPUNIT_ASSERT( oid == -1 );
    }

    void get_using_name()
    {
        int oid_0, oid_1;

        // Allocate two objects
        oid_0 = allocate(0);
        oid_1 = allocate(1);

        // ---------------------------------
        // Get first object and check its integrity
        obj = pool->get(oid_0, false);
        CPPUNIT_ASSERT( obj != 0 );
        check(0, obj);

        // Get using its name
        obj = ((UserPool*)pool)->get(usernames[1], true);
        check(1, obj);
        obj->unlock();

        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        pool->clean();

        // Get first object and check its integrity
        obj = pool->get(oid_0, false);
        check(0, obj);

        // Get using its name
        obj = ((UserPool*)pool)->get(usernames[1], true);
        check(1, obj);
        obj->unlock();
    };

    void wrong_get_name()
    {
        // The pool is empty
        // Non existing name
        obj = ((UserPool*)pool)->get("Wrong name", true);
        CPPUNIT_ASSERT( obj == 0 );

        // Allocate an object
        allocate(0);

        // Ask again for a non-existing name
        obj = ((UserPool*)pool)->get("Non existing name", true);
        CPPUNIT_ASSERT( obj == 0 );
    }

    void update()
    {
        int oid;
        User* user;

        // Allocate some users, to popullate the DB
        allocate(0);
        allocate(1);

        // The user we are interested in
        oid = allocate(2);

        // Some more users...
        allocate(3);
        allocate(4);


        user = ((UserPool*)pool)->get(oid, true);

        // User object should be cached. Let's update its status
        user->disable();

        pool->update(user);
        user->unlock();


        // When the user is updated, there should be only one entry at the DB
        vector<int>     results;
        int             rc;
        ostringstream   oss;

        oss << "oid = " << oid;

        rc = pool->search(results,"user_pool", oss.str());

        CPPUNIT_ASSERT(rc             == 0);
        CPPUNIT_ASSERT(results.size() == 1);
        CPPUNIT_ASSERT(results.at(0)  == oid);

        user = ((UserPool*)pool)->get(oid,false);
        CPPUNIT_ASSERT( user->isEnabled() == false );

        //Now force access to DB

        pool->clean();
        user = ((UserPool*)pool)->get(oid,false);
        CPPUNIT_ASSERT( user->isEnabled() == false );
    };

    void dump()
    {
        string xml_result =
            "<USER_POOL><USER><ID>0</ID><NAME>one_user_test</NAME>"
            "<PASSWORD>5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8</PASSWORD>"
            "<ENABLED>True</ENABLED></USER><USER><ID>1</ID><NAME>a</NAME>"
            "<PASSWORD>p</PASSWORD><ENABLED>True</ENABLED></USER><USER>"
            "<ID>2</ID><NAME>a name</NAME><PASSWORD>pass</PASSWORD>"
            "<ENABLED>True</ENABLED></USER><USER><ID>3</ID><NAME>a_name</NAME>"
            "<PASSWORD>password</PASSWORD><ENABLED>True</ENABLED></USER><USER>"
            "<ID>4</ID><NAME>another name</NAME><PASSWORD>secret</PASSWORD>"
            "<ENABLED>True</ENABLED></USER><USER><ID>5</ID><NAME>user</NAME>"
            "<PASSWORD>1234</PASSWORD><ENABLED>True</ENABLED></USER>"
            "</USER_POOL>";


        string d_names[] = {"a", "a name", "a_name", "another name", "user"};
        string d_pass[]  = {"p", "pass", "password", "secret", "1234"};

        int oid;

        for(int i=0; i<5; i++)
        {
            ((UserPool*)pool)->allocate(&oid, d_names[i], d_pass[i], true);
        }

        ostringstream oss;
        ((UserPool*)pool)->dump(oss, "");

        CPPUNIT_ASSERT( oss.str() == xml_result );

        // Allocate and delete a new user
        ((UserPool*)pool)->allocate(&oid, "new name", "new pass", true);
        User* user = ((UserPool*)pool)->get(oid, true);
        pool->drop(user);
        user->unlock();

        ostringstream new_oss;
        ((UserPool*)pool)->dump(new_oss, "");

        CPPUNIT_ASSERT( new_oss.str() == xml_result );
    }
};

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return PoolTest::main(argc, argv, UserPoolTest::suite());
}
