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

/* ************************************************************************** */
/* User Pool                                            	 	      */
/* ************************************************************************** */

#include "UserPool.h"
#include "NebulaLog.h"
#include "Nebula.h"
#include "AuthManager.h"
#include "SSLTools.h"

#include <fstream>
#include <sys/types.h>
#include <pwd.h>
#include <stdlib.h>

const char * UserPool::CORE_AUTH = "core";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

UserPool::UserPool(SqlDB * db):PoolSQL(db,User::table)
{
    int           one_uid = -1;
    ostringstream oss;
    string        one_token;
    string        one_name;
    string        one_pass;
    string        one_auth_file;

    const char *  one_auth;
    ifstream      file;

    if (get(0,false) != 0)
    {
        return;
    }

    // User oneadmin needs to be added in the bootstrap
    one_auth = getenv("ONE_AUTH");

    if (!one_auth)
    {
        struct passwd * pw_ent;

        pw_ent = getpwuid(getuid());

        if ((pw_ent != NULL) && (pw_ent->pw_dir != NULL))
        {
            one_auth_file = pw_ent->pw_dir;
            one_auth_file += "/.one/one_auth";

            one_auth = one_auth_file.c_str();
        }
        else
        {
            oss << "Could not get one_auth file location";
        }
    }

    file.open(one_auth);

    if (file.good())
    {
        getline(file,one_token);

        if (file.fail())
        {
            oss << "Error reading file: " << one_auth;
        }
        else
        {
            if (User::split_secret(one_token,one_name,one_pass) == 0)
            {
                string error_str;

                allocate(&one_uid,
                         GroupPool::ONEADMIN_ID,
                         one_name,
                         GroupPool::ONEADMIN_NAME,
                         one_pass,
                         UserPool::CORE_AUTH,
                         true, 
                         error_str);
            }
            else
            {
                oss << "Wrong format must be <username>:<password>";
            }
        }
    }
    else
    {
        oss << "Cloud not open file: " << one_auth;
    }

    file.close();

    if (one_uid != 0)
    {
        NebulaLog::log("ONE",Log::ERROR,oss);
        throw;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPool::allocate (
    int *   oid,
    int     gid,
    const   string&  uname,
    const   string&  gname,
    const   string&  password,
    const   string&  auth,
    bool    enabled,
    string& error_str)
{
    Nebula&     nd    = Nebula::instance();

    User *      user;
    GroupPool * gpool;
    Group *     group;

    string auth_driver = auth;
    string upass       = password;

    ostringstream   oss;

    // Check username and password
    if ( !User::is_valid(password, error_str) )
    {
        goto error_pass;
    }

    if ( !User::is_valid(uname, error_str) )
    {
        goto error_name;
    }

    // Check for duplicates
    user = get(uname,false);

    if ( user !=0 )
    {
        goto error_duplicated;
    }

    // Set auth driver and hash password for CORE_AUTH
    if (auth_driver.empty())
    {
        auth_driver = UserPool::CORE_AUTH;
    }

    if (auth_driver == UserPool::CORE_AUTH)
    {
        upass = SSLTools::sha1_digest(password);
    }

    // Build a new User object
    user = new User(-1, gid, uname, gname, upass, auth_driver, enabled);

    // Insert the Object in the pool
    *oid = PoolSQL::allocate(user, error_str);

    if ( *oid < 0 )
    { 
        return *oid;
    }

    // Adds User to group
    gpool = nd.get_gpool();
    group = gpool->get(gid, true);

    if( group == 0 )
    {
        return -1;
    }

    group->add_user(*oid);

    gpool->update(group);

    group->unlock();

    return *oid;

error_pass:
    oss << "Invalid password, " << error_str << ".";
    goto error_common;

error_name:
    oss << "Invalid NAME, " << error_str << ".";
    goto error_common;

error_duplicated:
    oss << "NAME is already taken by USER " << user->get_oid() << ".";
    goto error_common;

error_common:
    *oid = -1;
    error_str = oss.str();

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool UserPool::authenticate(const string& session, 
                            int&          user_id, 
                            int&          group_id,
                            string&       uname,
                            string&       gname)
{
    map<string, int>::iterator index;

    User * user = 0;
    string username;
    string secret, u_secret, u_pass;
    string auth_driver;

    string tuname;
    string tgname;

    int  uid, gid;
    int  rc;
    bool result;

    Nebula&     nd      = Nebula::instance();
    AuthManager * authm = nd.get_authm();

    user_id  = -1;
    group_id = -1;
    uname    = "";
    gname    = "";
    result   = false;

    rc = User::split_secret(session,username,u_secret);

    if ( rc != 0 )
    {
        return -1;
    }


    user = get(username,true);

    if (user != 0) //User known to OpenNebula
    {
        u_pass = user->password;
        uid    = user->oid;
        gid    = user->gid;

        tuname  = user->name;
        tgname  = user->gname;

        auth_driver = user->auth_driver;

        user->unlock();
    }
    else //External User
    {
        u_pass      = "-";
        auth_driver = "";

        uid    = -1;
        gid    = -1;
    }

    AuthRequest ar(uid, gid);

    if ( auth_driver == UserPool::CORE_AUTH )
    {
        if (user != 0) //no core auth for external users
        {
            ar.add_authenticate(username,u_pass,u_secret);

            if (ar.core_authenticate()) 
            {
                user_id  = uid;
                group_id = gid;

                uname = tuname;
                gname = tgname;

                result   = true;
            }
        }
    }
    else if ( authm != 0 ) //use auth driver if it was loaded
    {
        //Compose secret for the user driver
        if (!auth_driver.empty())
        {
            secret =  auth_driver;
            secret += ":";
        }

        secret += u_secret;

        //Initialize authentication request and call the driver
        ar.add_authenticate(username,u_pass,secret);

        authm->trigger(AuthManager::AUTHENTICATE,&ar);
        ar.wait();

        if (ar.result==true) //User was authenticated
        {
            if ( user != 0 ) //knwon user_id
            {
                user_id  = uid;
                group_id = gid;

                uname = tuname;
                gname = tgname;

                result   = true;
            }
            else //External user, username & pass in driver message
            {
                string driver_name;
                string mad_name;
                string mad_pass;

                string error_str;

                istringstream is(ar.message);

                if ( is.good() )
                {
                    is >> driver_name >> ws;
                }

                if ( !is.fail() )
                {
                    is >> mad_name >> ws;
                }

                if ( !is.fail() )
                {
                    getline(is, mad_pass);
                }

                if ( !is.fail() )
                {
                    allocate(&user_id,
                             GroupPool::USERS_ID,
                             mad_name,
                             GroupPool::USERS_NAME,
                             mad_pass,
                             driver_name,
                             true,
                             error_str);
                }

                if ( user_id == -1 )
                {
                    ostringstream oss;

                    oss << "Can't create user: " << error_str <<
                           ". Driver response: " << ar.message;

                    NebulaLog::log("AuM",Log::ERROR,oss);
                }
                else
                {
                    group_id = GroupPool::USERS_ID;

                    uname = mad_name;
                    gname = GroupPool::USERS_NAME;

                    result   = true;
                }
            }
        }
        else
        {
            ostringstream oss;
            oss << "Auth Error: " << ar.message;

            NebulaLog::log("AuM",Log::ERROR,oss);
        }
    }
    else
    {
        NebulaLog::log("AuM",Log::ERROR,
            "Auth Error: Authentication driver not enabled. "
            "Check AUTH_MAD in oned.conf");
    }

    return result;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPool::authorize(AuthRequest& ar)
{
    Nebula&       nd    = Nebula::instance();
    AuthManager * authm = nd.get_authm();
    int           rc    = -1;

    if (authm == 0)
    {
        if (ar.core_authorize())
        {
            rc = 0;
        }
    }
    else
    {
        authm->trigger(AuthManager::AUTHORIZE,&ar);
        ar.wait();

        if (ar.result==true)
        {
            rc = 0;
        }
        else
        {
            ostringstream oss;
            oss << "Auth Error: " << ar.message;

            NebulaLog::log("AuM",Log::ERROR,oss);
        }
    }

    return rc;
}

