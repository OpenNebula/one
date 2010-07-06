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

#ifndef AUTH_MANAGER_H_
#define AUTH_MANAGER_H_

#include <time.h>

#include "MadManager.h"
#include "ActionManager.h"

#include "AuthManagerDriver.h"

using namespace std;

//Forward definition of the AuthRequest
class AuthRequest;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * authm_action_loop(void *arg);

class AuthManager : public MadManager, public ActionListener
{
public:

    AuthManager(
        time_t                      timer,
        time_t                      __time_out,
        vector<const Attribute*>&   _mads):
            MadManager(_mads), timer_period(timer)
    {
        _time_out = __time_out;

        am.addListener(this);

        pthread_mutex_init(&mutex,0);
    };

    ~AuthManager(){};

    enum Actions
    {
        AUTHENTICATE,
        AUTHORIZE,
        FINALIZE
    };

    /**
     *  Triggers specific actions to the Auth Manager. This function
     *  wraps the ActionManager trigger function.
     *    @param action the Auth Manager action
     *    @param request an auth request
     */
    void trigger(
        Actions       action,
        AuthRequest * request);

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the AuthManager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Loads Virtual Machine Manager Mads defined in configuration file
     *   @param uid of the user executing the driver. When uid is 0 the nebula
     *   identity will be used. Otherwise the Mad will be loaded through the
     *   sudo application.
     */
    void load_mads(int uid);

    /**
     *  Gets the thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return authm_thread;
    };

    /**
     *  Notify the result of an auth request
     */
    void notify_request(int auth_id, bool result, const string& message);

    /**
     *  Discards a pending request. Call this before freeing not notified or
     *  timeout requests.
     */
    void discard_request(int auth_id)
    {
        lock();

        auth_requests.erase(auth_id);

        unlock();
    }

    /**
     *  Gets default timeout for Auth requests
     */
    static time_t  time_out()
    {
        return _time_out;
    }

private:
    /**
     *  Thread id for the Transfer Manager
     */
    pthread_t               authm_thread;

    /**
     *  Action engine for the Manager
     */
    ActionManager           am;

    /**
     *  List of pending requests
     */
    map<int, AuthRequest *> auth_requests;

    /**
     *  Mutex to access the auth_requests
     */
    pthread_mutex_t         mutex;

    /**
     *  Default timeout for Auth requests
     */
    static time_t  _time_out;

    /**
     *  Timer for the Manager (periocally triggers timer action)
     */
    time_t  timer_period;

    /**
     *  Returns a pointer to a Auth Manager driver.
     *    @param name of an attribute of the driver (e.g. its type)
     *    @param value of the attribute
     *    @return the Auth driver with attribute name equal to value
     *    or 0 in not found
     */
    const AuthManagerDriver * get(
        const string&   name,
        const string&   value)
    {
        return static_cast<const AuthManagerDriver *>
               (MadManager::get(0,name,value));
    };

    /**
     *  Returns a pointer to a Auth Manager driver. The driver is
     *  searched by its name.
     *    @param name the name of the driver
     *    @return the TM driver owned by uid with attribute name equal to value
     *    or 0 in not found
     */
    const AuthManagerDriver * get(const string& name)
    {
        string _name("NAME");

        return static_cast<const AuthManagerDriver *>
               (MadManager::get(0,_name,name));
    };

    /**
     *  Function to execute the Manager action loop method within a new pthread
     * (requires C linkage)
     */
    friend void * authm_action_loop(void *arg);

    /**
     *  The action function executed when an action is triggered.
     *    @param action the name of the action
     *    @param arg arguments for the action function
     */
    void do_action(
        const string &  action,
        void *          arg);

    /**
     *  This function authenticates a user
     */
    void authenticate_action(AuthRequest * ar);

    /**
     *  This function authorizes a user request
     */
    void authorize_action(AuthRequest * ar);

    /**
     *  This function is periodically executed to check time_outs on requests
     */
    void timer_action();

    /**
     *  Function to lock the pool
     */
    void lock()
    {
        pthread_mutex_lock(&mutex);
    };

