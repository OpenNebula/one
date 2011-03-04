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

/* ************************************************************************** */
/* User Pool                                            	 	      */
/* ************************************************************************** */

#include "UserPool.h"
#include "NebulaLog.h"
#include "Nebula.h"
#include "AuthManager.h"

#include <fstream>
#include <sys/types.h>
#include <pwd.h>
#include <stdlib.h>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPool::init_cb(void *nil, int num, char **values, char **names)
{
    if ( num == 0 || values == 0 || values[0] == 0 )
    {
        return -1;
    }

    known_users.insert(make_pair(values[1],atoi(values[0])));

    return 0;
}

/* -------------------------------------------------------------------------- */

UserPool::UserPool(SqlDB * db):PoolSQL(db,User::table)
{
    ostringstream   sql;

    set_callback(static_cast<Callbackable::Callback>(&UserPool::init_cb));

    sql  << "SELECT oid,user_name FROM " <<  User::table;

    db->exec(sql, this);

    unset_callback();

    if ((int) known_users.size() == 0)
    {
        // User oneadmin needs to be added in the bootstrap
        int           one_uid = -1;
        ostringstream oss;
        string        one_token;
        string        one_name;
        string        one_pass;
        string        one_auth_file;

        const char *  one_auth;
        ifstream      file;

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
                    string sha1_pass = User::sha1_digest(one_pass);

                    allocate(&one_uid, one_name, sha1_pass, true, error_str);
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
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPool::allocate (
    int *   oid,
    string  username,
    string  password,
    bool    enabled,
    string& error_str)
{
    User *        user;

    // Build a new User object

    user = new User(-1,
        username,
        password,
        enabled);

    // Insert the Object in the pool

    *oid = PoolSQL::allocate(user, error_str);

    if (*oid != -1)
    {
        // Add the user to the map of known_users
        known_users.insert(make_pair(username,*oid));
    }

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPool::authenticate(string& session)
{
    map<string, int>::iterator index;

    User * user = 0;
    string username;
    string secret, u_pass;
    int    uid;

    int user_id = -1;
    int rc;

    Nebula&     nd      = Nebula::instance();
    AuthManager * authm = nd.get_authm();

    rc = User::split_secret(session,username,secret);

    if ( rc != 0 )
    {
        return -1;
    }

    index = known_users.find(username);

    if ( index != known_users.end() ) //User known to OpenNebula
    {
        user = get((int)index->second,true);

        if ( user == 0 )
        {
            return -1;
        }

        u_pass = user->password;
        uid    = user->get_uid();

        user->unlock();
    }
    else //External User
    {
        u_pass = "-";
        uid    = -1;
    }

    AuthRequest ar(uid);

    ar.add_authenticate(username,u_pass,secret);

    if ( uid == 0 ) //oneadmin
    {
        if (ar.plain_authenticate())
        {
            user_id = 0;
        }
    }
    else if (authm == 0) //plain auth
    {
        if ( user != 0 && ar.plain_authenticate()) //no plain for external users
        {
            user_id = uid;
        }
    }
    else //use the driver
    {
        authm->trigger(AuthManager::AUTHENTICATE,&ar);
        ar.wait();

        if (ar.result==true)
        {
            if ( user != 0 ) //knwon user_id
            {
                user_id = uid;
            }
            else //External user, username & pass in driver message
            {
                string mad_name;
                string mad_pass;
                string error_str;

                istringstream is(ar.message);

                if ( is.good() )
                {
                    is >> mad_name >> ws >> mad_pass;
                }

                if ( !is.fail() )
                {
                    allocate(&user_id,mad_name,mad_pass,true,error_str);
                }

                if ( user_id == -1 )
                {
                    ostringstream oss;

                    oss << "Can't create user: " << error_str <<
                           ". Driver response: " << ar.message;

                    ar.message = oss.str();
                    user_id    = -1;
                }
            }
        }

        if (user_id == -1)
        {
            ostringstream oss;
            oss << "Auth Error: " << ar.message;

            NebulaLog::log("AuM",Log::ERROR,oss);
        }
    }

    return user_id;
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
        if (ar.plain_authorize())
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserPool::dump_cb(void * _oss, int num, char **values, char **names)
{
    ostringstream * oss;

    oss = static_cast<ostringstream *>(_oss);

    return User::dump(*oss, num, values, names);
}

/* -------------------------------------------------------------------------- */

int UserPool::dump(ostringstream& oss, const string& where)
{
    int             rc;
    ostringstream   cmd;

    oss << "<USER_POOL>";

    set_callback(static_cast<Callbackable::Callback>(&UserPool::dump_cb),
                 static_cast<void *>(&oss));

    cmd << "SELECT body FROM " << User::table;

    if ( !where.empty() )
    {
        cmd << " WHERE " << where;
    }

    rc = db->exec(cmd, this);

    unset_callback();

    oss << "</USER_POOL>";

    return rc;
}
