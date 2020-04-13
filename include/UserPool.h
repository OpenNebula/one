/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#ifndef USER_POOL_H_
#define USER_POOL_H_

#include "PoolSQL.h"
#include "User.h"
#include "GroupPool.h"
#include "CachePool.h"
#include "LoginToken.h"

#include <time.h>
#include <sstream>

#include <iostream>

#include <vector>

using namespace std;

class AuthRequest; //Forward definition of AuthRequest

/**
 *  The User Pool class. ...
 */
class UserPool : public PoolSQL
{
public:

    UserPool(SqlDB * db, time_t  __session_expiration_time, bool is_slave,
        vector<const SingleAttribute *>& restricted_attrs);

    ~UserPool() = default;

    /**
     *  Function to allocate a new User object
     *    @param oid the id assigned to the User
     *    @return the oid assigned to the object or -1 in case of failure
     */
    int allocate(
        int * oid,
        const string& uname,
        int   gid,
        const string& password,
        const string& auth,
        bool  enabled,
        const set<int>& gids,
        const set<int>& agids,
        string& error_str);

    /**
     *  Drops the object's data in the data base. The object mutex SHOULD be
     *  locked.
     *    @param objsql a pointer to the object
     *    @param error_msg Error reason, if any
     *    @return 0 on success, -1 DB error
     */
    int drop(PoolObjectSQL * objsql, string& error_msg);

    /**
     *  Function to get a User from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid User unique id
     *    @param lock locks the User mutex
     *    @return a pointer to the User, 0 if the User could not be loaded
     */
    User * get(int oid)
    {
        User * u = static_cast<User *>(PoolSQL::get(oid));

        if ( u != 0 )
        {
            u->session = get_session_token(oid);
        }

        return u;
    };

    /**
     *  Function to get a read only User from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid User unique id
     *    @return a pointer to the User, 0 if the User could not be loaded
     */
    User * get_ro(int oid)
    {
        User * u = static_cast<User *>(PoolSQL::get_ro(oid));

        if ( u != 0 )
        {
            u->session = get_session_token(oid);
        }

        return u;
    };

    /**
     *  Function to get a User from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param username
     *    @param lock locks the User mutex
     *    @return a pointer to the User, 0 if the User could not be loaded
     */
    User * get(string name)
    {
        // The owner is set to -1, because it is not used in the key() method
        User * u = static_cast<User *>(PoolSQL::get(name,-1));

        if ( u != 0 )
        {
            u->session = get_session_token(u->oid);
        }

        return u;
    };

    /**
     *  Function to get a read only User from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param username
     *    @return a pointer to the User, 0 if the User could not be loaded
     */
    User * get_ro(string name)
    {
        // The owner is set to -1, because it is not used in the key() method
        User * u = static_cast<User *>(PoolSQL::get_ro(name,-1));

        if ( u != 0 )
        {
            u->session = get_session_token(u->oid);
        }

        return u;
    };

    /**
     *  Function to get the token password of an user from the pool
     *    @param uid creator of the object
     *    @param uid owner of the object, only used if the creator not exists
     *
     *    @return the user's token password
     */
    string get_token_password(int oid, int bck_oid);

    /**
     * Update a particular User. This method does not update the user's quotas
     *    @param user pointer to User
     *    @return 0 on success
     */
    int update(PoolObjectSQL * objsql);

    /**
     * Update a particular User's Quotas
     *    @param user pointer to User
     *    @return 0 on success
     */
    int update_quotas(User * user);

    /**
     *  Bootstraps the database table(s) associated to the User pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        return User::bootstrap(_db);
    };

    /**
     * Returns whether there is a user with given username/password or not
     *   @param session, colon separated username and password string
     *   @param uid of the user if authN succeeded -1 otherwise
     *   @param gid of the user if authN succeeded -1 otherwise
     *   @param uname of the user if authN succeeded "" otherwise
     *   @param gname of the group if authN succeeded "" otherwise
     *   @param group_ids the user groups if authN succeeded, is empty otherwise
     *   @param umask of the user, 0 otherwise
     *
     *   @return false if authn failed, true otherwise
     */
    bool authenticate(const string& session,
                      string&       password,
                      int&          uid,
                      int&          gid,
                      string&       uname,
                      string&       gname,
                      set<int>&     group_ids,
                      int&          umask);
    /**
     * Returns whether the operations described in a authorization request are
     * authorized ot not.
     *   @param ar, an Authorization Request
     *   @return -1 if authz failed, 0 otherwise
     */
    static int authorize(AuthRequest& ar);

    /**
     *  Dumps the User pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param sid first element used for pagination
     *  @param eid last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(string& oss, const string& where, int sid, int eid, bool desc);

    /**
     *  Name for the OpenNebula core authentication process
     */
    static const char * CORE_AUTH;

    /**
     *  Name for the OpenNebula server (delegated) authentication process
     */
    static const char * SERVER_AUTH;

    /**
     *  Name for the OpenNebula public authentication process. It only
     *  allows delegated
     */
    static const char * PUBLIC_AUTH;

    /**
     *  Name for the default Sunstone server user
     */
    static const char * SERVER_NAME;

    /**
     *  Name of the oneadmin user
     */
    static string oneadmin_name;

    /**
     *  Identifier for the oneadmin user
     */
    static const int ONEADMIN_ID;

private:
    //--------------------------------------------------------------------------
    // Configuration Attributes for Users
    // -------------------------------------------------------------------------

    /**
     * Authentication session expiration time
     **/
    static time_t _session_expiration_time;

    CachePool<SessionToken> cache;

    SessionToken * get_session_token(int oid)
    {
        return cache.get_resource(oid);
    }

    void delete_session_token(int oid)
    {
        cache.delete_resource(oid);
    }

    /**
     *  Function to authenticate internal (known) users
     */
    bool authenticate_internal(User *        user,
                               const string& token,
                               string&       password,
                               int&          user_id,
                               int&          group_id,
                               string&       uname,
                               string&       gname,
                               set<int>&     group_ids,
                               int&          umask);

    /**
     *  Function to authenticate internal users using a server driver
     */
    bool authenticate_server(User *        user,
                             const string& token,
                             string&       password,
                             int&          user_id,
                             int&          group_id,
                             string&       uname,
                             string&       gname,
                             set<int>&     group_ids,
                             int&          umask);


    /**
     *  Function to authenticate external (not known) users
     */
    bool authenticate_external(const string&    username,
                               const string&    token,
                               string&          password,
                               int&             user_id,
                               int&             group_id,
                               string&          uname,
                               string&          gname,
                               set<int>&        group_ids,
                               int&             umask);
    /**
     *  Factory method to produce User objects
     *    @return a pointer to the new User
     */
    PoolObjectSQL * create()
    {
        return new User(-1,-1,"","","",UserPool::CORE_AUTH,true);
    };
};

#endif /*USER_POOL_H_*/

