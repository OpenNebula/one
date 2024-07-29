/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
#include "AclManager.h"
#include "NebulaUtil.h"
#include "PoolObjectAuth.h"
#include "Nebula.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * AuthManager::auth_driver_name = "auth_exe";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AuthRequest::add_auth(Operation             op,
                           const PoolObjectAuth& ob_perms,
                           const string&         ob_template)
{
    ostringstream oss;
    bool          auth;
    bool          lock;

    oss << ob_perms.type_to_str() << ":";

    if ( !ob_template.empty() )
    {
        string encoded_id;

        if (ssl_util::base64_encode(ob_template, encoded_id) == 0)
        {
            oss << encoded_id << ":";
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
    Nebula&     nd   = Nebula::instance();
    AclManager* aclm = nd.get_aclm();

    if ( uid == 0 || gids.count( GroupPool::ONEADMIN_ID ) == 1 )
    {
        auth = aclm->oneadmin_authorize(ob_perms, op);
        lock = true;
    }
    else
    {
        auth = aclm->authorize(uid, gids, ob_perms, op);
        lock = false;
    }

    oss << auth; // Store the ACL authorization result in the request

    self_authorize = self_authorize && auth;

    auths.push_back(oss.str());

    if ( auth == false )
    {
        oss.str("");

        if ( !message.empty() )
        {
            oss << message << "; ";
        }

        if ( !lock )
        {
            oss << "Not authorized to perform " << operation_to_str(op)
                << " " << ob_perms.type_to_str();
        }
        else
        {
            oss << ob_perms.type_to_str() << " is locked.";
        }

        if ( ob_perms.oid != -1 )
        {
            oss << " [" << ob_perms.oid << "]";
        }

        message = oss.str();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AuthManager::start()
{
    using namespace std::placeholders; // for _1

    register_action(AuthManagerMessages::UNDEFINED,
                    &AuthManager::_undefined);

    register_action(AuthManagerMessages::AUTHORIZE,
                    bind(&AuthManager::_authorize, this, _1));

    register_action(AuthManagerMessages::AUTHENTICATE,
                    bind(&AuthManager::_authenticate, this, _1));

    register_action(AuthManagerMessages::LOG,
                    &AuthManager::_log);

    string error;

    if (DriverManager::start(error) != 0)
    {
        NebulaLog::error("AuM", error);

        return -1;
    }

    NebulaLog::log("AuM", Log::INFO, "Starting Auth Manager...");

    Listener::start();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AuthManager::trigger_authenticate(AuthRequest& ar)
{
    trigger([&]
    {
        // ------------------------------------------------------------------------
        // Get the driver
        // ------------------------------------------------------------------------

        auto authm_md = get();

        if (authm_md == nullptr)
        {
            ar.result  = false;
            ar.message = "Could not find Authorization driver";
            ar.notify();

            return;
        }

        // ------------------------------------------------------------------------
        // Queue the request
        // ------------------------------------------------------------------------

        add_request(&ar);

        // ------------------------------------------------------------------------
        // Make the request to the driver
        // ---- --------------------------------------------------------------------

        string session64;
        ssl_util::base64_encode(ar.session, session64);

        ostringstream oss;

        oss << ar.uid << " "
            << ar.driver << " "
            << ar.username << " "
            << ar.password << " "
            << session64 << " " << endl;

        auth_msg_t msg(AuthManagerMessages::AUTHENTICATE, "", ar.id, oss.str());

        authm_md->write(msg);
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AuthManager::trigger_authorize(AuthRequest& ar)
{
    trigger([&]
    {
        // ------------------------------------------------------------------------
        // Get the driver
        // ------------------------------------------------------------------------

        auto authm_md = get();

        if (authm_md == nullptr)
        {
            ar.message = "Could not find Authorization driver";
            ar.result = false;
            ar.notify();

            return;
        }

        auto auths = ar.get_auths();

        if (auths.empty())
        {
            ar.message = "Empty authorization string";
            ar.result = false;
            ar.notify();

            return;
        }

        // ------------------------------------------------------------------------
        // Queue the request
        // ------------------------------------------------------------------------

        add_request(&ar);

        // ------------------------------------------------------------------------
        // Make the request to the driver
        // ------------------------------------------------------------------------

        ostringstream oss;

        oss << ar.uid << " "
            << auths << " "
            << ar.self_authorize << endl;

        auth_msg_t msg(AuthManagerMessages::AUTHORIZE, "", ar.id, oss.str());

        authm_md->write(msg);
    });
}

/* ************************************************************************** */
/* MAD Loading                                                                */
/* ************************************************************************** */

int AuthManager::load_drivers(const std::vector<const VectorAttribute*>& _mads)
{
    ostringstream                   oss;
    const VectorAttribute *         vattr = nullptr;

    NebulaLog::log("AuM", Log::INFO, "Loading Auth. Manager driver.");

    if ( _mads.size() > 0 )
    {
        vattr = _mads[0];
    }

    if ( vattr == nullptr )
    {
        NebulaLog::log("AuM", Log::ERROR, "Failed to load Auth. Manager driver.");
        return -1;
    }

    VectorAttribute auth_conf("AUTH_MAD", vattr->value());

    auth_conf.replace("NAME", auth_driver_name);

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

    if (load_driver(&auth_conf) != 0)
    {
        NebulaLog::error("ImM", "Unable to load Auth Manager driver");
        return -1;
    }

    NebulaLog::log("AuM", Log::INFO, "\tAuth Manager loaded");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AuthManager::finalize_action()
{
    timer_thread.stop();

    DriverManager::stop(drivers_timeout);
}
