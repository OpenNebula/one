/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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
#include "SSLTools.h"

using namespace std;

/* ************************************************************************* */
/* ************************************************************************* */

const string usernames[] = { "A user", "B user", "C user", "D user", "E user" };
const string passwords[] = { "A pass", "B pass", "C pass", "D pass", "E pass" };

const string dump_result =
    "<USER_POOL><USER><ID>0</ID><GID>0</GID><NAME>one_user_test</NAME><PASSWORD>5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8</PASSWORD><ENABLED>1</ENABLED><GROUPS><ID>0</ID></GROUPS></USER><USER><ID>1</ID><GID>0</GID><NAME>a</NAME><PASSWORD>p</PASSWORD><ENABLED>1</ENABLED><GROUPS><ID>0</ID></GROUPS></USER><USER><ID>2</ID><GID>0</GID><NAME>a name</NAME><PASSWORD>pass</PASSWORD><ENABLED>1</ENABLED><GROUPS><ID>0</ID></GROUPS></USER><USER><ID>3</ID><GID>0</GID><NAME>a_name</NAME><PASSWORD>password</PASSWORD><ENABLED>1</ENABLED><GROUPS><ID>0</ID></GROUPS></USER><USER><ID>4</ID><GID>0</GID><NAME>another name</NAME><PASSWORD>secret</PASSWORD><ENABLED>1</ENABLED><GROUPS><ID>0</ID></GROUPS></USER><USER><ID>5</ID><GID>0</GID><NAME>user</NAME><PASSWORD>1234</PASSWORD><ENABLED>1</ENABLED><GROUPS><ID>0</ID></GROUPS></USER></USER_POOL>";

const string dump_where_result =
    "<USER_POOL><USER><ID>1</ID><GID>0</GID><NAME>a</NAME><PASSWORD>p</PASSWORD><ENABLED>1</ENABLED><GROUPS><ID>0</ID></GROUPS></USER><USER><ID>2</ID><GID>0</GID><NAME>a name</NAME><PASSWORD>pass</PASSWORD><ENABLED>1</ENABLED><GROUPS><ID>0</ID></GROUPS></USER><USER><ID>3</ID><GID>0</GID><NAME>a_name</NAME><PASSWORD>password</PASSWORD><ENABLED>1</ENABLED><GROUPS><ID>0</ID></GROUPS></USER><USER><ID>4</ID><GID>0</GID><NAME>another name</NAME><PASSWORD>secret</PASSWORD><ENABLED>1</ENABLED><GROUPS><ID>0</ID></GROUPS></USER></USER_POOL>";

#include "NebulaTest.h"

class NebulaTestUser: public NebulaTest
{
public:
    NebulaTestUser():NebulaTest()
    {
        NebulaTest::the_tester = this;

        need_group_pool = true;
        need_user_pool  = true;
    }
};

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
    CPPUNIT_TEST (duplicates);
    CPPUNIT_TEST (dump);
    CPPUNIT_TEST (dump_where);

    CPPUNIT_TEST_SUITE_END ();

protected:

    NebulaTestUser *    tester;
    UserPool *          upool;
    GroupPool *         gpool;


    void bootstrap(SqlDB* db)
    {
        // setUp overwritten
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        // setUp overwritten
        return upool;
    };

    int allocate(int index)
    {
        int oid;
        string err;
        
        return ((UserPool*)pool)->allocate(&oid, 0, usernames[index],"oneadmin",
                                           passwords[index], true, err);
    };

    void check(int index, PoolObjectSQL* obj)
    {
        CPPUNIT_ASSERT( obj != 0 );

        string name = ((User*)obj)->get_name();
        CPPUNIT_ASSERT( name == usernames[index] );
        CPPUNIT_ASSERT( ((User*)obj)->get_password() == passwords[index] );
    };

