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

#include "AuthManager.h"
#include "NebulaLog.h"

#include "Nebula.h"

#include <openssl/sha.h>
#include <openssl/hmac.h>
#include <openssl/evp.h>
#include <openssl/bio.h>
#include <openssl/buffer.h>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

time_t AuthManager::_time_out;

const char * AuthManager::auth_driver_name = "auth_exe";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string * AuthRequest::base64_encode(const string& in)
{
    BIO *     bio_mem;
    BIO *     bio_64;

    char *    encoded_c;
    long int  size;

    bio_64  = BIO_new(BIO_f_base64());
    bio_mem = BIO_new(BIO_s_mem());

    BIO_push(bio_64, bio_mem);

    BIO_set_flags(bio_64,BIO_FLAGS_BASE64_NO_NL);

    BIO_write(bio_64, in.c_str(), in.length());

    if (BIO_flush(bio_64) != 1)
    {
        return 0;
    }

    size = BIO_get_mem_data(bio_mem,&encoded_c);

    string * encoded = new string(encoded_c,size);

    BIO_free_all(bio_64);

    return encoded;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AuthRequest::add_auth(Object        ob,
                           const string& ob_id,
                           Operation     op,
                           int           owner,
                           bool          pub)
{
    ostringstream oss;
    bool          auth;

    switch (ob)
    {
        case VM:       oss << "VM:" ; break;
        case HOST:     oss << "HOST:" ; break;
        case NET:      oss << "NET:" ; break;
        case IMAGE:    oss << "IMAGE:" ; break;
        case USER:     oss << "USER:" ; break;
        case CLUSTER:  oss << "CLUSTER:" ; break;
        case TEMPLATE: oss << "TEMPLATE:" ; break;
    }

    if (op == CREATE) //encode the ob_id, it is a template
    {
        string * encoded_id = base64_encode(ob_id);

        if (encoded_id != 0)
        {
            oss << *encoded_id << ":";
            delete (encoded_id);
        }
        else
        {
            oss << "-:";
        }
    }
    else
    {
        oss << ob_id << ":";
    }

    switch (op)
    {
        case CREATE:
            oss << "CREATE:" ;
            break;

        case DELETE:
            oss << "DELETE:" ;
            break;

        case USE:
            oss << "USE:" ;
            break;

        case MANAGE:
            oss << "MANAGE:" ;
            break;
            
        case INFO:
            oss << "INFO:" ;
            break;
    }

    oss << owner << ":" << pub;

    // -------------------------------------------------------------------------
    // Authorize the request for self authorization
    // -------------------------------------------------------------------------

    if ( uid == 0 )
    {
        auth = true;
    }
    else
    {
        auth = false;

        switch (op)
        {
            case CREATE:
                if ( ob == VM || ob == NET || ob == IMAGE || ob == TEMPLATE )
                {
                    auth = true;
                }
                break;

            case DELETE:
                auth = owner == uid;
                break;

            case USE:
                if (ob == NET || ob == IMAGE || ob == TEMPLATE)
                {
                    auth = (owner == uid) || pub;
                }
                else if (ob == HOST)
                {
                    auth = true;
                }
                break;

            case MANAGE:
                auth = owner == uid;
                break;
                
            case INFO: // This is for completeness, as the only INFO existing 
                       // is for UserPool, and just oneadmin can see it
                break;
        }
    }

    self_authorize = self_authorize && auth;

    auths.push_back(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * authm_action_loop(void *arg)
{
    AuthManager *  authm;

    if ( arg == 0 )
    {
        return 0;
    }

    authm = static_cast<AuthManager *>(arg);

    NebulaLog::log("AuM",Log::INFO,"Authorization Manager started.");

    authm->am.loop(authm->timer_period,0);

    NebulaLog::log("AuM",Log::INFO,"Authorization Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */

int AuthManager::start()
{
    int               rc;
    pthread_attr_t    pattr;

    rc = MadManager::start();

    if ( rc != 0 )
    {
        return -1;
    }

    NebulaLog::log("AuM",Log::INFO,"Starting Auth Manager...");

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    rc = pthread_create(&authm_thread,&pattr,authm_action_loop,(void *) this);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AuthManager::trigger(Actions action, AuthRequest * request)
{
    string  aname;

    switch (action)
    {
    case AUTHENTICATE:
        aname = "AUTHENTICATE";
        break;

    case AUTHORIZE:
        aname = "AUTHORIZE";
        break;

    case FINALIZE:
        aname = ACTION_FINALIZE;
        break;

    default:
        return;
    }

    am.trigger(aname,request);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AuthManager::do_action(const string &action, void * arg)
{
    AuthRequest * request;

    request  = static_cast<AuthRequest *>(arg);

    if (action == "AUTHENTICATE" && request != 0)
    {
        authenticate_action(request);
    }
    else if (action == "AUTHORIZE"  && request != 0)
    {
        authorize_action(request);
    }
    else if (action == ACTION_TIMER)
    {
        timer_action();
    }
    else if (action == ACTION_FINALIZE)
    {
        NebulaLog::log("AuM",Log::INFO,"Stopping Authorization Manager...");

        MadManager::stop();
    }
    else
    {
        ostringstream oss;
        oss << "Unknown action name: " << action;

        NebulaLog::log("AuM", Log::ERROR, oss);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AuthManager::authenticate_action(AuthRequest * ar)
{
    const AuthManagerDriver * authm_md;

    // ------------------------------------------------------------------------
    // Get the driver
    // ------------------------------------------------------------------------

    authm_md = get();

    if (authm_md == 0)
    {
        goto error_driver;
    }

    // ------------------------------------------------------------------------
    // Queue the request
    // ------------------------------------------------------------------------

    ar->id = add_request(ar);

    // ------------------------------------------------------------------------
    // Make the request to the driver
    // ---- --------------------------------------------------------------------


    authm_md->authenticate(ar->id,
                           ar->uid,
                           ar->username,
                           ar->password,
                           ar->session);
    return;

error_driver:
    ar->result  = false;
    ar->message = "Could not find Authorization driver";
    ar->notify();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AuthManager::authorize_action(AuthRequest * ar)
{
    const AuthManagerDriver * authm_md;
    string auths;

    // ------------------------------------------------------------------------
    // Get the driver
    // ------------------------------------------------------------------------

    authm_md = get();

    if (authm_md == 0)
    {
        goto error_driver;
    }

    // ------------------------------------------------------------------------
    // Queue the request
    // ------------------------------------------------------------------------

    ar->id = add_request(ar);

    // ------------------------------------------------------------------------
    // Make the request to the driver
    // ------------------------------------------------------------------------

    auths = ar->get_auths();

    authm_md->authorize(ar->id, ar->uid, auths);

    return;

error_driver:
    ar->result  = false;
    ar->message = "Could not find Authorization driver";
    ar->notify();
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AuthManager::timer_action()
{
    map<int,AuthRequest *>::iterator it;

    time_t the_time = time(0);

    lock();

    for (it=auth_requests.begin();it!=auth_requests.end();it++)
    {
        if (the_time > it->second->time_out)
        {
            AuthRequest * ar = it->second;
            auth_requests.erase(it);

            ar->result  = false;
            ar->timeout = true;
            ar->message = "Auth request timeout";

            ar->notify();
        }
    }

    unlock();

}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AuthManager::add_request(AuthRequest *ar)
{
    static int auth_id = 0;
    int id;

    lock();

    id = auth_id++;

    auth_requests.insert(auth_requests.end(),make_pair(id,ar));

    unlock();

    return id;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

AuthRequest * AuthManager::get_request(int id)
{
    AuthRequest * ar = 0;
    map<int,AuthRequest *>::iterator it;
    ostringstream oss;

    lock();

    it=auth_requests.find(id);

    if ( it != auth_requests.end())
    {
        ar = it->second;

        auth_requests.erase(it);
    }

    unlock();

    return ar;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AuthManager::notify_request(int auth_id,bool result,const string& message)
{

    AuthRequest * ar;

    ar = get_request(auth_id);

    if ( ar == 0 )
    {
        return;
    }

    ar->result = result;
    ar->message= message;

    ar->notify();
}

/* ************************************************************************** */
/* MAD Loading                                                                */
/* ************************************************************************** */

void AuthManager::load_mads(int uid)
{
    ostringstream                   oss;
    const VectorAttribute *         vattr;
    int                             rc;
    string                          name;
    AuthManagerDriver *             authm_driver = 0;

    oss << "Loading Auth. Manager driver.";

    NebulaLog::log("AuM",Log::INFO,oss);

    vattr = static_cast<const VectorAttribute *>(mad_conf[0]);

    if ( vattr == 0 )
    {
        NebulaLog::log("AuM",Log::ERROR,"Failed to load Auth. Manager driver.");
        return;
    }

    VectorAttribute auth_conf("AUTH_MAD",vattr->value());

    auth_conf.replace("NAME",auth_driver_name);

    authm_driver = new AuthManagerDriver(uid,auth_conf.value(),(uid!=0),this);

    rc = add(authm_driver);

    if ( rc == 0 )
    {
        oss.str("");
        oss << "\tAuth Manager loaded";

        NebulaLog::log("AuM",Log::INFO,oss);
    }
}
