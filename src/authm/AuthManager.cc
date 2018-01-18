/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
#include "AuthRequest.h"
#include "NebulaUtil.h"
#include "PoolObjectAuth.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * AuthManager::auth_driver_name = "auth_exe";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AuthRequest::add_auth(Operation             op,
                           const PoolObjectAuth& ob_perms,
                           string                ob_template)
{
    ostringstream oss;
    bool          auth;

    oss << ob_perms.type_to_str() << ":";

    if ( !ob_template.empty() )
    {
        string * encoded_id = one_util::base64_encode(ob_template);

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
        oss << ob_perms.oid << ":";
    }

    oss << operation_to_str(static_cast<AuthRequest::Operation>(op & 0x0FLL)) << ":";

    oss << ob_perms.uid << ":";

    // -------------------------------------------------------------------------
    // Authorize the request for self authorization
    // -------------------------------------------------------------------------

    // Default conditions that grants permission :
    // User is oneadmin, or is in the oneadmin group
    if ( uid == 0 || gids.count( GroupPool::ONEADMIN_ID ) == 1 )
    {
        auth = true;
    }
    else
    {
        Nebula&     nd   = Nebula::instance();
        AclManager* aclm = nd.get_aclm();

        auth = aclm->authorize(uid, gids, ob_perms, op);
    }

    oss << auth; // Store the ACL authorization result in the request

    self_authorize = self_authorize && auth;

    auths.push_back(oss.str());

    if ( auth == false )
    {
        oss.str("");

        oss << message;

        if ( !message.empty() )
        {
            oss << "; ";
        }

        oss << "Not authorized to perform " << operation_to_str(op)
            << " " << ob_perms.type_to_str();

        if ( ob_perms.oid != -1 )
        {
            oss << " [" << ob_perms.oid << "]";
        }

        message = oss.str();
    }
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

    authm->am.loop(authm->timer_period);

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

void AuthManager::user_action(const ActionRequest& ar)
{
    const AMAction& auth_ar = static_cast<const AMAction& >(ar);
    AuthRequest * request   = auth_ar.request();

    if ( request == 0 )
    {
        return;
    }

    switch(auth_ar.action())
    {
        case AMAction::AUTHENTICATE:
            authenticate_action(request);
        break;

        case AMAction::AUTHORIZE:
            authorize_action(request);
        break;
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

    add_request(ar);

    // ------------------------------------------------------------------------
    // Make the request to the driver
    // ---- --------------------------------------------------------------------

    authm_md->authenticate(ar->id,
                           ar->uid,
                           ar->driver,
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
        ar->message = "Could not find Authorization driver";
        goto error;
    }

    // ------------------------------------------------------------------------
    // Queue the request
    // ------------------------------------------------------------------------

    add_request(ar);

    // ------------------------------------------------------------------------
    // Make the request to the driver
    // ------------------------------------------------------------------------

    auths = ar->get_auths();

    if ( auths.empty() )
    {
        ar->message = "Empty authorization string";
        goto error;
    }

    authm_md->authorize(ar->id, ar->uid, auths, ar->self_authorize);

    return;

error:
    ar->result = false;
    ar->notify();

    return;
}

/* ************************************************************************** */
/* MAD Loading                                                                */
/* ************************************************************************** */

int AuthManager::load_mads(int uid)
{
    ostringstream                   oss;
    const VectorAttribute *         vattr = 0;
    int                             rc;
    string                          name;
    AuthManagerDriver *             authm_driver = 0;

    oss << "Loading Auth. Manager driver.";

    NebulaLog::log("AuM",Log::INFO,oss);

    if ( mad_conf.size() > 0 )
    {
        vattr = static_cast<const VectorAttribute *>(mad_conf[0]);
    }

    if ( vattr == 0 )
    {
        NebulaLog::log("AuM",Log::ERROR,"Failed to load Auth. Manager driver.");
        return -1;
    }

    VectorAttribute auth_conf("AUTH_MAD",vattr->value());

    auth_conf.replace("NAME",auth_driver_name);

    oss.str("");

    string authn = auth_conf.vector_value("AUTHN");

    if ( !authn.empty() )
    {
        oss << "--authn " << authn;
    }

    string authz = auth_conf.vector_value("AUTHZ");

    if ( !authz.empty() )
    {
        authz_enabled = true;
        oss << " --authz " << authz;
    }
    else
    {
        authz_enabled = false;
    }

    auth_conf.replace("ARGUMENTS", oss.str());

    authm_driver = new AuthManagerDriver(uid,auth_conf.value(),(uid!=0),this);

    rc = add(authm_driver);

    if ( rc == 0 )
    {
        oss.str("");
        oss << "\tAuth Manager loaded";

        NebulaLog::log("AuM",Log::INFO,oss);
    }

    return rc;
}