public:

    UserPoolTest(){xmlInitParser();};

    ~UserPoolTest(){xmlCleanupParser();};

    void setUp()
    {
        create_db();

        tester = new NebulaTestUser();

        Nebula& neb = Nebula::instance();
        neb.start();

        upool   = neb.get_upool();
        gpool   = neb.get_gpool();

        pool    = upool;
    };

    void tearDown()
    {
        delete_db();

        delete tester;
    };

    /* ********************************************************************* */
    /* ********************************************************************* */

    void sha1_digest()
    {
        string st   = "top_secret_string";
        string sha1 = "773260f433f7fd6f89c1f1bfc32e080fc0748478";

        CPPUNIT_ASSERT( sha1 == SSLTools::sha1_digest(st) );
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

        CPPUNIT_ASSERT( user->get_oid()      == 0 );
        CPPUNIT_ASSERT( user->get_name() == "one_user_test" );
        CPPUNIT_ASSERT( user->get_password() == SSLTools::sha1_digest("password") );
    }

    void authenticate()
    {
        UserPool* user_pool = (UserPool*) pool;
        
        bool rc;
        int  oid, gid;
        set<int> groups;
        string uname, gname;

        // There is an initial user, created with the one_auth file:
        //      one_user_test:password
        string session="one_user_test:5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8";

        rc = user_pool->authenticate( session, oid, gid, uname, gname, groups );
        CPPUNIT_ASSERT( rc == true );
        CPPUNIT_ASSERT( oid == 0 );
        CPPUNIT_ASSERT( gid == 0 );
        CPPUNIT_ASSERT( uname == "one_user_test" );
        CPPUNIT_ASSERT( gname == "oneadmin" );

        session = "one_user_test:wrong_password";
        rc = user_pool->authenticate( session, oid, gid , uname, gname, groups );
        CPPUNIT_ASSERT( rc == false );
        CPPUNIT_ASSERT( oid == -1 );
        CPPUNIT_ASSERT( gid == -1 );

        session = "unknown_user:5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8";
        rc = user_pool->authenticate( session, oid, gid, uname, gname, groups );
        CPPUNIT_ASSERT( rc == false );
        CPPUNIT_ASSERT( oid == -1 );
        CPPUNIT_ASSERT( gid == -1 );
    }

    void get_using_name()
    {
        int oid_0;

        // Allocate two objects
        oid_0 = allocate(0);
        allocate(1);

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

        oid = allocate(2);

        user = ((UserPool*)pool)->get(oid, true);

        user->disable();
        pool->update(user);

        user->unlock();

        // Check the cache

        user = ((UserPool*)pool)->get(oid,false);
        CPPUNIT_ASSERT( user->isEnabled() == false );

        //Now force access to DB

        pool->clean();
        user = ((UserPool*)pool)->get(oid,false);

        CPPUNIT_ASSERT( user != 0 );
        CPPUNIT_ASSERT( user->isEnabled() == false );
    };

    void duplicates()
    {
        int rc, oid;
        string err;
        UserPool * up = static_cast<UserPool *>(pool);

        // Allocate a user.
        rc = up->allocate(&oid, 0,usernames[0], "oneadmin",passwords[0], true, err);
        CPPUNIT_ASSERT( oid == 1 );
        CPPUNIT_ASSERT( oid == rc );

        // Try to allocate twice the same user, should fail
        rc = up->allocate(&oid, 0,usernames[0], "oneadmin", passwords[0], true, err);
        CPPUNIT_ASSERT( rc  == -1 );
        CPPUNIT_ASSERT( oid == rc );

        // Try again, with different password
        rc = up->allocate(&oid, 0, usernames[0], "oneadmin", passwords[1], true, err);
        CPPUNIT_ASSERT( rc  == -1 );
        CPPUNIT_ASSERT( oid == rc );
    }

    void dump()
    {
        string d_names[] = {"a", "a name", "a_name", "another name", "user"};
        string d_pass[]  = {"p", "pass", "password", "secret", "1234"};

        int oid;
        string err;
        
        for(int i=0; i<5; i++)
        {
            ((UserPool*)pool)->allocate(&oid, 0, d_names[i], "oneadmin", d_pass[i], true, err);
        }

        ostringstream oss;
        ((UserPool*)pool)->dump(oss, "");

/*
        if( oss.str() != dump_result )
        {
            cout << endl << oss.str() << endl << "========"
                 << endl << dump_result << endl << "--------";
        }
//*/

        CPPUNIT_ASSERT( oss.str() == dump_result );
    }

    void dump_where()
    {
        string d_names[] = {"a", "a name", "a_name", "another name", "user"};
        string d_pass[]  = {"p", "pass", "password", "secret", "1234"};

        int oid;
        string err;

        for(int i=0; i<5; i++)
        {
            ((UserPool*)pool)->allocate(&oid, 0, d_names[i], "oneadmin",d_pass[i], true, err);
        }

        // Note: second parameter of dump is the WHERE constraint. The "order
        // by" is a dirty fix (SQL injection, actually) because MySQL orders the
        // results by user_name
        ostringstream oss;
        ((UserPool*)pool)->dump(oss, "name LIKE 'a%' ORDER BY oid");

/*
        if( oss.str() != dump_where_result )
        {
            cout << endl << oss.str() << endl << "========"
                 << endl << dump_where_result << endl << "--------";
        }
//*/

        CPPUNIT_ASSERT( oss.str() == dump_where_result );
    }
};

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    OneUnitTest::set_one_auth();

    return PoolTest::main(argc, argv, UserPoolTest::suite());
}
