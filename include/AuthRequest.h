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

#ifndef AUTH_REQUEST_H_
#define AUTH_REQUEST_H_

#include <time.h>
#include <set>

#include "ActionManager.h"
#include "PoolObjectAuth.h"
#include "AuthManager.h"
#include "NebulaUtil.h"

#include "SyncRequest.h"

using namespace std;

/**
 *  The AuthRequest class is used to pass an Authorization or Authentication
 *  request to the AuthManager. The result of the request will be stored
 *  in the result and message attributes of this class.
 */
class AuthRequest : public SyncRequest
{
public:
    AuthRequest(int _uid, set<int> _gids): uid(_uid),gids(_gids),self_authorize(true){};

    ~AuthRequest(){};

    /**
     *  Authorization Request Type
     */
    enum Operation
    {
        USE           = 0x1LL,   /**< Auth. to use an object                   */
        USE_NO_LCK    = 0x11LL,  /**< Auth. to use an object no lockable       */
        MANAGE        = 0x2LL,   /**< Auth. to perform management actions      */
        MANAGE_NO_LCK = 0x12LL,  /**< Auth. to perform management actions of an object no lockable */
        ADMIN         = 0x4LL,   /**< Auth. to perform administrative actions  */
        ADMIN_NO_LCK  = 0x14LL,  /**< Auth. to perform administrative actions of an object no lockable */
        CREATE        = 0x8LL,   /**< Auth. to create an object                */
        CREATE_NO_LCK = 0x18LL   /**< Auth. to create an object of an object no lockable */
    };

    static string operation_to_str(Operation op)
    {
        switch (op)
        {
            case USE:    return "USE";
            case MANAGE: return "MANAGE";
            case ADMIN:  return "ADMIN";
            case CREATE: return "CREATE";
            default:     return "";
        }
    };

    /**
     *  Sets the challenge to authenticate an user
     *  @param challenge a driver specific authentication challenge
     */
    void add_authenticate(const string &_driver,
                          const string &_username,
                          const string &_password,
                          const string &_session)
    {
        username = _username;
        password = _password;
        session  = _session;

        driver   = _driver;
    }

    /**
     *  Adds a CREATE authorization request.
     *
     *        OBJECT:<-1|OBJECT_TMPL_XML64>:CREATE:UID:AUTH
     *
     *    @param uid of the object owner
     *    @param gid of the object group
     *    @param type of the object to be created
     *    @param txml template of the new object
     */
    void add_create_auth(int uid, int gid, PoolObjectSQL::ObjectType type, const string& txml)
    {
        PoolObjectAuth perms; //oid & gid set to -1

        perms.uid      = uid;
        perms.gid      = gid;
        perms.obj_type = type;

        add_auth(AuthRequest::CREATE, perms, txml);
    }

    /**
     *  Adds a new authorization item to this request
     *
     *        OBJECT:OBJECT_ID:ACTION:OWNER:AUTH
     *
     * @param op the operation to be authorized
     * @param ob_perms object's permission attributes
     */
    void add_auth(Operation             op,
                  const PoolObjectAuth& ob_perms)
    {
        add_auth(op, ob_perms, "");
    }

    /**
     *  Gets the authorization requests in a single string
     *  @return a space separated list of auth requests, or an empty string if
     *          no auth requests were added
     */
    string get_auths()
    {
        ostringstream oss;
        unsigned int  i;

        if ( auths.empty() )
        {
            return string();
        }

        for (i=0; i<auths.size()-1; i++)
        {
            oss << auths[i] << " ";
        }

        oss << auths[i];

        return oss.str();
    };

    bool core_authorize()
    {
        return ( uid == 0 || self_authorize );
    }

    bool core_authenticate()
    {
        string sha1_session = one_util::sha1_digest(session);

        return (password == sha1_session);
    }

private:

    friend class AuthManager;

    /**
     *  The user id for this request
     */
    int    uid;

    /**
     *  The user groups ID set
     */
    set<int> gids;

    /**
     *  Username to authenticate the user
     */
    string username;

    /**
     *  User password to authenticate the user
     */
    string password;

    /**
     *  Authentication token as sent in the XML-RPC call (user:session)
     */
    string session;

    /**
     *  Authentication driver to be used with this request
     */
    string driver;

    /**
     *  A list of authorization requests
     */
    vector<string> auths;

    /**
     *  Plain authorization for the request
     */
    bool self_authorize;

    /**
     *  Adds a new authorization item to this request, with a template for
     *  a new object
     *
     *        OBJECT:<OBJECT_ID|OBJECT_TMPL_XML64>:ACTION:OWNER:AUTH
     *
     * @param op the operation to be authorized
     * @param ob_perms object's permission attributes
     * @param ob_template new object's template. If it is empty,
     * it will be ignored
     */
    void add_auth(Operation             op,
                  const PoolObjectAuth& ob_perms,
                  string                ob_template);
};

#endif
