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
#include <unistd.h>
#include <pthread.h>

#include "Nebula.h"
#include "NebulaTest.h"
#include "test/OneUnitTest.h"
#include "AuthManager.h"
#include "Template.h"
#include "NebulaLog.h"

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

        return new AuthManager(1,3,am_mads);
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

    //This test needs a driver that takes more than 3 secs to AUTHENTICATE
    void timeout()
    {
        AuthRequest ar(2, 2);

        ar.add_authenticate("timeout","the_pass","the_secret");

        am->trigger(AuthManager::AUTHENTICATE,&ar);

        ar.wait();

        CPPUNIT_ASSERT(ar.result==false);
        CPPUNIT_ASSERT(ar.timeout==true);

        am->discard_request(ar.id);
    }

    void authenticate()
    {
        AuthRequest ar(2, 2);

        ar.add_authenticate("the_user","the_pass","the_secret");

        am->trigger(AuthManager::AUTHENTICATE,&ar);
        ar.wait();

        CPPUNIT_ASSERT(ar.result==true);
    }


    void authorize()
    {
        AuthRequest ar(2, 2);

        //OBJECT:OBJECT_ID:ACTION:OWNER:PUBLIC:CORE_RESULT

        string astr = "VM:VGhpcyBpcyBhIHRlbXBsYXRlCg==:CREATE:-1:0:0 "
                      "IMAGE:2:USE:3:0:0 "
                      "NET:4:DELETE:5:1:0 "
                      "HOST:6:MANAGE:7:1:0 0";

        ar.add_auth(AuthRequest::VM,
                    "This is a template\n",
                    0,
                    AuthRequest::CREATE,
                    -1,
                    false);

        ar.add_auth(AuthRequest::IMAGE,
                    2,
                    0,
                    AuthRequest::USE,
                    3,
                    false);

        ar.add_auth(AuthRequest::NET,
                    4,
                    0,
                    AuthRequest::DELETE,
                    5,
                    true);

        ar.add_auth(AuthRequest::HOST,
                    6,
                    0,
                    AuthRequest::MANAGE,
                    7,
                    true);

        am->trigger(AuthManager::AUTHORIZE,&ar);
        ar.wait();
/*
        if ( ar.result != false )
        {
            cout << endl << "ar.result: " << ar.result << endl;
        }

        if ( ar.message != astr )
        {
            cout << endl << "ar.message: " << ar.message;
            cout << endl << "expected:   " << astr << endl;
        }
//*/
        CPPUNIT_ASSERT(ar.result==false);
        CPPUNIT_ASSERT(ar.message==astr);

        AuthRequest ar1(2, 2);

        string astr1= "VM:VGhpcyBpcyBhIHRlbXBsYXRlCg==:CREATE:-1:0:0 0";

        ar1.add_auth(AuthRequest::VM,
                     "This is a template\n",
                     0,
                     AuthRequest::CREATE,
                     -1,
                     false);

        am->trigger(AuthManager::AUTHORIZE,&ar1);
        ar1.wait();
 /*
        if ( ar1.result != false )
        {
            cout << endl << "ar.result: " << ar1.result << endl;
        }

        if ( ar1.message != astr1 )
        {
            cout << endl << "ar.message: " << ar1.message;
            cout << endl << "expected:   " << astr1 << endl;
        }
//*/
        CPPUNIT_ASSERT(ar1.result==false);
        CPPUNIT_ASSERT(ar1.message==astr1);

        AuthRequest ar2(2, 2);

        string astr2= "Empty authorization string";


        am->trigger(AuthManager::AUTHORIZE,&ar2);
        ar2.wait();
/*
        if ( ar1.result != false )
        {
            cout << endl << "ar.result: " << ar1.result << endl;
        }

        if ( ar1.message != astr1 )
        {
            cout << endl << "ar.message: " << ar1.message;
            cout << endl << "expected:   " << astr1 << endl;
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

        ar.add_auth(AuthRequest::VM,"dGhpcy",-1,AuthRequest::CREATE,2,false);
        ar.add_auth(AuthRequest::NET,2,1,AuthRequest::USE,2,false);
        ar.add_auth(AuthRequest::IMAGE,3,1,AuthRequest::USE,4,true);

        CPPUNIT_ASSERT(ar.plain_authorize() == true);

        ar1.add_auth(AuthRequest::VM,"dGhpcy",-1,AuthRequest::CREATE,2,false);
        ar1.add_auth(AuthRequest::NET,2,1,AuthRequest::USE,2,false);
        ar1.add_auth(AuthRequest::IMAGE,3,1,AuthRequest::USE,4,false);

        CPPUNIT_ASSERT(ar1.plain_authorize() == false);

        ar2.add_auth(AuthRequest::HOST,"dGhpcy",-1,AuthRequest::CREATE,0,false);
        CPPUNIT_ASSERT(ar2.plain_authorize() == false);

        ar3.add_auth(AuthRequest::VM,5,1,AuthRequest::MANAGE,2,false);
        CPPUNIT_ASSERT(ar3.plain_authorize() == false);

        ar4.add_auth(AuthRequest::VM,4,1,AuthRequest::MANAGE,2,false);
        CPPUNIT_ASSERT(ar4.plain_authorize() == true);

        ar5.add_auth(AuthRequest::HOST,4,-1,AuthRequest::MANAGE,0,false);
        CPPUNIT_ASSERT(ar5.plain_authorize() == true);

        ar6.add_auth(AuthRequest::HOST,4,-1,AuthRequest::CREATE,0,false);
        CPPUNIT_ASSERT(ar6.plain_authorize() == true);
    }

    void self_authenticate()
    {
        AuthRequest ar(2, 2);
        AuthRequest ar1(2,2);

        ar.add_authenticate("the_user","the_pass","the_secret");
        CPPUNIT_ASSERT(ar.plain_authenticate() == false);

        ar1.add_authenticate("the_user","the_pass","the_pass");
        CPPUNIT_ASSERT(ar1.plain_authenticate() == true);
    }
};


/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return OneUnitTest::main(argc, argv, AuthManagerTest::suite());
}
