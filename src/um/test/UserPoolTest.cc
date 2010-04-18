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

#include <TestFixture.h>
#include <TestAssert.h>
#include <TestSuite.h>
#include <TestCaller.h>
#include <ui/text/TestRunner.h>
#include <cppunit/extensions/HelperMacros.h>
#include <unistd.h>

#include "UserPool.h"
#include "SqliteDB.h"

using namespace std;

/* ************************************************************************* */
/* ************************************************************************* */

class UserPoolTest : public CppUnit::TestFixture
{
    CPPUNIT_TEST_SUITE (UserPoolTest);
    CPPUNIT_TEST (sha1_digest);
    CPPUNIT_TEST (initial_user);
    CPPUNIT_TEST (authenticate);
    CPPUNIT_TEST (get_from_cache);
    CPPUNIT_TEST (get_from_db);
    CPPUNIT_TEST (drop_and_get);
    CPPUNIT_TEST (update);
    CPPUNIT_TEST (dump);
    CPPUNIT_TEST_SUITE_END ();

private:
    UserPool * pool;
    SqlDB * db;

    User* user;


public:
    UserPoolTest(){};

    ~UserPoolTest(){};

    void setUp()
    {
        string db_name = "test.db";
        unlink("test.db");

        db = new SqliteDB(db_name);


        UserPool::bootstrap(db);

        // The UserPool constructor checks if the DB contains at least
        // one user, and adds one automatically from the ONE_AUTH file.
        // So the ONE_AUTH environment is forced to point to a test one_auth
        // file.

        ostringstream oss;

        oss << getenv("PWD") << "/one_auth";
        setenv("ONE_AUTH", oss.str().c_str(), 1);

        pool = new UserPool(db);
    };

    void tearDown()
    {
        delete db;
        delete pool;
        remove ("test.db");
    };

    /* ********************************************************************* */
    /* ********************************************************************* */

    void sha1_digest()
    {
        string st   = "top_secret_string";
        string sha1 = "773260f433f7fd6f89c1f1bfc32e080fc0748478";

        CPPUNIT_ASSERT( sha1 == User::sha1_digest(st) );
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

        user = pool->get(0, false);
        CPPUNIT_ASSERT(user != 0);

        CPPUNIT_ASSERT( user->get_uid()      == 0 );
        CPPUNIT_ASSERT( user->get_username() == "one_user_test" );
        CPPUNIT_ASSERT( user->get_password() == User::sha1_digest("password") );
    }

    void authenticate()
    {
        // There is an initial user, created with the one_auth file:
        //      one_user_test:password
        string session =
                "one_user_test:5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8";
        int oid = pool->authenticate( session );
        CPPUNIT_ASSERT( oid == 0 );

        session = "one_user_test:wrong_password";
        oid = pool->authenticate( session );
        CPPUNIT_ASSERT( oid == -1 );

        session =
                "unknown_user:5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8";
        oid = pool->authenticate( session );
        CPPUNIT_ASSERT( oid == -1 );
    }

    // Try to allocate two objects, and retrieve them
    void get_from_cache()
    {
        string username_1 = "A user";
        string username_2 = "B user";

        string pass_1     = "A pass";
        string pass_2     = "B pass";

        int oid_1, oid_2;

        pool->allocate(&oid_1, username_1, pass_1, true);
        // first element in the pool should have oid=1 (the 0th one is created
        // by the UserPool constructor)
        CPPUNIT_ASSERT(oid_1 == 1);

        pool->allocate(&oid_2, username_2, pass_2, true);
        // second element in the pool should have oid=2
        CPPUNIT_ASSERT(oid_2 == 2);


        // ---------------------------------
        user = pool->get(oid_1, false);
        CPPUNIT_ASSERT(user != 0);

        CPPUNIT_ASSERT( user->get_uid()      == 1 );
        CPPUNIT_ASSERT( user->get_username() == username_1 );
        CPPUNIT_ASSERT( user->get_password() == pass_1 );

        // ---------------------------------
        user = pool->get(oid_2, true);
        CPPUNIT_ASSERT(user != 0);

        CPPUNIT_ASSERT( user->get_uid()      == 2 );
        CPPUNIT_ASSERT( user->get_username() == username_2 );
        CPPUNIT_ASSERT( user->get_password() == pass_2 );
        user->unlock();
    };

