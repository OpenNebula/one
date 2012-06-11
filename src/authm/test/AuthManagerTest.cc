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
#include <stdlib.h>
#include <unistd.h>
#include <pthread.h>

#include "Nebula.h"
#include "NebulaTest.h"
#include "test/OneUnitTest.h"
#include "AuthManager.h"
#include "Template.h"
#include "NebulaLog.h"
#include "PoolObjectAuth.h"

#include <openssl/evp.h>
#include <openssl/bio.h>

using namespace std;


/* ************************************************************************* */
/* ************************************************************************* */



class NebulaTestAuth: public NebulaTest
{
public:
    NebulaTestAuth():NebulaTest()
    {
        NebulaTest::the_tester = this;

        need_authm = true;
        need_aclm  = true;
    };

    AuthManager* create_authm(time_t timer_period)
    {
        ostringstream oss;
        vector<const Attribute *> am_mads;
        char *error = 0;

        oss << "AUTH_MAD = [ executable=\"/" << getenv("PWD")
            << "/dummy\"]" << endl;

        Template * t = new Template();

        t->parse(oss.str(),&error);

        t->get("AUTH_MAD", am_mads);

        return new AuthManager(1,am_mads);
    };
};

/* ************************************************************************* */
/* ************************************************************************* */

class AuthManagerTest : public OneUnitTest
{
    CPPUNIT_TEST_SUITE (AuthManagerTest);

    CPPUNIT_TEST (timeout);
    CPPUNIT_TEST (authenticate);
    CPPUNIT_TEST (authorize);
    CPPUNIT_TEST (self_authorize);
    CPPUNIT_TEST (self_authenticate);

    CPPUNIT_TEST_SUITE_END ();


private:
    NebulaTestAuth * tester;

    AuthManager * am;

public:
    AuthManagerTest()
    {
        xmlInitParser();
    };

    ~AuthManagerTest()
    {
        xmlCleanupParser();

        // OpenSSL internal tables are allocated when an application starts up.
        // Since such tables do not grow in size over time they are harmless.

        EVP_cleanup();
        CRYPTO_cleanup_all_ex_data();
    };


    /* ********************************************************************* */
    /* ********************************************************************* */

    void setUp()
    {
        create_db();

        tester = new NebulaTestAuth();

        Nebula& neb = Nebula::instance();
        neb.start();

        am = neb.get_authm();
    };

    void tearDown()
    {
        // -----------------------------------------------------------
        // Stop the managers & free resources
        // -----------------------------------------------------------

        am->trigger(AuthManager::FINALIZE,0);

        pthread_join(am->get_thread_id(),0);

        //XML Library
        xmlCleanupParser();

        delete_db();

        delete tester;
    };

    /* ********************************************************************* */
    /* ********************************************************************* */

    //This test needs a driver that takes more than 90 secs to AUTHENTICATE
    void timeout()
    {
        AuthRequest ar(2, 2);

        ar.add_authenticate("test","timeout","the_pass","the_secret");

        am->trigger(AuthManager::AUTHENTICATE,&ar);

        ar.wait();

        CPPUNIT_ASSERT(ar.result==false);
        CPPUNIT_ASSERT(ar.timeout==true);
    }

    void authenticate()
    {
        AuthRequest ar(2, 2);

        ar.add_authenticate("test","the_user","the_pass","the_secret");

        am->trigger(AuthManager::AUTHENTICATE,&ar);
        ar.wait();

        CPPUNIT_ASSERT(ar.result==true);
    }