    /**
     *  Function to unlock the pool
     */
    void unlock()
    {
        pthread_mutex_unlock(&mutex);
    };

    /**
     *  Add a new request to the Request map
     *    @param ar pointer to the AuthRequest
     *    @return the id for the request
     */
    int add_request(AuthRequest *ar);

    /**
     *  Gets request from the Request map
     *    @param id for the request
     *    @return pointer to the AuthRequest
     */
    AuthRequest * get_request(int id);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The AuthRequest class is used to pass an Authorization or Authentication
 *  request to the AuthManager. The result of the request will be stored
 *  in the result and message attributes of this class.
 */
class AuthRequest : public ActionListener
{
public:
    AuthRequest(int _uid, const string& _auth_driver):
        result(false),
        timeout(false),
        auth_driver(_auth_driver),
        uid(_uid),
        time_out(0)
    {
        am.addListener(this);
    };

    ~AuthRequest(){};

    /**
     *  Authorization Request Type
     */
    enum Operation
    {
        CREATION, /** Authorization to create an object (host, vm, net, image)*/
        DELETION, /** Authorization to delete an object */
        USAGE,    /** Authorization to use an object */
        MANAGE    /** Authorization to manage an object */
    };

    /**
     *  OpenNebula objects to perform an Operation
     */
    enum Object
    {
        VM,
        HOST,
        NET,
        IMAGE
    };

    /**
     *  Sets the challenge to authenticate an user
     *  @param challenge a driver specific authentication challenge
     */
    void set_challenge(const string &ch)
    {
        challenge = ch;
    }

    /**
     *  Adds a new authorization item to this requests
     *  @param op the operation to be authorized
     *  @param ob the object over which the operation will be performed
     *  @param oid id of the object
     */
    void add_auth(Operation op, Object ob, int oid)
    {
        ostringstream oss;

        switch (op)
        {
            case CREATION: oss << "CREATION:" ; break;
            case DELETION: oss << "DELETION:" ; break;
            case USAGE:    oss << "USAGE:" ; break;
            case MANAGE:   oss << "MANAGE:" ; break;
        }

        switch (ob)
        {
            case VM:    oss << "VM:" ; break;
            case HOST:  oss << "HOST:" ; break;
            case NET:   oss << "NET:" ; break;
            case IMAGE: oss << "IMAGE:" ; break;
        }

        oss << oid;

        auths.push_back(oss.str());
    };

    /**
     *  Gets the authorization requests in a single string
     *  @return a space separated list of auth requests.
     */
    string get_auths()
    {
        ostringstream oss;

        for (unsigned int i=0; i<auths.size(); i++)
        {
            oss << auths[i] << " ";
        }

        return oss.str();
    };

    /**
     *  Notify client that we have an answer for the request
     */
    void notify()
    {
        am.trigger(ActionListener::ACTION_FINALIZE,0);
    };

    /**
     *  Wait for the AuthRequest to be completed
     */
    void wait()
    {
        time_out = time(0) + AuthManager::time_out();

        am.loop(0,0);
    };

    /**
     *  The result of the request, true if authorized or authenticated
     */
    bool            result;

    /**
     *  Error message for negative results
     */
    string          message;

    /**
     *  Time out
     */
    bool            timeout;

    /**
     *  Identification of this request
     */
    int             id;

private:

    friend class AuthManager;

    /**
     *  The ActionManager that will be notify when the request is ready.
     */
    ActionManager am;

    /**
     *  The name of the Authorization driver to use with this request
     */
    string auth_driver;

    /**
     *  The user id for this request
     */
    int uid;

    /**
     *  Timeout for this request
     */
    time_t time_out;

    /**
     *  Authentication challenge, as sent in the XML-RPC call
     */
    string challenge;

    /**
     *  A list of authorization requests
     */
    vector<string> auths;

    /**
     *  No actions defined for the Auth request, just FINALIZE when done
     */
    void do_action(const string &name, void *args){};
};

#endif /*AUTH_MANAGER_H*/