    // Try to allocate two objects, and retrieve them
    void get_from_db()
    {
        string username_1 = "A user";
        string username_2 = "B user";

        string pass_1     = "A pass";
        string pass_2     = "B pass";

        int oid_1, oid_2;

        pool->allocate(&oid_1, username_1, pass_1, true);
        pool->allocate(&oid_2, username_2, pass_2, true);

        string str;
        // Get the xml representation of the two users
        string xml_1 = pool->get(oid_1, false)->to_xml(str);
        string xml_2 = pool->get(oid_2, false)->to_xml(str);

        // Clean the users from the cache, forcing the pool to read them from
        // the DB when we retrieve them
        pool->clean();

        // ---------------------------------
        user = pool->get(oid_1, false);
        CPPUNIT_ASSERT(user != 0);

        // The user objects constructed from the data in the DB should be the
        // same as the previous ones
        CPPUNIT_ASSERT(user->to_xml(str)    == xml_1);

        CPPUNIT_ASSERT(user->get_uid()      == oid_1);
        CPPUNIT_ASSERT(user->get_username() == username_1);
        CPPUNIT_ASSERT(user->get_password() == pass_1);

        // ---------------------------------
        user = pool->get(oid_2, true);
        CPPUNIT_ASSERT(user != 0);

        CPPUNIT_ASSERT(user->to_xml(str)    == xml_2);

        CPPUNIT_ASSERT(user->get_uid()      == oid_2);
        CPPUNIT_ASSERT(user->get_username() == username_2);
        CPPUNIT_ASSERT(user->get_password() == pass_2);
        user->unlock();
    };

    void drop_and_get()
    {
        string username_1 = "A user";
        string username_2 = "B user";

        string pass_1    = "A pass";
        string pass_2    = "B pass";

        int oid_1, oid_2;

        pool->allocate(&oid_1, username_1, pass_1, true);
        pool->allocate(&oid_2, username_2, pass_2, true);

        // Get the first user (A)
        user = pool->get(oid_1,true);
        CPPUNIT_ASSERT(user != 0);

        // Delete it
        pool->drop(user);
        user->unlock();

        // It should be gone now
        user = pool->get(oid_1,true);
        CPPUNIT_ASSERT(user == 0);

        // The cache is cleaned, the user should be also gone from the DB
        pool->clean();
        user = pool->get(oid_1,true);
        CPPUNIT_ASSERT(user == 0);

        // But the other user must be accessible
        user = pool->get(oid_2,false);
        CPPUNIT_ASSERT(user != 0);
    };

    void update()
    {
        string username_1 = "A user";
        string pass_1    = "A pass";

        int oid_1, oid_2;

        // Allocate some users, to popullate the DB
        pool->allocate(&oid_2, "someone",   pass_1, true);
        pool->allocate(&oid_2, "some_user", pass_1, true);

        // The user we are interested in
        pool->allocate(&oid_1, username_1, pass_1, true);

        // Some more users...
        pool->allocate(&oid_2, "not_used",  pass_1, true);
        pool->allocate(&oid_2, "no_name",   pass_1, true);


        user = pool->get(oid_1, true);

        // User object should be cached. Let's update its status
        user->disable();

        pool->update(user);
        user->unlock();


        // When the user is updated, there should be only one entry at the DB
        vector<int>     results;
        int             rc;
        ostringstream   oss;

        oss << "oid = " << oid_1;

        rc = pool->search(results,"user_pool", oss.str());
        
        CPPUNIT_ASSERT(rc             == 0);
        CPPUNIT_ASSERT(results.size() == 1);
        CPPUNIT_ASSERT(results.at(0)  == oid_1);

        user = pool->get(oid_1,false);
        CPPUNIT_ASSERT( user->isEnabled() == false );

        //Now force access to DB

        pool->clean();
        user = pool->get(oid_1,false);
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


        string names[] = {"a", "a name", "a_name", "another name", "user"};
        string pass[]  = {"p", "pass", "password", "secret", "1234"};

        int oid;

        for(int i=0; i<5; i++)
        {
            pool->allocate(&oid, names[i], pass[i], true);
        }

        ostringstream oss;
        pool->dump(oss, "");

        CPPUNIT_ASSERT( oss.str() == xml_result );

        // Allocate and delete a new user
        pool->allocate(&oid, "new name", "new pass", true);
        user = pool->get(oid, true);
        pool->drop(user);
        user->unlock();

        ostringstream new_oss;
        pool->dump(new_oss, "");

        CPPUNIT_ASSERT( new_oss.str() == xml_result );
    }
};

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    CppUnit::TextUi::TestRunner runner;
    runner.addTest( UserPoolTest::suite() );
    runner.run();
    return 0;
}