    void authorize()
    {
        AuthRequest ar(2, 2);

        //OBJECT:OBJECT_ID:ACTION:OWNER:PUBLIC:CORE_RESULT

        string astr = "VM:VGhpcyBpcyBhIHRlbXBsYXRlCg==:CREATE:2:0 "
                      "IMAGE:2:USE:3:0 "
                      "NET:4:MANAGE:5:0 "
                      "HOST:6:MANAGE:7:0 "
                      "0";

        PoolObjectAuth perm;


        ar.add_create_auth(PoolObjectSQL::VM, "This is a template\n");

        perm.oid = 2;
        perm.gid = 0;
        perm.uid = 3;
        perm.obj_type = PoolObjectSQL::IMAGE;

        ar.add_auth(AuthRequest::USE,perm);

        perm.oid = 4;
        perm.gid = 0;
        perm.uid = 5;
        perm.obj_type = PoolObjectSQL::NET;

        ar.add_auth(AuthRequest::MANAGE,perm);

        perm.oid = 6;
        perm.gid = 0;
        perm.uid = 7;
        perm.obj_type = PoolObjectSQL::HOST;

        ar.add_auth(AuthRequest::MANAGE,perm);

        am->trigger(AuthManager::AUTHORIZE,&ar);
        ar.wait();
//*
        if ( ar.result != false )
        {
            cout << endl << "ar.result: " << ar.result << endl;
        }

        if ( ar.message.find(astr) == ar.message.npos )
        {
            cout << endl << "ar.message: " << ar.message;
            cout << endl << "expected:   " << astr << endl;
        }
//*/
        CPPUNIT_ASSERT(ar.result==false);
        CPPUNIT_ASSERT(ar.message.find(astr) != ar.message.npos);

        AuthRequest ar1(2, 2);

        string astr1= "VM:VGhpcyBpcyBhIHRlbXBsYXRlCg==:CREATE:2:0 0";

        ar1.add_create_auth(PoolObjectSQL::VM, "This is a template\n");

        am->trigger(AuthManager::AUTHORIZE,&ar1);
        ar1.wait();
 //*
        if ( ar1.result != false )
        {
            cout << endl << "ar.result: " << ar1.result << endl;
        }

        if ( ar1.message.find(astr1) == ar1.message.npos )
        {
            cout << endl << "ar.message: " << ar1.message;
            cout << endl << "expected:   " << astr1 << endl;
        }
//*/
        CPPUNIT_ASSERT(ar1.result==false);
        CPPUNIT_ASSERT(ar1.message.find(astr1) != ar1.message.npos);

        AuthRequest ar2(2, 2);

        string astr2= "Empty authorization string";


        am->trigger(AuthManager::AUTHORIZE,&ar2);
        ar2.wait();
//*
        if ( ar2.result != false )
        {
            cout << endl << "ar2.result: " << ar2.result << endl;
        }

        if ( ar2.message != astr2 )
        {
            cout << endl << "ar2.message: " << ar2.message;
            cout << endl << "expected:   " << astr2 << endl;
        }
//*/
        CPPUNIT_ASSERT(ar2.result==false);
        CPPUNIT_ASSERT(ar2.message==astr2);
    }


    void self_authorize()
    {
        // Make all users belong to the USERS (1) group

        AuthRequest ar(2,  1);
        AuthRequest ar1(2, 1);
        AuthRequest ar2(3, 1);
        AuthRequest ar3(4, 1);
        AuthRequest ar4(2, 1);
        AuthRequest ar5(0, 1);
        AuthRequest ar6(0, 1);

        PoolObjectAuth perm;

        ar.add_create_auth(PoolObjectSQL::VM,"dGhpcy");

        perm.oid = 2;
        perm.gid = 1;
        perm.uid = 2;
        perm.obj_type = PoolObjectSQL::NET;
        ar.add_auth(AuthRequest::USE,perm);

        perm.oid = 3;
        perm.gid = 1;
        perm.uid = 4;
        perm.group_u = 1;
        perm.obj_type = PoolObjectSQL::IMAGE;
        ar.add_auth(AuthRequest::USE,perm);

        CPPUNIT_ASSERT(ar.core_authorize() == true);

        perm = PoolObjectAuth();

        ar1.add_create_auth(PoolObjectSQL::VM,"dGhpcy");

        perm.oid = 2;
        perm.gid = 1;
        perm.uid = 2;
        perm.obj_type = PoolObjectSQL::NET;
        ar1.add_auth(AuthRequest::USE,perm);

        perm.oid = 3;
        perm.gid = 1;
        perm.uid = 4;
        perm.obj_type = PoolObjectSQL::IMAGE;
        ar1.add_auth(AuthRequest::USE,perm);

        CPPUNIT_ASSERT(ar1.core_authorize() == false);

        ar2.add_create_auth(PoolObjectSQL::HOST,"");
        CPPUNIT_ASSERT(ar2.core_authorize() == false);

        perm.oid = 5;
        perm.gid = 1;
        perm.uid = 2;
        perm.obj_type = PoolObjectSQL::VM;
        ar3.add_auth(AuthRequest::MANAGE,perm);
        CPPUNIT_ASSERT(ar3.core_authorize() == false);

        perm.oid = 4;
        perm.gid = 1;
        perm.uid = 2;
        perm.obj_type = PoolObjectSQL::VM;
        ar4.add_auth(AuthRequest::MANAGE,perm);
        CPPUNIT_ASSERT(ar4.core_authorize() == true);

        perm.oid = 4;
        perm.gid = -1;
        perm.uid = 0;
        perm.obj_type = PoolObjectSQL::HOST;
        ar5.add_auth(AuthRequest::MANAGE,perm);
        CPPUNIT_ASSERT(ar5.core_authorize() == true);

        ar6.add_create_auth(PoolObjectSQL::HOST,"");
        CPPUNIT_ASSERT(ar6.core_authorize() == true);
    }

    void self_authenticate()
    {
        AuthRequest ar(2, 2);
        AuthRequest ar1(2,2);

        ar.add_authenticate("core","the_user","the_pass","the_secret");
        CPPUNIT_ASSERT(ar.core_authenticate() == false);

        ar1.add_authenticate("core","the_user","e2e509d8358df1d5fa3bc825173f93904baa4906", "the_pass");
        CPPUNIT_ASSERT(ar1.core_authenticate() == true);
    }
};


/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return OneUnitTest::main(argc, argv, AuthManagerTest::suite());
}
