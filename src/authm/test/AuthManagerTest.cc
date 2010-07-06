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
#include <unistd.h>
#include <pthread.h>

#include "AuthManager.h"
#include "Template.h"
#include "NebulaLog.h"

#include <TestFixture.h>
#include <TestAssert.h>
#include <TestSuite.h>
#include <TestCaller.h>
#include <ui/text/TestRunner.h>
#include <cppunit/extensions/HelperMacros.h>

using namespace std;


/* ************************************************************************* */
/* ************************************************************************* */

class AuthManagerTest : public CppUnit::TestFixture
{
    CPPUNIT_TEST_SUITE (AuthManagerTest);

    CPPUNIT_TEST (load);
    //CPPUNIT_TEST (timeout);
    CPPUNIT_TEST (authenticate);
    CPPUNIT_TEST (authorize);

    CPPUNIT_TEST_SUITE_END ();


public:
    AuthManagerTest(){};

    ~AuthManagerTest(){};


    /* ********************************************************************* */
    /* ********************************************************************* */
    void setUp()
    {

        ostringstream oss;
        vector<const Attribute *> am_mads;
        char *error = 0;

        MadManager::mad_manager_system_init();

        oss << "AUTH_MAD = [ name=\"dummy\", executable=\"/" << getenv("PWD")
            << "/dummy\"]" << endl;

        t = new Template();

        t->parse(oss.str(),&error);

        t->get("AUTH_MAD", am_mads);

        am = new AuthManager(1,3,am_mads);
    };

    void tearDown()
    {
        delete am;
        delete t;
    };

    void load()
    {
        int rc;

        rc = am->start();

        CPPUNIT_ASSERT(rc==0);

        am->load_mads(0);

        am->trigger(AuthManager::FINALIZE,0);

        pthread_join(am->get_thread_id(),0);

        CPPUNIT_ASSERT(0==0);
    }

    //This test needs a driver that takes more than 3 secs to AUTHENTICATE
    void timeout()
    {
        int         rc;
        AuthRequest ar(2,"dummy");

        rc = am->start();

        CPPUNIT_ASSERT(rc==0);

        am->load_mads(0);

        am->trigger(AuthManager::AUTHENTICATE,&ar);

        ar.set_challenge("the_secret");
        ar.wait();

        CPPUNIT_ASSERT(ar.result==false);
        CPPUNIT_ASSERT(ar.timeout==true);

        am->discard_request(ar.id);

        am->trigger(AuthManager::FINALIZE,0);

        pthread_join(am->get_thread_id(),0);

        CPPUNIT_ASSERT(0==0);
    }

    void authenticate()
    {
        int         rc;
        AuthRequest ar(2,"dummy");

        rc = am->start();

        CPPUNIT_ASSERT(rc==0);

        am->load_mads(0);

        ar.set_challenge("the_secret");

        am->trigger(AuthManager::AUTHENTICATE,&ar);
        ar.wait();

        CPPUNIT_ASSERT(ar.result==true);

        am->trigger(AuthManager::FINALIZE,0);

        pthread_join(am->get_thread_id(),0);

        CPPUNIT_ASSERT(0==0);
    }


    void authorize()
    {
        int         rc;
        AuthRequest ar(2,"dummy");

        rc = am->start();

        CPPUNIT_ASSERT(rc==0);

        am->load_mads(0);

        string astr="CREATION:VM:-1 USAGE:IMAGE:2 USAGE:NET:4 MANAGE:HOST:3";

        ar.add_auth(AuthRequest::CREATION,AuthRequest::VM,-1);
        ar.add_auth(AuthRequest::USAGE,AuthRequest::IMAGE,2);
        ar.add_auth(AuthRequest::USAGE,AuthRequest::NET,4);
        ar.add_auth(AuthRequest::MANAGE,AuthRequest::HOST,3);

        am->trigger(AuthManager::AUTHORIZE,&ar);
        ar.wait();

        CPPUNIT_ASSERT(ar.result==false);
        CPPUNIT_ASSERT(ar.message==astr);

        am->trigger(AuthManager::FINALIZE,0);

        pthread_join(am->get_thread_id(),0);

        CPPUNIT_ASSERT(0==0);
    }
private:
    AuthManager * am;

    Template *    t;
};


/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
  CppUnit::TextUi::TestRunner runner;

  NebulaLog::init_log_system(NebulaLog::FILE, Log::DEBUG,"test.log");
  NebulaLog::log("Test", Log::INFO, "Test started");

  runner.addTest(AuthManagerTest::suite());

  runner.run();

  NebulaLog::finalize_log_system();

  return 0;
}
